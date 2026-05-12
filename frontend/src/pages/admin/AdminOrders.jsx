import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { toast } from "sonner";

const STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [filter, setFilter] = useState("");

  const load = () => {
    const params = filter ? { status: filter } : {};
    api.get("/admin/orders", { params }).then((r) => setOrders(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };
  useEffect(load, [filter]);

  useEffect(() => {
    api.get("/admin/users", { params: { role: "delivery" } })
      .then((r) => setDeliveryStaff(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    toast.success("Status updated");
    load();
  };

  const assign = async (id, delivery_staff_id) => {
    await api.post(`/orders/${id}/assign`, { delivery_staff_id });
    toast.success("Delivery assigned");
    load();
  };

  const refund = async (id) => {
    if (!confirm("Issue refund for this order?")) return;
    await api.post(`/orders/${id}/refund`);
    toast.success("Refunded");
    load();
  };

  return (
    <AdminShell title="Orders">
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        <button onClick={() => setFilter("")} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${!filter ? "bg-ink text-white" : "border border-line text-ink-2 hover:border-ink"}`}>
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap capitalize ${filter === s ? "bg-ink text-white" : "border border-line text-ink-2 hover:border-ink"}`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-ink-3 text-sm py-12 text-center">No orders</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-ink-3">#{o.id.slice(-8)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cream capitalize">{o.status.replace(/_/g, " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_status === "paid" ? "bg-sage-light text-sage-dark" : "bg-yellow-100 text-yellow-700"}`}>
                      {o.payment_status}
                    </span>
                  </div>
                  <div className="font-medium">{o.user_name || "Unknown"}</div>
                  <div className="text-xs text-ink-3 font-mono">{o.user_email}</div>
                  <div className="text-sm text-ink-2 mt-2">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                  </div>
                  <div className="text-xs text-ink-3 mt-1">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="font-mono text-xl">${o.total.toFixed(2)}</div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line flex-wrap">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="border border-line rounded-lg px-3 py-1.5 text-xs bg-white"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                <select
                  value={o.delivery_staff_id || ""}
                  onChange={(e) => e.target.value && assign(o.id, e.target.value)}
                  className="border border-line rounded-lg px-3 py-1.5 text-xs bg-white"
                >
                  <option value="">Assign delivery…</option>
                  {deliveryStaff.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {o.payment_status === "paid" && (
                  <button onClick={() => refund(o.id)} className="text-xs text-terra hover:underline">
                    Refund
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
