import React from "react";
import { ShieldAlert, LogOut, ArrowRight, X, User, Store, FileCheck2 } from "lucide-react";
import { SellerUser, CustomerUser } from "../../types";
import { getTranslation, Language } from "../../utils/translations";

interface AccountSwitchBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeller: SellerUser | null;
  currentCustomer: CustomerUser | null;
  targetRole: "seller" | "customer";
  onLogoutAndSwitch: () => void;
  language: Language;
}

export const AccountSwitchBlockModal: React.FC<AccountSwitchBlockModalProps> = ({
  isOpen,
  onClose,
  currentSeller,
  currentCustomer,
  targetRole,
  onLogoutAndSwitch,
  language,
}) => {
  if (!isOpen) return null;
  const t = getTranslation(language);
  const isHindi = language === "hi";

  const isCurrentSeller = !!currentSeller;

  return (
    <div
      id="account-switch-block-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-neutral-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                {t.cannotSwitchAccountTitle}
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">
                {isHindi ? "सक्रिय सत्र सुरक्षा नीति" : "Active Session Security Policy"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Box */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
          <span className="text-[11px] font-bold text-neutral-400 block uppercase tracking-wider">
            {isHindi ? "वर्तमान में सक्रिय खाता:" : "Currently Logged In Account:"}
          </span>

          {isCurrentSeller && currentSeller ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">
                  {currentSeller.shopName}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {currentSeller.ownerName} • {currentSeller.phone}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3" />
                  <span>
                    {isHindi ? "प्रमाणित व्यापारी:" : "Verified Proof:"}{" "}
                    {currentSeller.businessProofs?.[0]?.type || "Government Verified"}
                  </span>
                </div>
              </div>
            </div>
          ) : currentCustomer ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">
                  {currentCustomer.name}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {currentCustomer.email}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  Phone: {currentCustomer.phone}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Explanation */}
        <p className="text-xs text-neutral-300 leading-relaxed">
          {isHindi
            ? `आप पहले से एक खाते में लॉग इन हैं। ${
                targetRole === "seller" ? "दुकानदार मोड" : "ग्राहक मोड"
              } में जाने या दूसरा खाता खोलने के लिए, पहले अपने वर्तमान खाते से लॉगआउट करना आवश्यक है।`
            : `You cannot switch to ${
                targetRole === "seller" ? "Shopkeeper" : "Customer"
              } Mode or sign into another profile while an active session exists. To proceed, please log out of this account.`}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            id="modal-logout-and-switch-btn"
            onClick={onLogoutAndSwitch}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-98 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>
              {isHindi
                ? "वर्तमान खाते से लॉगआउट करें और आगे बढ़ें"
                : "Log Out Current Account & Proceed"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-2xl text-xs transition-colors"
          >
            {isHindi ? "रद्द करें (वर्तमान खाते में रहें)" : "Cancel (Stay Logged In)"}
          </button>
        </div>
      </div>
    </div>
  );
};
