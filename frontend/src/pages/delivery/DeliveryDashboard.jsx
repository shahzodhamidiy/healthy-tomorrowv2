import { useEffect, useState } from "react";
import DeliveryShell from "@/components/DeliveryShell";
import api from "@/lib/api";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);

  const load = () =>
    api.get("/delivery/active")
      .then((r) => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success("Status updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const openMaps = (address) => {
    const q = encodeURIComponent(`${address.line1}, ${address.city}, ${address.country}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  return (
    <DeliveryShell title="Active deliveries">
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="card p-12 text-center text-ink-3">No active deliveries assigned</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="label-eyebrow capitalize">{o.status.replace(/_/g, " ")}</div>
                  <div className="font-mono text-xs text-ink-3 mt-1">#{o.id.slice(-8)}</div>
                  <div className="text-sm text-ink-2 mt-3">
                    {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                  </div>
                </div>
                <div className="font-mono text-xl">${o.total.toFixed(2)}</div>
              </div>

              {o.address?.line1 && (
                <div className="bg-cream rounded-xl p-4 mb-4 flex items-start gap-3">
                  <MapPin size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div>{o.address.line1}</div>
                    <div className="text-ink-2">{o.address.city} {o.address.postal_code}</div>
                  </div>
                  <button onClick={() => openMaps(o.address)} className="text-xs px-3 py-1.5 border border-line rounded-full hover:bg-white flex items-center gap-1">
                    <Navigation size={12} /> Navigate
                  </button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {o.status === "confirmed" || o.status === "preparing" ? (
                  <button onClick={() => updateStatus(o.id, "out_for_delivery")} className="btn-primary btn-sm">
                    Pick up & deliver
                  </button>
                ) : o.status === "out_for_delivery" ? (
                  <button onClick={() => updateStatus(o.id, "delivered")} className="btn-primary btn-sm">
                    Mark delivered
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </DeliveryShell>
  );
}
