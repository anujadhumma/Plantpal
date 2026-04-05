import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function AIChatbox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! 🌱 I'm your plant assistant. Ask me anything!" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // placeholder AI response (we'll connect backend later)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "I’ll analyze your plant data soon 🌸" },
      ]);
    }, 500);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-pink-500 text-white p-4 rounded-full shadow-lg z-50"
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-[450px] bg-white dark:bg-[#1a0f14] dark:text-white rounded-2xl shadow-xl flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="bg-pink-500 text-white p-4 font-semibold">
            PlanPal AI 🌿
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm max-w-[80%] ${
                  msg.role === "user"
                    ? "ml-auto bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-white/10"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-2 border-t flex gap-2">
            <input
              className="flex-1 border rounded-lg p-2 text-black"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your plant..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-pink-500 text-white p-2 rounded-lg"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
