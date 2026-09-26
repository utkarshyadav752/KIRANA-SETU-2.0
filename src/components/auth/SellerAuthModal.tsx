import React, { useState, useEffect } from "react";
import {
  X,
  Store,
  FileCheck2,
  Lock,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Upload,
  QrCode,
  Building2,
  Check,
  LogIn,
  BadgeCheck,
  Film,
  Play,
} from "lucide-react";
import { SellerUser, Shop, BusinessProofType, BusinessProof } from "../../types";
import { sounds } from "../../utils/audio";
import { DemoVideoPlayer } from "./DemoVideoPlayer";

interface SellerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (seller: SellerUser, shop: Shop) => void;
  language: "en" | "hi";
  initialMode?: "register" | "login";
}

const PROOF_TYPES: { type: BusinessProofType; label: string; placeholder: string; example: string }[] = [
  {
    type: "MSME",
    label: "MSME Certificate / Udyam Registration",
    placeholder: "UDYAM-XX-00-0000000",
    example: "UDYAM-KR-03-0044521",
  },
  {
    type: "GSTIN",
    label: "GSTIN Number (15 Digits)",
    placeholder: "29AAAAA0000A1Z5",
    example: "29AAAAA0000A1Z5",
  },
  {
    type: "UDYOG_AADHAAR",
    label: "Udyog Aadhaar (UAM Number)",
    placeholder: "KR03D0012345",
    example: "KR03D0012345",
  },
  {
    type: "FSSAI",
    label: "FSSAI Food License / Registration No.",
    placeholder: "14-digit FSSAI License",
    example: "11223344556677",
  },
  {
    type: "SHOP_ESTABLISHMENT",
    label: "Shop & Establishment Act (Gumasta)",
    placeholder: "Registration / License No.",
    example: "SEA/BLR/2023/9812",
  },
  {
    type: "TRADE_LICENSE",
    label: "Municipal Trade License",
    placeholder: "Trade License / BBMP / MCD No.",
    example: "TL-BBMP-892341",
  },
];

