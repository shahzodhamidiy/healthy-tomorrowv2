import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";

export default function Favorites() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/meals/favorites/list")
      .then((r) => setMeals(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Saved by you</div>
      <h1 className="font-serif text-5xl md:text-6xl mb-10">Favorites.</h1>
      {loading ? (
        <div className="text-ink-3 text-sm">Loading…</div>
      ) : meals.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-ink-2 mb-6">You haven't saved any meals yet.</p>
          <Link to="/meals" className="btn-primary inline-flex">Browse meals</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((m) => (
            <Link key={m.id} to={`/meals/${m.id}`} className="card card-hover overflow-hidden">
              <div className="aspect-[4/3] bg-sage-light">
                {m.image_url && <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-5">
                <div className="font-serif text-xl">{m.name}</div>
                <div className="text-xs text-ink-2 mt-1 font-mono">{m.calories} kcal · ${m.price.toFixed(2)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
