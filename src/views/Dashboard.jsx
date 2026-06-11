import React, { useState, useEffect } from "react";
import newbatchicon from "../assets/newbatch.svg";
import totalordersicon from "../assets/totalordericon.svg";
import pendingreviewicon from "../assets/pendingreviewicon.svg";
import totalweighticon from "../assets/totalweighticon.svg";
import orderinbatchicon from "../assets/orderbatchicon.svg";
import activebatchesicon from "../assets/activediscountbatchesicon.svg";
import needunlockbatchicon from "../assets/needtounlockbatchicon.svg";
import smartbatchicon from "../assets/smartbatchrecicon.svg";
import incomingordersreviewicon from "../assets/incomingorderreviewicon.svg";
import filtericon from "../assets/filtericon.svg";
import exporticon from "../assets/exporticon.svg";

// Mock API Call simulating backend data loading
const fetchDashboardData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        agent: {
          name: "Sarah",
          newOrdersCount: 12,
        },
        stats: {
          totalOrders: "1,284",
          pendingReview: 12,
          moneySavedThisMonth: "$1,842",
          totalWeight: "428.5 kg",
          ordersInBatch: 45,
        },
        activeDiscountBatches: [
          {
            id: "#15",
            currentAmount: 420.0,
            targetAmount: 500.0,
            progress: 84, // 420 / 500 = 84%
            discountPercent: 20,
          },
          {
            id: "#16",
            currentAmount: 820.0,
            targetAmount: 1000.0,
            progress: 82, // 820 / 1000 = 82%
            discountPercent: 25,
          },
          {
            id: "#17",
            currentAmount: 140.0,
            targetAmount: 300.0,
            progress: 46, // 140 / 300 = 46%
            discountPercent: 15,
          },
        ],
        revenueAnalytics: {
          grossEarnings: "$14,280.50",
          grossEarningsGrowth: "+8.4%",
          agentCommission: "$1,142.44",
          agentCommissionRate: "8%",
          netPayout: "$13,138.06",
          netPayoutDate: "Aug 20, 2024",
          chartData: [
            { day: "Jul 20", value: 40 },
            { day: "Jul 27", value: 85 },
            { day: "Aug 03", value: 70 },
            { day: "Aug 10", value: 120 },
            { day: "Aug 17", value: 110 },
          ],
        },
        recommendation: {
          message:
            "Move Order #1942 from Batch 7 to Batch 5. This unlocks the 20% discount immediately and saves $74.",
        },
        incomingOrders: [
          {
            id: "1",
            productName: "Floral Midi Dress",
            sku: "SKU: SH-29402",
            image: "floral_midi_dress.png",
            customerName: "Elena Rodriguez",
            customerRisk: "Trusted",
            size: "M",
            color: "Sage Green",
            weight: "0.35 kg",
            couponBucket: "BATCH_JULY_A",
            price: "$42.00",
          },
          {
            id: "2",
            productName: "Minimalist Canvas Tote",
            sku: "SKU: SH-88219",
            image: "canvas_tote.png",
            customerName: "Mark Thompson",
            customerRisk: "New Customer",
            size: "Large",
            color: "Beige",
            weight: "0.20 kg",
            couponBucket: "NEW_USER_B",
            price: "$18.50",
          },
          {
            id: "3",
            productName: "Pointed-Toe Heels",
            sku: "SKU: SH-10293",
            image: "toe_heels.png",
            customerName: "Jessica Wu",
            customerRisk: "Previous Delivery Refusal",
            size: "38",
            color: "Black",
            weight: "0.85 kg",
            couponBucket: "VIP_REFUND_LOCK",
            price: "$125.00",
          },
        ],
      });
    }, 600); // 600ms network delay
  });
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-[#F8FAFF] min-h-[calc(100vh-70px)] flex flex-col justify-center items-center">
        {/* Animated loader */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#ffc6d8] border-t-[#D24D77] rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#626973] animate-pulse">
            Fetching Agent Dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F8FAFF] min-h-[calc(100vh-70px)] space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[32px] font-bold text-[#17222B] tracking-tight">
            Welcome back, {data.agent.name}
          </h1>
          <p className="text-base text-[#5C5F60]/80 mt-1 font-semibold">
            You have{" "}
            <span className="text-[#78555E] font-extrabold">
              {data.agent.newOrdersCount} new orders
            </span>{" "}
            to review today.
          </p>
        </div>

        {/* New Batch Action button */}
        <button className="bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-normal px-5 py-2.5 rounded-xl text-base cursor-pointer transition duration-200 shadow-sm flex items-center gap-1.5">
          {/* Commented out img for new batch button icon */}
          <img src={newbatchicon} alt="New Batch" className="h-4 w-4" />
          <span>New Batch</span>
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFE1] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative flex flex-col justify-between min-h-[120px]">
          <div className="flex flex-col gap-3">
            <div className="h-9 w-9 ">
              {/* Commented out img for stat icon */}
              <img
                src={totalordersicon}
                alt="Total Orders"
                className="h-9 w-9"
              />
            </div>
            <p className="text-xs font-bold text-[#5C5F60] uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-2xl font-semibold text-[#141D23]">
              {data.stats.totalOrders}
            </p>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFE1] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative flex flex-col justify-between min-h-[120px]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9  shrink-0">
                <img
                  src={pendingreviewicon}
                  alt="Pending Review"
                  className="h-9 w-9"
                />
              </div>
              <div className=" bg-[#FFD1DC] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#78555E]">
                ACTION REQUIRED
              </div>
            </div>
            <p className="text-xs font-bold text-[#5C5F60] uppercase tracking-wider">
              Pending Review
            </p>
            <p className="text-2xl font-semibold text-[#141D23]">
              {data.stats.pendingReview}
            </p>
          </div>
        </div>

        {/* Card 3: Money Saved (Accent Card) */}
        <div className="bg-[#FFD1DC] p-4 rounded-2xl border border-[#D3C3C5] shadow-[0_4px_20px_rgba(255,95,150,0.02)] relative flex flex-col justify-between min-h-[120px]">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-[#7A5761]  tracking-wider">
              Money Saved This Month
            </p>

            <p className="text-2xl font-semibold text-[#2D141C] ">
              {data.stats.moneySavedThisMonth}
            </p>
            <p className="text-xs text-[#7A5761] font-normal leading-normal">
              Generated from optimized coupon batching
            </p>
          </div>
        </div>

        {/* Card 4: Total Weight */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFE1] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative flex flex-col justify-between min-h-[120px]">
          <div>
            <div className="flex flex-col  gap-2">
              <div className="flex justify-between">
                <div className="h-9 w-9 shrink-0">
                  <img
                    src={totalweighticon}
                    alt="Total Weight"
                    className="h-9 w-9"
                  />
                </div>
                <div className="bg-[#ECFDF5] px-2 py-1 rounded-full text-[11px] font-bold text-[#1F7B44] flex items-center gap-1">
                  <span>↗</span>
                  <span>+13%</span>
                </div>
              </div>
              <p className="text-xs font-bold text-[#98A2AB] uppercase tracking-wider">
                Total Weight
              </p>
              <p className="text-2xl font-semibold text-[#2D141C]">
                {data.stats.totalWeight}
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Orders in Batch */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFE1] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative flex flex-col justify-between min-h-[120px]">
          <div className="flex flex-col gap-2">
            <div className="h-9 w-9 ">
              <img
                src={orderinbatchicon}
                alt="Orders In Batch"
                className="h-9 w-9"
              />
            </div>
            <p className="text-xs font-bold text-[#98A2AB] uppercase tracking-wider">
              Orders In Batch
            </p>
            <p className="text-2xl font-semibold text-[#2D141C]">
              {data.stats.ordersInBatch}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Batches & Revenue Analytics */}
      <div className=" gap-6">
        {/* Left Column: Active Discount Batches Table (7/12 width) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DFE1] shadow-[0_4px_24px_rgba(0,0,0,0.01)] overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header row */}
            <div className="bg-[#E6EFF8] p-6 border-b border-[#D3C3C5] flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={activebatchesicon}
                  alt="Batches"
                  className="h-5 w-5"
                />
                <h2 className="font-semibold text-[#141D23] text-xl">
                  Active Discount Batches
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#78555E]/10 border border-[#78555E]/20 px-3 py-2 rounded-[12px] text-sm font-semibold text-[#78555E] flex items-center gap-1">
                  <img
                    src={needunlockbatchicon}
                    alt="need to unlock batch icon"
                  />
                  <p>Need $80 more to unlock Batch #15</p>
                </div>
                <a
                  href="#batches"
                  className="text-[13px] font-semibold text-[#78555E] hover:underline"
                >
                  View All Batches
                </a>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#F4F4F6] text-[13px] uppercase font-bold text-[#5C5F60] bg-slate-50/50">
                    <th className="px-6 py-4">Batch ID</th>
                    <th className="px-6 py-4">Current Amount</th>
                    <th className="px-6 py-4">Target Amount</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Discount %</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F6] font-bold">
                  {data.activeDiscountBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="hover:bg-slate-50/30 transition"
                    >
                      <td className="px-6 py-4 text-[#141D23] font-medium">
                        {batch.id}
                      </td>
                      <td className="px-6 py-4 text-[#141D23] font-semibold">
                        ${batch.currentAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4  text-[#141D23] font-normal">
                        ${batch.targetAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-[#EEF2F6] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#78555E] h-full rounded-full transition-all duration-500"
                              style={{ width: `${batch.progress}%` }}
                            ></div>
                          </div>
                          {/* <p className="text-xl text-[#78555E] font-semibold">
                            {batch.progress}%
                          </p> */}
                        </div>
                      </td>
                      <td className="text-xl text-[#78555E] font-semibold px-6 py-4">
                        {batch.discountPercent}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#141D23] px-4 py-2 rounded-lg text-[13px] transition duration-200">
                          Add Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Revenue Analytics Card (5/12 width) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8DFE1] shadow-[0_4px_24px_rgba(0,0,0,0.01)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-[#141D23] text-xl">
                  Revenue Analytics
                </h2>
                <p className="text-xs text-[#5C5F60]/70 mt-0.5 font-normal">
                  Performance summary for the current billing cycle
                </p>
              </div>
              <div className="flex bg-[#F4F7FB] border border-[#E4E7ED] rounded-xl p-1 gap-1">
                <button className="px-3 py-1 text-[10px] font-bold rounded-lg bg-white shadow-sm text-[#17222B]">
                  Last 30 Days
                </button>
                <button className="px-3 py-1 text-[10px] font-bold rounded-lg text-[#8C959F] hover:text-[#17222B]">
                  This Month
                </button>
              </div>
            </div>

            {/* Inner Boxes (3 Columns) */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {/* Gross Earnings */}
              <div className="bg-[#ECF5FE] border border-[#EEF2F8] p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-[#8C959F] uppercase tracking-wider block">
                  Gross Earnings
                </span>
                <p className="text-2xl font-semibold text-[#141D23] mt-1.5 leading-none">
                  {data.revenueAnalytics.grossEarnings}
                </p>
                <span className="text-xs text-[#15803D] font-bold mt-1.5 flex items-center gap-0.5">
                  <span>▲</span>
                  <span>{data.revenueAnalytics.grossEarningsGrowth}</span>
                </span>
              </div>

              {/* Agent Commission */}
              <div className="bg-[#F8FAFF] border border-[#EEF2F8] p-3.5 rounded-xl">
                <span className="text-[9px] font-bold text-[#8C959F] uppercase tracking-wider block">
                  Agent Commission
                </span>
                <p className="text-sm font-black text-[#17222B] mt-1.5 leading-none">
                  {data.revenueAnalytics.agentCommission}
                </p>
                <span className="text-[9px] text-[#8C959F] font-bold mt-1.5 block leading-tight">
                  Rate applied: {data.revenueAnalytics.agentCommissionRate}
                </span>
              </div>

              {/* Net Payout */}
              <div className="bg-[#FFE8EF]/30 border border-[#FFE8EF] p-3.5 rounded-xl">
                <span className="text-[9px] font-bold text-[#A46078] uppercase tracking-wider block">
                  Net Payout
                </span>
                <p className="text-sm font-black text-[#D24D77] mt-1.5 leading-none">
                  {data.revenueAnalytics.netPayout}
                </p>
                <span className="text-[9px] text-[#A46078] font-bold mt-1.5 block leading-tight">
                  Due: {data.revenueAnalytics.netPayoutDate}
                </span>
              </div>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="mt-6">
            <div className="flex justify-between items-center text-[9px] font-bold text-[#8C959F] mb-1">
              <span>DAILY REVENUE</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-[#D24D77] rounded-full"></span>
                <span>Active Trend</span>
              </span>
            </div>

            {/* SVG Plot */}
            <div className="w-full h-[120px] relative">
              <svg
                className="w-full h-full"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Fill Gradient */}
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE8EF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#FFE8EF" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area Under Line */}
                <path
                  d="M 0 120 L 0 90 Q 60 70 100 50 Q 150 70 200 60 Q 250 20 300 30 T 400 15 L 400 120 Z"
                  fill="url(#chartGrad)"
                />

                {/* Line Path */}
                <path
                  d="M 0 90 Q 60 70 100 50 Q 150 70 200 60 Q 250 20 300 30 T 400 15"
                  fill="none"
                  stroke="#704154"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data point dots */}
                <circle cx="100" cy="50" r="3" fill="#D24D77" />
                <circle cx="200" cy="60" r="3" fill="#D24D77" />
                <circle cx="300" cy="30" r="3" fill="#D24D77" />
                <circle cx="400" cy="15" r="3" fill="#D24D77" />
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-1 text-[9px] font-bold text-[#8C959F]">
              <span>Jul 20</span>
              <span>Jul 27</span>
              <span>Aug 03</span>
              <span>Aug 10</span>
              <span>Aug 17</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Batch Recommendations */}
      <div className="bg-white rounded-2xl border border-[#E8DFE1] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex gap-5">
        {/* Sparkle icon wrapper */}
        <div className="h-15 w-15 shrink-0">
          <img
            src={smartbatchicon}
            alt="Recommendation"
            className="h-15 w-15"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold text-[#141D23] text-xl leading-tight">
              Smart Batch Recommendations
            </h3>
            <p className="text-sm text-[#5C5F60] mt-1 font-normal">
              Automated optimizations to maximize shipping discounts.
            </p>
          </div>

          {/* recommendation text box */}
          <div className="bg-[#ECF5FE] border-l-4 border-l-[#78555E] p-4 rounded-r-lg text-sm font-semibold text-[#141D23] leading-relaxed italic">
            "{data.recommendation.message}"
          </div>

          <div className="flex gap-4">
            <button className="bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-bold px-4 py-2 rounded-lg text-base transition duration-200 cursor-pointer">
              Apply Recommendation
            </button>
            <button className="text-[#5C5F60] hover:text-[#17222B] font-normal px-3 py-2 text-base transition duration-200 cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Incoming Orders Review Table (Full width card) */}
      <div className="bg-white rounded-2xl border border-[#E8DFE1] shadow-[0_4px_24px_rgba(0,0,0,0.01)] overflow-hidden relative">
        {/* Table Header */}
        <div className="p-6 border-b border-[#E8DFE1] flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={incomingordersreviewicon}
              alt="Incoming Orders"
              className="h-5 w-5"
            />

            <h3 className="font-semibold text-[#141D23] text-xl">
              Incoming Orders Review
            </h3>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1 border border-[#D3C3C5] hover:bg-slate-50 rounded-sm text-[13px] font-semibold text-[#141D23] transition duration-200">
              <img src={filtericon} alt="Filter" className="h-3.5 w-3.5" />

              <p>Filter</p>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#D3C3C5] hover:bg-slate-50 rounded-sm text-[13px] font-semibold text-[#141D23] transition duration-200">
              <img src={exporticon} alt="Export" className="h-3.5 w-3.5" />

              <span>Export</span>
            </button>
            <button className="bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-normal px-4 py-2 rounded-xl text-xs transition duration-200">
              See All
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#F4F4F6] text-[10px] uppercase font-bold text-[#8C959F] bg-slate-50/50">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Customer Risk</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4">Weight</th>
                <th className="px-6 py-4">Coupon Bucket</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F6] font-bold">
              {data.incomingOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition">
                  {/* Product block */}
                  <td className="px-6 py-4 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      {/* Product image thumbnail */}
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                        {/* Commented out img for product thumbnail as requested */}
                        {/* <img src={order.image} alt={order.productName} className="h-full w-full object-cover" /> */}
                        <span className="text-base text-slate-400">👗</span>
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-[#17222B] block leading-tight">
                          {order.productName}
                        </span>
                        <span className="text-[10px] font-bold text-[#8C959F] block mt-0.5">
                          {order.sku}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Customer Risk Badge */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          order.customerRisk === "Trusted"
                            ? "bg-[#1F7B44]"
                            : order.customerRisk === "New Customer"
                              ? "bg-yellow-400"
                              : "bg-red-500"
                        }`}
                      ></span>
                      <div>
                        <span className="text-sm font-extrabold text-[#17222B] block leading-tight">
                          {order.customerName}
                        </span>
                        <span
                          className={`text-[9px] font-bold block mt-0.5 uppercase tracking-wide ${
                            order.customerRisk === "Trusted"
                              ? "text-[#1F7B44]"
                              : order.customerRisk === "New Customer"
                                ? "text-yellow-600"
                                : "text-red-500"
                          }`}
                        >
                          &bull; {order.customerRisk}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Size */}
                  <td className="px-6 py-4 text-[#5c5f60] font-semibold">
                    {order.size}
                  </td>

                  {/* Color */}
                  <td className="px-6 py-4 text-[#5c5f60] font-semibold">
                    {order.color}
                  </td>

                  {/* Weight */}
                  <td className="px-6 py-4 text-[#5c5f60] font-semibold">
                    {order.weight}
                  </td>

                  {/* Coupon Bucket */}
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-600 tracking-wider">
                      {order.couponBucket}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-right text-[#17222B] font-extrabold text-sm">
                    {order.price}
                  </td>

                  {/* Actions column */}
                  <td className="px-6 py-4 text-center">
                    <button className="p-1 rounded hover:bg-slate-100 text-[#8C959F] hover:text-[#17222B] transition">
                      {/* Commented out img for action options */}
                      {/* <img src="more_vert.svg" alt="Options" className="h-5 w-5" /> */}
                      <span className="font-extrabold text-sm leading-none block px-1">
                        ⋮
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-6 border-t border-[#E8DFE1] bg-slate-50/20 flex flex-wrap justify-between items-center gap-4">
          <span className="text-xs font-semibold text-[#8C959F]">
            Showing 1-10 of 42 pending reviews
          </span>

          <div className="flex items-center gap-1.5">
            <button className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition">
              ‹
            </button>
            <button className="h-8 w-8 rounded-lg bg-[#FFE8EF] text-[#D24D77] border border-[#FFE8EF] flex items-center justify-center font-extrabold text-xs transition">
              1
            </button>
            <button className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition">
              2
            </button>
            <button className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition">
              3
            </button>
            <button className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition">
              ›
            </button>
          </div>
        </div>

        {/* Floating Action Button inside table container */}
        <div className="absolute right-6 bottom-16">
          <button className="h-12 w-12 bg-[#704154] hover:bg-[#593342] text-white rounded-full flex items-center justify-center shadow-lg transition duration-200 transform hover:-translate-y-0.5">
            {/* Commented out img for FAB icon */}
            {/* <img src="fab_plus.svg" alt="Add" className="h-5 w-5" /> */}
            <span className="text-xl font-bold">+</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
