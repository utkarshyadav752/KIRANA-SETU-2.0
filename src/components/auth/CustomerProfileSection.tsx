import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ShoppingBag,
} from "lucide-react";
import { CustomerUser } from "../../types";
import { getTranslation, Language } from "../../utils/translations";

interface CustomerProfileSectionProps {
  customerUser?: CustomerUser | null;
  onLogout: () => void;
  onOpenCustomerAuth?: () => void;
  language: Language;
}

export const CustomerProfileSection: React.FC<CustomerProfileSectionProps> = ({
  customerUser,
  onLogout,
  onOpenCustomerAuth,
  language,
}) => {
  const t = getTranslation(language);
  const isHindi = language === "hi";

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const name = customerUser?.name || "Utkarsh Yadav";
  const email = customerUser?.email || "utkarshyadav752@gmail.com";
  const phone = customerUser?.phone || "+91 99887 76655";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">{name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t.verifiedCustomer}</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {t.customerProfileSubtitle}
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 font-mono self-start sm:self-auto">
          {isHindi ? "गूगल सत्र: सक्रिय" : "Google Session: Active"}
        </span>
      </div>

      {/* Customer Credentials */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isHindi ? "ग्राहक खाता क्रेडेंशियल्स" : "Customer Account Credentials"}</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-neutral-900">
            <span className="text-neutral-400">{t.customerNameLabel}</span>
            <span className="font-bold text-neutral-200">{name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-900">
            <span className="text-neutral-400">{isHindi ? "गूगल ईमेल:" : "Google Email:"}</span>
            <span className="font-mono text-neutral-200">{email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-400">{t.phoneInputLabel}</span>
            <span className="font-mono text-emerald-400 font-bold">{phone}</span>
          </div>
        </div>
      </div>

      {/* Security Rule Warning Note */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
        <div className="space-y-1">
          <div className="font-bold text-white">
            {isHindi ? "सक्रिय खाता सुरक्षा प्रतिबंध" : "Active Account Restriction"}
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            {t.logoutWarningNote}
          </p>
        </div>
      </div>

      {/* Logout Action Area */}
      <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-white">
            {isHindi ? "सत्र समाप्ति (लॉगआउट)" : "Session Termination"}
          </h4>
          <p className="text-[11px] text-neutral-400">
            {isHindi
              ? "ग्राहक सत्र समाप्त करने और सुरक्षित रूप से बाहर निकलने के लिए लॉगआउट दबाएं।"
              : "Log out to end this customer session and allow new logins."}
          </p>
        </div>

        {showConfirmLogout ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.confirmLogout}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmLogout(false)}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-xs transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenCustomerAuth && (
              <button
                type="button"
                onClick={onOpenCustomerAuth}
                className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isHindi ? "खाता बदलें" : "Switch Account"}</span>
              </button>
            )}
            <button
              type="button"
              id="customer-logout-btn"
              onClick={() => setShowConfirmLogout(true)}
              className="w-full sm:w-auto px-6 py-3 bg-rose-600/90 hover:bg-rose-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logoutButtonDanger}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
