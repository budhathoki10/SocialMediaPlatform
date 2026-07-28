import assert from "node:assert/strict";
import test from "node:test";

import {
  LINKEDIN_MAX_COMMENTARY_LENGTH,
  prepareLinkedInCommentary,
} from "./linkedin-post.js";

test("publishes the post body without the internal PR heading", () => {
  assert.equal(prepareLinkedInCommentary("  Full LinkedIn body  "), "Full LinkedIn body");
});

test("stops publication when the body is absent", () => {
  assert.throws(
    () => prepareLinkedInCommentary("   "),
    /post body is empty; publication was stopped/i,
  );
});

test("stops publication when the body exceeds LinkedIn's limit", () => {
  assert.throws(
    () => prepareLinkedInCommentary("a".repeat(LINKEDIN_MAX_COMMENTARY_LENGTH + 1)),
    /3000 characters or fewer/i,
  );
});
