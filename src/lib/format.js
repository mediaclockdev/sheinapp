import { API_ORIGIN } from "./api/client";

// Uploaded paths come back relative ("/uploads/..."); anything already absolute
// is left alone.
export const imageUrl = (p) =>
  !p ? null : p.startsWith("http") ? p : `${API_ORIGIN}${p}`;

export const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "NA";

export const orderCustomerName = (order = {}) =>
  order.user || order.customerName || order.customer?.fullName || "Unknown";

/** Shipping addresses arrive as a JSON string, an array, or a plain object. */
export const formatAddress = (addr) => {
  if (typeof addr === "string") {
    try {
      addr = JSON.parse(addr);
    } catch {
      return addr; // plain text address
    }
  }
  if (Array.isArray(addr)) addr = addr[0]?.dataaddress || addr[0];
  if (!addr || typeof addr !== "object") return addr ?? "";
  return [addr.addressLine, addr.city, addr.state, addr.zipCode]
    .filter(Boolean)
    .join(", ");
};
