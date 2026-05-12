import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: "pending", label: "Order placed" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
];

export default function OrderTrack() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});

    const sock = getSocket();
    sock.emit("order:track", { order_id: id });
    const handler = ({ order_id, status }) => {
      if (order_id === id) {
        setOrder((o) => (o ? { ...o, status } : o));
        toast.info(`Order status: ${status.replace(/_/g, " ")}`);
      }
    };
    sock.on("order:update", handler);
    return () => sock.off("order:update", handler);
  }, [id]);

  const cancel = async () => {
    if (!confirm("Cancel this order?")) return;
    try {
      await api.post(`/orders/${id}/cancel`);
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data);
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(e.response?.data?.error || "Could not cancel");
    }
  };

  if (!order) return <div className="max-w-3xl mx-auto px-6 py-16 text-ink-3">Loading…</div>;

  const stepIdx = STEPS.findIndex((s) => s.id === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink mb-8">
        <ArrowLeft size={16} /> All orders
      </Link>

      <div className="label-eyebrow mb-4">Order #{order.id.slice(-8)}</div>
      <h1 className="font-serif text-4xl mb-3">
        {cancelled ? "Cancelled" : order.status === "delivered" ? "Delivered" : "On its way."}
      </h1>
      <p className="text-ink-2 mb-12">{new Date(order.created_at).toLocaleString()}</p>

      {/* Progress */}
      {!cancelled && (
        <div className="card p-8 mb-8">
          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const done = i <= stepIdx;
              const current = i === stepIdx;
              return (
                <div key={step.id} className="flex items-start gap-4">
                  {done ? (
                    <CheckCircle2 size={22} className="text-sage flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={22} className="text-ink-3 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-medium ${current ? "text-ink" : done ? "text-ink-2" : "text-ink-3"}`}>
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <h2 className="font-serif text-2xl mb-4">Items</h2>
        <div className="space-y-2 text-sm">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-ink-2">{i.quantity}× {i.name}</span>
              <span className="font-mono">${i.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-line pt-3 mt-3 flex justify-between font-medium">
            <span>Total</span>
            <span className="font-mono text-lg">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.address?.line1 && (
        <div className="card p-6 mb-6">
          <h2 className="font-serif text-2xl mb-3">Delivery to</h2>
          <p className="text-ink-2 text-sm leading-relaxed">
            {order.address.line1}<br />
            {order.address.city} {order.address.postal_code}<br />
            {order.address.country}
          </p>
        </div>
      )}

      {(order.status === "pending" || order.status === "confirmed") && (
        <button onClick={cancel} className="text-sm text-terra hover:underline">
          Cancel order
        </button>
      )}
    </div>
  );
}
