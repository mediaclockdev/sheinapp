import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Bell, FileText, LogOut } from "lucide-react";
import logo2 from "../../assets/logo2.svg";
import { getUser, logout } from "../../lib/auth";

const NAV = [
  { name: "Dashboard", path: "/admin", end: true, icon: LayoutDashboard },
  { name: "Agent Management", path: "/admin/agents", icon: Users },
  // { name: "Settings", path: "/admin/settings", icon: Settings },
];

const PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/agents": "Agent Management",
  "/admin/settings": "Settings",
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/admin/agents/") ? "Agent Details" : "Dashboard");
  const name = getUser()?.name || "Admin";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFD1DC33] text-[#17222B] font-sans antialiased">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[240px] shrink-0 flex-col justify-between border-r border-[#E8DFE1] bg-white py-6 px-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-1">
            <img src={logo2} alt="" className="h-8 w-8 object-contain" />
            <div>
              <p className="text-base font-bold text-[#7A4E5B] leading-tight">
                Admin Panel
              </p>
              <p className="text-[11px] font-medium text-[#8C959F]">
                Global Operations
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ name, path, end, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                    isActive
                      ? "bg-[#FFE8EF] text-[#D24D77]"
                      : "text-[#5C5F60] hover:bg-[#EEF4FB] hover:text-[#17222B]"
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span>{name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFE8EF] px-3.5 py-2.5 text-sm font-semibold text-[#D24D77] transition-colors duration-200 hover:bg-[#FFD1DC] cursor-pointer">
            <FileText size={16} />
            <span>Generate Report</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#5C5F60] transition-colors duration-200 hover:bg-[#EEF4FB] hover:text-[#17222B] cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between gap-4 border-b border-[#E8DFE1] bg-white px-4 sm:px-8">
          <h1 className="min-w-0 truncate  font-semibold tracking-tight text-[#17222B] text-base lg:text-3xl">
            {title}
          </h1>

          <div className="flex items-center gap-3 lg:gap-5">
            <button className="rounded-lg p-2 text-[#5C5F60] hover:bg-slate-100">
              <Bell size={18} />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="hidden text-sm font-bold leading-tight text-[#141D23] lg:block">
                  {name}
                </p>
                <p className="hidden text-xs font-medium text-[#5C5F60]/70 lg:block">
                  Super Admin
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dec9ce] bg-[#FFE8EF] text-sm font-bold text-[#D24D77]">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
