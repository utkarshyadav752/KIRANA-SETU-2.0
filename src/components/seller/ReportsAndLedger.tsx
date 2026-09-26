import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Receipt,
  Download,
  Printer,
  History,
  TrendingUp,
  Banknote,
  QrCode,
  CreditCard,
  Search,
  MessageSquare,
  Send,
  AlertCircle,
  Percent,
  CheckCircle2,
  DollarSign,
  Share2,
} from "lucide-react";
import { Invoice, InventoryTransaction, Shop, UdharCustomerRecord } from "../../types";
import { formatINR, formatDate } from "../../utils/barcode";
import { sounds } from "../../utils/audio";
import { DigitalInvoiceModal } from "../DigitalInvoiceModal";

const INITIAL_UDHAR_CUSTOMERS: UdharCustomerRecord[] = [
  {
    customerId: "cust-1",
    customerName: "Ramesh Kumar Sharma",
    customerPhone: "+91 98450 11223",
    totalCreditPending: 1240,
    lastPurchaseDate: "2026-09-18",
    lastReminderSentAt: "2026-09-19",
    reminderCount: 1,
    trustScore: "A",
  },
  {
    customerId: "cust-2",
    customerName: "Suresh Verma (Flat 402)",
    customerPhone: "+91 98112 33445",
    totalCreditPending: 560,
    lastPurchaseDate: "2026-09-19",
    reminderCount: 0,
    trustScore: "A+",
  },
  {
    customerId: "cust-3",
    customerName: "Anita Devi",
    customerPhone: "+91 97234 55667",
    totalCreditPending: 320,
    lastPurchaseDate: "2026-09-15",
    reminderCount: 2,
    trustScore: "A+",
  },
  {
    customerId: "cust-4",
    customerName: "Rahul Sharma (Hostel)",
    customerPhone: "+91 99001 88776",
    totalCreditPending: 1850,
    lastPurchaseDate: "2026-09-02",
    reminderCount: 3,
    trustScore: "Overdue",
  },
];

interface ReportsAndLedgerProps {
  shop: Shop;
  invoices: Invoice[];
  language: "en" | "hi";
}

