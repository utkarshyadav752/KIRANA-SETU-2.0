import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lock,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Star,
  Trash2,
} from "lucide-react";
import { Shop } from "../../types";

interface ShopAIAssistantProps {
  shop: Shop;
  language: "en" | "hi";
  isPremium?: boolean;
  onOpenUpgrade?: () => void;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

export const ShopAIAssistant: React.FC<ShopAIAssistantProps> = ({
  shop,
  language,
  isPremium = true,
  onOpenUpgrade,
}) => {
  const isHindi = language === "hi";

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: isHindi
        ? `नमस्ते राम लाल जी! मैं आपका "Shop AI" बिज़नेस असिस्टेंट हूँ। आज की बिक्री, कम स्टॉक, या रीऑर्डर सुझाव के बारे में कुछ भी पूछें।`
        : `Namaste Ram Lal Ji! I am your Shop AI advisor for ${shop.name}. I analyze your real-time billing and shelf inventory to help you optimize profits and prevent stockouts.`,
      time: "Just now",
    },
  ]);

  const quickPrompts = [
    "What sold the most today?",
    "Which products are low on stock?",
    "What should I restock next?",
    "Which products are slow moving?",
    "How much did I sell today?",
  ];

  const handleSend = async (textToSend?: string) => {
    if (!isPremium) {
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      role: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/shop-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, shopId: shop.id }),
      });
      const data = await res.json();
      const reply = data.success ? data.reply : "Could not retrieve store analytics right now.";

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
          text: "Error connecting to AI advisor. Please verify network or try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // FEATURE GATING PAYWALL (If seller is on free plan)
  if (!isPremium) {
    return (
      <div
        id="shop-ai-paywall"
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto space-y-6 animate-in fade-in"
      >
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white">
                  {isHindi ? "दुकान एआई सहायक (प्रीमियम लॉक)" : "Shop AI Assistant (Pro Exclusive)"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-neutral-950 uppercase tracking-wide">
                  Pro
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isHindi
                  ? "एआई सहायता और अतिरिक्त सुविधाएं केवल प्रीमियम सब्सक्राइबर्स के लिए उपलब्ध हैं।"
                  : "Gemini AI kirana intelligence and advanced features are unlocked for Pro subscribers."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              ₹20/month • ₹200/year
            </span>
          </div>
        </div>

        {/* Pricing & Plan Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {isHindi ? "मासिक प्लान" : "Monthly Plan"}
              </span>
              <span className="text-amber-400 font-mono text-xs font-bold">₹20 / mo</span>
            </div>
            <div className="text-2xl font-black text-white">
              ₹20 <span className="text-xs font-normal text-neutral-400">/{isHindi ? "महीना" : "month"}</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {isHindi ? "लचीला और किफायती, कभी भी रद्द करें।" : "Flexible billing, cancel anytime with 1 click."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border border-amber-500/40 space-y-2 relative overflow-hidden">
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-neutral-950 font-black text-[9px] rounded-md uppercase">
              {isHindi ? "सर्वोत्तम मूल्य" : "Best Value"}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                {isHindi ? "वार्षिक प्लान" : "Annual Plan"}
              </span>
              <span className="text-emerald-400 font-mono text-xs font-bold">₹200 / yr</span>
            </div>
            <div className="text-2xl font-black text-white">
              ₹200 <span className="text-xs font-normal text-neutral-400">/{isHindi ? "वर्ष" : "year"}</span>
            </div>
            <p className="text-[11px] text-amber-200/80">
              {isHindi ? "₹40 की सीधी बचत (2 महीने मुफ्त)।" : "Save ₹40 instantly (Get 2 months free)."}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? "प्रीमियम में शामिल अतिरिक्त सुविधाएं" : "Features Unlocked with Pro"}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
              <Bot className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-white">
                  {isHindi ? "Gemini किराना सह-पायलट" : "Gemini Kirana Co-Pilot"}
                </h5>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isHindi
                    ? "कम स्टॉक, एक्सपायरी, आज की बिक्री और रीऑर्डर का स्मार्ट विश्लेषण।"
                    : "Real-time query answering on shelf inventory, restock timing, and top sellers."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-white">
                  {isHindi ? "थोक मूल्य तुलना (Metro & Mandi)" : "Wholesale Price Intelligence"}
                </h5>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isHindi
                    ? "मंडी, मेट्रो और उड़ान के थोक भावों की सीधी तुलना।"
                    : "Arbitrage wholesale rates across Metro Cash & Carry, Udaan, and local Mandis."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-white">
                  {isHindi ? "स्टॉक गार्जियन प्रेडिक्टिव ऑडिट" : "Stock Guardian Telemetry"}
                </h5>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isHindi
                    ? "शेल्फ चोरी, नुकसान और एक्सपायरी का स्वचालित पूर्वानुमान।"
                    : "Shelf shrinkage risk heatmaps and predictive inventory reconciliation."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs text-white">
                  {isHindi ? "वित्तीय बहीखाता एक्सेल एक्सपोर्ट" : "Ledger & P&L Export"}
                </h5>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isHindi
                    ? "दैनिक बिक्री और जीएसटी बहीखाते को एक्सेल व सीएसवी में डाउनलोड करें।"
                    : "One-click export of invoice ledgers, GST breakdowns, and net profit analytics."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            id="unlock-pro-cta-btn"
            onClick={onOpenUpgrade}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isHindi
                ? "प्रीमियम खरीदें और एआई अनलॉक करें (₹20/माह या ₹200/वर्ष)"
                : "Subscribe to Pro & Unlock AI (₹20/month or ₹200/year)"}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE PRO AI ASSISTANT VIEW
  return (
    <div
      id="shop-ai-container"
      className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4 max-w-4xl mx-auto animate-in fade-in"
    >
      {/* Active Pro Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <span>{isHindi ? "दुकान एआई व्यापार सलाहकार" : "Shop AI Business Assistant"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 font-mono font-bold border border-amber-500/40 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>Kirana Pro Active</span>
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              {isHindi
                ? `${shop.name} की वास्तविक बिक्री और शेल्फ इन्वेंट्री पर आधारित स्मार्ट जेमिनी एआई।`
                : `Grounded exclusively in ${shop.name}'s real transactions and shelf inventory.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMessages([
                {
                  role: "assistant",
                  text: isHindi
                    ? `बातचीत रीसेट कर दी गई है। आज की बिक्री या स्टॉक के बारे में कुछ भी पूछें।`
                    : `Conversation cleared. Ask anything about today's sales, low stock, or supplier orders.`,
                  time: "Just now",
                },
              ]);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-rose-500/20 border border-neutral-800 hover:border-rose-500/40 text-[11px] text-neutral-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-3 h-3" />
            <span>{isHindi ? "साफ़ करें" : "Clear Chat"}</span>
          </button>

          {onOpenUpgrade && (
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-amber-400 font-bold transition-colors"
            >
              {isHindi ? "प्लान विवरण" : "Plan Details"}
            </button>
          )}
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="flex flex-wrap gap-1.5">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-[11px] text-neutral-300 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="space-y-3 min-h-[300px] max-h-[440px] overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
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
              <span className="text-[9px] text-neutral-500 font-mono block mt-1">{m.time}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 p-2">
            <Bot className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{isHindi ? "स्टोर डेटा और बिक्री का विश्लेषण जारी है..." : "Analyzing real-time store metrics..."}</span>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            isHindi
              ? "दुकान एआई से पूछें: जैसे आज सबसे ज़्यादा क्या बिका? कौन सा सप्लायर सस्ता है?"
              : "Ask Shop AI: e.g. How much milk did we sell? Which supplier is cheaper?"
          }
          className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{isHindi ? "पूछें" : "Ask"}</span>
        </button>
      </form>
    </div>
  );
};
