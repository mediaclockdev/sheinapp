import { useState, useEffect, useCallback } from "react";
import {
  Move,
  Merge,
  Copy,
  Info,
  LockKeyholeOpen,
  X,
  Eye,
  Trash2,
} from "lucide-react";
import SuccessToast from "../components/common/SuccessToast";
import useOrderDetails from "../components/orders/useOrderDetails";
import OrderDetailsPanel from "../components/orders/OrderDetailsPanel";
import OrderSummaryDrawer from "../components/orders/OrderSummaryDrawer";
import { getInitials, orderCustomerName } from "../lib/format";
import apiClient, { getErrorMessage } from "../lib/api/client";
import { ENDPOINTS } from "../lib/api/endpoints";

const APPROVED_PAGE_SIZE = 10;

const countOrderItems = (order) =>
  Array.isArray(order.items) ? order.items.length : Number(order.items) || 0;

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

const fmtLogTime = (value) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d)
    ? d.toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
};

const LOG_STATUS_STYLES = {
  SUCCESS: "bg-[#E6F4EA] text-[#0D8246]",
  CREATED: "bg-[#E6F4EA] text-[#0D8246]",
  UPDATED: "bg-[#E8F0FE] text-[#1A73E8]",
  MOVED: "bg-[#E8F0FE] text-[#1A73E8]",
  LOCKED: "bg-[#E1F5FE] text-[#0288D1]",
  MERGED: "bg-[#F3E8FD] text-[#7C3AED]",
  FAILED: "bg-[#FCEBEB] text-[#C0392B]",
  DELETED: "bg-[#FCEBEB] text-[#C0392B]",
  REMOVED: "bg-[#FCEBEB] text-[#C0392B]",
};

const mapActivityLog = (log) => ({
  id: log.id,
  timestamp: log.createdAt,
  batchName: log.batchName || "—",
  agent: log.agentId ? `Agent #${log.agentId}` : "System",
  action: log.action || "—",
  status: String(log.status || "").toUpperCase(),
});

const mapApprovedOrder = (order) => {
  const user = order.customerName || order.customer?.fullName || "Unknown";
  return {
    id: order.id,
    displayId: order.orderId || order.id,
    user,
    initials: getInitials(user),
    items:
      Number(order._count?.items ?? order.itemsCount ?? order.itemCount ?? 0) ||
      countOrderItems(order),
    value: Number(order.grandTotal ?? order.value ?? 0),
    date: order.createdAt || order.orderDate || null,
    raw: order,
  };
};

