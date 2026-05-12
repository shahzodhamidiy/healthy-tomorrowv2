import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="label-eyebrow mb-4">Get started</div>
      <h1 className="font-serif text-5xl mb-10">Create account.</h1>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">Full name</label>
          <input
            value={form.name}
            onChange={set("name")}
            className="input"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Password (min 6 chars)</label>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            className="input"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="label">I am a…</label>
          <select value={form.role} onChange={set("role")} className="input">
            <option value="customer">Customer</option>
            <option value="dietitian">Dietitian</option>
            <option value="delivery">Delivery staff</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-sm text-ink-2 text-center pt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-sage hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
