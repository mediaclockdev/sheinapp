import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Plus, Send, Smile, ArrowLeft, FileText, X } from "lucide-react";
import { useSocket } from "../hooks/useSocket";

const API_BASE = "https://shelynx.mediaclocksoft.com.au";
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

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
  if (msg.messageType === "DOCUMENT" || msg.messageType === "FILE") return "📄 Document";
  return msg.content;
};

const Avatar = ({ name, avatarUrl }) => (
  <div className="relative shrink-0">
    <img
      src={
        avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "")}`
      }
      alt={name}
      className="h-11 w-11 rounded-full border border-[#D3C3C5] object-cover bg-[#EEF4FB]"
    />
  </div>
);

const Conversations = () => {
  const { socket } = useSocket();
  const [threads, setThreads] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  // File Preview Modal state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const active = threads.find((c) => c.id === activeId);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/chat/conversations`,
          authHeaders(),
        );
        if (response.data.success) setThreads(response.data.data);
      } catch (error) {
        console.error("Failed to fetch inbox", error);
      } finally {
        setInboxLoading(false);
      }
    };
    fetchInbox();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const fetchHistory = async () => {
      setMessagesLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE}/api/chat/conversations/${activeId}/messages?skip=0`,
          authHeaders(),
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
        setMessages((prev) => [...prev, newMessage]);
        socket.emit("mark_as_read", { conversationId: activeId });
      }
    };
    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [socket, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = (id) => {
    setActiveId(id);
    setMobileThreadOpen(true);
  };

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

      const response = await axios.post(
        `${API_BASE}/api/chat/upload`,
        formData,
        authHeaders(),
      );

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
    content.startsWith("http") ? content : `${API_BASE}${content}`;

  return (
    <div className="flex h-[calc(100vh-70px)] bg-white">
      {/* Recent Chats */}
      <div
        className={`w-full md:w-[300px] shrink-0 border-r border-[#E8DFE1] overflow-y-auto ${
          mobileThreadOpen ? "hidden md:block" : "block"
        }`}
      >
        <div className="px-4 sm:px-5 py-4">
          <h2 className="text-lg font-bold text-[#141D23]">Recent Chats</h2>
        </div>
        <div className="flex flex-col">
          {inboxLoading ? (
            <p className="px-4 sm:px-5 text-sm text-[#8C959F]">Loading...</p>
          ) : threads.length === 0 ? (
            <p className="px-4 sm:px-5 text-sm text-[#8C959F]">
              No active conversations.
            </p>
          ) : (
            threads.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className={`flex gap-3 text-left px-4 sm:px-5 py-4 border-l-4 transition-colors ${
                  chat.id === activeId
                    ? "bg-[#FDF2F4] border-[#D24D77]"
                    : "border-transparent hover:bg-[#FAFAFA]"
                }`}
              >
                <Avatar
                  name={chat.chatPartner?.name}
                  avatarUrl={chat.chatPartner?.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#141D23] truncate">
                      {chat.chatPartner?.name || "N/A"}
                    </span>
                    <span className="text-xs text-[#8C959F] shrink-0">
                      {relativeTime(
                        chat.lastMessage?.createdAt || chat.updatedAt,
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-[#5C5F60] line-clamp-2 mt-0.5">
                    {renderInboxMessage(chat.lastMessage)}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE8EF] text-[#D24D77]">
                      {chat.unreadCount} NEW
                    </span>
                  )}
                </div>
              </button>
            ))
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
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-[#E8DFE1]">
              <button
                onClick={() => setMobileThreadOpen(false)}
                className="md:hidden p-1 -ml-1 rounded-lg hover:bg-slate-100 text-[#5C5F60]"
                aria-label="Back to chat list"
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
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
              {messagesLoading ? (
                <p className="text-center text-sm text-[#8C959F]">
                  Loading messages...
                </p>
              ) : (
                messages.map((m, i) => {
                  const isAgent = m.senderType === "AGENT";
                  const isAttachment =
                    ["FILE", "IMAGE", "DOCUMENT", "VIDEO", "AUDIO"].includes(m.messageType);
                  return (
                    <div
                      key={m.id || i}
                      className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[85%] sm:max-w-[420px]">
                        {(() => {
                          const url = fileUrl(m.content);
                          const isImage = m.messageType === "IMAGE" || (typeof m.content === "string" && m.content.match(/\.(jpeg|jpg|gif|png|webp)$/i));
                          const isVideo = m.messageType === "VIDEO" || (typeof m.content === "string" && m.content.match(/\.(mp4|mov)$/i));
                          const isAudio = m.messageType === "AUDIO" || (typeof m.content === "string" && m.content.match(/\.(mp3|wav|ogg)$/i));
                          const isDoc = m.messageType === "DOCUMENT" || m.messageType === "FILE";

                          const bubbleClass = `rounded-2xl px-4 py-3 text-sm ${
                            isAgent
                              ? "bg-[#FDE2E9] text-[#141D23]"
                              : "bg-[#F1F3F5] text-[#141D23]"
                          }`;

                          if (isImage) {
                            return (
                              <img
                                src={url}
                                alt="Attachment"
                                className="max-w-[240px] sm:max-w-[300px] rounded-lg object-cover shadow-sm border border-black/5"
                              />
                            );
                          }
                          
                          if (isVideo) {
                            return (
                              <video
                                src={url}
                                controls
                                className="max-w-[240px] sm:max-w-[300px] rounded-lg shadow-sm border border-black/5"
                              />
                            );
                          }

                          if (isAudio) {
                            return (
                              <div className={bubbleClass + " !p-2"}>
                                <audio controls src={url} className="max-w-[200px] sm:max-w-[250px] h-10" />
                              </div>
                            );
                          }

                          if (isDoc) {
                            const fileName = typeof m.content === "string" ? m.content.split('/').pop() : "Document";
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className={bubbleClass + " flex items-center gap-3 hover:opacity-90 transition-opacity no-underline"}
                              >
                                <div className={`p-2 rounded-lg shrink-0 ${isAgent ? "bg-white/50" : "bg-black/5"}`}>
                                  <FileText size={20} className={isAgent ? "text-[#D24D77]" : "text-gray-500"} />
                                </div>
                                <div className="min-w-0 flex-1 max-w-[200px]">
                                  <p className="font-medium truncate text-sm">{fileName}</p>
                                  <p className="text-[10px] opacity-70 uppercase mt-0.5">Document</p>
                                </div>
                              </a>
                            );
                          }

                          return (
                            <div className={bubbleClass}>
                              {m.content}
                            </div>
                          );
                        })()}
                        <p
                          className={`text-[11px] text-[#8C959F] mt-1 ${
                            isAgent ? "text-right" : "text-left"
                          }`}
                        >
                          {isAgent ? "Sarah L." : active.chatPartner?.name} •{" "}
                          {clockTime(m.createdAt)}
                        </p>
                      </div>
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
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf,audio/mpeg,audio/wav,audio/ogg"
            />

            <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-[#E8DFE1]">
              <button
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
                className={`hidden sm:block p-2 rounded-lg hover:bg-slate-100 text-[#5C5F60] ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Attach"
              >
                <Plus size={20} />
              </button>
              <button
                className="hidden sm:block p-2 rounded-lg hover:bg-slate-100 text-[#5C5F60]"
                aria-label="Emoji"
              >
                <Smile size={20} />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
          <div className="flex-1 flex items-center justify-center text-[#8C959F]">
            Select a conversation
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
                <p className="font-bold text-lg truncate w-full">{selectedFile?.name}</p>
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
              onKeyDown={(e) => e.key === "Enter" && !uploading && handleConfirmUpload()}
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
    </div>
  );
};

export default Conversations;
