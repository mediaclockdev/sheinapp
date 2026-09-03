import { useEffect, useState } from "react";
import {
  Users,
  Package,
  Star,
  Lock,
  UserPlus,
  Banknote,
  AlertTriangle,
  History,
} from "lucide-react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import apiClient, { getErrorMessage } from "../../lib/api/client";
import { toRow } from "../../lib/agents";
import { getInitials, imageUrl } from "../../lib/format";
import { ENDPOINTS } from "../../lib/api/endpoints";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#17222B",
      padding: 10,
      displayColors: false,
      callbacks: { label: (c) => `${c.parsed.y} orders` },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: "#8C959F", font: { size: 10, weight: 600 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: "#F0E9EB" },
      border: { display: false },
      ticks: { color: "#8C959F", font: { size: 10 }, precision: 0 },
    },
  },
};

const num = (v) => Number(v ?? 0).toLocaleString();

const statsOf = (d) => [
  { label: "Active Agents", value: num(d?.activeAgents), icon: Users },
  {
    label: "Global Order Volume",
    value: num(d?.globalOrderVolume),
    icon: Package,
  },
  {
    label: "Avg. Agent Trust Score",
    value: Number(d?.avgAgentTrustScore ?? 0).toFixed(2),
    icon: Star,
  },
];

// ponytail: the agent table below is still a fixture — no endpoint returns it yet.

