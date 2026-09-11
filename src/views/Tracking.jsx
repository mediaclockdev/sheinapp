import React, { useState, useEffect } from "react";
import apiClient from "../lib/api/client";
import { ENDPOINTS } from "../lib/api/endpoints";
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
  Package,
  ShoppingCart,
  Layers,
  CheckCircle,
  MapPin,
} from "lucide-react";

// Mock Data

const STATUS_ICONS = {
  IN_TRANSIT: Truck,
  WAREHOUSE: Package,
  PURCHASED: ShoppingCart,
  BATCHED: Layers,
  DELIVERED: CheckCircle,
};

const TRACKING_STATUSES = [
  { value: "PURCHASED", label: "PURCHASED (Agent bought it on SHEIN)" },
  { value: "WAREHOUSE", label: "WAREHOUSE (Arrived at export warehouse)" },
  { value: "IN_TRANSIT", label: "IN_TRANSIT (On airplane/ship)" },
  { value: "ARRIVED", label: "ARRIVED (Local warehouse)" }
];

export default function Tracking() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTracking = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await apiClient.get(
        `${ENDPOINTS.batches.tracking}?statusFilter=${statusFilter}&page=${page}&limit=10`,
      );
      // Assuming res.data contains { batches: [], pagination: { total: 10, totalPages: 1 } }
      const list = res.data?.batches || res.data || res.batches || res || [];
      setData(Array.isArray(list) ? list : []);

      const total =
        (res.data?.pagination?.total ??
          res.pagination?.total ??
          res.totalCount ??
          res.total) ||
        list.length;
      const pages =
        (res.data?.pagination?.totalPages ??
          res.pagination?.totalPages ??
          Math.ceil(total / 10)) ||
        1;

      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.message || "Failed to fetch tracking data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [statusFilter, page]);
  const [selectedRows, setSelectedRows] = useState(["PX-89910023"]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  
  const [updateStatus, setUpdateStatus] = useState("PURCHASED");
  const [updateNote, setUpdateNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    if (!activeItem) return;
    setIsUpdating(true);
    const batchId = activeItem.batchId || activeItem.id;
    try {
      await apiClient.patch(ENDPOINTS.batches.trackingStatus(batchId), {
        newStatus: updateStatus,
        trackingNotes: updateNote
      });
      setUpdateNote("");
      handleManage(activeItem); // Refresh history
      fetchTracking();          // Refresh main list
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // New state for tracking detail modal
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const toggleRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };




  const handleManage = async (item) => {
    setActiveItem(item);
    setIsModalOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setTrackingHistory([]);
    
    // Attempt to get the batch ID. Usually tracking items are batches, but sometimes they map ID.
    const batchId = item.batchId || item.id;
    
    try {
      const { data: res } = await apiClient.get(ENDPOINTS.batches.trackingDetail(batchId));
      // Map based on typical shapes. If your backend returns `res.data` or `res.tracking`
      const historyList = res.data?.history || res.data || res.history || res || [];
      setTrackingHistory(Array.isArray(historyList) ? historyList : []);
    } catch (err) {
      setHistoryError(err.message || "Failed to load tracking details");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-[#f8fbff] min-h-[calc(100vh-70px)] font-sans">
      {/* Top Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-end md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 w-40 focus:outline-none focus:border-gray-400"
            >
              <option value="ALL">All Statuses</option>
              {TRACKING_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:outline-none focus:border-gray-400"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full md:w-auto">
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => fetchTracking()}
            className="px-4 py-2 bg-[#ffc6d8] hover:bg-[#ffb5cd] text-[#704154] rounded text-sm font-semibold transition-colors w-full md:w-auto"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#f0f4f8] rounded-t-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm font-semibold text-gray-600 bg-[#e8eef4]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#7a4e5b] focus:ring-[#7a4e5b]"
                  />
                </th>
                <th className="p-4">Tracking ID</th>
                <th className="p-4">Batch ID</th>
                <th className="p-4">Orders in Batch</th>
                <th className="p-4">Total Value</th>
                <th className="p-4">Last Update</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    Loading tracking data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No tracking data found
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => {
                  const id = item.trackingId || idx;
                  const batchId = item.batchId || item.id || "-";
                  const orders = item.totalOrders || 0;
                  const totalValue = item.totalValue || item.value || "-";
                  const lastUpdate = item.lastUpdate || item.updatedAt || "-";
                  const statusStr = item.status || "PENDING";

                  const isSelected = selectedRows.includes(id);
                  const IconComponent =
                    STATUS_ICONS[statusStr.toUpperCase()] || Package;
                  return (
                    <tr
                      key={id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="rounded border-gray-300 text-[#7a4e5b] focus:ring-[#7a4e5b]"
                        />
                      </td>
                      <td className="p-4 font-semibold text-gray-800">{id}</td>
                      <td className="p-4 text-gray-600">{batchId}</td>
                      <td className="p-4 text-gray-800 font-medium">
                        {orders} orders
                      </td>
                      <td className="p-4 text-gray-600">{totalValue}</td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(lastUpdate).toLocaleDateString() ===
                        "Invalid Date"
                          ? lastUpdate
                          : new Date(lastUpdate).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-800 font-semibold">
                          <IconComponent size={18} className="text-gray-500" />
                          {statusStr.replace("_", " ")}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleManage(item)}
                          className="inline-flex items-center gap-1.5 font-bold text-[#7a4e5b] hover:text-[#5a3641] text-sm px-3 py-1.5 rounded hover:bg-[#ffc6d8]/20 transition-colors"
                        >
                          <ExternalLink size={16} /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-[#f8fbff] flex items-center justify-between border-t border-gray-200">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalCount)}{" "}
            of {totalCount} results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 bg-white disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="px-3 py-1 border border-[#7a4e5b] bg-[#ffc6d8]/20 text-[#7a4e5b] font-semibold rounded">
              {page}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 bg-white disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#704154]">
                  Batch Detail
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Batch #{activeItem?.batchId} | {activeItem?.orders} Total
                  Items
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {/* Status Update Form */}
              <div className="bg-[#f0f4f8] border border-[#d6e0ea] rounded-xl p-5 mb-8">
                <h3 className="text-xs font-bold text-gray-700 tracking-wider mb-4 uppercase">
                  Manual Status Update
                </h3>
                <div className="space-y-4">
                  <select 
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-gray-800 bg-white focus:outline-none focus:border-gray-400 font-medium">
                    {TRACKING_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  
                  <textarea 
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 min-h-[100px]"
                    placeholder="Ex- Your order is being processed, Shipped to Dubai"
                  ></textarea>

                  <button 
                    onClick={handleUpdateStatus}
                    disabled={isUpdating}
                    className="w-full bg-[#ffc6d8] hover:bg-[#ffb5cd] text-[#704154] font-bold py-3 rounded-md transition-colors disabled:opacity-50">
                    {isUpdating ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>

              {/* Tracking History */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 tracking-wider mb-6 uppercase">
                  Tracking History
                </h3>

                <div className="relative pl-3">
                  {/* Vertical Line */}
                  <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gray-200"></div>

                  <div className="space-y-6">
                    {historyLoading ? (
                      <div className="text-sm text-gray-500 py-4">Loading history...</div>
                    ) : historyError ? (
                      <div className="text-sm text-red-500 py-4">{historyError}</div>
                    ) : trackingHistory.length === 0 ? (
                      <div className="text-sm text-gray-500 py-4">No tracking history found.</div>
                    ) : (
                      trackingHistory.map((hist, index) => {
                        // Support various date fields (date/time separate or single timestamp)
                        const d = hist.timestamp || hist.date || hist.updatedAt;
                        const dateObj = d ? new Date(d) : null;
                        const dateStr = dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : hist.date || "";
                        const timeStr = dateObj ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : hist.time || "";
                        
                        return (
                        <div
                          key={hist.id || index}
                          className="relative flex items-start gap-4 z-10"
                        >
                          {/* Dot */}
                          <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center border-4 border-white shadow-sm mt-0.5 z-10 shrink-0 mx-auto ml-1"></div>
  
                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-gray-900 text-sm">
                                {hist.status || "Update"}
                              </h4>
                              <div className="text-right text-xs text-gray-500">
                                <div>{dateStr}</div>
                                <div>{timeStr}</div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 pr-12">
                              {hist.description || hist.message || ""}
                            </p>
                          </div>
                        </div>
                      )})
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
