import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar, RotateCcw, Eye, Plus, Minus, Trash2 } from "lucide-react";
import SuccessToast from "../components/common/SuccessToast";
import editicon from "../assets/editicon.svg";
import exporticon from "../assets/exporticon.svg";
import approve from "../assets/approveicon.svg";
import reject from "../assets/rejecticon.svg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import customermessage from "../assets/customermessage.svg";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const ORDERS_API_URL = `${API_BASE_URL}/api/orders`;
const ORDER_DETAIL_API_URL = `${API_BASE_URL}/api/orders`;
const SETTINGS_API_URL = `${API_BASE_URL}/api/settings`;

const imageUrl = (p) =>
  !p ? null : p.startsWith("http") ? p : `${API_BASE_URL}${p}`;

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "NA";

const formatAddress = (addr) => {
  if (typeof addr === "string") {
    try {
      addr = JSON.parse(addr);
    } catch {
      return addr; // plain text address
    }
  }
  if (!addr || typeof addr !== "object") return addr ?? "";
  return [addr.addressLine, addr.city, addr.state, addr.zipCode]
    .filter(Boolean)
    .join(", ");
};

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
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const params = new URLSearchParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      if (search) params.set("search", search);
      if (status !== "All") params.set("status", status.toUpperCase());
      if (startDate) params.set("startDate", fmtDate(startDate));
      if (endDate) params.set("endDate", fmtDate(endDate));

      const response = await fetch(`${ORDERS_API_URL}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch orders");

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
      setOrdersError(err.message);
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

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [canModerate, setCanModerate] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pricing settings (price per kg + discount tiers) loaded once from the API
  const [settings, setSettings] = useState({
    pricePerKg: 0,
    discountRules: [],
  });
  const [estimatedWeight, setEstimatedWeight] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(SETTINGS_API_URL, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ data }) =>
        setSettings({
          pricePerKg: Number(data?.pricePerKg) || 0,
          discountRules: data?.discountRules || [],
        }),
      )
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const handleViewOrder = async (id, { moderate = false } = {}) => {
    if (!id) return;
    setSelectedOrderId(id);
    setSelectedOrder(null);
    setEstimatedWeight("");
    setCanModerate(moderate);
    setStatusError(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${ORDER_DETAIL_API_URL}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch order details");

      const order = result.data || result;
      setSelectedOrder(order);
      if (order?.totalWeight != null && parseFloat(order.totalWeight) > 0) {
        setEstimatedWeight(String(order.totalWeight));
      } else if (
        order?.estimatedWeight != null &&
        parseFloat(order.estimatedWeight) > 0
      ) {
        setEstimatedWeight(String(order.estimatedWeight));
      } else {
        const items = order.items || [];
        const totalW = items.reduce(
          (sum, item) =>
            sum + (parseFloat(item.weight) || 0) * (Number(item.quantity) || 1),
          0,
        );
        setEstimatedWeight(String(totalW));
      }
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setDetailError(null);
    setCanModerate(false);
    setStatusError(null);
  };

  const recalculateOrderTotals = (items, serviceFee) => {
    const itemSubtotal = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    return { itemSubtotal, grandTotal: itemSubtotal + Number(serviceFee || 0) };
  };

  const handleItemQuantityChange = (itemId, delta) => {
    setSelectedOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, Number(item.quantity || 1) + delta),
            }
          : item,
      );
      return {
        ...prev,
        items,
        ...recalculateOrderTotals(items, prev.serviceFee),
      };
    });
  };

  const handleDeleteItem = (itemId) => {
    setSelectedOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((item) => item.id !== itemId);
      return {
        ...prev,
        items,
        ...recalculateOrderTotals(items, prev.serviceFee),
      };
    });
  };

  const handleSaveOrderEdits = async (token) => {
    const response = await fetch(`${ORDERS_API_URL}/${selectedOrderId}/edit`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        items: selectedOrder.items.map((item) => ({
          id: item.id,
          quantity: Number(item.quantity),
        })),
      }),
    });

    const rawText = await response.text();
    let result = {};
    try {
      result = rawText ? JSON.parse(rawText) : {};
    } catch {
      console.error("Non-JSON response from /edit:", rawText);
    }

    if (!response.ok) {
      console.error(
        "Save order edits failed",
        response.status,
        result,
        rawText,
      );
      throw new Error(
        result.message ||
          result.errors?.map((e) => e.message).join(", ") ||
          `Failed to save order edits (status ${response.status})`,
      );
    }
  };

  const handleUpdateOrderStatus = async (newStatus) => {
    if (!selectedOrderId) return;
    if (newStatus === "APPROVED" && !(parseFloat(estimatedWeight) > 0)) {
      setStatusError("Please enter the estimated weight before approving.");
      return;
    }
    setStatusUpdating(true);
    setStatusError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (newStatus === "APPROVED") {
        await handleSaveOrderEdits(token);
      }

      const response = await fetch(
        `${ORDERS_API_URL}/${selectedOrderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newStatus === "APPROVED"
              ? { estimatedWeight: parseFloat(estimatedWeight) }
              : {}),
          }),
        },
      );

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to update order status");

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              ...(newStatus === "APPROVED"
                ? { totalWeight: parseFloat(estimatedWeight) }
                : {}),
            }
          : prev,
      );
      setSuccessMessage(
        newStatus === "APPROVED"
          ? "Order approved successfully!"
          : "Order rejected successfully!",
      );
      fetchOrders();
      return true;
    } catch (err) {
      setStatusError(err.message);
      return false;
    } finally {
      setStatusUpdating(false);
    }
  };
  const handleRejectClick = async () => {
    if (statusUpdating) return;

    const confirmed = window.confirm(
      "Are you sure you want to reject the order?",
    );

    if (confirmed && (await handleUpdateOrderStatus("REJECTED"))) {
      closeOrderDetails();
    }
  };

  // Order summary pricing: shipping from weight × pricePerKg, discount from matched rule
  const weightKg = parseFloat(estimatedWeight) || 0;

  const itemSubtotal =
    (selectedOrder?.items || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0,
    ) ||
    Number(selectedOrder?.itemSubtotal) ||
    0;

  const shippingCost = canModerate
    ? weightKg * settings.pricePerKg
    : Number(selectedOrder?.shippingFee) ||
      Number(selectedOrder?.shippingCost) ||
      Number(selectedOrder?.shipping) ||
      weightKg * settings.pricePerKg;

  const baseAmount = canModerate
    ? itemSubtotal + shippingCost
    : Number(selectedOrder?.baseAmount) || itemSubtotal + shippingCost;

  // Highest tier whose minimum is reached — spending past the top tier's max
  // still earns that tier's discount
  const matchedRule = settings.discountRules
    .filter((r) => baseAmount >= Number(r.minOrderAmount))
    .sort((a, b) => Number(b.minOrderAmount) - Number(a.minOrderAmount))[0];

  const discountRate = canModerate
    ? Number(matchedRule?.discountRate) || 0
    : Number(selectedOrder?.discountPercentage) ||
      Number(selectedOrder?.discountRate) ||
      Number(matchedRule?.discountRate) ||
      0;

  const discountAmount = canModerate
    ? (baseAmount * discountRate) / 100
    : Number(selectedOrder?.discountAmount) ||
      (baseAmount * discountRate) / 100;

  const totalAmount = canModerate
    ? baseAmount - discountAmount
    : Number(selectedOrder?.grandTotal) ||
      Number(selectedOrder?.totalAmount) ||
      Number(selectedOrder?.total) ||
      baseAmount - discountAmount;

  const getStatusClass = (s) => {
    switch (s) {
      case "WAITING":
        return "bg-[#FEF3C7] text-[#F59E0B]";
      case "REJECTED":
        return "bg-[#FA8072] text-[#420D09]";
      default:
        "APPROVED";
        return "bg-[#DBEAFE] text-[#1E40AF]";
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
        accessorKey: "date",
        header: "DATE",
        cell: ({ getValue }) => (
          <span className="text-sm text-[#444]">
            {fmtDisplayDate(getValue())}
          </span>
        ),
      },
      {
        id: "actions",
        header: "ACTIONS",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() =>
                handleViewOrder(row.original.raw?.id ?? row.original.id)
              }
              title="View Details"
              className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center hover:bg-[#F9F5F6]"
            >
              <Eye size={16} className="text-[#7A5C69]" />
            </button>
            <button
              onClick={() =>
                handleViewOrder(row.original.raw?.id ?? row.original.id, {
                  moderate: true,
                })
              }
              title="Approve / Reject"
              className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center hover:bg-[#F9F5F6]"
            >
              <img src={editicon} alt="edit icon" className="size-3.5" />
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

  const orderItems = selectedOrder?.items || [];
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
            <div className="w-full sm:w-auto">
              <p className="text-[10px] font-bold uppercase text-[#5C5F60] mb-1">
                Date Range
              </p>
              <div className="flex items-center gap-2 border border-black/20 bg-[#ECF5FE] px-3 py-1.5 w-full sm:w-[220px] rounded-md">
                <Calendar className="text-[#5C5F60] shrink-0" size={18} />
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  maxDate={today}
                  isClearable
                  placeholderText="Select date range"
                  dateFormat="MMM d"
                  className="focus:outline-none text-base font-normal bg-transparent w-full"
                />
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
              onClick={fetchOrders}
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
            selectedOrderId ? "lg:w-[60%]" : "lg:w-full"
          }`}
        >
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

                {/* Date */}
                <p className="text-[11px] text-[#5C5F60]">
                  {fmtDisplayDate(row.original.date)}
                </p>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1 border-t border-[#ECECEC]/50">
                  <button
                    onClick={() =>
                      handleViewOrder(row.original.raw?.id ?? row.original.id)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5CC] rounded-lg text-xs font-bold text-[#7A5C69] hover:bg-[#F9F5F6] transition"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() =>
                      handleViewOrder(row.original.raw?.id ?? row.original.id, {
                        moderate: true,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5CC] rounded-lg text-xs font-bold text-[#7A5C69] hover:bg-[#F9F5F6] transition"
                  >
                    <img src={editicon} alt="edit icon" className="size-3.5" />
                    <span>Edit</span>
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
        {selectedOrderId && (
          <div className="w-full lg:w-[40%] border border-[#D3C3C5] rounded-lg">
            <div className="px-4 py-4 flex items-start justify-between gap-1 bg-[#ECF5FE] border-b border-b-[#D3C3C5]">
              <div className="flex flex-col gap-1">
                <p className="text-[#141D23] font-normal  text-lg ">
                  Order Details
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-[#78555E] font-bold text-xs">
                    {selectedOrder?.orderId || `#${selectedOrderId}`}
                  </p>
                  <p className="text-[#5C5F60] font-bold text-xs">
                    {orderItems.length} ITEMS
                  </p>
                </div>
              </div>
              <button
                onClick={closeOrderDetails}
                className="text-[#5C5F60] hover:text-[#141D23] text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {detailLoading && (
              <p className="p-4 text-sm text-[#8C959F]">
                Loading order details...
              </p>
            )}

            {detailError && (
              <p className="p-4 text-sm text-red-600">{detailError}</p>
            )}

            {!detailLoading && !detailError && selectedOrder && (
              <>
                {/* customer context */}
                <div className="p-4 ">
                  <p className="text-[#5C5F60] font-bold text-xs mb-2">
                    CUSTOMER CONTEXT
                  </p>
                  <div className="bg-[#ECF5FE] p-4 border border-[#D3C3C5]/30 rounded-lg space-y-2">
                    <p className="text-[#141D23] text-base font-bold">
                      {selectedOrder.customerName}
                    </p>
                    <div className="space-y-2">
                      <p className="text-[#5C5F60] font-normal text-xs">
                        Shipping: {formatAddress(selectedOrder.shippingAddress)}
                      </p>
                      <p className="text-[#5C5F60] font-normal text-xs">
                        Phone: {selectedOrder.customerPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* customer message */}
                {selectedOrder.customerMessage && (
                  <div className="p-4">
                    <p className="text-[#5C5F60] font-bold text-xs mb-2">
                      CUSTOMER MESSAGE
                    </p>
                    <div className="bg-[#FFD1DC]/10 p-4 rounded-lg border border-[#FFD1DC]/30 flex items-center gap-2">
                      <img src={customermessage} alt="customer message icon" />
                      <p className="text-[#4F4446] font-medium text-xs">
                        "{selectedOrder.customerMessage}"
                      </p>
                    </div>
                  </div>
                )}

                {/* product */}
                <div className="p-4">
                  <p className="text-[#5C5F60] text-xs font-bold mb-2">
                    PRODUCTS ({orderItems.length})
                  </p>

                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-[#D3C3C5] rounded-xl bg-white p-4"
                      >
                        <div className="flex justify-between items-start">
                          {/* Left Side */}
                          <div className="flex flex-1 min-w-0 gap-4 pr-4">
                            <div className="w-20 h-20 shrink-0 border border-[#D3C3C5] rounded-md overflow-hidden bg-[#F3F4F6] flex items-center justify-center">
                              {item.photoUrl ? (
                                <img
                                  src={imageUrl(item.photoUrl)}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] text-[#8C959F]">
                                  No image
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 flex-1 min-w-0">
                              <p
                                className="font-bold text-sm text-[#141D23] truncate"
                                title={item.productName}
                              >
                                {item.productName}
                              </p>

                              <p className="text-[#5C5F60] text-xs font-normal">
                                SKU: {item.skuCode}
                              </p>

                              <div className="flex gap-4 text-[#5C5F60] text-xs font-normal flex-wrap">
                                <span>Size: {item.size}</span>
                                <span>Color: {item.color}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side */}
                          <div className="flex flex-col items-end justify-between h-20 shrink-0">
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-xs text-[#78555E]">
                                ${Number(item.price).toFixed(2)}
                              </p>
                              {canModerate && (
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  title="Remove item"
                                >
                                  <Trash2
                                    size={16}
                                    className="text-[#5C5F60] hover:text-red-600"
                                  />
                                </button>
                              )}
                            </div>

                            {canModerate ? (
                              <div className="flex items-center border border-[#D6DCE5] rounded bg-[#EEF2F8] overflow-hidden">
                                <button
                                  onClick={() =>
                                    handleItemQuantityChange(item.id, -1)
                                  }
                                  className="px-2 py-1 text-[#845F68] hover:bg-[#E5E7EB]"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-3 font-bold text-[10px] text-[#141D23]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleItemQuantityChange(item.id, 1)
                                  }
                                  className="px-2 py-1 text-[#845F68] hover:bg-[#E5E7EB]"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="px-4 font-bold text-[10px] text-[#141D23] border border-[#D6DCE5] rounded bg-[#EEF2F8] py-1">
                                Qty: {item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-[#E5D6D8]">
                  <div className="p-6">
                    {/* Estimated Weight */}
                    <span className="text-[10px] font-bold text-[#98A2AB] uppercase tracking-wider block mb-2">
                      Total Estimated Weight
                    </span>
                    <div className="flex items-center justify-between bg-[#ECF5FE] border border-[#D9E4F2] rounded-xl px-4 py-3 mb-5">
                      <span className="text-base font-bold text-[#141D23]">
                        Estimated Weight
                      </span>
                      <div className="flex items-center gap-1.5">
                        {canModerate ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={estimatedWeight}
                            onChange={(e) => setEstimatedWeight(e.target.value)}
                            placeholder="0"
                            className="w-16 bg-white border border-[#D9E4F2] rounded px-2 py-1 text-right text-base font-bold text-[#78555E] outline-none"
                          />
                        ) : (
                          <span className="text-base font-bold text-[#78555E]">
                            {weightKg}
                          </span>
                        )}
                        <span className="text-base font-bold text-[#78555E]">
                          KG
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#141D23] mb-4">
                      Order Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5F60]">Item Subtotal</span>
                        <span className="text-[#141D23] font-semibold">
                          ${itemSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5F60]">Weight</span>
                        <span className="text-[#141D23] font-semibold">
                          {weightKg} KG
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5F60]">Shipping Rate</span>
                        <span className="text-[#141D23] font-semibold">
                          ${settings.pricePerKg.toFixed(2)}/Kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5F60]">Shipping Cost</span>
                        <span className="text-[#141D23] font-semibold">
                          ${shippingCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="border-t border-[#E5E7EB] pt-3 flex justify-between items-center">
                        <span className="text-[#141D23] font-bold">
                          Base Amount
                        </span>
                        <span className="text-[#141D23] font-bold">
                          ${baseAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5F60]">Discount Applied</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFE8EF] text-[#D24D77]">
                          {discountRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#5C5F60]">Discount Amount</span>
                        <span className="text-red-600 font-semibold">
                          -${discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl px-4 py-3 mt-4">
                      <span className="text-lg font-bold text-[#141D23]">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Footer Buttons */}
                  {canModerate && (
                    <div className="bg-[#EEF2F8] border-t border-[#D8DEE8] p-5 space-y-3">
                      {statusError && (
                        <p className="text-sm text-red-600">{statusError}</p>
                      )}
                      <div className="flex gap-4">
                        <button
                          type="button"
                          className="flex items-center gap-1 justify-center flex-1 h-14 rounded-xl bg-[#FFD1DC] text-[#78555E] font-medium shadow-md hover:opacity-90 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={async () => {
                            if (await handleUpdateOrderStatus("APPROVED"))
                              closeOrderDetails();
                          }}
                          disabled={statusUpdating}
                        >
                          <img src={approve} alt="" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          className="flex items-center justify-center gap-1 flex-1 h-14 rounded-xl border border-[#D3C3C5] bg-[#FFFFFF] text-[#5C5F60] font-medium hover:bg-gray-50 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleRejectClick}
                          disabled={statusUpdating}
                        >
                          <img src={reject} alt="" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
