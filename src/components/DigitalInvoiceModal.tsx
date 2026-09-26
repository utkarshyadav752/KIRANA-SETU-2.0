import React from "react";
import { X, Printer, Share2, Download, CheckCircle, Store, Phone, Receipt } from "lucide-react";
import { Invoice, Shop } from "../types";
import { formatINR, formatDate } from "../utils/barcode";
import { Language } from "../utils/translations";

interface DigitalInvoiceModalProps {
  invoice: Invoice | null;
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const DigitalInvoiceModal: React.FC<DigitalInvoiceModalProps> = ({
  invoice,
  shop,
  isOpen,
  onClose,
  language = "en",
}) => {
  if (!isOpen || !invoice) return null;
  const isHindi = language === "hi";

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `🧾 *Invoice from ${shop?.name || "KiranaSetu"}*\n` +
      `Bill #${invoice.invoiceNumber}\n` +
      `Date: ${formatDate(invoice.createdAt)}\n` +
      `Customer: ${invoice.customerName}\n` +
      `Items: ${invoice.items.length}\n` +
      `*Total: ${formatINR(invoice.totalAmount)}* (${invoice.paymentMethod})\n` +
      `Thank you for shopping local! 🙏`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      id="digital-invoice-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="digital-invoice-container"
        className="bg-white text-neutral-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions Bar (No Print) */}
        <div className="p-3 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>{isHindi ? "डिजिटल जीएसटी बिल" : "Digital Tax Invoice"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
              title={isHindi ? "बिल प्रिंट करें" : "Print Receipt"}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHindi ? "प्रिंट" : "Print"}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
              title="WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-invoice" className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Shop Header */}
          <div className="text-center border-b border-dashed border-neutral-300 pb-4 space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 tracking-tight">
              {shop?.name || "KiranaSetu Store"}
            </h2>
            <p className="text-neutral-600 text-[11px] leading-tight">
              {shop?.address || "Indiranagar 12th Main, Bengaluru"}
            </p>
            <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-500 pt-1">
              <span>Ph: {shop?.phone || "+91 98765 43210"}</span>
              {shop?.gstNumber && <span>GSTIN: {shop.gstNumber}</span>}
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-dashed border-neutral-200">
            <div>
              <span className="text-neutral-400 block">{isHindi ? "बिल संख्या:" : "Invoice No:"}</span>
              <strong className="font-mono text-neutral-800">{invoice.invoiceNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block">{isHindi ? "दिनांक व समय:" : "Date & Time:"}</span>
              <span className="text-neutral-700">{formatDate(invoice.createdAt)}</span>
            </div>
            <div>
              <span className="text-neutral-400 block">{isHindi ? "ग्राहक:" : "Customer:"}</span>
              <span className="text-neutral-800 font-medium">
                {invoice.customerName} {invoice.customerPhone ? `(${invoice.customerPhone})` : ""}
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-400 block">{isHindi ? "भुगतान माध्यम:" : "Payment Mode:"}</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle className="w-3 h-3" />
                {invoice.paymentMethod}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-300 text-[10px] font-bold text-neutral-500 uppercase">
                  <th className="py-1">{isHindi ? "सामान" : "Item"}</th>
                  <th className="text-center py-1">{isHindi ? "मात्रा" : "Qty"}</th>
                  <th className="text-right py-1">{isHindi ? "मूल्य" : "Price"}</th>
                  <th className="text-right py-1">{isHindi ? "योग" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="text-[11px]">
                    <td className="py-1.5 pr-2">
                      <div className="font-semibold text-neutral-800">{item.productName}</div>
                      {item.isManualEntry && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-mono">
                          {isHindi ? "खुला सामान" : "Loose / Non-Barcode"}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-1.5 font-mono text-neutral-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="text-right py-1.5 font-mono text-neutral-700">
                      {formatINR(item.sellingPrice)}
                    </td>
                    <td className="text-right py-1.5 font-mono font-bold text-neutral-900">
                      {formatINR(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax & Total Calculation */}
          <div className="border-t border-dashed border-neutral-300 pt-3 space-y-1 text-[11px]">
            <div className="flex justify-between text-neutral-600">
              <span>{isHindi ? "उप-योग:" : "Subtotal:"}</span>
              <span className="font-mono">{formatINR(invoice.subtotal)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>{isHindi ? "छूट लागू:" : "Discount Applied:"}</span>
                <span className="font-mono">-{formatINR(invoice.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500 text-[10px]">
              <span>CGST:</span>
              <span className="font-mono">{formatINR(invoice.cgst)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 text-[10px]">
              <span>SGST:</span>
              <span className="font-mono">{formatINR(invoice.sgst)}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-extrabold text-neutral-900 pt-2 border-t border-neutral-300">
              <span>{isHindi ? "कुल देय राशि:" : "Grand Total:"}</span>
              <span className="font-mono text-base">{formatINR(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* Footer Thank You Note */}
          <div className="text-center pt-3 border-t border-neutral-200 text-neutral-500 text-[10px] space-y-0.5">
            <p className="font-medium text-neutral-700">
              {isHindi ? "स्थानीय दुकान से खरीदारी के लिए धन्यवाद! 🙏" : "Thank you for shopping local! 🙏"}
            </p>
            <p>{isHindi ? "जीरो स्टॉक ड्रिफ्ट किरानासेतु तकनीक द्वारा समर्थित" : "Zero Stock Drift Powered by KiranaSetu"}</p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 no-print">
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            {isHindi ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
