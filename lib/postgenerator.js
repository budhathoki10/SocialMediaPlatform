import { generateOllamaText, isOllamaAvailable } from "./ollama.js";

export async function generatePost(topic) {

const available = await isOllamaAvailable();
  if (!available) {
    throw new Error("Ollama is not available. Please ensure the Ollama server is running.");
  }

  const context = type === "pull_request"
    ? `A pull request was merged in the repo "${repo}".\nTitle: ${prTitle}\nDescription: ${prBody || "No description provided."}`
    : `New commits were pushed to the repo "${repo}".\nCommit messages: ${commits?.join("; ") || "none"}`;

const prompt = `You are a developer writing a short, natural LinkedIn post about recent work.

${context}

Write a LinkedIn post (3-4 sentences) announcing this update.
Rules:
- Sound like a real engineer, not corporate marketing
- No hashtag spam (max 2 relevant hashtags if any)
- No emojis unless it feels natural
- Don't start with "Excited to announce" — vary the opening
- Keep it concise and authentic`;


const draftPost = await generateOllamaText(prompt, { model: "llama2", temperature: 0.7 });

if(!draftPost){
throw new Error("Failed to generate a LinkedIn post. The AI model returned an empty response.");
}
console.log("drafe post is",draftPost)
return draftPost;

}