const ACTIVITY_ICONS = [
  [/lock/i, Lock, "bg-[#FFE8EF] text-[#D24D77]"],
  [/regist|sign ?up|new agent/i, UserPlus, "bg-[#EEF4FB] text-[#5C5F60]"],
  [/payment|payout|paid/i, Banknote, "bg-green-50 text-green-600"],
  [
    /alert|fail|error|reject|suspend/i,
    AlertTriangle,
    "bg-amber-50 text-amber-600",
  ],
  [/order|batch/i, Package, "bg-[#EEF4FB] text-[#5C5F60]"],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [
  ["day", 86400e3],
  ["hour", 3600e3],
  ["minute", 60e3],
];
const timeAgo = (iso) => {
  const diff = new Date(iso) - Date.now();
  if (Number.isNaN(diff)) return "";
  const [unit, ms] = UNITS.find(([, size]) => Math.abs(diff) >= size) ?? [
    "minute",
    60e3,
  ];
  return rtf.format(Math.round(diff / ms), unit);
};

const mapActivity = (log) => {
  const title = log.title || log.detail || "Activity";
  // Matched against type + title so a new log type still picks a sane icon.
  const subject = `${log.type ?? ""} ${title}`;
  const [, icon, tint] = ACTIVITY_ICONS.find(([re]) => re.test(subject)) ?? [
    null,
    History,
    "bg-[#EEF4FB] text-[#5C5F60]",
  ];
  return {
    id: log.id,
    icon,
    tint,
    title,
    createdAt: log.createdAt,
    who: log.agent?.name || "System",
  };
};

const ACTIVITY_LIMIT = 10;

const RANGES = [
  { label: "24 Hours", value: "24h" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

const Stars = ({ count }) => (
  <span className="text-[#F5B301]" aria-label={`${count} out of 5`}>
    {"★".repeat(count)}
    <span className="text-[#E0E0E0]">{"★".repeat(5 - count)}</span>
  </span>
);

const STATUS_STYLES = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
  REJECTED: "bg-red-50 text-red-700",
};

const StatusPill = ({ status }) => (
  <span
    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}
  >
    {status}
  </span>
);

const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl border border-[#E8DFE1] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] ${className}`}
  >
    {children}
  </div>
);

const AdminDashboard = () => {
  const [range, setRange] = useState(RANGES[0].value);
  const [metrics, setMetrics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityError, setActivityError] = useState(null);
  const [, setTick] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(ENDPOINTS.admin.dashboard, { params: { Timeframe: range } })
      .then(({ data }) => !cancelled && setMetrics(data?.data ?? null))
      .catch(
        (err) =>
          !cancelled &&
          setError(getErrorMessage(err, "Failed to load metrics")),
      );
    return () => {
      cancelled = true;
    };
  }, [range]);

  // Preview of the agent list; the full table lives at /admin/agents.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(ENDPOINTS.admin.getAllAgents, { params: { page: 1, limit: 5 } })
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        setAgents(list.map(toRow));
        setTotalAgents(Number(data?.meta?.totalItems ?? list.length));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Global activity feed: last page from REST, then live over the socket.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(ENDPOINTS.admin.activityLogs, {
        params: { page: 1, limit: ACTIVITY_LIMIT },
      })
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : [];
        setActivity(list.map(mapActivity));
      })
      .catch(
        (err) =>
          !cancelled &&
          setActivityError(getErrorMessage(err, "Failed to load activity")),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    console.log("[activity] socket:", socket, "connected:", socket?.connected);
    if (!socket) return;

    const onConnect = () => console.log("[activity] connected:", socket.id);
    const onError = (err) =>
      console.log("[activity] connect_error:", err.message);
    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
    // Debug: logs EVERY event this socket receives, whatever its name.
    const onAny = (name, ...args) =>
      console.log("[activity] event:", name, args);
    socket.onAny(onAny);

    const onLog = (log) =>
      setActivity((prev) => {
        console.log("[activity] NEW_ADMIN_ACTIVITY:", log);
        const next = mapActivity(log);
        // The server may echo a log we already have; keep ids unique.
        return [next, ...prev.filter((a) => a.id !== next.id)].slice(
          0,
          ACTIVITY_LIMIT,
        );
      });

    socket.on("NEW_ADMIN_ACTIVITY", onLog);
    return () => {
      socket.offAny(onAny);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      socket.off("NEW_ADMIN_ACTIVITY", onLog);
    };
  }, [socket]);

  // Re-renders the feed so the relative timestamps keep moving.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const trends = metrics?.monthlyOrderTrends ?? [];
  const peak = Math.max(1, ...trends.map((t) => Number(t.volume) || 0));

  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17222B]">
            Global System Overview
          </h1>
          <p className="mt-1 text-sm text-[#5C5F60]">
            Live tracking and performance metrics for ShipLink Logistics.
          </p>
          {error && <p className="mt-1 text-sm text-[#D24D77]">{error}</p>}
        </div>
        <div className="flex rounded-lg border border-[#E8DFE1] bg-white p-1">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                range === value
                  ? "bg-[#F8FAFF] text-[#17222B] shadow-sm"
                  : "text-[#8C959F] hover:text-[#17222B]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {statsOf(metrics).map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE8EF] text-[#D24D77]">
              <Icon size={18} />
            </div>
            <p className="mt-5 text-xs font-semibold text-[#5C5F60]">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[#17222B]">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Trends */}
          <Card className="p-5">
            <h2 className="mb-6 text-lg font-bold text-[#17222B]">
              Monthly Order Trends
            </h2>
            <div className="h-[220px]">
              <Bar
                data={{
                  labels: trends.map((t) => t.month),
                  datasets: [
                    {
                      data: trends.map((t) => Number(t.volume) || 0),
                      // The busiest month keeps the dark accent the design calls for.
                      backgroundColor: trends.map((t) =>
                        (Number(t.volume) || 0) === peak
                          ? "#78555E"
                          : "#FFD1DC",
                      ),
                      borderRadius: 3,
                      maxBarThickness: 44,
                    },
                  ],
                }}
                options={CHART_OPTIONS}
              />
            </div>
          </Card>

          {/* Agents */}
          <Card className="overflow-hidden">
            <h2 className="p-5 text-lg font-bold text-[#17222B]">
              Agent Management
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-y border-[#E8DFE1] text-[11px] font-semibold text-[#8C959F]">
                    <th className="px-5 py-3">Agent Name</th>
                    <th className="px-5 py-3">Region</th>
                    <th className="px-5 py-3">Active Batches</th>
                    <th className="px-5 py-3">Trust Rating</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-[#E8DFE1] last:border-0 hover:bg-[#F8FAFF]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFE8EF] text-[11px] font-bold text-[#D24D77]">
                            {getInitials(a.name)}
                            {a.avatarUrl && (
                              <img
                                src={imageUrl(a.avatarUrl)}
                                alt={a.name}
                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                // Hiding a dead image uncovers the initials underneath.
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            )}
                          </span>
                          <span className="text-sm font-bold text-[#141D23]">
                            {a.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#5C5F60]">
                        {a.region}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-[#141D23]">
                        {a.batches}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <Stars count={Math.round(a.rating ?? 0)} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-[#F8FAFF] px-5 py-3">
              <span className="text-xs text-[#8C959F]">
                Showing 1-{agents.length} of {num(totalAgents)} agents
              </span>
              <Link
                to="/admin/agents"
                className="text-xs font-semibold text-[#141D23] hover:text-[#D24D77]"
              >
                View all agents
              </Link>
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card className="flex flex-col self-start">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-lg font-bold text-[#17222B]">
              Global Activity
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#D24D77]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D24D77]" />
              LIVE
            </span>
          </div>

          <ul className="flex-1 px-5">
            {activity.length === 0 ? (
              <li className="py-8 text-center text-sm text-[#8C959F]">
                {activityError ?? "No recent activity."}
              </li>
            ) : (
              activity.map(
                ({ id, icon: Icon, tint, title, createdAt, who }) => (
                  <li
                    key={id}
                    className="flex gap-3 border-b border-[#E8DFE1] py-4 last:border-0"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-[#141D23]">
                        {title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8C959F]">
                        {[timeAgo(createdAt), who].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </li>
                ),
              )
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
