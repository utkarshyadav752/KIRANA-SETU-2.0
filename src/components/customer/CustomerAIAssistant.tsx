import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Coffee, ShoppingBag, Store } from "lucide-react";
import { Shop } from "../../types";

interface CustomerAIAssistantProps {
  selectedShop: Shop;
  language: "en" | "hi";
}

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

export const CustomerAIAssistant: React.FC<CustomerAIAssistantProps> = ({
  selectedShop,
  language,
}) => {
  const isHindi = language === "hi";
  const shopName = selectedShop?.name || "Neighborhood Kirana";
  const shopId = selectedShop?.id || "shop-1";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: isHindi
        ? `नमस्ते! मैं ${shopName} का स्मार्ट शॉपिंग असिस्टेंट हूँ। आप मुझसे रेसिपी की सामग्री (जैसे 5 लोगों की चाय), किसी सामान की उपलब्धता, या सस्ते विकल्प के बारे में पूछ सकते हैं!`
        : `Hello! I'm your local shopping guide for ${shopName}. Ask me about ingredients for recipes, whether an item is on shelf, or affordable product substitutes!`,
      time: "Just now",
    },
  ]);

  const quickChips = [
    "I need ingredients for tea for 5 people",
    "Which biscuits are fresh in stock?",
    "Find a cheaper alternative to sunflower oil",
    "Do you have Maggi and Milk available right now?",
  ];

  const handleSend = async (text?: string) => {
    const q = (text || query).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      role: "user",
      text: q,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!text) setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/customer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, shopId }),
      });
      const data = await res.json();
      const reply = data.success
        ? data.reply
        : "Sorry, I am having trouble checking shelf stock right now.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Could not reach shop inventory. Please check back shortly.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="customer-ai-assistant" className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <span>Ask My Shop AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Live Inventory Connected
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Personal shopper checking real-time shelf stock at {selectedShop.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-[11px] text-neutral-300 transition-colors disabled:opacity-50 text-left"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-3 min-h-[260px] max-h-[380px] overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 text-xs ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                m.role === "user"
                  ? "bg-amber-500 text-neutral-950 font-bold"
                  : "bg-neutral-800 text-amber-400 border border-neutral-700"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-500/20 border border-amber-500/30 text-amber-100"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-200"
              }`}
            >
              <p>{m.text}</p>
              <span className="text-[9px] text-neutral-500 font-mono block mt-1">
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 p-2">
            <Bot className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Checking shelf availability...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask: 'Ingredients for poha', 'Which brand of milk do you have?'..."
          className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
