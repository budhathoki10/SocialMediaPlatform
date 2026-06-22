const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2";
const DEFAULT_OLLAMA_NUM_GPU = 0;

function parseNumGpu(value) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_OLLAMA_NUM_GPU;
}

function getOllamaConfig(overrides = {}) {
  const baseUrl = (overrides.baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");

  return {
    baseUrl,
    model: overrides.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL,
    numGpu: parseNumGpu(overrides.numGpu ?? process.env.OLLAMA_NUM_GPU ?? DEFAULT_OLLAMA_NUM_GPU),
  };
}

function getModelOptions(config, temperature) {
  const modelOptions = { num_gpu: config.numGpu };

  if (typeof temperature === "number") {
    modelOptions.temperature = temperature;
  }

  return modelOptions;
}

async function ollamaRequest(path, body, options = {}) {
  const { baseUrl } = getOllamaConfig(options);
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Ollama request failed with status ${response.status}.`);
  }

  return payload;
}

/**
 * Generate plain text with a local Ollama model. CPU is used by default to
 * avoid incompatible CUDA drivers; set OLLAMA_NUM_GPU to override this.
 */
export async function generateOllamaText(prompt, options = {}) {
  if (!prompt?.trim()) {
    throw new Error("An Ollama prompt is required.");
  }

  const config = getOllamaConfig(options);
  const payload = await ollamaRequest(
    "/api/generate",
    {
      model: config.model,
      prompt,
      system: options.system,
      stream: false,
      options: getModelOptions(config, options.temperature),
    },
    options,
  );

  return payload?.response?.trim() || "";
}

/**
 * Chat with a local Ollama model using OpenAI-style message objects.
 */
export async function chatWithOllama(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one Ollama chat message is required.");
  }

  const config = getOllamaConfig(options);
  const payload = await ollamaRequest(
    "/api/chat",
    {
      model: config.model,
      messages,
      stream: false,
      options: getModelOptions(config, options.temperature),
    },
    options,
  );

  return payload?.message?.content?.trim() || "";
}

/**
 * Returns whether the configured Ollama server is reachable.
 */
export async function isOllamaAvailable(options = {}) {
  const { baseUrl } = getOllamaConfig(options);

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: options.signal,
    });

    return response.ok;
  } catch {
    return false;
  }
}

export { getOllamaConfig };