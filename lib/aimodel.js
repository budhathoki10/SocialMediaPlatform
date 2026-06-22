const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2";

function getOllamaConfig(overrides = {}) {
  const baseUrl = (overrides.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");

  return {
    baseUrl,
    model: overrides.model || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
  };
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

export async function generateOllamaText(prompt, options = {}) {
  if (!prompt?.trim()) {
    throw new Error("An Ollama prompt is required.");
  }

  const { model } = getOllamaConfig(options);
  const payload = await ollamaRequest(
    "/api/generate",
    {
      model,
      prompt,
      system: options.system,
      stream: false,
      options: typeof options.temperature === "number" ? { temperature: options.temperature } : undefined,
    },
    options,
  );

  return payload?.response?.trim() || "";
}

export async function chatWithOllama(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one Ollama chat message is required.");
  }

  const { model } = getOllamaConfig(options);
  const payload = await ollamaRequest(
    "/api/chat",
    {
      model,
      messages,
      stream: false,
      options: typeof options.temperature === "number" ? { temperature: options.temperature } : undefined,
    },
    options,
  );

  return payload?.message?.content?.trim() || "";
}

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