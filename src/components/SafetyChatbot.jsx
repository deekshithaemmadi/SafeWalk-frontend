import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  MessageCircle,
  Info,
  Sparkles,
} from "lucide-react";
import { SUGGESTED_QUESTIONS, findBestAnswer } from "../services/safetyChatbotService";

let messageIdCounter = 0;
const nextId = () => {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
};

export default function SafetyChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      sender: "bot",
      text:
        "Hi, I'm SafeWalk's safety assistant. I give predefined guidance about SafeWalk features and general emergency information. I'm not a live AI or an emergency responder — for urgent help, call 112.",
      predefined: true,
      followUps: SUGGESTED_QUESTIONS.slice(0, 2),
    },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const respondTo = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    pushMessage({ id: nextId(), sender: "user", text: trimmed });
    const match = findBestAnswer(trimmed);
    pushMessage({
      id: nextId(),
      sender: "bot",
      text: match.answer,
      predefined: true,
      followUps: match.followUps || [],
    });
    setInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    respondTo(input);
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          className="chatbot-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open safety assistant"
        >
          <MessageCircle size={22} />
          <span>Safety Assistant</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Safety Assistant">
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-avatar">
                <Bot size={18} />
              </span>
              <div>
                <strong>Safety Assistant</strong>
                <span className="chatbot-header-sub">Predefined guidance · not live AI</span>
              </div>
            </div>
            <button
              type="button"
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close safety assistant"
            >
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages" ref={scrollRef}>
            <div className="chatbot-predefined-note">
              <Info size={13} /> Responses are predefined safety information, not a live AI service.
            </div>
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-msg ${m.sender}`}>
                <div className="chatbot-bubble">
                  <p>{m.text}</p>
                  {m.sender === "bot" && m.predefined && (
                    <span className="chatbot-predefined-tag">
                      <Sparkles size={11} /> Predefined
                    </span>
                  )}
                </div>
                {m.sender === "bot" && m.followUps && m.followUps.length > 0 && (
                  <div className="chatbot-followups">
                    {m.followUps.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="chatbot-chip"
                        onClick={() => respondTo(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          <div className="chatbot-suggestions">
            <span className="chatbot-suggestions-label">Suggested questions</span>
            <div className="chatbot-suggestions-list">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="chatbot-chip"
                  onClick={() => respondTo(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask about safety or SafeWalk..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Type your question"
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={!input.trim()}
              aria-label="Send question"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
