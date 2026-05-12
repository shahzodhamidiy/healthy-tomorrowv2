import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-sage-light text-sage-dark",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders")
      .then((r) => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Your history</div>
      <h1 className="font-serif text-5xl md:text-6xl mb-10">Orders.</h1>

      {loading ? (
        <div className="text-ink-3 text-sm">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-ink-2 mb-6">No orders yet.</p>
          <Link to="/meals" className="btn-primary inline-flex">Browse meals</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="card card-hover p-6 flex items-center gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-ink-3 font-mono">#{o.id.slice(-8)}</span>
                </div>
                <div className="text-sm text-ink-2 truncate">
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
                </div>
                <div className="text-xs text-ink-3 mt-1">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
              <div className="font-mono text-xl text-right">${o.total.toFixed(2)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