export const ReportsAndLedger: React.FC<ReportsAndLedgerProps> = ({
  shop,
  invoices,
  language,
}) => {
  const isHindi = language === "hi";

  const [activeTab, setActiveTab] = useState<"sales" | "pnl" | "udhar" | "ledger">("sales");
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [udharList, setUdharList] = useState<UdharCustomerRecord[]>(INITIAL_UDHAR_CUSTOMERS);
  const [udharSearch, setUdharSearch] = useState("");

  useEffect(() => {
    fetch(`/api/inventory/transactions?shopId=${shop.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTransactions(d.data);
      })
      .catch(() => {});
  }, [shop.id, invoices.length]);

  const shopInvoices = invoices.filter((i) => i.shopId === shop.id);
  const totalRevenue = shopInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const cashTotal = shopInvoices
    .filter((i) => i.paymentMethod === "Cash")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const upiTotal = shopInvoices
    .filter((i) => i.paymentMethod === "UPI" || i.paymentMethod === "Dedicated Business UPI QR")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const cardTotal = shopInvoices
    .filter((i) => i.paymentMethod === "Card")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  // Financial Metrics: COGS estimated at 82% of selling price (average Indian Kirana wholesale margin 18%)
  const estimatedCogs = Math.round(totalRevenue * 0.82);
  const grossProfit = totalRevenue - estimatedCogs;
  const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 18;

  // GST Estimation
  const totalGst = shopInvoices.reduce(
    (sum, inv) =>
      sum +
      inv.items.reduce((itemSum, item) => itemSum + ((item.total * (item.gstPercent || 0)) / 100), 0),
    0
  );
  const cgst = Math.round(totalGst / 2);
  const sgst = Math.round(totalGst / 2);

  // Total Udhar Pending
  const totalUdharPending = udharList.reduce((sum, u) => sum + u.totalCreditPending, 0);

  // Send WhatsApp Reminder with UPI Deep Link
  const handleSendUdharReminder = (cust: UdharCustomerRecord) => {
    sounds.playScanBeep();
    const upiLink = `upi://pay?pa=${shop.dedicatedUpiId || "kirana@upi"}&pn=${encodeURIComponent(
      shop.name
    )}&am=${cust.totalCreditPending}&cu=INR`;

    const message = `नमस्ते ${cust.customerName} जी,

*${shop.name}* से आपका कुल बकाया खाता (उधार) राशि *₹${cust.totalCreditPending}* है।
कृपया नीचे दिए गए UPI लिंक या QR कोड से सीधे भुगतान करें:

👉 *1-Click UPI Pay Link:*
${upiLink}

*UPI ID:* \`${shop.dedicatedUpiId || "kirana@upi"}\`

धन्यवाद!
_${shop.name}_
📞 ${shop.phone}`;

    // Update reminder count & timestamp
    setUdharList((prev) =>
      prev.map((c) =>
        c.customerId === cust.customerId
          ? {
              ...c,
              reminderCount: c.reminderCount + 1,
              lastReminderSentAt: new Date().toISOString().split("T")[0],
            }
          : c
      )
    );

    const cleanPhone = cust.customerPhone.replace(/[^0-9]/g, "");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Export Daily P&L and GST CSV
  const handleExportCSV = () => {
    sounds.playSuccessChime();
    const headers = [
      "Metric",
      "Value (INR)",
      "Notes",
    ];
    const rows = [
      ["Store Name", shop.name, "KiranaSetu Registered Store"],
      ["Report Date", new Date().toLocaleDateString("en-IN"), "Daily Closing Report"],
      ["Total Bills Issued", shopInvoices.length.toString(), "Invoices count"],
      ["Gross Revenue", totalRevenue.toString(), "Total Sales Amount"],
      ["Estimated COGS", estimatedCogs.toString(), "Wholesale inventory cost (~82%)"],
      ["Gross Profit", grossProfit.toString(), "Net Earnings"],
      ["Gross Margin %", `${grossMarginPercent}%`, "Average margin"],
      ["UPI Collections", upiTotal.toString(), "Dedicated merchant account"],
      ["Cash Collections", cashTotal.toString(), "Cash in register"],
      ["Card Collections", cardTotal.toString(), "Card POS terminal"],
      ["Total GST Collected", Math.round(totalGst).toString(), "Total Indirect Tax"],
      ["CGST (Central Tax)", cgst.toString(), "Central GST (50%)"],
      ["SGST (State Tax)", sgst.toString(), "State GST (50%)"],
      ["Active Udhar / Khata Balance", totalUdharPending.toString(), "Receivable from customers"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${shop.name.replace(/\s+/g, "_")}_PNL_GST_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUdhar = udharList.filter(
    (u) =>
      u.customerName.toLowerCase().includes(udharSearch.toLowerCase()) ||
      u.customerPhone.includes(udharSearch)
  );

  return (
    <div id="reports-ledger-container" className="space-y-4">
      {/* Header Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              {isHindi ? "दैनिक रिपोर्ट, P&L एवं खाता बही" : "Reports, P&L & Udhar Ledger"}
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            {isHindi
              ? "दैनिक बिक्री, GST विभाजन, उधार तगादा व्हाट्सएप लिंक एवं स्टॉक लेज़र"
              : "Financial settlements, GST breakdown, WhatsApp payment reminders, and stock logs."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800 text-xs gap-1">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "sales"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Sales ({shopInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab("pnl")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeTab === "pnl"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>P&L & GST</span>
          </button>
          <button
            onClick={() => setActiveTab("udhar")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeTab === "udhar"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Khata / Udhar ({udharList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              activeTab === "ledger"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Ledger ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SALES TAB */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                Total Revenue
              </span>
              <div className="text-xl font-mono font-black text-amber-400">
                {formatINR(totalRevenue)}
              </div>
              <span className="text-[10px] text-neutral-500">
                {shopInvoices.length} Bills Generated
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase flex items-center gap-1">
                <QrCode className="w-3 h-3 text-emerald-400" />
                <span>UPI Settlements</span>
              </span>
              <div className="text-xl font-mono font-black text-emerald-400">
                {formatINR(upiTotal)}
              </div>
              <span className="text-[10px] text-neutral-500">Direct Bank Credit</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase flex items-center gap-1">
                <Banknote className="w-3 h-3 text-amber-400" />
                <span>Cash in Till</span>
              </span>
              <div className="text-xl font-mono font-black text-neutral-200">
                {formatINR(cashTotal)}
              </div>
              <span className="text-[10px] text-neutral-500">Drawer Cash</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-blue-400" />
                <span>Card Payments</span>
              </span>
              <div className="text-xl font-mono font-black text-blue-400">
                {formatINR(cardTotal)}
              </div>
              <span className="text-[10px] text-neutral-500">POS Machine</span>
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-xs">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-neutral-200">All Tax Invoices</h3>
              <span className="text-neutral-500 font-mono text-[11px]">
                Click row to view / print digital receipt
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-center">Items</th>
                    <th className="py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-200">
                  {shopInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">{formatDate(inv.createdAt)}</td>
                      <td className="py-3 px-3 font-medium text-neutral-200">{inv.customerName}</td>
                      <td className="py-3 px-3 text-center font-mono">{inv.items.length}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-neutral-100">
                        {formatINR(inv.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: P&L AND GST REPORT */}
      {activeTab === "pnl" && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-3xl border border-neutral-800">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{isHindi ? "दैनिक P&L एवं GST ऑडिट रिपोर्ट" : "Daily Profit & Loss (P&L) & GST Report"}</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                {isHindi ? "ग्रॉस मार्जिन, अनुमानित खरीद लागत और CGST/SGST कर विभाजन" : "Gross margin, estimated wholesale COGS, and CGST/SGST tax split."}
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHindi ? "CSV डाउनलोड करें" : "Export CSV"}</span>
            </button>
          </div>

          {/* P&L Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                Gross Sales Revenue
              </span>
              <div className="text-2xl font-mono font-black text-white">
                {formatINR(totalRevenue)}
              </div>
              <span className="text-[10px] text-neutral-400">From {shopInvoices.length} transactions</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                Estimated COGS (Wholesale)
              </span>
              <div className="text-2xl font-mono font-black text-rose-300">
                {formatINR(estimatedCogs)}
              </div>
              <span className="text-[10px] text-neutral-400">~82% cost of inventory</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                Gross Profit & Margin
              </span>
              <div className="text-2xl font-mono font-black text-emerald-400">
                {formatINR(grossProfit)}
                <span className="text-sm font-bold text-emerald-300 ml-2">({grossMarginPercent}%)</span>
              </div>
              <span className="text-[10px] text-emerald-300">Net store trade earnings</span>
            </div>
          </div>

          {/* GST Breakdown Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>GST Indirect Tax Settlement Summary</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-[11px] text-neutral-400">Total GST Collected</div>
                <div className="text-lg font-mono font-extrabold text-amber-400">
                  {formatINR(Math.round(totalGst))}
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-[11px] text-neutral-400">CGST (Central Tax 50%)</div>
                <div className="text-lg font-mono font-extrabold text-neutral-200">
                  {formatINR(cgst)}
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-[11px] text-neutral-400">SGST (State Tax 50%)</div>
                <div className="text-lg font-mono font-extrabold text-neutral-200">
                  {formatINR(sgst)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KHATA / UDHAR & WHATSAPP REMINDERS */}
      {activeTab === "udhar" && (
        <div className="space-y-4">
          {/* Top Info Banner */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>{isHindi ? "खाता बही एवं 1-क्लिक व्हाट्सएप तगादा" : "Digital Khata & WhatsApp Payment Reminders"}</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isHindi
                  ? "ग्राहकों को सीधे व्हाट्सएप पर UPI पेमेंट लिंक भेजें ताकि तुरंत बैंक खाते में पैसा आए"
                  : "Send pre-filled UPI payment links directly to customers on WhatsApp."}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase block">Total Udhar Outstanding</span>
              <span className="text-xl font-mono font-black text-rose-400">
                {formatINR(totalUdharPending)}
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={udharSearch}
              onChange={(e) => setUdharSearch(e.target.value)}
              placeholder="Search customer name or phone number..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Customer Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredUdhar.map((cust) => (
              <div
                key={cust.customerId}
                className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{cust.customerName}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          cust.trustScore === "A+"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : cust.trustScore === "A"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        Trust: {cust.trustScore}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 font-mono mt-0.5">
                      {cust.customerPhone}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      Last purchase: {cust.lastPurchaseDate}
                      {cust.lastReminderSentAt && (
                        <span> • Last reminder: {cust.lastReminderSentAt} ({cust.reminderCount} sent)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-mono font-black text-rose-400">
                      ₹{cust.totalCreditPending}
                    </div>
                    <span className="text-[10px] text-neutral-400">Pending</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-850 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Direct UPI: {shop.dedicatedUpiId || "kirana@upi"}
                  </span>

                  <button
                    onClick={() => handleSendUdharReminder(cust)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isHindi ? "व्हाट्सएप तगादा भेजें" : "Send WhatsApp Reminder"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY AUDIT LEDGER */}
      {activeTab === "ledger" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-xs">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-bold text-neutral-200">Stock Audit Trail (Immutable)</h3>
            <span className="text-neutral-500 font-mono text-[11px]">
              Logs created on every sale, restock, or count adjustment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3 text-center">Qty Change</th>
                  <th className="py-2.5 px-3 text-center">Old Stock</th>
                  <th className="py-2.5 px-3 text-center">New Stock</th>
                  <th className="py-2.5 px-4 text-right">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 px-4 text-neutral-400 font-mono">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-neutral-100">{tx.productName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span
                        className={
                          tx.quantityChange > 0
                            ? "text-emerald-400"
                            : tx.quantityChange < 0
                            ? "text-rose-400"
                            : "text-neutral-400"
                        }
                      >
                        {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-neutral-400">
                      {tx.previousStock}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-neutral-100">
                      {tx.newStock}
                    </td>
                    <td className="py-2.5 px-4 text-right text-neutral-400 text-[11px]">
                      {tx.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Digital Invoice Modal */}
      <DigitalInvoiceModal
        invoice={selectedInvoice}
        shop={shop}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        language={language}
      />
    </div>
  );
};
