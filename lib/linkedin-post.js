export const LINKEDIN_MAX_COMMENTARY_LENGTH = 3000;

export function prepareLinkedInCommentary(content) {
  const commentary = typeof content === "string" ? content.trim() : "";

  if (!commentary) {
    throw new Error("LinkedIn post body is empty; publication was stopped.");
  }

  if (commentary.length > LINKEDIN_MAX_COMMENTARY_LENGTH) {
    throw new Error(
      `LinkedIn post body must be ${LINKEDIN_MAX_COMMENTARY_LENGTH} characters or fewer.`,
    );
  }
//return commentry
  return commentary;
}
