import { useEffect, useState } from "react";
import DeliveryShell from "@/components/DeliveryShell";
import api from "@/lib/api";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function DeliveryEarnings() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/delivery/earnings").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <DeliveryShell title="Earnings"><div className="text-ink-3">Loading…</div></DeliveryShell>;

  return (
    <DeliveryShell title="Earnings">
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="label-eyebrow mb-3">Total earnings</div>
          <div className="font-serif text-4xl">${data.total_earnings.toFixed(2)}</div>
          <div className="text-xs text-ink-3 mt-1">{data.total_deliveries} deliveries</div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-3">Last 30 days</div>
          <div className="font-serif text-4xl">${data.earnings_30d.toFixed(2)}</div>
          <div className="text-xs text-ink-3 mt-1">{data.deliveries_30d} deliveries</div>
        </div>
        <div className="card p-6">
          <div className="label-eyebrow mb-3">Per delivery</div>
          <div className="font-serif text-4xl">${data.fee_per_delivery.toFixed(2)}</div>
        </div>
      </div>

      <div className="card p-6">
        <div className="label-eyebrow mb-4">Daily earnings · last 30 days</div>
        {data.daily.length === 0 ? (
          <div className="h-[240px] grid place-items-center text-ink-3 text-sm">No deliveries yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8A948C" }} />
              <YAxis tick={{ fontSize: 10, fill: "#8A948C" }} />
              <Tooltip />
              <Bar dataKey="earnings" fill="#8A9A5B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </DeliveryShell>
  );
}
