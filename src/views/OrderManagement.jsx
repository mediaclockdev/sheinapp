import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import SuccessToast from "../components/common/SuccessToast";
import editicon from "../assets/editicon.svg";
import exporticon from "../assets/exporticon.svg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";
import { getInitials } from "../lib/format";
import useOrderDetails from "../components/orders/useOrderDetails";
import OrderDetailsPanel from "../components/orders/OrderDetailsPanel";
import apiClient, { getErrorMessage } from "../lib/api/client";
import { ENDPOINTS } from "../lib/api/endpoints";

const mapOrder = (order) => {
  const customerName =
    order.customer?.fullName ||
    order.customer?.name ||
    order.customerName ||
    "Unknown";

  return {
    id: order.orderId || order._id || order.id || "#SHP-0000",
    customer: customerName,
    initials: getInitials(customerName),
    items: Array.isArray(order.items)
      ? order.items.length
      : Array.isArray(order.products)
        ? order.products.length
        : Number(
            order._count?.items ??
              order.itemsCount ??
              order.itemCount ??
              order.items ??
              0,
          ) || 0,
    status: (order.status || "SUBMITTED").toUpperCase(),
    date: order.createdAt || order.orderDate || order.date || null,
    raw: order,
  };
};

const fmtDate = (d) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : null;

const fmtDisplayDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d)
    ? d.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
};

