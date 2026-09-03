import React from "react";

export function PagePlaceholder({ title, description }) {
  return (
    <div className="flex-1 p-8 bg-[#f8fbff] min-h-[calc(100vh-70px)]">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#17222b] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[#5c5f60] mt-1">
            Shelynx Agent Portal &bull; Route Active
          </p>
        </div>

        {/* Status / Construction Card */}
        <div className="bg-white rounded-2xl border border-[#dec9ce]/40 p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center">
          {/* Accent Graphic - circular box */}
          <div className="h-16 w-16 bg-[#ffc6d8]/30 text-[#7a4e5b] rounded-2xl flex items-center justify-center mb-6">
            {/* Commented out img for illustration icon as requested */}
            {/* <img src="icons/construction.svg" alt="Under Construction" className="h-8 w-8" /> */}
            <span className="text-2xl">⚡</span>
          </div>

          <h2 className="text-2xl font-bold text-[#17222b]">
            Design coming soon
          </h2>
          <p className="text-[#626973] text-sm max-w-md mt-2 leading-relaxed">
            {description || `The ${title} view is currently active in the router. High-fidelity layouts and interactive panels will be integrated soon as designs are finalized.`}
          </p>

          <div className="mt-8 flex gap-3">
            <button className="px-5 py-2.5 rounded bg-[#ffc6d8] hover:bg-[#ffb5cd] font-bold text-[#704154] text-xs transition duration-200 shadow-sm">
              Notify Design Ready
            </button>
            <button className="px-5 py-2.5 rounded border border-[#dec9ce] hover:bg-slate-50 font-bold text-[#5c5f60] text-xs transition duration-200">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersView() {
  return (
    <PagePlaceholder
      title="Order Management"
      description="The order pipeline, customer verification records, risk assessments, and batch assignment operations will reside here. This route is ready for integration."
    />
  );
}

export function PaymentsView() {
  return (
    <PagePlaceholder
      title="Payments"
      description="Agent commissions, gross payouts, and scheduled disbursements are being wired into this module. Route is active."
    />
  );
}

export function TrackingView() {
  return (
    <PagePlaceholder
      title="Shipment Tracking"
      description="Courier API integration, shipping label generation, and dispatch timelines will be tracked live in this section."
    />
  );
}

export function ReportsView() {
  return (
    <PagePlaceholder
      title="Performance Reports"
      description="Revenue graphs, volume trends, batch optimization savings, and performance analytics reports."
    />
  );
}

export function SettingsView() {
  return (
    <PagePlaceholder
      title="Portal Settings"
      description="Configure API connections, agent profile details, system notification settings, and security credentials."
    />
  );
}
