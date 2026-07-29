import { useState, useEffect } from "react";
import {
  UserPlus,
  Pencil,
  MoreVertical,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { handleUnauthorized, isUnauthorized } from "../lib/sessionExpiry";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const CUSTOMERS_API_URL = `${API_BASE_URL}/api/customers`;

const STATUS_STYLES = {
  DELIVERED: "bg-[#E6F4EA] text-[#0D8246]",
  BATCHED: "bg-[#FFF4E0] text-[#B5820A]",
  PURCHASED: "bg-slate-100 text-[#5C5F60]",
};

const formatCurrency = (value) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, idx) => (
      <Star
        key={idx}
        size={14}
        className={
          idx < rating
            ? "fill-[#7A4E5B] text-[#7A4E5B]"
            : "fill-none text-[#D3C3C5]"
        }
      />
    ))}
  </div>
);

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDisabled, setIsDisabled] = useState(true);

  const handleFetchCustomer = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(CUSTOMERS_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (isUnauthorized(response.status)) {
        handleUnauthorized();
        return;
      }
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch customers");
      const list = result.data || result.customers || result || [];
      console.log("Customers fetched:", list);
      const customers = Array.isArray(list) ? list : [];

      setCustomers(customers);

      if (customers.length > 0) {
        fetchCustomerDetails(customers[0].id);
      }
    } catch (err) {
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchCustomer();
  }, []);

  const fetchCustomerDetails = async (id) => {
    if (!id) return;

    setDetailLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${CUSTOMERS_API_URL}/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (isUnauthorized(response.status)) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setSelectedCustomer(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };
  const formatLastActive = (date) => {
    if (!date) return "N/A";

    const now = new Date();
    const lastActive = new Date(date);

    const diff = now - lastActive;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    return `${days} day${days > 1 ? "s" : ""} ago`;
  };
  const getInitials = (name = "") => {
    return name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  return (
    <div className="p-4 lg:p-8 bg-[#FFD1DC]/10 min-h-[calc(100vh-70px)] font-sans">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Directory Table */}
        <div className="w-full lg:flex-1 min-w-0 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-[#141D23]">
                Customer Directory
              </h1>
              <p className="text-sm text-[#5C5F60] mt-1">
                Manage and track your proxy shopping client.
              </p>
            </div>
            <button
              disabled={isDisabled}
              className={`shrink-0 flex items-center justify-center gap-2 border px-4 py-2.5 rounded-sm text-sm font-bold transition-colors ${
                isDisabled
                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
                  : "bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#7A4E5B] border-[#D3C3C5]"
              }`}
            >
              <UserPlus size={16} />
              Add Customer
            </button>
          </div>

          <div className="bg-white border border-[#D3C3C5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#E8ECEF] text-[#5C5F60] text-xs">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 font-bold tracking-wide">
                      Customer Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 font-bold tracking-wide">
                      Contact
                    </th>
                    <th className="px-4 lg:px-6 py-3 font-bold tracking-wide">
                      Orders
                    </th>
                    <th className="px-4 lg:px-6 py-3 font-bold tracking-wide">
                      LTV
                    </th>
                    <th className="px-4 lg:px-6 py-3 font-bold tracking-wide">
                      Rating
                    </th>
                    <th className="px-4 lg:px-6 py-3 font-bold tracking-wide">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D3C3C5]">
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 lg:px-6 py-6 text-center text-[#5C5F60]"
                      >
                        Loading customers...
                      </td>
                    </tr>
                  )}
                  {error && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 lg:px-6 py-6 text-center text-red-600"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && customers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 lg:px-6 py-6 text-center text-[#5C5F60]"
                      >
                        No customers found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    customers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => {
                          fetchCustomerDetails(customer.id);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id
                            ? "bg-[#FFD1DC]/20"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 lg:px-6 py-3">
                          <div className="flex items-center gap-3">
                            {customer.avatar ? (
                              <img
                                src={customer.avatar}
                                alt={customer.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#FFD1DC] text-[#7A4E5B] flex items-center justify-center font-bold shrink-0">
                                {getInitials(customer.name)}
                              </div>
                            )}

                            <span className="font-semibold text-[#141D23] whitespace-nowrap">
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-[#5C5F60] whitespace-nowrap">
                          <div>{customer.email}</div>
                          <div>
                            <p>
                              {customer.countryCode}{" "}
                              <span>{customer.phone}</span>
                            </p>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-[#141D23]">
                          {customer.ordersCount}
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-[#141D23] whitespace-nowrap">
                          {customer.lifetimeValue}
                        </td>
                        <td className="px-4 lg:px-6 py-3">
                          <StarRating rating={customer.rating} />
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-[#5C5F60] whitespace-nowrap">
                          {formatLastActive(customer.lastActive)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Customer Detail Panel */}
        {selectedCustomer && (
          <div className="w-full lg:w-[420px] shrink-0 space-y-6">
            <div className="bg-white border border-[#D3C3C5] rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {selectedCustomer.avatar ? (
                      <img
                        src={selectedCustomer.avatarUrl}
                        alt={selectedCustomer.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#FFD1DC] text-[#7A4E5B] flex items-center justify-center font-bold shrink-0">
                        {getInitials(selectedCustomer.name)}
                      </div>
                    )}

                    <span className="font-semibold text-[#141D23] whitespace-nowrap">
                      {selectedCustomer.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isDisabled}
                    className={`p-2 border border-[#D3C3C5] rounded text-[#5C5F60] hover:bg-slate-50 transition-colors
                    ${isDisabled ? "cursor-not-allowed" : ""}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    disabled={isDisabled}
                    className={`p-2 border border-[#D3C3C5] rounded text-[#5C5F60] hover:bg-slate-50 transition-colors
 ${isDisabled ? "cursor-not-allowed" : ""}`}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#141D23] mt-4">
                {selectedCustomer.name}
              </h2>
              <p className="text-sm text-[#5C5F60]">
                {/* {selectedCustomer.isVip} */}
                Since {/* {selectedCustomer.joinedAt} */}
                {formatLastActive(selectedCustomer.joinedAt)}
              </p>

              <div className="border-t border-[#D3C3C5] my-4"></div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-[#141D23]">
                  <MapPin
                    size={16}
                    className="text-[#5C5F60] mt-0.5 shrink-0"
                  />
                  <span>
                    <span>
                      {selectedCustomer.defaultAddress
                        ? `${selectedCustomer.defaultAddress.addressLine}, ${selectedCustomer.defaultAddress.city}, ${selectedCustomer.defaultAddress.state} ${selectedCustomer.defaultAddress.zipCode}`
                        : "No address on file"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-[#141D23]">
                  <Phone size={16} className="text-[#5C5F60] shrink-0" />
                  <span>{selectedCustomer.countryCode}</span>
                  <span>{selectedCustomer.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-50 border border-[#D3C3C5] rounded-md p-3">
                  <p className="text-[10px] font-bold text-[#5C5F60] tracking-wider uppercase">
                    Total Orders
                  </p>
                  <p className="text-xl font-extrabold text-[#141D23] mt-1">
                    {selectedCustomer.stats?.totalOrders}
                  </p>
                </div>
                <div className="bg-slate-50 border border-[#D3C3C5] rounded-md p-3">
                  <p className="text-[10px] font-bold text-[#5C5F60] tracking-wider uppercase">
                    Total LTV
                  </p>
                  <p className="text-xl font-extrabold text-[#141D23] mt-1">
                    {selectedCustomer.stats?.totalLtv}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  disabled={isDisabled}
                  className={`flex-1 bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#7A4E5B] border border-[#D3C3C5] rounded-sm py-2.5 text-sm font-bold transition-colors
                  ${
                    isDisabled
                      ? " text-gray-500 border-gray-300 cursor-not-allowed opacity-60"
                      : "bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#7A4E5B] border-[#D3C3C5]"
                  }`}
                >
                  Contact Customer
                </button>
                <button
                  disabled={isDisabled}
                  className={`flex-1 bg-white hover:bg-slate-50 text-[#141D23] border border-[#D3C3C5] rounded-sm py-2.5 text-sm font-bold transition-colors
   ${
     isDisabled
       ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60"
       : "bg-white hover:bg-slate-50 text-[#141D23] border-[#D3C3C5]"
   }`}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D3C3C5] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#141D23] text-sm">
                  Order History
                </h3>
                <button className="text-xs font-semibold text-[#7A4E5B] hover:text-[#5C3846] transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {(selectedCustomer.recentOrders ?? []).map((order) => (
                  <div
                    key={order.id}
                    className="border border-[#D3C3C5] rounded-md p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#141D23] truncate">
                        #{order.orderId}
                      </p>
                      <p className="text-xs text-[#5C5F60] mt-0.5 truncate">
                        {formatLastActive(order.date)}&bull; {order.itemCount}{" "}
                        items
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-[#141D23]">
                        {formatCurrency(order.grandTotal ?? 0)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          STATUS_STYLES[order.status] ??
                          "bg-slate-100 text-[#5C5F60]"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(selectedCustomer.recentOrders ?? []).length === 0 && (
                  <p className="text-sm text-[#5C5F60] text-center py-4">
                    No orders yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
