import { useEffect, useState } from "react";
import DietitianShell from "@/components/DietitianShell";
import api from "@/lib/api";
import { toast } from "sonner";

const STATUS_OPTIONS = ["scheduled", "completed", "cancelled"];

export default function DietitianAppointments() {
  const [appts, setAppts] = useState([]);

  const load = () =>
    api.get("/dietitian/appointments").then((r) => setAppts(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  useEffect(load, []);

  const update = async (id, fields) => {
    await api.patch(`/dietitian/appointments/${id}`, fields);
    toast.success("Updated");
    load();
  };

  return (
    <DietitianShell title="Appointments">
      <div className="space-y-3">
        {appts.length === 0 ? (
          <div className="text-ink-3 text-sm py-12 text-center">No appointments</div>
        ) : (
          appts.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="label-eyebrow capitalize">{a.status}</div>
                  <div className="font-serif text-xl mt-1">{a.topic}</div>
                  <div className="text-xs text-ink-3 font-mono mt-1">
                    Client: {a.user_id?.slice(-8)} · {new Date(a.scheduled_at).toLocaleString()}
                  </div>
                </div>
                <select
                  value={a.status}
                  onChange={(e) => update(a.id, { status: e.target.value })}
                  className="border border-line rounded-lg px-3 py-1.5 text-xs bg-white"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <textarea
                defaultValue={a.notes || ""}
                onBlur={(e) => e.target.value !== (a.notes || "") && update(a.id, { notes: e.target.value })}
                placeholder="Session notes…"
                className="input mt-4 min-h-[80px]"
              />
            </div>
          ))
        )}
      </div>
    </DietitianShell>
  );
}
