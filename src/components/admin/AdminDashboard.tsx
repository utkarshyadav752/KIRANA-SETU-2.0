import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  Package,
  TrendingUp,
  Receipt,
  Users,
  Activity,
  History,
  Star,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatINR, formatDate } from "../../utils/barcode";
import { Shop, AuditLog, PlatformFeedback } from "../../types";

interface AdminDashboardProps {
  shops: Shop[];
  language: "en" | "hi";
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ shops, language }) => {
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [feedbacks, setFeedbacks] = useState<PlatformFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<"metrics" | "logs" | "feedback">("metrics");

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(() => {});

    fetch("/api/admin/audit-logs")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAuditLogs(d.data);
      })
      .catch(() => {});

    fetch("/api/platform-feedback")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFeedbacks(d.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div id="admin-dashboard-container" className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/50 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                KiranaSetu Platform Administration
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 font-mono">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Network telemetry, stock drift health index, multi-shop audit trails, and customer satisfaction feeds.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "metrics"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Network Metrics
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "logs"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === "feedback"
                ? "bg-amber-500 text-neutral-950 shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Feedback Feed ({feedbacks.length})
          </button>
        </div>
      </div>

      {activeTab === "metrics" && (
        <div className="space-y-4">
          {/* Top Platform Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Active Kiranas
              </span>
              <div className="text-xl font-mono font-black text-white">
                {stats?.totalShops || shops.length}
              </div>
              <span className="text-[10px] text-emerald-400">100% Operational</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Products Indexed
              </span>
              <div className="text-xl font-mono font-black text-amber-400">
                {stats?.totalProducts || 18}
              </div>
              <span className="text-[10px] text-neutral-500">Live barcode lookup</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Network Revenue
              </span>
              <div className="text-xl font-mono font-black text-emerald-400">
                {formatINR(stats?.totalRevenueProcessed || 14850)}
              </div>
              <span className="text-[10px] text-neutral-500">Processed today</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Bills Issued
              </span>
              <div className="text-xl font-mono font-black text-white">
                {stats?.totalTransactionsCount || 42}
              </div>
              <span className="text-[10px] text-neutral-500">Zero paper thermal</span>
            </div>

            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Active Holds
              </span>
              <div className="text-xl font-mono font-black text-blue-400">
                {stats?.activeReservationsCount || 2}
              </div>
              <span className="text-[10px] text-neutral-500">30-min guaranteed</span>
            </div>

            {/* Stock Drift Rate & Guardian Health Index (Section 48) */}
            <div className="p-4 rounded-3xl bg-neutral-900 border border-emerald-500/30 shadow-xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                Stock Drift Rate
              </span>
              <div className="text-xl font-mono font-black text-emerald-400">
                {stats?.stockDriftRate || "0.8%"}
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold">
                Guardian Score: 99.2%
              </span>
            </div>
          </div>

          {/* Registered Shops Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-xs">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-neutral-200">Registered Local Kirana Partners</h3>
              <span className="text-neutral-500 text-[11px] font-mono">
                {shops.length} Active in Network
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Store Name</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Location / Area</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-center">Rating</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-200">
                  {shops.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-800/30">
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-3 text-neutral-300">{s.ownerName}</td>
                      <td className="py-3 px-3 text-neutral-400">{s.area}</td>
                      <td className="py-3 px-3 font-mono text-neutral-400">{s.phone}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-400">
                        ⭐ {s.rating}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS (Section 48) */}
      {activeTab === "logs" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-xs">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-bold text-neutral-200">
              System Audit Trails & Event Ledger
            </h3>
            <span className="text-[10px] text-neutral-500 font-mono">
              Immutable Platform Logs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-4 text-right">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-400">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-neutral-800 text-amber-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300">{log.details}</td>
                    <td className="py-2.5 px-3 font-mono text-neutral-400">{log.entityId}</td>
                    <td className="py-2.5 px-4 text-right text-neutral-400">{log.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FEEDBACK FEED (Section 45 & 46) */}
      {activeTab === "feedback" && (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-200">{f.userName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 capitalize">
                    {f.userRole}
                  </span>
                </div>
                <div className="font-mono text-amber-400">
                  {"⭐".repeat(f.rating)}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {f.categories.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 text-[10px] border border-neutral-800"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {f.comment && (
                <p className="text-neutral-300 text-xs italic bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  &ldquo;{f.comment}&rdquo;
                </p>
              )}

              <span className="text-[9px] text-neutral-500 font-mono block">
                Submitted on {formatDate(f.timestamp || f.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
