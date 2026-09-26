import React, { useState } from "react";
import {
  Banknote,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Receipt,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatINR } from "../../utils/barcode";
import { sounds } from "../../utils/audio";
import { Shop, Invoice } from "../../types";

interface DailyGallaTrackerProps {
  shop: Shop;
  invoices: Invoice[];
  language: "en" | "hi";
}

interface ExpenseEntry {
  id: string;
  time: string;
  category: string;
  amount: number;
}

export const DailyGallaTracker: React.FC<DailyGallaTrackerProps> = ({
  shop,
  invoices,
  language,
}) => {
  const isHindi = language === "hi";

  const [openingCash, setOpeningCash] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`kirana_galla_open_${shop.id}`);
      return saved ? Number(saved) : 2500;
    } catch {
      return 2500;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { id: "exp-1", time: "10:30 AM", category: "दूध व ब्रेड टेम्पो भुगतान (Tempo Milk)", amount: 350 },
    { id: "exp-2", time: "01:15 PM", category: "दुकान चाय व नाश्ता (Chai & Snacks)", amount: 60 },
  ]);

  const [newExpCategory, setNewExpCategory] = useState("");
  const [newExpAmount, setNewExpAmount] = useState<number | "">("");

  // Physical Denominations Counter in Galla
  const [noteCounts, setNoteCounts] = useState<{ [denom: number]: number }>({
    500: 4,
    200: 3,
    100: 6,
    50: 8,
    20: 10,
    10: 15,
  });

  // Calculate POS Cash sales for today
  const todayCashSales = invoices
    .filter((inv) => inv.shopId === shop.id && inv.paymentMethod === "Cash")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Today UPI sales (direct to bank)
  const todayUpiSales = invoices
    .filter(
      (inv) =>
        inv.shopId === shop.id &&
        (inv.paymentMethod === "Dedicated Business UPI QR" ||
          inv.paymentMethod === "UPI")
    )
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Expected cash in drawer
  const expectedCashInDrawer = openingCash + todayCashSales - totalExpenses;

  // Actual cash physically counted
  const physicalCashCounted = Object.entries(noteCounts).reduce(
    (sum, [denom, count]) => sum + Number(denom) * Number(count),
    0
  );

  const discrepancy = physicalCashCounted - expectedCashInDrawer;

  const handleUpdateNote = (denom: number, delta: number) => {
    sounds.playCoinSound();
    setNoteCounts((prev) => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] || 0) + delta),
    }));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpAmount || Number(newExpAmount) <= 0) return;

    const amt = Number(newExpAmount);
    const newEntry: ExpenseEntry = {
      id: `exp-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category: newExpCategory.trim() || (isHindi ? "दुकान खर्च" : "General Expense"),
      amount: amt,
    };

    setExpenses([newEntry, ...expenses]);
    sounds.playScanBeep();
    setNewExpCategory("");
    setNewExpAmount("");
  };

  const handleSpeakHisab = () => {
    sounds.playCashChime();
    setTimeout(() => {
      const text = isHindi
        ? `आज का कुल गल्ला हिसाब: नकद बिक्री ${todayCashSales} रुपये, कुल खर्च ${totalExpenses} रुपये, गल्ले में कुल होने चाहिए ${expectedCashInDrawer} रुपये।`
        : `Today's cash summary: Cash sales ₹${todayCashSales}, Expenses ₹${totalExpenses}, Expected in cash drawer: ₹${expectedCashInDrawer}.`;
      sounds.speakText(text, language);
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                {isHindi ? "आज का गल्ला (दुकान नकद काउंटर)" : "Daily Cash Counter & Galla"}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Real-Time
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {isHindi
                ? "सुबह की रोकड़ (ओपनिंग कैश), दिन भर की नकद बिक्री, दुकान के खर्चे और गल्ला मिलान"
                : "Morning opening cash, today's POS cash sales, store expenses & drawer balancing"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpeakHisab}
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold rounded-2xl text-xs flex items-center gap-2 transition-colors border border-neutral-700"
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span>{isHindi ? "गल्ला हिसाब बोलकर सुनें" : "Speak Cash Summary"}</span>
        </button>
      </div>

      {/* 4 Cards Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Morning Opening Cash */}
        <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
            {isHindi ? "सुबह की रोकड़ (Open)" : "Opening Cash"}
          </span>
          <div className="font-mono text-xl sm:text-2xl font-black text-neutral-200">
            {formatINR(openingCash)}
          </div>
          <span className="text-[10px] text-neutral-500">
            {isHindi ? "काउंटर में शुरुआती नकदी" : "Morning float for change"}
          </span>
        </div>

        {/* 2. Today Cash Sales */}
        <div className="p-3.5 bg-neutral-900 border border-emerald-500/30 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
            {isHindi ? "+ आज नकद बिक्री" : "+ Cash Sales"}
          </span>
          <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
            {formatINR(todayCashSales)}
          </div>
          <span className="text-[10px] text-neutral-500">
            {invoices.filter((i) => i.paymentMethod === "Cash").length} {isHindi ? "बिल नकद" : "cash bills"}
          </span>
        </div>

        {/* 3. Today Expenses */}
        <div className="p-3.5 bg-neutral-900 border border-rose-500/30 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">
            {isHindi ? "- दुकान खर्चे (Expenses)" : "- Store Expenses"}
          </span>
          <div className="font-mono text-xl sm:text-2xl font-black text-rose-400">
            {formatINR(totalExpenses)}
          </div>
          <span className="text-[10px] text-neutral-500">
            {expenses.length} {isHindi ? "खर्चे दर्ज" : "logged entries"}
          </span>
        </div>

        {/* 4. Expected Cash in Drawer */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
            {isHindi ? "= गल्ले में कुल नकद" : "= Expected in Drawer"}
          </span>
          <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">
            {formatINR(expectedCashInDrawer)}
          </div>
          <span className="text-[10px] text-amber-300/80">
            {isHindi ? "रोकड़ बही हिसाब" : "Cash register total"}
          </span>
        </div>
      </div>

      {/* Main 2-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 6 Cols: Denomination Counter (नोटों की गिनती) */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isHindi ? "गल्ले में नोटों की भौतिक गिनती" : "Physical Cash Denomination Count"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? "दुकानदार नोट गिनकर यहाँ बटन दबाएँ"
                  : "Tap + or - to count notes currently in the cashbox"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block uppercase">
                {isHindi ? "कुल भौतिक गिनती" : "Total Counted"}
              </span>
              <span className="font-mono text-base sm:text-lg font-black text-emerald-400">
                {formatINR(physicalCashCounted)}
              </span>
            </div>
          </div>

          {/* Discrepancy indicator */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              discrepancy === 0
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : discrepancy > 0
                ? "bg-blue-950/40 border-blue-500/40 text-blue-300"
                : "bg-rose-950/40 border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {discrepancy === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className="font-bold">
                {discrepancy === 0
                  ? isHindi
                    ? "गल्ला बिल्कुल सही है! (शून्य अंतर)"
                    : "Cash Drawer is Perfectly Balanced!"
                  : discrepancy > 0
                  ? isHindi
                    ? `गल्ले में ₹${discrepancy} अधिक हैं`
                    : `₹${discrepancy} surplus in drawer`
                  : isHindi
                  ? `गल्ले में ₹${Math.abs(discrepancy)} कम हैं`
                  : `₹${Math.abs(discrepancy)} short in drawer`}
              </span>
            </div>
            <span className="font-mono font-black">
              {discrepancy >= 0 ? `+${discrepancy}` : `${discrepancy}`}
            </span>
          </div>

          {/* Notes Grid */}
          <div className="space-y-2">
            {[500, 200, 100, 50, 20, 10].map((denom) => {
              const count = noteCounts[denom] || 0;
              const subtotal = denom * count;
              return (
                <div
                  key={denom}
                  className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-16 px-2 py-1 rounded-xl bg-neutral-800 font-mono font-black text-amber-400 text-center border border-neutral-700">
                      ₹{denom}
                    </span>
                    <span className="text-neutral-400 font-mono">
                      × {count} {isHindi ? "नोट" : "notes"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateNote(denom, -1)}
                        className="w-7 h-7 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-white">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateNote(denom, 1)}
                        className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="w-20 text-right font-mono font-black text-neutral-200">
                      {formatINR(subtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 Cols: Daily Store Expenses Logger */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              {isHindi ? "दुकान के दैनिक खर्चे (Expense Logger)" : "Daily Store Expenses"}
            </h3>
            <p className="text-[11px] text-neutral-400">
              {isHindi
                ? "गल्ले से निकाले गए पैसे (चाय, नाश्ता, माल भाड़ा, लेबर)"
                : "Record small petty cash paid directly from the counter"}
            </p>
          </div>

          {/* Quick Expense Form */}
          <form onSubmit={handleAddExpense} className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  placeholder={isHindi ? "खर्च विवरण (उदा. टेम्पो भाड़ा, चाय)..." : "Reason (e.g. Tempo freight, Milk runner)..."}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  required
                  value={newExpAmount}
                  onChange={(e) =>
                    setNewExpAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="₹ Amount"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-amber-500/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHindi ? "+ खर्च जोड़ें" : "+ Record Petty Cash Expense"}</span>
            </button>
          </form>

          {/* List of today's expenses */}
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-neutral-200">{exp.category}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">{exp.time}</div>
                </div>
                <div className="font-mono font-bold text-rose-400">
                  -{formatINR(exp.amount)}
                </div>
              </div>
            ))}
          </div>

          {/* Online UPI sales note */}
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-neutral-300 block">
                {isHindi ? "आज की UPI डिजिटल बिक्री" : "Today's UPI Digital Sales"}
              </span>
              <span className="text-[10px] text-neutral-500">
                {isHindi ? "बैंक खाते में सीधे जमा (गल्ले में नहीं)" : "Direct to business bank via QR"}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-blue-400">
              {formatINR(todayUpiSales)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
