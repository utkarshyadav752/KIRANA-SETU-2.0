import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Shop, Product } from "../../types";
import { sounds } from "../../utils/audio";

interface ShareWhatsAppCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  products: Product[];
  language?: "en" | "hi";
}

export const ShareWhatsAppCatalogModal: React.FC<ShareWhatsAppCatalogModalProps> = ({
  isOpen,
  onClose,
  shop,
  products,
  language = "hi",
}) => {
  const isHindi = language === "hi";
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build top 5-8 in-stock products
  const inStockProducts = products
    .filter((p) => p.currentStock > 0)
    .slice(0, 8);

  const productListText = inStockProducts
    .map(
      (p) =>
        `• *${p.name}* - ₹${p.sellingPrice} (${p.unit}) [${p.currentStock > 5 ? "In Stock" : "Limited"}]`
    )
    .join("\n");

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://kiranasetu.app";
  const shopName = (shop?.name || "Kirana Store").toUpperCase();
  const shopAddress = shop?.address || "Local Market";
  const shopArea = shop?.area || "Indiranagar";
  const shopPhone = shop?.phone || "+91 98765 43210";
  const shopUpi = shop?.dedicatedUpiId || shop?.upiId || "kirana@upi";

  const messageText = `🏪 *${shopName}*
📍 ${shopAddress}, ${shopArea}
📞 Contact: ${shopPhone}

नमस्ते! हमारे किराना स्टोर पर ताज़ा सामान उपलब्ध है। 
आप अपनी पसंद का सामान 30 मिनट के लिए ऑनलाइन बुक कर सकते हैं या घर बैठे व्हाट्सएप से ऑर्डर कर सकते हैं।

🛒 *आज के ताज़ा उत्पाद व रेट्स:*
${productListText}

💳 *Direct UPI ID (0% Commission):*
👉 \`${shopUpi}\`

⚡ *30-Minute Hold Booking Link:*
👉 ${appUrl}

_KiranaSetu से डिजिटल और भरोसेमंद स्थानीय किराना।_`;

  const handleCopy = () => {
    sounds.playScanBeep();
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    sounds.playScanBeep();
    const encoded = encodeURIComponent(messageText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <div
      id="share-whatsapp-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {isHindi ? "दुकान व्हाट्सएप कैटलॉग शेयर करें" : "Share Shop on WhatsApp"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? "ग्राहकों और व्हाट्सएप ग्रुप्स में 1-क्लिक कैटलॉग व बुकिंग लिंक भेजें"
                  : "Send your active stock and UPI payment link to local customers"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300 block">
              {isHindi ? "व्हाट्सएप संदेश पूर्वावलोकन:" : "WhatsApp Message Preview:"}
            </label>
            <pre className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isHindi ? "कॉपी करें" : "Copy Text"}</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isHindi ? "व्हाट्सएप पर भेजें" : "Open WhatsApp"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