const mapBatch = (batch) => {
  const orders = batch.orders || [];

  const itemCount = Number.isFinite(batch.itemCount)
    ? batch.itemCount
    : orders.reduce((sum, o) => sum + countOrderItems(o), 0);

  return {
    id: batch.batchId || batch.id,
    itemCount,
    orderCount: Number.isFinite(batch.orderCount)
      ? batch.orderCount
      : orders.length,
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

const CHIP_TONES = {
  slate: {
    base: "bg-slate-100 border-slate-200 hover:bg-slate-200",
    active: "bg-[#FFD1DC]/30 border-[#D4537E]",
  },
  pink: {
    base: "bg-[#FFD1DC]/20 border-[#FFD1DC]/50 hover:bg-[#FFD1DC]/40",
    active: "bg-[#FFD1DC]/50 border-[#D4537E]",
  },
};

/** One chip per order on a batch card. Clicking one opens its summary drawer. */
function OrderChips({ batch, tone, expanded, openOrderId, onToggle, onOpen }) {
  const tones = CHIP_TONES[tone];
  const orders = batch.orders || [];
  const shown = expanded ? orders : orders.slice(0, 3);
  const extra = orders.length - 3;

  return (
    <div className="grid grid-cols-2 gap-2 mb-6">
      {shown.map((order) => (
        <button
          key={order.id}
          onClick={() => onOpen(order.id)}
          className={`text-left px-2.5 py-2 rounded border cursor-pointer transition-colors ${
            openOrderId === order.id ? tones.active : tones.base
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#141D23]">
            <span className="grid grid-cols-2 gap-[1px] w-2.5 h-2.5 opacity-60 shrink-0">
              <span className="bg-current rounded-[1px]"></span>
              <span className="bg-current rounded-[1px]"></span>
              <span className="bg-current rounded-[1px]"></span>
              <span className="bg-current rounded-[1px]"></span>
            </span>
            <span className="truncate">{orderCustomerName(order)}</span>
          </span>
        </button>
      ))}
      {extra > 0 && (
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          className={`px-2.5 py-2 rounded border cursor-pointer text-xs text-[#5C5F60] flex items-center justify-center ${tones.base}`}
        >
          {expanded ? "Show less" : `+${extra} more orders`}
        </button>
      )}
    </div>
  );
}

export default function BatchQueue() {
  const [activeTab, setActiveTab] = useState("active");
  const [successMessage, setSuccessMessage] = useState(null);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [approvedOrdersLoading, setApprovedOrdersLoading] = useState(true);
  const [approvedOrdersError, setApprovedOrdersError] = useState(null);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeBatches, setActiveBatches] = useState([]);
  const [activeBatchesLoading, setActiveBatchesLoading] = useState(true);
  const [activeBatchesError, setActiveBatchesError] = useState(null);
  const [lockedBatches, setLockedBatches] = useState([]);
  const [lockedBatchesLoading, setLockedBatchesLoading] = useState(true);
  const [lockedBatchesError, setLockedBatchesError] = useState(null);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(null);
  // Id of the order whose summary drawer is open, or null.
  const [openOrderId, setOpenOrderId] = useState(null);

  const fetchBatches = useCallback(async (status) => {
    const { data: result } = await apiClient.get(
      `${ENDPOINTS.batches.list}?status=${status}`,
    );
    const list = result.data || result.batches || result || [];
    return Array.isArray(list) ? list.map(mapBatch) : [];
  }, []);

  const fetchActiveBatches = useCallback(async () => {
    setActiveBatchesLoading(true);
    setActiveBatchesError(null);
    try {
      setActiveBatches(await fetchBatches("ACTIVE"));
    } catch (err) {
      setActiveBatchesError(getErrorMessage(err, "Failed to fetch active batches"));
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
      setLockedBatchesError(getErrorMessage(err, "Failed to fetch locked batches"));
      setLockedBatches([]);
    } finally {
      setLockedBatchesLoading(false);
    }
  }, [fetchBatches]);

  useEffect(() => {
    fetchActiveBatches();
    fetchLockedBatches();
  }, [fetchActiveBatches, fetchLockedBatches]);

  const fetchApprovedOrders = useCallback(async (page = 1) => {
    setApprovedOrdersLoading(true);
    setApprovedOrdersError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: APPROVED_PAGE_SIZE,
      });

      const { data: result } = await apiClient.get(
        `${ENDPOINTS.batches.approvedOrders}?${params}`,
      );

      const list =
        result.data?.orders || result.data || result.orders || result || [];
      const mapped = Array.isArray(list) ? list.map(mapApprovedOrder) : [];
      setApprovedOrders(mapped);
      setApprovedTotal(
        Number(
          result.total ??
            result.totalCount ??
            result.pagination?.total ??
            result.data?.pagination?.total ??
            result.meta?.total ??
            mapped.length,
        ),
      );
    } catch (err) {
      setApprovedOrdersError(getErrorMessage(err, "Failed to fetch approved orders"));
      setApprovedOrders([]);
    } finally {
      setApprovedOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedOrders(pageIndex + 1);
  }, [fetchApprovedOrders, pageIndex]);

  const approvedPageCount = Math.max(
    1,
    Math.ceil(approvedTotal / APPROVED_PAGE_SIZE),
  );

  // Modals state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // For Move Order Modal specifically
  const [selectedOrderIdToMove, setSelectedOrderIdToMove] = useState("");
  const [targetBatchIdForMove, setTargetBatchIdForMove] = useState("");

  // For Merge Batch Modal specifically
  const [targetBatchIdForMerge, setTargetBatchIdForMerge] = useState("");

  const detail = useOrderDetails({
    onUpdated: () => fetchApprovedOrders(pageIndex + 1),
    onSuccess: setSuccessMessage,
  });

  // "Delete" an approved order = reject it through the same status endpoint
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteOrder = async (order) => {
    if (deletingId) return;
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    setDeletingId(order.id);
    try {
      await apiClient.patch(ENDPOINTS.orders.status(order.id), {
        status: "REJECTED",
      });

      setSelectedOrders((prev) => prev.filter((id) => id !== order.id));
      if (detail.orderId === order.id) detail.close();
      setSuccessMessage("Order deleted successfully!");
      await fetchApprovedOrders(pageIndex + 1);
    } catch (err) {
      window.alert(getErrorMessage(err, "Failed to delete order"));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = approvedOrders.map((o) => o.id);
    const allSelected = pageIds.every((id) => selectedOrders.includes(id));
    setSelectedOrders((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    );
  };

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

    // `raw` is the untouched API order, so the drawer sees real items.
    const rawOrders = ordersToAdd.map((o) => o.raw || o);
    const fallbackBatch = {
      id: `BATCH-${Math.floor(Math.random() * 100) + 20}`,
      itemCount: ordersToAdd.reduce((sum, order) => sum + order.items, 0),
      orderCount: ordersToAdd.length,
      status: "grouped",
      baseShipping: 0,
      totalWeight: 0,
      orders: rawOrders,
    };

    setCreatingBatch(true);
    setCreateBatchError(null);
    try {
      const { data: result } = await apiClient.post(ENDPOINTS.batches.list, {
        orderIds: selectedOrders.map(Number),
      });

      const created = result.data || result;
      if (created?.id) {
        await fetchActiveBatches();
      } else {
        setActiveBatches([...activeBatches, fallbackBatch]);
      }
      await fetchApprovedOrders(pageIndex + 1);
      setSelectedOrders([]);
      setActiveTab("active");
      refreshActivityLogs();
      setSuccessMessage("Batch created successfully!");
    } catch (err) {
      setCreateBatchError(getErrorMessage(err, "Failed to create batch"));
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
      await apiClient.patch(ENDPOINTS.batches.lock(batch.id));

      await Promise.all([fetchActiveBatches(), fetchLockedBatches()]);
      refreshActivityLogs();
      setSuccessMessage("Batch locked successfully!");
    } catch (err) {
      setLockError(getErrorMessage(err, "Failed to lock batch"));
    } finally {
      setLockingBatchId(null);
    }
  };

  const [deletingBatchId, setDeletingBatchId] = useState(null);

  const handleDeleteBatch = async (batch) => {
    if (deletingBatchId) return;
    if (
      !window.confirm(
        `Are you sure you want to delete BATCH-${batch.id}? This cannot be undone.`,
      )
    )
      return;
    setDeletingBatchId(batch.id);
    setLockError(null);
    try {
      await apiClient.delete(ENDPOINTS.batches.byId(batch.id));

      await Promise.all([
        fetchActiveBatches(),
        fetchLockedBatches(),
        fetchApprovedOrders(pageIndex + 1),
      ]);
      refreshActivityLogs();
      setSuccessMessage("Batch deleted successfully!");
    } catch (err) {
      setLockError(getErrorMessage(err, "Failed to delete batch"));
    } finally {
      setDeletingBatchId(null);
    }
  };

  const [unlockingBatchId, setUnlockingBatchId] = useState(null);

  const handleUnlockBatch = async (batch) => {
    setUnlockingBatchId(batch.id);
    setLockError(null);
    try {
      await apiClient.patch(ENDPOINTS.batches.unlock(batch.id));

      await Promise.all([fetchActiveBatches(), fetchLockedBatches()]);
      refreshActivityLogs();
      setSuccessMessage("Batch unlocked successfully!");
    } catch (err) {
      setLockError(getErrorMessage(err, "Failed to unlock batch"));
    } finally {
      setUnlockingBatchId(null);
    }
  };

  const [batchDetailLoading, setBatchDetailLoading] = useState(false);

  const fetchBatchById = useCallback(async (id) => {
    const { data: result } = await apiClient.get(ENDPOINTS.batches.byId(id));
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

  // Remove a single order from a batch
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [orderIdToRemove, setOrderIdToRemove] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  const openRemoveModal = (batchId) => {
    setSelectedBatchId(batchId);
    setOrderIdToRemove("");
    setRemoveError(null);
    setRemoveModalOpen(true);
    refreshBatchInList(batchId);
  };

  const handleRemoveOrder = async () => {
    if (!orderIdToRemove) return;
    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await apiClient.patch(ENDPOINTS.batches.removeOrders(selectedBatchId), {
        orderIds: [Number(orderIdToRemove)],
      });

      await Promise.all([
        fetchActiveBatches(),
        fetchApprovedOrders(pageIndex + 1),
      ]);
      setRemoveModalOpen(false);
      refreshActivityLogs();
      setSuccessMessage("Order removed from batch!");
    } catch (err) {
      setRemoveError(getErrorMessage(err, "Failed to remove order"));
    } finally {
      setRemoveLoading(false);
    }
  };

  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState(null);

  const handleMoveOrder = async () => {
    if (!selectedOrderIdToMove || !targetBatchIdForMove) return;

    setMoveLoading(true);
    setMoveError(null);
    try {
      await apiClient.post(ENDPOINTS.batches.moveOrders(selectedBatchId), {
        orderIds: [Number(selectedOrderIdToMove)],
        destinationBatchId: Number(targetBatchIdForMove),
      });

      await fetchActiveBatches();
      setMoveModalOpen(false);
      refreshActivityLogs();
      setSuccessMessage("Order moved successfully!");
    } catch (err) {
      setMoveError(getErrorMessage(err, "Failed to move order"));
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

    const mergedOrders = [...sourceBatch.orders, ...targetBatch.orders];
    const fallbackBatch = {
      id: `BATCH-${Math.floor(Math.random() * 100) + 20}`,
      itemCount: sourceBatch.itemCount + targetBatch.itemCount,
      orderCount: sourceBatch.orderCount + targetBatch.orderCount,
      status: "grouped",
      baseShipping:
        (sourceBatch.baseShipping || 0) + (targetBatch.baseShipping || 0),
      totalWeight:
        (sourceBatch.totalWeight || 0) + (targetBatch.totalWeight || 0),
      orders: mergedOrders,
    };

    setMergeLoading(true);
    setMergeError(null);
    try {
      const { data: result } = await apiClient.post(ENDPOINTS.batches.merge, {
        sourceBatch: Number(sourceBatch.id),
        sourceBatchId: Number(sourceBatch.id),
        targetBatch: Number(targetBatch.id),
        targetBatchId: Number(targetBatch.id),
        targetBatchIds: [Number(targetBatch.id)],
      });

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
      refreshActivityLogs();
      setSuccessMessage("Batches merged successfully!");
    } catch (err) {
      setMergeError(getErrorMessage(err, "Failed to merge batches"));
    } finally {
      setMergeLoading(false);
    }
  };

  const selectedBatch = activeBatches.find((b) => b.id === selectedBatchId);

  const drawerOrder = openOrderId
    ? [...activeBatches, ...lockedBatches]
        .flatMap((b) => b.orders || [])
        .find((o) => o.id === openOrderId)
    : null;

  const handleActivityLogs = async () => {
    const { data: result } = await apiClient.get(
      ENDPOINTS.batches.activityLogs,
    );
    const list = result.data?.logs || result.data || result.logs || result;
    return Array.isArray(list) ? list.map(mapActivityLog) : [];
  };

  const refreshActivityLogs = () => {
    handleActivityLogs()
      .then(setActivityLogs)
      .catch((err) =>
        setLogsError(getErrorMessage(err, "Failed to fetch activity logs")),
      );
  };

  useEffect(() => {
    handleActivityLogs()
      .then(setActivityLogs)
      .catch((err) => setLogsError(getErrorMessage(err, "Failed to fetch activity logs")))
      .finally(() => setLogsLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/10 min-h-[calc(100vh-70px)] space-y-8 font-sans relative">
      <SuccessToast
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
      {/* Header */}
      <div className="space-y-1">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <p className="text-[#5C5F60] text-base lg:text-xl">
            Smart grouping active based on discount thresholds.
          </p>
          <span className="flex items-center gap-1 text-sm lg:text-base font-semibold text-[#A25F6E] bg-[#FFD1DC]/40 px-2 py-1 rounded-sm border border-[#FFD1DC]">
            <Info size={18} />
            Manual overrides enabled
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#D3C3C5]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("approved")}
            className={`pb-2 lg:pb-3 text-xs lg:text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "approved"
                ? "border-[#7A4E5B] text-[#141D23] "
                : "border-transparent text-[#5C5F60] hover:text-[#141D23] "
            }`}
          >
            Approved Orders ({approvedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-2 lg:pb-3 text-xs lg:text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "active"
                ? "border-[#7A4E5B] text-[#141D23]"
                : "border-transparent text-[#5C5F60] hover:text-[#141D23]"
            }`}
          >
            Active Batches ({activeBatches.length})
          </button>
          <button
            onClick={() => setActiveTab("locked")}
            className={`pb-2 lg:pb-3 text-xs lg:text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
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
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div
              className={`bg-white border border-[#D3C3C5] rounded-lg w-full ${
                detail.orderId ? "lg:w-[60%]" : "lg:w-full"
              }`}
            >
              <div className="p-4 border-b border-[#D3C3C5] flex flex-wrap gap-3 justify-between items-center bg-[#FFD1DC]/10">
                <h2 className="font-semibold text-[#141D23] text-sm lg:text-base">
                  Ready for Batching
                </h2>
                <button
                  onClick={handleCreateBatch}
                  disabled={selectedOrders.length === 0 || creatingBatch}
                  className="bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#2D141C] border border-[#D3C3C5] px-4 py-2 rounded-sm text-xs lg:text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {creatingBatch ? "Creating Batch..." : "Make Batch"}
                </button>
              </div>
              {createBatchError && (
                <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-[#D3C3C5]">
                  {createBatchError}
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#F3F4F6] border-b border-[#D8D8D8]">
                      <th className="py-4 px-3 w-12">
                        <input
                          type="checkbox"
                          checked={
                            approvedOrders.length > 0 &&
                            approvedOrders.every((o) =>
                              selectedOrders.includes(o.id),
                            )
                          }
                          onChange={toggleSelectAllOnPage}
                          className="accent-[#7A5C69] h-4 w-4 align-middle cursor-pointer"
                        />
                      </th>
                      {[
                        "ORDER ID",
                        "CUSTOMER",
                        "ITEMS",
                        "VALUE",
                        "DATE",
                        "ACTIONS",
                      ].map((label) => (
                        <th
                          key={label}
                          className={`py-4 px-3 text-xs lg:text-sm font-bold text-[#666] ${
                            label === "CUSTOMER"
                              ? "text-left w-px whitespace-nowrap"
                              : "text-center"
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {approvedOrdersLoading ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="py-8 text-center text-sm text-[#8C959F]"
                        >
                          Loading approved orders...
                        </td>
                      </tr>
                    ) : approvedOrdersError ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="py-8 text-center text-red-600"
                        >
                          {approvedOrdersError}
                        </td>
                      </tr>
                    ) : approvedOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="py-8 text-center text-sm text-[#8C959F]"
                        >
                          No approved orders available.
                        </td>
                      </tr>
                    ) : (
                      approvedOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-b border-[#ECECEC] hover:bg-gray-50 transition ${
                            selectedOrders.includes(order.id)
                              ? "bg-[#FFF8FA]"
                              : ""
                          }`}
                        >
                          <td className="py-4 px-3">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="accent-[#7A5C69] h-4 w-4 align-middle cursor-pointer"
                            />
                          </td>
                          <td className="py-4 text-center text-sm text-[#333]">
                            {order.displayId}
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 shrink-0 rounded-full bg-[#D9DEE7] flex items-center justify-center text-[9px] font-semibold text-[#4B5563]">
                                {order.initials}
                              </div>
                              <span className="text-sm text-[#333] whitespace-nowrap">
                                {order.user}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-center text-sm text-[#444]">
                            {order.items} items
                          </td>
                          <td className="py-4 text-center text-sm text-[#444]">
                            ${order.value?.toFixed(2) || "0.00"}
                          </td>
                          <td className="py-4 text-center text-sm text-[#444]">
                            {fmtDisplayDate(order.date)}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  detail.openOrder(order.id, {
                                    order: order.raw,
                                  })
                                }
                                title="View Details"
                                className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center hover:bg-[#F9F5F6] cursor-pointer"
                              >
                                <Eye size={16} className="text-[#7A5C69]" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order)}
                                title="Delete Order"
                                disabled={deletingId === order.id}
                                className="w-8 h-8 border border-[#D6C5CC] rounded flex items-center justify-center hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={16} className="text-[#C0392B]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {approvedOrders.length > 0 && (
                <div className="px-4 py-3 border-t border-[#D3C3C5] bg-[#FBF7F8] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8C959F]">
                    {pageIndex * APPROVED_PAGE_SIZE + 1}-
                    {pageIndex * APPROVED_PAGE_SIZE + approvedOrders.length} of{" "}
                    {approvedTotal}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPageIndex(pageIndex - 1)}
                      disabled={pageIndex === 0}
                      className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    <span className="text-xs font-semibold text-[#8C959F] mx-1">
                      Page {pageIndex + 1} of {approvedPageCount}
                    </span>
                    <button
                      onClick={() => setPageIndex(pageIndex + 1)}
                      disabled={pageIndex >= approvedPageCount - 1}
                      className="h-8 w-8 rounded-lg border border-[#E8DFE1] hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-[#5c5f60] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
              {detail.orderId && (
                <div className="px-4 pb-4 lg:hidden">
                  <OrderDetailsPanel d={detail} isMobile />
                </div>
              )}
            </div>
            <OrderDetailsPanel d={detail} />
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
                  className="bg-white border border-[#D3C3C5] rounded-md p-5 flex flex-col shadow-sm relative overflow-hidden"
                >
                  <button
                    onClick={() => handleDeleteBatch(batch)}
                    disabled={deletingBatchId === batch.id}
                    title="Delete batch"
                    className="absolute top-0 right-0 bg-[#C0392B]/10 hover:bg-[#C0392B]/20 p-2 rounded-bl-md border-b border-l border-[#D3C3C5] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <Trash2 size={16} className="text-[#C0392B]" />
                  </button>

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

                  <OrderChips
                    batch={batch}
                    tone="slate"
                    expanded={expandedBatch === batch.id}
                    onToggle={() =>
                      setExpandedBatch(
                        expandedBatch === batch.id ? null : batch.id,
                      )
                    }
                    openOrderId={openOrderId}
                    onOpen={setOpenOrderId}
                  />

                  {/* {batch.shippingThreshold && (
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
                  )} */}

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
                    <div className="flex gap-3">
                      <button
                        onClick={() => openRemoveModal(batch.id)}
                        className="flex-1 bg-white hover:bg-red-50 text-[#5C5F60] border border-[#D3C3C5] rounded-sm py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={14} /> Remove Order
                      </button>
                      <button
                        onClick={() => handleLockBatch(batch)}
                        disabled={lockingBatchId === batch.id}
                        className="flex-1 bg-[#FFD1DC]/60 hover:bg-[#FFD1DC] text-[#7A4E5B] border border-[#FFD1DC] rounded-sm py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {lockingBatchId === batch.id
                          ? "Locking..."
                          : "Lock Batch"}
                      </button>
                    </div>
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
            {lockError && (
              <div className="col-span-full bg-red-50 border border-red-300 text-red-600 text-sm font-medium rounded-md px-4 py-3">
                {lockError}
              </div>
            )}
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
                  <div className="absolute top-0 right-0 flex">
                    <button
                      onClick={() => handleUnlockBatch(batch)}
                      disabled={unlockingBatchId === batch.id}
                      title="Unlock batch"
                      className="bg-[#7A4E5B]/10 hover:bg-[#7A4E5B]/20 p-2 border-b border-l border-[#FFD1DC] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <LockKeyholeOpen size={16} className="text-[#7A4E5B]" />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch)}
                      disabled={deletingBatchId === batch.id}
                      title="Delete batch"
                      className="bg-[#C0392B]/10 hover:bg-[#C0392B]/20 p-2 rounded-bl-md border-b border-l border-[#FFD1DC] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      <Trash2 size={16} className="text-[#C0392B]" />
                    </button>
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

                  <OrderChips
                    batch={batch}
                    tone="pink"
                    expanded={expandedBatch === batch.id}
                    onToggle={() =>
                      setExpandedBatch(
                        expandedBatch === batch.id ? null : batch.id,
                      )
                    }
                    openOrderId={openOrderId}
                    onOpen={setOpenOrderId}
                  />

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
            <h3 className="text-sm lg:text-xl font-bold mb-1">
              Discount Capture Efficiency
            </h3>
            <p className="text-[#9BA1A6] text-xs lg:text-sm">
              Weekly percentage of batches hitting target tiers.
            </p>
          </div>
          <span className="bg-[#8E5E6C]/80 text-[#FFD1DC] text-[10px] font-bold px-2 py-1 tracking-wider uppercase rounded-sm">
            Live Metric
          </span>
        </div>

        <div className="flex items-end justify-center gap-2 sm:gap-4 lg:gap-6 h-40 mt-10">
          {STATIC_CHART_DATA.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-1 flex-col items-center gap-2 lg:gap-3 min-w-0"
            >
              <div
                className={`w-full max-w-[48px] sm:max-w-[64px] lg:max-w-[80px] rounded-t-sm transition-all duration-500 ease-in-out ${item.day === "FRI" ? "bg-[#8E5E6C]" : "bg-[#FFD1DC]"}`}
                style={{ height: `${item.value}%` }}
              ></div>
              <span className="text-xs text-[#9BA1A6] font-semibold">
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base lg:text-xl font-bold text-[#141D23]">
            Recent Action Log
          </h3>
          <button className="text-[#5C5F60] text-sm font-semibold hover:text-[#141D23] transition-colors">
            View Full History →
          </button>
        </div>
        <div className="bg-white border border-[#D3C3C5] rounded-md overflow-x-scroll">
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
              {logsLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-[#5C5F60]"
                  >
                    Loading activity...
                  </td>
                </tr>
              )}
              {logsError && !logsLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-red-600"
                  >
                    {logsError}
                  </td>
                </tr>
              )}
              {!logsLoading && !logsError && activityLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-[#5C5F60]"
                  >
                    No activity yet.
                  </td>
                </tr>
              )}
              {!logsLoading &&
                !logsError &&
                activityLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-[#5C5F60] whitespace-nowrap">
                      {fmtLogTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#7A4E5B] whitespace-nowrap">
                      {log.batchName}
                    </td>
                    <td className="px-6 py-4 text-[#5C5F60] whitespace-nowrap">
                      {log.agent}
                    </td>
                    <td className="px-6 py-4 text-[#141D23]">{log.action}</td>
                    <td className="px-6 py-4 text-right">
                      {log.status && (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                            LOG_STATUS_STYLES[log.status] ||
                            "bg-slate-100 text-[#5C5F60]"
                          }`}
                        >
                          {log.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Order from Batch Modal */}
      {removeModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#D3C3C5]">
              <h3 className="font-bold text-[#141D23]">
                Delete Order from {selectedBatch.id}
                {batchDetailLoading && (
                  <span className="ml-2 text-xs font-normal text-[#5C5F60]">
                    Refreshing...
                  </span>
                )}
              </h3>
              <button
                onClick={() => setRemoveModalOpen(false)}
                className="text-[#5C5F60] hover:text-[#141D23]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {removeError && (
                <p className="text-sm text-red-600">{removeError}</p>
              )}
              <div>
                <label className="block text-sm font-semibold text-[#5C5F60] mb-1">
                  Select Order to Delete
                </label>
                <select
                  className="w-full border border-[#D3C3C5] rounded p-2 text-sm text-[#141D23]"
                  value={orderIdToRemove}
                  onChange={(e) => setOrderIdToRemove(e.target.value)}
                >
                  <option value="">-- Select Order --</option>
                  {selectedBatch.orders?.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderId || order.id} -{" "}
                      {order.user || order.customerName} (
                      {countOrderItems(order)} items)
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setRemoveModalOpen(false)}
                  className="flex-1 border border-[#D3C3C5] text-[#5C5F60] py-2 rounded-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveOrder}
                  disabled={!orderIdToRemove || removeLoading}
                  className="flex-1 bg-[#C0392B] text-white py-2 rounded-sm font-medium hover:bg-[#a93226] disabled:opacity-50"
                >
                  {removeLoading ? "Removing..." : "Remove Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <OrderSummaryDrawer
        order={drawerOrder}
        onClose={() => setOpenOrderId(null)}
      />
    </div>
  );
}
