import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pwd, setPwd] = useState({ old_password: "", new_password: "" });
  const [addr, setAddr] = useState({ label: "Home", line1: "", city: "", postal_code: "", country: "" });
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "" });
      setAddresses(user.addresses || []);
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/users/me", form);
      toast.success("Profile updated");
      refresh();
    } catch {
      toast.error("Update failed");
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/users/me/addresses", addr);
      setAddresses([...addresses, data]);
      setAddr({ label: "Home", line1: "", city: "", postal_code: "", country: "" });
      toast.success("Address added");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const removeAddress = async (id) => {
    await api.delete(`/users/me/addresses/${id}`);
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  const changePwd = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users/me/change-password", pwd);
      setPwd({ old_password: "", new_password: "" });
      toast.success("Password changed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
      <div className="label-eyebrow mb-4">Your account</div>
      <h1 className="font-serif text-5xl mb-10">Profile.</h1>

      <form onSubmit={save} className="card p-8 mb-6 space-y-4">
        <h2 className="font-serif text-2xl mb-2">Details</h2>
        <div>
          <label className="label">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
        </div>
        <button type="submit" className="btn-primary">Save changes</button>
      </form>

      <div className="card p-8 mb-6">
        <h2 className="font-serif text-2xl mb-4">Addresses</h2>
        <div className="space-y-3 mb-6">
          {addresses.length === 0 ? (
            <p className="text-ink-3 text-sm">No saved addresses.</p>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 border border-line rounded-xl">
                <div>
                  <div className="label-eyebrow">{a.label}</div>
                  <div className="text-sm mt-1">{a.line1}, {a.city} {a.postal_code}</div>
                </div>
                <button onClick={() => removeAddress(a.id)} className="text-ink-3 hover:text-terra">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <form onSubmit={addAddress} className="space-y-3">
          <input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Label (Home, Work)" className="input" />
          <input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="Street address" className="input" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="City" className="input" />
            <input value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} placeholder="Postal code" className="input" />
          </div>
          <input value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} placeholder="Country" className="input" />
          <button type="submit" className="btn-ghost">Add address</button>
        </form>
      </div>

      <form onSubmit={changePwd} className="card p-8 space-y-4">
        <h2 className="font-serif text-2xl mb-2">Change password</h2>
        <div>
          <label className="label">Current password</label>
          <input type="password" value={pwd.old_password} onChange={(e) => setPwd({ ...pwd, old_password: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} className="input" required minLength={6} />
        </div>
        <button type="submit" className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
