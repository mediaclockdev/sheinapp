import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  SquarePen,
  ClipboardList,
  CircleEllipsis,
  User,
} from "lucide-react";
import apiClient, { getErrorMessage } from "../../lib/api/client";
import { imageUrl } from "../../lib/format";
import { ENDPOINTS } from "../../lib/api/endpoints";

const dash = (v) => (v == null || v === "" ? "—" : v);

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const Field = ({ label, children, accent }) => (
  <div>
    <p className="text-xs font-bold text-[#5C5F60]">{label}</p>
    <p
      className={`text-sm truncate ${accent ? "text-[#D24D77]" : "text-[#141D23]"}`}
    >
      {children}
    </p>
  </div>
);

const Note = ({ value, onChange, placeholder }) => (
  <textarea
    rows={4}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full resize-none rounded-lg border border-[#E8DFE1] bg-white p-3 text-sm text-[#141D23] placeholder:text-[#8C959F] focus:border-[#D24D77] focus:outline-none"
  />
);

const Panel = ({ icon: Icon, title, children }) => (
  <section className="overflow-hidden rounded-2xl border border-[#E8DFE1] bg-white">
    <h2 className="flex items-center gap-2 border-b border-[#E8DFE1] bg-[#F8FAFF] px-5 py-4 text-lg font-bold text-[#141D23]">
      <Icon size={18} className="text-[#D24D77]" />
      {title}
    </h2>
    <div className="p-5">{children}</div>
  </section>
);

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Set when the avatar 404s, so the placeholder icon takes over.
  const [avatarBroken, setAvatarBroken] = useState(false);

  // Always refetch: the list row carries only the columns the table needs.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await apiClient.get(ENDPOINTS.admin.agentById(id));
        if (cancelled) return;
        setAgent(data?.data ?? null);
        if (!data?.data) setError("Agent not found.");
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load agent"));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const decide = async (status) => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(ENDPOINTS.admin.updateAgentStatus(id), {
        status,
        ...(message.trim() && { message: message.trim() }),
      });
      // Stay put so the new status is visible and can be changed again.
      setAgent((prev) => ({ ...prev, status }));
      setMessage("");
    } catch (err) {
      setError(getErrorMessage(err, `Failed to ${status.toLowerCase()} agent`));
    } finally {
      setSaving(false);
    }
  };

  if (!agent)
    return (
      <div className="p-8 text-sm text-[#8C959F]">
        {error ?? "Loading agent…"}
      </div>
    );

  const status = (agent.status ?? "").toUpperCase();
  const pending = status === "PENDING";
  // Turning down a request is a rejection; switching off an approved agent is a
  // suspension. Same button, different status, so the two stay distinguishable.
  const negative = pending ? "REJECTED" : "SUSPENDED";

  return (
    <div className="p-4 sm:p-8">
      <button
        onClick={() => navigate("/admin/agents")}
        className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#141D23] hover:text-[#D24D77]"
      >
        <ArrowLeft size={16} /> Back to Agent Requests
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8DFE1] bg-white p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F9C9D6] text-[#B4667F]">
            {agent.avatarUrl && !avatarBroken ? (
              <img
                src={imageUrl(agent.avatarUrl)}
                alt={agent.name ?? "Agent"}
                className="h-full w-full object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <User size={30} />
            )}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#141D23]">
                {dash(agent.name)}
              </h1>
              {pending && (
                <span className="flex items-center gap-1 rounded-full bg-[#FFE8EF] px-3 py-1 text-xs font-bold text-[#D24D77]">
                  <CircleEllipsis size={13} /> Pending Approval
                </span>
              )}
            </div>
            <p className="text-xs text-[#5C5F60]">
              ID: {dash(agent.id)} • SUBMITTED{" "}
              {formatDate(agent.createdAt).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Always available — an agent's status can be changed back and forth,
            not only while the request is pending. */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => decide(negative)}
            disabled={saving || status === "SUSPENDED" || status === "REJECTED"}
            className="cursor-pointer rounded-lg border border-[#E8DFE1] bg-white px-5 py-2.5 text-sm font-semibold text-[#141D23] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Reject Request" : "Suspend Agent"}
          </button>
          <button
            onClick={() => decide("ACTIVE")}
            disabled={saving || status === "ACTIVE"}
            className="cursor-pointer rounded-lg bg-[#FFD9E4] px-5 py-2.5 text-sm font-semibold text-[#8C4A60] hover:bg-[#FFCADA] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Approve Agent" : "Activate Agent"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[#D24D77]">{error}</p>}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Panel icon={ClipboardList} title="Registration Details">
            <div className="grid gap-6 sm:grid-cols-3 ">
              <Field label="Full Name">{dash(agent.name)}</Field>
              <Field label="Email">{dash(agent.email)}</Field>
              <Field label="Phone">
                {dash(
                  [agent.countryCode, agent.phone].filter(Boolean).join(" ") ||
                    null,
                )}
              </Field>
              <Field label="Location">{dash(agent.location)}</Field>
              <Field label="Referral Code" accent>
                {dash(agent.referralCode)}
              </Field>
              <Field label="Application Date">
                {formatDate(agent.createdAt)}
              </Field>
              <Field label="Status">{dash(agent.status)}</Field>
              <Field label="Verified">{agent.isVerified ? "Yes" : "No"}</Field>
              <Field label="Accepting Orders">
                {agent.isAcceptingOrders ? "Yes" : "No"}
              </Field>
              <Field label="Description">{dash(agent.description)}</Field>
              <Field label="Tags">{dash(agent.tags?.join(", ") || null)}</Field>
            </div>
          </Panel>

          <Panel icon={ClipboardList} title="Performance & Fees">
            <div className="grid gap-6 sm:grid-cols-3">
              <Field label="Rating">{dash(agent.rating)}</Field>
              <Field label="Completed Orders">
                {dash(agent.completedOrders)}
              </Field>
              <Field label="Price per Kg">{dash(agent.pricePerKg)}</Field>
              <Field label="Service Fee Rate">
                {dash(agent.serviceFeeRate)}
              </Field>
              <Field label="Delivery Fee">{dash(agent.deliveryFee)}</Field>
              <Field label="Custom Fee">{dash(agent.customFee)}</Field>
              <Field label="Agent Surcharge">
                {dash(agent.agentSurcharge)}
              </Field>
            </div>
          </Panel>
        </div>

        <Panel icon={SquarePen} title="Message to Agent">
          <Note
            value={message}
            onChange={setMessage}
            placeholder="Type a reason for approval or rejection..."
          />
          <p className="mt-2 text-[11px] text-[#8C959F]">
            This message will be sent directly to the agent&apos;s email upon
            clicking Approve or Reject above.
          </p>
        </Panel>
      </div>
    </div>
  );
};

export default AgentDetail;
