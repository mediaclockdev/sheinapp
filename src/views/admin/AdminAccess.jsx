import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import apiClient, { getErrorMessage } from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";
import { getInitials } from "../../lib/format";
import { toast } from "../../components/Toast";
import TableSkeleton from "../../components/common/TableSkeleton";

const PAGE_SIZES = [10, 25, 50];
const STATUSES = ["ACTIVE", "PENDING", "SUSPENDED"];

const STATUS_STYLES = {
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED: "border-red-200 bg-red-50 text-red-600",
};

// Row action per status: what clicking it does and how it looks.
const ACTIONS = {
  ACTIVE: {
    label: "SUSPEND",
    style: "bg-[#B3261E] text-white",
    action: "SUSPEND",
  },
  SUSPENDED: {
    label: "RE-ACTIVATE",
    style: "bg-[#4CC35E] text-white",
    action: "ACTIVATE",
  },
  PENDING: {
    label: "RESEND",
    style: "bg-[#F5C451] text-[#5A3E00]",
    resend: true,
  },
};

const AVATAR_COLORS = [
  "bg-[#FDE4E8] text-[#C2185B]",
  "bg-[#F1E6FD] text-[#7C3AED]",
  "bg-[#E3EEFD] text-[#1A73E8]",
  "bg-[#DFF6E6] text-[#1E7B3C]",
  "bg-[#E4E7FD] text-[#3F51B5]",
];
// Same name, same colour on every render.
const avatarColor = (name = "") =>
  AVATAR_COLORS[
    [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  ];

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "-";

const Select = ({ value, onChange, children }) => (
  <div className="relative inline-block">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer appearance-none rounded-lg border border-[#E8DFE1] bg-white py-2 pl-4 pr-10 text-sm font-semibold text-[#17222B] focus:border-[#D24D77] focus:outline-none"
    >
      {children}
    </select>
    <ChevronDown
      size={15}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5F60]"
    />
  </div>
);

const inputClass =
  "w-full rounded-lg border border-[#D9C8CD] px-5 py-3 text-lg text-[#141D23] placeholder:text-[#6E7682] focus:border-[#D24D77] focus:outline-none";

const AddAdminModal = ({ onClose, onAdded }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post(ENDPOINTS.admin.admins, {
        name: name.trim(),
        email: email.trim(),
      });
      onAdded();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add admin"));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-admin-title"
        className="w-full max-w-[820px] rounded-2xl border border-[#D9C8CD] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:p-12"
      >
        <h2
          id="add-admin-title"
          className="flex items-center gap-3 text-2xl font-bold text-[#141D23] sm:text-4xl"
        >
          <UserPlus
            size={36}
            strokeWidth={1.75}
            className="shrink-0 text-[#78555E]"
          />
          Add New Admin Detail
        </h2>

        <label className="mt-10 block">
          <span className="mb-3 block text-xl font-semibold text-[#5C5F60]">
            Full Name
          </span>
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Eleanor Rigby"
            className={inputClass}
          />
        </label>

        <label className="mt-6 block">
          <span className="mb-3 block text-xl font-semibold text-[#5C5F60]">
            Corporate E-Mail id
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="eleanor@gmail.com.au"
            className={inputClass}
          />
        </label>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex flex-wrap gap-8 max-sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-48 cursor-pointer rounded-lg border border-[#E5E7EB] bg-white py-3 text-lg font-semibold text-[#3A4450] hover:bg-slate-50 max-sm:flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-[#F8D3DD] px-8 py-3 text-lg font-semibold text-[#78555E] hover:bg-[#F5C2D0] disabled:opacity-50 max-sm:flex-1"
          >
            <Plus size={18} />
            {saving ? "Sending..." : "Send Admin Invite"}
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminAccess = () => {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Wait for a typing pause before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(ENDPOINTS.admin.admins, {
        params: {
          page,
          limit: pageSize,
          ...(search && { search }),
          ...(status && { status }),
        },
      });
      // { success, admins: [...], meta: { total, page, ... } }
      const list = Array.isArray(data?.admins) ? data.admins : [];
      setAdmins(list);
      setTotal(Number(data?.meta?.total ?? list.length));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load admins"));
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const goTo = (p) => setPage(Math.min(pageCount, Math.max(1, p)));

  const runAction = async (admin) => {
    const action = ACTIONS[admin.status];
    if (!action) return;
    setBusyId(admin.id);
    try {
      if (action.resend) {
        await apiClient.post(ENDPOINTS.admin.resendAdminInvite(admin.id));
        toast.success(`Invite resent to ${admin.email}.`);
      } else {
        await apiClient.patch(ENDPOINTS.admin.adminStatus(admin.id), {
          action: action.action,
        });
        toast.success(
          action.action === "SUSPEND"
            ? `${admin.name} suspended.`
            : `${admin.name} re-activated.`,
        );
        await load();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (admin) => {
    setConfirmDelete(null);
    setBusyId(admin.id);
    try {
      await apiClient.delete(ENDPOINTS.admin.adminById(admin.id));
      toast.success(`${admin.name} deleted.`);
      // Stepping back keeps us off an empty last page.
      if (admins.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete admin"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#141D23] sm:text-3xl">
          Administrator Permissions & Access
        </h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#8A6A74] px-6 py-3 text-sm font-semibold text-[#704154] hover:bg-white max-sm:w-full max-sm:justify-center"
        >
          <CirclePlus size={22} strokeWidth={1.5} />
          Add New Admin
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative w-full sm:w-80">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8C959F]"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search admins"
            className="w-full rounded-lg border border-[#E8DFE1] bg-white py-2 pl-9 pr-3 text-sm focus:border-[#D24D77] focus:outline-none"
          />
        </label>
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#78555E] bg-[#FFFFFF] shadow-[5px_-5px_15px_0_rgba(0,0,0,0.05),-5px_5px_15px_0_rgba(0,0,0,0.25)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs font-semibold tracking-wider text-[#5C6B7A]">
                <th className="px-8 py-5">NAME</th>
                <th className="px-5 py-5">E-MAIL</th>
                <th className="px-5 py-5">INVITED / ACTIVATED</th>
                <th className="px-5 py-5">STATUS</th>
                <th className="px-8 py-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : admins.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-[#8C959F]"
                  >
                    {error ??
                      (search || status
                        ? "No admins match these filters."
                        : "No admins yet.")}
                  </td>
                </tr>
              ) : (
                admins.map((a) => {
                  // The list does include super admins; they're never actionable here.
                  const isSuper = a.role === "SUPER_ADMIN";
                  const action = isSuper ? null : ACTIONS[a.status];
                  const busy = busyId === a.id;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-[#ECECEC] last:border-0"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold ${avatarColor(a.name)}`}
                          >
                            {getInitials(a.name)}
                          </span>
                          <span className="font-bold text-[#141D23]">
                            {a.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-6 text-sm text-[#5C5F60]">
                        {a.email}
                      </td>
                      <td className="px-5 py-6 text-sm text-[#3A4450]">
                        {/* Pre-invite-flow admins have no invitedAt/activatedAt. */}
                        <div>{fmtDate(a.invitedAt ?? a.createdAt)}</div>
                        <div className="text-xs text-[#8C959F]">
                          {a.activatedAt
                            ? `Activated ${fmtDate(a.activatedAt)}`
                            : a.status === "PENDING"
                              ? "Not activated yet"
                              : ""}
                        </div>
                      </td>
                      <td className="px-5 py-6">
                        <span
                          className={`inline-block rounded border px-3 py-1 text-xs font-bold tracking-wider ${STATUS_STYLES[a.status] ?? "border-slate-200 bg-slate-100 text-slate-600"}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-4">
                          {action && (
                            <button
                              onClick={() => runAction(a)}
                              disabled={busy}
                              className={`min-w-[110px] cursor-pointer rounded px-3 py-1 text-xs font-bold tracking-wider disabled:opacity-50 ${action.style}`}
                            >
                              {action.label}
                            </button>
                          )}
                          {isSuper ? (
                            <span className="text-xs font-bold tracking-wider text-[#78555E]">
                              SUPER ADMIN
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(a)}
                              disabled={busy}
                              aria-label={`Remove ${a.name}`}
                              className="cursor-pointer text-[#704154] hover:text-[#B3261E] disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] px-8 py-5 max-sm:justify-center max-sm:px-4">
          <label className="flex items-center gap-3 text-[#5C5F60]">
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
            <span className="mr-2 text-[#5C5F60]">
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
                className="cursor-pointer rounded-lg border border-[#E8DFE1] bg-white p-2.5 text-[#5C5F60] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-admin-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#D9C8CD] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <h2
              id="delete-admin-title"
              className="text-xl font-bold text-[#141D23]"
            >
              Are you sure?
            </h2>
            <p className="mt-2 text-sm text-[#5C5F60]">
              This permanently deletes {confirmDelete.name} (
              {confirmDelete.email}) and removes their admin access.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                autoFocus
                onClick={() => setConfirmDelete(null)}
                className="cursor-pointer rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#3A4450] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(confirmDelete)}
                className="cursor-pointer rounded-lg bg-[#B3261E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99201A]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <AddAdminModal
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            toast.success("Invite sent!");
            if (page === 1) load();
            else setPage(1);
          }}
        />
      )}
    </div>
  );
};

export default AdminAccess;
