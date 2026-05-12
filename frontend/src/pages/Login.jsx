import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}`);
      // Smart redirect by role
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "dietitian") navigate("/dietitian");
      else if (user.role === "delivery") navigate("/delivery");
      else navigate(from === "/" || from === "/login" ? "/dashboard" : from);
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="label-eyebrow mb-4">Welcome back</div>
      <h1 className="font-serif text-5xl mb-10">Sign in.</h1>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-ink-2 text-center pt-4">
          No account?{" "}
          <Link to="/register" className="text-sage hover:underline">
            Create one
          </Link>
        </p>
      </form>

      <div className="mt-12 p-6 bg-sage-light/50 rounded-2xl text-xs text-ink-2 leading-relaxed">
        <div className="label-eyebrow mb-2 text-ink-2">Demo accounts</div>
        <div className="space-y-1 font-mono">
          <div>admin@healthytomorrow.app / admin123</div>
          <div>demo@healthytomorrow.app / demo123</div>
          <div>sarah@healthytomorrow.app / dietitian123</div>
          <div>alex@healthytomorrow.app / delivery123</div>
        </div>
      </div>
    </div>
  );
}
