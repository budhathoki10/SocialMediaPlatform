import { generateOllamaText, isOllamaAvailable } from "./aimodel.js";

export async function generatePost({ repo, type, prTitle, prBody, commits = [] }) {
  const available = await isOllamaAvailable();

  if (!available) {
    throw new Error("Ollama is not available. Start the Ollama server and try again.");
  }

  const context =
    type === "pull_request"
      ? `A pull request was merged in the repository "${repo}".\nPR title: ${prTitle || "Untitled pull request"}\nPR body: ${prBody || "No description provided."}`
      : `New commits were pushed to the repository "${repo}".\nCommit messages: ${commits.join("; ") || "No commit messages provided."}`;

  const prompt = `You are writing the caption for a social media post about a recent GitHub event. 
  this must be professional and concise, suitable for LinkedIn. Focus on the impact and significance of the event rather than just describing it.
  make sure to write a professional  content for the Linkedin post which is my main priority based on the following GitHub event details.
  The event details are as follows:

${context}

The PR title is displayed separately in the UI. Write only a concise 1-2 sentence caption explaining the outcome and impact. Do not repeat the full PR title, repository name, or opening phrase from the title.
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