import { generateNvidiaText, isNvidiaAvailable } from "./aimodel.js";

export async function generatePost({ repo, type, prTitle, prBody, commits = [] }) {
  const available = await isNvidiaAvailable();

  if (!available) {
    throw new Error("NVIDIA_API_KEY is not configured. Add it to your environment and try again.");
  }

  const context =
    type === "pull_request"
      ? `A pull request was merged in the repository "${repo}".\nTitle: ${prTitle || "Untitled pull request"}\nDescription: ${prBody || "No description provided."}`
      : `New commits were pushed to the repository "${repo}".\nCommit messages: ${commits.join("; ") || "No commit messages provided."}`;

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
- at last also mention the link to the github repo in the post.
Return only the post caption. Do not wrap the response in quotation marks.

- note: Explain the Feature 
for example: if the commit is **Added GitHub webhook event handling
Generated LinkedIn posts from PRs and commits
Enabled automated post scheduling and publishing
Improved content generation workflow** is like then explain it what i have done. like completed features with the help of this that. it works like this that. 
 and if the commit is simple then also explain it like that. like if the commit is **Added GitHub webhook event handling** then explain it like this: I have added a webhook event handling feature to the application, which allows it to receive and process events from GitHub repositories. This feature enables the application to automatically respond to changes in the repository, such as new commits or pull requests, by triggering specific actions or workflows. It enhances the application's integration with GitHub and improves its ability to stay up-to-date with repository activities.

at the end explain the feature 
output must be ckear and related to the commit or PR.


Output only the LinkedIn post text.

`;
  const draftPost = await generateNvidiaText(prompt, { temperature: 0.7 });

  if (!draftPost) {
    throw new Error("Failed to generate a LinkedIn post. NVIDIA returned an empty response.");
  }



const cleanPost = draftPost.trim().replace(/^["']+|["']+$/g, "");
return cleanPost;

}
