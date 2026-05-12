import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, LogOut, User } from "lucide-react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? "text-ink font-medium" : "text-ink-2 hover:text-ink"}`;

  const dashboardPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "dietitian"
      ? "/dietitian"
      : user?.role === "delivery"
      ? "/delivery"
      : "/dashboard";

  return (
    <div className="min-h-screen grain">
      <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-sage group-hover:scale-110 transition-transform" />
            <span className="font-serif text-xl">Healthy Tomorrow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/meals" className={linkClass}>Meals</NavLink>
            <NavLink to="/subscriptions" className={linkClass}>Plans</NavLink>
            {user && (
              <NavLink to="/chat" className={linkClass}>Chat</NavLink>
            )}
            {user && (
              <NavLink to={dashboardPath} className={linkClass}>
                {user.role === "customer" ? "Dashboard" : user.role}
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-sage-light transition"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-terra text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="p-2 rounded-full hover:bg-sage-light transition"
                  aria-label="Account"
                >
                  <User size={18} />
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="p-2 rounded-full hover:bg-sage-light transition"
                  aria-label="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary btn-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-line mt-32">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid md:grid-cols-3 gap-8 text-sm text-ink-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-sage" />
              <span className="font-serif text-lg text-ink">Healthy Tomorrow</span>
            </div>
            <p>Eat with intention. Live with vitality.</p>
          </div>
          <div>
            <div className="label-eyebrow mb-3">Product</div>
            <div className="space-y-2">
              <Link to="/meals" className="block hover:text-ink">Meals</Link>
              <Link to="/subscriptions" className="block hover:text-ink">Subscriptions</Link>
            </div>
          </div>
          <div>
            <div className="label-eyebrow mb-3">Company</div>
            <div className="space-y-2">
              <a href="#" className="block hover:text-ink">About</a>
              <a href="#" className="block hover:text-ink">Careers</a>
              <a href="#" className="block hover:text-ink">Contact</a>
            </div>
          </div>
        </div>
        <div className="border-t border-line py-6 text-center text-xs text-ink-3">
          © {new Date().getFullYear()} Healthy Tomorrow
        </div>
      </footer>
    </div>
  );
}