const OrderManagement = () => {
  const [status, setStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const today = new Date();

  const [dateRange, setDateRange] = useState([null, null]);

  const [startDate, endDate] = dateRange;

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [totalRows, setTotalRows] = useState(0);

  // Debounce search typing, and reset to page 1 whenever any filter changes
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [search, status, startDate, endDate]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      if (search) params.set("search", search);
      if (status !== "All") params.set("status", status.toUpperCase());
      if (startDate) params.set("startDate", fmtDate(startDate));
      if (endDate) params.set("endDate", fmtDate(endDate));

      const { data: result } = await apiClient.get(
        `${ENDPOINTS.orders.list}?${params.toString()}`,
      );

      const list = result.data || result.orders || result || [];
      const mapped = Array.isArray(list) ? list.map(mapOrder) : [];
      console.log("Orders fetched:", list, "Mapped:", mapped);
      setOrders(mapped);
      setTotalRows(
        Number(
          result.total ??
            result.totalCount ??
            result.pagination?.total ??
            result.meta?.total ??
            mapped.length,
        ),
      );
    } catch (err) {
      setOrdersError(getErrorMessage(err, "Failed to fetch orders"));
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    search,
    status,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const [successMessage, setSuccessMessage] = useState(null);
  const detail = useOrderDetails({
    onUpdated: fetchOrders,
    onSuccess: setSuccessMessage,
  });
  const handleViewOrder = detail.openOrder;

  const getStatusClass = (s) => {
    switch (s) {
      case "WAITING":
        return "bg-[#FEF3C9] text-[#000000]";
      case "REJECTED":
        return "bg-[#FA8072] text-[#420D09]";
      case "APPROVED":
        return "bg-[#DBEAFE] text-[#1E40AF]";
      default:
        return "bg-[#DBEAFE] text-[#1E40AF]";
    }
  };

  const handleExportCSV = async () => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.raw?.id ?? row.original.id);
    if (!selectedIds.length) return;
    try {
      const { data: blob } = await apiClient.get(
        `${ENDPOINTS.orders.export}?ids=${selectedIds.join(",")}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export orders:", err);
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
            className="accent-[#7A5C69] h-4 w-4 align-middle cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-[#7A5C69] h-4 w-4 align-middle cursor-pointer"
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
            <p className="font-normal  ">
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
          <div className="flex items-center justify-center gap-2">
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
        accessorKey: "date",
        header: "DATE",
        cell: ({ getValue }) => (
          <span className="text-sm text-[#444]">
            {fmtDisplayDate(getValue())}
          </span>
        ),
      },
      {
        id: "action",
        header: "ACTION",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            {/* <button
              onClick={() =>
                handleViewOrder(row.original.raw?.id ?? row.original.id)
              }
              title="View Details"
              className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center hover:bg-[#F9F5F6] cursor-pointer"
            >
              <Eye size={16} className="text-[#7A5C69] " />
            </button> */}
            <button
              onClick={() =>
                handleViewOrder(row.original.raw?.id ?? row.original.id, {
                  moderate: true,
                })
              }
              title="Approve / Reject"
              className="w-15 h-9 border border-[#D6C5CC] rounded flex items-center justify-center cursor-pointer py-1 px-2 text-sm  text-black font-medium"
            >
              Open
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  // ── TanStack Table instance ────────────────────────────────────────
  const table = useReactTable({
    data: orders,
    columns,
    state: { rowSelection, pagination },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: totalRows,
    getCoreRowModel: getCoreRowModel(),
  });

  // Pagination helpers
  const { pageIndex, pageSize } = table.getState().pagination;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();
  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/20 min-h-[calc(100vh-70px)] space-y-6">
      <SuccessToast
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        <div>
          {/* <h1 className="text-2xl lg:text-[32px] font-bold text-[#17222B] tracking-tight">
            Order Management
          </h1> */}
          <p className="text-sm lg:text-xl text-[#5C5F60]/80 mt-1 font-semibold">
            Review and Approve Customers Order
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!selectedCount}
          className="w-[40%] lg:w-[15%] bg-[#FFFFFF]/2 hover:bg-[#FFFFFF]/50 text-[#5C5F60] border border-[#D3C3C5] font-normal px-5 py-2.5 rounded-xl whitespace-nowrap text-sm lg:text-base cursor-pointer transition duration-200 shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src={exporticon} alt="export csv icon" className="h-4 w-4" />
          <span>Export CSV{selectedCount ? ` (${selectedCount})` : ""}</span>
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
                className="h-11 w-full sm:w-auto pl-4 pr-10 bg-[#ECF5FE] rounded-md border border-black/20 cursor-pointer outline-none text-[#141D23] text-base font-normal min-w-[120px] appearance-none bg-no-repeat bg-[right_0.75rem_center]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235C5F60' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                }}
              >
                <option>All</option>
                <option>Approved</option>
                <option>Waiting</option>
                <option>Rejected</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="w-full sm:w-auto flex gap-2">
              <div className="w-full sm:w-auto">
                <p className="text-[10px] font-bold uppercase text-[#5C5F60] mb-1">
                  Start Date
                </p>
                <div className="flex items-center gap-2 border border-black/20 bg-[#ECF5FE] px-3 py-1.5 w-full sm:w-[130px] rounded-md">
                  <Calendar className="text-[#5C5F60] shrink-0" size={18} />
                  <DatePicker
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    selected={startDate}
                    onChange={(date) => setDateRange([date, endDate])}
                    maxDate={endDate || today}
                    isClearable
                    placeholderText="Start date"
                    dateFormat="MMM d"
                    className="focus:outline-none text-base font-normal bg-transparent w-full relative z-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <p className="text-[10px] font-bold uppercase text-[#5C5F60] mb-1">
                  End Date
                </p>
                <div className="flex items-center gap-2 border border-black/20 bg-[#ECF5FE] px-3 py-1.5 w-full sm:w-[130px] rounded-md">
                  <Calendar className="text-[#5C5F60] shrink-0" size={18} />
                  <DatePicker
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    selected={endDate}
                    onChange={(date) => setDateRange([startDate, date])}
                    minDate={startDate}
                    maxDate={today}
                    isClearable
                    placeholderText="End date"
                    dateFormat="MMM d"
                    className="focus:outline-none text-base font-normal bg-transparent w-full relative z-10"
                  />
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="w-full lg:w-[280px]">
              <p className="text-[10px] font-bold uppercase text-[#5C5F60] mb-1">
                Search
              </p>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by customer or order ID"
                className="h-11 w-full px-4 bg-[#ECF5FE] rounded-md border border-black/20 outline-none text-[#141D23] text-base font-normal placeholder:text-[#5C5F60]/60"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <span className="text-[#5C5F60] font-normal text-base">
              {totalRows} Orders
            </span>

            <button
              onClick={() => {
                setStatus("All");
                setDateRange([null, null]);
                setSearchInput("");
                setRowSelection({});
              }}
              disabled={ordersLoading}
              className="text-[#8B6575] hover:rotate-180 transition-transform duration-300 disabled:opacity-50"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {ordersError && (
        <div className="bg-red-50 border border-red-300 text-red-600 text-sm font-medium rounded-md px-4 py-3">
          {ordersError}
        </div>
      )}

      {/* main content */}
      <div className="flex flex-col lg:flex-row gap-5 ">
        {/* ── NEW TABLE — TanStack React Table with Pagination ──────── */}
        <div
          className={`bg-white border border-[#D8D8D8] rounded-lg overflow-hidden w-full flex flex-col transition-all ${
            detail.orderId ? "lg:w-[60%]" : "lg:w-full"
          }`}
        >
          {/* Desktop view */}
          <div className="hidden lg:block flex-1 overflow-y-auto">
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
                        className={`py-4 text-xs lg:text-sm font-bold text-[#666] text-center ${
                          header.column.id === "select" ? "w-12 px-3" : "px-3"
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
                {ordersLoading && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-sm text-[#8C959F]"
                    >
                      Loading orders...
                    </td>
                  </tr>
                )}
                {!ordersLoading && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-sm text-[#8C959F]"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
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
                        className={`py-4 text-center ${
                          cell.column.id === "select" ? "px-3" : ""
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

          {/* Mobile/Tablet Card view */}
          <div className="lg:hidden flex-1 overflow-y-auto p-4 space-y-3">
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

            {table.getRowModel().rows.map((row) => {
              const rowId = row.original.raw?.id ?? row.original.id;
              const isSelected = detail.orderId === rowId;
              return (
                <div key={row.id} className="space-y-3">
                  <div
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

                    {/* Date */}
                    <p className="text-[11px] text-[#5C5F60]">
                      {fmtDisplayDate(row.original.date)}
                    </p>

                    {/* Action */}
                    <div className="flex justify-end gap-2 pt-1 border-t border-[#ECECEC]/50">
                      {/* <button
                        onClick={() =>
                          handleViewOrder(
                            row.original.raw?.id ?? row.original.id,
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5CC] rounded-lg text-xs font-bold text-[#7A5C69] hover:bg-[#F9F5F6] transition"
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button> */}
                      <button
                        onClick={() =>
                          handleViewOrder(
                            row.original.raw?.id ?? row.original.id,
                            {
                              moderate: true,
                            },
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5CC] rounded-lg text-xs font-bold text-[#7A5C69] hover:bg-[#F9F5F6] transition"
                      >
                        {/* <img
                          src={editicon}
                          alt="edit icon"
                          className="size-3.5"
                        /> */}
                        <span>open</span>
                      </button>
                    </div>
                  </div>
                  {isSelected && <OrderDetailsPanel d={detail} isMobile />}
                </div>
              );
            })}
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

              {(() => {
                const pages = [];
                const maxVisible = 5;
                let start = Math.max(0, pageIndex - Math.floor(maxVisible / 2));
                let end = Math.min(pageCount, start + maxVisible);
                if (end - start < maxVisible)
                  start = Math.max(0, end - maxVisible);

                if (start > 0) {
                  pages.push(0);
                  if (start > 1) pages.push("...");
                }
                for (let i = start; i < end; i++) pages.push(i);
                if (end < pageCount) {
                  if (end < pageCount - 1) pages.push("...");
                  pages.push(pageCount - 1);
                }

                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="h-8 w-8 flex items-center justify-center text-xs text-[#5c5f60] hidden sm:flex"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => table.setPageIndex(p)}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center font-extrabold text-xs transition hidden sm:flex ${
                        pageIndex === p
                          ? "bg-[#FFE8EF] text-[#D24D77] border-[#FFE8EF]"
                          : "border-[#E8DFE1] text-[#5c5f60] hover:bg-slate-100"
                      }`}
                    >
                      {p + 1}
                    </button>
                  ),
                );
              })()}

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
        <OrderDetailsPanel d={detail} />
      </div>
    </div>
  );
};

export default OrderManagement;
