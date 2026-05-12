import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DietitianShell from "@/components/DietitianShell";
import api from "@/lib/api";
import { Calendar, Users, MessageCircle } from "lucide-react";

export default function DietitianDashboard() {
  const [appts, setAppts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get("/dietitian/appointments").then((r) => setAppts(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get("/dietitian/meal-plans").then((r) => setPlans(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get("/chat/rooms").then((r) => setRooms(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const upcoming = appts.filter((a) => a.status !== "completed" && a.status !== "cancelled");

  return (
    <DietitianShell title="Overview">
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <Calendar size={18} className="text-sage mb-3" strokeWidth={1.4} />
          <div className="font-serif text-3xl">{upcoming.length}</div>
          <div className="text-xs text-ink-2 mt-1">Upcoming appointments</div>
        </div>
        <div className="card p-6">
          <Users size={18} className="text-sage mb-3" strokeWidth={1.4} />
          <div className="font-serif text-3xl">{plans.length}</div>
          <div className="text-xs text-ink-2 mt-1">Active meal plans</div>
        </div>
        <div className="card p-6">
          <MessageCircle size={18} className="text-sage mb-3" strokeWidth={1.4} />
          <div className="font-serif text-3xl">{rooms.length}</div>
          <div className="text-xs text-ink-2 mt-1">Conversations</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Next appointments</h2>
            <Link to="/dietitian/appointments" className="text-xs text-sage hover:underline">See all</Link>
          </div>
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((a) => (
              <div key={a.id} className="border border-line rounded-xl p-3">
                <div className="font-medium text-sm">{a.topic}</div>
                <div className="text-xs text-ink-3 mt-1">{new Date(a.scheduled_at).toLocaleString()}</div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="text-ink-3 text-sm">No upcoming appointments</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-xl mb-4">Recent conversations</h2>
          <div className="space-y-3">
            {rooms.slice(0, 5).map((r) => (
              <Link key={r.id} to="/chat" className="block border border-line rounded-xl p-3 hover:bg-cream">
                <div className="font-medium text-sm">{r.peers?.[0]?.name || "Customer"}</div>
                <div className="text-xs text-ink-3 truncate mt-1">{r.last_message || "—"}</div>
              </Link>
            ))}
            {rooms.length === 0 && (
              <div className="text-ink-3 text-sm">No conversations yet</div>
            )}
          </div>
        </div>
      </div>
    </DietitianShell>
  );
}
