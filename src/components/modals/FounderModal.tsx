import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Award,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  Store,
  Send,
} from "lucide-react";
import { sounds } from "../../utils/audio";

interface FounderModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "hi";
}

export const FounderModal: React.FC<FounderModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isHindi = language === "hi";
  const [copiedField, setCopiedField] = useState<"phone" | "email" | null>(null);
  const [quickMsg, setQuickMsg] = useState("");

  if (!isOpen) return null;

  const founderData = {
    name: "Utkarsh Yadav",
    roleEn: "Founder & Chief Architect",
    roleHi: "संस्थापक एवं मुख्य वास्तुकार",
    phone: "9554460651",
    formattedPhone: "+91 9554460651",
    email: "utkarshyadav752@gmail.com",
    locationEn: "Uttar Pradesh, India",
    locationHi: "उत्तर प्रदेश, भारत",
    whatsappLink:
      "https://wa.me/919554460651?text=" +
      encodeURIComponent("Namaste Utkarsh ji, I am contacting you directly from KiranaSetu."),
  };

  const handleCopy = (text: string, field: "phone" | "email") => {
    navigator.clipboard.writeText(text);
    sounds.playScanBeep();
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.trim()) return;
    sounds.playSuccessChime();
    const encoded = encodeURIComponent(
      `Hello Utkarsh ji, message from KiranaSetu: "${quickMsg.trim()}"`
    );
    window.open(`https://wa.me/919554460651?text=${encoded}`, "_blank");
    setQuickMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Banner */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/40 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{isHindi ? "संस्थापक विवरण" : "Founder Details"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {isHindi ? "सत्यापित" : "Verified"}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                KiranaSetu • Direct Founder Helpline
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClickSoft();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-200">
          {/* Founder Profile Top Card */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 to-yellow-400">
                <div className="w-full h-full rounded-[14px] bg-neutral-950 flex flex-col items-center justify-center text-amber-400">
                  <User className="w-9 h-9" />
                  <span className="text-[9px] font-black uppercase text-amber-200">UY</span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 text-neutral-950">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-xl font-black text-white">{founderData.name}</h3>
                  <p className="text-xs font-semibold text-amber-400">
                    {isHindi ? founderData.roleHi : founderData.roleEn}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 self-center sm:self-start">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{isHindi ? founderData.locationHi : founderData.locationEn}</span>
                </span>
              </div>
              <p className="text-xs text-neutral-300 pt-1 leading-relaxed">
                {isHindi
                  ? "किरानासेतु के संस्थापक। भारतीय किराना व्यापार को सशक्त, स्वतंत्र और कमीशन-मुक्त बनाने के लिए समर्पित।"
                  : "Creator of KiranaSetu. Dedicated to modernizing India's kirana ecosystem with zero commissions and high-speed local POS."}
              </p>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone Card */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHindi ? "फोन नंबर (कॉल करें)" : "Phone Number"}</span>
                </span>
                <button
                  onClick={() => handleCopy(founderData.phone, "phone")}
                  className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] text-neutral-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  {copiedField === "phone" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{isHindi ? "कॉपी हुआ" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isHindi ? "कॉपी" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-base font-mono font-bold text-white">
                {founderData.formattedPhone}
              </div>
              <a
                href={`tel:${founderData.phone}`}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isHindi ? "अभी कॉल करें" : "Call Directly"}</span>
              </a>
            </div>

            {/* Email Card */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isHindi ? "ईमेल आईडी" : "Email Address"}</span>
                </span>
                <button
                  onClick={() => handleCopy(founderData.email, "email")}
                  className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] text-neutral-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{isHindi ? "कॉपी हुआ" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isHindi ? "कॉपी" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs font-mono font-bold text-white truncate">
                {founderData.email}
              </div>
              <a
                href={`mailto:${founderData.email}?subject=Inquiry%20from%20KiranaSetu`}
                className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{isHindi ? "ईमेल भेजें" : "Send Email"}</span>
              </a>
            </div>
          </div>

          {/* WhatsApp Direct Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isHindi ? "उत्कर्ष यादव से व्हाट्सएप चैट" : "Direct WhatsApp with Utkarsh Yadav"}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {isHindi
                    ? "दुकानदार ऑनबोर्डिंग, सहायता व किसी भी सुझाव के लिए"
                    : "For merchant onboarding, tech support, or direct feedback"}
                </div>
              </div>
            </div>

            <a
              href={founderData.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md flex-shrink-0"
            >
              <span>{isHindi ? "व्हाट्सएप खोलें" : "Open WhatsApp"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Direct WhatsApp input */}
          <form
            onSubmit={handleSendQuickMessage}
            className="rounded-2xl bg-neutral-950 p-2.5 border border-neutral-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={quickMsg}
              onChange={(e) => setQuickMsg(e.target.value)}
              placeholder={
                isHindi
                  ? "उत्कर्ष जी को तुरंत संदेश लिखें..."
                  : "Quick message to founder..."
              }
              className="flex-1 bg-transparent border-0 text-xs text-white placeholder-neutral-500 focus:outline-none px-2"
            />
            <button
              type="submit"
              disabled={!quickMsg.trim()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{isHindi ? "भेजें" : "Send"}</span>
            </button>
          </form>

          {/* Founder's Guarantee */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isHindi ? "संस्थापक की गारंटी" : "Founder's Personal Assurance"}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isHindi
                ? "किरानासेतु 100% शून्य कमीशन प्लेटफॉर्म है। यदि किसी दुकानदार या ग्राहक को किसी भी स्तर पर सहायता की आवश्यकता हो, तो उत्कर्ष यादव से सीधे 9554460651 पर संपर्क कर सकते हैं।"
                : "KiranaSetu is built on 100% zero commissions. If any store owner or customer faces any hurdle, you have a direct hotline to Utkarsh Yadav at +91 9554460651."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>KiranaSetu • Utkarsh Yadav</span>
          <button
            onClick={() => {
              sounds.playClickSoft();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs"
          >
            {isHindi ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
