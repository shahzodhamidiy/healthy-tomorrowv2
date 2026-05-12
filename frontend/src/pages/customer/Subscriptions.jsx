import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Check } from "lucide-react";
import { toast } from "sonner";

export default function Subscriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [active, setActive] = useState(null);
  const [loadingId, setLoadingId] = useState("");

  useEffect(() => {
    api.get("/subscriptions/plans").then((r) => setPlans(r.data)).catch(() => {});
    if (user) {
      api.get("/subscriptions/mine").then((r) => {
        if (r.data.active) setActive(r.data.subscription);
      }).catch(() => {});
    }
  }, [user]);

  const subscribe = async (plan_id) => {
    if (!user) return navigate("/login");
    setLoadingId(plan_id);
    try {
      const { data } = await api.post("/subscriptions/subscribe", { plan_id });
      setActive(data);
      toast.success("Subscription activated");
    } catch {
      toast.error("Subscribe failed");
    } finally {
      setLoadingId("");
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel your subscription?")) return;
    await api.post("/subscriptions/cancel");
    setActive(null);
    toast.success("Subscription cancelled");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Plans</div>
      <h1 className="font-serif text-5xl md:text-6xl mb-10">Find your rhythm.</h1>

      {active && (
        <div className="card p-6 mb-10 flex items-center justify-between bg-sage-light/50">
          <div>
            <div className="label-eyebrow">Active</div>
            <div className="font-serif text-2xl mt-1">{active.plan_name}</div>
            <div className="text-sm text-ink-2 mt-1">${active.price}/week · next billing {new Date(active.next_billing).toLocaleDateString()}</div>
          </div>
          <button onClick={cancel} className="text-sm text-terra hover:underline">Cancel</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.plan_id} className={`card p-8 ${p.plan_id === "balanced" ? "border-sage border-2" : ""}`}>
            {p.plan_id === "balanced" && (
              <div className="label-eyebrow text-sage mb-3">Most popular</div>
            )}
            <div className="font-serif text-3xl">{p.name}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-serif text-5xl">${p.price}</span>
              <span className="text-ink-2 text-sm">/week</span>
            </div>
            <div className="text-sm text-ink-2 mt-1">{p.meals_per_week} meals weekly</div>
            <div className="mt-6 space-y-3">
              {p.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => subscribe(p.plan_id)}
              disabled={loadingId === p.plan_id || active?.plan_id === p.plan_id}
              className={`w-full mt-8 ${p.plan_id === "balanced" ? "btn-primary" : "btn-ghost"}`}
            >
              {active?.plan_id === p.plan_id ? "Current plan" : loadingId === p.plan_id ? "Subscribing…" : "Choose plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
