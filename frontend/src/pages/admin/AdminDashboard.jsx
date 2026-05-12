import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} className="text-sage" strokeWidth={1.4} />
      </div>
      <div className="font-serif text-3xl">{value}</div>
      <div className="text-xs text-ink-2 mt-1">{label}</div>
      {hint && <div className="text-xs text-ink-3 mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <AdminShell title="Dashboard"><div className="text-ink-3">Loading…</div></AdminShell>;

  return (
    <AdminShell title="Overview">
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Total users" value={stats.users.total} hint={`+${stats.users.new_30d} last 30d`} />
        <Stat icon={ShoppingBag} label="Total orders" value={stats.orders.total} hint={`${stats.orders.last_30d} last 30d`} />
        <Stat icon={DollarSign} label="Revenue" value={`$${stats.revenue.total.toLocaleString()}`} />
        <Stat icon={TrendingUp} label="Customers" value={stats.users.customers} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 lg:col-span-2">
          <div className="label-eyebrow mb-4">Revenue · last 30 days</div>
          {stats.revenue.daily.length === 0 ? (
            <div className="h-[240px] grid place-items-center text-ink-3 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.revenue.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8A948C" }} />
                <YAxis tick={{ fontSize: 10, fill: "#8A948C" }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8A9A5B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-4">Orders by status</div>
          <div className="space-y-3">
            {Object.entries(stats.orders.by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-ink-2 capitalize">{status.replace(/_/g, " ")}</span>
                <span className="font-mono font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(stats.orders.by_status || {}).length === 0 && (
              <div className="text-ink-3 text-sm">No orders yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="label-eyebrow mb-4">Top meals</div>
        {stats.top_meals.length === 0 ? (
          <div className="text-ink-3 text-sm">No sales data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.top_meals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8A948C" }} />
              <YAxis tick={{ fontSize: 10, fill: "#8A948C" }} />
              <Tooltip />
              <Bar dataKey="qty" fill="#E2725B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </AdminShell>
  );
}
