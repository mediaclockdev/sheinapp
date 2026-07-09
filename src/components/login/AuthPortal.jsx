import { useLayoutEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import logo from "../../assets/logo.svg";
// import logo2 from "../../assets/logo2.svg";

const screenMeta = {
  "/login": {
    kicker: "Agent Portal",
    footerNote: "Systems Operational",
    copyright: "2026 ShipLink Logistics. v2.4.0-release",
    stageClass: "pt-[86px]",
  },
  "/forgot-password": {
    copyright: "2026 Shelynx Logistics. Secure Agent Portal.",
    stageClass: "pt-[8vh]",
  },
  "/verify-otp": {
    footerNote: "Secure Encryption    Privacy Guaranteed",
    copyright: "2026 ShipLink Logistics. v2.4.0-release",
    stageClass: "pt-[70px]",
  },
  "/reset-password": {
    stageClass: "pt-[70px]",
  },
  "/register": {
    stageClass: "pt-[70px]",
  },
};

const inputBase =
  "mt-2 flex items-center gap-3 rounded border border-[#c9cfd6] bg-[#f7fbff] px-3 text-[#26333d] focus-within:border-[#ff5f96] focus-within:ring-2 focus-within:ring-pink-100";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    mail: (
      <>
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),
    key: (
      <>
        <path d="m3 10 4-4 4 4" />
        <path d="M7 6v12" />
        <path d="M11 14h10" />
        <path d="M18 11v6" />
      </>
    ),
    refresh: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v6h6" />
        <path d="M9 13h6" />
      </>
    ),
    shield: (
      <path d="M12 3 5 6v5c0 4.5 2.9 8.7 7 10 4.1-1.3 7-5.5 7-10V6l-7-3Zm3.2 7.7-3.7 3.7-2-2 1.1-1.1.9.9 2.6-2.6 1.1 1.1Z" />
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6" />
        <path d="M12 7h.01" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={name === "shield" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function BrandLogo({ compact = false }) {
  if (compact) {
    return (
      <div>
        <img src={logo} alt="logo" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute left-5 top-5 z-10 flex flex-col items-center text-[#ff5f96] sm:left-8 sm:top-6">
      {/* <img src={logo2} alt="logo2" /> */}
    </div>
  );
}

function Field({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  name,
  required,
  rightIcon,
  shellClassName = "h-[43px]",
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[#4f4446]">{label}</span>
      <span className={`${inputBase} ${shellClassName}`}>
        {icon && (
          <Icon name={icon} className="h-5 w-5 shrink-0 text-[#5f6872]" />
        )}
        <input
          name={name}
          required={required}
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none placeholder:text-[#98a2ab]"
          type={type}
          placeholder={placeholder}
          defaultValue={value}
        />
        {rightIcon && (
          <Icon name={rightIcon} className="h-5 w-5 shrink-0 text-[#6c737d]" />
        )}
      </span>
    </label>
  );
}

function PrimaryButton({ children, arrow = false, className = "" }) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded bg-[#ffc6d8] font-bold text-[#704154] transition hover:-translate-y-0.5 hover:saturate-110 ${className}`}
      type="submit"
    >
      <span>{children}</span>
      {arrow && <Icon name="arrow" className="h-6 w-6" />}
    </button>
  );
}
function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded bg-[#fff0f3] border border-[#ffc6d8] px-4 py-3 text-[13px] text-[#b32b53] shadow-sm">
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-[#ee5d8d]" />
      <p>{message}</p>
    </div>
  );
}

function LoginScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const rememberMe = formData.get("rememberMe") === "on";

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://shelynx.mediaclocksoft.com.au/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Login failed");

      if (result.token) {
        if (rememberMe) {
          localStorage.setItem("token", result.token);
          if (result.data)
            localStorage.setItem("user", JSON.stringify(result.data));
        } else {
          sessionStorage.setItem("token", result.token);
          if (result.data)
            sessionStorage.setItem("user", JSON.stringify(result.data));
        }
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-5 pt-4 pb-3">
      <div className="w-full max-w-[500px] rounded-md border border-[#78555e]/20 bg-white/95 shadow-[0_16px_36px_rgba(103,47,65,0.08)]">
        <div className="px-8 pb-4 pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-[#17222b]">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-[#5c5f60]">
            Please enter your agent credentials to continue.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <ErrorAlert message={error} />
            <Field
              label="Email Address"
              div
              name="email"
              required
              icon="mail"
              placeholder="agent@shiplink.com"
              shellClassName="h-[38px]"
            />

            <label className="block">
              <span className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#4f4446]">
                  Password
                </span>
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-semibold text-[#78555e] hover:text-[#ff5f96]"
                >
                  Forgot Password?
                </Link>
              </span>
              <span className={`${inputBase} h-[38px]`}>
                <Icon name="lock" className="h-4 w-4 shrink-0 text-[#6c737d]" />
                <input
                  name="password"
                  required
                  className="min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6c737d] hover:text-[#ff5f96]"
                >
                  <Icon
                    name={showPassword ? "eye" : "eye"}
                    className="h-4 w-4 shrink-0"
                  />
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[#4f4446]">
              <input
                name="rememberMe"
                className="h-3 w-3 accent-[#ff5f96]"
                type="checkbox"
              />
              Stay logged in for 30 days
            </label>

            <PrimaryButton className="h-[38px] text-sm cursor-pointer">
              {loading ? "Logging in..." : "Login"}
            </PrimaryButton>
          </form>
        </div>
        <div className="rounded-b-md border-t border-[#d4e0ec] bg-[#eef7ff] px-8 py-3 text-center text-xs text-[#5c5f60]">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-[#78555e]">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

function ForgotScreen() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-7 h-1 w-2 rounded-full bg-[#ffc6d8]" />
      <div className="w-full max-w-[448px] rounded border border-[#78555e]/20 bg-white/95 px-9 py-12 shadow-[0_16px_36px_rgba(103,47,65,0.08)]">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#17222b]">
          Forgot Password?
        </h1>
        <p className="mt-2 text-[14px] text-[#626973]">
          Enter your email to receive an OTP code.
        </p>
        <form
          className="mt-7 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/verify-otp");
          }}
        >
          <Field
            label="Email Address"
            icon="mail"
            placeholder="agent@shiplink.com"
            shellClassName="h-[58px]"
          />
          <PrimaryButton arrow className="h-[62px] text-[16px]">
            Send Code
          </PrimaryButton>
        </form>
        <div className="mt-9 text-center">
          <Link
            to="/login"
            className="text-[14px] font-semibold text-[#7a4e5b]"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
}

function OtpScreen() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const updateOtp = (index, value) => {
    const next = [...otp];
    next[index] = value.slice(-1).replace(/\D/g, "");
    setOtp(next);
  };

  return (
    <>
      <div className="w-full max-w-[456px] rounded-lg border border-[#78555e]/20 bg-white/95 px-9 py-10 text-center shadow-[0_16px_36px_rgba(103,47,65,0.08)]">
        <div className="mx-auto grid h-[70px] w-[70px] place-items-center rounded-xl bg-[#ffc6d8] text-[#7a4e5b]">
          <Icon name="shield" className="h-8 w-8" />
        </div>
        <h1 className="mt-8 text-[36px] font-extrabold tracking-tight text-[#17222b]">
          Verify OTP
        </h1>
        <p className="mt-2 text-[15px] text-[#626973]">Sent to your email</p>
        <form
          className="mt-9"
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/dashboard");
          }}
        >
          <div className="grid grid-cols-6 gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                className="h-[62px] rounded border border-[#c9cfd6] bg-[#f7fbff] text-center text-2xl font-bold outline-none focus:border-[#ff5f96] focus:ring-2 focus:ring-pink-100"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(event) => updateOtp(index, event.target.value)}
              />
            ))}
          </div>
          <PrimaryButton className="mt-8 h-[54px] text-[14px]">
            Verify and Continue
          </PrimaryButton>
        </form>
        <p className="mt-10 text-[13px] text-[#80848a]">
          Didn't receive the code?
        </p>
        <Link
          to="/forgot-password"
          className="mt-3 inline-block text-[14px] font-bold text-[#7a4e5b]"
        >
          Resend code
        </Link>
      </div>
    </>
  );
}

function ResetScreen() {
  const navigate = useNavigate();

  return (
    <>
      <div className="w-full max-w-[460px] rounded-md border border-[#78555e]/20 bg-white/95 px-9 py-9 text-center shadow-[0_16px_36px_rgba(103,47,65,0.08)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#ffc6d8] text-[#7a4e5b]">
          <Icon name="refresh" className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-[28px] font-extrabold tracking-tight text-[#17222b]">
          Reset Password
        </h1>
        <p className="mt-2 text-[12px] text-[#626973]">
          Please enter your new security credentials below.
        </p>
        <form
          className="mt-7 space-y-5 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/login");
          }}
        >
          <div>
            <Field
              label="New Password"
              type="password"
              icon="key"
              rightIcon="eye"
              placeholder="••••••••"
              shellClassName="h-10"
            />
            <div className="mt-2 flex items-center">
              <span className="h-1 flex-1 rounded bg-[#07a57a]" />
              <span className="h-1 flex-1 rounded bg-[#07a57a]" />
              <span className="h-1 flex-1 rounded bg-[#d7dee6]" />
              <span className="ml-2 text-[12px] text-[#73787e]">
                Strength: Weak
              </span>
            </div>
          </div>
          <Field
            label="Confirm New Password"
            type="password"
            icon="lock"
            placeholder="••••••••"
            shellClassName="h-10"
          />
          <PrimaryButton arrow className="!mt-8 h-[54px] text-[14px]">
            Update Password
          </PrimaryButton>
        </form>
        <div className="mt-9 text-center">
          <Link
            to="/login"
            className="text-[14px] font-semibold text-[#7a4e5b]"
          >
            Back to Login
          </Link>
        </div>
      </div>
      <div className="mt-7 flex w-full max-w-[460px] gap-4 rounded bg-[#eef7ff] px-5 py-5 text-[13px] leading-5 text-[#5f6872]">
        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-[#7a4e5b]" />
        <p>
          Your password should contain at least 8 characters, including a mix of
          letters, numbers, and special symbols for maximum security.
        </p>
      </div>
    </>
  );
}

function RegisterScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const countryCode = formData.get("countryCode");
    const phone = formData.get("phone");
    const password = formData.get("password");

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://shelynx.mediaclocksoft.com.au/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, countryCode, phone, password }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Registration failed");

      if (result.token) {
        localStorage.setItem("token", result.token);
        if (result.data)
          localStorage.setItem("user", JSON.stringify(result.data));
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[526px] rounded-md border border-[#78555e]/20 bg-white/95 px-9 py-10 shadow-[0_16px_36px_rgba(103,47,65,0.08)]">
      <div className="text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#17222b]">
          Create Agent Account
        </h1>
        <p className="mx-auto mt-2 max-w-[420px] text-[18px] leading-6 text-[#626973]">
          Join our logistics network as a verified proxy shopping agent.
        </p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <ErrorAlert message={error} />
        <Field
          label="Full Name"
          name="name"
          required
          icon="user"
          placeholder="Enter your full legal name"
        />
        <Field
          label="Work Email Address"
          name="email"
          required
          icon="mail"
          placeholder="agent@shiplink.com"
        />
        <div className="flex gap-2">
          <div className="w-1/3">
            <Field
              label="Code"
              name="countryCode"
              placeholder="+961"
              required
            />
          </div>
          <div className="w-2/3">
            <Field
              label="Phone Number"
              name="phone"
              required
              icon="phone"
              placeholder="9898012345"
            />
          </div>
        </div>
        <Field
          label="Secure Password"
          type="password"
          name="password"
          required
          icon="lock"
          placeholder="••••••••"
        />
        <div className="flex gap-3 rounded bg-[#eef7ff] px-5 py-5 text-[12px] font-semibold leading-5 text-[#4e5963]">
          <Icon
            name="info"
            className="mt-0.5 h-5 w-5 shrink-0 text-[#7a4e5b]"
          />
          <p>
            <strong>Important Note:</strong> All new agent accounts are subject
            to administrative approval as per the Service Level Agreement.
            Verification typically takes 24-48 hours.
          </p>
        </div>
        <PrimaryButton arrow className="h-[54px] text-[14px]">
          {loading ? "Registering..." : "Register Account"}
        </PrimaryButton>
      </form>
      <p className="mt-9 text-center text-[18px] text-[#73787e]">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-[#7a4e5b]">
          Login
        </Link>
      </p>
    </div>
  );
}

function StageFooter({ meta }) {
  if (!meta.footerNote && !meta.copyright) return null;

  return (
    <>
      {meta.footerNote && (
        <p className=" text-center text-[10px] font-semibold text-[#75806f]">
          {meta.footerNote === "Systems Operational" && (
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#48b35c]" />
          )}
          {meta.footerNote}
        </p>
      )}
      {meta.copyright && (
        <p className="mt-2 text-center text-[10px] text-[#929292]">
          &copy; {meta.copyright}
        </p>
      )}
    </>
  );
}

function PortalLayout() {
  const { pathname } = useLocation();
  const meta = screenMeta[pathname] ?? screenMeta["/login"];

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#202a33] antialiased">
      <header className="flex h-[55px] items-center border-b border-[#dec9ce] bg-white px-7 sm:px-9">
        <Link
          to="/login"
          className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[#ee5d8d]"
        >
          <BrandLogo compact />
          Shelynx Agent Portal
        </Link>
      </header>

      <main
        className={`relative flex min-h-[calc(100vh-90px)] flex-1 justify-center overflow-hidden border-b border-[#dbcbd0] bg-[#f8dce4] px-4 pb-4 pt-6`}
      >
        {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_18%,rgba(255,255,255,0.58),transparent_31%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(153deg,rgba(255,255,255,0.68)_0_27%,transparent_27.2%)]" />
        <div className="absolute bottom-[-24%] right-[-8%] h-[70%] w-[86%] rotate-[-13deg] rounded-tl-full bg-white/15" />
        <div className="absolute left-[-12%] top-[16%] h-[38%] w-[60%] rotate-[9deg] rounded-br-full bg-white/30" />
        */}

        <BrandLogo />

        <section className="relative z-[1] flex w-full max-w-[526px] flex-col items-center">
          {meta.kicker && (
            <div className="mb-1 text-center text-xl font-semibold text-[#5c5f60]">
              {meta.kicker}
            </div>
          )}
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/forgot-password" element={<ForgotScreen />} />
            <Route path="/verify-otp" element={<OtpScreen />} />
            <Route path="/reset-password" element={<ResetScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <StageFooter meta={meta} />
        </section>
      </main>

      <footer className="flex min-h-[37px] items-center justify-between gap-4 bg-white px-7 text-[11px] text-[#68707a] sm:px-10 max-sm:min-h-[72px] max-sm:flex-col max-sm:justify-center max-sm:py-3">
        <p>&copy; 2026 Shelynx Logistics. All rights reserved.</p>
        <nav
          className="flex gap-8 max-sm:flex-wrap max-sm:justify-center max-sm:gap-4"
          aria-label="Legal links"
        >
          <a href="#privacy" className="underline underline-offset-2">
            Privacy Policy
          </a>
          <a href="#terms" className="underline underline-offset-2">
            Terms of Service
          </a>
          <a href="#help" className="underline underline-offset-2">
            Help Center
          </a>
        </nav>
      </footer>
    </div>
  );
}

export function AuthPortal() {
  return <PortalLayout />;
}
