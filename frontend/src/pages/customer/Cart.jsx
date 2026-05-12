import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const checkout = () => {
    if (!user) return navigate("/login", { state: { from: "/checkout" } });
    navigate("/checkout");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Your cart</div>
      <h1 className="font-serif text-5xl md:text-6xl mb-10">Almost there.</h1>

      {items.length === 0 ? (
        <div className="card p-16 text-center">
          <ShoppingBag size={40} className="mx-auto text-ink-3 mb-4" strokeWidth={1.2} />
          <p className="text-ink-2 mb-6">Your cart is empty.</p>
          <Link to="/meals" className="btn-primary inline-flex">Browse meals</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.meal_id} className="card p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-sage-light overflow-hidden flex-shrink-0">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/meals/${item.meal_id}`} className="font-serif text-xl hover:underline">
                    {item.name}
                  </Link>
                  <div className="font-mono text-sm text-ink-2 mt-1">${item.price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center gap-2 border border-line rounded-full px-2 py-1">
                  <button onClick={() => setQty(item.meal_id, item.quantity - 1)} className="p-1.5 hover:bg-sage-light rounded-full">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => setQty(item.meal_id, item.quantity + 1)} className="p-1.5 hover:bg-sage-light rounded-full">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="font-mono w-20 text-right">${(item.price * item.quantity).toFixed(2)}</div>
                <button onClick={() => remove(item.meal_id)} className="p-2 text-ink-3 hover:text-terra rounded-full">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={clear} className="text-xs text-ink-3 hover:text-terra underline">
              Clear cart
            </button>
          </div>
          <div className="card p-6 h-fit sticky top-24">
            <h2 className="font-serif text-2xl mb-6">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink-2">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>Delivery</span>
                <span className="font-mono">$3.50</span>
              </div>
              <div className="border-t border-line pt-3 flex justify-between font-medium">
                <span>Total</span>
                <span className="font-mono text-lg">${(subtotal + 3.5).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={checkout} className="btn-primary w-full mt-6">
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
