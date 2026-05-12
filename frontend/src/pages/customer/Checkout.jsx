import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addr, setAddr] = useState({
    line1: "",
    city: "",
    postal_code: "",
    country: "",
  });

  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!addr.line1) return toast.error("Please enter a delivery address");
    setLoading(true);
    try {
      const { data: order } = await api.post("/orders", {
        items: items.map((i) => ({ meal_id: i.meal_id, quantity: i.quantity })),
        address: addr,
      });
      const { data: pay } = await api.post("/payments/checkout", {
        order_id: order.id,
        success_url: `${window.location.origin}/orders/${order.id}`,
        cancel_url: `${window.location.origin}/cart`,
      });
      clear();
      if (pay.mock) {
        toast.success("Order placed (mock payment)");
        navigate(`/orders/${order.id}`);
      } else {
        window.location.href = pay.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center text-ink-2">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Final step</div>
      <h1 className="font-serif text-5xl mb-10">Checkout.</h1>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="font-serif text-2xl mb-4">Delivery address</h2>
          <div>
            <label className="label">Street address</label>
            <input value={addr.line1} onChange={set("line1")} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input value={addr.city} onChange={set("city")} className="input" required />
            </div>
            <div>
              <label className="label">Postal code</label>
              <input value={addr.postal_code} onChange={set("postal_code")} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Country</label>
            <input value={addr.country} onChange={set("country")} className="input" />
          </div>
        </div>

        <div className="card p-6 h-fit">
          <h2 className="font-serif text-2xl mb-6">Your order</h2>
          <div className="space-y-2 text-sm mb-6">
            {items.map((i) => (
              <div key={i.meal_id} className="flex justify-between">
                <span className="text-ink-2">{i.quantity}× {i.name}</span>
                <span className="font-mono">${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-line pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-2"><span>Subtotal</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-ink-2"><span>Delivery</span><span className="font-mono">$3.50</span></div>
            <div className="flex justify-between font-medium pt-2 border-t border-line">
              <span>Total</span><span className="font-mono text-lg">${(subtotal + 3.5).toFixed(2)}</span>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}
