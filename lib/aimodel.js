import OpenAI from "openai";

const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const DEFAULT_NVIDIA_TEMPERATURE = 0.7;
const DEFAULT_NVIDIA_TOP_P = 0.95;
const DEFAULT_NVIDIA_MAX_TOKENS = 4096;
const DEFAULT_NVIDIA_REASONING_BUDGET = 4096;

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
    reasoningBudget: parseInteger(
      overrides.reasoningBudget ?? process.env.NVIDIA_REASONING_BUDGET,
      DEFAULT_NVIDIA_REASONING_BUDGET,
    ),
  };
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

  const completion = await client.chat.completions.create(
    {
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: config.maxTokens,
      reasoning_budget: config.reasoningBudget,
      chat_template_kwargs: { enable_thinking: true },
      stream: false,
    },
    options.signal ? { signal: options.signal } : undefined,
  );

  return readCompletionText(completion);
}

export async function chatWithNvidia(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one chat message is required.");
  }

  const config = getNvidiaConfig(options);
  const client = getNvidiaClient(config);
  const completion = await client.chat.completions.create(
    {
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      max_tokens: config.maxTokens,
      reasoning_budget: config.reasoningBudget,
      chat_template_kwargs: { enable_thinking: true },
      stream: false,
    },
    options.signal ? { signal: options.signal } : undefined,
  );

  return readCompletionText(completion);
}

export async function isNvidiaAvailable(options = {}) {
  const config = getNvidiaConfig(options);
  return Boolean(config.apiKey);
}

export { getNvidiaConfig };
