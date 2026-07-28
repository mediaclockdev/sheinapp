import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronRight, BadgeCheck, Pencil, Eye, EyeOff } from "lucide-react";
import tick from "../assets/tickicon.svg";
import { toast } from "../components/Toast";
import { handleUnauthorized, isUnauthorized } from "../lib/sessionExpiry";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const PROFILE_API_URL = `${API_BASE_URL}/api/agent-profile`;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const NOTIFICATIONS = [
  {
    key: "newOrders",
    apiKey: "newOrderSubmission",
    label: "New Order Submissions",
    desc: "Real-time alerts when customers submit new proxy requests.",
  },
  {
    key: "payments",
    apiKey: "paymentVerification",
    label: "Payment Verifications",
    desc: "Get notified as soon as a client's transaction is cleared.",
  },
  {
    key: "batches",
    apiKey: "batchUpdates",
    label: "Batch Updates",
    desc: "Summaries of consolidation progress and warehouse movements.",
  },
  {
    key: "announcements",
    apiKey: "systemAnnouncements",
    label: "System Announcements",
    desc: "Important updates regarding portal maintenance and policy changes.",
  },
];

const COUNTRY_CODES = [
  ["1", "US / Canada"],
  ["61", "Australia"],
  ["971", "UAE"],
  ["966", "Saudi Arabia"],
  ["974", "Qatar"],
  ["965", "Kuwait"],
  ["973", "Bahrain"],
  ["968", "Oman"],
  ["962", "Jordan"],
  ["961", "Lebanon"],
  ["91", "India"],
  ["44", "UK"],
];

const prefsFromApi = (notificationPreferences) => {
  if (!notificationPreferences) return null;
  return NOTIFICATIONS.reduce(
    (acc, { key, apiKey }) => ({
      ...acc,
      [key]: notificationPreferences[apiKey],
    }),
    {},
  );
};

const updateStoredUser = (patch) => {
  const raw = localStorage.getItem("user");
  if (!raw) return;
  try {
    localStorage.setItem(
      "user",
      JSON.stringify({ ...JSON.parse(raw), ...patch }),
    );
  } catch {
    // ignore malformed stored user
  }
};

