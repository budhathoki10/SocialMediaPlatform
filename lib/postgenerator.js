import { generateOllamaText, isOllamaAvailable } from "./aimodel.js";

export async function generatePost({ repo, type, prTitle, prBody, commits = [] }) {
  const available = await isOllamaAvailable();

  if (!available) {
    throw new Error("Ollama is not available. Start the Ollama server and try again.");
  }

const prompt = `You are an experienced software engineer and technical writer creating a professional LinkedIn post based on a recent GitHub event.

Your goal is to write an engaging, authentic, and professional LinkedIn post that highlights the technical work, business value, challenges solved, and overall impact of the change.

GitHub Event Details:

${context}

Instructions:
- Write a detailed LinkedIn post between 150-300 words.
- Focus on what was accomplished, why it matters, and the value it brings.
- If the event is a pull request, explain the feature, improvement, bug fix, optimization, or architectural change introduced.
- If the event is a commit push, summarize the overall progress and technical contributions represented by the commits.
- Infer likely engineering impact from the provided information when reasonable.
- Mention challenges, learnings, improvements, scalability, performance, maintainability, security, user experience, or developer experience when relevant.
- Sound like a real software engineer sharing work and progress.
- Be professional, authentic, and confident.
- Avoid corporate buzzwords and excessive self-promotion.
- Do not simply restate commit messages or PR descriptions.
- Do not mention repository names unless naturally necessary.
- Do not start with phrases like:
  - "Excited to announce"
  - "Thrilled to share"
  - "Happy to announce"
- Create a natural opening, a technical middle section, and a concluding reflection.
- create atleast 5-7 lines of content...... 
- End with 3-6 relevant hashtags.
- Do not use emojis unless they genuinely fit the context.
Return only the post caption. Do not wrap the response in quotation marks.

Output only the LinkedIn post text.`;
  const draftPost = await generateOllamaText(prompt, { temperature: 0.7 });

  if (!draftPost) {
    throw new Error("Failed to generate a LinkedIn post. Ollama returned an empty response.");
  }



const cleanPost = draftPost.trim().replace(/^["']+|["']+$/g, "");
return cleanPost;

}