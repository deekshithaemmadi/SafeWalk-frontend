/**
 * Safety Chatbot — Predefined Knowledge Base
 *
 * IMPORTANT: SafeWalk's chatbot is NOT connected to a live AI service. Every reply
 * below is a hand-written, predefined answer. The UI clearly labels responses as
 * "Predefined guidance" so users never mistake them for real-time AI or emergency
 * dispatch.
 *
 * Content sources:
 *  - Actual SafeWalk app behaviour (route planning, emergency contacts, features).
 *  - Reliable, publicly documented Indian emergency numbers (112 / 1091 / 100).
 */

export const SUGGESTED_QUESTIONS = [
  "What should I do in an immediate emergency?",
  "What are the key emergency numbers in India?",
  "How do I plan a safer route with SafeWalk?",
  "How do I add emergency contacts?",
  "Does SafeWalk share my live location automatically?",
  "Are community safety reports verified?",
];

/**
 * Each entry has: id, match keywords (lowercase), answer, optional follow-ups.
 * Matching is simple keyword scoring against the user's message.
 */
export const FAQ_ENTRIES = [
  {
    id: "emergency",
    keywords: ["emergency", "immediate", "danger", "help me", "attack", "urgent", "right now", "threat"],
    answer:
      "If you are in immediate danger, call India's national emergency number 112 right away (it works even without balance on most phones). For harassment or crimes against women, call the Women's Helpline 1091. Move to a safe, well-lit public place if you can, and stay on the line with the operator. SafeWalk cannot call for you automatically.",
    followUps: ["What are the key emergency numbers in India?"],
  },
  {
    id: "numbers",
    keywords: ["number", "helpline", "112", "1091", "100", "call", "phone"],
    answer:
      "Verified Indian emergency numbers: 112 — single national emergency number (police, fire, ambulance). 1091 — Women's Helpline. 100 — Police. These numbers are also shown in SafeWalk's footer for quick reference.",
    followUps: ["What should I do in an immediate emergency?"],
  },
  {
    id: "plan-route",
    keywords: ["route", "plan", "journey", "travel", "trip", "distance", "navigate", "safest"],
    answer:
      "Use the 'Plan Journey' page to enter a start and destination. SafeWalk shows real road-network routes, actual distance and estimated travel time, and alternative paths when available. SafeWalk does NOT fabricate safety scores — when verified safety data is unavailable for a segment, it tells you so. Choose well-lit arterial roads at night.",
    followUps: ["Does SafeWalk share my live location automatically?"],
  },
  {
    id: "contacts",
    keywords: ["contact", "contacts", "emergency contact", "guardian", "add contact", "family"],
    answer:
      "Go to 'Emergency Contacts' to add, edit, or call your trusted contacts. Your profile requires at least two. You can tap a contact to call them directly. Saving a contact does NOT automatically send them your live location or SMS — sharing is always a manual action you choose.",
    followUps: ["How do I plan a safer route with SafeWalk?"],
  },
  {
    id: "location-sharing",
    keywords: ["location", "gps", "share", "tracking", "live", "privacy", "broadcast"],
    answer:
      "SafeWalk only uses your location when you explicitly allow GPS access — for example to centre the map or during Live Trip Tracking on the dashboard. It does not broadcast your coordinates to contacts or authorities automatically. Any location sharing during SOS is consent-based and shown to you before it happens.",
    followUps: ["What is Live Trip Tracking?"],
  },
  {
    id: "live-trip",
    keywords: ["live trip", "trip tracking", "track my trip", "start trip", "monitor"],
    answer:
      "Live Trip Tracking is on your Dashboard. Press 'Start Trip' to begin a local timer and live GPS marker on the map while you travel, then 'End Trip' when you arrive. It runs entirely in your browser for your own awareness — it does not notify anyone else.",
    followUps: ["How do I add emergency contacts?"],
  },
  {
    id: "community-reports",
    keywords: ["report", "reports", "community", "verified", "incident", "unverified"],
    answer:
      "The Community Reports page lets you describe a safety concern in your area. When signed in, reports are submitted to and saved in the SafeWalk database — VERIFIED reports are visible to other users. All new reports start as PENDING and are subject to moderation review before they are shown publicly. In an emergency, always call 112 rather than relying on community reports.",
    followUps: ["What should I do in an immediate emergency?"],
  },
  {
    id: "nearby-help",
    keywords: ["nearby", "hospital", "police", "help centre", "help center", "women help", "clinic"],
    answer:
      "The Nearby Help page shows hospitals, police stations, and women's help centres all plotted on an interactive map — all three datasets include real coordinates for Hyderabad locations. You can filter by category, search by name, and tap any marker for address and contact details. Always call 112 for urgent help.",
    followUps: ["What are the key emergency numbers in India?"],
  },
  {
    id: "about",
    keywords: ["what is safewalk", "about", "who are you", "what can you do", "features"],
    answer:
      "SafeWalk is a women's travel-safety and route-planning web app. It offers real route comparison, distance/time estimates, emergency contact management, an SOS quick-call panel, a nearby-help directory, community notes, and this predefined safety assistant. It never guarantees safety and never fabricates data.",
    followUps: ["How do I plan a safer route with SafeWalk?"],
  },
  {
    id: "ai",
    keywords: ["are you ai", "real person", "chatbot", "bot", "human"],
    answer:
      "I am a predefined safety assistant built into SafeWalk. My answers come from a fixed set of written responses based on official emergency guidance and how SafeWalk works. I am not a live AI and not an emergency responder — for real emergencies, call 112.",
    followUps: ["What should I do in an immediate emergency?"],
  },
];

const FALLBACK = {
  id: "fallback",
  answer:
    "I only have predefined answers about SafeWalk features and general safety guidance. For anything urgent, call 112 (all emergencies) or 1091 (women's helpline). Try one of the suggested questions, or visit the Plan Journey and Emergency Contacts pages.",
  followUps: ["What are the key emergency numbers in India?", "What should I do in an immediate emergency?"],
};

/**
 * Very small keyword matcher. Returns the best-matching FAQ entry or the fallback.
 * @param {string} message
 */
export function findBestAnswer(message) {
  const text = (message || "").toLowerCase();
  if (!text.trim()) return FALLBACK;

  let best = null;
  let bestScore = 0;

  for (const entry of FAQ_ENTRIES) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        // Longer keywords are more specific → weight them higher
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best && bestScore > 0 ? best : FALLBACK;
}

export default {
  SUGGESTED_QUESTIONS,
  FAQ_ENTRIES,
  findBestAnswer,
};

