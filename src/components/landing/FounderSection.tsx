import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Award,
  Copy,
  Check,
  ExternalLink,
  Heart,
  Store,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";
import { sounds } from "../../utils/audio";

interface FounderSectionProps {
  language: "en" | "hi";
  onContactFounder?: () => void;
}

export const FounderSection: React.FC<FounderSectionProps> = ({ language }) => {
  const isHindi = language === "hi";
  const [copiedField, setCopiedField] = useState<"phone" | "email" | null>(null);
  const [quickMsg, setQuickMsg] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  const founderData = {
    name: "Utkarsh Yadav",
    roleEn: "Founder & Lead Architect",
    roleHi: "संस्थापक एवं मुख्य निर्माता",
    phone: "9554460651",
    formattedPhone: "+91 9554460651",
    email: "utkarshyadav752@gmail.com",
    locationEn: "Uttar Pradesh, India",
    locationHi: "उत्तर प्रदेश, भारत",
    whatsappLink:
      "https://wa.me/919554460651?text=" +
      encodeURIComponent("Namaste Utkarsh ji, I am connecting with you regarding KiranaSetu."),
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
      `Hello Utkarsh ji, my message from KiranaSetu: "${quickMsg.trim()}"`
    );
    window.open(`https://wa.me/919554460651?text=${encoded}`, "_blank");
    setMsgSent(true);
    setQuickMsg("");
    setTimeout(() => setMsgSent(false), 4000);
  };

  return (
    <section id="founder-section" className="relative scroll-mt-24 space-y-8">
      {/* Ambient background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5" />
          <span>{isHindi ? "संस्थापक परिचय" : "Leadership & Founder Vision"}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {isHindi ? (
            <>
              मिलिए किरानासेतु के संस्थापक{" "}
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                उत्कर्ष यादव
              </span>{" "}
              से
            </>
          ) : (
            <>
              Meet the Founder Behind KiranaSetu:{" "}
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Utkarsh Yadav
              </span>
            </>
          )}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          {isHindi
            ? "किरानासेतु को भारत के स्थानीय दुकानदारों को बहुराष्ट्रीय कंपनियों के 20-30% कमीशन से बचाने और उन्हें सुपरफास्ट डिजिटल तकनीक देने के संकल्प से बनाया गया है।"
            : "Built with the mission to equip India's 12+ million kirana merchants with zero-commission tech, 5-second barcode billing, and real-time neighborhood commerce."}
        </p>
      </div>

      {/* Main Founder Card Grid */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-neutral-900/90 border border-neutral-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Avatar & Direct Quick Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
            {/* Founder Avatar with Verified Ring */}
            <div className="relative group">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-500 shadow-xl shadow-amber-500/10 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-[22px] bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden border border-neutral-800">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/30 flex items-center justify-center text-amber-400 mb-1 border border-amber-500/30 shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-black tracking-wider text-amber-200 uppercase font-mono">
                    UY
                  </span>
                  <div className="absolute bottom-1 bg-neutral-900/90 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-neutral-800">
                    Founder
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div
                className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-500 text-neutral-950 shadow-lg border-2 border-neutral-900 flex items-center gap-1"
                title="Verified Founder"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Name & Title */}
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
                <span>{founderData.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {isHindi ? "संस्थापक" : "Founder"}
                </span>
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-neutral-400 pt-0.5">
                {isHindi ? founderData.roleHi : founderData.roleEn}
              </p>
              <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{isHindi ? founderData.locationHi : founderData.locationEn}</span>
              </p>
            </div>

            {/* Direct Connect Buttons */}
            <div className="w-full flex flex-col gap-2 pt-2">
              {/* Call Founder Button */}
              <a
                href={`tel:${founderData.phone}`}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                <span>{isHindi ? "संस्थापक को कॉल करें (+91 9554460651)" : "Call Founder (+91 9554460651)"}</span>
              </a>

              {/* WhatsApp Founder Button */}
              <a
                href={founderData.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isHindi ? "व्हाट्सएप पर बात करें" : "Chat Directly on WhatsApp"}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              {/* Email Founder Button */}
              <a
                href={`mailto:${founderData.email}?subject=KiranaSetu%20Inquiry%20for%20Utkarsh%20Yadav`}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span className="truncate">{founderData.email}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Founder's Story, Verified Details & Direct Channel (7 cols) */}
          <div className="lg:col-span-7 space-y-5 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-6 lg:pt-0 lg:pl-8">
            {/* Note from the Founder */}
            <div className="rounded-2xl bg-neutral-950/70 border border-neutral-800 p-4 sm:p-5 relative space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isHindi ? "संस्थापक का संदेश" : "Personal Note From Utkarsh"}</span>
                </span>
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{isHindi ? "सीधा संपर्क उपलब्ध" : "Direct Helpline"}</span>
                </span>
              </div>

              <blockquote className="text-xs sm:text-sm text-neutral-200 leading-relaxed italic border-l-2 border-amber-500/60 pl-3">
                {isHindi ? (
                  <>
                    "हमारा लक्ष्य केवल एक सॉफ्टवेयर बनाना नहीं है, बल्कि भारत के हर छोटे-बड़े किराना
                    दुकानदार को अपनी दुकान का असली डिजिटल मालिक बनाना है। कोई छिपी फीस नहीं, शून्य
                    कमीशन, और किसी भी परेशानी के समय सीधा मुझसे संपर्क करने की सुविधा।"
                  </>
                ) : (
                  <>
                    "KiranaSetu was created with a clear conviction: local kirana stores are the
                    economic backbone of India. They do not need predatory aggregators taking 20-30%
                    of their thin margins. They need lightning 5-second barcode billing, ironclad
                    stock guardianship, and direct customer trust. As the founder, my phone and email
                    are open to every shopkeeper and customer."
                  </>
                )}
              </blockquote>

              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <span className="font-semibold text-white">— Utkarsh Yadav</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? "सत्यापित संस्थापक प्रोफ़ाइल" : "Verified Founder Contact"}</span>
                </span>
              </div>
            </div>

            {/* Verified Contact Details Grid with 1-Click Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Detail Box */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/90 hover:border-amber-500/40 transition-colors group">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isHindi ? "सीधा फोन नंबर" : "Direct Phone / Call"}</span>
                  </span>
                  <button
                    onClick={() => handleCopy(founderData.phone, "phone")}
                    className="p-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 transition-colors text-[10px] flex items-center gap-1"
                    title="Copy Phone Number"
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
                <div className="text-sm font-mono font-bold text-white tracking-wide">
                  {founderData.formattedPhone}
                </div>
                <div className="text-[10px] text-neutral-500 pt-0.5">
                  {isHindi ? "सुबह 9 से रात 10 बजे तक उपलब्ध" : "Direct dial & WhatsApp enabled"}
                </div>
              </div>

              {/* Email Detail Box */}
              <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/90 hover:border-amber-500/40 transition-colors group">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isHindi ? "आधिकारिक ईमेल" : "Direct Email"}</span>
                  </span>
                  <button
                    onClick={() => handleCopy(founderData.email, "email")}
                    className="p-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 transition-colors text-[10px] flex items-center gap-1"
                    title="Copy Email Address"
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
                <div className="text-xs sm:text-sm font-mono font-bold text-white truncate">
                  {founderData.email}
                </div>
                <div className="text-[10px] text-neutral-500 pt-0.5">
                  {isHindi ? "24 घंटे में उत्तर की गारंटी" : "Guaranteed response within 24h"}
                </div>
              </div>
            </div>

            {/* Founder Guarantees / Core Commitments */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                {isHindi ? "संस्थापक की 3 मुख्य प्रतिज्ञाएं" : "Utkarsh's 3 Core Commitments to You"}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isHindi ? "0% कमीशन" : "0% Commission"}
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight">
                      {isHindi ? "100% मार्जिन आपका है" : "All margin stays with you"}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-2">
                  <Phone className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isHindi ? "सीधी हेल्पलाइन" : "Direct Helpline"}
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight">
                      {isHindi ? "संस्थापक से सीधा संवाद" : "Direct line to Utkarsh"}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-2">
                  <Store className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isHindi ? "भारत निर्मित" : "Made for Bharat"}
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight">
                      {isHindi ? "सरल हिंदी व आवाज़ मोड" : "Hindi + Voice assisted"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick WhatsApp message to Utkarsh form */}
            <form
              onSubmit={handleSendQuickMessage}
              className="rounded-2xl bg-neutral-950 p-3 border border-neutral-800/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                placeholder={
                  isHindi
                    ? "उत्कर्ष जी को सीधे संदेश लिखें (व्हाट्सएप खुलेगा)..."
                    : "Write a direct message to Utkarsh (opens WhatsApp)..."
                }
                className="flex-1 bg-transparent border-0 text-xs text-white placeholder-neutral-500 focus:outline-none px-2"
              />
              <button
                type="submit"
                disabled={!quickMsg.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">{isHindi ? "भेजें" : "Send"}</span>
              </button>
            </form>

            {msgSent && (
              <div className="text-xs text-emerald-400 flex items-center gap-1 pl-1">
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isHindi
                    ? "व्हाट्सएप चैट खुल गई है! उत्कर्ष जी से सीधा संवाद शुरू करें।"
                    : "WhatsApp connected! You are chatting directly with Utkarsh Yadav."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
