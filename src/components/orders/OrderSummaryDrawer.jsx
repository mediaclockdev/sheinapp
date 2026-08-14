import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Calendar,
  Users,
  Phone,
  MapPin,
  MessageSquare,
  Truck,
  CreditCard,
  Tag,
  ExternalLink,
} from "lucide-react";
import {
  fmtMoney,
  formatAddress,
  getInitials,
  orderCustomerName,
} from "../../lib/format";

const fmtDateTime = (v) =>
  v && !isNaN(new Date(v)) ? new Date(v).toLocaleString("en-AU") : "—";

const fmtDate = (v) =>
  v && !isNaN(new Date(v)) ? new Date(v).toLocaleDateString("en-AU") : "—";

const statusPill = (status = "") =>
  ({
    APPROVED: "bg-[#E6F4EA] text-[#0D8246]",
    REJECTED: "bg-[#FCEBEB] text-[#C0392B]",
  })[String(status).toUpperCase()] || "bg-[#FAEEDA] text-[#854F0B]";

function Row({ label, value, tone, strong }) {
  const color =
    tone === "credit"
      ? "text-green-600"
      : tone === "debit"
        ? "text-red-600"
        : "text-[#141D23]";
  return (
    <div className="flex justify-between items-center gap-3">
      <span className={strong ? "text-[#141D23] font-bold" : "text-[#5C5F60]"}>
        {label}
      </span>
      <span className={`${color} ${strong ? "font-bold" : "font-semibold"}`}>
        {value}
      </span>
    </div>
  );
}

function Fact({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-2 text-xs text-[#5C5F60]">
      <Icon size={13} className="mt-px shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-[#D3C3C5] rounded-lg p-4 space-y-2.5">
      <p className="text-xs font-bold text-[#141D23]">{title}</p>
      {children}
    </div>
  );
}

/** Right-side drawer showing one batch order in full. */
export default function OrderSummaryDrawer({ order, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!order) return null;

  const name = orderCustomerName(order);
  const items = Array.isArray(order.items) ? order.items : [];
  const address = formatAddress(order.shippingAddress);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40" aria-hidden="true" />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-[#D3C3C5] z-50 flex flex-col shadow-xl">
        <div className="px-4 py-4 flex items-start justify-between gap-3 border-b border-[#D3C3C5]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 shrink-0 rounded-full bg-[#FFD1DC] text-[#78555E] text-sm font-bold flex items-center justify-center">
              {getInitials(name)}
            </span>
            <div className="min-w-0">
              <p className="text-[#141D23] font-bold text-base truncate">
                {name}
              </p>
              <p className="text-xs text-[#5C5F60]">
                #{order.orderId || order.id} · Total{" "}
                {fmtMoney(order.grandTotal)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close order summary"
            className="text-[#5C5F60] hover:text-[#141D23] cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBF7F8]">
          <Card title="Order">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Fact icon={Calendar}>Placed {fmtDateTime(order.createdAt)}</Fact>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${statusPill(order.status)}`}
              >
                {order.status || "Pending"}
              </span>
            </div>
            <Fact icon={Truck}>
              {order.estimatedDeliveryDate &&
                `Est. delivery ${fmtDate(order.estimatedDeliveryDate)}`}
            </Fact>
            <Fact icon={CreditCard}>{order.paymentMethod}</Fact>
            <Fact icon={Tag}>{order.couponBucket}</Fact>
          </Card>

          {(order.customerPhone || address || order.customerMessage) && (
            <Card title="Customer">
              <Fact icon={Phone}>{order.customerPhone}</Fact>
              <Fact icon={MapPin}>{address}</Fact>
              <Fact icon={MessageSquare}>
                {order.customerMessage && (
                  <span className="italic">“{order.customerMessage}”</span>
                )}
              </Fact>
            </Card>
          )}

          <Card title={`Items (${items.length})`}>
            <ul className="space-y-3 pt-0.5">
              {items.map((item) => {
                // The API bills at the promotional price when there is one.
                const unit = item.promotionalPrice > 0
                  ? item.promotionalPrice
                  : item.price;
                return (
                  <li key={item.id} className="flex gap-3">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt=""
                        loading="lazy"
                        className="w-12 h-12 shrink-0 rounded object-cover border border-[#E8DFE1]"
                      />
                    ) : (
                      <span className="w-12 h-12 shrink-0 rounded bg-[#F1EFE8] border border-[#E8DFE1]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-xs text-[#141D23] line-clamp-2"
                          title={item.productName}
                        >
                          {item.productName}
                        </p>
                        <span className="text-xs font-semibold text-[#141D23] shrink-0">
                          {fmtMoney(unit * item.quantity)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#8C959F]">
                        Size: {item.size} · Color: {item.color} · Qty:{" "}
                        {item.quantity}
                      </p>
                      <p className="text-[11px] text-[#8C959F] break-all">
                        SKU: {item.skuCode}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                        {item.promotionalPrice > 0 ? (
                          <span className="text-[#0D8246]">
                            {fmtMoney(item.promotionalPrice)} ea
                            <span className="ml-1 text-[#8C959F] line-through">
                              {fmtMoney(item.price)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#5C5F60]">
                            {fmtMoney(item.price)} ea
                          </span>
                        )}
                        {item.productStatus && (
                          <span className="px-1.5 py-px rounded bg-[#F1EFE8] text-[#5F5E5A]">
                            {item.productStatus}
                          </span>
                        )}
                        {item.productUrl && (
                          <a
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#78555E] hover:underline"
                          >
                            Product <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="bg-white border border-[#D3C3C5] rounded-lg">
            <div className="p-4 space-y-2.5 text-xs">
              <p className="text-xs font-bold text-[#141D23]">Order summary</p>
              <Row label="Item subtotal" value={fmtMoney(order.itemSubtotal)} />
              {order.discountAmount > 0 && (
                <Row
                  label={`Discount (${order.discountPercentage}%)`}
                  value={`-${fmtMoney(order.discountAmount)}`}
                  tone="debit"
                />
              )}
              <Row label="Weight" value={`${order.totalWeight} KG`} />
              <Row
                label={`Shipping (${fmtMoney(order.pricePerKg)}/kg)`}
                value={fmtMoney(order.shippingFee)}
              />
              <Row label="Custom fee" value={fmtMoney(order.customFee)} />
              <Row label="Delivery fee" value={fmtMoney(order.deliveryFee)} />
              {order.serviceFee > 0 && (
                <Row label="Service fee" value={fmtMoney(order.serviceFee)} />
              )}
              {order.agentSurcharge > 0 && (
                <Row
                  label="Agent surcharge"
                  value={`+${fmtMoney(order.agentSurcharge)}`}
                  tone="credit"
                />
              )}
              {order.roundedOff !== 0 && (
                <Row
                  label="Round off"
                  value={fmtMoney(order.roundedOff)}
                  tone={order.roundedOff >= 0 ? "credit" : "debit"}
                />
              )}
            </div>
            <div className="px-4 py-3 bg-[#FFFBEB] border-t border-[#E8DFE1] rounded-b-lg flex justify-between items-center text-sm font-bold text-[#0D8246]">
              <span>Grand total</span>
              <span>{fmtMoney(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#D3C3C5] bg-white">
          <button
            onClick={() => navigate("/customers")}
            className="w-full border border-[#D3C3C5] rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm text-[#5C5F60] hover:bg-[#F9F5F6] cursor-pointer"
          >
            <Users size={16} />
            View Customer Details
          </button>
        </div>
      </aside>
    </>
  );
}
