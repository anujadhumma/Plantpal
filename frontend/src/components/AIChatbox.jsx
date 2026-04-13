import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { chatAPI } from "../services/api";
import { useLocation } from "react-router-dom";

export default function AIChatbox() {
  const [open, setOpen] = useState(false);

  // Initial greeting message from the AI
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! 🌱 I'm your PlantPal assistant. Ask me anything about your plants!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Hide chatbox on login and signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  const sendMessage = async () => {
    // Prevent sending empty messages or while loading
    if (!input.trim() || loading) return;

    const currentInput = input;
    const userMessage = { role: "user", text: currentInput };

    // Add user message to chat and clear input
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send message to backend API
      const response = await chatAPI.sendMessage(currentInput);
      const aiReply = response.data.reply || "I got your message, but no reply came back.";

      // Add AI reply to chat
      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
    } catch (error) {
      console.error("Chat error:", error);

      // Show error message if request fails
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, something went wrong connecting to the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button to open and close the chatbox */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-50 transition-all hover:scale-105"
        style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-[480px] bg-[#f4faf6] dark:bg-[#0d1f12] dark:text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-green-100 dark:border-green-900">

          {/* Chat header with icon and status */}
          <div className="bg-green-600 text-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
              🌿
            </div>
            <div>
              <p className="font-semibold text-sm">PlantPal AI</p>
              <p className="text-green-200 text-xs">Always here to help 🌱</p>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="h-0.5 w-full bg-gradient-to-r from-yellow-300 via-green-400 to-yellow-300" />

          {/* Scrollable message list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#f4faf6] dark:bg-[#0d1f12]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto bg-green-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100 shadow-sm border border-green-100 dark:border-green-900 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {/* Typing indicator shown while waiting for AI response */}
            {loading && (
              <div className="p-3 rounded-2xl text-sm max-w-[80%] bg-white dark:bg-white/10 border border-green-100 dark:border-green-900 shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>

          {/* Input area for typing and sending messages */}
          <div className="p-3 border-t border-green-100 dark:border-green-900 bg-white dark:bg-[#0d1f12] flex gap-2 items-center">
            <input
              className="flex-1 border border-green-200 dark:border-green-800 rounded-xl p-2 text-sm bg-green-50 dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your plant..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl transition disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}