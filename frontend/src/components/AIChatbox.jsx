import { useEffect, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chatAPI } from "../services/api";
import { supabase } from "../supabaseClient";

const INITIAL_MESSAGE =
  "Hi! I'm your PlantPal assistant. Do you have a general question, or do you need help with one of your plants?";

export default function AIChatbox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "ai", text: INITIAL_MESSAGE }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState(null);
  const [plants, setPlants] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [plantReadings, setPlantReadings] = useState([]);
  const location = useLocation();
  const { user } = useAuth();

  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  useEffect(() => {
    if (!open || chatMode !== "plant" || !user) {
      return;
    }

    let cancelled = false;

    const fetchPlants = async () => {
      setPlantsLoading(true);

      try {
        const { data, error } = await supabase
          .from("Plant")
          .select("*")
          .eq("userId", user.id)
          .order("id", { ascending: true });

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        setPlants(data || []);

        if (!data || data.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: "I couldn't find any saved plants in your account yet. You can still ask a general plant question.",
            },
          ]);
        }
      } catch (error) {
        console.error("Plant load error:", error);

        if (!cancelled) {
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: "I couldn't load your saved plants right now. You can still ask a general plant question.",
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setPlantsLoading(false);
        }
      }
    };

    fetchPlants();

    return () => {
      cancelled = true;
    };
  }, [open, chatMode, user]);

  const resetChat = () => {
    setMessages([{ role: "ai", text: INITIAL_MESSAGE }]);
    setInput("");
    setLoading(false);
    setChatMode(null);
    setPlants([]);
    setPlantsLoading(false);
    setSelectedPlant(null);
    setPlantReadings([]);
  };

  const chooseMode = (mode) => {
    setChatMode(mode);
    setSelectedPlant(null);
    setPlantReadings([]);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: mode === "general" ? "I have a general question." : "I need help with one of my plants.",
      },
      {
        role: "ai",
        text:
          mode === "general"
            ? "Perfect. Ask any general plant question and I'll help."
            : "Pick the plant you want help with, and I'll use its saved data when I answer.",
      },
    ]);
  };

  const choosePlant = async (plant) => {
    setSelectedPlant(plant);
    setPlantReadings([]);
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: `I need help with ${plant.plantName}.` },
    ]);

    try {
      if (!plant.device_id) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `${plant.plantName} does not have a linked sensor device yet. I can still help based on its saved plant profile.`,
          },
        ]);
        return;
      }

      const { data, error } = await supabase
        .from("esp32_readings")
        .select("*")
        .eq("device_id", plant.device_id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPlantReadings(data || []);

      const latestReading = data?.[0];
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: latestReading
            ? `I found ${data.length} saved reading${data.length === 1 ? "" : "s"} for ${plant.plantName}. The most recent one was recorded at ${new Date(latestReading.created_at).toLocaleString()}. Ask me anything about this plant.`
            : `I found ${plant.plantName}, but there are no saved readings for it yet. Ask me anything about the plant and I'll still help.`,
        },
      ]);
    } catch (error) {
      console.error("Plant reading load error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `I couldn't load the saved data for ${plant.plantName}, but I can still help with general care advice for it.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) {
      return;
    }

    if (chatMode === "plant" && !selectedPlant) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Choose which plant you want help with first, then ask your question.",
        },
      ]);
      return;
    }

    const currentInput = input;
    const userMessage = { role: "user", text: currentInput };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        message: currentInput,
        chatMode: chatMode || "general",
        selectedPlant,
        plantReadings,
      });
      const aiReply = response.data.reply || "I got your message, but no reply came back.";

      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
    } catch (error) {
      console.error("Chat error:", error);
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
      <button
        onClick={() => {
          if (open) {
            resetChat();
          }
          setOpen((prev) => !prev);
        }}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-50 transition-all hover:scale-105"
        style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] h-[min(520px,calc(100vh-8rem))] bg-[#f4faf6] dark:bg-[#0d1f12] dark:text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-green-100 dark:border-green-900">
          <div className="bg-green-600 text-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
              🌿
            </div>
            <div>
              <p className="font-semibold text-sm">PlantPal AI</p>
              <p className="text-green-200 text-xs">
                {selectedPlant ? `Helping with ${selectedPlant.plantName}` : "Always here to help"}
              </p>
            </div>
          </div>

          <div className="h-0.5 w-full bg-gradient-to-r from-yellow-300 via-green-400 to-yellow-300" />

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#f4faf6] dark:bg-[#0d1f12]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "ml-auto bg-green-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100 shadow-sm border border-green-100 dark:border-green-900 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {!chatMode && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => chooseMode("general")}
                  className="rounded-full bg-white px-3 py-2 text-sm text-green-700 shadow-sm border border-green-200"
                >
                  General question
                </button>
                <button
                  onClick={() => chooseMode("plant")}
                  className="rounded-full bg-white px-3 py-2 text-sm text-green-700 shadow-sm border border-green-200"
                >
                  Help with a plant
                </button>
              </div>
            )}

            {chatMode === "plant" && !selectedPlant && (
              <div className="space-y-2">
                {plantsLoading && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Loading your plants...
                  </div>
                )}

                {!plantsLoading && plants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {plants.map((plant) => (
                      <button
                        key={plant.id}
                        onClick={() => choosePlant(plant)}
                        className="rounded-full bg-white px-3 py-2 text-sm text-green-700 shadow-sm border border-green-200"
                      >
                        {plant.plantName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="p-3 rounded-2xl text-sm max-w-[80%] bg-white dark:bg-white/10 border border-green-100 dark:border-green-900 shadow-sm flex gap-1 items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>

          <div className="p-3 border-t border-green-100 dark:border-green-900 bg-white dark:bg-[#0d1f12] flex gap-2 items-center">
            <input
              className="flex-1 border border-green-200 dark:border-green-800 rounded-xl p-2 text-sm bg-green-50 dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-60"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                chatMode === "plant" && selectedPlant
                  ? `Ask about ${selectedPlant.plantName}...`
                  : chatMode === "general"
                    ? "Ask a general plant question..."
                    : "Choose a chat type first..."
              }
              disabled={!chatMode || (chatMode === "plant" && !selectedPlant)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !chatMode || (chatMode === "plant" && !selectedPlant)}
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
