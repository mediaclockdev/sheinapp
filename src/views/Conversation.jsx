import React, { useEffect, useState } from "react";
import axios from "axios";
import { Filter, ArrowUpDown } from "lucide-react";
import ActiveChat from "./ActiveChat";

const Conversation = () => {
  const [inboxList, setInboxList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatInfo, setActiveChatInfo] = useState(null);

  async function fetchInbox() {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "https://shelynx.mediaclocksoft.com.au/api/chat/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setInboxList(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch inbox", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInbox();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((new Date() - date) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes || 1}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (activeChatInfo) {
    return (
      <div className="p-6 max-w-6xl mx-auto w-full">
        <ActiveChat
          conversationId={activeChatInfo.id}
          chatPartner={activeChatInfo.chatPartner}
          onBack={() => setActiveChatInfo(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      {/* Header Section matching your design */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Inbox</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and respond to recent customer inquiries
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            <ArrowUpDown size={16} /> Sort
          </button>
        </div>
      </div>
      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* Very light blue header row matching your screenshot */}
            <tr className="bg-[#f8faff] border-b border-blue-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Last Message</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  Loading conversations...
                </td>
              </tr>
            ) : inboxList.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No active conversations.
                </td>
              </tr>
            ) : (
              inboxList.map((chat) => (
                <tr
                  key={chat.id}
                  className="hover:bg-pink-50/30 transition-colors group"
                >
                  {/* Customer Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          chat.chatPartner?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${chat.chatPartner?.name}`
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                      />
                      <div className="font-medium text-gray-900 text-sm">
                        {chat.chatPartner?.name || "N/A"}
                      </div>
                    </div>
                  </td>
                  {/* Last Message Column */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {chat.lastMessage?.content || "No messages yet"}
                    </div>
                  </td>
                  {/* Timestamp & Unread Badge Column */}
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      {formatTime(
                        chat.lastMessage?.createdAt || chat.updatedAt,
                      )}

                      {/* Show unread count if it exists from your API */}
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                          {chat.unreadCount} NEW
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Action Column */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setActiveChatInfo(chat)}
                      className="text-sm font-medium text-pink-600 hover:text-pink-800"
                    >
                      View Chat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Conversation;
