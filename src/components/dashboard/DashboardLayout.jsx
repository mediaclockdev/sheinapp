import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const DashboardLayout = () => {
  return (
    <div className="flex bg-[#F8FAFF] min-h-screen text-[#17222B] font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Right-side container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[70px] bg-white border-b border-[#E8DFE1] px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-[#F4F7FB] border border-[#DCDFE6] rounded-xl px-4 py-2 w-full max-w-[720px] focus-within:border-[#ff5f96] focus-within:ring-2 focus-within:ring-pink-100 transition duration-200">
            {/* Commented out img for search icon */}
            {/* <img src="search.svg" alt="Search" className="h-4 w-4 text-[#8C959F]" /> */}
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search orders, customers, or batches..."
              className="bg-transparent text-sm text-[#17222B] placeholder-[#98A2AB] outline-none w-full"
            />
          </div>

          {/* User profile & Notifications */}
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition duration-200">
              {/* Commented out img for notification bell icon */}
              {/* <img src="bell.svg" alt="Notifications" className="h-5 w-5" /> */}
              <span className="text-lg">🔔</span>

              {/* Notification Badge */}
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#E14878] rounded-full border border-white"></span>
            </button>

            {/* Vertical Divider */}
            <div className="h-8 w-px bg-slate-200"></div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-[#141D23] block leading-tight">
                  Sarah Chen
                </span>
                <span className="text-xs font-medium text-[#5C5F60]/70 block">
                  Verified Agent #48219
                </span>
              </div>

              {/* Profile Avatar Image */}
              <div className="h-10 w-10 rounded-full border border-[#dec9ce] overflow-hidden bg-[#FFE8EF] flex items-center justify-center font-bold text-[#D24D77] text-sm shadow-sm">
                {/* Commented out img for user avatar */}
                {/* <img src="sarah_chen.jpg" alt="Sarah Chen" className="h-full w-full object-cover" /> */}

                {/* Visual Placeholder */}
                <span>SC</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
