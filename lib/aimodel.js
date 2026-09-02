import OpenAI from "openai";

const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
// nemotron-3-ultra-550b regularly took 2+ minutes for a single short draft —
// longer than every timeout in the request path (Meta's webhook wait, the
// serverless function limit, and the cron drain budget), so no draft ever got
// written. The lightning model answers the same prompt in ~15s.
const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const DEFAULT_NVIDIA_TEMPERATURE = 0.7;
const DEFAULT_NVIDIA_TOP_P = 0.95;
// Enough headroom for the model's own reasoning preamble plus the JSON object
// it must return; 4096 only bought slower responses, not better drafts.
const DEFAULT_NVIDIA_MAX_TOKENS = 1500;
// Hard ceiling on a single completion. Without this an unresponsive upstream
// hangs the caller until the platform kills the whole function.
const DEFAULT_NVIDIA_TIMEOUT_MS = 45_000;

function parseNumber(value, fallback) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function parseInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getNvidiaConfig(overrides = {}) {
  return {
    apiKey: overrides.apiKey ?? process.env.NVIDIA_API_KEY,
    baseURL: (overrides.baseURL ?? process.env.NVIDIA_BASE_URL ?? DEFAULT_NVIDIA_BASE_URL).replace(/\/$/, ""),
    model: overrides.model ?? process.env.NVIDIA_MODEL ?? DEFAULT_NVIDIA_MODEL,
    temperature: parseNumber(overrides.temperature ?? process.env.NVIDIA_TEMPERATURE, DEFAULT_NVIDIA_TEMPERATURE),
    topP: parseNumber(overrides.topP ?? process.env.NVIDIA_TOP_P, DEFAULT_NVIDIA_TOP_P),
    maxTokens: parseInteger(overrides.maxTokens ?? process.env.NVIDIA_MAX_TOKENS, DEFAULT_NVIDIA_MAX_TOKENS),
    timeoutMs: parseInteger(overrides.timeoutMs ?? process.env.NVIDIA_TIMEOUT_MS, DEFAULT_NVIDIA_TIMEOUT_MS),
  };
}

/** Caller-supplied signals still win; otherwise every call gets the timeout
 * above so a slow upstream can't outlive the function invocation. */
function getRequestOptions(config, options) {
  if (options.signal) {
    return { signal: options.signal };
  }

  return config.timeoutMs > 0 ? { signal: AbortSignal.timeout(config.timeoutMs) } : undefined;
}

/**
 * Nemotron models reason before answering unless told not to. For drafting a
 * caption or a DM reply that deliberation buys nothing and costs almost all of
 * the latency — the same prompt runs ~12s with thinking on and under a second
 * with it off, and the reasoning otherwise leaks into the text we publish.
 * Pass `thinking: true` for a call that genuinely needs it.
 */
function getThinkingParams(options) {
  return options.thinking ? {} : { chat_template_kwargs: { thinking: false } };
}

function isUnsupportedParamError(error) {
  return error?.status === 400 && /chat_template_kwargs|Unsupported parameter/i.test(error?.message || "");
}

/** NVIDIA's function runtime intermittently answers a perfectly valid request
 * with `nvcf-status: errored` and a bodyless 404 or a 5xx. Those are transient
 * and clear on an immediate retry; a real "no such model" 404 just fails
 * twice, a second apart. */
function isTransientUpstreamError(error) {
  return error?.status === 404 || error?.status === 429 || error?.status >= 500;
}

/** Sends the completion, retrying once without the thinking switch if the
 * upstream model doesn't recognise it, so a model swap can't hard-fail here,
 * and once more when the upstream blips. */
async function createCompletion(client, body, requestOptions, { retryTransient = true } = {}) {
  try {
    return await client.chat.completions.create(body, requestOptions);
  } catch (error) {
    if (isUnsupportedParamError(error) && body.chat_template_kwargs) {
      console.warn("Model rejected chat_template_kwargs; retrying without it.");
      const fallbackBody = { ...body };
      delete fallbackBody.chat_template_kwargs;
      return createCompletion(client, fallbackBody, requestOptions, { retryTransient });
    }

    if (retryTransient && isTransientUpstreamError(error)) {
      console.warn(`NVIDIA request failed with ${error.status}; retrying once.`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return createCompletion(client, body, requestOptions, { retryTransient: false });
    }

    throw error;
  }
}

function getNvidiaClient(config) {
  if (!config.apiKey) {
    throw new Error("NVIDIA_API_KEY is required to generate AI content.");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

function readCompletionText(completion) {
  const content = completion?.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("")
      .trim();
  }
  // it parsed and make like 
  /*
  const parsed = JSON.parse(content);

console.log("Draft:", parsed.draft);
console.log("Confidence:", parsed.confidence);
console.log("Reason:", parsed.reason);
  */

  return typeof content === "string" ? content.trim() : "";
}

export async function generateNvidiaText(prompt, options = {}) {
  if (!prompt?.trim()) {
    throw new Error("A prompt is required.");
  }

  const config = getNvidiaConfig(options);
  const client = getNvidiaClient(config);
  const messages = [
    ...(options.system ? [{ role: "system", content: options.system }] : []),
    { role: "user", content: prompt },
  ];

  const completion = await createCompletion(
    client,
    {
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: config.maxTokens,
      stream: false,
      ...getThinkingParams(options),
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    },
    getRequestOptions(config, options),
  );
  // console.log("Completion is ", completion);
/*

it creates like completion = {
  choices: [
    {
      message: {
        content: `{
          "action": "auto_reply",
          "draft": "Not much, just keeping busy! What about you?",
          "confidence": 92,
          "reason": "Clear and harmless casual small talk."
        }`
      }
    }
  ]
}; 

*/

  return readCompletionText(completion);
}

export async function chatWithNvidia(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one chat message is required.");
  }

  const config = getNvidiaConfig(options);
  const client = getNvidiaClient(config);
  const completion = await createCompletion(
    client,
    {
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: config.maxTokens,
      stream: false,
      ...getThinkingParams(options),
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    },
    getRequestOptions(config, options),
  );

  return readCompletionText(completion);
}

export async function isNvidiaAvailable(options = {}) {
  const config = getNvidiaConfig(options);
  return Boolean(config.apiKey);
}

export { getNvidiaConfig };
