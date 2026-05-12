import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Heart, Plus, Minus, Star } from "lucide-react";
import { toast } from "sonner";

export default function MealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const [meal, setMeal] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });

  useEffect(() => {
    api.get(`/meals/${id}`).then((r) => setMeal(r.data)).catch(() => {});
    api.get(`/meals/${id}/reviews`).then((r) => setReviews(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (user) {
      api.get("/auth/me").then((r) => {
        setFav((r.data.favorites || []).includes(id));
      }).catch(() => {});
    }
  }, [user, id]);

  const addToCart = () => {
    add(meal, qty);
    toast.success(`Added ${qty} × ${meal.name} to cart`);
  };

  const toggleFav = async () => {
    if (!user) return navigate("/login");
    const { data } = await api.post(`/meals/${id}/favorite`);
    setFav(data.favorited);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    try {
      await api.post(`/meals/${id}/reviews`, reviewForm);
      const r = await api.get(`/meals/${id}/reviews`);
      setReviews(r.data);
      setReviewForm({ rating: 5, text: "" });
      toast.success("Review submitted");
    } catch {
      toast.error("Failed to submit review");
    }
  };

  if (!meal) return <div className="max-w-7xl mx-auto px-6 py-16 text-ink-3">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-8">
      <Link to="/meals" className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink mb-8">
        <ArrowLeft size={16} /> Back to meals
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-square rounded-3xl overflow-hidden bg-sage-light">
          {meal.image_url ? (
            <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sage/40 to-terra/30" />
          )}
        </div>

        <div>
          <div className="label-eyebrow">{meal.category}{meal.vegan && " · Vegan"}</div>
          <h1 className="font-serif text-5xl mt-3">{meal.name}</h1>
          {meal.rating_count > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.round(meal.rating_avg) ? "#8A9A5B" : "transparent"} stroke="#8A9A5B" />
                ))}
              </div>
              <span className="text-sm text-ink-2">{meal.rating_avg} ({meal.rating_count})</span>
            </div>
          )}
          <p className="text-ink-2 leading-relaxed mt-5">{meal.description}</p>

          <div className="grid grid-cols-4 gap-3 mt-8">
            {[
              { l: "kcal", v: meal.calories },
              { l: "protein", v: `${meal.protein}g` },
              { l: "carbs", v: `${meal.carbs}g` },
              { l: "fat", v: `${meal.fat}g` },
            ].map((s) => (
              <div key={s.l} className="bg-sage-light/50 rounded-2xl p-4 text-center">
                <div className="font-serif text-2xl">{s.v}</div>
                <div className="label-eyebrow mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          {meal.ingredients?.length > 0 && (
            <div className="mt-8">
              <div className="label-eyebrow mb-3">Ingredients</div>
              <p className="text-ink-2 text-sm">{meal.ingredients.join(" · ")}</p>
            </div>
          )}
          {meal.allergens?.length > 0 && (
            <div className="mt-6">
              <div className="label-eyebrow mb-3">Allergens</div>
              <p className="text-ink-2 text-sm">{meal.allergens.join(", ")}</p>
            </div>
          )}

          <div className="mt-10 flex items-end gap-4">
            <div className="font-mono text-3xl">${meal.price.toFixed(2)}</div>
            <div className="ml-auto flex items-center gap-3 border border-line rounded-full px-2 py-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-sage-light rounded-full">
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-sage-light rounded-full">
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={addToCart} className="btn-primary flex-1">Add to cart</button>
            <button onClick={toggleFav} className={`p-3 rounded-full border transition ${fav ? "bg-terra/10 border-terra text-terra" : "border-line text-ink-2 hover:border-ink"}`}>
              <Heart size={18} fill={fav ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-20 border-t border-line pt-12">
        <h2 className="font-serif text-3xl mb-8">Reviews</h2>
        {user && (
          <form onSubmit={submitReview} className="card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-ink-2 mr-2">Your rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                  <Star size={20} fill={n <= reviewForm.rating ? "#8A9A5B" : "transparent"} stroke="#8A9A5B" />
                </button>
              ))}
            </div>
            <textarea
              value={reviewForm.text}
              onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
              placeholder="Share your thoughts…"
              className="input min-h-[100px]"
            />
            <button type="submit" className="btn-primary mt-4">Post review</button>
          </form>
        )}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-ink-3 text-sm">No reviews yet — be the first!</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-sage-light grid place-items-center text-sm font-medium">
                    {(r.user_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{r.user_name || "Anonymous"}</div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < r.rating ? "#8A9A5B" : "transparent"} stroke="#8A9A5B" />
                      ))}
                    </div>
                  </div>
                </div>
                {r.text && <p className="text-ink-2 text-sm leading-relaxed">{r.text}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