export const SellerAuthModal: React.FC<SellerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
  initialMode = "login",
}) => {
  const isHindi = language === "hi";

  const [activeTab, setActiveTab] = useState<"register" | "login">(initialMode);
  const [showDemoVideo, setShowDemoVideo] = useState<boolean>(true);

  // Sync tab on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage(null);
    }
  }, [isOpen, initialMode]);

  // Registration Form State
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dedicatedUpiId, setDedicatedUpiId] = useState("");

  // Business Proofs (Array with at least 1 proof)
  const [proofs, setProofs] = useState<
    { type: BusinessProofType; documentNumber: string; documentName?: string }[]
  >([
    {
      type: "MSME",
      documentNumber: "",
      documentName: "",
    },
  ]);

  // Login Form State (clean, empty defaults)
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Strong password checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const passedChecksCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const isPasswordStrong = passedChecksCount === 5;

  // Add another business proof row
  const handleAddProof = () => {
    const available = PROOF_TYPES.find((pt) => !proofs.some((p) => p.type === pt.type));
    setProofs((prev) => [
      ...prev,
      {
        type: available ? available.type : "GSTIN",
        documentNumber: "",
        documentName: "",
      },
    ]);
  };

  const handleRemoveProof = (idx: number) => {
    if (proofs.length <= 1) return;
    setProofs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateProof = (
    idx: number,
    field: "type" | "documentNumber" | "documentName",
    val: string
  ) => {
    setProofs((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    );
  };

  // Mock upload simulated file
  const handleMockUpload = (idx: number) => {
    sounds.playScanBeep();
    const type = proofs[idx].type;
    handleUpdateProof(idx, "documentName", `${type}_Certificate_Verified.pdf`);
  };

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate proofs (must have at least one valid proof with document number)
    const validProofs = proofs.filter((p) => p.documentNumber.trim().length >= 4);
    if (validProofs.length === 0) {
      setErrorMessage(
        "Business Proof Mandatory: You must provide at least one valid business proof (MSME certificate, GSTIN, Udyog Aadhaar, or FSSAI number)."
      );
      sounds.playWarningBuzz();
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage("Please create a strong password matching all 5 security criteria.");
      sounds.playWarningBuzz();
      return;
    }

    if (!isPasswordMatch) {
      setErrorMessage("Passwords do not match. Please re-enter your password correctly.");
      sounds.playWarningBuzz();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          shopName,
          phone,
          email,
          password,
          confirmPassword,
          businessProofs: validProofs.map((p) => {
            const conf = PROOF_TYPES.find((pt) => pt.type === p.type);
            return {
              type: p.type,
              label: conf ? conf.label : p.type,
              documentNumber: p.documentNumber,
              documentName: p.documentName || `${p.type}_Certificate.pdf`,
            };
          }),
          dedicatedUpiId: dedicatedUpiId.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to register seller");
      }

      sounds.playSuccessChime();
      onSuccess(data.seller, data.shop);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
      sounds.playWarningBuzz();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage("Please enter your registered phone/email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to log in");
      }

      sounds.playSuccessChime();
      onSuccess(data.seller, data.shop);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please verify credentials.");
      sounds.playWarningBuzz();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="seller-auth-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-neutral-100 flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-start justify-between gap-3 bg-gradient-to-b from-neutral-850 to-neutral-900">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Building2 className="w-3 h-3" />
              <span>{isHindi ? "दुकानदार पोर्टल" : "Merchant Verification Portal"}</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-white">
              {isHindi ? "किराना दुकान सत्यापन एवं लॉगिन" : "Shopkeeper Suite • KiranaSetu"}
            </h3>
            <p className="text-xs text-neutral-400 leading-snug">
              {isHindi
                ? "दुकानदारों के लिए अनिवार्य व्यावसायिक प्रमाण (MSME, GSTIN, आदि), मजबूत पासवर्ड एवं समर्पित UPI QR।"
                : "Register with your legal Business Proof (MSME, GSTIN, Udyam, etc.) & create a strong password."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800 text-xs w-full">
            <button
              type="button"
              id="seller-tab-login"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isHindi ? "मौजूदा दुकान लॉगिन" : "Login Existing Account"}</span>
            </button>
            <button
              type="button"
              id="seller-tab-register"
              onClick={() => {
                setActiveTab("register");
                setErrorMessage(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHindi ? "नई दुकान रजिस्टर करें" : "Register New Store"}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: REGISTRATION */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Existing Account Prompt Banner */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-200">
                    {isHindi ? "क्या आपकी दुकान पहले से पंजीकृत है?" : "Already have a registered Kirana store?"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold rounded-xl text-[11px] hover:bg-amber-400 transition-colors flex-shrink-0"
                >
                  {isHindi ? "मौजूदा दुकान में लॉगिन करें" : "Login Existing Account"}
                </button>
              </div>
              {/* Owner & Shop Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Lal Gupta"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                    Kirana / Shop Name *
                  </label>
                  <div className="relative">
                    <Store className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Gupta Daily Superstore"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                    Phone Number (Login ID) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                    Business Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ramesh@kirana.in"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* BUSINESS PROOF SECTION (CRITICAL: AT LEAST ONE PROOF REQUIRED) */}
              <div className="p-4 bg-neutral-950 border-2 border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                      Business Proof (At least 1 Proof Required) *
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    MSME • GSTIN • UDYAM • FSSAI
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400">
                  Select your government business registration type and enter your certificate or license number:
                </p>

                {/* Proof items list */}
                <div className="space-y-3">
                  {proofs.map((proof, idx) => {
                    const activeTypeConfig =
                      PROOF_TYPES.find((pt) => pt.type === proof.type) || PROOF_TYPES[0];
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-400">
                            Proof #{idx + 1}
                          </span>
                          {proofs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProof(idx)}
                              className="text-neutral-500 hover:text-rose-400 p-1"
                              title="Remove Proof"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Proof Type Dropdown */}
                          <div>
                            <select
                              value={proof.type}
                              onChange={(e) =>
                                handleUpdateProof(idx, "type", e.target.value as BusinessProofType)
                              }
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              {PROOF_TYPES.map((pt) => (
                                <option key={pt.type} value={pt.type}>
                                  {pt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Certificate / Document Number */}
                          <div>
                            <input
                              type="text"
                              required
                              value={proof.documentNumber}
                              onChange={(e) =>
                                handleUpdateProof(idx, "documentNumber", e.target.value)
                              }
                              placeholder={activeTypeConfig.placeholder}
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono uppercase"
                            />
                          </div>
                        </div>

                        {/* Certificate File Attachment Simulation */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-neutral-500">
                            e.g. {activeTypeConfig.example}
                          </span>
                          {proof.documentName ? (
                            <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {proof.documentName}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMockUpload(idx)}
                              className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Attach Certificate (PDF/Image)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddProof}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Proof (e.g. GSTIN + FSSAI)</span>
                </button>
              </div>

              {/* DEDICATED BUSINESS UPI QR SECTION */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Dedicated Business UPI QR (Counter Direct Settlement)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Payments during POS billing will arrive directly to your store&apos;s dedicated UPI QR with 0% platform fee.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={dedicatedUpiId}
                    onChange={(e) => setDedicatedUpiId(e.target.value)}
                    placeholder="e.g. guptakirana@okhdfcbank (or defaults to phone@upi)"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* STRONG PASSWORD & RE-ENTER PASSWORD */}
              <div className="space-y-3 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create Strong Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password */}
                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password..."
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Re-enter Password */}
                  <div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to confirm..."
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Password Strength Checklist & Bar */}
                <div className="space-y-2 pt-1 border-t border-neutral-850">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400">Security Strength:</span>
                    <span
                      className={`font-bold ${
                        passedChecksCount <= 2
                          ? "text-rose-400"
                          : passedChecksCount <= 4
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {passedChecksCount <= 2 && "Weak"}
                      {passedChecksCount > 2 && passedChecksCount < 5 && "Medium"}
                      {passedChecksCount === 5 && "Strong ✓"}
                    </span>
                  </div>

                  {/* Visual Strength Meter */}
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passedChecksCount >= 1 ? "bg-rose-500 flex-1" : "bg-neutral-800 flex-1"
                      }`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        passedChecksCount >= 3 ? "bg-amber-500 flex-1" : "bg-neutral-800 flex-1"
                      }`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        passedChecksCount === 5 ? "bg-emerald-500 flex-1" : "bg-neutral-800 flex-1"
                      }`}
                    />
                  </div>

                  {/* 5 Rule Checkmarks */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] pt-1">
                    <span
                      className={`flex items-center gap-1 ${
                        hasMinLength ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Min. 8 Characters
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasUppercase ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Uppercase (A-Z)
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasLowercase ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Lowercase (a-z)
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasNumber ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Numeric (0-9)
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        hasSpecial ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Special (!@#$)
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        isPasswordMatch ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Passwords Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                id="seller-submit-register-btn"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Registering Kirana & Verifying Proofs...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>REGISTER KIRANA & ENTER POS SUITE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: SELLER LOGIN */}
          {activeTab === "login" && (
            <div className="space-y-4">
              {/* MERCHANT DEMO VIDEO (SEPARATE VIDEO FOR MERCHANTS WITH DEDICATED SKIP OPTION) */}
              {showDemoVideo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isHindi ? "दुकानदार डेमो वीडियो (४५ सेकंड)" : "Merchant Walkthrough Video (45s)"}</span>
                    </span>
                    <button
                      type="button"
                      id="seller-login-skip-video-link"
                      onClick={() => setShowDemoVideo(false)}
                      className="text-[11px] text-neutral-400 hover:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      {isHindi ? "वीडियो छोड़ें (Skip Video)" : "Skip Video"}
                    </button>
                  </div>
                  <DemoVideoPlayer
                    role="merchant"
                    language={language}
                    onSkip={() => setShowDemoVideo(false)}
                    onComplete={() => setShowDemoVideo(false)}
                    title={isHindi ? "दुकानदार डेमो: POS बिलिंग, MSME B2B व बही-खाता" : "Merchant Demo: 1s POS, MSME B2B & Ledgers"}
                  />
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Film className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate text-xs">
                        {isHindi ? "दुकानदार POS एवं MSME डेमो वीडियो" : "Merchant Walkthrough Video"}
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {isHindi ? "बारकोड POS, Cashify SuperSale MSME व बही-खाता (४५ सेकंड)" : "1-Sec barcode POS, Cashify MSME & credit ledgers (45s)"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="seller-login-watch-video-btn"
                    onClick={() => setShowDemoVideo(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-amber-300" />
                    <span>{isHindi ? "डेमो देखें" : "Watch Demo"}</span>
                  </button>
                </div>
              )}

              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-amber-400" />
                  <span>{isHindi ? "व्यापारी खाता लॉगिन" : "Merchant Account Login"}</span>
                </p>
                <p className="text-[11px]">
                  {isHindi
                    ? "अपने स्टोर के POS, इन्वेंटरी और बिलिंग सिस्टम में प्रवेश करने के लिए अपना पंजीकृत फ़ोन नंबर या ईमेल और पासवर्ड दर्ज करें।"
                    : "Enter your registered phone number or email and password to log in to your Kirana POS and inventory."}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                    {isHindi ? "पंजीकृत फ़ोन नंबर या ईमेल *" : "Registered Phone or Email *"}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="+91 98765 43210 or email@kirana.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                      {isHindi ? "पासवर्ड *" : "Password *"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter registered password..."
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="seller-submit-login-btn"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span>{isHindi ? "प्रमाणीकरण हो रहा है..." : "Verifying Credentials..."}</span>
                    ) : (
                      <>
                        <Store className="w-4 h-4" />
                        <span>{isHindi ? "POS एवं इन्वेंटरी में लॉगिन करें" : "LOG IN TO POS & INVENTORY"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Switch Link */}
              <div className="pt-2 text-center border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMessage(null);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {isHindi
                      ? "नई किराना दुकान का पंजीकरण करना चाहते हैं? यहाँ क्लिक करें"
                      : "Need to register a new store with business proof? Register here"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