const Toggle = ({ on, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={on}
    className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${
      on ? "bg-[#6B4A52]" : "bg-[#E8DFE1]"
    }`}
  >
    <span
      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
        on ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export default function Profile() {
  const { onAvatarChange, onUserChange } = useOutletContext() ?? {};
  const [profile, setProfile] = useState(null); // raw API data
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "",
    phone: "",
    agentCode: "",
  });
  const [prefs, setPrefs] = useState({
    newOrders: true,
    payments: true,
    batches: false,
    announcements: true,
  });
  const [saved, setSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    fetch(PROFILE_API_URL, { headers: authHeaders() })
      .then((res) => {
        if (isUnauthorized(res.status)) {
          handleUnauthorized();
          return Promise.reject(res.status);
        }
        return res.ok ? res.json() : Promise.reject(res.status);
      })
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          countryCode: data.countryCode || "",
          phone: data.phone || "",
          agentCode: `AGT${String(data.id).padStart(5, "0")}`,
        });
        const apiPrefs = prefsFromApi(data.notificationPreferences);
        if (apiPrefs) setPrefs((p) => ({ ...p, ...apiPrefs }));
      })
      .catch((err) => console.error("Failed to load profile:", err));
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((errs) => (errs[field] ? { ...errs, [field]: null } : errs));
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${PROFILE_API_URL}/update`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.trim(),
          countryCode: form.countryCode.trim(),
        }),
      });
      if (isUnauthorized(res.status)) {
        handleUnauthorized();
        return;
      }
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fieldErrors = (result.errors || []).reduce(
          (acc, e) => ({ ...acc, [e.field]: e.message }),
          {},
        );
        setFormErrors(fieldErrors);
        toast.error(
          result.errors?.[0]?.message ||
            result.message ||
            "Failed to update profile",
        );
        return;
      }

      setFormErrors({});
      const updated = result.data || result;

      setProfile((p) => ({ ...(p || {}), ...updated }));
      setForm((f) => ({
        ...f,
        name: updated.name ?? f.name,
        countryCode: updated.countryCode ?? f.countryCode,
        phone: updated.phone ?? f.phone,
      }));
      const apiPrefs = prefsFromApi(updated.notificationPreferences);
      if (apiPrefs) setPrefs((p) => ({ ...p, ...apiPrefs }));
      updateStoredUser({ name: updated.name ?? form.name });
      onUserChange?.({ name: updated.name ?? form.name });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profile updated");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    try {
      const res = await fetch(`${PROFILE_API_URL}/password`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(passwordForm),
      });
      if (isUnauthorized(res.status)) {
        handleUnauthorized();
        return;
      }
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          result.errors?.[0]?.message ||
          result.message ||
          "Failed to change password";
        setPasswordError(message);
        toast.error(message);
        return;
      }

      setPasswordError(null);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setShowPasswordForm(false);
      toast.success("Password changed");
    } catch (err) {
      console.error("Failed to change password:", err);
      const message = "Failed to change password";
      setPasswordError(message);
      toast.error(message);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      body.append("image", file);
      const res = await fetch(`${PROFILE_API_URL}/photo`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      if (isUnauthorized(res.status)) {
        handleUnauthorized();
        return;
      }
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Photo upload failed (${res.status})`);
      const avatarUrl =
        result.data?.avatarUrl || result.avatarUrl || URL.createObjectURL(file);
      setProfile((p) => ({ ...(p || {}), avatarUrl }));
      onAvatarChange?.(avatarUrl);
      toast.success("Photo uploaded");
    } catch (err) {
      console.error("Failed to upload photo:", err);
      toast.error("Failed to upload photo");
    } finally {
      e.target.value = "";
    }
  };

  const inputClass =
    "w-full bg-[#ECF5FE] border border-[#D9E4F2] rounded-lg px-4 py-2.5 text-sm text-[#141D23] focus:outline-none focus:ring-2 focus:ring-[#FFD1DC]";

  return (
    <div className="flex-1 bg-[#fdf5f7] min-h-[calc(100vh-70px)]">
      <div className="p-4 sm:p-8 max-w-5xl space-y-6 mx-auto">
        {/* Profile header card */}
        <div className="bg-white border border-[#E8DFE1] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative shrink-0">
            {profile?.avatarUrl ? (
              <img
                src={
                  profile.avatarUrl.startsWith("http")
                    ? profile.avatarUrl
                    : `${API_BASE_URL}${profile.avatarUrl}`
                }
                alt={form.name}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-[#FFD1DC] p-1"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl border-2 border-[#FFD1DC] bg-[#FFE8EF] flex items-center justify-center text-2xl font-bold text-[#D24D77]">
                {form.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#6B4A52] border-2 border-white flex items-center justify-center cursor-pointer hover:bg-[#563b42] transition">
              <Pencil size={12} className="text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-[#141D23]">{form.name}</h2>
              <span className="flex items-center gap-1 bg-[#E7F7EE] text-[#1F9254] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#BFE8D2]">
                <BadgeCheck size={12} /> Verified Agent
              </span>
            </div>
            <p className="text-sm text-[#5C5F60] mt-1">
              {profile?.location
                ? `Senior Agent — ${profile.location}`
                : "Senior Agent"}
            </p>
            <div className="flex items-center gap-6 mt-4">
              <div>
                <p className="text-[10px] font-bold text-[#98A2AB] uppercase tracking-wider">
                  Trusted Score
                </p>
                <p className="text-lg font-bold text-[#78555E]">
                  {profile?.rating ?? "—"}/5
                </p>
              </div>
              <div className="h-8 w-px bg-[#E8DFE1]" />
              <div>
                <p className="text-[10px] font-bold text-[#98A2AB] uppercase tracking-wider">
                  Completed Orders
                </p>
                <p className="text-lg font-bold text-[#141D23]">
                  {profile?.completedOrders ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-[#E8DFE1] rounded-2xl p-6">
          <div className="flex items-center justify-between  mb-6">
            <h3 className="text-lg font-bold text-[#141D23]">
              Personal Information
            </h3>
            <span className="text-xs text-[#98A2AB]">
              {profile?.createdAt
                ? `Member since: ${new Date(profile.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
                : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="block text-xs font-bold text-[#5C5F60] mb-1.5">
                Full Name
              </label>
              <input
                className={inputClass}
                value={form.name}
                onChange={set("name")}
              />
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5C5F60] mb-1.5">
                Email Address
              </label>
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={set("email")}
              />
              {formErrors.email && (
                <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5C5F60] mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="relative w-24 shrink-0">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-[#141D23]">
                    {form.countryCode ? (
                      `+${form.countryCode}`
                    ) : (
                      <span className="text-[#98a2ab]">Code</span>
                    )}
                  </span>
                  <select
                    className={`${inputClass} w-24 cursor-pointer text-transparent [&>option]:text-[#141D23]`}
                    value={form.countryCode}
                    onChange={set("countryCode")}
                  >
                    <option value="" disabled>
                      Code
                    </option>
                    {COUNTRY_CODES.map(([code, country]) => (
                      <option key={code} value={code}>
                        +{code} {country}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              {(formErrors.phone || formErrors.countryCode) && (
                <p className="text-xs text-red-600 mt-1">
                  {formErrors.countryCode || formErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5C5F60] mb-1.5">
                Agent Code
              </label>
              <input
                className={`${inputClass} opacity-70`}
                value={form.agentCode}
                readOnly
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
            <button
              onClick={() => {
                setShowPasswordForm((s) => !s);
                setPasswordError(null);
              }}
              className="flex items-center justify-between gap-4 border border-[#E8DFE1] rounded-xl px-4 py-3 text-left hover:bg-slate-50 transition w-full sm:w-auto"
            >
              <span>
                <span className="block text-sm font-bold text-[#141D23]">
                  Change Password
                </span>
                <span className="block text-xs text-[#98A2AB]">
                  Update your login credentials.
                </span>
              </span>
              <ChevronRight size={16} className="text-[#98A2AB]" />
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 bg-[#FFD1DC] hover:bg-[#f7bfce] text-[#6B4A52] font-bold text-sm px-6 py-3 rounded-xl transition"
            >
              <img src={tick} alt="tick icon" className="size-4" />
              {saved ? "Saved!" : "Update Profile"}
            </button>
          </div>

          {showPasswordForm && (
            <div className="mt-4 border-t border-[#E8DFE1] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className="block text-xs font-bold text-[#5C5F60] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }));
                      setPasswordError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2AB] hover:text-[#5C5F60]"
                    aria-label={
                      showCurrentPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5C5F60] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }));
                      setPasswordError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2AB] hover:text-[#5C5F60]"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 sm:col-span-2">
                  {passwordError}
                </p>
              )}
              <button
                onClick={handleChangePassword}
                className="flex items-center gap-2 bg-[#FFD1DC] hover:bg-[#f7bfce] text-[#6B4A52] font-bold text-sm px-6 py-3 rounded-xl transition w-fit sm:col-span-2"
              >
                Update Password
              </button>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white border border-[#E8DFE1] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-[#141D23] mb-4">
            Notification Preferences
          </h3>
          <div className="divide-y divide-[#F0E7E9]">
            {NOTIFICATIONS.map(({ key, label, desc }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#141D23]">{label}</p>
                  <p className="text-xs text-[#98A2AB] mt-0.5">{desc}</p>
                </div>
                <Toggle
                  on={prefs[key]}
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
