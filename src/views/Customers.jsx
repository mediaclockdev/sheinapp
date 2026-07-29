import { useState } from "react";
import {
  UserPlus,
  Pencil,
  MoreVertical,
  MapPin,
  Phone,
  Star,
} from "lucide-react";

const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: "Elena Rodriguez",
    avatar: "https://i.pravatar.cc/150?img=47",
    email: "elena.r@example.com",
    phone: "+1 555-0102",
    orders: 42,
    ltv: 12450.0,
    rating: 5,
    lastActive: "2 hours ago",
    membership: "VIP Member",
    since: "Jan 2025",
    address: "742 Evergreen Terrace, Springfield, OR 97403",
    orderHistory: [
      {
        id: "ORD-90210",
        date: "Oct 24, 2023",
        items: 3,
        value: 450.0,
        status: "DELIVERED",
      },
      {
        id: "ORD-88541",
        date: "Oct 18, 2023",
        items: 1,
        value: 1200.0,
        status: "BATCHED",
      },
      {
        id: "ORD-87122",
        date: "Oct 12, 2023",
        items: 5,
        value: 340.5,
        status: "PURCHASED",
      },
      {
        id: "ORD-86001",
        date: "Oct 05, 2023",
        items: 2,
        value: 89.0,
        status: "DELIVERED",
      },
    ],
  },
  {
    id: 2,
    name: "Jameson Wu",
    avatar: "https://i.pravatar.cc/150?img=12",
    email: "j.wu@techmail.com",
    phone: "+1 555-0198",
    orders: 15,
    ltv: 4120.5,
    rating: 4,
    lastActive: "Yesterday",
    membership: "Member",
    since: "Mar 2025",
    address: "18 Harbor View Rd, Seattle, WA 98101",
    orderHistory: [
      {
        id: "ORD-90188",
        date: "Oct 20, 2023",
        items: 2,
        value: 210.0,
        status: "DELIVERED",
      },
      {
        id: "ORD-89012",
        date: "Oct 09, 2023",
        items: 1,
        value: 640.5,
        status: "PURCHASED",
      },
    ],
  },
  {
    id: 3,
    name: "Sarah Jenkins",
    avatar: "https://i.pravatar.cc/150?img=32",
    email: "s.jenkins@web.io",
    phone: "+44 20 7946 0111",
    orders: 8,
    ltv: 1890.0,
    rating: 3,
    lastActive: "3 days ago",
    membership: "Member",
    since: "Jun 2025",
    address: "12 Baker Street, London, NW1 6XE",
    orderHistory: [
      {
        id: "ORD-88870",
        date: "Sep 30, 2023",
        items: 1,
        value: 1890.0,
        status: "PURCHASED",
      },
    ],
  },
  {
    id: 4,
    name: "Marcus Thorne",
    avatar: "https://i.pravatar.cc/150?img=15",
    email: "marcus.t@design.com",
    phone: "+1 555-0144",
    orders: 29,
    ltv: 8700.25,
    rating: 4,
    lastActive: "1 week ago",
    membership: "VIP Member",
    since: "Nov 2024",
    address: "88 Riverside Dr, Austin, TX 73301",
    orderHistory: [
      {
        id: "ORD-84450",
        date: "Sep 22, 2023",
        items: 4,
        value: 720.25,
        status: "DELIVERED",
      },
      {
        id: "ORD-83210",
        date: "Sep 10, 2023",
        items: 2,
        value: 199.0,
        status: "DELIVERED",
      },
    ],
  },
];

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

const formatLtvShort = (value) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
};

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
  const [customers] = useState(MOCK_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    MOCK_CUSTOMERS[0]?.id,
  );

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

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
            <button className="shrink-0 flex items-center justify-center gap-2 bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#7A4E5B] border border-[#D3C3C5] px-4 py-2.5 rounded-sm text-sm font-bold transition-colors">
              <UserPlus size={16} /> Add Customer
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
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? "bg-[#FFD1DC]/20"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 lg:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                          <span className="font-semibold text-[#141D23] whitespace-nowrap">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-[#5C5F60] whitespace-nowrap">
                        <div>{customer.email}</div>
                        <div>{customer.phone}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-[#141D23]">
                        {customer.orders}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-[#141D23] whitespace-nowrap">
                        {formatCurrency(customer.ltv)}
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <StarRating rating={customer.rating} />
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-[#5C5F60] whitespace-nowrap">
                        {customer.lastActive}
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
                <img
                  src={selectedCustomer.avatar}
                  alt={selectedCustomer.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#FFD1DC]"
                />
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-[#D3C3C5] rounded text-[#5C5F60] hover:bg-slate-50 transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button className="p-2 border border-[#D3C3C5] rounded text-[#5C5F60] hover:bg-slate-50 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#141D23] mt-4">
                {selectedCustomer.name}
              </h2>
              <p className="text-sm text-[#5C5F60]">
                {selectedCustomer.membership} &bull; Since{" "}
                {selectedCustomer.since}
              </p>

              <div className="border-t border-[#D3C3C5] my-4"></div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-[#141D23]">
                  <MapPin size={16} className="text-[#5C5F60] mt-0.5 shrink-0" />
                  <span>{selectedCustomer.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-[#141D23]">
                  <Phone size={16} className="text-[#5C5F60] shrink-0" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-50 border border-[#D3C3C5] rounded-md p-3">
                  <p className="text-[10px] font-bold text-[#5C5F60] tracking-wider uppercase">
                    Total Orders
                  </p>
                  <p className="text-xl font-extrabold text-[#141D23] mt-1">
                    {selectedCustomer.orders}
                  </p>
                </div>
                <div className="bg-slate-50 border border-[#D3C3C5] rounded-md p-3">
                  <p className="text-[10px] font-bold text-[#5C5F60] tracking-wider uppercase">
                    Total LTV
                  </p>
                  <p className="text-xl font-extrabold text-[#141D23] mt-1">
                    {formatLtvShort(selectedCustomer.ltv)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 bg-[#FFD1DC] hover:bg-[#FFD1DC]/80 text-[#7A4E5B] border border-[#D3C3C5] rounded-sm py-2.5 text-sm font-bold transition-colors">
                  Contact Customer
                </button>
                <button className="flex-1 bg-white hover:bg-slate-50 text-[#141D23] border border-[#D3C3C5] rounded-sm py-2.5 text-sm font-bold transition-colors">
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
                {selectedCustomer.orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="border border-[#D3C3C5] rounded-md p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#141D23]">
                        #{order.id}
                      </p>
                      <p className="text-xs text-[#5C5F60] mt-0.5">
                        {order.date} &bull; {order.items} items
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-[#141D23]">
                        {formatCurrency(order.value)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${STATUS_STYLES[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {selectedCustomer.orderHistory.length === 0 && (
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
