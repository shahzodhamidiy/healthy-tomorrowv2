import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["customer", "dietitian", "delivery", "admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const load = () => {
    const params = {};
    if (q) params.q = q;
    if (role) params.role = role;
    api.get("/admin/users", { params })
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  };

  useEffect(load, []);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, role]);

  const updateRole = async (id, newRole) => {
    await api.patch(`/admin/users/${id}`, { role: newRole });
    toast.success("Role updated");
    load();
  };

  const toggleSuspend = async (u) => {
    await api.patch(`/admin/users/${u.id}`, { suspended: !u.suspended });
    toast.success(u.suspended ? "Unsuspended" : "Suspended");
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("User deleted");
    load();
  };

  return (
    <AdminShell title="Users">
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="input pl-11"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input md:w-48">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-line">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line hover:bg-cream/50">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-ink-2 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className="border border-line rounded-lg px-2 py-1 text-xs bg-white"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSuspend(u)}
                    className={`text-xs px-2 py-1 rounded-full ${u.suspended ? "bg-red-100 text-red-700" : "bg-sage-light text-sage-dark"}`}
                  >
                    {u.suspended ? "suspended" : "active"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(u.id)} className="text-ink-3 hover:text-terra">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-3 text-sm">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
