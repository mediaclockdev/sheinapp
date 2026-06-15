import React, { useState, useMemo } from "react";
import { Calendar, RotateCcw, Eye, Trash2, Plus, Minus } from "lucide-react";
import exporticon from "../assets/exporticon.svg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import star from "../assets/ratingstar.svg";
import customermessage from "../assets/customermessage.svg";
import product1 from "../assets/Product1.svg";
import product2 from "../assets/Product2.svg";
import product3 from "../assets/Product3.svg";
import product4 from "../assets/Product4.svg";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

const OrderManagement = () => {
  const [status, setStatus] = useState("Submitted");
  const [rowSelection, setRowSelection] = useState({});
  const today = new Date();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [dateRange, setDateRange] = useState([sevenDaysAgo, today]);

  const [startDate, endDate] = dateRange;

  // ── Order data (84 rows for pagination) ────────────────────────────
  const orders = useMemo(() => {
    const customerPool = [
      { name: "Alice L.", initials: "AL" },
      { name: "Bob M.", initials: "BM" },
      { name: "User 3", initials: "U3" },
      { name: "User 4", initials: "U4" },
      { name: "User 5", initials: "U5" },
      { name: "User 6", initials: "U6" },
      { name: "User 7", initials: "U7" },
      { name: "User 8", initials: "U8" },
      { name: "User 9", initials: "U9" },
      { name: "User 10", initials: "U10" },
      { name: "User 11", initials: "U11" },
      { name: "User 12", initials: "U12" },
      { name: "User 13", initials: "U13" },
      { name: "User 14", initials: "U14" },
    ];
    const statusPool = [
      "WAITING",
      "PURCHASED",
      "SUBMITTED",
      "SUBMITTED",
      "SUBMITTED",
    ];
    const itemPool = [12, 4, 14, 2, 13, 16, 2, 19, 8, 7, 10, 5, 17, 10, 7, 12];

    return Array.from({ length: 84 }, (_, i) => ({
      id: `#SHP-${92831 + i}`,
      customer: customerPool[i % customerPool.length].name,
      initials: customerPool[i % customerPool.length].initials,
      items: itemPool[i % itemPool.length],
      status: statusPool[i % statusPool.length],
    }));
  }, []);

  const getStatusClass = (s) => {
    switch (s) {
      case "WAITING":
        return "bg-[#FFF2D8] text-[#B36B00]";
      case "PURCHASED":
        return "bg-[#DDF8E8] text-[#14804A]";
      default:
        return "bg-[#E7EEFF] text-[#1D4ED8]";
    }
  };

  // ── TanStack Table – column definitions ────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table: tbl }) => (
          <input
            type="checkbox"
            checked={tbl.getIsAllPageRowsSelected()}
            onChange={tbl.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-[#7A5C69]"
          />
        ),
      },
      {
        accessorKey: "id",
        header: "ORDER ID",
        cell: ({ getValue }) => {
          const val = getValue();
          const parts = val.split("-");
          return (
            <p className="font-semibold text-[#2D2D2D] leading-5">
              {parts[0]}-
              <br />
              {parts[1]}
            </p>
          );
        },
      },
      {
        accessorKey: "customer",
        header: "CUSTOMER",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#D9DEE7] flex items-center justify-center text-[9px] font-semibold text-[#4B5563]">
              {row.original.initials}
            </div>
            <span className="text-sm text-[#333]">{row.original.customer}</span>
          </div>
        ),
      },
      {
        accessorKey: "items",
        header: "ITEMS",
        cell: ({ getValue }) => (
          <span className="text-sm text-[#444]">{getValue()} items</span>
        ),
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ getValue }) => (
          <span
            className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusClass(getValue())}`}
          >
            {getValue()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "ACTIONS",
        cell: () => (
          <button className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center mx-auto hover:bg-[#F9F5F6]">
            <Eye size={16} className="text-[#7A5C69]" />
          </button>
        ),
      },
    ],
    [],
  );

  // ── TanStack Table instance ────────────────────────────────────────
  const table = useReactTable({
    data: orders,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  // Pagination helpers
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = orders.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  const products = [
    {
      name: "Floral Print Dress",
      sku: "SKU: SH-9283-01",
      size: "S",
      Color: "Sage",
      price: "$14.00",
      icon: product1,
    },
    {
      name: "Satin Cami Top",
      sku: "SKU: SH-9283-02",
      size: "M",
      Color: "Cream",
      price: "$22.00",
      icon: product2,
    },
    {
      name: "Cotton Crew Neck T-Shirt",
      sku: "SKU: SH-9283-03",
      size: "L",
      Color: "White",
      price: "$18.00",
      icon: product3,
    },
    {
      name: "Denim Jeans",
      sku: "SKU: SH-9283-04",
      size: "26",
      Color: "Blue",
      price: "$32.00",
      icon: product4,
    },
  ];
  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/20 min-h-[calc(100vh-70px)] space-y-6">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        <div>
          <h1 className="text-2xl lg:text-[32px] font-bold text-[#17222B] tracking-tight">
            Order Management
          </h1>
          <p className="text-sm lg:text-base text-[#5C5F60]/80 mt-1 font-semibold">
            Review and approve customer link submissions.
          </p>
        </div>
        <button className="w-[40%] lg:w-[15%] bg-[#FFFFFF]/2 hover:bg-[#FFFFFF]/50 text-[#5C5F60] border border-[#D3C3C5] font-normal px-5 py-2.5 rounded-xl whitespace-nowrap text-sm lg:text-base cursor-pointer transition duration-200 shadow-sm flex items-center gap-1.5">
          <img src={exporticon} alt="export csv icon" className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* status */}
      <div className="w-full bg-[#F8F5F7] border border-[#D9D4D7] rounded-lg px-5 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Side */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 w-full sm:w-auto">
            {/* Status */}
            <div className="w-full sm:w-auto">
              <p className="text-[10px] font-bold uppercase text-[#5C5F60] mb-1">
                Status
              </p>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full sm:w-auto px-4 bg-[#ECF5FE] rounded-md border-none outline-none text-[#141D23] text-base font-normal min-w-[120px]"
              >
                <option>Submitted</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="w-full sm:w-auto">
              <p className="text-[10px] font-bold uppercase text-[#5C5F60] mb-1">
                Date Range
              </p>
              <div className="flex items-center gap-2 bg-[#ECF5FE] px-3 py-1.5 w-full sm:w-[220px] rounded-md">
                <Calendar className="text-[#5C5F60] shrink-0" size={18} />
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  dateFormat="MMM d"
                  className="focus:outline-none text-base font-normal bg-transparent w-full"
                />
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <span className="text-[#5C5F60] font-normal text-base">
              {orders.length} Orders
            </span>

            <button className="text-[#8B6575] hover:rotate-180 transition-transform duration-300">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* main content */}
      <div className="flex flex-col lg:flex-row gap-5 ">
        {/* ============================================================ OLD
        HAND-BUILT TABLE (COMMENTED OUT) Replaced with TanStack React Table
        below for proper pagination, row selection, and scalable data handling.
        Original code preserved here for reference.
        ================================================================ */}
        {/* <div className="bg-white border border-[#D8D8D8] rounded-lg overflow-hidden w-full lg:w-[60%]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6] border-b border-[#D8D8D8]">
                <th className="w-12 px-3 py-4">
                  <input type="checkbox" />
                </th>
                <th className="text-left text-xs font-semibold text-[#666] py-4">
                  ORDER ID
                </th>
                <th className="text-left text-xs font-semibold text-[#666] py-4">
                  CUSTOMER
                </th>
                <th className="text-left text-xs font-semibold text-[#666] py-4">
                  ITEMS
                </th>
                <th className="text-left text-xs font-semibold text-[#666] py-4">
                  STATUS
                </th>
                <th className="text-center text-xs font-semibold text-[#666] py-4">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className="border-b border-[#ECECEC] hover:bg-gray-50"
                >
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      defaultChecked={index === 1}
                      className="accent-[#7A5C69]"
                    />
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-[#2D2D2D] leading-5">
                      {order.id.split("-")[0]}-
                      <br />
                      {order.id.split("-")[1]}
                    </p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#D9DEE7] flex items-center justify-center text-[9px] font-semibold text-[#4B5563]">
                        {order.initials}
                      </div>
                      <span className="text-sm text-[#333]">
                        {order.customer}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-[#444]">
                    {order.items} items
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusClass(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <button className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center mx-auto hover:bg-[#F9F5F6]">
                      <Eye size={16} className="text-[#7A5C69]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}

        {/* ── NEW TABLE — TanStack React Table with Pagination ──────── */}
        <div className="bg-white border border-[#D8D8D8] rounded-lg overflow-hidden w-full lg:w-[60%] flex flex-col">
          {/* Desktop/Tablet view */}
          <div className="hidden md:block flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="bg-[#F3F4F6] border-b border-[#D8D8D8]"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`py-4 text-xs font-semibold text-[#666] ${
                          header.column.id === "select"
                            ? "w-12 px-3"
                            : header.column.id === "actions"
                              ? "text-center px-3"
                              : "text-left"
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[#ECECEC] hover:bg-gray-50 transition ${
                      row.getIsSelected() ? "bg-[#FFF8FA]" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`py-4 ${
                          cell.column.id === "select"
                            ? "px-3"
                            : cell.column.id === "actions"
                              ? "text-center"
                              : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card view */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC]">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#5C5F60] cursor-pointer">
                <input
                  type="checkbox"
                  checked={table.getIsAllPageRowsSelected()}
                  onChange={table.getToggleAllPageRowsSelectedHandler()}
                  className="accent-[#7A5C69] h-4 w-4"
                />
                Select All on Page
              </label>
            </div>

            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className={`p-4 rounded-xl border border-[#ECECEC] space-y-3 bg-white hover:bg-gray-50 transition relative ${
                  row.getIsSelected() ? "bg-[#FFF8FA] border-[#FFD1DC]" : ""
                }`}
              >
                {/* Header: Select checkbox + Order ID + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                      className="accent-[#7A5C69] h-4 w-4"
                    />
                    <span className="font-extrabold text-[#2D2D2D] text-sm">
                      {row.original.id}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusClass(row.original.status)}`}
                  >
                    {row.original.status}
                  </span>
                </div>

                {/* Body: Customer & Items */}
                <div className="flex items-center justify-between text-xs text-[#5C5F60]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#D9DEE7] flex items-center justify-center text-[8px] font-semibold text-[#4B5563]">
                      {row.original.initials}
                    </div>
                    <span className="font-bold text-[#333]">
                      {row.original.customer}
                    </span>
                  </div>
                  <span className="font-medium bg-[#ECF5FE] text-[#1D4ED8] px-2 py-0.5 rounded-md">
                    {row.original.items} items
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-1 border-t border-[#ECECEC]/50">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5CC] rounded-lg text-xs font-bold text-[#7A5C69] hover:bg-[#F9F5F6] transition">
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-[#ECECEC] bg-[#FBF7F8] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8C959F]">
              {startRow}-{endRow} of {totalRows}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>

              <span className="text-xs font-semibold text-[#8C959F] sm:hidden mx-1">
                Page {pageIndex + 1} of {pageCount}
              </span>

              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center font-extrabold text-xs transition hidden sm:flex ${
                    pageIndex === i
                      ? "bg-[#FFE8EF] text-[#D24D77] border-[#FFE8EF]"
                      : "border-[#E8DFE1] text-[#5c5f60] hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        </div>
        {/* order details */}
        <div className="w-full lg:w-[40%] border border-[#D3C3C5] rounded-lg">
          <div className="px-4 py-4 flex flex-col gap-1 bg-[#ECF5FE] border-b border-b-[#D3C3C5]">
            <p className="text-[#141D23] font-normal  text-lg ">
              Order Details
            </p>
            <div className="flex items-center gap-3">
              <p className="text-[#78555E] font-bold text-xs">#SHP-92832</p>
              <p className="text-[#5C5F60] font-bold text-xs">4 ITEMS</p>
            </div>
          </div>
          {/* customer context */}
          <div className="p-4 ">
            <p className="text-[#5C5F60] font-bold text-xs mb-2">
              CUSTOMER CONTEXT
            </p>
            <div className="bg-[#ECF5FE] p-4 border border-[#D3C3C5]/30 rounded-lg space-y-2">
              <div className="flex justify-between">
                <p className="text-[#141D23] text-base font-bold">Bob Miller</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <img src={star} alt="star" />
                    <p className="text-[#141D23] font-bold text-xs">4.5/5.0</p>
                  </div>
                  <p className="text-[#166534] font-bold text-xs bg-[#DCFCE7] rounded-xs px-1.5 py-0.5">
                    HIGHLY TRUSTED
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[#5C5F60] font-normal text-xs">
                  Shipping: 742 Evergreen Terrace, Springfield, OR
                </p>
                <p className="text-[#5C5F60] font-normal text-xs">
                  Phone: +1 555-0123
                </p>
              </div>
            </div>
          </div>

          {/* customer message */}
          <div className="p-4">
            <p className="text-[#5C5F60] font-bold text-xs mb-2">
              CUSTOMER MESSAGE
            </p>
            <div className="bg-[#FFD1DC]/10 p-4 rounded-lg border border-[#FFD1DC]/30 flex items-center gap-2">
              <img src={customermessage} alt="customer message icon" />
              <p className="text-[#4F4446] font-medium text-xs">
                "Please make sure to check the size guide for the denim skirt."
              </p>
            </div>
          </div>

          {/* product */}
          <div className="p-4">
            <p className="text-[#5C5F60] text-xs font-bold mb-2">
              PRODUCTS ({products.length})
            </p>

            <div className="space-y-4">
              {products.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[#D3C3C5] rounded-xl bg-white p-4"
                >
                  <div className="flex justify-between items-start">
                    {/* Left Side */}
                    <div className="flex gap-4">
                      <div className="w-20 h-20 border border-[#D3C3C5] rounded-md overflow-hidden">
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="font-bold text-sm text-[#141D23]">
                          {item.name}
                        </p>

                        <p className="text-[#5C5F60] text-xs font-normal">
                          {item.sku}
                        </p>

                        <div className="flex gap-4 text-[#5C5F60] text-xs font-normal">
                          <span>Size: {item.size}</span>
                          <span>Color: {item.Color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-end justify-between h-20">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-xs text-[#78555E]">
                          {item.price}
                        </p>

                        <button>
                          <Trash2 size={16} className="text-[#5C5F60]" />
                        </button>
                      </div>

                      <div className="flex items-center border border-[#D6DCE5] rounded bg-[#EEF2F8] overflow-hidden">
                        <button className="px-3 py-1 text-[#845F68]">
                          <Minus size={14} />
                        </button>

                        <span className="px-4 font-bold text-[10px] text-[#141D23]">
                          1
                        </span>

                        <button className="px-3 py-1 text-[#845F68]">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* retail price */}
          <div className="border-t border-[#E5D6D8]">
            {/* Pricing Section */}
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-[#141D23]">
                  Retail Price
                </h3>
                <span className="text-base font-bold text-[#141D23]">
                  $86.00
                </span>
              </div>

              <div className="flex justify-between items-center mt-6">
                <span className="text-[#5C5F60] text-sm">Promotions</span>
                <span className="text-[#BA1A1A] text-sm">-$5.08</span>
              </div>

              {/* Exclude Promotion */}
              <div className="mt-4 bg-[#EEF2F8] border border-[#D8DEE8] rounded-md px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#CBB5BB]"
                  />
                  <span className="text-[#5C5F60]">Exclude Promotion</span>
                </div>

                <span className="text-[#8A6A72] text-lg">ⓘ</span>
              </div>

              <div className="flex justify-between items-center mt-5">
                <span className="text-[#5C5F60] text-base">
                  SHEIN CLUB Exclusive Discount
                </span>
                <span className="text-[#BA1A1A] text-base">-$0.20</span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#5C5F60] text-base">Coupon</span>

                  <span className="bg-[#FFDAD6] text-[#BA1A1A] text-sm px-2 py-0.5 rounded">
                    05:03:09
                  </span>
                </div>

                <span className="text-[#BA1A1A] text-base">-$0.18</span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-[#5C5F60] text-base">Shipping Fee</span>

                <span className="text-[#166534] font-semibold text-base">
                  FREE
                </span>
              </div>

              <div className="border-t border-[#E5E7EB] mt-5 pt-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[#141D23]">
                      Estimated Price
                    </h3>

                    <p className="text-sm text-[#5C5F60]">
                      Final price confirmed at checkout
                    </p>
                  </div>

                  <span className="text-xl font-bold text-[#78555E] leading-none">
                    $81.00
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-[#EEF2F8] border-t border-[#D8DEE8] p-5 flex gap-4">
              <button className="flex-1 h-14 rounded-xl bg-[#FFD1DC] text-[#78555E] font-medium shadow-md hover:opacity-90  cursor-pointer transition">
                ✓ Approve
              </button>

              <button className="flex-1 h-14 rounded-xl border border-[#D3C3C5] bg-[#FFFFFF] text-[#5C5F60] font-medium hover:bg-gray-50 cursor-pointer transition">
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
