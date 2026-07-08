import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import dotmenu from "../assets/3dotmenu.svg";

const API_ORIGIN = "https://shelynx.mediaclocksoft.com.au";
const API_BASE_URL = `${API_ORIGIN}/api`;

// photoUrl is a full CDN URL for SHEIN products, a relative path for uploads
const imageUrl = (p) =>
  !p ? null : p.startsWith("http") ? p : `${API_ORIGIN}${p}`;

const fetchApi = async (path) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  const json = await response.json();
  return json.data;
};

const fetchCardData = () => fetchApi("/dashboard/card-data");

// Risk labels arrive uppercase from the API; normalize to the badge strings
const RISK_LABELS = { TRUSTED: "Trusted", "NEW CUSTOMER": "New Customer" };

const fetchOrderData = async () => {
  const data = await fetchApi("/dashboard/order-data");
  return data.items.map((item) => ({
    id: String(item.id),
    productName: item.productName,
    sku: `SKU: ${item.skuCode}`,
    image: imageUrl(item.photoUrl),
    customerName: item.customerName || "—",
    customerRisk: RISK_LABELS[item.customerRisk] || item.customerRisk,
    size: item.size,
    color: item.color,
    weight: typeof item.weight === "number" ? `${item.weight} kg` : item.weight,
    couponBucket: item.couponBucket,
    price: money(item.price ?? 0),
  }));
};

const money = (n) =>
  typeof n === "string"
    ? n
    : `$${Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const fetchRevenueData = async (filter) => {
  const d = await fetchApi(`/dashboard/revenue-data?filter=${filter}`);
  return {
    grossEarnings: money(d.grossEarning ?? 0),
    grossEarningsGrowth: d.grossEarningsGrowth ?? "",
    agentCommission: money(d.agentCommission ?? 0),
    agentCommissionRate: d.agentCommissionRate ?? "",
    netPayout: money(d.netPayout ?? 0),
    netPayoutDate: d.netPayoutDate ?? "",
    chartData: (d.chartData ?? []).map((p) => ({
      day: p.date,
      value: Number(p.amount ?? 0),
    })),
  };
};

const fetchBatchData = async () => {
  const d = await fetchApi("/dashboard/batch-data");
  const list = Array.isArray(d) ? d : (d.items ?? d.batches ?? []);
  return list.map((b) => ({
    id: String(b.id ?? b.batchId).startsWith("#")
      ? String(b.id ?? b.batchId)
      : `#${b.id ?? b.batchId}`,
    currentAmount: Number(b.currentAmount ?? 0),
    targetAmount: Number(b.targetAmount ?? 0),
    progress: Math.min(
      100,
      Math.round(
        b.progress ??
          (b.targetAmount ? (b.currentAmount / b.targetAmount) * 100 : 0),
      ),
    ),
    discountPercent: b.discountPercent ?? b.discount ?? 0,
    itemCount: Number(b.itemCount ?? b.itemsCount ?? b._count?.items ?? 0),
    orderCount: Number(b.orderCount ?? b.ordersCount ?? b._count?.order ?? 0),
  }));
};

