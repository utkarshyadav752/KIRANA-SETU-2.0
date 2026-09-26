import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  X,
  Zap,
  Volume2,
  VolumeX,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RotateCcw,
  Sparkles,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { sounds } from "../utils/audio";
import { SAMPLE_BARCODES } from "../utils/barcode";
import { getTranslation, Language } from "../utils/translations";

export type ScannerMode = "billing" | "add_stock" | "verify" | "lookup";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  mode?: ScannerMode;
  continuous?: boolean;
  title?: string;
  subtitle?: string;
  language?: Language;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  mode = "billing",
  continuous = true,
  title,
  subtitle,
  language = "en",
}) => {
  const t = getTranslation(language);
  const isHindi = language === "hi";

  const [isContinuous, setIsContinuous] = useState(continuous);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [recentScan, setRecentScan] = useState<{ code: string; time: string } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanCodeRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsContinuous(continuous);
  }, [continuous]);

  // Handle Barcode Scanned with Cooldown (Anti-Duplicate Burst)
  const handleBarcodeTrigger = (code: string) => {
    if (!code) return;
    const cleanCode = code.trim();
    const now = Date.now();

    // Prevent immediate duplicate bursts within 1.5s
    if (cleanCode === lastScanCodeRef.current && now - lastScanTimeRef.current < 1500) {
      return;
    }

    lastScanCodeRef.current = cleanCode;
    lastScanTimeRef.current = now;

    if (soundEnabled) {
      sounds.playScanBeep();
    }

    setScanCount((prev) => prev + 1);
    setRecentScan({
      code: cleanCode,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    });

    onScan(cleanCode);

    if (!isContinuous) {
      handleStopScanner();
      onClose();
    }
  };

  // Start Html5Qrcode Scanner when modal opens
  useEffect(() => {
    if (!isOpen) {
      handleStopScanner();
      setScanCount(0);
      setRecentScan(null);
      return;
    }

    let isMounted = true;
    const readerElementId = "kirana-live-barcode-reader";

    const initScanner = async () => {
      setIsInitializing(true);
      setCameraError(null);

      // Brief delay to allow modal DOM mounting
      await new Promise((r) => setTimeout(r, 150));
      if (!isMounted) return;

      const container = document.getElementById(readerElementId);
      if (!container) {
        setIsInitializing(false);
        return;
      }

      try {
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              await html5QrCodeRef.current.stop();
            }
            await html5QrCodeRef.current.clear();
          } catch {}
        }

        const scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.floor(Math.min(viewfinderWidth * 0.85, 340));
              const height = Math.floor(Math.min(viewfinderHeight * 0.55, 180));
              return { width, height };
            },
            aspectRatio: 1.333333,
          },
          (decodedText) => {
            handleBarcodeTrigger(decodedText);
          },
          () => {
            // Frame non-match, ignored
          }
        );

        if (isMounted) {
          setCameraActive(true);
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.warn("Camera init issue in html5-qrcode:", err?.message || err);
        if (isMounted) {
          setCameraError(
            isHindi
              ? "कैमरा अनुमति अस्वीकृत है या कैमरा व्यस्त है। आप नीचे दिए गए उत्पादों पर टैप कर सकते हैं या कोड टाइप कर सकते हैं।"
              : "Camera access unavailable or permission not granted. You can use instant sample barcodes, upload an image, or type manually below."
          );
          setCameraActive(false);
          setIsInitializing(false);
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      handleStopScanner();
    };
  }, [isOpen]);

  const handleStopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        // Safe ignore
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
  };

  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) return;
    try {
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchEnabled } as any],
      });
      setTorchEnabled(!torchEnabled);
    } catch {
      setTorchEnabled(!torchEnabled);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeTrigger(manualCode);
    setManualCode("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("kirana-live-barcode-reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        html5QrCodeRef.current = scanner;
      }
      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        handleBarcodeTrigger(decodedText);
      }
    } catch (err) {
      alert(isHindi ? "इस छवि में कोई वैध बारकोड नहीं मिला।" : "No valid barcode found in uploaded image.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-100 flex items-center gap-2">
                <span>{title || t.scannerTitle}</span>
                {isContinuous && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 animate-pulse">
                    {t.continuousMode}
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                {subtitle || t.scannerSubtitle}
              </p>
            </div>
          </div>

          <button
            id="close-scanner-btn"
            onClick={() => {
              handleStopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {/* HTML5 QR Container */}
          <div
            id="kirana-live-barcode-reader"
            className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {isInitializing && (
            <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-2 z-10">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-400 font-mono">
                {isHindi ? "कैमरा लोड हो रहा है..." : "Initializing Barcode Camera..."}
              </span>
            </div>
          )}

          {!cameraActive && !isInitializing && (
            <div className="absolute inset-0 bg-neutral-950 p-6 flex flex-col items-center justify-center text-center text-neutral-400 space-y-3 z-10">
              <Camera className="w-10 h-10 text-neutral-600" />
              <p className="text-xs max-w-sm text-neutral-300">
                {cameraError || t.cameraPermissionDenied}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.scanFromPhoto}</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanner Reticle & Laser Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-20">
            <div className="w-4/5 h-3/5 border-2 border-dashed border-amber-400/80 rounded-2xl relative shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

              {/* Animated laser line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-bounce top-1/2" />
            </div>
          </div>

          {/* Controls Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-colors ${
                soundEnabled
                  ? "bg-black/60 text-amber-300 border-amber-500/30"
                  : "bg-black/60 text-neutral-400 border-neutral-700"
              }`}
              title={soundEnabled ? t.soundOn : t.soundOff}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleToggleTorch}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-colors ${
                torchEnabled
                  ? "bg-amber-500 text-neutral-950 border-amber-400"
                  : "bg-black/60 text-neutral-300 border-neutral-700"
              }`}
              title={t.flashTorch}
            >
              <Zap className="w-4 h-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl backdrop-blur-md border bg-black/60 text-neutral-300 border-neutral-700 hover:text-white transition-colors"
              title={t.scanFromPhoto}
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Success Banner Overlay when scan occurs */}
          {recentScan && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-950/95 border border-emerald-500/60 rounded-xl p-2.5 flex items-center justify-between text-emerald-200 text-xs shadow-lg backdrop-blur-md z-30 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {t.scannedSuccess}: <strong className="font-mono text-white">{recentScan.code}</strong>
                </span>
              </div>
              <span className="text-[10px] text-emerald-300/80 font-mono">
                {recentScan.time}
              </span>
            </div>
          )}
        </div>

        {/* Continuous Mode Toggle & Scan Count Banner */}
        <div className="px-4 py-2.5 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
            <input
              type="checkbox"
              checked={isContinuous}
              onChange={(e) => setIsContinuous(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-neutral-800 border-neutral-700"
            />
            <span className="font-medium">{t.continuousMode}</span>
          </label>

          <span className="text-neutral-400 text-[11px]">
            {isHindi ? "सत्र में कुल स्कैन:" : "Scans in session:"}{" "}
            <strong className="text-amber-400">{scanCount}</strong>
          </span>
        </div>

        {/* Manual Barcode & Fast Tap Simulator */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="manual-barcode-input"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={isHindi ? "बारकोड संख्या लिखें (जैसे 8901719114511)..." : "Type or paste barcode (e.g. 8901719114511)..."}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <button
              id="submit-manual-barcode-btn"
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs disabled:opacity-40 transition-colors"
            >
              {t.addCodeButton}
            </button>
          </form>

          {/* Quick-Tap Realistic FMCG Barcodes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 font-semibold text-neutral-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {t.quickSampleBarcodes}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">EAN-13 & QR</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_BARCODES.map((item) => (
                <button
                  key={item.barcode}
                  onClick={() => handleBarcodeTrigger(item.barcode)}
                  className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-xl text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span className="truncate">{item.category}</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {item.price > 0 ? `₹${item.price}` : "New"}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300 truncate">
                    {item.name}
                  </div>
                  <div className="text-[9px] font-mono text-neutral-400 mt-1 truncate">
                    {item.barcode}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {isHindi ? "समर्थित प्रारूप: EAN-13, EAN-8, UPC, Code-128, QR" : "Supports: EAN-13, EAN-8, UPC-A, Code-128, QR"}
          </div>
          <button
            id="done-scanning-btn"
            onClick={() => {
              handleStopScanner();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            {isContinuous && scanCount > 0 ? `${isHindi ? "पूरा हुआ" : "Done"} (${scanCount})` : t.closeScanner}
          </button>
        </div>
      </div>
    </div>
  );
};
