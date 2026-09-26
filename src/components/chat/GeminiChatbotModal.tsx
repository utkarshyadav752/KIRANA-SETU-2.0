import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  RotateCcw,
  Store,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Home,
  Radio,
  Minimize2,
  Maximize2,
  MessageSquare,
  Bot,
  User,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Shop, Product, Reservation, AppView, SellerUser, CustomerUser } from "../../types";
import {
  float32To16BitPCM,
  arrayBufferToBase64,
  GeminiLiveAudioPlayer,
} from "../../utils/geminiLiveAudio";
import { sounds } from "../../utils/audio";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  actions?: Array<{ label: string; actionType: string; payload?: any }>;
}

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: AppView;
  currentShop: Shop | null;
  currentSeller: SellerUser | null;
  currentCustomer: CustomerUser | null;
  products: Product[];
  reservations: Reservation[];
  onNavigateRole: (role: AppView) => void;
  language: "en" | "hi";
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentShop,
  currentSeller,
  currentCustomer,
  products,
  reservations,
  onNavigateRole,
  language,
}) => {
  const isHindi = language === "hi";

  // Tab mode: "chat" or "live"
  const [activeTab, setActiveTab] = useState<"chat" | "live">("chat");

  // Helper to generate the initial welcoming conversation state
  const getInitialMessages = (): ChatMessage[] => {
    const welcome = isHindi
      ? `नमस्ते! मैं किरानासेतु AI सहायक हूँ। मैं आपकी किराने के सामान को 30 मिनट के लिए रिज़र्व करने, बारकोड स्कैनर ट्रबलशूटिंग और दुकान प्रबंधन में मदद कर सकता हूँ। आप क्या पूछना चाहते हैं?`
      : `Hello! I am KiranaSetu Sahayak, your context-aware support agent. I remember our conversation and can assist you with 30-minute grocery holds, barcode scanner troubleshooting, or store operations. How can I help today?`;

    return [
      {
        id: `welcome-msg-${Date.now()}`,
        role: "model",
        text: welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "🛒 Hold Groceries for 30 Min", actionType: "navigate_customer" },
          { label: "📷 Troubleshoot Barcode Scanner", actionType: "troubleshoot_scanner" },
          { label: "₹ Kirana Pro Details (₹20/mo)", actionType: "explain_pro" },
        ],
      },
    ];
  };

  // ----------------------------------------------------
  // 1. CONTEXT-AWARE CHATBOT STATE (Text & Multi-Turn Memory)
  // ----------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages());

  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isSpeechListening, setIsSpeechListening] = useState(false);

  // Clear Chat history handler
  const handleClearChat = () => {
    sounds.playScanBeep();
    setMessages(getInitialMessages());
    setInputMessage("");
    setPlayingAudioId(null);
    audioPlayerRef.current?.interrupt();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Clear Voice logs & errors handler
  const handleClearVoiceLogs = () => {
    sounds.playScanBeep();
    setLiveTranscript([]);
    setLiveError(null);
  };

  // Unified Back navigation handler
  const handleBack = () => {
    sounds.playScanBeep();
    if (activeTab === "live") {
      disconnectLive();
      setActiveTab("chat");
    } else {
      onClose();
    }
  };

  // Auto-scroll chat window
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (activeTab === "chat" && isOpen) {
      scrollToBottom();
    }
  }, [messages, activeTab, isOpen]);

  // ----------------------------------------------------
  // 2. GEMINI LIVE VOICE STREAMING STATE (Gemini 3.8 Live API)
  // ----------------------------------------------------
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [isLiveMuted, setIsLiveMuted] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"idle" | "listening" | "speaking" | "interrupted" | "error">("idle");
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);

  const liveWsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<GeminiLiveAudioPlayer | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize live audio player
  useEffect(() => {
    const player = new GeminiLiveAudioPlayer();
    player.onSpeakingChange = (speaking) => {
      if (speaking) {
        setLiveStatus("speaking");
      } else {
        setLiveStatus("listening");
      }
    };
    audioPlayerRef.current = player;

    return () => {
      player.close();
    };
  }, []);

  // Cleanup Live on modal close
  useEffect(() => {
    if (!isOpen) {
      disconnectLive();
    }
  }, [isOpen]);

  // ----------------------------------------------------
  // HANDLERS: CONTEXT-AWARE TEXT CHAT
  // ----------------------------------------------------
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    sounds.playScanBeep();

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInputMessage("");
    setIsGenerating(true);

    try {
      // Build conversation history for multi-turn context memory
      const history = messages
        .filter((m) => m.id !== "welcome-msg")
        .slice(-8)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const contextPayload = {
        userRole: currentRole,
        userName: currentSeller?.ownerName || currentCustomer?.name || "Guest Visitor",
        userPhone: currentSeller?.phone || currentCustomer?.phone || "",
        shopId: currentShop?.id || "shop-1",
      };

      const res = await fetch("/api/chat/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          context: contextPayload,
        }),
      });

      const data = await res.json();

      if (data.success) {
        sounds.playSuccessChime();
        const aiMsg: ChatMessage = {
          id: "ai-" + Date.now(),
          role: "model",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions: data.actions || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: "ai-err-" + Date.now(),
        role: "model",
        text: `Sorry, I encountered an issue connecting to the AI assistant (${err.message}). Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick Action execution from chat
  const handleActionClick = (action: { actionType: string; payload?: any }) => {
    sounds.playScanBeep();
    if (action.actionType === "navigate_customer") {
      onNavigateRole("customer");
      onClose();
    } else if (action.actionType === "navigate_seller") {
      onNavigateRole("seller");
      onClose();
    } else if (action.actionType === "navigate_msme") {
      onNavigateRole("seller");
      onClose();
    } else if (action.actionType === "navigate_team_desk") {
      onNavigateRole("seller");
      onClose();
    } else if (action.actionType === "troubleshoot_scanner") {
      handleSendMessage("I am having trouble with the barcode scanner. What should I check step-by-step?");
    } else if (action.actionType === "explain_pro") {
      handleSendMessage("Explain the Kirana Pro subscription benefits (₹20/mo) and zero-commission policy.");
    } else if (action.actionType === "view_holds") {
      handleSendMessage("How do 30-minute pickup holds work and how are they verified at the counter?");
    } else if (action.actionType === "call_founder") {
      window.location.href = "tel:9554460651";
    } else if (action.actionType === "email_founder") {
      window.location.href = "mailto:utkarshyadav752@gmail.com?subject=KiranaSetu%20Inquiry%20to%20Utkarsh";
    }
  };

  // Text-to-Speech playback for individual chat message
  const handlePlayTTS = async (messageId: string, text: string) => {
    if (playingAudioId === messageId) {
      setPlayingAudioId(null);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    try {
      setPlayingAudioId(messageId);
      const res = await fetch("/api/chat/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (data.success && data.audio) {
        audioPlayerRef.current?.interrupt();
        audioPlayerRef.current?.playChunk(data.audio);
      } else {
        // Fallback to browser Web Speech API
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const cleanText = (data.text || text).replace(/[#*_`~>[\]()]/g, "").slice(0, 300);
          const utter = new SpeechSynthesisUtterance(cleanText);
          utter.lang = isHindi ? "hi-IN" : "en-IN";
          utter.rate = 1.0;
          utter.pitch = 1.0;
          utter.onend = () => setPlayingAudioId(null);
          utter.onerror = () => setPlayingAudioId(null);
          window.speechSynthesis.speak(utter);
        } else {
          setPlayingAudioId(null);
        }
      }
    } catch {
      setPlayingAudioId(null);
    }
  };

  // Browser speech recognition for dictation
  const handleToggleVoiceDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isSpeechListening) {
      setIsSpeechListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isHindi ? "hi-IN" : "en-IN";

      recognition.onstart = () => {
        setIsSpeechListening(true);
        sounds.playScanBeep();
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognition.onerror = () => {
        setIsSpeechListening(false);
      };

      recognition.onend = () => {
        setIsSpeechListening(false);
      };

      recognition.start();
    } catch {
      setIsSpeechListening(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: GEMINI LIVE VOICE STREAMING (WebSocket + Live API)
  // ----------------------------------------------------
  const connectLive = async () => {
    try {
      setIsLiveConnecting(true);
      setLiveError(null);
      setLiveStatus("idle");

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;

      // 2. Setup WebSocket connection to /api/gemini/live
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        console.log("[Live Client] Connected to server WebSocket");
        setIsLiveConnected(true);
        setIsLiveConnecting(false);
        setLiveStatus("listening");
        sounds.playSuccessChime();

        // 3. Start audio capture pipeline (16kHz PCM)
        startMicCapture(stream, ws);
        startVisualizer();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "audio" && payload.audio) {
            audioPlayerRef.current?.playChunk(payload.audio);
          } else if (payload.type === "interrupted") {
            setLiveStatus("interrupted");
            audioPlayerRef.current?.interrupt();
            setTimeout(() => setLiveStatus("listening"), 800);
          } else if (payload.type === "transcript" && payload.text) {
            setLiveTranscript((prev) => [...prev.slice(-4), payload.text]);
          } else if (payload.type === "error") {
            setLiveError(payload.error || "Live API error occurred");
            setLiveStatus("error");
          }
        } catch (err) {
          console.error("[Live Client] Parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[Live Client] WebSocket error:", err);
        setLiveError("Failed to connect to Live Voice service. Please check your connection.");
        setLiveStatus("error");
        disconnectLive();
      };

      ws.onclose = () => {
        console.log("[Live Client] WebSocket closed");
        disconnectLive();
      };
    } catch (err: any) {
      console.error("[Live Client] Media/connection error:", err);
      setIsLiveConnecting(false);
      setLiveError(
        err.name === "NotAllowedError"
          ? "Microphone access was denied. Please allow microphone permissions in your browser."
          : `Failed to connect live voice: ${err.message}`
      );
      setLiveStatus("error");
    }
  };

  const startMicCapture = (stream: MediaStream, ws: WebSocket) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate: 16000 });
      micAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isLiveMuted || ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = float32To16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        ws.send(JSON.stringify({ audio: base64Audio }));
      };
    } catch (err) {
      console.error("[Live Client] Failed to start mic processing:", err);
    }
  };

  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw dynamic multi-layered sine wave
      const isSpeaking = liveStatus === "speaking";
      const isListening = liveStatus === "listening";

      const amplitude = isSpeaking ? 28 : isListening ? 14 : 4;
      const waveColor = isSpeaking ? "rgb(245, 158, 11)" : "rgb(52, 211, 153)";

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = waveColor;

      for (let x = 0; x < width; x++) {
        const y =
          centerY +
          Math.sin((x * 0.04) + phase) * amplitude * Math.sin((x / width) * Math.PI);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Secondary ghost wave
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isSpeaking ? "rgba(245, 158, 11, 0.4)" : "rgba(52, 211, 153, 0.4)";
      for (let x = 0; x < width; x++) {
        const y =
          centerY +
          Math.cos((x * 0.05) - phase) * (amplitude * 0.6) * Math.sin((x / width) * Math.PI);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      phase += isSpeaking ? 0.15 : 0.06;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const disconnectLive = () => {
    // 1. Stop mic streams
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    // 2. Disconnect audio context
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      micProcessorRef.current = null;
    }
    if (micAudioCtxRef.current && micAudioCtxRef.current.state !== "closed") {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
    // 3. Stop visualizer
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // 4. Close WebSocket
    if (liveWsRef.current) {
      if (liveWsRef.current.readyState === WebSocket.OPEN) {
        liveWsRef.current.close();
      }
      liveWsRef.current = null;
    }
    // 5. Interrupt audio player
    audioPlayerRef.current?.interrupt();

    setIsLiveConnected(false);
    setIsLiveConnecting(false);
    setLiveStatus("idle");
  };

  if (!isOpen) return null;

  return (
    <div
      id="gemini-assistant-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl h-[92vh] sm:h-[84vh] max-h-[780px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* ============================================================
            1. MODAL TOP HEADER (With Clear Back Option)
        ============================================================ */}
        <div className="px-3 sm:px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-2 sm:gap-3">
          {/* Back Button & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              id="assistant-header-back-btn"
              onClick={handleBack}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white border border-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm group active:scale-95 shrink-0"
              title={activeTab === "live" ? (isHindi ? "चैट पर वापस जाएं" : "Back to Chat") : (isHindi ? "दुकान पर वापस जाएं" : "Back to Store")}
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>{isHindi ? "वापस" : "Back"}</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 via-neutral-800 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">KiranaSetu Sahayak</h3>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Support & Live Voice</span>
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 shrink-0">
            <button
              id="tab-chat-mode"
              onClick={() => {
                sounds.playScanBeep();
                setActiveTab("chat");
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "chat"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isHindi ? "चैट" : "Chat"}</span>
            </button>

            <button
              id="tab-live-voice"
              onClick={() => {
                sounds.playScanBeep();
                setActiveTab("live");
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "live"
                  ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{isHindi ? "आवाज़" : "Voice"}</span>
            </button>
          </div>

          {/* Close button */}
          <button
            id="close-assistant-btn"
            onClick={() => {
              sounds.playScanBeep();
              disconnectLive();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================
            2. ACTIVE CONTEXT INDICATOR BAR
        ============================================================ */}
        <div className="px-4 py-2 bg-neutral-950/70 border-b border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 overflow-x-auto">
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            <span className="font-semibold text-neutral-300">Live Context:</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-mono text-[10px]">
              {currentRole === "seller"
                ? "Merchant Mode"
                : currentRole === "customer"
                ? "Customer Mode"
                : "Visitor"}
            </span>
            {currentShop && (
              <span className="flex items-center gap-1 text-neutral-300 font-medium truncate max-w-[180px]">
                <Store className="w-3 h-3 text-amber-400" />
                <span className="truncate">{currentShop.name}</span>
              </span>
            )}
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-400">{products.length} Products Tracked</span>
          </div>

          <div className="text-[10px] text-emerald-400 font-mono shrink-0 hidden sm:block">
            Memory Active • 0% Commission Network
          </div>
        </div>

        {/* ============================================================
            3. TAB CONTENT: MODE A (SMART TEXT CHAT WITH MEMORY)
        ============================================================ */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-900/50">
            {/* Chat Section Action Bar: Clear Chat & Back Option */}
            <div className="px-4 py-2 bg-neutral-950/85 border-b border-neutral-800/80 flex items-center justify-between gap-2 text-xs shrink-0">
              <button
                id="chat-back-to-store-btn"
                onClick={() => {
                  sounds.playScanBeep();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 text-xs font-semibold transition-all group active:scale-95"
                title={isHindi ? "दुकान पर वापस जाएं" : "Return to store view"}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>{isHindi ? "दुकान पर वापस (Back)" : "Back to Store"}</span>
              </button>

              <button
                id="clear-chat-history-btn"
                onClick={handleClearChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 border border-neutral-750 hover:border-rose-500/40 text-xs font-semibold transition-all active:scale-95"
                title={isHindi ? "सभी संदेश मिटाएं और नई बातचीत शुरू करें" : "Clear all messages and reset conversation"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isHindi ? "चैट साफ़ करें (Clear Chat)" : "Clear Chat"}</span>
              </button>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-amber-500 text-neutral-950"
                        : "bg-neutral-800 text-amber-400 border border-neutral-700"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-2">
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-none shadow-md"
                          : "bg-neutral-800/90 text-neutral-100 border border-neutral-700/80 rounded-tl-none shadow-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>

                    {/* AI Message Footer: Timestamp, TTS Listen Button, and Quick Actions */}
                    {msg.role === "model" && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-[10px] text-neutral-500 font-mono">{msg.timestamp}</span>

                        <button
                          onClick={() => handlePlayTTS(msg.id, msg.text)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                            playingAudioId === msg.id
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border-neutral-700"
                          }`}
                          title="Listen with Gemini TTS"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{playingAudioId === msg.id ? "Playing Voice..." : "Listen"}</span>
                        </button>

                        {/* Interactive Suggestion Chips */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="w-full flex flex-wrap gap-1.5 pt-1">
                            {msg.actions.map((act, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleActionClick(act)}
                                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all hover:scale-105"
                              >
                                <span>{act.label}</span>
                                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-2.5 mr-auto max-w-[80%]">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-amber-400 border border-neutral-700 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-neutral-800/80 border border-neutral-700/80 text-xs text-neutral-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>KiranaSetu AI is analyzing store context & inventory...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Starters */}
            <div className="px-4 py-2 border-t border-neutral-800/60 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto">
              {[
                "🛒 How do I reserve items for 30 min?",
                "📷 Troubleshoot barcode camera",
                "⏱️ When does a pickup hold expire?",
                "₹ What is Kirana Pro (₹20/mo)?",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-medium transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoiceDictation}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isSpeechListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400"
                }`}
                title="Speak to dictate message"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                id="assistant-chat-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isSpeechListening
                    ? "Listening to your voice..."
                    : isHindi
                    ? "कुछ भी पूछें... (सामान रिज़र्व, बारकोड, सहायता)"
                    : "Ask KiranaSetu assistant (reserving, troubleshooting, POS)..."
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
              />

              <button
                id="assistant-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isGenerating}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-bold flex items-center justify-center transition-all shadow-md shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            4. TAB CONTENT: MODE B (GEMINI LIVE REAL-TIME VOICE STREAMING)
        ============================================================ */}
        {activeTab === "live" && (
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-center overflow-y-auto">
            {/* Voice Section Action Toolbar: Clear & Back Options */}
            <div className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs shrink-0 mb-3 shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="voice-back-to-chat-btn"
                  onClick={() => {
                    sounds.playScanBeep();
                    disconnectLive();
                    setActiveTab("chat");
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 text-xs font-bold transition-all group active:scale-95 shadow-sm"
                  title={isHindi ? "टेक्स्ट चैट पर वापस जाएं" : "Return to text chat mode"}
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{isHindi ? "चैट पर वापस (Back)" : "Back to Chat"}</span>
                </button>

                <button
                  id="voice-back-to-store-btn"
                  onClick={() => {
                    sounds.playScanBeep();
                    disconnectLive();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium transition-colors active:scale-95"
                  title={isHindi ? "दुकान पर वापस जाएं" : "Exit to store view"}
                >
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">{isHindi ? "दुकान पर वापस" : "Back to Store"}</span>
                  <span className="xs:hidden">{isHindi ? "दुकान" : "Store"}</span>
                </button>
              </div>

              <button
                id="clear-voice-transcripts-btn"
                onClick={handleClearVoiceLogs}
                disabled={liveTranscript.length === 0 && !liveError}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 border border-neutral-800 hover:border-rose-500/40 text-xs font-semibold disabled:opacity-40 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-300 transition-all active:scale-95"
                title={isHindi ? "आवाज़ लॉग और गलतियों को मिटाएं" : "Clear live transcripts & errors"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isHindi ? "लॉग साफ़ करें (Clear)" : "Clear Voice Logs"}</span>
              </button>
            </div>

            {/* Top explanation */}
            <div className="space-y-1 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Gemini 3.8 Live Duplex Voice</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white">
                {isHindi ? "लाइव आवाज़ से बात करें" : "Talk Naturally with Your Voice"}
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                {isHindi
                  ? "दुकान काउंटर बिलिंग या ग्राहक खरीदारी के दौरान सीधे बोलकर स्टॉक, आरक्षण या समस्या समाधान पूछें।"
                  : "Hands-free voice experience powered by the Gemini Live API. Speak naturally; interrupt anytime by talking."}
              </p>
            </div>

            {/* Visualizer Stage */}
            <div className="py-4 sm:py-6 flex flex-col items-center justify-center space-y-3">
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center shadow-2xl overflow-hidden">
                {/* Visualizer Canvas */}
                <canvas
                  ref={canvasRef}
                  width={240}
                  height={240}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Center Orb */}
                <button
                  type="button"
                  id="voice-center-orb-btn"
                  onClick={() => {
                    sounds.playScanBeep();
                    if (!isLiveConnected) {
                      connectLive();
                    } else {
                      disconnectLive();
                    }
                  }}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 z-10 cursor-pointer shadow-xl hover:scale-105 active:scale-95 ${
                    !isLiveConnected
                      ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/30"
                      : liveStatus === "speaking"
                      ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/50 scale-110"
                      : "bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/40 animate-pulse"
                  }`}
                  title={isLiveConnected ? "Tap to Stop Voice" : "Tap to Start Voice Talk"}
                >
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="space-y-1">
                <div className="text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2">
                  {!isLiveConnected && !isLiveConnecting && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{isHindi ? "माइक पर टैप करें या नीचे त्वरित प्रश्न चुनें" : "Tap Mic or Select a Voice Topic Below"}</span>
                    </span>
                  )}
                  {isLiveConnecting && (
                    <span className="text-amber-400 animate-pulse">
                      Connecting to Gemini Live Voice Stream...
                    </span>
                  )}
                  {isLiveConnected && liveStatus === "listening" && (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Listening to you... Speak anytime (Hindi / English)
                    </span>
                  )}
                  {isLiveConnected && liveStatus === "speaking" && (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Gemini is Speaking (interrupt by talking)
                    </span>
                  )}
                  {isLiveConnected && liveStatus === "interrupted" && (
                    <span className="text-sky-400">Interrupted — Listening to you</span>
                  )}
                </div>

                {liveError && (
                  <div className="text-xs text-rose-400 max-w-sm mx-auto flex items-center justify-center gap-1.5 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{liveError}</span>
                  </div>
                )}
              </div>

              {/* Quick Voice Interactive Simulation Chips */}
              <div className="w-full max-w-lg space-y-1.5 pt-1">
                <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  {isHindi ? "त्वरित आवाज़ परीक्षण (Voice Prompts):" : "Quick Voice Questions:"}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[
                    { label: isHindi ? "🏢 MSME सत्यापन प्रक्रिया क्या है?" : "🏢 How to verify MSME document?", q: "How does the MSME B2B merchant verification process work like Cashify SuperSale and how does the team verify it?" },
                    { label: isHindi ? "⏱️ 30-मिनट पिकअप होल्ड कैसे लें?" : "⏱️ How do 30m pickup holds work?", q: "How do 30-minute pickup holds work and how are they verified at the counter?" },
                    { label: isHindi ? "📷 बारकोड स्कैनर ट्रबलशूट करें" : "📷 Troubleshoot barcode scanner", q: "I am having trouble with the barcode scanner. What should I check step-by-step?" },
                    { label: isHindi ? "📊 आज की कुल बिक्री व गल्ला बताएं" : "📊 Today's sales & Galla", q: "How much did we sell today and what is the galla cash drawer status?" },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={async () => {
                        sounds.playScanBeep();
                        setLiveTranscript((prev) => [...prev, `You asked: "${chip.q}"`]);
                        setLiveStatus("speaking");
                        try {
                          const res = await fetch("/api/chat/assistant", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              message: chip.q,
                              context: {
                                userRole: currentRole,
                                userName: currentSeller?.ownerName || currentCustomer?.name || "Merchant",
                                shopId: currentShop?.id || "shop-1",
                              },
                            }),
                          });
                          const data = await res.json();
                          if (data.success && data.reply) {
                            setLiveTranscript((prev) => [...prev, data.reply]);
                            // Play audio via speech synthesis
                            if ("speechSynthesis" in window) {
                              window.speechSynthesis.cancel();
                              const clean = data.reply.replace(/[#*_`~>[\]()]/g, "").slice(0, 250);
                              const utter = new SpeechSynthesisUtterance(clean);
                              utter.lang = isHindi ? "hi-IN" : "en-IN";
                              utter.onend = () => setLiveStatus("listening");
                              utter.onerror = () => setLiveStatus("listening");
                              window.speechSynthesis.speak(utter);
                            } else {
                              setLiveStatus("listening");
                            }
                          }
                        } catch {
                          setLiveStatus("listening");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500/40 text-neutral-200 hover:text-emerald-300 text-[11px] font-semibold transition-all active:scale-95"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Transcript Snippet */}
              {liveTranscript.length > 0 && (
                <div className="max-w-md w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3 text-left space-y-1">
                  <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider flex items-center justify-between">
                    <span>Live Spoken Transcript</span>
                    <button
                      onClick={handleClearVoiceLogs}
                      className="text-neutral-400 hover:text-rose-400 text-[10px] font-medium"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="text-xs text-neutral-200 leading-snug line-clamp-2">
                    {liveTranscript[liveTranscript.length - 1]}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isLiveConnected ? (
                <>
                  <button
                    id="voice-bottom-back-btn"
                    onClick={() => {
                      sounds.playScanBeep();
                      setActiveTab("chat");
                    }}
                    className="px-4 py-2.5 sm:py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white font-bold text-xs flex items-center gap-2 border border-neutral-700 transition-all hover:scale-105 active:scale-95"
                    title="Return to text chat"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <span>{isHindi ? "चैट पर वापस (Back)" : "Back to Chat"}</span>
                  </button>

                  <button
                    id="start-live-voice-btn"
                    onClick={connectLive}
                    disabled={isLiveConnecting}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>
                      {isLiveConnecting ? "Starting Voice Session..." : "Start Live Voice"}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsLiveMuted(!isLiveMuted)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      isLiveMuted
                        ? "bg-red-500/20 border-red-500/40 text-red-300"
                        : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200"
                    }`}
                  >
                    {isLiveMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isLiveMuted ? "Unmute Mic" : "Mute Mic"}</span>
                  </button>

                  <button
                    id="stop-live-voice-btn"
                    onClick={disconnectLive}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>End Voice Call</span>
                  </button>

                  <button
                    onClick={() => {
                      disconnectLive();
                      setActiveTab("chat");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Chat</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
