// Rule-based gatekeeping + draft composer for Instagram auto-reply. The
// gatekeeping (platform access, contact filters, keyword exclusions,
// business hours, reply limits) is deterministic and never calls the model.
// Only messages that don't match a known safe pattern (not spam, not an
// obvious greeting/FAQ) get sent to the actual AI model below — that keeps
// AI calls limited to the cases that genuinely need real understanding.
import { generateNvidiaText, isNvidiaAvailable } from "./aimodel.js";
import { AutoReplySettings, InstagramDraft } from "./models.js";
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

function emojiFor(settings, category) {
  const usage = settings.response_style?.emoji_usage;
  if (!usage || usage === "none") return "";
  if (category === "greeting" || category === "smalltalk") return " 🙂";
  if (usage === "moderate" && category === "faq") return " 👍";
  return "";
}

function matchesExcludedKeyword(message, keywords) {
  const lower = message.toLowerCase();
  return (keywords || []).find((word) => word && lower.includes(word.toLowerCase())) || null;
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

function composeReply(settings, senderName, category) {
  const greeting = greetingFor(settings, senderName);
  const emoji = emojiFor(settings, category);
  const signOff = signOffFor(settings);

  let body;

  switch (category) {
    case "greeting":
      body = `${greeting}! Thanks for reaching out${emoji}. What can I help you with today?`;
      break;
    case "smalltalk":
      body = `${greeting}! Doing well, thanks for asking${emoji} — how about you? Let me know if there's anything I can help with.`;
      break;
    case "faq":
      body = settings.response_style?.link_cta_enabled
        ? `${greeting}! Thanks for asking — I'll get you the details shortly, and feel free to check our latest post in the meantime${emoji}.`
        : `${greeting}! Thanks for asking — I'll get you the details shortly${emoji}.`;
      break;
    default:
      body = `${greeting}! Thanks for your message — I'll take a closer look and get back to you shortly.`;
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
  minimal: "at most one, only if it fits naturally",
  moderate: "up to 2-3 where they add warmth, never in place of words",
};

function buildSystemPrompt(settings) {
  const style = settings.response_style || {};

  return `You are AutoPilot's auto-reply assistant. You draft short, natural replies to incoming Instagram messages/comments on behalf of the business or creator account you're connected to. You do not send messages yourself — you only produce a draft reply and a confidence score; a separate system decides whether to send it automatically or route it to a human.

BUSINESS CONFIGURATION FOR THIS ACCOUNT:
- Voice & tone: ${settings.tone} — ${TONE_GUIDANCE[settings.tone] || TONE_GUIDANCE.professional}
- Response length: ${style.response_length} — ${LENGTH_GUIDANCE[style.response_length] || LENGTH_GUIDANCE.standard}
- Emoji usage: ${style.emoji_usage} — ${EMOJI_GUIDANCE[style.emoji_usage] || EMOJI_GUIDANCE.none}
- Greeting style: ${style.greeting_style === "first_name" ? "open with the sender's first name if you were given one" : "open with a generic greeting, do not use their name"}
- Sign-off: ${style.sign_off_style && style.sign_off_style !== "none" ? `close with exactly this, on its own line: "— ${style.custom_sign_off || "The Team"}"` : "do not add a sign-off"}
- Links/CTAs allowed: ${style.link_cta_enabled ? "yes, if genuinely relevant" : "no — never include a URL or explicit call-to-action, keep it conversational only"}

WHAT "UNDERSTANDING CORRECTLY" MEANS:
- If the message is ambiguous, sarcastic, a complaint, hostile, or emotionally charged, treat this as low-confidence by default. Lean toward deferring rather than guessing at tone.
- If the message asks something you don't have enough information to answer (account-specific details, order status, anything requiring data you weren't given), don't invent an answer — defer to a human.
- The message may be casual, in any language or a mix of languages/slang/romanized text — understand it on its own terms and reply naturally in a similar register, you are not restricted to English.

CASUAL SMALL TALK (greetings, "how are you", "what are you up to", banter, jokes):
- Reply warmly and briefly in the same casual register the sender used. Do NOT deflect into generic customer-service phrasing like "How can I assist you with our business today?" for ordinary small talk — that reads as cold and robotic, and defeats the point of a natural-sounding reply.
- A light, generic-but-natural answer ("doing well, just been busy — you?") is fine even though you don't have real personal experiences. That's normal conversational politeness, not a fabrication problem, and is NOT the same thing as sharing private information.
- Only deflect for genuinely private questions (see below) — everyday small talk is never one of those.

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

/** Only called for messages that didn't match a known safe pattern. Returns
 * null (never throws) if the model is unavailable, errors, or returns
 * something we can't parse — the caller falls back to a safe holding reply. */
async function generateAiDraft({ settings, message, senderName }) {
  const available = await isNvidiaAvailable();

  if (!available) {
    return null;
  }

  const systemPrompt = buildSystemPrompt(settings);
  const userPrompt = `Sender name: ${senderName || "unknown"}\nIncoming message: "${message}"\n\nDraft the reply now, following every instruction above, and return only the JSON object.`;

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
  const needsHuman = parsed.action === "defer_to_human" || confidence < threshold;

  return {
    tone: needsHuman ? "needs_review" : "ready",
    draftReply: draft,
    reason: `ai (${confidence}% confidence): ${parsed.reason || "no reason given"}`,
  };
}

/**
 * Returns null when automation is off (or never configured) so the caller
 * falls back to the legacy static draft logic untouched. Otherwise always
 * returns a safe-to-display draft string plus a tone, and a `reason` meant
 * for logs only — never surfaced as the draft text itself.
 */
export async function buildRuleBasedDraft({ userId, message, senderId, senderName }) {
  const settings = await AutoReplySettings.findOne({ user_id: userId }).lean();

  if (!settings?.enabled) {
    return null;
  }

  // Platform Access controls whether auto-*sending* is allowed on this
  // platform once that's built — it does not gate drafting. Drafting always
  // happens for a connected platform since a human still approves every
  // send regardless of this setting.

  if (settings.spam_filtering && SPAM_PATTERN.test(message)) {
    return { tone: "blocked", draftReply: "Draft suppressed - suspicious promotion detected.", reason: "spam_filtering" };
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
      reason: "sender eligibility could not be verified against active contact filters",
    };
  }

  const excludedKeyword = matchesExcludedKeyword(message, settings.keyword_exclusions);
  if (excludedKeyword) {
    return {
      tone: "needs_review",
      draftReply: `This message touches an excluded keyword ("${excludedKeyword}") — please review and respond manually.`,
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
        reason: `reply limit reached (${sentCount}/${maxReplies} in the last 24h)`,
      };
    }
  }

  const category = categorize(message, settings.ai_semantic_analysis);

  if (category !== "unclear") {
    return { tone: "ready", draftReply: composeReply(settings, senderName, category), reason: category };
  }

  const aiDraft = await generateAiDraft({ settings, message, senderName });

  if (aiDraft) {
    return aiDraft;
  }

  // AI unavailable, errored, or returned something unparseable — hold for
  // manual reply rather than guessing.
  return { tone: "needs_review", draftReply: NEEDS_REVIEW_FALLBACK, reason: "unclear (AI unavailable)" };
}
