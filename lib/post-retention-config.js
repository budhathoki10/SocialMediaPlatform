export const POST_RETENTION_DAYS = 10;
export const POST_RETENTION_MS = POST_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function getPostExpirationDate(createdAt = new Date()) {
  return new Date(new Date(createdAt).getTime() + POST_RETENTION_MS);
}
