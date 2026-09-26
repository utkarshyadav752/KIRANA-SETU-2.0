import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Minus,
  Search,
  Phone,
  User,
  Share2,
  Volume2,
  Calendar,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  X,
} from "lucide-react";
import { formatINR, formatDate } from "../../utils/barcode";
import { sounds } from "../../utils/audio";
import { Shop } from "../../types";

export interface KhataEntry {
  id: string;
  date: string;
  type: "gave" | "received"; // gave = udhar diya (red), received = jama hua (green)
  amount: number;
  note: string;
  balanceAfter: number;
}

export interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  avatarBg: string;
  totalDue: number; // positive = customer owes shop (red), negative = advance
  lastActivity: string;
  entries: KhataEntry[];
}

interface DigitalKhataLedgerProps {
  shop: Shop;
  language: "en" | "hi";
  onSendWhatsApp?: (phone: string, text: string) => void;
}

const INITIAL_CUSTOMERS: KhataCustomer[] = [
  {
    id: "kh-1",
    name: "Ramesh Kumar (Gali No. 4)",
    phone: "+91 98765 43210",
    avatarBg: "from-blue-600 to-indigo-700",
    totalDue: 450,
    lastActivity: "2026-09-22",
    entries: [
      {
        id: "e-1",
        date: "2026-09-18",
        type: "gave",
        amount: 350,
        note: "Atta 5kg + Fortune Oil",
        balanceAfter: 350,
      },
      {
        id: "e-2",
        date: "2026-09-20",
        type: "received",
        amount: 200,
        note: "Cash payment",
        balanceAfter: 150,
      },
      {
        id: "e-3",
        date: "2026-09-22",
        type: "gave",
        amount: 300,
        note: "Milk + Bread + Sugar",
        balanceAfter: 450,
      },
    ],
  },
  {
    id: "kh-2",
    name: "Sunita Verma (Auntie Ji)",
    phone: "+91 98111 22334",
    avatarBg: "from-pink-600 to-rose-700",
    totalDue: 820,
    lastActivity: "2026-09-23",
    entries: [
      {
        id: "e-4",
        date: "2026-09-21",
        type: "gave",
        amount: 820,
        note: "Monthly grocery staples",
        balanceAfter: 820,
      },
    ],
  },
  {
    id: "kh-3",
    name: "Mohan Masterji",
    phone: "+91 99223 34455",
    avatarBg: "from-emerald-600 to-teal-700",
    totalDue: 180,
    lastActivity: "2026-09-21",
    entries: [
      {
        id: "e-5",
        date: "2026-09-15",
        type: "gave",
        amount: 680,
        note: "Basmati rice + Spices",
        balanceAfter: 680,
      },
      {
        id: "e-6",
        date: "2026-09-21",
        type: "received",
        amount: 500,
        note: "UPI payment via QR",
        balanceAfter: 180,
      },
    ],
  },
  {
    id: "kh-4",
    name: "Pooja Sharma",
    phone: "+91 97334 55667",
    avatarBg: "from-purple-600 to-indigo-700",
    totalDue: 0,
    lastActivity: "2026-09-24",
    entries: [
      {
        id: "e-7",
        date: "2026-09-24",
        type: "received",
        amount: 340,
        note: "Account settled full",
        balanceAfter: 0,
      },
    ],
  },
];

