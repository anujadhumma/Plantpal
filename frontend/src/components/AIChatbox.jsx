import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, X, RotateCcw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { chatAPI } from "../services/api";
import { supabase } from "../supabaseClient";

const INITIAL_MESSAGE =
  "Hi! I'm your PlantPal assistant. Do you have a general question, or do you need help with one of your plants?";

const CARD = "bg-white/90 dark:bg-[#0d1f12]/90 border border-green-100 dark:border-white/10 backdrop-blur-md";

export default function AIChatbox() {
  const [open, setOpen]                   = useState(false);
  const [messages, setMessages]           = useState([{ role: "ai", text: INITIAL_MESSAGE }]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [chatMode, setChatMode]           = useState(null);
  const [plants, setPlants]               = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [plantReadings, setPlantReadings] = useState([]);
  const [showBubble, setShowBubble]       = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();

  const isOnDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Show welcome bubble 1.5s after arriving on dashboard, hide after 5s
  // No sessionStorage — show every time user visits the dashboard
  useEffect(() => {
    if (!isOnDashboard || open) {
      setShowBubble(false);
      return;
    }
    const show = setTimeout(() => setShowBubble(true), 1500);
    const hide = setTimeout(() => setShowBubble(false), 11500);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [isOnDashboard, open]);

  // Load plants when in plant mode
  useEffect(() => {
    if (!open || chatMode !== "plant" || !user) return;
    let cancelled = false;
    const fetchPlants = async () => {
      setPlantsLoading(true);
      try {
        const { data, error } = await supabase.from("Plant").select("*")
          .eq("userId", user.id).order("id", { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        setPlants(data || []);
        if (!data?.length)
          setMessages(prev => [...prev, { role: "ai", text: "No plants found in your account. You can still ask a general plant question." }]);
      } catch {
        if (!cancelled)
          setMessages(prev => [...prev, { role: "ai", text: "Couldn't load your plants right now. You can still ask a general plant question." }]);
      } finally {
        if (!cancelled) setPlantsLoading(false);
      }
    };
    fetchPlants();
    return () => { cancelled = true; };
  }, [open, chatMode, user]);

  if (location.pathname === "/login" || location.pathname === "/signup") return null;

  const resetChat = () => {
    setMessages([{ role: "ai", text: INITIAL_MESSAGE }]);
    setInput(""); setLoading(false); setChatMode(null);
    setPlants([]); setPlantsLoading(false);
    setSelectedPlant(null); setPlantReadings([]);
  };

  const chooseMode = (mode) => {
    setChatMode(mode);
    setSelectedPlant(null); setPlantReadings([]);
    setMessages(prev => [...prev,
      { role: "user", text: mode === "general" ? "I have a general question." : "I need help with one of my plants." },
      { role: "ai",  text: mode === "general"
          ? "Perfect — ask any plant question and I'll help."
          : "Pick the plant you want help with and I'll use its sensor data when answering." },
    ]);
  };

  const choosePlant = async (plant) => {
    setSelectedPlant(plant); setPlantReadings([]); setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: `I need help with ${plant.plantName}.` }]);
    try {
      if (!plant.device_id) {
        setMessages(prev => [...prev, { role: "ai", text: `${plant.plantName} doesn't have a linked sensor yet. I can still help based on its profile.` }]);
        return;
      }
      const { data, error } = await supabase.from("esp32_readings").select("*")
        .eq("device_id", plant.device_id).order("created_at", { ascending: false });
      if (error) throw error;
      setPlantReadings(data || []);
      const latest = data?.[0];
      setMessages(prev => [...prev, { role: "ai", text: latest
        ? `Loaded ${data.length} reading${data.length === 1 ? "" : "s"} for ${plant.plantName}. Most recent: ${new Date(latest.created_at).toLocaleString()}. Ask me anything!`
        : `Found ${plant.plantName} but no readings yet. I can still give care advice.`
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: `Couldn't load sensor data for ${plant.plantName}, but I can still give general care advice.` }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (chatMode === "plant" && !selectedPlant) {
      setMessages(prev => [...prev, { role: "ai", text: "Choose which plant you want help with first." }]);
      return;
    }
    const currentInput = input;
    setMessages(prev => [...prev, { role: "user", text: currentInput }]);
    setInput(""); setLoading(true);
    try {
      const response = await chatAPI.sendMessage({ message: currentInput, chatMode: chatMode || "general", selectedPlant, plantReadings });
      setMessages(prev => [...prev, { role: "ai", text: response.data.reply || "No reply came back." }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, something went wrong connecting to the server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes bubblePop {
          0%   { opacity:0; transform:translateY(8px) scale(0.95); }
          100% { opacity:1; transform:translateY(0) scale(1); }
        }
        .bubble-pop { animation: bubblePop 0.35s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* Welcome bubble */}
      {showBubble && !open && (
        <div className="fixed bottom-24 right-6 z-50 bubble-pop">
          <div className="relative bg-white/95 dark:bg-[#0d1f12]/95 border border-green-200 dark:border-green-800 rounded-2xl rounded-br-sm px-4 py-3 shadow-xl backdrop-blur-md max-w-[210px]"
            style={{boxShadow:"0 8px 32px rgba(34,197,94,0.2)"}}>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">
              👋 Hello! Ask me anything about your plants 🌿
            </p>
            {/* Tail */}
            <div className="absolute -bottom-2 right-5 w-4 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white/95 dark:bg-[#0d1f12]/95 border-r border-b border-green-200 dark:border-green-800 rotate-45 origin-top-left ml-0.5"/>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => { setShowBubble(false); if (open) { resetChat(); setOpen(false); } else setOpen(true); }}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-50 transition-all hover:scale-105 active:scale-95"
        style={{boxShadow:"0 4px 20px rgba(34,197,94,0.4)"}}
      >
        {open ? <X size={22}/> : <MessageCircle size={22}/>}
      </button>

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] h-[min(520px,calc(100vh-8rem))] ${CARD} rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50`}
          style={{boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>

          {/* Header */}
          <div className="bg-green-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">🌿</div>
              <div>
                <p className="font-bold text-white text-sm">PlantPal AI</p>
                <p className="text-green-200 text-[11px]">
                  {selectedPlant ? `Helping with ${selectedPlant.plantName}` : "Always here to help"}
                </p>
              </div>
            </div>
            <button onClick={resetChat} title="Reset chat"
              className="text-green-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <RotateCcw size={14}/>
            </button>
          </div>

          <div className="h-0.5 w-full bg-gradient-to-r from-yellow-300 via-green-400 to-yellow-300 flex-shrink-0"/>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm max-w-[88%] leading-relaxed whitespace-pre-wrap rounded-2xl px-3 py-2.5 ${
                msg.role === "user"
                  ? "ml-auto bg-green-600 text-white rounded-br-sm shadow-sm"
                  : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100 border border-green-100 dark:border-green-900/50 shadow-sm rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            ))}

            {!chatMode && (
              <div className="flex flex-wrap gap-2 pt-1">
                {[["general","💬 General question"],["plant","🌿 Help with a plant"]].map(([m,label])=>(
                  <button key={m} onClick={() => chooseMode(m)}
                    className="rounded-full bg-white dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors shadow-sm">
                    {label}
                  </button>
                ))}
              </div>
            )}

            {chatMode === "plant" && !selectedPlant && (
              <div className="space-y-1.5">
                {plantsLoading && <p className="text-xs text-gray-400 animate-pulse">Loading your plants…</p>}
                {!plantsLoading && plants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plants.map(p => (
                      <button key={p.id} onClick={() => choosePlant(p)}
                        className="rounded-full bg-white dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-50 transition-colors shadow-sm">
                        🌿 {p.plantName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-1 bg-white dark:bg-white/10 border border-green-100 dark:border-green-900/50 rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[60px] shadow-sm">
                {[0,150,300].map(d=>(
                  <span key={d} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>
                ))}
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-green-100 dark:border-green-900/50 flex gap-2 items-center flex-shrink-0 bg-white/50 dark:bg-black/10">
            <input
              className="flex-1 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 text-sm bg-white/80 dark:bg-green-950/30 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 placeholder-gray-400 transition"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={!chatMode || (chatMode === "plant" && !selectedPlant)}
              placeholder={
                chatMode === "plant" && selectedPlant ? `Ask about ${selectedPlant.plantName}…`
                : chatMode === "general"              ? "Ask a plant question…"
                :                                       "Choose a chat type first…"
              }
            />
            <button onClick={sendMessage}
              disabled={loading || !chatMode || (chatMode === "plant" && !selectedPlant)}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all hover:scale-105 active:scale-95">
              <Send size={15}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}