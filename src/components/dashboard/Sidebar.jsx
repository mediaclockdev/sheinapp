import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo2 from "../../assets/logo2.svg";
import tick from "../../assets/tickicon.svg";
import dashboardicon from "../../assets/dashboardicon.svg";
import ordericon from "../../assets/ordericon.svg";
import paymentsicon from "../../assets/paymentsicon.svg";
import batchqueueicon from "../../assets/batchqueueicon.svg";
import trackingicon from "../../assets/trackingicon.svg";
import customericon from "../../assets/customersicon.svg";
import reportsicon from "../../assets/reportsicon.svg";
import settingsicon from "../../assets/settingsicon.svg";
import helpicon from "../../assets/helpicon.svg";

const Sidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", iconSrc: dashboardicon },
    { name: "Orders", path: "/orders", iconSrc: ordericon },
    { name: "Payments", path: "/payments", iconSrc: paymentsicon },
    { name: "Batch Queue", path: "/batch-queue", iconSrc: batchqueueicon },
    { name: "Tracking", path: "/tracking", iconSrc: trackingicon },
    { name: "Customers", path: "/customers", iconSrc: customericon },
    { name: "Reports", path: "/reports", iconSrc: reportsicon },
    { name: "Settings", path: "/settings", iconSrc: settingsicon },
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
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#F6FAFF] border-r border-[#D3C3C5] flex flex-col justify-between h-screen py-6 px-4 shrink-0 font-sans transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6">
          {/* Logo and Brand Title */}
          <div className="flex items-start justify-between">
            <div>
              <div className="h-32 w-32 overflow-hidden">
                <img
                  src={logo2}
                  alt="Shelynx Logo"
                  className="h-32 w-32 object-cover"
                />
              </div>
              <p className="text-[13px] font-semibold text-[#5C5F60] mt-3.5">
                Agent Portal
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-200 text-[#5C5F60] transition-colors"
              aria-label="Close Sidebar"
            >
              <span className="text-lg font-bold">✕</span>
            </button>
          </div>

          {/* Trust Score Card */}
          <div className="bg-[#FFD1DC]/10 rounded-xl border border-[#FFD1DC]/50 p-3 shadow-[0_4px_16px_rgba(255,95,150,0.02)]">
            <span className="text-[10px] font-bold text-[#98A2AB] uppercase tracking-wider block">
              Trust Score
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {/* Commented out img for star icon */}
              {/* <img src="star.svg" alt="Star" className="h-4 w-4" /> */}
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-base  font-extrabold text-[#141D23]">
                4.9
              </span>
              <span className="text-xs text-[#5C5F60]/60">(128 reviews)</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <img src={tick} alt="Verified" className="h-3 w-3" />

              <p className="text-[#78555E] font-bold text-[10px]">
                TOP RATED AGENT
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#FFE8EF] text-[#D24D77]"
                      : "text-[#5C5F60] hover:bg-[#EEF4FB] hover:text-[#17222B]"
                  }`
                }
              >
                {/* Commented out icon as requested by the user */}
                <img
                  src={item.iconSrc}
                  alt={item.name}
                  className="h-4 w-4 shrink-0"
                />

                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Order Journey Card */}
          {pathname.startsWith("/orders") && (
            <div className="bg-[#EEF4FB]/30 border border-[#D3C3C5]/50 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] mt-2">
              <span className="text-[10px] font-bold text-[#8A6A72] uppercase tracking-wider block mb-3">
                Order Journey
              </span>
              <div className="relative pl-7 space-y-4">
                {/* Vertical timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-[1.5px] bg-[#D3C3C5]" />

                {/* Step 1 */}
                <div className="relative flex flex-col justify-center min-h-5">
                  <div className="absolute -left-7 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#78555E] text-white text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141D23] leading-tight">Submitted</p>
                    <p className="text-[9px] font-semibold text-[#8C959F] mt-0.5">Oct 12 • 10:45 AM</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col justify-center min-h-5">
                  <div className="absolute -left-7 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#78555E] text-white text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141D23] leading-tight">Payment Verified</p>
                    <p className="text-[9px] font-semibold text-[#8C959F] mt-0.5">Oct 12 • 02:20 PM</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex flex-col justify-center min-h-5">
                  <div className="absolute -left-7 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-[#78555E] bg-[#EEF4FB]/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#78555E]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#78555E] leading-tight">Purchased</p>
                    <p className="text-[9px] font-semibold text-[#8C959F] mt-0.5">Oct 14 • 11:30 AM</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4">
          {/* New Batch Action Button */}
          <button className="w-full bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-bold py-2.5 rounded-xl text-base transition duration-200 shadow-sm flex items-center justify-center gap-1.5">
            {/* Commented out plus/batch icon */}
            {/* <img src="plus.svg" alt="Add" className="h-3.5 w-3.5" /> */}
            <span>+</span>
            <span>New Batch</span>
          </button>

          {/* Help Center Item */}
          <a
            href="#help"
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-bold text-[#5C5F60] hover:bg-[#EEF4FB] hover:text-[#17222B] transition duration-200"
          >
            <img src={helpicon} alt="Help" className="h-4 w-4" />

            <span>Help Center</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
