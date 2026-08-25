import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import apiClient, { API_ORIGIN } from "../lib/api/client";
import { ENDPOINTS } from "../lib/api/endpoints";
import {
  Plus,
  Send,
  Smile,
  ArrowLeft,
  FileText,
  X,
  Check,
  CheckCheck,
  Image as ImageIcon,
  File,
  MessageSquarePlus,
  Search,
  Download,
  ZoomIn,
  ZoomOut,
  MoreVertical,
  Trash2,
  ListChecks,
  Eraser,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useSocket } from "../hooks/useSocket";
import { notificationToast } from "../components/NotificationToast";

const relativeTime = (dateString) => {
  if (!dateString) return "";
  const diffInMinutes = Math.floor((new Date() - new Date(dateString)) / 60000);
  if (diffInMinutes < 60) return `${diffInMinutes || 1}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const clockTime = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

const renderInboxMessage = (msg) => {
  if (!msg) return "No messages yet";
  if (msg.messageType === "IMAGE") return "📷 Photo";
  if (msg.messageType === "VIDEO") return "🎥 Video";
  if (msg.messageType === "AUDIO") return "🎵 Voice Message";
  if (msg.messageType === "DOCUMENT" || msg.messageType === "FILE")
    return "📄 Document";
  return msg.content;
};

const resolveAvatarUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
};

const Avatar = ({ name, avatarUrl }) => (
  <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200 overflow-hidden shadow-sm border border-black/5">
    <img
      src={
        resolveAvatarUrl(avatarUrl) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "")}`
      }
      alt={name || "User"}
      className="h-full w-full object-cover"
    />
  </div>
);

