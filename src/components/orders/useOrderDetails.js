import { useState, useEffect } from "react";
import { handleUnauthorized, isUnauthorized } from "../../lib/sessionExpiry";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const ORDERS_API_URL = `${API_BASE_URL}/api/orders`;
const ORDER_DETAIL_API_URL = `${API_BASE_URL}/api/orders`;
const SETTINGS_API_URL = `${API_BASE_URL}/api/settings`;

/**
 * Owns everything the order detail panel needs: fetching an order, editing its
 * items, pricing math and approve/reject. Shared by Order Management and the
 * Batch Queue's approved orders table.
 */
export default function useOrderDetails({ onUpdated, onSuccess } = {}) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [canModerate, setCanModerate] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [weightError, setWeightError] = useState("");
  const [agentSurchargeError, setAgentSurchargeError] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  // Pricing settings (price per kg + discount tiers) loaded once from the API
  const [settings, setSettings] = useState({
    pricePerKg: 0,
    discountRules: [],
    deliveryfee: 0,
    customfee: 0,
  });
  const [estimatedWeight, setEstimatedWeight] = useState("");
  const [agentSurcharge, setAgentSurcharge] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(SETTINGS_API_URL, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (isUnauthorized(res.status)) {
          handleUnauthorized();
          return Promise.reject(res.status);
        }
        return res.ok ? res.json() : Promise.reject(res.status);
      })
      .then(({ data }) =>
        setSettings({
          pricePerKg: Number(data?.pricePerKg) || 0,
          discountRules: data?.discountRules || [],
          deliveryfee: Number(data?.deliveryfee ?? data?.deliveryFee) || 0,
          customfee: Number(data?.customfee ?? data?.customFee) || 0,
        }),
      )
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  // `order` lets a caller hand over an order it already has in full (the
  // approved-orders list embeds items + customer), skipping the extra fetch.
  const handleViewOrder = async (id, { moderate = false, order } = {}) => {
    if (!id) return;
    setSelectedOrderId(id);
    setSelectedOrder(null);
    setEstimatedWeight("");
    setAgentSurcharge("");
    setFinalAmount("");
    setCanModerate(moderate);
    setStatusError(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      if (order) {
        seedOrder(order);
        return;
      }
      const token = localStorage.getItem("token");

      const response = await fetch(`${ORDER_DETAIL_API_URL}/${id}`, {
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
        throw new Error(result.message || "Failed to fetch order details");

      seedOrder(result.data || result);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const seedOrder = (order) => {
    setSelectedOrder(order);
    if (order?.totalWeight != null && parseFloat(order.totalWeight) > 0) {
      setEstimatedWeight(String(order.totalWeight));
    } else if (
      order?.estimatedWeight != null &&
      parseFloat(order.estimatedWeight) > 0
    ) {
      setEstimatedWeight(String(order.estimatedWeight));
    } else {
      const items = order?.items || [];
      const totalW = items.reduce(
        (sum, item) =>
          sum + (parseFloat(item.weight) || 0) * (Number(item.quantity) || 1),
        0,
      );
      setEstimatedWeight(String(totalW));
    }
    if (order?.agentSurcharge != null) {
      setAgentSurcharge(String(order.agentSurcharge));
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
      const currentItems = prev.items || prev.products || [];
      const items = currentItems.map((item) =>
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
      const currentItems = prev.items || prev.products || [];
      const items = currentItems.filter((item) => item.id !== itemId);
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

    if (isUnauthorized(response.status)) {
      handleUnauthorized();
      return;
    }
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
    if (parseFloat(estimatedWeight) > 100) {
      setStatusError("Estimated weight cannot exceed 100 kg.");
      return;
    }

    if (Number(agentSurcharge) > netAmount) {
      setStatusError("Agent surcharge cannot exceed the net amount.");
      return;
    }

    if (newStatus === "APPROVED" && canModerate) {
      if (!(Number(finalAmount) > 0)) {
        setStatusError("Final amount must be greater than $0.");
        return;
      }
      if (Number(finalAmount) > maxFinalAmount) {
        setStatusError(
          `Final amount cannot exceed $${maxFinalAmount.toFixed(2)} (120% of calculated total).`,
        );
        return;
      }
    }
    setStatusUpdating(true);
    setStatusError(null);
    try {
      const token = localStorage.getItem("token");

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
              ? {
                  estimatedWeight: parseFloat(estimatedWeight) || 0,
                  agentSurcharge: Number(agentSurcharge) || 0,
                  roundedOff: Number(roundOff.toFixed(2)),
                }
              : {}),
          }),
        },
      );

      if (isUnauthorized(response.status)) {
        handleUnauthorized();
        return false;
      }
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to update order status");

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              ...(newStatus === "APPROVED"
                ? {
                    totalWeight: parseFloat(estimatedWeight),
                    agentSurcharge: Number(agentSurcharge) || 0,
                  }
                : {}),
            }
          : prev,
      );
      onSuccess?.(
        newStatus === "APPROVED"
          ? "Order approved successfully!"
          : "Order rejected successfully!",
      );
      onUpdated?.();
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

  // The order carries the rates it was priced with; fall back to the current
  // settings for orders that don't have them yet (e.g. still WAITING).
  const rate = (onOrder, fallback) =>
    Number(onOrder) > 0 ? Number(onOrder) : Number(fallback) || 0;

  const orderCustomFee = rate(selectedOrder?.customFee, settings.customfee);
  const orderDeliveryFee = rate(
    selectedOrder?.deliveryFee,
    settings.deliveryfee,
  );
  const pricePerKg = rate(selectedOrder?.pricePerKg, settings.pricePerKg);

  const weightKg = parseFloat(estimatedWeight) || 0;
  const promotionalDiscount =
    Number(selectedOrder?.totalPromotionalDiscount) || 0;

  const itemSubtotal =
    (selectedOrder?.items || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0,
    ) ||
    Number(selectedOrder?.itemSubtotal) ||
    0;

  const shippingCost = weightKg * pricePerKg;

  const baseAmount = itemSubtotal - promotionalDiscount;

  const netAmount =
    baseAmount + shippingCost + orderCustomFee + orderDeliveryFee;

  const agentSurchargeAmount = Number(agentSurcharge) || 0;

  const calculatedTotal = netAmount + agentSurchargeAmount;

  const maxFinalAmount = calculatedTotal * 1.2;

  const finalPrice = Number(finalAmount) || calculatedTotal;

  const roundOff = finalPrice - calculatedTotal;

  // Re-seed finalAmount whenever a new order finishes loading (fresh object
  // reference each fetch), so it never carries over from the previous order
  // and never relies on the input's placeholder for its real value.
  useEffect(() => {
    if (!selectedOrder) return;
    setFinalAmount(
      selectedOrder.grandTotal != null
        ? String(selectedOrder.grandTotal)
        : selectedOrder.finalAmount != null
          ? String(selectedOrder.finalAmount)
          : calculatedTotal.toFixed(2),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder]);

  const orderItems = selectedOrder?.items || [];

  return {
    orderId: selectedOrderId,
    order: selectedOrder,
    orderItems,
    detailLoading,
    detailError,
    canModerate,
    statusUpdating,
    statusError,
    weightError,
    agentSurchargeError,
    settings,
    estimatedWeight,
    setEstimatedWeight,
    setWeightError,
    agentSurcharge,
    setAgentSurcharge,
    setAgentSurchargeError,
    finalAmount,
    setFinalAmount,
    openOrder: handleViewOrder,
    close: closeOrderDetails,
    handleItemQuantityChange,
    handleDeleteItem,
    handleUpdateOrderStatus,
    handleRejectClick,
    orderCustomFee,
    orderDeliveryFee,
    pricePerKg,
    weightKg,
    promotionalDiscount,
    itemSubtotal,
    shippingCost,
    baseAmount,
    netAmount,
    agentSurchargeAmount,
    calculatedTotal,
    maxFinalAmount,
    finalPrice,
    roundOff,
  };
}
