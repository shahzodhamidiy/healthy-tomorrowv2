import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [vegan, setVegan] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/meals/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== "all") params.category = category;
    if (vegan) params.vegan = "1";
    if (q) params.q = q;
    api
      .get("/meals", { params })
      .then((r) => setMeals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false));
  }, [category, vegan, q]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Our menu</div>
      <h1 className="font-serif text-5xl md:text-6xl mb-10">Today's meals.</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            placeholder="Search meals…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                category === c
                  ? "bg-ink text-white"
                  : "bg-white border border-line text-ink-2 hover:border-ink"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
          <button
            onClick={() => setVegan(!vegan)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
              vegan
                ? "bg-sage text-white"
                : "bg-white border border-line text-ink-2 hover:border-ink"
            }`}
          >
            🌱 Vegan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-ink-3 text-sm">Loading meals…</div>
      ) : meals.length === 0 ? (
        <div className="text-ink-3 text-sm py-12 text-center">
          No meals match your filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
            >
              <Link
                to={`/meals/${m.id}`}
                className="block card card-hover overflow-hidden"
              >
                <div className="aspect-[4/3] bg-sage-light overflow-hidden">
                  {m.image_url ? (
                    <img
                      src={m.image_url}
                      alt={m.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sage/40 to-terra/30" />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="label-eyebrow">{m.category}</div>
                    {m.vegan && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sage-light text-sage-dark">
                        Vegan
                      </span>
                    )}
                  </div>
                  <div className="font-serif text-2xl mt-2">{m.name}</div>
                  <p className="text-sm text-ink-2 mt-2 line-clamp-2">
                    {m.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                    <div className="text-xs text-ink-3">
                      {m.calories} kcal · {m.protein}g protein
                    </div>
                    <div className="font-mono text-lg">${m.price.toFixed(2)}</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