const generateDownloadName = (message, defaultExtension) => {
  if (message.originalFileName) return message.originalFileName;

  const date = new Date(message.createdAt || new Date());
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} at ${String(date.getHours()).padStart(2, "0")}.${String(date.getMinutes()).padStart(2, "0")}.${String(date.getSeconds()).padStart(2, "0")}`;

  let ext = defaultExtension;
  if (typeof message.content === "string") {
    const parts = message.content.split(".");
    if (parts.length > 1) {
      const lastPart = parts.pop();
      if (lastPart.length <= 4 && !lastPart.includes("/")) {
        ext = lastPart;
      }
    }
  }
  return `WhatsApp Image ${formattedDate}.${ext}`;
};

const Conversations = () => {
  const location = useLocation();
  const { socket } = useSocket();
  const [threads, setThreads] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [previewMessage, setPreviewMessage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fileAccept, setFileAccept] = useState("*/*");

  const handleDownload = async (url, filename, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Fetch the file as a blob to bypass cross-origin download restrictions
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, falling back to new tab:", err);
      window.open(url, "_blank");
    }
  };

  // File Preview Modal state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");

  // New Message Modal state
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersLoading, setCustomersLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // New Chat deletion state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Sidebar Bulk Clear States ---
  const [sidebarSelectionMode, setSidebarSelectionMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputBarRef = useRef(null);

  const active = threads.find((c) => c.id === activeId);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputBarRef.current && !inputBarRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.state?.conversationId) {
      openChat(location.state.conversationId);
      // Optional: Clear state to avoid reopening if user navigates back later
      window.history.replaceState({}, document.title);
    } else if (location.state?.customerId) {
      startConversation(location.state.customerId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.chat.conversations);
        if (response.data.success) setThreads(response.data.data);
      } catch (err) {
        console.error("Failed to load threads:", err);
      } finally {
        setInboxLoading(false);
      }
    };

    fetchInbox();
  }, []);

  useEffect(() => {
    if (!showNewMessageModal) return;

    const fetchCustomers = async () => {
      // Don't fetch until the agent types at least 2 characters
      if (customerSearch.trim().length < 2) {
        setCustomers([]);
        return;
      }

      setCustomersLoading(true);
      try {
        const query = `?search=${encodeURIComponent(customerSearch)}`;
        const res = await apiClient.get(`${ENDPOINTS.customers.list}${query}`);
        const list = res.data.data || res.data.customers || res.data || [];
        setCustomers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setCustomersLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [showNewMessageModal, customerSearch]);

  const startConversation = async (customerId) => {
    setStartingChat(true);
    try {
      const res = await apiClient.post(ENDPOINTS.chat.conversations, {
        customerId,
      });
      if (res.data.success && res.data.data) {
        const newThread = res.data.data;

        setThreads((prev) => {
          if (!prev.find((t) => t.id === newThread.id)) {
            return [newThread, ...prev];
          }
          return prev;
        });
        setActiveId(newThread.id);
        setMobileThreadOpen(true);
        setShowNewMessageModal(false);
        setCustomerSearch("");
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
      alert("Could not start conversation.");
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    if (!activeId) return;
    const fetchHistory = async () => {
      setMessagesLoading(true);
      try {
        const response = await apiClient.get(
          `${ENDPOINTS.chat.messages(activeId)}?skip=0`,
        );
        if (response.data.success) setMessages(response.data.data.reverse());
        if (socket) {
          socket.emit("join_conversation", activeId);
          socket.emit("mark_as_read", { conversationId: activeId });
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchHistory();
  }, [activeId, socket]);

  useEffect(() => {
    if (!socket || !activeId) return;

    const handleReceive = (newMessage) => {
      if (newMessage.conversationId === activeId) {
        // Add the message to the screen
        setMessages((prev) => [...prev, newMessage]);

        // 👉 Update the sidebar preview text & re-sort to top
        setThreads((prev) => {
          const updated = prev.map((t) =>
            t.id === activeId ? { ...t, lastMessage: newMessage } : t,
          );
          return updated.sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || a.updatedAt;
            const bTime = b.lastMessage?.createdAt || b.updatedAt;
            return new Date(bTime) - new Date(aTime);
          });
        });

        // IMPORTANT: We MUST only emit mark_as_read if the message came from the customer.
        // If we emit it for our own message, the backend might broadcast a read receipt
        // and instantly turn our own checkmarks blue!
        if (newMessage.senderType !== "AGENT") {
          socket.emit("mark_as_read", { conversationId: activeId });
        }
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("chat_cleared", (data) => {
      const { conversationId, deletedBy } = data;

      if (deletedBy === "AGENT") {
        setMessages((prev) => {
          if (activeId === conversationId) return [];
          return prev;
        });
        // 👉 NEW: Instantly wipe the text from the sidebar list so it says "No messages yet"
        setThreads((prev) =>
          prev.map((t) =>
            t.id === conversationId ? { ...t, lastMessage: null } : t,
          ),
        );
      }
    });
    socket.on("conversation_deleted", (data) => {
      const { conversationId, deletedBy } = data;
      if (deletedBy === "AGENT") {
        // Rip it out of the sidebar list completely
        setThreads((prev) => prev.filter((t) => t.id !== conversationId));
      }
    });
    socket.on("messages_deleted", (data) => {
      const { messageIds, deletedBy } = data;
      if (deletedBy === "AGENT") {
        setMessages((prev) =>
          prev.filter((msg) => !messageIds.includes(msg.id)),
        );
      }
    });

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("chat_cleared");
      socket.off("messages_deleted");
      socket.off("conversation_deleted");
    };
  }, [socket, activeId]);

  useEffect(() => {
    if (!socket) return;

    const handleInboxNotification = (message) => {
      // Fire a rich toast if the message is from a customer and it's not the active chat!
      if (
        message.conversationId !== activeId &&
        message.senderType === "CUSTOMER"
      ) {
        const thread = threads.find((t) => t.id === message.conversationId);
        const senderName =
          message.chatPartner?.name || thread?.chatPartner?.name || "Customer";
        const preview =
          message.messageType === "TEXT"
            ? message.content?.length > 60
              ? message.content.substring(0, 60) + "..."
              : message.content
            : message.messageType === "IMAGE"
              ? "📷 Sent a photo"
              : message.messageType === "VIDEO"
                ? "🎥 Sent a video"
                : message.messageType === "AUDIO"
                  ? "🎵 Voice Message"
                  : "📄 Sent an attachment";

        notificationToast.message({
          title: senderName,
          body: preview,
          onClick: () => {
            openChat(message.conversationId);
          },
        });
      }

      setThreads((prev) => {
        let exists = false;
        let updatedThreads = prev.map((thread) => {
          if (thread.id === message.conversationId) {
            exists = true;
            return {
              ...thread,
              lastMessage: message,
              unreadCount:
                thread.id === activeId ? 0 : (thread.unreadCount || 0) + 1,
            };
          }
          return thread;
        });

        if (!exists && message.chatPartner) {
          updatedThreads.push({
            id: message.conversationId,
            chatPartner: message.chatPartner,
            lastMessage: message,
            unreadCount: message.conversationId === activeId ? 0 : 1,
            createdAt: message.createdAt || new Date().toISOString(),
            updatedAt: message.createdAt || new Date().toISOString(),
          });
        }

        return updatedThreads.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.updatedAt;
          const bTime = b.lastMessage?.createdAt || b.updatedAt;

          return new Date(bTime) - new Date(aTime);
        });
      });
    };

    const handleMessageRead = (data) => {
      if (data.conversationId === activeId) {
        // Only turn OUR ticks blue if the CUSTOMER was the one who triggered the read event!
        if (data.readBy === "CUSTOMER") {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderType === "AGENT" ? { ...m, isRead: true } : m,
            ),
          );
        }
      }
    };

    socket.on("inbox_notification", handleInboxNotification);
    socket.on("message_read", handleMessageRead);

    return () => {
      socket.off("inbox_notification", handleInboxNotification);
      socket.off("message_read", handleMessageRead);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function openChat(id) {
    setActiveId(id);
    setMobileThreadOpen(true);
    // Reset selection state from previous chat
    setSelectionMode(false);
    setSelectedMessageIds([]);
    setIsDropdownOpen(false);
    // Instantly clear the unread count when clicking the chat
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id ? { ...thread, unreadCount: 0 } : thread,
      ),
    );
  }

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !socket || !activeId) return;
    socket.emit("send_message", {
      conversationId: activeId,
      messageType: "TEXT",
      content: text,
    });
    setDraft("");
  };

  const handleClearChat = async () => {
    if (!activeId) return;
    const confirmClear = window.confirm(
      "Are you sure you want to clear all messages? The chat will remain in your list.",
    );
    if (!confirmClear) return;

    // 1. Save state for potential rollback
    const previousMessages = [...messages];
    const previousThreads = [...threads];

    // 2. Optimistic UI: Empty the messages array AND set the sidebar preview to null
    setMessages([]);
    setThreads((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, lastMessage: null } : t)),
    );
    setIsDropdownOpen(false);

    // 3. Make API Call
    try {
      await apiClient.delete(`/api/chat/conversations/${activeId}/clear`);
    } catch (err) {
      console.error("Failed to clear chat:", err);
      // Rollback on failure
      setMessages(previousMessages);
      setThreads(previousThreads);
      alert("Failed to clear chat. Please try again.");
    }
  };

  const handleDeleteChat = async () => {
    if (!activeId) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this chat? It will be removed from your list.",
    );
    if (!confirmDelete) return;

    // 1. Save state for potential rollback
    const previousThreads = [...threads];
    const previousMessages = [...messages];

    // 2. Optimistic UI: Rip it out of the sidebar list completely!
    setThreads((prev) => prev.filter((t) => t.id !== activeId));
    setMessages([]);
    setIsDropdownOpen(false);
    setActiveId(null);
    setMobileThreadOpen(false);

    // 3. Make the API Call
    try {
      await apiClient.delete(`/api/chat/conversations/${activeId}/delete`);
    } catch (err) {
      console.error("Failed to delete chat:", err);
      // Rollback on failure
      setThreads(previousThreads);
      setMessages(previousMessages);
      alert("Failed to delete chat. Please try again.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.length === 0) return;

    const idsToDelete = [...selectedMessageIds];
    const previousMessages = [...messages]; // Save state for potential rollback

    setMessages((prev) => prev.filter((msg) => !idsToDelete.includes(msg.id)));

    // Exit selection mode
    setSelectionMode(false);
    setSelectedMessageIds([]);

    try {
      await apiClient.delete(`/api/chat/messages/bulk-delete`, {
        data: { messageIds: idsToDelete },
      });
    } catch (err) {
      console.error("Failed to delete messages:", err);
      setMessages(previousMessages); // Rollback on failure
      alert("Failed to delete messages.");
    }
  };

  const handleBulkClearConversations = async () => {
    if (selectedThreadIds.length === 0) return;

    const confirmClear = window.confirm(
      `Are you sure you want to clear ${selectedThreadIds.length} conversations? This cannot be undone.`,
    );
    if (!confirmClear) return;

    // 1. SAVE a snapshot in case of failure
    const previousThreads = [...threads];
    const idsToClear = [...selectedThreadIds];

    // 2. Optimistic UI: Immediately hide them from the sidebar by faking their lastMessage as null
    setThreads((prev) =>
      prev.map((thread) =>
        idsToClear.includes(thread.id)
          ? { ...thread, lastMessage: null }
          : thread,
      ),
    );

    // If the active chat was one of the cleared ones, wipe its messages instantly
    if (idsToClear.includes(activeId)) {
      setMessages([]);
    }

    // Exit selection mode
    setSidebarSelectionMode(false);
    setSelectedThreadIds([]);

    // 3. Make the API Call
    try {
      await apiClient.delete(`/api/chat/conversations/bulk-clear`, {
        data: { conversationIds: idsToClear },
      });
    } catch (err) {
      console.error("Failed to bulk clear conversations:", err);
      // Rollback on failure!
      setThreads(previousThreads);
      alert("Failed to clear conversations.");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !activeId) return;

    // Client-side file size validation matching backend rules
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert("This file is too large! Please upload a file smaller than 25MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setCaption("");

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !activeId) return;

    setUploading(true);
    try {
      let typeStr = "DOCUMENT";
      if (selectedFile.type.startsWith("image/")) typeStr = "IMAGE";
      else if (selectedFile.type.startsWith("video/")) typeStr = "VIDEO";
      else if (selectedFile.type.startsWith("audio/")) typeStr = "AUDIO";

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("conversationId", activeId.toString());
      formData.append("messageType", typeStr);

      const response = await apiClient.post(ENDPOINTS.chat.upload, formData);

      if (response.data.success && socket) {
        // Send attachment message
        socket.emit("send_message", {
          conversationId: activeId,
          messageType: "FILE",
          content: response.data.data.url,
        });

        // Send caption if provided by user in preview modal
        if (caption.trim()) {
          socket.emit("send_message", {
            conversationId: activeId,
            messageType: "TEXT",
            content: caption.trim(),
          });
        }
      }
      handleClosePreview();
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const fileUrl = (content) =>
    content.startsWith("http") ? content : `${API_ORIGIN}${content}`;

  return (
    <div className="flex h-[calc(100vh-70px)] bg-white">
      {/* Recent Chats */}
      <div
        className={`w-full md:w-[300px] shrink-0 border-r border-[#E8DFE1] overflow-y-auto ${
          mobileThreadOpen ? "hidden md:block" : "block"
        }`}
      >
        {/* <div className="px-4 sm:px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#141D23]">Recent Chats</h2>
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="p-1.5 bg-[#FFE8EF] text-[#D24D77] rounded-lg hover:bg-[#FDE2E9] transition-colors"
            title="New Message"
          >
            <MessageSquarePlus size={20} />
          </button>
        </div> */}
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between min-h-[64px]">
          {sidebarSelectionMode ? (
            <div className="flex items-center w-full justify-between gap-1">
              <button
                onClick={() => {
                  setSidebarSelectionMode(false);
                  setSelectedThreadIds([]);
                }}
                className="text-sm font-semibold text-[#5C5F60] hover:text-[#141D23] transition-colors cursor-pointer shrink-0"
              >
                Cancel
              </button>

              <span className="font-bold text-sm text-[#141D23] truncate">
                {selectedThreadIds.length} Selected
              </span>

              <button
                onClick={handleBulkClearConversations}
                disabled={selectedThreadIds.length === 0}
                className="text-sm font-bold text-white bg-[#D24D77] hover:bg-[#b03d61] px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                Delete
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#141D23]">Recent Chats</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarSelectionMode(true)}
                  className="p-1.5 bg-[#F1F5F9] text-[#5C5F60] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
                  title="Select Chats"
                >
                  <ListChecks size={20} />
                </button>
                <button
                  onClick={() => setShowNewMessageModal(true)}
                  className="p-1.5 bg-[#FFE8EF] text-[#D24D77] rounded-lg hover:bg-[#FDE2E9] transition-colors cursor-pointer"
                  title="New Message"
                >
                  <MessageSquarePlus size={20} />
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col">
          {inboxLoading ? (
            <p className="px-4 sm:px-5 text-sm text-[#8C959F]">Loading...</p>
          ) : threads.length === 0 ? (
            <p className="px-4 sm:px-5 text-sm text-[#8C959F]">
              No active conversations.
            </p>
          ) : (
            threads
              .map((chat) => {
                // Checkbox Logic
                const isSelected = selectedThreadIds.includes(chat.id);
                const toggleSelection = () => {
                  if (isSelected) {
                    setSelectedThreadIds((prev) =>
                      prev.filter((id) => id !== chat.id),
                    );
                  } else {
                    setSelectedThreadIds((prev) => [...prev, chat.id]);
                  }
                };

                return (
                  <button
                    key={chat.id}
                    // 👉 2. DYNAMIC ONCLICK: Toggle the checkbox OR open the chat
                    onClick={() => {
                      if (sidebarSelectionMode) toggleSelection();
                      else openChat(chat.id);
                    }}
                    className={`flex items-center gap-3 text-left px-3 sm:px-4 py-4 border-l-4 transition-colors w-full ${
                      !sidebarSelectionMode && chat.id === activeId
                        ? "bg-[#FDF2F4] border-[#D24D77]"
                        : "border-transparent hover:bg-[#FAFAFA]"
                    }`}
                  >
                    {/* 👉 3. RENDER CHECKBOX IF IN SELECTION MODE */}
                    {sidebarSelectionMode && (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#D24D77] border-[#D24D77]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={12}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    )}

                    <Avatar
                      name={chat.chatPartner?.name}
                      avatarUrl={chat.chatPartner?.avatarUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[#141D23] truncate">
                          {chat.chatPartner?.name || "N/A"}
                        </span>
                        {!sidebarSelectionMode && (
                          <span className="text-xs text-[#8C959F] shrink-0">
                            {relativeTime(
                              chat.lastMessage?.createdAt || chat.updatedAt,
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#5C5F60] line-clamp-1 mt-0.5">
                        {renderInboxMessage(chat.lastMessage)}
                      </p>
                      {!sidebarSelectionMode && chat.unreadCount > 0 && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE8EF] text-[#D24D77]">
                          {chat.unreadCount} NEW
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* Active Thread */}
      <div
        className={`relative flex-1 flex-col min-w-0 ${
          mobileThreadOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {active ? (
          <>
            {/* <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[#E8DFE1]">
              <button
                onClick={() => setMobileThreadOpen(false)}
                className="md:hidden p-1 -ml-1 rounded-lg hover:bg-slate-100 text-[#5C5F60] aria-label='Back to chat list'"
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar
                name={active.chatPartner?.name}
                avatarUrl={active.chatPartner?.avatarUrl}
              />
              <p className="font-bold text-[#141D23]">
                {active.chatPartner?.name || "Customer"}
              </p>
            </div> */}

            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E8DFE1]">
              {/* Left Side: Avatar/Name OR Selection Counter */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileThreadOpen(false)}
                  className="md:hidden p-1 -ml-1 rounded-lg hover:bg-slate-100 text-[#5C5F60] aria-label='Back to chat list'"
                >
                  <ArrowLeft size={20} />
                </button>

                {selectionMode ? (
                  <span className="font-bold text-[#141D23]">
                    {selectedMessageIds.length} Selected
                  </span>
                ) : (
                  <>
                    <Avatar
                      name={active.chatPartner?.name}
                      avatarUrl={active.chatPartner?.avatarUrl}
                    />
                    <p className="font-bold text-[#141D23]">
                      {active.chatPartner?.name || "Customer"}
                    </p>
                  </>
                )}
              </div>

              {/* Right Side: 3-Dots Menu OR Cancel/Delete Buttons */}
              <div className="relative flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedMessageIds([]);
                      }}
                      className="px-3 py-1.5 text-sm font-semibold text-[#5C5F60] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedMessageIds.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-white bg-[#D24D77] hover:bg-[#b03d61] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-1.5 text-[#5C5F60] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                          <button
                            onClick={() => {
                              setSelectionMode(true);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-[#141D23] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <ListChecks size={16} className="text-[#5C5F60]" />
                            Select Messages
                          </button>

                          {/* The CLEAR CHAT Button (Eraser Icon) */}
                          <button
                            onClick={handleClearChat}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-[#141D23] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Eraser size={16} className="text-[#5C5F60]" />
                            Clear Chat
                          </button>

                          {/* The DELETE CHAT Button (Red Trash Icon) */}
                          <button
                            onClick={handleDeleteChat}
                            className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-[#D24D77] hover:bg-[#FFE8EF] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 size={16} />
                            Delete Chat
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
              {messagesLoading ? (
                <p className="text-center text-sm text-[#8C959F]">
                  Loading messages...
                </p>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
                  <span className="text-5xl mb-3">💬</span>
                  <p className="text-[#141D23] font-bold text-base">No messages yet</p>
                  <p className="text-sm text-[#8C959F] mt-1">
                    Send a message to start the conversation.
                  </p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isAgent = m.senderType === "AGENT";
                  const isSelected = selectedMessageIds.includes(m.id);
                  const toggleSelection = () => {
                    if (isSelected) {
                      setSelectedMessageIds((prev) =>
                        prev.filter((id) => id !== m.id),
                      );
                    } else {
                      setSelectedMessageIds((prev) => [...prev, m.id]);
                    }
                  };
                  return (
                    <div
                      key={m.id || i}
                      onClick={selectionMode ? toggleSelection : undefined}
                      className={`flex items-center gap-3 ${
                        isAgent ? "justify-end" : "justify-start"
                      } ${selectionMode ? "cursor-pointer" : ""}`}
                    >
                      {selectionMode && !isAgent && (
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#D24D77] border-[#D24D77]"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] sm:max-w-[420px] ${selectionMode ? "pointer-events-none" : ""}`}
                      >
                        {(() => {
                          const url = fileUrl(m.content);
                          const isImage =
                            m.messageType === "IMAGE" ||
                            (typeof m.content === "string" &&
                              m.content.match(/\.(jpeg|jpg|gif|png|webp)$/i));
                          const isVideo =
                            m.messageType === "VIDEO" ||
                            (typeof m.content === "string" &&
                              m.content.match(/\.(mp4|mov)$/i));
                          const isAudio =
                            m.messageType === "AUDIO" ||
                            (typeof m.content === "string" &&
                              m.content.match(/\.(mp3|wav|ogg)$/i));
                          const isDoc =
                            m.messageType === "DOCUMENT" ||
                            m.messageType === "FILE";
                          const bubbleClass = `rounded-2xl px-4 py-3 text-sm break-all ${
                            isAgent
                              ? "bg-[#D24D77] text-white rounded-tr-none"
                              : "bg-[#F5F5F5] text-[#141D23] rounded-tl-none border border-[#E8DFE1]"
                          }`;

                          if (isImage) {
                            return (
                              <img
                                src={url}
                                alt="Attachment"
                                onLoad={scrollToBottom}
                                onClick={() => {
                                  setPreviewMessage({
                                    ...m,
                                    url,
                                    senderName: isAgent
                                      ? "Sarah L."
                                      : active.chatPartner?.name,
                                    avatarUrl: isAgent
                                      ? null
                                      : active.chatPartner?.avatarUrl,
                                  });
                                  setZoomLevel(1);
                                }}
                                className="max-w-[240px] sm:max-w-[300px] rounded-lg object-cover shadow-sm border border-black/5 cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            );
                          }

                          if (isVideo) {
                            return (
                              <video
                                src={url}
                                controls
                                onLoadedData={scrollToBottom}
                                className="max-w-[240px] sm:max-w-[300px] rounded-lg shadow-sm border border-black/5"
                              />
                            );
                          }

                          if (isAudio) {
                            return (
                              <div className={bubbleClass + " !p-2"}>
                                <audio
                                  controls
                                  src={url}
                                  className="max-w-[200px] sm:max-w-[250px] h-10"
                                />
                              </div>
                            );
                          }

                          if (isDoc) {
                            const fileName = generateDownloadName(
                              m,
                              "pdf",
                            ).replace("WhatsApp Image", "Document");
                            return (
                              <a
                                href={url}
                                onClick={(e) =>
                                  handleDownload(url, fileName, e)
                                }
                                className={
                                  bubbleClass +
                                  " flex items-center justify-between gap-4 hover:opacity-80 transition group"
                                }
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xl shrink-0">📄</span>
                                  <span className="underline truncate max-w-[180px] font-medium">
                                    {fileName}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded-full bg-black/5 group-hover:bg-black/10 shrink-0 transition-colors">
                                  <Download size={16} />
                                </div>
                              </a>
                            );
                          }

                          return <div className={bubbleClass}>{m.content}</div>;
                        })()}
                        <div
                          className={`text-[11px] text-[#8C959F] mt-1 flex items-center gap-1 ${isAgent ? "justify-end" : "justify-start"} `}
                        >
                          {clockTime(m.createdAt)}
                          {isAgent && (
                            <span
                              className={
                                m.isRead ? "text-blue-500" : "text-[#8c959f]"
                              }
                            >
                              {m.isRead ? (
                                <CheckCheck size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Checkbox (Agent Messages) */}
                      {selectionMode && isAgent && (
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#D24D77] border-[#D24D77]"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept={fileAccept}
            />

            <div
              ref={inputBarRef}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-[#E8DFE1]"
            >
              {/* Attachment Menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-16 left-4 bg-white rounded-xl shadow-xl border border-[#E8DFE1] p-2 flex flex-col gap-1 w-56 z-50">
                  <button
                    onClick={() => {
                      setFileAccept("image/*,video/*");
                      setShowAttachmentMenu(false);
                      setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-[#141D23] font-medium transition whitespace-nowrap"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <ImageIcon size={16} />
                    </div>
                    Photos & Videos
                  </button>
                  <button
                    onClick={() => {
                      setFileAccept(".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx");
                      setShowAttachmentMenu(false);
                      setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-[#141D23] font-medium transition whitespace-nowrap"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <File size={16} />
                    </div>
                    Document
                  </button>
                </div>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-12 z-50 shadow-2xl rounded-xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setDraft((prev) => prev + emojiData.emoji);
                    }}
                    autoFocusSearch={false}
                  />
                </div>
              )}

              <button
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowAttachmentMenu(!showAttachmentMenu);
                }}
                disabled={uploading}
                className={`hidden sm:block p-2 rounded-lg hover:bg-slate-100 text-[#5C5F60] transition ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                } ${showAttachmentMenu ? "bg-slate-200" : ""}`}
                aria-label="Attach"
              >
                <Plus
                  size={20}
                  className={
                    showAttachmentMenu
                      ? "rotate-45 transition-transform"
                      : "transition-transform"
                  }
                />
              </button>
              <button
                onClick={() => {
                  setShowAttachmentMenu(false);
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`hidden sm:block p-2 rounded-lg hover:bg-slate-100 text-[#5C5F60] transition ${
                  showEmojiPicker ? "bg-slate-200 text-[#D24D77]" : ""
                }`}
                aria-label="Emoji"
              >
                <Smile size={20} />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                onFocus={() => {
                  setShowEmojiPicker(false);
                  setShowAttachmentMenu(false);
                }}
                placeholder="Type a message..."
                className="flex-1 bg-[#F8FAFF] border border-[#E8DFE1] rounded-full px-4 py-2.5 text-sm outline-none"
              />
              <button
                onClick={sendMessage}
                aria-label="Send message"
                className="p-2.5 rounded-full bg-[#78555E] text-white hover:bg-[#6a4a52] transition shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#FAFAFA] text-[#8C959F]">
            <span className="text-6xl mb-4">💬</span>
            <h2 className="text-2xl font-bold text-[#17222B] mb-2">
              Conversations
            </h2>
            <p>Select a chat from the sidebar to start messaging.</p>
          </div>
        )}

        {/* WhatsApp-style File Preview Modal */}
        {previewUrl && (
          <div className="absolute inset-0 z-50 bg-[#111B21] flex flex-col justify-between p-4 sm:p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-white w-full">
              <button
                onClick={handleClosePreview}
                disabled={uploading}
                className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white"
                title="Close preview"
              >
                <X size={24} />
              </button>
              <div className="text-right">
                <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[350px]">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-white/60">
                  {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center my-4 overflow-hidden w-full">
              {selectedFile?.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[65vh] sm:max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
                />
              ) : selectedFile?.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-[65vh] sm:max-h-[70vh] max-w-full rounded-lg shadow-2xl border border-white/10"
                />
              ) : (
                <div className="flex flex-col items-center justify-center bg-white/10 p-8 rounded-2xl border border-white/20 text-white max-w-md w-full text-center">
                  <FileText size={56} className="text-[#D24D77] mb-3" />
                  <p className="font-bold text-lg truncate w-full">
                    {selectedFile?.name}
                  </p>
                  <p className="text-sm text-white/60 mt-1 uppercase">
                    {selectedFile?.type || "Document"}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Bar / Caption & Send */}
            <div className="w-full flex items-center gap-3">
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !uploading && handleConfirmUpload()
                }
                disabled={uploading}
                className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-full px-5 py-3 text-sm outline-none focus:border-white/50 transition"
                autoFocus
              />
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="h-12 w-12 rounded-full bg-[#D24D77] hover:bg-[#b83d64] text-white flex items-center justify-center transition shrink-0 disabled:opacity-50 shadow-lg"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-[100] flex sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full h-full sm:h-[85vh] sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E8DFE1] flex items-center justify-between bg-[#FAFAFA]">
              <h2 className="text-xl font-bold text-[#141D23]">New Message</h2>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-slate-200 text-[#5C5F60] transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[#E8DFE1]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C959F]"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search customer by name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-[#F1F3F5] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#141D23] outline-none focus:ring-2 focus:ring-[#D24D77]/20 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {customerSearch.trim().length < 2 ? (
                <div className="p-8 text-center text-[#8C959F] flex flex-col items-center mt-10">
                  <span className="text-4xl mb-3">👋</span>
                  <p className="text-base font-bold text-[#141D23]">Search for a customer</p>
                  <p className="text-sm mt-1">Type at least 2 characters to find a customer.</p>
                </div>
              ) : customersLoading ? (
                <div className="p-8 text-center text-[#8C959F] flex flex-col items-center mt-10">
                  <div className="w-8 h-8 border-2 border-[#D24D77] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-medium">Searching...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-[#8C959F] flex flex-col items-center mt-10">
                  <span className="text-4xl mb-2">🔍</span>
                  <p className="text-sm font-medium">No customers found matching &quot;{customerSearch}&quot;.</p>
                </div>
              ) : (
                customers.map((customer) => (
                  <button
                    key={customer.id}
                    disabled={startingChat}
                    onClick={() => startConversation(customer.id)}
                    className="w-full text-left p-4 border-b border-[#E8DFE1] hover:bg-[#F8FAFF] transition flex items-center gap-4 disabled:opacity-50"
                  >
                    <Avatar
                      name={customer.name}
                      avatarUrl={customer.avatarUrl}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#141D23] truncate">
                        {customer.name}
                      </p>
                      <p className="text-xs text-[#5C5F60] mt-0.5 truncate flex items-center gap-2">
                        <span>{customer.email || "No email"}</span>
                        <span>•</span>
                        <span>{customer.phone || "No phone"}</span>
                      </p>
                    </div>
                    {/* Metrics if available */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-[#D24D77] uppercase">
                        Orders
                      </p>
                      <p className="text-sm font-semibold text-[#141D23]">
                        {customer.totalOrders || 0}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox (WhatsApp Web Style) */}
      {previewMessage && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md transition-all duration-200 animate-in fade-in"
          onClick={() => setPreviewMessage(null)}
        >
          {/* Header Bar */}
          <div
            className="flex items-center justify-between px-6 py-4 bg-black/40 text-white shadow-md z-[110]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <Avatar
                name={previewMessage.senderName}
                avatarUrl={previewMessage.avatarUrl}
              />
              <div>
                <p className="font-semibold text-lg">
                  {previewMessage.senderName || "User"}
                </p>
                <p className="text-xs text-white/70">
                  {new Date(previewMessage.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.5, 3))}
                className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={24} />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.5, 0.5))}
                className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={24} />
              </button>
              <div className="w-px h-8 bg-white/20 mx-2"></div>
              <button
                onClick={(e) =>
                  handleDownload(
                    previewMessage.url,
                    generateDownloadName(previewMessage, "jpg"),
                    e,
                  )
                }
                className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-colors"
                title="Download"
              >
                <Download size={24} />
              </button>
              <button
                onClick={() => setPreviewMessage(null)}
                className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* The Image Container */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
            <img
              src={previewMessage.url}
              alt="Preview"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.2s ease-out",
              }}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;
