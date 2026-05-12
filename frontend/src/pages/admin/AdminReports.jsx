import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import api, { API_BASE } from "@/lib/api";
import { FileDown } from "lucide-react";

export default function AdminReports() {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get("/admin/activity")
      .then((r) => setActivity(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  // Download with auth header — fetch + blob
  const download = async (path, filename) => {
    const token = localStorage.getItem("ht_token");
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Reports">
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          { p: "/reports/revenue.pdf", f: "revenue.pdf", t: "Revenue (PDF)", d: "Last 30 days revenue breakdown" },
          { p: "/reports/orders.xlsx", f: "orders.xlsx", t: "Orders (Excel)", d: "All orders with full details" },
          { p: "/reports/users.xlsx", f: "users.xlsx", t: "Users (Excel)", d: "User accounts export" },
        ].map((r) => (
          <button key={r.f} onClick={() => download(r.p, r.f)} className="card card-hover p-6 text-left">
            <FileDown size={20} className="text-sage mb-3" />
            <div className="font-serif text-xl">{r.t}</div>
            <div className="text-sm text-ink-2 mt-1">{r.d}</div>
          </button>
        ))}
      </div>

      <h2 className="font-serif text-2xl mb-4">Activity log</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-line">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Fields</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((a) => (
              <tr key={a.id} className="border-b border-line">
                <td className="px-4 py-3 text-ink-2 text-xs">{new Date(a.at).toLocaleString()}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-cream rounded-full">{a.type}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-ink-2">{a.target}</td>
                <td className="px-4 py-3 text-xs">{(a.fields || []).join(", ")}</td>
              </tr>
            ))}
            {activity.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-3 text-sm">No activity</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