export const DigitalKhataLedger: React.FC<DigitalKhataLedgerProps> = ({
  shop,
  language,
}) => {
  const isHindi = language === "hi";

  const [customers, setCustomers] = useState<KhataCustomer[]>(() => {
    try {
      const saved = localStorage.getItem(`kirana_khata_${shop.id}`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(
    customers[0] || null
  );

  // New Transaction Form Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<"gave" | "received">("gave");
  const [entryAmount, setEntryAmount] = useState<number | "">("");
  const [entryNote, setEntryNote] = useState("");

  // New Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustInitialDue, setNewCustInitialDue] = useState<number | "">("");

  // Save changes
  const saveCustomers = (newList: KhataCustomer[]) => {
    setCustomers(newList);
    try {
      localStorage.setItem(`kirana_khata_${shop.id}`, JSON.stringify(newList));
    } catch {}
  };

  // Grand totals
  const totalMarketDue = customers.reduce(
    (sum, c) => (c.totalDue > 0 ? sum + c.totalDue : sum),
    0
  );
  const customersWithDueCount = customers.filter((c) => c.totalDue > 0).length;

  // Filtered customer list
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Add new transaction entry
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !entryAmount || Number(entryAmount) <= 0) return;

    const amountNum = Number(entryAmount);
    const newDue =
      entryType === "gave"
        ? selectedCustomer.totalDue + amountNum
        : selectedCustomer.totalDue - amountNum;

    const newEntry: KhataEntry = {
      id: `e-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: entryType,
      amount: amountNum,
      note: entryNote.trim() || (entryType === "gave" ? "सामान उधार" : "नकद भुगतान"),
      balanceAfter: newDue,
    };

    const updatedCustomer: KhataCustomer = {
      ...selectedCustomer,
      totalDue: newDue,
      lastActivity: new Date().toISOString().split("T")[0],
      entries: [newEntry, ...selectedCustomer.entries],
    };

    const updatedList = customers.map((c) =>
      c.id === selectedCustomer.id ? updatedCustomer : c
    );
    saveCustomers(updatedList);
    setSelectedCustomer(updatedCustomer);

    sounds.playSuccessChime();
    if (entryType === "received") {
      sounds.speakText(
        isHindi
          ? `${selectedCustomer.name} से ₹${amountNum} प्राप्त हुए`
          : `Received ₹${amountNum} from ${selectedCustomer.name}`,
        language
      );
    } else {
      sounds.speakText(
        isHindi
          ? `${selectedCustomer.name} के खाते में ₹${amountNum} का उधार जोड़ा गया`
          : `Added ₹${amountNum} credit to ${selectedCustomer.name}`,
        language
      );
    }

    setIsEntryModalOpen(false);
    setEntryAmount("");
    setEntryNote("");
  };

  // Add brand new customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const initDue = Number(newCustInitialDue) || 0;
    const colors = [
      "from-blue-600 to-indigo-700",
      "from-rose-600 to-red-700",
      "from-amber-600 to-orange-700",
      "from-emerald-600 to-teal-700",
      "from-purple-600 to-indigo-800",
    ];
    const newCust: KhataCustomer = {
      id: `kh-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || "+91 98000 00000",
      avatarBg: colors[Math.floor(Math.random() * colors.length)],
      totalDue: initDue,
      lastActivity: new Date().toISOString().split("T")[0],
      entries:
        initDue > 0
          ? [
              {
                id: `e-${Date.now()}`,
                date: new Date().toISOString().split("T")[0],
                type: "gave",
                amount: initDue,
                note: "पिछला पुराना बकाया हिसाब",
                balanceAfter: initDue,
              },
            ]
          : [],
    };

    const updated = [newCust, ...customers];
    saveCustomers(updated);
    setSelectedCustomer(newCust);
    setIsAddCustomerOpen(false);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustInitialDue("");
    sounds.playSuccessChime();
  };

  // WhatsApp Reminder message generator
  const handleWhatsAppReminder = (customer: KhataCustomer) => {
    const text = isHindi
      ? `नमस्ते ${customer.name} जी! ${shop.name} से आपका कुल बकाया हिसाब ₹${customer.totalDue} है। कृपया सुविधा अनुसार दुकान पर या UPI (${shop.upiId}) द्वारा चुकता करने का कष्ट करें। धन्यवाद!`
      : `Dear ${customer.name}, warm greetings from ${shop.name}. Your total pending credit balance is ₹${customer.totalDue}. Kindly settle via store visit or UPI to ${shop.upiId}. Thank you!`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, "_blank");
  };

  // Speak balance aloud
  const handleSpeakBalance = (customer: KhataCustomer) => {
    if (customer.totalDue > 0) {
      sounds.speakText(
        isHindi
          ? `${customer.name} से कुल ${customer.totalDue} रुपये लेने हैं`
          : `${customer.name} owes ₹${customer.totalDue}`,
        language
      );
    } else {
      sounds.speakText(
        isHindi
          ? `${customer.name} का पूरा हिसाब चुकता है`
          : `${customer.name} has zero pending balance`,
        language
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Total Market Credit Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                {isHindi ? "डिजिटल बही-खाता (उधार लेज़र)" : "Digital Khata Ledger"}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Khatabook / OkCredit Style
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {isHindi
                ? "ग्राहकों का उधारी हिसाब, 1-टैप व्हाट्सएप रिमाइंडर व आवाज़ से पुष्टिकरण"
                : "Record customer credit, send WhatsApp payment reminders & voice confirmations"}
            </p>
          </div>
        </div>

        {/* Total stats */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neutral-950 border border-rose-500/40 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide block">
              {isHindi ? "बाज़ार से कुल लेने हैं" : "Total Market Credit Due"}
            </span>
            <div className="font-mono text-xl sm:text-2xl font-black text-rose-400">
              {formatINR(totalMarketDue)}
            </div>
            <span className="text-[10px] text-neutral-500">
              {customersWithDueCount} {isHindi ? "ग्राहकों का बकाया" : "customers due"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? "+ नया ग्राहक खाता" : "+ Add Customer"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Khata Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 4 Cols: Customer List */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-xl space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? "ग्राहक का नाम या फोन नंबर खोजें..." : "Search customer name or phone..."}
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* List of Customers */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1 divide-y divide-neutral-800/60">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                {isHindi ? "कोई ग्राहक नहीं मिला" : "No customers found"}
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      sounds.playScanBeep();
                    }}
                    className={`w-full p-3 rounded-2xl text-left flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? "bg-neutral-800 border-2 border-amber-500/50 shadow-md"
                        : "hover:bg-neutral-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${c.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0`}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-neutral-100 truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{c.phone}</span>
                        </div>
                      </div>
                    </div>

                      <div className="text-right flex-shrink-0">
                      <div
                        className={`font-mono text-sm font-black ${
                          c.totalDue > 0
                            ? "text-rose-400"
                            : c.totalDue < 0
                            ? "text-emerald-400"
                            : "text-neutral-400"
                        }`}
                      >
                        {formatINR(c.totalDue)}
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-tight opacity-75">
                        {c.totalDue > 0
                          ? isHindi
                            ? "लेने हैं"
                            : "Due"
                          : c.totalDue < 0
                          ? isHindi
                            ? "अग्रिम"
                            : "Advance"
                          : isHindi
                          ? "चुकता"
                          : "Settled"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Selected Customer Detail & Ledger Statements */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between min-h-[500px]">
          {selectedCustomer ? (
            <div className="space-y-4">
              {/* Header profile of selected customer */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedCustomer.avatarBg} text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0`}
                  >
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {selectedCustomer.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                      <span>{selectedCustomer.phone}</span>
                      <span>•</span>
                      <span>
                        {isHindi ? "अंतिम लेन-देन:" : "Last:"} {formatDate(selectedCustomer.lastActivity)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSpeakBalance(selectedCustomer)}
                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors"
                    title={isHindi ? "बकाया आवाज़ में सुनें" : "Speak balance aloud"}
                  >
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  </button>

                  {selectedCustomer.totalDue > 0 && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppReminder(selectedCustomer)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                      title={isHindi ? "व्हाट्सएप पर तकादा / रिमाइंडर भेजें" : "Send WhatsApp reminder"}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isHindi ? "व्हाट्सएप तकादा" : "WhatsApp Reminder"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Net Balance Card */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  selectedCustomer.totalDue > 0
                    ? "bg-rose-950/40 border-rose-500/40"
                    : "bg-emerald-950/40 border-emerald-500/40"
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                    {selectedCustomer.totalDue > 0
                      ? isHindi
                        ? "कुल बकाया (आपको लेने हैं)"
                        : "Total Due (You will receive)"
                      : isHindi
                      ? "खाता हिसाब (शून्य बकाया)"
                      : "Account Settled"}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {isHindi
                      ? "ग्राहक को लाल रंग में उधार और हरे रंग में जमा दिखता है"
                      : "Clear red for credit given, green for payments received"}
                  </span>
                </div>
                <div
                  className={`font-mono text-2xl sm:text-3xl font-black ${
                    selectedCustomer.totalDue > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {formatINR(selectedCustomer.totalDue)}
                </div>
              </div>

              {/* Ledger Statement Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {isHindi ? "लेन-देन का इतिहास (हिसाब डायरी)" : "Transaction History"}
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {selectedCustomer.entries.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-950/60 rounded-2xl">
                      {isHindi ? "अभी कोई लेन-देन दर्ज नहीं है" : "No transactions recorded yet"}
                    </div>
                  ) : (
                    selectedCustomer.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                              entry.type === "gave"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {entry.type === "gave" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-200">
                              {entry.note || (entry.type === "gave" ? "उधार दिया" : "पैसे मिले")}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono">
                              {formatDate(entry.date)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-mono font-black text-sm ${
                              entry.type === "gave" ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {entry.type === "gave" ? "-" : "+"}
                            {formatINR(entry.amount)}
                          </div>
                          <div className="text-[9px] text-neutral-500 font-mono">
                            {isHindi ? "बाकी:" : "Bal:"} {formatINR(entry.balanceAfter)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-neutral-500">
              {isHindi ? "बाईं ओर से कोई ग्राहक चुनें" : "Select a customer from the left"}
            </div>
          )}

          {/* Bottom 2 Big Khatabook Action Buttons: Diya (Red) vs Mila (Green) */}
          {selectedCustomer && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                id="khata-gave-btn"
                onClick={() => {
                  setEntryType("gave");
                  setIsEntryModalOpen(true);
                  sounds.playScanBeep();
                }}
                className="py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>{isHindi ? "🔴 आपने दिया (उधार)" : "YOU GAVE (Credit)"}</span>
              </button>

              <button
                type="button"
                id="khata-received-btn"
                onClick={() => {
                  setEntryType("received");
                  setIsEntryModalOpen(true);
                  sounds.playCashChime();
                }}
                className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span>{isHindi ? "🟢 आपको मिला (जमा)" : "YOU RECEIVED (Paid)"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Record Transaction Entry Modal */}
      {isEntryModalOpen && selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEntryModalOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95 text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    entryType === "gave" ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <h3 className="font-extrabold text-sm sm:text-base">
                  {entryType === "gave"
                    ? isHindi
                      ? `उधार दें: ${selectedCustomer.name}`
                      : `You Gave Credit to ${selectedCustomer.name}`
                    : isHindi
                    ? `पैसे प्राप्त करें: ${selectedCustomer.name}`
                    : `Payment Received from ${selectedCustomer.name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">
                  {isHindi ? "राशि (₹):" : "Amount (₹):"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-base font-bold text-amber-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    autoFocus
                    value={entryAmount}
                    onChange={(e) =>
                      setEntryAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[50, 100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sounds.playCoinSound();
                      setEntryAmount(amt);
                    }}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono font-bold"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">
                  {isHindi ? "विवरण / सामान का नाम:" : "Description / Notes:"}
                </label>
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  placeholder={
                    entryType === "gave"
                      ? isHindi
                        ? "उदा. आटा, तेल, दाल..."
                        : "e.g. Atta, Oil, Soap..."
                      : isHindi
                      ? "उदा. नकद या फोनपे से..."
                      : "e.g. Cash or PhonePe UPI..."
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-white ${
                  entryType === "gave"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {entryType === "gave"
                    ? isHindi
                      ? "उधार हिसाब दर्ज करें"
                      : "SAVE CREDIT GIVEN"
                    : isHindi
                    ? "जमा भुगतान दर्ज करें"
                    : "SAVE PAYMENT RECEIVED"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustomerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddCustomerOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-in zoom-in-95 text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="font-extrabold text-sm sm:text-base">
                {isHindi ? "नया ग्राहक खाता जोड़ें" : "Add New Customer Account"}
              </h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">
                  {isHindi ? "ग्राहक का नाम:" : "Customer Name:"}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={isHindi ? "उदा. राजेश भाई, शर्मा जी..." : "e.g. Rajesh Bhai, Auntie..."}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">
                  {isHindi ? "फोन नंबर (व्हाट्सएप हेतु):" : "Phone Number (for WhatsApp):"}
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">
                  {isHindi ? "पुराना बकाया (यदि कोई हो):" : "Initial Due (if any):"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCustInitialDue}
                  onChange={(e) =>
                    setNewCustInitialDue(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isHindi ? "ग्राहक खाता बनाएं" : "CREATE CUSTOMER KHATA"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
