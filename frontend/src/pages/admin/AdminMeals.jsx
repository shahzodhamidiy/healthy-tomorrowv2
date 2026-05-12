import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  name: "", description: "", price: 0, calories: 0, protein: 0, carbs: 0, fat: 0,
  category: "Bowl", vegan: false, image_url: "", ingredients: [], allergens: [],
};

export default function AdminMeals() {
  const [meals, setMeals] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    api.get("/meals").then((r) => setMeals(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };
  useEffect(load, []);

  const startEdit = (m) => {
    setEditing(m.id);
    setForm({ ...EMPTY, ...m });
  };

  const startCreate = () => {
    setEditing("new");
    setForm(EMPTY);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        calories: parseInt(form.calories),
        protein: parseInt(form.protein),
        carbs: parseInt(form.carbs),
        fat: parseInt(form.fat),
        ingredients: typeof form.ingredients === "string"
          ? form.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
          : form.ingredients,
        allergens: typeof form.allergens === "string"
          ? form.allergens.split(",").map((s) => s.trim()).filter(Boolean)
          : form.allergens,
      };
      if (editing === "new") {
        await api.post("/admin/meals", payload);
        toast.success("Meal created");
      } else {
        await api.patch(`/admin/meals/${editing}`, payload);
        toast.success("Meal updated");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this meal?")) return;
    await api.delete(`/admin/meals/${id}`);
    toast.success("Deleted");
    load();
  };

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [k]: v });
  };

  return (
    <AdminShell title="Meals">
      <div className="flex justify-end mb-6">
        <button onClick={startCreate} className="btn-primary">
          <Plus size={16} /> New meal
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map((m) => (
          <div key={m.id} className="card overflow-hidden">
            <div className="aspect-[16/10] bg-sage-light">
              {m.image_url && <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="font-serif text-lg">{m.name}</div>
              <div className="text-xs text-ink-2 mt-1">{m.category} · ${m.price.toFixed(2)} · {m.calories} kcal</div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => startEdit(m)} className="text-xs px-3 py-1.5 border border-line rounded-full hover:bg-cream flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => remove(m.id)} className="text-xs px-3 py-1.5 border border-line rounded-full hover:bg-terra/10 hover:text-terra flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-2xl">{editing === "new" ? "New meal" : "Edit meal"}</h2>
                <button type="button" onClick={() => setEditing(null)}><X size={20} /></button>
              </div>
              <div>
                <label className="label">Name</label>
                <input value={form.name} onChange={set("name")} className="input" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={set("description")} className="input min-h-[80px]" />
              </div>
              <div>
                <label className="label">Image URL</label>
                <input value={form.image_url || ""} onChange={set("image_url")} className="input" placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price ($)</label>
                  <input type="number" step="0.01" value={form.price} onChange={set("price")} className="input" required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input value={form.category} onChange={set("category")} className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><label className="label">kcal</label><input type="number" value={form.calories} onChange={set("calories")} className="input" /></div>
                <div><label className="label">Protein g</label><input type="number" value={form.protein} onChange={set("protein")} className="input" /></div>
                <div><label className="label">Carbs g</label><input type="number" value={form.carbs} onChange={set("carbs")} className="input" /></div>
                <div><label className="label">Fat g</label><input type="number" value={form.fat} onChange={set("fat")} className="input" /></div>
              </div>
              <div>
                <label className="label">Ingredients (comma-separated)</label>
                <input value={Array.isArray(form.ingredients) ? form.ingredients.join(", ") : form.ingredients} onChange={set("ingredients")} className="input" />
              </div>
              <div>
                <label className="label">Allergens (comma-separated)</label>
                <input value={Array.isArray(form.allergens) ? form.allergens.join(", ") : form.allergens} onChange={set("allergens")} className="input" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.vegan} onChange={set("vegan")} /> Vegan
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
