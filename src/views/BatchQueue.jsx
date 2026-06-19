import { useState, useEffect, useCallback } from "react";
import { Move, Merge, Copy, Info, LockKeyhole, X } from "lucide-react";
import SuccessToast from "../components/common/SuccessToast";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const BATCHES_API_URL = `${API_BASE_URL}/api/batches`;
const APPROVED_ORDERS_API_URL = `${API_BASE_URL}/api/batches/approved-orders`;
const CREATE_BATCH_API_URL = `${API_BASE_URL}/api/batches`;
const MERGE_BATCH_API_URL = `${API_BASE_URL}/api/batches/merge`;
const moveOrdersApiUrl = (batchId) =>
  `${BATCHES_API_URL}/${batchId}/move-orders`;

const countOrderItems = (order) =>
  Array.isArray(order.items) ? order.items.length : Number(order.items) || 0;

const mapApprovedOrder = (order) => ({
  id: order.id,
  displayId: order.orderId || order.id,
  user: order.customerName || order.customer?.fullName || "Unknown",
  items: Number(
    order._count?.items ?? order.itemsCount ?? order.itemCount ?? 0,
  ) || countOrderItems(order),
  value: Number(order.grandTotal ?? order.value ?? 0),
});

const mapBatch = (batch) => {
  const orders = batch.orders || [];
  const users =
    batch.users ||
    orders.slice(0, 3).map((o) => o.user || o.customerName || "Unknown");

  const itemCount = Number.isFinite(batch.itemCount)
    ? batch.itemCount
    : orders.reduce((sum, o) => sum + countOrderItems(o), 0);

  return {
    id: batch.batchId || batch.id,
    itemCount,
    orderCount: Number.isFinite(batch.orderCount)
      ? batch.orderCount
      : orders.length,
    users,
    extraUsers: batch.extraUsers ?? Math.max(0, orders.length - users.length),
    status: batch.status || "pending",
    baseShipping: Number(batch.baseShipping ?? 0),
    totalWeight: Number(batch.totalWeight ?? 0),
    shippingThreshold: batch.shippingThreshold,
    shippingAddText: batch.shippingAddText,
    discount: batch.discount,
    savingsText: batch.savingsText,
    lockedBy: batch.lockedBy,
    orders,
  };
};

const STATIC_CHART_DATA = [
  { day: "MON", value: 40 },
  { day: "TUE", value: 50 },
  { day: "WED", value: 30 },
  { day: "THU", value: 45 },
  { day: "FRI", value: 70 },
];

