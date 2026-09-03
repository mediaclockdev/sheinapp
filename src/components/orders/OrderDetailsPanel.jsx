import { Plus, Minus, Trash2 } from "lucide-react";
import { formatAddress } from "../../lib/format";
import approve from "../../assets/approveicon.svg";
import reject from "../../assets/rejecticon.svg";
import customermessage from "../../assets/customermessage.svg";
import { API_ORIGIN } from "../../lib/api/client";

const imageUrl = (p) =>
  !p ? null : p.startsWith("http") ? p : `${API_ORIGIN}${p}`;

/** Promo price struck through the original; just the price when there's no promo. */
const ItemPrice = ({ price, promotionalPrice }) => {
  const promo = Number(promotionalPrice) || 0;
  const full = Number(price) || 0;
  return promo > 0 && promo !== full ? (
    <div>
      <p className="font-bold text-xs text-red-600">${promo.toFixed(2)}</p>
      <p className="font-bold text-[10px] text-[#78555E] line-through">
        ${full.toFixed(2)}
      </p>
    </div>
  ) : (
    <div>
      <p className="font-bold text-xs text-[#141D23]">${full.toFixed(2)}</p>
    </div>
  );
};

/** Order detail panel. `d` is the bag returned by useOrderDetails(). */
export default function OrderDetailsPanel({ d, isMobile = false }) {
  if (!d.orderId) return null;
  return (
    <div
      className={`w-full border border-[#D3C3C5] rounded-lg ${isMobile ? "mt-3 lg:hidden" : "hidden lg:block lg:w-[40%]"}`}
    >
      <div className="px-4 py-4 flex items-start justify-between gap-1 bg-[#ECF5FE] border-b border-b-[#D3C3C5]">
        <div className="flex flex-col gap-1">
          <p className="text-[#141D23] font-normal text-lg">Order Details</p>
          <div className="flex items-center gap-3">
            <p className="text-[#78555E] font-bold text-xs">
              {d.order?.orderId || `#${d.orderId}`}
            </p>
            <p className="text-[#5C5F60] font-bold text-xs">
              {d.orderItems.length} ITEMS
            </p>
          </div>
        </div>
        <button
          onClick={d.close}
          className="text-[#5C5F60] hover:text-[#141D23] text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {d.detailLoading && (
        <p className="p-4 text-sm text-[#8C959F]">Loading order details...</p>
      )}

      {d.detailError && (
        <p className="p-4 text-sm text-red-600">{d.detailError}</p>
      )}

      {!d.detailLoading && !d.detailError && d.order && (
        <>
          {/* customer context */}
          <div className="p-4">
            <p className="text-[#5C5F60] font-bold text-xs mb-2">
              CUSTOMER CONTEXT
            </p>
            <div className="bg-[#ECF5FE] p-4 border border-[#D3C3C5]/30 rounded-lg space-y-2">
              <p className="text-[#141D23] text-base font-bold">
                {d.order.customerName}
              </p>
              <div className="space-y-2">
                <p className="text-[#5C5F60] font-normal text-xs">
                  Shipping: {formatAddress(d.order.shippingAddress)}
                </p>
                <p className="text-[#5C5F60] font-normal text-xs">
                  Phone: {d.order.customerPhone}
                </p>
              </div>
            </div>
          </div>

          {/* customer message */}
          {d.order.customerMessage && (
            <div className="p-4">
              <p className="text-[#5C5F60] font-bold text-xs mb-2">
                CUSTOMER MESSAGE
              </p>
              <div className="bg-[#FFD1DC]/10 p-4 rounded-lg border border-[#FFD1DC]/30 flex items-center gap-2">
                <img src={customermessage} alt="customer message icon" />
                <p className="text-[#4F4446] font-medium text-xs">
                  "{d.order.customerMessage}"
                </p>
              </div>
            </div>
          )}

          {/* product */}
          <div className="p-4">
            <p className="text-[#5C5F60] text-xs font-bold mb-2">
              PRODUCTS ({d.orderItems.length})
            </p>

            <div className="space-y-4">
              {d.orderItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-[#D3C3C5] rounded-xl bg-white p-4"
                >
                  {isMobile ? (
                    <>
                      {/* mobile: image + title/price row, details full-width below */}
                      <div className="flex gap-4 items-start">
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
                        <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                          <p
                            className="font-bold text-sm text-[#141D23] break-words line-clamp-2 pr-1"
                            title={item.productName}
                          >
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <ItemPrice
                              price={item.price}
                              promotionalPrice={item.promotionalPrice}
                            />
                            {d.canModerate && (
                              <button
                                onClick={() => d.handleDeleteItem(item.id)}
                                title="Remove item"
                              >
                                <Trash2
                                  size={16}
                                  className="text-[#5C5F60] hover:text-red-600"
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-[#5C5F60] text-xs font-normal">
                        <p className="break-all">SKU: {item.skuCode}</p>
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex gap-4 flex-wrap">
                            <span>Size: {item.size}</span>
                            <span>Color: {item.color}</span>
                          </div>
                          {d.canModerate ? (
                            <div className="flex items-center border border-[#D6DCE5] rounded bg-[#EEF2F8] overflow-hidden shrink-0">
                              <button
                                onClick={() =>
                                  d.handleItemQuantityChange(item.id, -1)
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
                                  d.handleItemQuantityChange(item.id, 1)
                                }
                                className="px-2 py-1 text-[#845F68] hover:bg-[#E5E7EB]"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <span className="px-4 font-bold text-[10px] text-[#141D23] border border-[#D6DCE5] rounded bg-[#EEF2F8] py-1 shrink-0">
                              Qty: {item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* desktop: original layout */
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
                          <ItemPrice
                            price={item.price}
                            promotionalPrice={item.promotionalPrice}
                          />
                          {d.canModerate && (
                            <button
                              onClick={() => d.handleDeleteItem(item.id)}
                              title="Remove item"
                            >
                              <Trash2
                                size={16}
                                className="text-[#5C5F60] hover:text-red-600"
                              />
                            </button>
                          )}
                        </div>

                        {d.canModerate ? (
                          <div className="flex items-center border border-[#D6DCE5] rounded bg-[#EEF2F8] overflow-hidden">
                            <button
                              onClick={() =>
                                d.handleItemQuantityChange(item.id, -1)
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
                                d.handleItemQuantityChange(item.id, 1)
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
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-[#E5D6D8]">
            <div className="p-4 lg:p-6">
              {/* Estimated Weight */}

              <div className="flex items-center justify-between bg-[#ECF5FE] border border-[#D9E4F2] rounded-xl px-4 py-3 mb-5">
                <span className="text-sm lg:text-base font-bold text-[#141D23]">
                  Estimated Weight
                </span>
                <div className="flex items-center gap-1.5">
                  {d.canModerate ? (
                    <div className="flex flex-col items-end">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={d.estimatedWeight}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (Number(value) > 100) {
                            d.setWeightError("Maximum weight is 100 kg.");
                            return;
                          }

                          d.setWeightError("");
                          d.setEstimatedWeight(value);

                          const newShippingCost =
                            (parseFloat(value) || 0) * d.pricePerKg;
                          const newCalculatedTotal =
                            d.baseAmount +
                            newShippingCost +
                            d.orderCustomFee +
                            d.orderDeliveryFee +
                            d.agentSurchargeAmount;
                          d.setFinalAmount(newCalculatedTotal.toFixed(2));
                        }}
                        placeholder="0"
                        className="w-17 bg-white border border-[#D9E4F2] rounded px-2 py-1 text-right text-sm lg:text-base font-bold text-[#78555E] outline-none"
                      />
                      {d.weightError && (
                        <p className="mt-2 text-xs text-red-500">
                          {d.weightError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-base font-bold text-[#78555E]">
                      {d.weightKg}
                    </span>
                  )}
                  <span className="text-sm lg:text-base font-bold text-[#78555E]">
                    KG
                  </span>
                </div>
              </div>

              {/*  Agent Discount */}

              <div className="flex items-center justify-between bg-[#ECF5FE] border border-[#D9E4F2] rounded-xl px-4 py-3 mb-5">
                <span className=" text-sm lg:text-base font-bold text-[#141D23]">
                  Agent Surcharge
                </span>
                <div className="flex items-center gap-1.5">
                  {d.canModerate ? (
                    <div className="flex flex-col items-end">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={d.agentSurcharge}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === "" || Number(value) <= d.netAmount) {
                            d.setAgentSurchargeError("");
                            d.setAgentSurcharge(value);
                            d.setFinalAmount(
                              (d.netAmount + (Number(value) || 0)).toFixed(2),
                            );
                          } else {
                            d.setAgentSurchargeError(
                              "Surcharge cannot exceed net amount.",
                            );
                          }
                        }}
                        placeholder="13"
                        className="w-17 bg-white border border-[#D9E4F2] rounded px-2 py-1 text-right text-base lg:text-base font-bold text-[#78555E] outline-none"
                      />
                      {d.agentSurchargeError && (
                        <p className="mt-1 text-[10px] text-red-500 whitespace-nowrap">
                          {d.agentSurchargeError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-base font-bold text-[#78555E]">
                      {d.agentSurchargeAmount}
                    </span>
                  )}
                  <span className="text-sm lg:text-base font-bold text-[#78555E]">
                    $
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
                    ${d.itemSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5F60]">Promotions Discount</span>
                  <span className="text-red-600 font-semibold">
                    -${d.promotionalDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-3 flex justify-between items-center">
                  <span className="text-[#141D23] font-bold">Base Amount</span>
                  <span className="text-[#141D23] font-bold">
                    ${d.baseAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5F60]">Weight</span>
                  <span className="text-[#141D23] font-semibold">
                    {d.weightKg} KG
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5F60]">Shipping Rate</span>
                  <span className="text-[#141D23] font-semibold">
                    ${d.shippingCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5F60]">Custom Fee</span>
                  <span className="text-[#141D23] font-semibold">
                    ${d.orderCustomFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5F60]">Delivery Fee</span>
                  <span className="text-[#141D23] font-semibold">
                    ${d.orderDeliveryFee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-3 flex justify-between items-center">
                  <span className="text-[#141D23] font-bold">Net Amount</span>
                  <span className="text-[#141D23] font-bold">
                    ${d.netAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C5F60]">Agent Surcharge</span>
                  <span className="text-green-600 font-semibold">
                    +${d.agentSurchargeAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Calculated Total</span>
                  <span>${d.calculatedTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Round Off</span>

                  <span
                    className={
                      d.roundOff >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {d.roundOff >= 0 ? "+" : "-"}$
                    {Math.abs(d.roundOff).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl px-3 lg:px-4 py-3">
                  <span className="text-base lg:text-lg font-bold text-[#141D23]">
                    Final Amount
                  </span>

                  {d.canModerate ? (
                    <div className="flex items-center gap-1">
                      <span className="text-base lg:text-xl font-bold text-green-600">
                        $
                      </span>
                      <input
                        type="number"
                        step="00.01"
                        min="0.01"
                        max={d.maxFinalAmount.toFixed(2)}
                        value={d.finalAmount}
                        onChange={(e) => d.setFinalAmount(e.target.value)}
                        className="w-28 bg-white border border-green-300 rounded px-2 py-1 text-right text-base lg:text-xl font-bold text-green-600 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                    </div>
                  ) : (
                    <span className="text-base lg:text-xl font-bold text-green-600">
                      ${d.finalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/*
                <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl px-3 lg:px-4 py-3 mt-4">
                  <span className="text-base lg:text-lg font-bold text-[#141D23]">
                    Total Amount
                  </span>
                  <span className="text-base lg:text-xl font-bold text-green-600">
                    ${d.calculatedTotal.toFixed(2)}
                  </span>
                </div>
                */}
            </div>

            {/* Footer Buttons */}
            {d.canModerate && (
              <div className="bg-[#EEF2F8] border-t border-[#D8DEE8] p-5 space-y-3">
                {d.statusError && (
                  <p className="text-sm text-red-600">{d.statusError}</p>
                )}
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex items-center gap-1 justify-center flex-1 h-14 rounded-xl border border-[#D3C3C5] bg-green-200 text-black font-medium shadow-md hover:opacity-90 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async () => {
                      if (await d.handleUpdateOrderStatus("APPROVED"))
                        d.close();
                    }}
                    disabled={d.statusUpdating}
                  >
                    <img src={approve} alt="" />
                    <span className="text-sm lg:text-base">Approve</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 flex-1 h-14 rounded-xl border border-[#D3C3C5] bg-[#FFFFFF] text-[#5C5F60] font-medium hover:bg-gray-50 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={d.handleRejectClick}
                    disabled={d.statusUpdating}
                  >
                    <img src={reject} alt="" />
                    <span className="text-sm lg:text-base">Reject</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
