import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Upload,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Check,
  UserCheck,
  Eye,
  FileText,
  BadgePercent,
  Package,
  Layers,
  HelpCircle,
  Share2,
} from "lucide-react";
import { SellerUser, MsmeVerificationData, MsmeVerificationStatus, Shop } from "../../types";
import { sounds } from "../../utils/audio";

interface MsmeVerificationSectionProps {
  shop: Shop;
  sellerUser?: SellerUser | null;
  onUpdateSeller?: (seller: SellerUser) => void;
  language: "en" | "hi";
}

interface TeamSubmissionRecord {
  sellerId: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  verification: MsmeVerificationData;
}

export const MsmeVerificationSection: React.FC<MsmeVerificationSectionProps> = ({
  shop,
  sellerUser,
  onUpdateSeller,
  language,
}) => {
  const isHindi = language === "hi";

  // Current merchant verification state
  const [verification, setVerification] = useState<MsmeVerificationData>(() => {
    return (
      sellerUser?.msmeVerification || {
        status: "unsubmitted",
        udyamNumber: "",
        enterpriseName: shop.name || "",
        enterpriseType: "Micro",
        businessCategory: "Kirana & FMCG",
        panNumber: "",
        state: shop.city || "Karnataka",
        district: shop.area || "Bengaluru",
        b2bBadgeUnlocked: false,
      }
    );
  });

  // Form input states
  const [docNumber, setDocNumber] = useState(verification.udyamNumber || "");
  const [enterpriseName, setEnterpriseName] = useState(verification.enterpriseName || shop.name);
  const [enterpriseType, setEnterpriseType] = useState<"Micro" | "Small" | "Medium">(
    verification.enterpriseType || "Micro"
  );
  const [businessCategory, setBusinessCategory] = useState<
    "Retail Store" | "Wholesale Trader" | "Refurbished Electronics (B2B SuperSale)" | "Kirana & FMCG" | "General Merchant"
  >(verification.businessCategory || "Kirana & FMCG");
  const [panNumber, setPanNumber] = useState(verification.panNumber || "");
  const [stateName, setStateName] = useState(verification.state || "Karnataka");
  const [districtName, setDistrictName] = useState(verification.district || "Bengaluru");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Verification Team Officer Desk Mode toggle
  const [isTeamDeskOpen, setIsTeamDeskOpen] = useState(false);
  const [teamSubmissions, setTeamSubmissions] = useState<TeamSubmissionRecord[]>([]);
  const [loadingTeamData, setLoadingTeamData] = useState(false);
  const [reviewActionMsg, setReviewActionMsg] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("Document number not found in MSME Udyam records");
  const [selectedRejectSellerId, setSelectedRejectSellerId] = useState<string | null>(null);

  // Sync with sellerUser prop if it updates
  useEffect(() => {
    if (sellerUser?.msmeVerification) {
      setVerification(sellerUser.msmeVerification);
      setDocNumber(sellerUser.msmeVerification.udyamNumber || "");
      setEnterpriseName(sellerUser.msmeVerification.enterpriseName || shop.name);
      setEnterpriseType(sellerUser.msmeVerification.enterpriseType || "Micro");
      setBusinessCategory(sellerUser.msmeVerification.businessCategory || "Kirana & FMCG");
      setPanNumber(sellerUser.msmeVerification.panNumber || "");
    }
  }, [sellerUser]);

  // Load Team Submissions when Team Desk is active
  const loadTeamDesk = async () => {
    setLoadingTeamData(true);
    try {
      const res = await fetch("/api/admin/msme-verifications");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTeamSubmissions(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeamData(false);
    }
  };

  useEffect(() => {
    if (isTeamDeskOpen) {
      loadTeamDesk();
    }
  }, [isTeamDeskOpen]);

  // Quick helper to validate Udyam format: UDYAM-XX-00-0000000
  const isUdyamFormatValid = (num: string): boolean => {
    const clean = num.trim().toUpperCase();
    return /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(clean);
  };

  // Sample valid number auto-fill helper for quick testing
  const handleAutoFillSample = () => {
    sounds.playScanBeep();
    const sampleNumbers = [
      "UDYAM-KR-03-0044521",
      "UDYAM-MH-01-0089124",
      "UDYAM-DL-05-0019283",
      "UDYAM-UP-12-0038472",
    ];
    const picked = sampleNumbers[Math.floor(Math.random() * sampleNumbers.length)];
    setDocNumber(picked);
    setEnterpriseName(shop.name || "Shri Krishna Kirana & Provisions");
    setPanNumber("ABCDE1234F");
  };

  // 1. Merchant Submits Document Number for Team Review
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setSubmitError(isHindi ? "कृपया अपना उद्यम/एमएसएमई दस्तावेज़ नंबर दर्ज करें।" : "Please enter your Udyam/MSME document number.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    const activeSellerId = sellerUser?.id || "seller-1";

    try {
      const res = await fetch("/api/seller/msme-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: activeSellerId,
          udyamNumber: docNumber.trim(),
          enterpriseName: enterpriseName.trim(),
          enterpriseType,
          businessCategory,
          panNumber: panNumber.trim(),
          state: stateName,
          district: districtName,
          certificateUrl: "https://udyamregistration.gov.in/sample_certificate.pdf",
        }),
      });

      const data = await res.json();
      if (data.success && data.verification) {
        sounds.playSuccessChime();
        setVerification(data.verification);
        setSubmitSuccessMsg(
          isHindi
            ? `✓ दस्तावेज़ ${data.verification.udyamNumber} सफलतापूर्वक सबमिट हुआ! हमारी टीम 2-4 घंटे में सत्यापन पूरा करेगी।`
            : `✓ Document ${data.verification.udyamNumber} submitted! KiranaSetu Verification Team will cross-check within 2-4 hours.`
        );

        if (onUpdateSeller && data.seller) {
          onUpdateSeller(data.seller);
        }
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit document number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Team Officer Reviews Submission (Approve / Reject)
  const handleTeamReview = async (
    targetSellerId: string,
    decision: "verified" | "rejected",
    reason?: string
  ) => {
    sounds.playScanBeep();
    setReviewActionMsg(null);

    try {
      const res = await fetch("/api/admin/msme-verification/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: targetSellerId,
          decision,
          reviewedBy: "KiranaSetu Verification Team Officer #104",
          rejectionReason: reason || (decision === "rejected" ? rejectionReasonInput : undefined),
          reviewerNotes:
            decision === "verified"
              ? "Verified against Ministry of MSME Udyam National Database. Active micro enterprise."
              : `Verification rejected: ${reason || rejectionReasonInput}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playSuccessChime();
        setReviewActionMsg(
          `✓ Merchant ${decision === "verified" ? "APPROVED & VERIFIED" : "REJECTED"} successfully!`
        );

        // If target is current active seller, update current seller state
        if (targetSellerId === (sellerUser?.id || "seller-1")) {
          setVerification(data.verification);
          if (onUpdateSeller && data.seller) {
            onUpdateSeller(data.seller);
          }
        }

        // Refresh team submissions list
        loadTeamDesk();
        setSelectedRejectSellerId(null);
      } else {
        alert(data.error || "Review action failed");
      }
    } catch (err: any) {
      alert("Error performing team review: " + err.message);
    }
  };

  // Share Verification on WhatsApp
  const handleShareVerifiedWhatsApp = () => {
    const text = encodeURIComponent(
      `*KiranaSetu Verified MSME Partner Certificate*\n\n` +
      `Business: ${verification.enterpriseName}\n` +
      `Udyam Registration #: ${verification.udyamNumber}\n` +
      `Category: ${verification.businessCategory} (${verification.enterpriseType})\n` +
      `Status: Officially Verified by KiranaSetu Compliance Team ✓\n` +
      `B2B SuperSale Wholesale Tier: Active 🛡️`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div id="msme-verification-section" className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      {/* ============================================================
          TOP HERO BANNER: CASHIFY SUPERSALE B2B PARTNER MODEL
      ============================================================ */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {isHindi ? "एमएसएमई व्यापार सत्यापन (MSME B2B Verification)" : "MSME B2B Merchant Verification"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500/30 to-emerald-500/30 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Cashify SuperSale Tier
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                {isHindi
                  ? "कैशिफाई सुपरसेल (Cashify SuperSale) की तर्ज पर B2B थोक लॉट, भारी छूट और व्यापारिक इनवॉइस अनलॉक करने हेतु अपना उद्यम दस्तावेज़ नंबर दर्ज करें। हमारी टीम सरकारी एमएसएमई पोर्टल से इसका सत्यापन करेगी।"
                  : "Similar to the Cashify SuperSale B2B merchant verification model: enter your Government Udyam / MSME document number. Our verification team will inspect authenticity to activate wholesale trade pricing & GST input credit."}
              </p>
            </div>
          </div>

          {/* Quick Team Desk Switcher Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="toggle-team-desk-btn"
              onClick={() => {
                sounds.playScanBeep();
                setIsTeamDeskOpen(!isTeamDeskOpen);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-md ${
                isTeamDeskOpen
                  ? "bg-emerald-500 text-neutral-950 border-emerald-400"
                  : "bg-neutral-850 hover:bg-neutral-800 text-neutral-200 border-neutral-700"
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>
                {isTeamDeskOpen
                  ? isHindi ? "मर्चेंट फॉर्म पर वापस" : "Back to Merchant View"
                  : isHindi ? "🛠️ सत्यापन टीम डेस्क (Officer Desk)" : "🛠️ Verification Team Desk"}
              </span>
            </button>
          </div>
        </div>

        {/* Current Verification Status Callout Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              verification.status === "verified"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : verification.status === "pending_review"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : verification.status === "rejected"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-neutral-950 border-neutral-800 text-neutral-400"
            }`}
          >
            <div className="shrink-0">
              {verification.status === "verified" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              {verification.status === "pending_review" && <Clock className="w-8 h-8 text-amber-400 animate-spin" />}
              {verification.status === "rejected" && <XCircle className="w-8 h-8 text-rose-400" />}
              {verification.status === "unsubmitted" && <AlertTriangle className="w-8 h-8 text-amber-400" />}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                {isHindi ? "सत्यापन स्थिति" : "Current Verification Status"}
              </div>
              <div className="text-sm font-black text-white">
                {verification.status === "verified" && (isHindi ? "सत्यापित B2B पार्टनर ✓" : "Verified MSME Partner ✓")}
                {verification.status === "pending_review" && (isHindi ? "समीक्षा प्रगति पर है (Pending)" : "Pending Team Review")}
                {verification.status === "rejected" && (isHindi ? "सत्यापन अस्वीकृत (Rejected)" : "Verification Rejected")}
                {verification.status === "unsubmitted" && (isHindi ? "दस्तावेज़ सबमिट नहीं हुआ" : "Document Not Submitted")}
              </div>
            </div>
          </div>

          {/* Document Number Display */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              {isHindi ? "पंजीकृत दस्तावेज़ नंबर" : "Submitted Document #"}
            </div>
            <div className="text-sm font-mono font-bold text-neutral-100 truncate">
              {verification.udyamNumber || (
                <span className="text-neutral-500 font-normal italic">
                  {isHindi ? "कोई नंबर सबमिट नहीं किया गया" : "No document number submitted yet"}
                </span>
              )}
            </div>
            {verification.udyamNumber && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Format: Ministry of MSME Udyam</span>
              </span>
            )}
          </div>

          {/* Wholesale B2B Tier Perk */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center justify-between">
              <span>{isHindi ? "B2B सुपरसेल थोक टियर" : "B2B SuperSale Wholesale Tier"}</span>
              <BadgePercent className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-black text-neutral-100 flex items-center gap-1.5">
              {verification.b2bBadgeUnlocked ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>{isHindi ? "15-30% थोक मार्जिन अनलॉक" : "15-30% Wholesale Margin Unlocked"}</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isHindi ? "टीम सत्यापन के बाद अनलॉक होगा" : "Unlocks after Team Approval"}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400">
              {verification.b2bBadgeUnlocked
                ? "Official Cashify SuperSale B2B wholesale partner badge active."
                : "Enter document number below for our team to inspect & verify."}
            </p>
          </div>
        </div>

        {/* 3-Step Visual Progress Stepper */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? "सत्यापन प्रक्रिया चरण (Verification Lifecycle)" : "Verification Process Steps"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                verification.udyamNumber
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">1. {isHindi ? "दस्तावेज़ संख्या दर्ज करें" : "Enter Document #"}</span>
                {verification.udyamNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px]">Active</span>}
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                {verification.udyamNumber ? `Submitted: ${verification.udyamNumber}` : "Merchant inputs Government Udyam / MSME number"}
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                verification.status === "verified"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                  : verification.status === "pending_review"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-200 animate-pulse"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">2. {isHindi ? "हमारी टीम द्वारा सत्यापन" : "Our Team Verification Desk"}</span>
                {verification.status === "verified" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {verification.status === "pending_review" && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                {verification.status === "verified"
                  ? `Approved by ${verification.reviewedBy || "Verification Team"}`
                  : "Team cross-checks document against Ministry of MSME database"}
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                verification.b2bBadgeUnlocked
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                  : "bg-neutral-950 border-neutral-800 text-neutral-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">3. {isHindi ? "B2B थोक पार्टनर अनलॉक" : "B2B Wholesale Activated"}</span>
                {verification.b2bBadgeUnlocked && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                {verification.b2bBadgeUnlocked
                  ? "Wholesale lot rates & commercial tax invoicing active"
                  : "Requires team approval to unlock"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          VIEW A: VERIFICATION TEAM DESK (OUR TEAM VERIFYING TRUE/NOT)
      ============================================================ */}
      {isTeamDeskOpen && (
        <div className="bg-neutral-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{isHindi ? "किरानासेतु अनुपालन व सत्यापन टीम डेस्क" : "KiranaSetu Verification Team Officer Desk"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    Desk #4 • Govt MSME Portal Sync
                  </span>
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {isHindi
                  ? "यह हमारी आंतरिक टीम (Internal Verification Team) का पोर्टल है। मर्चेंट द्वारा सबमिट किए गए दस्तावेज़ नंबर को जाँचें और 'सत्यापित' या 'अस्वीकृत' करें।"
                  : "This is the internal verification portal. Inspect submitted merchant MSME documents against the Government Udyam registry, then verify or reject."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadTeamDesk}
                disabled={loadingTeamData}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingTeamData ? "animate-spin" : ""}`} />
                <span>{isHindi ? "रिफ्रेश करें" : "Refresh Queue"}</span>
              </button>
            </div>
          </div>

          {reviewActionMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reviewActionMsg}</span>
            </div>
          )}

          {/* Submissions Queue Table */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
              <span>{isHindi ? "सत्यापन प्रतीक्षा सूची (Merchant Verification Queue)" : "Merchant Verification Queue"}</span>
              <span className="text-[11px] font-mono text-amber-400">
                {teamSubmissions.length} Registered Merchants
              </span>
            </div>

            <div className="space-y-3">
              {teamSubmissions.map((sub) => {
                const isValidFormat = isUdyamFormatValid(sub.verification.udyamNumber);
                const isCurrentApproved = sub.verification.status === "verified";
                const isCurrentRejected = sub.verification.status === "rejected";

                return (
                  <div
                    key={sub.sellerId}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-white">{sub.shopName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              sub.verification.status === "verified"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : sub.verification.status === "pending_review"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {sub.verification.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Owner: <span className="text-neutral-200">{sub.ownerName}</span> • Phone:{" "}
                          <span className="text-neutral-200">{sub.phone}</span>
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <div className="text-neutral-400 text-[11px]">Submitted Document:</div>
                        <div className="font-mono font-bold text-amber-300 text-sm">
                          {sub.verification.udyamNumber || "No document #"}
                        </div>
                      </div>
                    </div>

                    {/* Verification Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="text-[10px] text-neutral-500">Enterprise Type</div>
                        <div className="font-bold text-neutral-200">{sub.verification.enterpriseType}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="text-[10px] text-neutral-500">B2B Category</div>
                        <div className="font-bold text-neutral-200 truncate">{sub.verification.businessCategory}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="text-[10px] text-neutral-500">Govt Format Check</div>
                        <div className={`font-bold flex items-center gap-1 ${isValidFormat ? "text-emerald-400" : "text-amber-400"}`}>
                          {isValidFormat ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{isValidFormat ? "Valid UDYAM Format" : "Standard Format"}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="text-[10px] text-neutral-500">Owner PAN Match</div>
                        <div className="font-mono font-bold text-neutral-200">{sub.verification.panNumber || "AAAAA0000A"}</div>
                      </div>
                    </div>

                    {sub.verification.reviewerNotes && (
                      <div className="text-[11px] text-neutral-400 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>Team Notes: {sub.verification.reviewerNotes}</span>
                      </div>
                    )}

                    {/* Team Review Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {sub.verification.reviewedBy && (
                          <span>Last review: {sub.verification.reviewedBy}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedRejectSellerId === sub.sellerId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rejectionReasonInput}
                              onChange={(e) => setRejectionReasonInput(e.target.value)}
                              placeholder="Reason for rejection..."
                              className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleTeamReview(sub.sellerId, "rejected", rejectionReasonInput)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
                            >
                              Confirm Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedRejectSellerId(null)}
                              className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedRejectSellerId(sub.sellerId)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 border border-neutral-800 hover:border-rose-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>{isHindi ? "अस्वीकार करें (Reject)" : "Reject"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTeamReview(sub.sellerId, "verified")}
                              disabled={isCurrentApproved}
                              className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                                isCurrentApproved
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                                  : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 active:scale-95 shadow-emerald-500/20"
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isCurrentApproved ? (isHindi ? "सत्यापित है ✓" : "Already Verified ✓") : (isHindi ? "सत्यापित करें (Approve)" : "Approve & Verify")}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW B: MERCHANT SUBMISSION FORM & DETAILS
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column (2/3 width) */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <span>{isHindi ? "एमएसएमई दस्तावेज़ संख्या दर्ज करें" : "Enter MSME / Udyam Document Number"}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isHindi
                  ? "अपनी फर्म का सरकारी Udyam नंबर दर्ज करें। हमारी टीम 2-4 घंटे में सत्यापन करेगी।"
                  : "Submit your official MSME registration number for our team to verify."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoFillSample}
              className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors flex items-center gap-1"
              title="Auto-fill sample verified Udyam number for testing"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isHindi ? "सैंपल नंबर भरें" : "Auto-fill Sample"}</span>
            </button>
          </div>

          {submitSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{submitSuccessMsg}</span>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitVerification} className="space-y-4">
            {/* Document Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 flex items-center justify-between">
                <span>{isHindi ? "उद्यम पंजीकरण संख्या (Udyam Registration Number) *" : "MSME / Udyam Registration Number *"}</span>
                <span className="text-[10px] text-neutral-500 font-mono">Format: UDYAM-XX-00-0000000</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. UDYAM-KR-03-0044521"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 font-mono text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 uppercase tracking-wider"
                />
                {docNumber && (
                  <span className="absolute right-3 top-2.5 text-xs">
                    {isUdyamFormatValid(docNumber) ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Valid Format</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px]">Standard Format</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Enterprise Name & PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  {isHindi ? "उद्यम/फर्म का नाम (Enterprise Name) *" : "Enterprise / Firm Registered Name *"}
                </label>
                <input
                  type="text"
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  placeholder="e.g. Shri Krishna Kirana & Provisions"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  {isHindi ? "मालिक/फर्म पैन कार्ड नंबर (Owner PAN) *" : "Owner / Enterprise PAN Number *"}
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 font-mono text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
            </div>

            {/* Enterprise Classification & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  {isHindi ? "उद्यम श्रेणी (Enterprise Classification)" : "Enterprise Classification"}
                </label>
                <select
                  value={enterpriseType}
                  onChange={(e: any) => setEnterpriseType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Micro">Micro Enterprise (सूक्ष्म - Investment &lt; ₹1 Cr)</option>
                  <option value="Small">Small Enterprise (लघु - Investment &lt; ₹10 Cr)</option>
                  <option value="Medium">Medium Enterprise (मध्यम - Investment &lt; ₹50 Cr)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  {isHindi ? "B2B व्यवसाय श्रेणी (B2B Business Category)" : "B2B Business Category"}
                </label>
                <select
                  value={businessCategory}
                  onChange={(e: any) => setBusinessCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Kirana & FMCG">Kirana & FMCG Provisions</option>
                  <option value="Wholesale Trader">Wholesale Trader & Distributor</option>
                  <option value="Refurbished Electronics (B2B SuperSale)">
                    Refurbished Electronics (Cashify SuperSale B2B)
                  </option>
                  <option value="Retail Store">Retail Store & General Merchant</option>
                  <option value="General Merchant">General Commercial Trader</option>
                </select>
              </div>
            </div>

            {/* State & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  {isHindi ? "राज्य (State)" : "State"}
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  {isHindi ? "ज़िला (District)" : "District"}
                </label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Submission Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-neutral-400">
                {isHindi
                  ? "सबमिट करने पर सत्यापन टीम को अलर्ट भेजा जाएगा।"
                  : "Submission notifies our compliance team for manual review."}
              </div>

              <button
                type="submit"
                id="submit-msme-verification-btn"
                disabled={isSubmitting || !docNumber.trim()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:brightness-110 disabled:opacity-40 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isHindi ? "सबमिट हो रहा है..." : "Submitting to Team..."
                    : isHindi ? "सत्यापन हेतु सबमिट करें (Submit for Team Review)" : "Submit for Team Verification"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Perks & B2B Wholesale Tier Card (1/3 width) */}
        <div className="space-y-4">
          {/* Cashify SuperSale Perks Card */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-xs sm:text-sm text-white">
                {isHindi ? "B2B सत्यापन के लाभ" : "Cashify SuperSale B2B Perks"}
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>15-30% Bulk Discount</strong>: Direct factory and distributor lots on FMCG and consumer electronics.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Commercial GST Tax Invoices</strong>: Claim 100% Input Tax Credit (ITC) for your enterprise.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Verified B2B Badge</strong>: Displayed to local customers and wholesale suppliers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Priority Buyback & Credit Line</strong>: Faster 2-day invoice settlements.
                </span>
              </li>
            </ul>

            {verification.status === "verified" && (
              <div className="pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleShareVerifiedWhatsApp}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isHindi ? "व्हाट्सएप पर प्रमाणपत्र साझा करें" : "Share B2B Certificate on WhatsApp"}</span>
                </button>
              </div>
            )}
          </div>

          {/* SLA Info Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h5 className="font-bold text-xs text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHindi ? "सत्यापन समय व नियम (Team SLA)" : "Team Verification SLA"}</span>
            </h5>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {isHindi
                ? "हमारी अनुपालन टीम सोमवार से शनिवार सुबह 9 बजे से रात 9 बजे तक सक्रिय रहती है। सबमिट किए जाने के बाद 2 से 4 घंटे के भीतर सरकारी पोर्टल से मिलान कर अनुमोदन दिया जाता है।"
                : "Our verification team operates 9 AM – 9 PM IST. Documents are cross-referenced with national databases within 2-4 business hours."}
            </p>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <div className="font-semibold text-neutral-200">How our team verifies:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-neutral-400">
                <li>Udyam registration certificate matching</li>
                <li>Enterprise active status confirmation</li>
                <li>Owner PAN / Aadhaar consistency check</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
