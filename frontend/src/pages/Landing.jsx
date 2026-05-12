import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Heart, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Landing() {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    api
      .get("/meals")
      .then((r) =>
        setMeals(Array.isArray(r.data) ? r.data.slice(0, 3) : [])
      )
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 relative z-10">
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              className="label-eyebrow mb-6"
            >
              · A new chapter in eating well
            </motion.div>
            <motion.h1
              variants={fade}
              initial="hidden"
              animate="show"
              custom={1}
              className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight"
            >
              Eat with <em className="italic">intention.</em>
              <br />
              Live with <span className="text-sage">vitality.</span>
            </motion.h1>
            <motion.p
              variants={fade}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-6 text-lg text-ink-2 max-w-xl leading-relaxed"
            >
              Chef-crafted meals tuned to your goals. Track BMI, calories and
              progress. Chat with a real dietitian — all in one quiet, beautiful
              place.
            </motion.p>
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link to="/meals" className="btn-primary">
                Browse meals <ArrowRight size={16} />
              </Link>
              {user ? (
                <Link to="/dashboard" className="btn-ghost">
                  Go to dashboard
                </Link>
              ) : (
                <Link to="/register" className="btn-ghost">
                  Create account
                </Link>
              )}
            </motion.div>
            <motion.div
              variants={fade}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-14 grid grid-cols-3 gap-6 max-w-md"
            >
              {[
                { n: "12k+", l: "Meals delivered" },
                { n: "98%", l: "Happy eaters" },
                { n: "24/7", l: "Dietitian chat" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-serif text-3xl">{s.n}</div>
                  <div className="label-eyebrow mt-1">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="lg:col-span-5 h-[420px] md:h-[520px] relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 40% 40%, rgba(138,154,91,0.30) 0%, rgba(226,114,91,0.18) 50%, transparent 70%)",
              }}
            />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-8 top-12 w-44 h-44 rounded-full bg-sage/80"
            />
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-32 top-48 w-28 h-28 rounded-full bg-terra/70"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-4 bottom-12 w-20 h-20 rounded-full bg-sage-light"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-line max-w-7xl mx-auto" />

      {/* Pillars */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-5">
            <div className="label-eyebrow mb-4">What we believe</div>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">
              Food, but considered.
            </h2>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-ink-2 text-lg leading-relaxed">
            Healthy Tomorrow is built on three quiet ideas: real ingredients,
            real expertise, real progress. Everything else is decoration.
          </p>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Leaf,
              t: "Seasonal & whole",
              d: "Sourced locally, cooked daily. No fillers, no shortcuts.",
            },
            {
              icon: Heart,
              t: "Built around you",
              d: "Macros, allergies, goals — every plan is personal.",
            },
            {
              icon: Sparkles,
              t: "Quiet luxury",
              d: "From plating to packaging — designed to feel calm.",
            },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.t}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="card card-hover p-10"
              >
                <Icon size={28} strokeWidth={1.4} className="text-sage" />
                <div className="font-serif text-2xl mt-6">{c.t}</div>
                <p className="text-ink-2 mt-3 leading-relaxed">{c.d}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured meals */}
      <section className="bg-sage-light/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <div className="label-eyebrow mb-4">This week</div>
              <h2 className="font-serif text-4xl md:text-5xl">Featured meals.</h2>
            </div>
            <Link
              to="/meals"
              className="text-sm underline underline-offset-4 hover:text-sage"
            >
              See all meals →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {meals.length === 0 ? (
              <div className="col-span-3 text-ink-3 text-sm">
                Loading featured meals…
              </div>
            ) : (
              meals.map((m, i) => (
                <motion.div
                  key={m.id}
                  variants={fade}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  custom={i}
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
                      <div className="label-eyebrow">{m.category}</div>
                      <div className="font-serif text-2xl mt-2">{m.name}</div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-ink-2 text-sm">
                          {m.calories} kcal · {m.protein}g protein
                        </div>
                        <div className="font-mono">${m.price.toFixed(2)}</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="label-eyebrow mb-4">Loved quietly</div>
        <h2 className="font-serif text-4xl md:text-5xl mb-12">
          From our table to yours.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              q: "Finally, healthy food that actually tastes like food. My energy is back.",
              n: "— Maya, customer of 6 months",
            },
            {
              q: "The dietitian chat helped me sort out my macros in a single afternoon.",
              n: "— Daniel, customer of 3 months",
            },
            {
              q: "It feels less like a meal kit, more like having a chef in your corner.",
              n: "— Priya, customer of 1 year",
            },
          ].map((t) => (
            <div key={t.n} className="card p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="#8A9A5B"
                    strokeWidth={0}
                  />
                ))}
              </div>
              <p className="font-serif text-2xl leading-snug">"{t.q}"</p>
              <p className="text-ink-3 text-sm mt-6">{t.n}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8">
            <div className="label-eyebrow mb-4">Start today</div>
            <h2 className="font-serif text-5xl md:text-6xl leading-[0.95]">
              Your healthier <em className="italic">tomorrow</em> begins with one meal.
            </h2>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/meals" className="btn-primary">Order a meal</Link>
              <Link to="/subscriptions" className="btn-ghost">See plans</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
