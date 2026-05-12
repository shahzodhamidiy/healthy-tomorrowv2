import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, FileText } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/meals", label: "Meals", icon: UtensilsCrossed },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/reports", label: "Reports", icon: FileText },
];

export default function AdminShell({ children, title, eyebrow = "Admin" }) {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex gap-8">
      <aside className="w-56 flex-shrink-0 hidden md:block">
        <div className="label-eyebrow mb-4">Admin</div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? "bg-ink text-white" : "text-ink-2 hover:bg-cream"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="label-eyebrow mb-3">{eyebrow}</div>
        <h1 className="font-serif text-4xl md:text-5xl mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}
