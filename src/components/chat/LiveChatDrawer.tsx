import React, { useState, useEffect } from "react";
import { X, Send, MessageCircle, Store, User, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { ChatMessage, Shop } from "../../types";
import { formatDate } from "../../utils/barcode";

interface LiveChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  customerId: string;
  customerName: string;
  senderRole: "customer" | "seller";
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({
  isOpen,
  onClose,
  shop,
  customerId,
  customerName,
  senderRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const shopId = shop?.id || "shop-1";
  const shopName = shop?.name || "Neighborhood Kirana";
  const shopOwner = shop?.ownerName || "Shopkeeper";
  const conversationId = `conv-${customerId}-${shopId}`;

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, conversationId]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          shopId,
          senderId: customerId,
          senderName: customerName,
          senderRole,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, data.data]);
          if (!textToSend) setInputText("");
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const quickCustomerReplies = [
    "Is this product available right now?",
    "I am reaching in 10 minutes!",
    "Can I pay via UPI when I arrive?",
    "Please pack 1 kg more potatoes if available.",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="bg-neutral-900 border-l border-neutral-800 w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
        {/* Header with Back and Clear Options */}
        <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              id="livechat-back-btn"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm group active:scale-95 shrink-0"
              title="Back to Store"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>

            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm text-white truncate">{shopName}</h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-400 flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Shopkeeper {shopOwner}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="livechat-clear-btn"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 border border-neutral-800 hover:border-rose-500/40 flex items-center gap-1 transition-colors disabled:opacity-40 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-400"
              title="Clear messages view"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Clear</span>
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              title="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 space-y-1">
              <MessageCircle className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
              <p>Direct chat with {shop.name}.</p>
              <p className="text-[11px]">Ask about specific items, bulk orders, or arrival times.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === senderRole;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="text-[10px] text-neutral-400 mb-0.5 font-medium px-1">
                    {m.senderName}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-none"
                        : "bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-neutral-500 font-mono mt-0.5 px-1">
                    {formatDate(m.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Suggestion Chips for Customer */}
        {senderRole === "customer" && (
          <div className="px-4 py-2 bg-neutral-950/60 border-t border-neutral-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {quickCustomerReplies.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message to shopkeeper..."
              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