const ORDERS_PAGE_SIZE = 5;

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [revenueFilter, setRevenueFilter] = useState("last_30_days");
  const [revenueApi, setRevenueApi] = useState(null);

  useEffect(() => {
    fetchRevenueData(revenueFilter)
      .then(setRevenueApi)
      .catch(() => {});
  }, [revenueFilter]);

  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(
        localStorage.getItem("user") || sessionStorage.getItem("user"),
      );
    } catch {
      /* ignore bad stored user */
    }

    Promise.all([
      fetchCardData().catch(() => null),
      fetchOrderData().catch(() => null),
      fetchBatchData().catch(() => null),
    ]).then(([cards, orders, batches]) => {
      setData({
        agent: {
          name: user?.name || "Agent",
          newOrdersCount: cards?.pendingReviews ?? 0,
        },
        stats: {
          totalOrders: (cards?.totalOrders ?? 0).toLocaleString(),
          pendingReview: cards?.pendingReviews ?? 0,
          moneySavedThisMonth: `$${(cards?.moneySaved ?? 0).toLocaleString()}`,
          totalWeight: `${cards?.totalWeight ?? 0} kg`,
          ordersInBatch: cards?.ordersInBatch ?? 0,
        },
        activeDiscountBatches: batches ?? [],
        // shown only until the revenue-data call resolves
        revenueAnalytics: {
          grossEarnings: money(0),
          grossEarningsGrowth: "",
          agentCommission: money(0),
          agentCommissionRate: "",
          netPayout: money(0),
          netPayoutDate: "",
          chartData: [],
        },
        incomingOrders: orders ?? [],
      });
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

  const totalOrders = data.incomingOrders.length;
  const totalOrderPages = Math.max(
    1,
    Math.ceil(totalOrders / ORDERS_PAGE_SIZE),
  );
  const pagedOrders = data.incomingOrders.slice(
    (ordersPage - 1) * ORDERS_PAGE_SIZE,
    ordersPage * ORDERS_PAGE_SIZE,
  );

  const revenueAnalytics = revenueApi ?? data.revenueAnalytics;

  // Revenue chart geometry: scale points into the 400x120 viewBox
  const chartData = revenueAnalytics.chartData;
  const maxChartValue = Math.max(...chartData.map((p) => p.value), 1);
  const chartPoints = chartData.map((p, i) => ({
    x: chartData.length > 1 ? (i * 400) / (chartData.length - 1) : 200,
    y: 115 - (p.value / maxChartValue) * 100,
  }));
  const chartLinePath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const chartAreaPath = chartLinePath
    ? `${chartLinePath} L 400 120 L 0 120 Z`
    : "";

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/20 min-h-[calc(100vh-70px)] space-y-6">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row gap-5 lg:justify-between lg:items-center">
        <div>
          <h1 className="text-2xl lg:text-[32px] font-bold text-[#17222B] tracking-tight">
            Welcome back, {data.agent.name}
          </h1>
          <p className="text-base text-[#5C5F60]/80 mt-1 font-semibold">
            You have{" "}
            <span className="text-[#78555E] font-bold">
              {data.agent.newOrdersCount} new orders
            </span>{" "}
            to review today.
          </p>
        </div>

        {/* New Batch Action button */}
        <button
          onClick={() => navigate("/batch-queue")}
          className="w-[40%] lg:w-[15%] bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-normal px-5 py-2.5 rounded-xl text-base whitespace-nowrap cursor-pointer transition duration-200 shadow-sm flex items-center gap-1.5"
        >
          <img src={newbatchicon} alt="New Batch" className="h-4 w-4" />
          <span>New Batch</span>
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFE1] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative flex flex-col justify-between min-h-[120px]">
          <div className="flex flex-col gap-3">
            <div className="h-9 w-9 ">
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
                  Active Batches
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {/* <div className="bg-[#78555E]/10 border border-[#78555E]/20 px-3 py-2 rounded-[12px] text-sm font-semibold text-[#78555E] flex items-center gap-1">
                  <img
                    src={needunlockbatchicon}
                    alt="need to unlock batch icon"
                  />
                  <p>Need $80 more to unlock Batch #15</p>
                </div> */}
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
                    <th className="px-6 py-4 text-center">Batch ID</th>
                    <th className="px-6 py-4 text-center">Current Amount</th>
                    <th className="px-6 py-4 text-center">Target Amount</th>
                    <th className="px-6 py-4 text-center">Item Count</th>
                    <th className="px-6 py-4 text-center">Order Count</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F6] font-bold">
                  {data.activeDiscountBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="hover:bg-slate-50/30 transition"
                    >
                      <td className="px-6 py-4 text-center text-[#141D23] font-semibold">
                        {batch.id}
                      </td>
                      <td className="px-6 py-4 text-center text-[#141D23] font-semibold">
                        ${batch.currentAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#141D23] font-semibold">
                        ${batch.targetAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 min-w-[150px] text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* <div className="flex-1 bg-[#EEF2F6] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#78555E] h-full rounded-full transition-all duration-500"
                              style={{ width: `${batch.progress}%` }}
                            ></div>
                          </div> */}
                          <p className=" text-[#141D23] font-semibold">
                            {batch.itemCount}
                          </p>
                        </div>
                      </td>
                      <td className=" text-[#141D23] font-semibold px-6 py-4 text-center">
                        {batch.orderCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate("/batch-queue")}
                          className="bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#141D23] px-4 py-2 rounded-lg text-[13px] transition duration-200 cursor-pointer"
                        >
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
        <div className=" bg-white rounded-2xl border border-[#E8DFE1] shadow-[0_4px_24px_rgba(0,0,0,0.01)] p-6 flex flex-col justify-between mt-5">
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
                {[
                  { value: "last_30_days", label: "Last 30 Days" },
                  { value: "this_month", label: "This Month" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setRevenueFilter(f.value)}
                    className={
                      revenueFilter === f.value
                        ? "px-3 py-1 text-[10px] font-bold rounded-lg bg-white shadow-sm text-[#17222B]"
                        : "px-3 py-1 text-[10px] font-bold rounded-lg text-[#8C959F] hover:text-[#17222B] cursor-pointer"
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inner Boxes (3 Columns) */}
            <div className="grid grid-col-1 lg:grid-cols-3 gap-3 mt-6">
              {/* Gross Earnings */}
              <div className="bg-[#ECF5FE] border border-[#EEF2F8] p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-[#8C959F] uppercase tracking-wider block">
                  Total Order Value
                </span>
                <p className="text-2xl font-semibold text-[#141D23] mt-1.5 leading-none">
                  {revenueAnalytics.grossEarnings}
                </p>
                {revenueAnalytics.grossEarningsGrowth && (
                  <span className="text-xs text-[#15803D] font-bold mt-1.5 flex items-center gap-0.5">
                    <span>▲</span>
                    <span>{revenueAnalytics.grossEarningsGrowth}</span>
                  </span>
                )}
              </div>

              {/* Agent Commission */}
              <div className="bg-[#ECF5FE] border border-[#EEF2F8] p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-[#5C5F60] uppercase tracking-wider block">
                  Agent Commission
                </span>
                <p className="text-2xl font-semibold text-[#141D23] mt-1.5 leading-none">
                  {revenueAnalytics.agentCommission}
                </p>
                {revenueAnalytics.agentCommissionRate && (
                  <span className="text-xs text-[#5C5F60]/60 font-medium mt-1.5 block leading-tight">
                    Standard rate applied:
                    {revenueAnalytics.agentCommissionRate}
                  </span>
                )}
              </div>

              {/* Net Payout */}
              <div className="bg-[#FFD1DC]/10 border border-[#FFD1DC]/30 p-3.5 rounded-xl">
                <span className="text-xs font-bold text-[#78555E] uppercase tracking-wider block">
                  Net Payout
                </span>
                <p className="text-2xl font-semibold text-[#78555E] mt-1.5 leading-none">
                  {revenueAnalytics.netPayout}
                </p>
                {revenueAnalytics.netPayoutDate && (
                  <span className="text-xs text-[#78555E]/70 font-bold mt-1.5 block leading-tight">
                    Scheduled for {revenueAnalytics.netPayoutDate}
                  </span>
                )}
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
                <path d={chartAreaPath} fill="url(#chartGrad)" />

                {/* Line Path */}
                <path
                  d={chartLinePath}
                  fill="none"
                  stroke="#704154"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data point dots */}
                {chartPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="#D24D77" />
                ))}
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-1 text-[9px] font-bold text-[#8C959F]">
              {chartData.map((p) => (
                <span key={p.day}>{p.day}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Batch Recommendations */}
      <div className="bg-white rounded-2xl border border-[#E8DFE1] p-4 lg:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex gap-5">
        {/* Sparkle icon wrapper */}
        <div className="h-15 w-15 shrink-0 hidden md:block">
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
            "Coming soon"
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
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
      <div className="bg-white rounded-2xl border border-[#D3C3C5] shadow-[0_4px_24px_rgba(0,0,0,0.01)] overflow-hidden relative">
        {/* Table Header */}
        <div className="p-6 border-b border-[#D3C3C5] flex flex-wrap justify-between items-center gap-4">
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
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#D3C3C5] hover:bg-slate-50 rounded-sm text-[13px] font-semibold text-[#141D23] transition duration-200 cursor-pointer">
              <img src={filtericon} alt="Filter" className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#D3C3C5] hover:bg-slate-50 rounded-sm text-[13px] font-semibold text-[#141D23] transition duration-200 cursor-pointer">
              <img src={exporticon} alt="Export" className="h-3.5 w-3.5" />

              <span>Export</span>
            </button>
            <button className="bg-[#FFD1DC] hover:bg-[#FFD4E1] text-[#7A5761] font-normal px-4 py-2 rounded-xl text-[13px] transition duration-200 cursor-pointer">
              See All
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#D3C3C5] text-[13px] uppercase font-semibold text-[#5C5F60] bg-[#DBE4ED]/30">
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Customer Risk</th>
                <th className="px-4 py-4">Size</th>
                <th className="px-4 py-4">Color</th>
                <th className="px-4 py-4">Weight</th>
                <th className="px-4 py-4">Coupon Bucket</th>
                <th className="px-4 py-4 text-right">Price</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F6] font-bold">
              {pagedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition">
                  {/* Product block */}
                  <td className="px-4 py-4 min-w-[240px]">
                    <div className="flex items-center gap-3">
                      {/* Product image thumbnail */}
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                        {order.image ? (
                          <img
                            src={order.image}
                            alt={order.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400">
                            No image
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold text-[#141D23] block leading-tight truncate max-w-[220px]"
                          title={order.productName}
                        >
                          {order.productName}
                        </p>
                        <p className="text-xs font-normal text-[#5C5F60] block mt-0.5">
                          {order.sku}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Customer Risk Badge */}
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#141D23] block leading-tight">
                        {order.customerName}
                      </p>
                      <div className="flex items-center gap-1">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            order.customerRisk === "Trusted"
                              ? "bg-[#15803D]"
                              : order.customerRisk === "New Customer"
                                ? "bg-[#A16207]"
                                : "bg-[#B91C1C]"
                          }`}
                        ></span>
                        <p
                          className={`text-[9px] font-bold block mt-0.5 uppercase tracking-wide ${
                            order.customerRisk === "Trusted"
                              ? "text-[#15803D]"
                              : order.customerRisk === "New Customer"
                                ? "text-[#A16207]"
                                : "text-[#B91C1C]"
                          }`}
                        >
                          {order.customerRisk}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Size */}
                  <td className="px-4 py-4 text-sm font-normal text-[#141D23]">
                    {order.size}
                  </td>

                  {/* Color */}
                  <td className="px-4 py-4 text-sm font-normal text-[#141D23]">
                    {order.color}
                  </td>

                  {/* Weight */}
                  <td className="px-4 py-4 text-sm font-normal text-[#141D23]">
                    {order.weight}
                  </td>

                  {/* Coupon Bucket */}
                  <td className="px-4 py-4">
                    <span className="bg-[#E1E3E4] px-2.5 py-1 rounded-sm text-sm font-normal uppercase text-[#626566] tracking-wider">
                      {order.couponBucket}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 text-right text-[#141D23] font-semibold text-sm">
                    {order.price}
                  </td>

                  {/* Actions column */}
                  <td className="px-4 py-4 text-center">
                    <button className="p-1 rounded hover:bg-slate-100 text-[#8C959F] hover:text-[#17222B] transition">
                      <img src={dotmenu} alt="Options" className="h-5 w-5" />
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
            Showing{" "}
            {totalOrders === 0 ? 0 : (ordersPage - 1) * ORDERS_PAGE_SIZE + 1}-
            {Math.min(ordersPage * ORDERS_PAGE_SIZE, totalOrders)} of{" "}
            {totalOrders} pending reviews
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
              disabled={ordersPage === 1}
              className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition disabled:opacity-40 disabled:pointer-events-none"
            >
              ‹
            </button>
            {Array.from({ length: totalOrderPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setOrdersPage(i + 1)}
                className={
                  ordersPage === i + 1
                    ? "h-8 w-8 rounded-lg bg-[#FFE8EF] text-[#D24D77] border border-[#FFE8EF] flex items-center justify-center font-extrabold text-xs transition"
                    : "h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition"
                }
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setOrdersPage((p) => Math.min(totalOrderPages, p + 1))
              }
              disabled={ordersPage === totalOrderPages}
              className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition disabled:opacity-40 disabled:pointer-events-none"
            >
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
