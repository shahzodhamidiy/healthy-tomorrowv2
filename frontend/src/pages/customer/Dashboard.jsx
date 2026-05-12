import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Heart, ShoppingBag, MessageCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

function BMIGauge({ bmi }) {
  const min = 14, max = 40;
  const pct = Math.max(0, Math.min(1, (bmi - min) / (max - min)));
  const angle = -135 + pct * 270;
  const polar = (cx, cy, r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const r = 88, cx = 110, cy = 110;
  const start = polar(cx, cy, r, -135), end = polar(cx, cy, r, 135);
  const progEnd = polar(cx, cy, r, angle);
  const bg = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const fg = `M ${start.x} ${start.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${progEnd.x} ${progEnd.y}`;
  const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      <path d={bg} stroke="#E4E2DC" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d={fg} stroke="#8A9A5B" strokeWidth="10" fill="none" strokeLinecap="round" />
      <text x="110" y="108" textAnchor="middle" fontFamily="Instrument Serif" fontSize="44" fill="#2C352D">{bmi.toFixed(1)}</text>
      <text x="110" y="138" textAnchor="middle" fontSize="11" letterSpacing="2" fill="#5C665D">{cat.toUpperCase()}</text>
    </svg>
  );
}

function CalorieRing({ value, goal = 2000 }) {
  const pct = Math.min(1, value / goal);
  const r = 88, c = 2 * Math.PI * r;
  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      <circle cx="110" cy="110" r={r} stroke="#E4E2DC" strokeWidth="10" fill="none" />
      <circle cx="110" cy="110" r={r} stroke="#E2725B" strokeWidth="10" fill="none"
        strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 110 110)" />
      <text x="110" y="108" textAnchor="middle" fontFamily="Instrument Serif" fontSize="44" fill="#2C352D">{value}</text>
      <text x="110" y="138" textAnchor="middle" fontSize="11" letterSpacing="2" fill="#5C665D">KCAL · OF {goal}</text>
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [bmiList, setBmiList] = useState([]);
  const [weightList, setWeightList] = useState([]);
  const [calToday, setCalToday] = useState(0);
  const [recommended, setRecommended] = useState([]);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const load = async () => {
    try {
      const [b, w, c, rec] = await Promise.all([
        api.get("/health/bmi"),
        api.get("/health/weight"),
        api.get("/health/calories/today"),
        api.get("/meals/recommended"),
      ]);
      setBmiList(Array.isArray(b.data) ? b.data : []);
      setWeightList(Array.isArray(w.data) ? w.data : []);
      setCalToday(c.data?.total || 0);
      setRecommended(Array.isArray(rec.data) ? rec.data.slice(0, 3) : []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const addBMI = async () => {
    if (!height || !weight) return toast.error("Enter both values");
    try {
      await api.post("/health/bmi", { height_cm: parseFloat(height), weight_kg: parseFloat(weight) });
      await api.post("/health/weight", { weight_kg: parseFloat(weight) });
      setHeight(""); setWeight("");
      toast.success("Logged");
      load();
    } catch {
      toast.error("Failed to log");
    }
  };

  const addCal = async (v) => {
    try {
      await api.post("/health/calories", { calories: v });
      setCalToday((x) => x + v);
    } catch {}
  };

  const latestBmi = bmiList[0]?.bmi || 0;
  const weightData = weightList.map((w, i) => ({
    i, w: w.weight_kg, d: new Date(w.created_at).toLocaleDateString(),
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
        <div>
          <div className="label-eyebrow">Welcome back</div>
          <h1 className="font-serif text-5xl md:text-6xl mt-3">
            Hello, {user?.name?.split(" ")[0] || "friend"}.
          </h1>
        </div>
        <div className="text-ink-2 text-sm">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-4 gap-3 mb-10">
        {[
          { to: "/orders", icon: ShoppingBag, label: "Orders" },
          { to: "/favorites", icon: Heart, label: "Favorites" },
          { to: "/chat", icon: MessageCircle, label: "Dietitian chat" },
          { to: "/subscriptions", icon: Calendar, label: "Plans" },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="card card-hover p-5 flex items-center gap-3">
            <Icon size={20} strokeWidth={1.4} className="text-sage" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Health widgets */}
      <div className="grid lg:grid-cols-12 gap-6 mb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8 lg:col-span-4">
          <div className="label-eyebrow mb-4">BMI</div>
          <div className="flex justify-center"><BMIGauge bmi={latestBmi} /></div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height (cm)" className="input" />
            <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (kg)" className="input" />
          </div>
          <button onClick={addBMI} className="btn-primary w-full mt-3 text-sm">Log measurement</button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-8 lg:col-span-4">
          <div className="label-eyebrow mb-4">Today's calories</div>
          <div className="flex justify-center"><CalorieRing value={calToday} /></div>
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[250, 500, 750].map((v) => (
              <button key={v} onClick={() => addCal(v)} className="border border-line rounded-full px-3 py-2 text-xs hover:bg-sage-light transition">
                + {v}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-8 lg:col-span-4">
          <div className="label-eyebrow mb-4">Weight trend</div>
          {weightData.length < 2 ? (
            <div className="h-[180px] grid place-items-center text-sm text-ink-3 text-center">
              Log more weights to see your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightData}>
                <Line type="monotone" dataKey="w" stroke="#8A9A5B" strokeWidth={2} dot={{ r: 3, fill: "#2C352D" }} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#8A948C" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8A948C" }} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="text-sm text-ink-2 mt-3">
            {weightList.length > 0 ? `Latest: ${weightList[weightList.length - 1].weight_kg} kg` : "No entries yet."}
          </div>
        </motion.div>
      </div>

      {/* Recommended */}
      <div>
        <div className="label-eyebrow mb-3">Recommended for you</div>
        <h2 className="font-serif text-3xl md:text-4xl mb-8">Picked for your goals.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {recommended.length === 0 ? (
            <div className="col-span-3 text-ink-3 text-sm">Log your BMI to see personalized recommendations.</div>
          ) : (
            recommended.map((m) => (
              <Link key={m.id} to={`/meals/${m.id}`} className="card card-hover overflow-hidden">
                <div className="aspect-[4/3] bg-sage-light">
                  {m.image_url && <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-5">
                  <div className="font-serif text-xl">{m.name}</div>
                  <div className="text-xs text-ink-2 mt-1 font-mono">{m.calories} kcal · ${m.price.toFixed(2)}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
