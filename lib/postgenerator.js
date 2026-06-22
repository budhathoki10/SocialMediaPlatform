import { generateOllamaText, isOllamaAvailable } from "./aimodel.js";

export async function generatePost({ repo, type, prTitle, prBody, commits = [] }) {
  const available = await isOllamaAvailable();

  if (!available) {
    throw new Error("Ollama is not available. Start the Ollama server and try again.");
  }

  const context =
    type === "pull_request"
      ? `A pull request was merged in the repository "${repo}".\nTitle: ${prTitle || "Untitled pull request"}\nDescription: ${prBody || "No description provided."}`
      : `New commits were pushed to the repository "${repo}".\nCommit messages: ${commits.join("; ") || "No commit messages provided."}`;

  const prompt = `You are a developer writing a short, natural LinkedIn post about recent work.

${context}

Write a LinkedIn post in 3-4 sentences.
Rules:
- Sound like a real engineer, not corporate marketing.
- Use at most two relevant hashtags.
- Avoid emojis unless they feel natural.
- Do not start with "Excited to announce".
- Keep it concise and authentic.`;

  const draftPost = await generateOllamaText(prompt, { temperature: 0.7 });

  if (!draftPost) {
    throw new Error("Failed to generate a LinkedIn post. Ollama returned an empty response.");
  }

  return draftPost;
}