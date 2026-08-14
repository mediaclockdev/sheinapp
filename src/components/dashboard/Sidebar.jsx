import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo2 from "../../assets/logo2.svg";

import dashboardicon from "../../assets/dashboardicon.svg";
import ordericon from "../../assets/ordericon.svg";
import paymentsicon from "../../assets/paymentsicon.svg";
import batchqueueicon from "../../assets/batchqueueicon.svg";
import trackingicon from "../../assets/trackingicon.svg";
import customericon from "../../assets/customersicon.svg";
import reportsicon from "../../assets/reportsicon.svg";
import settingsicon from "../../assets/settingsicon.svg";
import cameraicon from "../../assets/cameraicon.svg";
import { LogOut, MessageSquare, UserPlus, Copy, Check, X } from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState();

  const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au/api";

  const handleReferralLink = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/agent-profile/invite-link`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch referral link");
      }
      const data = await response.json();
      console.log(data);
      setReferralLink(data.data.inviteLink);
    } catch (error) {
      console.error("Error fetching referral link:", error);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", iconSrc: dashboardicon },
    { name: "Orders", path: "/orders", iconSrc: ordericon },
    { name: "Batch Queue", path: "/batch-queue", iconSrc: batchqueueicon },
    { name: "Payments", path: "/payments", iconSrc: paymentsicon },
    { name: "Tracking", path: "/tracking", iconSrc: trackingicon },
    { name: "Customers", path: "/customers", iconSrc: customericon },
    { name: "Conversations", path: "/conversation", icon: MessageSquare },
    { name: "Reports", path: "/reports", iconSrc: reportsicon },
    { name: "Settings", path: "/settings", iconSrc: settingsicon },
    { name: "Scan SKU", path: "/scanSku", iconSrc: cameraicon },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#F6FAFF] border-r border-[#D3C3C5] flex flex-col justify-between h-screen py-6 px-4 shrink-0 font-sans transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 overflow-y-auto scrollbar-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6">
          {/* Logo and Brand Title */}
          <div>
            <div className="h-32 w-32 overflow-hidden lg:mt-[-20px]">
              <img
                src={logo2}
                alt="Shelynx Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[13px] font-semibold text-[#5C5F60] mt-3.5">
              Agent Portal
            </p>
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-200 text-[#5C5F60] transition-colors"
              aria-label="Close Sidebar"
            >
              <span className="text-lg font-bold">✕</span>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    item.path === "/scanSku" ? "lg:hidden" : ""
                  } ${
                    isActive
                      ? "bg-[#FFE8EF] text-[#D24D77]"
                      : "text-[#5C5F60] hover:bg-[#EEF4FB] hover:text-[#17222B]"
                  }`
                }
              >
                {item.icon ? (
                  <item.icon size={16} className="shrink-0" />
                ) : (
                  <img
                    src={item.iconSrc}
                    alt={item.name}
                    className="h-4 w-4 shrink-0"
                  />
                )}

                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => {
              setInviteOpen(true);
              handleReferralLink();
              onClose();
            }}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#5C5F60] hover:bg-[#EEF4FB] hover:text-[#17222B] transition duration-200 cursor-pointer"
          >
            <UserPlus size={18} className="shrink-0" />
            <span>Invite</span>
          </button>
          <button
            onClick={() => {
              handleLogout();
              onClose();
            }}
            className="flex w-full items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#D24D77] border hover:bg-[#FFE8EF] transition duration-200 cursor-pointer"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>

          {/* Order Journey Card */}
          {/* {pathname.startsWith("/orders") && (
            <div className="bg-[#EEF4FB]/30 border border-[#D3C3C5]/50 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] mt-2 mb-2">
              <span className="text-[10px] font-bold text-[#8A6A72] uppercase tracking-wider block mb-3">
                Order Journey
              </span>
              <div className="relative pl-7 space-y-4">
            
                <div className="absolute left-[9px] top-2 bottom-2 w-[1.5px] bg-[#D3C3C5]" />

      
                <div className="relative flex flex-col justify-center min-h-5">
                  <div className="absolute -left-7 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#78555E] text-white text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141D23] leading-tight">
                      Submitted
                    </p>
                    <p className="text-[9px] font-semibold text-[#8C959F] mt-0.5">
                      Oct 12 • 10:45 AM
                    </p>
                  </div>
                </div>


                <div className="relative flex flex-col justify-center min-h-5">
                  <div className="absolute -left-7 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#78555E] text-white text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141D23] leading-tight">
                      Payment Verified
                    </p>
                    <p className="text-[9px] font-semibold text-[#8C959F] mt-0.5">
                      Oct 12 • 02:20 PM
                    </p>
                  </div>
                </div>


                <div className="relative flex flex-col justify-center min-h-5">
                  <div className="absolute -left-7 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-[#78555E] bg-[#EEF4FB]/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#78555E]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#78555E] leading-tight">
                      Purchased
                    </p>
                    <p className="text-[9px] font-semibold text-[#8C959F] mt-0.5">
                      Oct 14 • 11:30 AM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2">
          {/* New Order Action Button */}
          {/* <button
            onClick={() => navigate("/neworders")}
            className="cursor-pointer w-full bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-semibold py-2.5 rounded-xl text-base transition duration-200 shadow-sm flex items-center justify-center gap-1.5"
          > */}
          {/* Commented out plus/batch icon */}
          {/* <img src="plus.svg" alt="Add" className="h-3.5 w-3.5" /> */}
          {/* <span>+</span>
            <span>New Order</span>
          </button> */}

          {/* Help Center Item */}
          {/* <a
            href="#help"
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#5C5F60] hover:bg-[#EEF4FB] hover:text-[#17222B] transition duration-200"
          >
            <img src={helpicon} alt="Help" className="h-4 w-4" />
            <p>Help Center</p>
          </a> */}

          {/* Logout Button */}
          {/* <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#D24D77] border hover:bg-[#FFE8EF] transition duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button> */}
        </div>
      </div>

      {/* Invite Dialog */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 relative">
            <button
              onClick={() => setInviteOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100 text-[#5C5F60]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h2 className="text-base font-bold text-[#17222B] mb-4">
              Referral Link
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink ?? "Loading…"}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-[#D3C3C5] bg-[#F6FAFF] text-[#5C5F60] truncate"
              />
              <button
                onClick={handleCopy}
                disabled={!referralLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#FFE8EF] text-[#D24D77] hover:bg-[#FFD1DC] transition duration-200 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
