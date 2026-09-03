import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { getErrorMessage } from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";
import {
  // Eye,
  // MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { filterAgents, toRow } from "../../lib/agents";
import { getInitials, imageUrl } from "../../lib/format";

const STATUSES = ["All", "ACTIVE", "PENDING", "SUSPENDED", "REJECTED"];
const RATINGS = [1, 2, 3, 4, 5];
const PAGE_SIZES = [10, 25, 50];

const STATUS_STYLES = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
  REJECTED: "bg-red-50 text-red-700",
};

// Fourth action depends on where the agent sits in the review lifecycle.

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const Select = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`cursor-pointer rounded-lg border border-[#E8DFE1] bg-white py-2 pl-3 pr-5 text-sm font-semibold text-[#17222B] focus:border-[#D24D77] focus:outline-none ${className}`}
  >
    {children}
  </select>
);

// Row actions are parked until the message/suspend endpoints exist — clicking
// the row opens the agent instead.
// const IconButton = ({ icon: Icon, label, danger, onClick }) => (
//   <button
//     onClick={onClick}
//     title={label}
//     aria-label={label}
//     className={`rounded-lg p-1.5 transition-colors hover:bg-slate-100 cursor-pointer ${
//       danger ? "text-[#D24D77]" : "text-[#8C959F] hover:text-[#17222B]"
//     }`}
//   >
//     <Icon size={16} />
//   </button>
// );