export default function BatchQueue() {
  const [activeTab, setActiveTab] = useState("active");
  const [successMessage, setSuccessMessage] = useState(null);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [approvedOrdersLoading, setApprovedOrdersLoading] = useState(true);
  const [approvedOrdersError, setApprovedOrdersError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeBatches, setActiveBatches] = useState([]);
  const [activeBatchesLoading, setActiveBatchesLoading] = useState(true);
  const [activeBatchesError, setActiveBatchesError] = useState(null);
  const [lockedBatches, setLockedBatches] = useState([]);
  const [lockedBatchesLoading, setLockedBatchesLoading] = useState(true);
  const [lockedBatchesError, setLockedBatchesError] = useState(null);

  const fetchBatches = useCallback(async (status) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const response = await fetch(`${BATCHES_API_URL}?status=${status}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || `Failed to fetch ${status} batches`);

    const list = result.data || result.batches || result || [];
    return Array.isArray(list) ? list.map(mapBatch) : [];
  }, []);

  const fetchActiveBatches = useCallback(async () => {
    setActiveBatchesLoading(true);
    setActiveBatchesError(null);
    try {
      setActiveBatches(await fetchBatches("ACTIVE"));
    } catch (err) {
      setActiveBatchesError(err.message);
      setActiveBatches([]);
    } finally {
      setActiveBatchesLoading(false);
    }
  }, [fetchBatches]);

  const fetchLockedBatches = useCallback(async () => {
    setLockedBatchesLoading(true);
    setLockedBatchesError(null);
    try {
      setLockedBatches(await fetchBatches("LOCKED"));
    } catch (err) {
      setLockedBatchesError(err.message);
      setLockedBatches([]);
    } finally {
      setLockedBatchesLoading(false);
    }
  }, [fetchBatches]);

  useEffect(() => {
    fetchActiveBatches();
    fetchLockedBatches();
  }, [fetchActiveBatches, fetchLockedBatches]);

  const fetchApprovedOrders = useCallback(async () => {
    setApprovedOrdersLoading(true);
    setApprovedOrdersError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(APPROVED_ORDERS_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch approved orders");

      const list = result.data || result.orders || result || [];
      setApprovedOrders(Array.isArray(list) ? list.map(mapApprovedOrder) : []);
    } catch (err) {
      setApprovedOrdersError(err.message);
      setApprovedOrders([]);
    } finally {
      setApprovedOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedOrders();
  }, [fetchApprovedOrders]);

  // Modals state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // For Move Order Modal specifically
  const [selectedOrderIdToMove, setSelectedOrderIdToMove] = useState("");
  const [targetBatchIdForMove, setTargetBatchIdForMove] = useState("");

  // For Merge Batch Modal specifically
  const [targetBatchIdForMerge, setTargetBatchIdForMerge] = useState("");

  const toggleOrderSelection = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id)
        ? prev.filter((orderId) => orderId !== id)
        : [...prev, id],
    );
  };

  const [creatingBatch, setCreatingBatch] = useState(false);
  const [createBatchError, setCreateBatchError] = useState(null);

  const handleCreateBatch = async () => {
    if (selectedOrders.length === 0) return;
    const ordersToAdd = approvedOrders.filter((o) =>
      selectedOrders.includes(o.id),
    );

    const fallbackBatch = {
      id: `BATCH-${Math.floor(Math.random() * 100) + 20}`,
      itemCount: ordersToAdd.reduce((sum, order) => sum + order.items, 0),
      orderCount: ordersToAdd.length,
      users: ordersToAdd.slice(0, 3).map((o) => o.user),
      extraUsers: ordersToAdd.length > 3 ? ordersToAdd.length - 3 : 0,
      status: "grouped",
      baseShipping: 0,
      totalWeight: 0,
      orders: ordersToAdd,
    };

    setCreatingBatch(true);
    setCreateBatchError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(CREATE_BATCH_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderIds: selectedOrders.map(Number) }),
      });

      const rawText = await response.text();
      let result = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("Non-JSON response from /api/batches:", rawText);
      }

      if (!response.ok) {
        console.error("Create batch failed", response.status, result, rawText);
        throw new Error(
          result.message ||
            result.errors?.map((e) => e.message).join(", ") ||
            `Failed to create batch (status ${response.status})`,
        );
      }

      const created = result.data || result;
      if (created?.id) {
        await fetchActiveBatches();
      } else {
        setActiveBatches([...activeBatches, fallbackBatch]);
      }
      setApprovedOrders(
        approvedOrders.filter((o) => !selectedOrders.includes(o.id)),
      );
      setSelectedOrders([]);
      setActiveTab("active");
      setSuccessMessage("Batch created successfully!");
    } catch (err) {
      setCreateBatchError(err.message);
    } finally {
      setCreatingBatch(false);
    }
  };

  const [lockingBatchId, setLockingBatchId] = useState(null);
  const [lockError, setLockError] = useState(null);

  const handleLockBatch = async (batch) => {
    setLockingBatchId(batch.id);
    setLockError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${BATCHES_API_URL}/${batch.id}/lock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const rawText = await response.text();
      let result = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("Non-JSON response from lock:", rawText);
      }

      if (!response.ok) {
        console.error("Lock batch failed", response.status, result, rawText);
        throw new Error(
          result.message ||
            result.errors?.map((e) => e.message).join(", ") ||
            `Failed to lock batch (status ${response.status})`,
        );
      }

      await Promise.all([fetchActiveBatches(), fetchLockedBatches()]);
      setSuccessMessage("Batch locked successfully!");
    } catch (err) {
      setLockError(err.message);
    } finally {
      setLockingBatchId(null);
    }
  };

  const [batchDetailLoading, setBatchDetailLoading] = useState(false);

  const fetchBatchById = useCallback(async (id) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const response = await fetch(`${BATCHES_API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Failed to fetch batch");

    return mapBatch(result.data || result);
  }, []);

  const refreshBatchInList = useCallback(
    async (batchId) => {
      setBatchDetailLoading(true);
      try {
        const fresh = await fetchBatchById(batchId);
        setActiveBatches((prev) =>
          prev.some((b) => b.id === fresh.id)
            ? prev.map((b) => (b.id === fresh.id ? fresh : b))
            : [...prev, fresh],
        );
      } catch {
        // Keep using the existing list entry if the detail fetch fails
      } finally {
        setBatchDetailLoading(false);
      }
    },
    [fetchBatchById],
  );

  const openMoveModal = (batchId) => {
    setSelectedBatchId(batchId);
    setSelectedOrderIdToMove("");
    setTargetBatchIdForMove("");
    setMoveError(null);
    setMoveModalOpen(true);
    refreshBatchInList(batchId);
  };

  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState(null);

  const handleMoveOrder = async () => {
    if (!selectedOrderIdToMove || !targetBatchIdForMove) return;

    setMoveLoading(true);
    setMoveError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(moveOrdersApiUrl(selectedBatchId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderIds: [Number(selectedOrderIdToMove)],
          destinationBatchId: Number(targetBatchIdForMove),
        }),
      });

      const rawText = await response.text();
      let result = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("Non-JSON response from move-orders:", rawText);
      }

      if (!response.ok) {
        console.error("Move order failed", response.status, result, rawText);
        throw new Error(
          result.message ||
            result.errors?.map((e) => e.message).join(", ") ||
            `Failed to move order (status ${response.status})`,
        );
      }

      await fetchActiveBatches();
      setMoveModalOpen(false);
      setSuccessMessage("Order moved successfully!");
    } catch (err) {
      setMoveError(err.message);
    } finally {
      setMoveLoading(false);
    }
  };

  const openMergeModal = (batchId) => {
    setSelectedBatchId(batchId);
    setTargetBatchIdForMerge("");
    setMergeError(null);
    setMergeModalOpen(true);
    refreshBatchInList(batchId);
  };

  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState(null);

  const handleMergeBatch = async () => {
    if (!targetBatchIdForMerge) return;

    const sourceBatch = activeBatches.find(
      (b) => String(b.id) === String(selectedBatchId),
    );
    const targetBatch = activeBatches.find(
      (b) => String(b.id) === String(targetBatchIdForMerge),
    );
    if (!sourceBatch || !targetBatch) return;

    const fallbackBatch = {
      id: `BATCH-${Math.floor(Math.random() * 100) + 20}`,
      itemCount: sourceBatch.itemCount + targetBatch.itemCount,
      orderCount: sourceBatch.orderCount + targetBatch.orderCount,
      users: [...sourceBatch.users, ...targetBatch.users].slice(0, 3),
      extraUsers: Math.max(
        0,
        sourceBatch.orders.length + targetBatch.orders.length - 3,
      ),
      status: "grouped",
      baseShipping:
        (sourceBatch.baseShipping || 0) + (targetBatch.baseShipping || 0),
      totalWeight:
        (sourceBatch.totalWeight || 0) + (targetBatch.totalWeight || 0),
      orders: [...sourceBatch.orders, ...targetBatch.orders],
    };

    setMergeLoading(true);
    setMergeError(null);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(MERGE_BATCH_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceBatch: Number(sourceBatch.id),
          sourceBatchId: Number(sourceBatch.id),
          targetBatch: Number(targetBatch.id),
          targetBatchId: Number(targetBatch.id),
          targetBatchIds: [Number(targetBatch.id)],
        }),
      });

      const rawText = await response.text();
      let result = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("Non-JSON response from /api/batches/merge:", rawText);
      }

      if (!response.ok) {
        console.error("Merge batch failed", response.status, result, rawText);
        throw new Error(
          result.message ||
            result.errors?.map((e) => e.message).join(", ") ||
            `Failed to merge batches (status ${response.status})`,
        );
      }

      const created = result.data || result;
      if (created?.id) {
        await fetchActiveBatches();
      } else {
        setActiveBatches(
          activeBatches
            .filter((b) => b.id !== sourceBatch.id && b.id !== targetBatch.id)
            .concat(fallbackBatch),
        );
      }
      setMergeModalOpen(false);
      setSuccessMessage("Batches merged successfully!");
    } catch (err) {
      setMergeError(err.message);
    } finally {
      setMergeLoading(false);
    }
  };

  const selectedBatch = activeBatches.find((b) => b.id === selectedBatchId);

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/10 min-h-[calc(100vh-70px)] space-y-8 font-sans relative">
      <SuccessToast
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-[#7A4E5B] tracking-tight">
            Batch Queue
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[#5C5F60] text-sm">
            Smart grouping active based on discount thresholds.
          </p>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#A25F6E] bg-[#FFD1DC]/40 px-2 py-1 rounded-sm border border-[#FFD1DC]">
            <Info size={12} />
            Manual overrides enabled
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#D3C3C5]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("approved")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "approved"
                ? "border-[#7A4E5B] text-[#141D23]"
                : "border-transparent text-[#5C5F60] hover:text-[#141D23]"
            }`}
          >
            Approved Orders ({approvedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "active"
                ? "border-[#7A4E5B] text-[#141D23]"
                : "border-transparent text-[#5C5F60] hover:text-[#141D23]"
            }`}
          >
            Active Batches ({activeBatches.length})
          </button>
          <button
            onClick={() => setActiveTab("locked")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "locked"
                ? "border-[#7A4E5B] text-[#141D23]"
                : "border-transparent text-[#5C5F60] hover:text-[#141D23]"
            }`}
          >
            Locked & Processed
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "approved" && (
          <div className="bg-white border border-[#D3C3C5] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#D3C3C5] flex justify-between items-center bg-[#FFD1DC]/10">
              <h2 className="font-semibold text-[#141D23]">
                Ready for Batching
              </h2>
              <button
                onClick={handleCreateBatch}
                disabled={selectedOrders.length === 0 || creatingBatch}
                className="bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#2D141C] border border-[#D3C3C5] px-4 py-2 rounded-sm text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {creatingBatch ? "Creating Batch..." : "Make Batch"}
              </button>
            </div>
            {createBatchError && (
              <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-[#D3C3C5]">
                {createBatchError}
              </p>
            )}
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[#5C5F60] border-b border-[#D3C3C5]">
                <tr>
                  <th className="px-6 py-3 font-medium w-12"></th>
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Items</th>
                  <th className="px-6 py-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3C3C5]">
                {approvedOrdersLoading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-[#5C5F60]"
                    >
                      Loading approved orders...
                    </td>
                  </tr>
                ) : approvedOrdersError ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-red-600"
                    >
                      {approvedOrdersError}
                    </td>
                  </tr>
                ) : approvedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-[#5C5F60]"
                    >
                      No approved orders available.
                    </td>
                  </tr>
                ) : (
                  approvedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded border-[#D3C3C5] text-[#7A4E5B] focus:ring-[#7A4E5B]"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-[#141D23]">
                        {order.displayId}
                      </td>
                      <td className="px-6 py-4 text-[#5C5F60]">{order.user}</td>
                      <td className="px-6 py-4 text-[#5C5F60]">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 text-[#5C5F60]">
                        ${order.value?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockError && (
              <div className="col-span-full bg-red-50 border border-red-300 text-red-600 text-sm font-medium rounded-md px-4 py-3">
                {lockError}
              </div>
            )}
            {activeBatchesLoading && (
              <div className="col-span-full py-12 text-center text-[#5C5F60]">
                Loading active batches...
              </div>
            )}
            {!activeBatchesLoading && activeBatchesError && (
              <div className="col-span-full py-12 text-center text-red-600">
                {activeBatchesError}
              </div>
            )}
            {!activeBatchesLoading &&
              !activeBatchesError &&
              activeBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white border border-[#D3C3C5] rounded-md p-5 flex flex-col shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-[#5C5F60] uppercase tracking-wider">
                    <span>BATCH-{batch.id}</span>
                    <span className="w-1 h-1 bg-[#D3C3C5] rounded-full"></span>
                    <span className="text-[#141D23] font-bold">
                      {batch.itemCount} Items
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#141D23] mb-4">
                    {batch.orderCount} Orders{" "}
                    {batch.status === "grouped" ? "Grouped" : "Pending"}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {batch.users.map((user, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-[#5C5F60] text-xs px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1.5"
                      >
                        <span className="grid grid-cols-2 gap-[1px] w-2.5 h-2.5 opacity-60">
                          <span className="bg-current rounded-[1px]"></span>
                          <span className="bg-current rounded-[1px]"></span>
                          <span className="bg-current rounded-[1px]"></span>
                          <span className="bg-current rounded-[1px]"></span>
                        </span>
                        {user}
                      </span>
                    ))}
                    {batch.extraUsers > 0 && (
                      <span className="bg-slate-100 text-[#5C5F60] text-xs px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1.5">
                        <span className="grid grid-cols-2 gap-[1px] w-2.5 h-2.5 opacity-60">
                          <span className="bg-current rounded-[1px]"></span>
                          <span className="bg-current rounded-[1px]"></span>
                          <span className="bg-current rounded-[1px]"></span>
                          <span className="bg-current rounded-[1px]"></span>
                        </span>
                        +{batch.extraUsers} others
                      </span>
                    )}
                  </div>

                  {batch.shippingThreshold && (
                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-[#5C5F60] mb-1">
                        <span>Shipping Threshold</span>
                      </div>
                      <div className="w-full bg-[#E8F0FE] rounded-full h-2 mb-1.5 overflow-hidden">
                        <div
                          className="bg-[#1A73E8] h-2 rounded-full"
                          style={{ width: `${batch.shippingThreshold}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-[#5C5F60] italic">
                        {batch.shippingAddText}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openMoveModal(batch.id)}
                        className="flex-1 bg-white hover:bg-slate-50 text-[#5C5F60] border border-[#D3C3C5] rounded-sm py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Move size={14} /> Move Order
                      </button>
                      <button
                        onClick={() => openMergeModal(batch.id)}
                        className="flex-1 bg-white hover:bg-slate-50 text-[#5C5F60] border border-[#D3C3C5] rounded-sm py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Merge size={14} /> Merge Batch
                      </button>
                    </div>
                    <button
                      onClick={() => handleLockBatch(batch)}
                      disabled={lockingBatchId === batch.id}
                      className="w-full bg-[#FFD1DC]/60 hover:bg-[#FFD1DC] text-[#7A4E5B] border border-[#FFD1DC] rounded-sm py-2 text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {lockingBatchId === batch.id
                        ? "Locking..."
                        : "Lock Batch"}
                    </button>
                  </div>
                </div>
              ))}
            {!activeBatchesLoading &&
              !activeBatchesError &&
              activeBatches.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#5C5F60]">
                  No active batches. Go to "Approved Orders" to create one.
                </div>
              )}
          </div>
        )}

        {activeTab === "locked" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedBatchesLoading && (
              <div className="col-span-full py-12 text-center text-[#5C5F60]">
                Loading locked batches...
              </div>
            )}
            {!lockedBatchesLoading && lockedBatchesError && (
              <div className="col-span-full py-12 text-center text-red-600">
                {lockedBatchesError}
              </div>
            )}
            {!lockedBatchesLoading &&
              !lockedBatchesError &&
              lockedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white border border-[#FFD1DC] rounded-md p-5 flex flex-col shadow-sm relative overflow-hidden ring-1 ring-[#FFD1DC]"
                >
                  <div className="absolute top-0 right-0 bg-[#7A4E5B]/10 p-2 rounded-bl-md border-b border-l border-[#FFD1DC]">
                    <LockKeyhole size={16} className="text-[#7A4E5B]" />
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-[#5C5F60] uppercase tracking-wider">
                    <span>BATCH-{batch.id}</span>
                    <span className="w-1 h-1 bg-[#D3C3C5] rounded-full"></span>
                    <span className="text-[#141D23] font-bold">
                      {batch.itemCount} Items
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#141D23] mb-4">
                    {batch.orderCount} Orders Ready
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {batch.users.map((user, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FFD1DC]/20 text-[#5C5F60] text-xs px-2.5 py-1 rounded border border-[#FFD1DC]/50 flex items-center gap-1.5"
                      >
                        {user}
                      </span>
                    ))}
                    {batch.extraUsers > 0 && (
                      <span className="bg-[#FFD1DC]/20 text-[#5C5F60] text-xs px-2.5 py-1 rounded border border-[#FFD1DC]/50 flex items-center gap-1.5">
                        +{batch.extraUsers} others
                      </span>
                    )}
                  </div>

                  {/* <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D8246] mb-1.5">
                      <CheckCircle size={14} /> 50% Max Discount
                    </div>
                    <div className="w-full bg-[#E6F4EA] rounded-full h-2 mb-2 overflow-hidden">
                      <div
                        className="bg-[#0D8246] h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-[#0D8246] font-medium">
                      {batch.savingsText || "Estimated savings applied."}
                    </p>
                  </div> */}

                  <div className="mt-auto flex flex-col gap-3">
                    <button className="w-full bg-[#FFD1DC]/60 hover:bg-[#FFD1DC] text-[#7A4E5B] border border-[#FFD1DC] rounded-sm py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                      <Copy size={16} /> Export Product IDs
                    </button>
                    {/* <p className="text-xs text-center text-[#5C5F60]">
                      Locked for processing by {batch.lockedBy}
                    </p> */}
                  </div>
                </div>
              ))}
            {!lockedBatchesLoading &&
              !lockedBatchesError &&
              lockedBatches.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#5C5F60]">
                  No locked batches yet.
                </div>
              )}
          </div>
        )}
      </div>

      {/* Dashboard Elements */}
      <div className="bg-[#2B323B] rounded-md p-6 text-white shadow-md">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-xl font-bold mb-1">
              Discount Capture Efficiency
            </h3>
            <p className="text-[#9BA1A6] text-sm">
              Weekly percentage of batches hitting target tiers.
            </p>
          </div>
          <span className="bg-[#8E5E6C]/80 text-[#FFD1DC] text-[10px] font-bold px-2 py-1 tracking-wider uppercase rounded-sm">
            Live Metric
          </span>
        </div>

        <div className="flex items-end justify-center gap-6 h-40 mt-10">
          {STATIC_CHART_DATA.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <div
                className={`w-20 rounded-t-sm transition-all duration-500 ease-in-out ${item.day === "FRI" ? "bg-[#8E5E6C]" : "bg-[#FFD1DC]"}`}
                style={{ height: `${item.value}%` }}
              ></div>
              <span className="text-xs text-[#9BA1A6] font-semibold tracking-widest">
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#141D23]">
            Recent Action Log
          </h3>
          <button className="text-[#5C5F60] text-sm font-semibold hover:text-[#141D23] transition-colors">
            View Full History →
          </button>
        </div>
        <div className="bg-white border border-[#D3C3C5] rounded-md overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[#5C5F60] border-b border-[#D3C3C5]">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider text-xs">
                  TIMESTAMP
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider text-xs">
                  BATCH ID
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider text-xs">
                  AGENT
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider text-xs">
                  ACTION
                </th>
                <th className="px-6 py-4 font-semibold tracking-wider text-xs text-right">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3C3C5]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-[#5C5F60]">Oct 24, 14:22</td>
                <td className="px-6 py-4 font-bold text-[#7A4E5B]">BATCH-15</td>
                <td className="px-6 py-4 text-[#5C5F60]">Elena S.</td>
                <td className="px-6 py-4 text-[#141D23]">
                  50% Tier IDs Exported
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex bg-[#E6F4EA] text-[#0D8246] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                    SUCCESS
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-[#5C5F60]">Oct 24, 13:05</td>
                <td className="px-6 py-4 font-bold text-[#7A4E5B]">BATCH-16</td>
                <td className="px-6 py-4 text-[#5C5F60]">System</td>
                <td className="px-6 py-4 text-[#141D23]">
                  Added Ahmed (Manual Move)
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex bg-[#E8F0FE] text-[#1A73E8] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                    UPDATED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-[#5C5F60]">Oct 24, 11:45</td>
                <td className="px-6 py-4 font-bold text-[#7A4E5B]">BATCH-17</td>
                <td className="px-6 py-4 text-[#5C5F60]">Elena S.</td>
                <td className="px-6 py-4 text-[#141D23]">
                  Manual Locked: Override
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex bg-[#E1F5FE] text-[#0288D1] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                    LOCKED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Order Modal */}
      {moveModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#D3C3C5]">
              <h3 className="font-bold text-[#141D23]">
                Move Order from {selectedBatch.id}
                {batchDetailLoading && (
                  <span className="ml-2 text-xs font-normal text-[#5C5F60]">
                    Refreshing...
                  </span>
                )}
              </h3>
              <button
                onClick={() => setMoveModalOpen(false)}
                className="text-[#5C5F60] hover:text-[#141D23]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {moveError && <p className="text-sm text-red-600">{moveError}</p>}
              <div>
                <label className="block text-sm font-semibold text-[#5C5F60] mb-1">
                  Select Order to Move
                </label>
                <select
                  className="w-full border border-[#D3C3C5] rounded p-2 text-sm text-[#141D23]"
                  value={selectedOrderIdToMove}
                  onChange={(e) => setSelectedOrderIdToMove(e.target.value)}
                >
                  <option value="">-- Select Order --</option>
                  {selectedBatch.orders?.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id} - {order.user || order.customerName} (
                      {countOrderItems(order)} items)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#5C5F60] mb-1">
                  Target Batch
                </label>
                <select
                  className="w-full border border-[#D3C3C5] rounded p-2 text-sm text-[#141D23]"
                  value={targetBatchIdForMove}
                  onChange={(e) => setTargetBatchIdForMove(e.target.value)}
                >
                  <option value="">-- Select Target Batch --</option>
                  {activeBatches
                    .filter((b) => b.id !== selectedBatch.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.orderCount} orders)
                      </option>
                    ))}
                </select>
                {activeBatches.length <= 1 && (
                  <p className="text-xs text-[#A25F6E] mt-1">
                    No other active batches available to move to.
                  </p>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setMoveModalOpen(false)}
                  className="flex-1 border border-[#D3C3C5] text-[#5C5F60] py-2 rounded-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveOrder}
                  disabled={
                    !selectedOrderIdToMove ||
                    !targetBatchIdForMove ||
                    moveLoading
                  }
                  className="flex-1 bg-[#7A4E5B] text-white py-2 rounded-sm font-medium hover:bg-[#A25F6E] disabled:opacity-50"
                >
                  {moveLoading ? "Moving..." : "Move Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Batch Modal */}
      {mergeModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#D3C3C5]">
              <h3 className="font-bold text-[#141D23]">
                Merge {selectedBatch.id}
                {batchDetailLoading && (
                  <span className="ml-2 text-xs font-normal text-[#5C5F60]">
                    Refreshing...
                  </span>
                )}
              </h3>
              <button
                onClick={() => setMergeModalOpen(false)}
                className="text-[#5C5F60] hover:text-[#141D23]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {mergeError && (
                <p className="text-sm text-red-600">{mergeError}</p>
              )}
              <p className="text-sm text-[#5C5F60]">
                Select another active batch to merge all orders from{" "}
                <strong>{selectedBatch.id}</strong> into.
              </p>
              <div>
                <label className="block text-sm font-semibold text-[#5C5F60] mb-1">
                  Target Batch
                </label>
                <select
                  className="w-full border border-[#D3C3C5] rounded p-2 text-sm text-[#141D23]"
                  value={targetBatchIdForMerge}
                  onChange={(e) => setTargetBatchIdForMerge(e.target.value)}
                >
                  <option value="">-- Select Target Batch --</option>
                  {activeBatches
                    .filter((b) => b.id !== selectedBatch.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.orderCount} orders)
                      </option>
                    ))}
                </select>
                {activeBatches.length <= 1 && (
                  <p className="text-xs text-[#A25F6E] mt-1">
                    No other active batches available to merge into.
                  </p>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setMergeModalOpen(false)}
                  className="flex-1 border border-[#D3C3C5] text-[#5C5F60] py-2 rounded-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeBatch}
                  disabled={!targetBatchIdForMerge || mergeLoading}
                  className="flex-1 bg-[#7A4E5B] text-white py-2 rounded-sm font-medium hover:bg-[#A25F6E] disabled:opacity-50"
                >
                  {mergeLoading ? "Merging..." : "Merge Batches"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
