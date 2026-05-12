import { useEffect, useState } from "react";
import DeliveryShell from "@/components/DeliveryShell";
import api from "@/lib/api";

export default function DeliveryHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/delivery/orders", { params: { status: "delivered" } })
      .then((r) => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  return (
    <DeliveryShell title="History">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-line">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Delivered</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line">
                <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(-8)}</td>
                <td className="px-4 py-3 text-ink-2 text-xs">
                  {o.address?.line1}, {o.address?.city}
                </td>
                <td className="px-4 py-3 font-mono">${o.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-ink-2">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-3 text-sm">No completed deliveries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DeliveryShell>
  );
}