const AgentManagement = () => {
  const navigate = useNavigate();
  const [region, setRegion] = useState("All");
  const [status, setStatus] = useState("All");
  const [minRating, setMinRating] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    // ponytail: page/limit only — region/status/rating still filter client-side,
    // so they only see the current page. Move them into params once that bites.
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get(ENDPOINTS.admin.getAllAgents, {
          params: { page, limit: pageSize },
        });
        if (cancelled) return;
        // { success, message, data: [...], meta: { totalItems, currentPage, totalPage, limit } }
        const list = Array.isArray(data?.data) ? data.data : [];
        setAgents(list.map(toRow));
        setTotal(Number(data?.meta?.totalItems ?? list.length));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load agents"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  const rows = useMemo(
    () => filterAgents(agents, { region, status, minRating }),
    [agents, region, status, minRating],
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = (page - 1) * pageSize + 1;
  const goTo = (p) => setPage(Math.min(pageCount, Math.max(1, p)));

  // Any filter change invalidates the current page offset.
  const onFilter = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="overflow-hidden rounded-2xl border border-[#E8DFE1] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#ECF5FE] p-4">
          <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Select
              value={status}
              onChange={onFilter(setStatus)}
              className="w-full sm:w-auto"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s}
                </option>
              ))}
            </Select>
            <Select
              value={minRating}
              onChange={(v) => onFilter(setMinRating)(Number(v))}
              className="w-full sm:w-auto"
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  Min Rating: {r}★
                </option>
              ))}
            </Select>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="text-xs text-[#5C5F60]">
              Showing {firstRow}-{firstRow + rows.length - 1} of{" "}
              {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="cursor-pointer rounded-lg border border-[#E8DFE1] bg-white p-2 text-[#8C959F] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => goTo(page + 1)}
                disabled={page === pageCount}
                className="cursor-pointer rounded-lg border border-[#E8DFE1] bg-white p-2 text-[#8C959F] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Table — desktop. The mobile card list below carries the same rows. */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-y border-[#E8DFE1] bg-[#E6EFF8] text-xs font-semibold  text-[#4F4446] text-center">
                <th className="px-5 py-3">AGENT NAME</th>
                {/* <th className="px-5 py-3">REGION</th> */}
                <th className="px-5 py-3">EMAIL</th>
                <th className="px-5 py-3">DATE JOINED</th>
                <th className="px-5 py-3 ">TOTAL BATCHES</th>
                <th className="px-5 py-3">REVENUE</th>
                <th className="px-5 py-3">TRUST RATING</th>
                <th className="px-5 py-3">STATUS</th>
                {/* <th className="px-5 py-3 text-right">ACTIONS</th> */}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-[#8C959F]"
                  >
                    {loading
                      ? "Loading agents…"
                      : (error ?? "No agents match these filters.")}
                  </td>
                </tr>
              ) : (
                rows.map((a) => {
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/admin/agents/${a.id}`)}
                      className="cursor-pointer border-b border-[#E8DFE1] last:border-0 hover:bg-[#F8FAFF] text-center"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFE8EF] text-[11px] font-bold text-[#D24D77]">
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
                          <div className="min-w-0">
                            <p className="text-sm font-bold leading-tight text-[#141D23]">
                              {a.name}
                            </p>
                            <p className="text-[11px] text-left text-[#8C959F]">
                              ID: {a.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#5C5F60]">
                        {a.email}
                      </td>
                      <td className="px-5 py-3 text-sm text-[#5C5F60]">
                        {a.joined}
                      </td>
                      <td className="px-5 py-3 text-sm text-center font-semibold text-[#141D23]">
                        {a.batches.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-[#141D23]">
                        {money.format(a.revenue)}
                      </td>
                      <td className="px-5 py-3 text-sm text-center">
                        {a.rating == null ? (
                          <span className="text-[#8C959F]">N/A</span>
                        ) : (
                          <span className="font-semibold text-[#D24D77]">
                            {a.rating.toFixed(1)} ★
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      {/* <td className="px-5 py-3 text-right">
                        <div className="-mr-1.5 flex items-center justify-end gap-0.5">
                          <IconButton
                            icon={Eye}
                            label="View agent"
                            onClick={() => navigate(`/admin/agents/${a.id}`)}
                          />
                          <IconButton
                            icon={MessageSquare}
                            label="Message agent"
                          />
                        </div>
                      </td> */}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile. A 7-column table can only scroll sideways here. */}
        <div className="divide-y divide-[#E8DFE1] lg:hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-[#8C959F]">
              {loading
                ? "Loading agents…"
                : (error ?? "No agents match these filters.")}
            </p>
          ) : (
            rows.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/admin/agents/${a.id}`)}
                className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left hover:bg-[#F8FAFF]"
              >
                <div className="flex items-start gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE8EF] text-[11px] font-bold text-[#D24D77]">
                    {getInitials(a.name)}
                    {a.avatarUrl && (
                      <img
                        src={imageUrl(a.avatarUrl)}
                        alt={a.name}
                        className="absolute inset-0 h-full w-full rounded-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#141D23]">
                      {a.name}
                    </p>
                    <p className="truncate text-[11px] text-[#8C959F]">
                      {a.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {a.status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-[10px] font-bold text-[#8C959F]">
                      JOINED
                    </dt>
                    <dd className="text-[#5C5F60]">{a.joined}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-[#8C959F]">
                      BATCHES
                    </dt>
                    <dd className="font-semibold text-[#141D23]">
                      {a.batches.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-[#8C959F]">
                      REVENUE
                    </dt>
                    <dd className="font-semibold text-[#141D23]">
                      {money.format(a.revenue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-[#8C959F]">
                      RATING
                    </dt>
                    <dd className="font-semibold text-[#D24D77]">
                      {a.rating == null ? (
                        <span className="text-[#8C959F]">N/A</span>
                      ) : (
                        `${a.rating.toFixed(1)} ★`
                      )}
                    </dd>
                  </div>
                </dl>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFE1] p-4 max-sm:justify-center">
          <label className="flex items-center gap-2 text-sm text-[#5C5F60]">
            Rows per page:
            <Select
              value={pageSize}
              onChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#5C5F60]">
              Page {page} of {pageCount}
            </span>
            {[
              {
                icon: ChevronsLeft,
                to: 1,
                label: "First page",
                off: page === 1,
              },
              {
                icon: ChevronLeft,
                to: page - 1,
                label: "Previous page",
                off: page === 1,
              },
              {
                icon: ChevronRight,
                to: page + 1,
                label: "Next page",
                off: page === pageCount,
              },
              {
                icon: ChevronsRight,
                to: pageCount,
                label: "Last page",
                off: page === pageCount,
              },
            ].map(({ icon: Icon, to, label, off }) => (
              <button
                key={label}
                onClick={() => goTo(to)}
                disabled={off}
                aria-label={label}
                className="rounded-full border border-[#E8DFE1] bg-white p-2 text-[#5C5F60] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;
