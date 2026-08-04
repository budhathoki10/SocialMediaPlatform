// Rule-based gatekeeping + draft composer for Instagram auto-reply. The
// gatekeeping (platform access, contact filters, keyword exclusions,
// business hours, reply limits) is deterministic and never calls the model.
// Only messages that don't match a known safe pattern (not spam, not an
// obvious greeting/FAQ) get sent to the actual AI model below — that keeps
// AI calls limited to the cases that genuinely need real understanding.
import { generateNvidiaText, isNvidiaAvailable } from "./aimodel.js";
import { AutoReplyRule, AutoReplySettings, InstagramDraft } from "./models.js";
import { getKathmanduDate } from "./models.js";

const SPAM_PATTERN = /(free crypto|giveaway|buy followers|instant delivery|promo)/i;
const GREETING_PATTERN = /^\s*(hi+|hey+|hello+|yo|sup|good\s?(morning|afternoon|evening))\b/i;
const SMALLTALK_PATTERN = /(how are you|how'?s it going|what'?s up|how'?s your day|how have you been)/i;
const FAQ_PATTERN = /(price|pricing|cost|how much|link|join|how do i|help|hours|available|availability|book|schedule)/i;

// "Daily" limit, implemented as a rolling 24h window so it doesn't depend on
// getting a calendar-day/timezone boundary exactly right.
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;

const NEEDS_REVIEW_FALLBACK = "I couldn't generate a confident reply for this message — please review and respond manually.";

function firstName(name) {
  return name?.trim().split(/\s+/)[0] || null;
}

function greetingFor(settings, senderName) {
  if (settings.response_style?.greeting_style === "first_name") {
    const name = firstName(senderName);
    if (name) return `Hey ${name}`;
  }
  return "Hi there";
}

function signOffFor(settings) {
  const style = settings.response_style?.sign_off_style;
  if (!style || style === "none") return "";
  return `\n\n— ${settings.response_style.custom_sign_off || "The Team"}`;
}

// Every face emoji (Smileys & Emotion block plus later emotion additions),
// including negative ones (😡😭🤬) — deliberately not filtered to "positive
// only" per the user's call to use the full range, not a curated subset.
const FACE_EMOJI = [
  "😀", "😁", "😂", "😃", "😄", "😅", "😆", "😇", "😈", "😉",
  "😊", "😋", "😌", "😍", "😎", "😏", "😐", "😑", "😒", "😓",
  "😔", "😕", "😖", "😗", "😘", "😙", "😚", "😛", "😜", "😝",
  "😞", "😟", "😠", "😡", "😢", "😣", "😤", "😥", "😦", "😧",
  "😨", "😩", "😪", "😫", "😬", "😭", "😮", "😯", "😰", "😱",
  "😲", "😳", "😴", "😵", "😶", "😷", "😸", "😹", "😺", "😻",
  "😼", "😽", "😾", "😿", "🙀", "🙁", "🙂", "🙃", "🙄", "🙅",
  "🙆", "🙇", "🙈", "🙉", "🙊", "🙋", "🙌", "🙍", "🙎", "🙏",
  "🤐", "🤑", "🤒", "🤓", "🤔", "🤕", "🤖", "🤗", "🤠", "🤡",
  "🤢", "🤣", "🤤", "🤥", "🤦", "🤧", "🤨", "🤩", "🤪", "🤫",
  "🤬", "🤭", "🤮", "🤯",
  "🥰", "🥱", "🥲", "🥳", "🥴", "🥵", "🥶", "🥸", "🥹",
  "🫠", "🫡", "🫢", "🫣", "🫤", "🫥", "🫨", "🫩",
];

// Every hand/gesture emoji from the People & Body block. 🖕 (middle finger)
// is deliberately excluded — unlike the rest of this expansion, that's not
// a "might look odd" call: an obscene gesture landing in a customer reply
// is a real harassment/reputation risk, not a stylistic one.
const GESTURE_EMOJI = [
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
  "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍",
  "👎", "✊", "👊", "🤛", "🤜", "👏", "🫶", "👐", "🤲", "🤝",
  "✍️", "💅", "🤳", "💪", "🫱", "🫲", "🫳", "🫴", "🫵", "🫷",
  "🫸",
];

// Every heart-color emoji.
const HEART_EMOJI = [
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
];

// Nature (weather/plants) — clean, uncontroversial, common in casual chat.
const NATURE_EMOJI = [
  "🌈", "🌟", "🌙", "⭐", "☀️", "⛅", "🌤️", "🌸", "🌺", "🌻",
  "🌼", "🌷", "🍀", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🍁",
  "🍂", "🍃",
];

// Food & Drink. 🍆 and 🍑 are deliberately excluded — same category of
// reasoning as 🖕: those carry well-known sexual double meanings, not just
// an "odd" look, so they stay out regardless of the rest of this expansion.
const FOOD_EMOJI = [
  "🍅", "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🍎", "🍏",
  "🍐", "🍒", "🍓", "🍔", "🍕", "🍖", "🍗", "🍘", "🍙", "🍚",
  "🍛", "🍜", "🍝", "🍞", "🍟", "🍠", "🍡", "🍢", "🍣", "🍤",
  "🍥", "🍦", "🍧", "🍨", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮",
  "🍯", "🍰", "🍱", "🍲", "🍳", "🍴", "🍵", "🍶", "🍷", "🍸",
  "🍹", "🍺", "🍻", "🍼", "🍽️", "🍾", "🍿",
];

// Activities/celebration + sports — the account is a sports page, so this
// section is fully included rather than trimmed.
const ACTIVITY_EMOJI = [
  "🎀", "🎁", "🎂", "🎃", "🎄", "🎅", "🎆", "🎇", "🎈", "🎉",
  "🎊", "🎋", "🎌", "🎍", "🎎", "🎏", "🎐", "🎑", "🎒", "🎓",
  "🎖️", "🎗️", "🎙️", "🎚️", "🎛️", "🎞️", "🎟️", "🎠", "🎡", "🎢",
  "🎣", "🎤", "🎥", "🎦", "🎧", "🎨", "🎩", "🎪", "🎫", "🎬",
  "🎭", "🎮", "🎯", "🎰", "🎱", "🎲", "🎳", "🎴", "🎵", "🎶",
  "🎷", "🎸", "🎹", "🎺", "🎻", "🎼", "🎽", "🎾", "🎿", "🏀",
  "🏁", "🏂", "🏃", "🏄", "🏅", "🏆", "🏇", "🏈", "🏉", "🏊",
  "🏋️", "🏌️", "🏏", "🏐", "🏑", "🏒", "🏓", "🥇", "🥈", "🥉",
  "🥊", "🥋",
];

// Everything cleanly extractable and chat-appropriate from the reference.
// Still excludes: all flags (unintended-political-statement risk — the same
// category of problem as 🖕, not a look/taste call), weapons/gore
// (🔫🔪☠️💀), religious/political symbols (☪️✡️☦️ — same "unintended
// statement" risk as flags), 🍆/🍑 (see above), and generic
// tools/currency/vehicles (don't function as reply emoji at all). Animals
// are excluded because that section of the source PDF's extracted text is
// corrupted (shows "�" instead of real glyphs) — not a judgment call, a
// data-quality one.
const EMOJI_POOL = {
  greeting: [...FACE_EMOJI, ...GESTURE_EMOJI, ...HEART_EMOJI, ...NATURE_EMOJI, ...FOOD_EMOJI, ...ACTIVITY_EMOJI],
  smalltalk: [...FACE_EMOJI, ...GESTURE_EMOJI, ...HEART_EMOJI, ...NATURE_EMOJI, ...FOOD_EMOJI, ...ACTIVITY_EMOJI],
  faq: [...FACE_EMOJI, ...GESTURE_EMOJI, ...HEART_EMOJI, ...NATURE_EMOJI, ...FOOD_EMOJI, ...ACTIVITY_EMOJI],
};

function emojiFor(settings, category, avoidEmoji = []) {
  const usage = settings.response_style?.emoji_usage;
  if (!usage || usage === "none") return "";
  if (category === "faq" && usage !== "moderate") return "";

  const pool = EMOJI_POOL[category];
  if (!pool) return "";

  // Prefer one we haven't just used with this sender; fall back to the full
  // pool only if every option has recently been used.
  const fresh = pool.filter((entry) => !avoidEmoji.includes(entry));
  const choices = fresh.length ? fresh : pool;

  return ` ${choices[Math.floor(Math.random() * choices.length)]}`;
}

// Matches emoji/pictographs so we can see what the model already used with
// a sender and steer it away from repeating the same one every time.
const EMOJI_CHAR_PATTERN = /\p{Extended_Pictographic}/gu;

/** Emoji actually used in the sender's most recent *sent* replies (newest
 * first, deduped). Soft "vary your emoji" instructions alone don't reliably
 * stop a low-temperature model from defaulting to one favorite emoji every
 * time — this lets us explicitly rule out whatever it already used. */
function recentlyUsedEmoji(history, limit = 5) {
  const found = [];

  for (let i = history.length - 1; i >= 0 && found.length < limit; i--) {
    const entry = history[i];
    if (entry.status !== "sent" || !entry.draft_reply) continue;

    for (const emoji of entry.draft_reply.match(EMOJI_CHAR_PATTERN) || []) {
      if (!found.includes(emoji)) found.push(emoji);
      if (found.length >= limit) break;
    }
  }

  return found;
}

function matchesExcludedKeyword(message, keywords) {
  const lower = message.toLowerCase();
  return (keywords || []).find((word) => word && lower.includes(word.toLowerCase())) || null;
}

// Compiles a saved keyword as a case-insensitive regex (so power users can
// save an actual pattern), falling back to a literal/escaped match if it
// isn't valid regex syntax — a plain word like "price" should never 500.
function buildKeywordRegex(pattern) {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
}

/** First saved keyword rule (comment auto-replies configured on the
 * Auto-Reply page) whose pattern matches this message, case-insensitively.
 * Returns null if none match. */
function matchesKeywordRule(message, rules) {
  for (const rule of rules) {
    if (rule.keyword && buildKeywordRegex(rule.keyword).test(message)) {
      return rule;
    }
  }
  return null;
}

async function fetchKeywordRules(userId) {
  return AutoReplyRule.find({ user_id: userId }).sort({ created_at: 1 }).lean();
}

// How many prior exchanges with a sender to feed back as context. Bounded so
// a long-running conversation doesn't balloon the prompt/cost indefinitely.
const HISTORY_LIMIT = 10;

function truncate(text, maxLength = 300) {
  if (!text) return text;
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/** Prior drafts for this sender, oldest first. An empty array means this is
 * their first message — used both to keep the greeting to message one, and
 * to give the AI model real conversation context instead of judging every
 * message in isolation. */
async function fetchConversationHistory(userId, senderId, limit = HISTORY_LIMIT) {
  if (!senderId) return [];

  const priorDrafts = await InstagramDraft.find({ user_id: userId, sender_id: senderId })
    .sort({ created_at: -1 })
    .limit(limit)
    .select("original_message draft_reply status")
    .lean();

  return priorDrafts.reverse();
}

/** Renders prior drafts as a transcript block for the model's user prompt.
 * Replies that were never actually sent (still pending/rejected/blocked) are
 * marked as such rather than presented as if the sender received them. */
function formatHistoryBlock(history) {
  if (!history.length) return "";

  const turns = history.map((entry) => {
    const theirs = `Them: "${truncate(entry.original_message)}"`;
    const ours =
      entry.status === "sent" && entry.draft_reply
        ? `You: "${truncate(entry.draft_reply)}"`
        : `You: (not sent yet — still pending human review)`;
    return `${theirs}\n${ours}`;
  });

  return `PRIOR CONVERSATION WITH THIS SENDER (oldest to newest):\n${turns.join("\n")}\n\n`;
}

/** With AI Semantic Analysis off, only react to explicit FAQ keywords —
 * everything else (including plain greetings/small talk) needs a human.
 * With it on, also recognize greetings and casual small talk. */
function categorize(message, semanticAnalysisEnabled) {
  if (FAQ_PATTERN.test(message)) return "faq";

  if (!semanticAnalysisEnabled) return "unclear";

  if (GREETING_PATTERN.test(message)) return "greeting";
  if (SMALLTALK_PATTERN.test(message)) return "smalltalk";
  return "unclear";
}

function composeReply(settings, senderName, category, firstContact, avoidEmoji = []) {
  // Only open with the configured greeting on the first message of a
  // conversation — repeating "Hey <name>!" on every reply reads as robotic.
  const greeting = firstContact ? greetingFor(settings, senderName) : null;
  const opener = greeting ? `${greeting}! ` : "";
  const emoji = emojiFor(settings, category, avoidEmoji);
  const signOff = signOffFor(settings);

  let body;

  switch (category) {
    case "greeting":
      body = `${opener}Thanks for reaching out${emoji}. What can I help you with today?`;
      break;
    case "smalltalk":
      body = `${opener}Doing well, thanks for asking${emoji} — how about you? Let me know if there's anything I can help with.`;
      break;
    case "faq":
      body = settings.response_style?.link_cta_enabled
        ? `${opener}Thanks for asking — I'll get you the details shortly, and feel free to check our latest post in the meantime${emoji}.`
        : `${opener}Thanks for asking — I'll get you the details shortly${emoji}.`;
      break;
    default:
      body = `${opener}Thanks for your message — I'll take a closer look and get back to you shortly.`;
  }

  return `${body}${signOff}`.trim();
}

function isWithinBusinessHours(startTime, endTime) {
  const now = getKathmanduDate();
  const current = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startHour, startMinute] = (startTime || "09:00").split(":").map(Number);
  const [endHour, endMinute] = (endTime || "18:00").split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end; // overnight window, e.g. 22:00-06:00
}

const TONE_GUIDANCE = {
  professional: "complete sentences, no slang, respectful distance",
  friendly: "warm, conversational, contractions okay",
  creative: "personality-forward, can use light humor if the message invites it",
  concise: "shortest possible complete answer, no filler",
};

const LENGTH_GUIDANCE = {
  short: "1-2 sentences",
  standard: "3-4 sentences",
  detailed: "5+ sentences, only when the question genuinely needs it",
};

const EMOJI_GUIDANCE = {
  none: "never use emoji",
  minimal: "at most one, only if it fits naturally — vary which one you use across replies, don't default to the same emoji every time",
  moderate: "up to 2-3 where they add warmth, never in place of words — vary which emojis you use across replies, don't default to the same one every time",
};

function buildSystemPrompt(settings, { isFirstContact = true, recentEmoji = [] } = {}) {
  const style = settings.response_style || {};
  const today = getKathmanduDate().toISOString().slice(0, 10);

  const greetingInstruction = isFirstContact
    ? style.greeting_style === "first_name"
      ? "this is the sender's first message in this conversation — open with their first name if you were given one"
      : "this is the sender's first message in this conversation — open with a generic greeting, do not use their name"
    : "you have already exchanged messages with this sender — see PRIOR CONVERSATION in the message below — so do NOT open with a greeting or their name again (no \"Hey <name>!\"), that reads as robotic when it repeats every message. Respond the way a person continuing an existing chat would: get straight into the reply.";

  const emojiInstruction = `${EMOJI_GUIDANCE[style.emoji_usage] || EMOJI_GUIDANCE.none}${
    recentEmoji.length
      ? ` — you already used ${recentEmoji.join(" ")} with this sender recently, so do NOT use any of those again this time; pick a different emoji if one still fits naturally, or use none`
      : ""
  }`;

  return `You are AutoPilot's auto-reply assistant. You draft short, natural replies to incoming Instagram messages/comments on behalf of the business or creator account you're connected to. You do not send messages yourself — you only produce a draft reply and a confidence score; a separate system decides whether to send it automatically or route it to a human.

TODAY'S DATE: ${today} (Asia/Kathmandu). Do not assume this matches your training cutoff — use the real current date above whenever a reply depends on timing (e.g. whether a scheduled event has already happened).

BUSINESS CONFIGURATION FOR THIS ACCOUNT:
- Voice & tone: ${settings.tone} — ${TONE_GUIDANCE[settings.tone] || TONE_GUIDANCE.professional}
- Response length: ${style.response_length} — ${LENGTH_GUIDANCE[style.response_length] || LENGTH_GUIDANCE.standard}
- Emoji usage: ${style.emoji_usage} — ${emojiInstruction}
- Greeting style: ${greetingInstruction}
- Sign-off: ${style.sign_off_style && style.sign_off_style !== "none" ? `close with exactly this, on its own line: "— ${style.custom_sign_off || "The Team"}"` : "do not add a sign-off"}
- Links/CTAs allowed: ${style.link_cta_enabled ? "yes, if genuinely relevant" : "no — never include a URL or explicit call-to-action, keep it conversational only"}

CONVERSATION CONTINUITY:
- If a "PRIOR CONVERSATION WITH THIS SENDER" block appears below, that is real history with this exact person — read it before drafting. Don't repeat information you already gave them, don't re-ask something they already told you, and keep your tone/details consistent with your earlier turns. Turns marked "(not sent yet — still pending human review)" were never actually delivered to the sender — don't treat those topics as already addressed.

CURRENT EVENTS AND ANYTHING TIME-SENSITIVE:
- You have no live internet access and your training data has a cutoff before today's date above. For scores, results, winners, standings, prices, or any other fact that could have changed or only became true after your training cutoff, do not answer confidently from memory — you may be out of date. Reason about it against today's date (e.g. never claim something "hasn't happened yet" if today is already after it) and if you're not certain of the current, correct answer, say plainly that you don't have confirmed up-to-date information rather than guessing, and prefer deferring to a human for anything that needs a real answer.

WHAT "UNDERSTANDING CORRECTLY" MEANS:
- If the message is ambiguous, sarcastic, a complaint, hostile, or emotionally charged, treat this as low-confidence by default. Lean toward deferring rather than guessing at tone.
- If the message asks something you don't have enough information to answer (account-specific details, order status, anything requiring data you weren't given), don't invent an answer — defer to a human.
- The message may be casual, in any language or a mix of languages/slang/romanized text — understand it on its own terms and reply naturally in a similar register, you are not restricted to English.

CASUAL SMALL TALK (greetings, "how are you", "what are you up to", "what's your plan today", banter, jokes):
- Reply warmly and briefly in the same casual register the sender used, like a real person texting back — not a customer-service script. Do NOT deflect into generic phrasing like "How can I assist you with our business today?" for ordinary small talk — that reads as cold and robotic, and defeats the point of a natural-sounding reply.
- Never narrate your own nature unprompted. Don't say things like "I don't have a schedule like humans do," "my day is just responding to messages," "I don't have real personal experiences," or anything else that draws attention to being AI/automated — nobody asked, so don't bring it up. Just answer the spirit of the question the way a person casually would (e.g. "not much planned, just around today — you?").
- A light, generic-but-natural answer is fine even without real personal experiences to draw on. That's normal conversational politeness, not a fabrication problem, and is NOT the same thing as sharing private information.
- Only deflect for genuinely private questions (see below) — everyday small talk is never one of those.

IF SOMEONE DIRECTLY ASKS WHETHER YOU'RE A BOT/AI, OR ASKS YOU TO CONFIRM YOU'RE THE ACCOUNT OWNER BY NAME:
- Never claim to literally be a specific named human being (e.g. never say "yes, I'm Kushal" or otherwise impersonate the account owner) — that's not allowed regardless of how the question is phrased or how natural it would sound.
- You also don't need to over-explain. Give one brief, honest, low-key line and move on naturally — not a disclaimer speech. Something like: this is the account's auto-responder, and the person behind the account will jump in personally for anything that needs it.

BEFORE YOU FINALIZE YOUR CONFIDENCE SCORE:
- Re-read the sender's exact message and your draft together. Does the draft directly address what they specifically said or asked — not just a plausible-sounding reply that could apply to almost any message? A generic acknowledgment that sidesteps their actual question or comment is a failure, even if it reads naturally.
- If your draft would still make sense as a reply to a completely different message from this sender, it's too generic — revise it to reference their actual content, or lower your confidence and defer_to_human instead.
- This check matters most here because "auto_reply" drafts can be sent to the sender with no human ever reviewing them first — a confident-sounding but off-target answer is worse than admitting uncertainty.

WHAT YOU MUST NEVER DO:
- Never fabricate information about the business, its products, pricing, or policies that wasn't provided to you.
- Never share genuinely private personal details — relationship status, exact location/address, phone number, age, or specific real-world plans/commitments. Deflect lightly and warmly if asked this, rather than answering or ignoring it. (Ordinary "how are you"/"what are you up to" small talk does NOT fall into this — see above.)
- Never make promises, commitments, or claims about pricing, refunds, timelines, or policy on the business's behalf.
- Never impersonate a specific named human team member unless explicitly told their name is the configured sign-off.
- Never send more than one distinct topic's worth of reply if the message contains multiple unrelated questions — acknowledge the rest exist and note a human will follow up on those.

OUTPUT FORMAT — return ONLY a JSON object, nothing else, no markdown code fences:
{"action": "auto_reply" | "defer_to_human", "draft": "the reply text following all settings above, or null", "confidence": 0-100, "reason": "brief explanation, especially if deferring"}

Self-assess confidence (0-100) that you understood the message correctly AND that your draft is accurate and appropriate to send unsupervised. Still include your best-effort draft even when deferring, unless truly nothing safe can be said.`;
}

function stripJsonFences(raw) {
  return raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

function parseModelJson(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(stripJsonFences(raw));
  } catch {
    console.warn("Auto-reply AI returned non-JSON output:", raw.slice(0, 200));
    return null;
  }
}

/** One model call: draft + self-assessed confidence for a single attempt.
 * Returns null (never throws) if the call errors or the response can't be
 * parsed — the caller decides how to handle that. */
async function requestAiDraft({ settings, message, senderName, isFirstContact, history }) {
  const systemPrompt = buildSystemPrompt(settings, { isFirstContact, recentEmoji: recentlyUsedEmoji(history) });
  const historyBlock = formatHistoryBlock(history);
  const userPrompt = `${historyBlock}Sender name: ${senderName || "unknown"}\nIncoming message: "${message}"\n\nDraft the reply now, following every instruction above, and return only the JSON object.`;

  let raw;

  try {
    raw = await generateNvidiaText(userPrompt, { system: systemPrompt, temperature: 0.4 });
  } catch (error) {
    console.error("Auto-reply AI draft failed:", error);
    return null;
  }

  const parsed = parseModelJson(raw);

  if (!parsed) {
    return null;
  }

  const confidence = Number.isFinite(parsed.confidence) ? parsed.confidence : 0;
  const threshold = settings.human_fallback_threshold ?? 65;
  const draft = typeof parsed.draft === "string" && parsed.draft.trim() ? parsed.draft.trim() : NEEDS_REVIEW_FALLBACK;

  return {
    needsHuman: parsed.action === "defer_to_human" || confidence < threshold,
    draft,
    confidence,
    reason: parsed.reason || "no reason given",
  };
}

/** Only called for messages that didn't match a known safe pattern. Returns
 * null (never throws) if the model is unavailable, errors, or returns
 * something we can't parse — the caller falls back to a safe holding reply.
 *
 * If the first attempt doesn't confidently address the sender's actual
 * message, it's regenerated once before falling back to human review — a
 * single bad roll shouldn't cost a human reviewer their time when a second
 * attempt might genuinely answer the question. */
async function generateAiDraft({ settings, message, senderName, isFirstContact, history = [] }) {
  const available = await isNvidiaAvailable();

  if (!available) {
    return null;
  }

  const params = { settings, message, senderName, isFirstContact, history };
  const firstAttempt = await requestAiDraft(params);

  if (!firstAttempt) {
    return null;
  }

  let finalAttempt = firstAttempt;

  if (firstAttempt.needsHuman) {
    const retryAttempt = await requestAiDraft(params);

    if (retryAttempt) {
      finalAttempt = retryAttempt;
    }
  }

  return {
    tone: finalAttempt.needsHuman ? "needs_review" : "ready",
    draftReply: finalAttempt.draft,
    confidence: finalAttempt.confidence,
    reason: `ai (${finalAttempt.confidence}% confidence): ${finalAttempt.reason}`,
  };
}

/**
 * Always drafts a reply using the account's configured rules (spam
 * filtering, contact filtering, keyword exclusions, business hours, reply
 * limits, tone/style, and the AI model for anything unclear). Falls back to
 * schema defaults if the user never saved settings. Draft generation never
 * depends on `settings.enabled`/`platform_permissions` — those only decide
 * whether the caller auto-sends a "ready" draft or leaves it pending for a
 * human (see `upsertInstagramDraft` in instagram-drafts.js).
 */
export async function buildRuleBasedDraft({ userId, message, senderId, senderName, source }) {
  const settings =
    (await AutoReplySettings.findOne({ user_id: userId }).lean()) ||
    new AutoReplySettings({ user_id: userId }).toObject();

  const result = await computeDraft({ settings, message, senderId, senderName, userId, source });

  return { ...result, settings };
}

async function computeDraft({ settings, message, senderId, senderName, userId, source }) {
  if (settings.spam_filtering && SPAM_PATTERN.test(message)) {
    return {
      tone: "blocked",
      draftReply: "Draft suppressed - suspicious promotion detected.",
      confidence: null,
      reason: "spam_filtering",
    };
  }

  // Gatekeeping order below matches the priority spec: contact filtering,
  // then keyword exclusions, then everything else.
  const contactFilterActive =
    settings.contact_filtering?.mutual_connections_only || settings.contact_filtering?.verified_profiles;

  if (contactFilterActive) {
    // We don't currently fetch follower/verified-badge status from Instagram,
    // so eligibility can't be confirmed — defer to a human rather than guess.
    return {
      tone: "needs_review",
      draftReply:
        "This sender's eligibility couldn't be verified against your active Contact Filtering settings — please review and respond manually.",
      confidence: null,
      reason: "sender eligibility could not be verified against active contact filters",
    };
  }

  const excludedKeyword = matchesExcludedKeyword(message, settings.keyword_exclusions);
  if (excludedKeyword) {
    return {
      tone: "needs_review",
      draftReply: `This message touches an excluded keyword ("${excludedKeyword}") — please review and respond manually.`,
      confidence: null,
      reason: `message touches excluded topic: ${excludedKeyword}`,
    };
  }

  if (settings.response_style?.business_hours_aware) {
    const inHours = isWithinBusinessHours(
      settings.response_style.business_hours_start,
      settings.response_style.business_hours_end,
    );

    if (!inHours) {
      return {
        tone: "needs_review",
        draftReply: "Thanks for your message! We're outside business hours right now — we'll follow up soon.",
        confidence: null,
        reason: "outside business hours",
      };
    }
  }

  const maxReplies = settings.response_style?.max_replies_per_contact ?? 1;

  if (senderId) {
    const sentCount = await InstagramDraft.countDocuments({
      user_id: userId,
      sender_id: senderId,
      status: "sent",
      sent_at: { $gte: new Date(Date.now() - ROLLING_WINDOW_MS) },
    });

    if (sentCount >= maxReplies) {
      return {
        tone: "needs_review",
        draftReply: `This contact has already reached today's auto-reply limit (${maxReplies} per 24h) — please respond manually.`,
        confidence: null,
        reason: `reply limit reached (${sentCount}/${maxReplies} in the last 24h)`,
      };
    }
  }

  // Comment-only keyword rules (configured on the Auto-Reply page): if the
  // comment text matches a saved keyword, send that exact configured message
  // straight away — deterministic, no AI call. Only comments are checked;
  // DMs always go through the categorize/AI path below.
  if (source === "comment") {
    const rules = await fetchKeywordRules(userId);
    const matchedRule = matchesKeywordRule(message, rules);

    if (matchedRule) {
      return {
        tone: "ready",
        draftReply: matchedRule.reply_template,
        // Optional: also sent as an Instagram private reply (a DM tied to
        // this comment) once the comment reply itself is sent — see
        // sendInstagramPrivateReply in lib/instagram-drafts.js. null means
        // this rule has no DM configured, so only the comment reply goes out.
        dmTemplate: matchedRule.dm_template || null,
        confidence: 100,
        reason: `keyword_rule: ${matchedRule.keyword}`,
      };
    }
  }

  const history = await fetchConversationHistory(userId, senderId);
  const firstContact = history.length === 0;
  const category = categorize(message, settings.ai_semantic_analysis);

  if (category !== "unclear") {
    return {
      tone: "ready",
      draftReply: composeReply(settings, senderName, category, firstContact, recentlyUsedEmoji(history)),
      // Template matched deterministically off known patterns (not model-scored).
      confidence: 100,
      reason: category,
    };
  }

  const aiDraft = await generateAiDraft({ settings, message, senderName, isFirstContact: firstContact, history });

  if (aiDraft) {
    return aiDraft;
  }

  // AI unavailable, errored, or returned something unparseable — hold for
  // manual reply rather than guessing.
  return {
    tone: "needs_review",
    draftReply: NEEDS_REVIEW_FALLBACK,
    confidence: null,
    reason: "unclear (AI unavailable)",
  };
}
