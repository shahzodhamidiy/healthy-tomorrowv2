import { useEffect, useState } from "react";
import DietitianShell from "@/components/DietitianShell";
import api from "@/lib/api";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function DietitianClients() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.get("/admin/users", { params: { role: "customer" } })
      .then((r) => setCustomers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const pick = async (u) => {
    setSelected(u);
    const { data } = await api.get(`/dietitian/users/${u.id}/health`);
    setHealth(data);
  };

  const weightData = (health?.weight_logs || []).map((w, i) => ({
    i, w: w.weight_kg, d: new Date(w.created_at).toLocaleDateString(),
  }));

  return (
    <DietitianShell title="Clients">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="label-eyebrow mb-3 px-2">Customers</div>
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c)}
              className={`w-full text-left p-3 rounded-xl mb-1 transition ${selected?.id === c.id ? "bg-sage-light" : "hover:bg-cream"}`}
            >
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-ink-3 font-mono">{c.email}</div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2">
          {!selected ? (
            <div className="card p-12 text-center text-ink-3">Select a client to view their health profile</div>
          ) : !health ? (
            <div className="card p-12 text-center text-ink-3">Loading…</div>
          ) : (
            <div className="space-y-4">
              <div className="card p-6">
                <div className="label-eyebrow">Client</div>
                <div className="font-serif text-2xl mt-1">{selected.name}</div>
                <div className="text-xs text-ink-3 font-mono">{selected.email}</div>
              </div>

              {health.bmi_logs.length > 0 && (
                <div className="card p-6">
                  <div className="label-eyebrow mb-3">Latest BMI</div>
                  <div className="font-serif text-4xl">{health.bmi_logs[0].bmi}</div>
                  <div className="text-xs text-ink-3 mt-1">
                    {new Date(health.bmi_logs[0].created_at).toLocaleDateString()}
                  </div>
                </div>
              )}

              {weightData.length >= 2 && (
                <div className="card p-6">
                  <div className="label-eyebrow mb-3">Weight trend</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weightData}>
                      <Line type="monotone" dataKey="w" stroke="#8A9A5B" strokeWidth={2} dot={{ r: 3, fill: "#2C352D" }} />
                      <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#8A948C" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#8A948C" }} domain={["dataMin - 1", "dataMax + 1"]} />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {health.bmi_logs.length === 0 && weightData.length < 2 && (
                <div className="card p-6 text-ink-3 text-sm">No health data logged yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </DietitianShell>
  );
}
