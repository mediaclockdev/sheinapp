import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSocket } from "../hooks/useSocket";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Plus,
  Smile,
  Send,
} from "lucide-react";

const ActiveChat = ({ conversationId, chatPartner, onBack }) => {
  const { socket } = useSocket();
  const [message, setMessage] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://shelynx.mediaclocksoft.com.au/api/chat/conversations/${conversationId}/messages?skip=0`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.success) {
          setMessage(response.data.data.reverse());
        }

        if (socket) {
          socket.emit("join_conversation", conversationId);
          socket.emit("mark_as_read", { conversationId });
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [conversationId, socket]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    const handleReceive = (newMessage) => {
      if (newMessage.conversationId === conversationId) {
        setMessage((prev) => [...prev, newMessage]);
        socket.emit("mark_as_read", { conversationId });
      }
    };
    socket.on("receive_message", handleReceive);
    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const outGoingMsg = {
      conversationId,
      messageType: "TEXT",
      content: inputText,
    };

    socket.emit("send_message", outGoingMsg);

    setInputText("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://shelynx.mediaclocksoft.com.au/api/chat/upload",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const fileUrl = response.data.data.url;

        const outGoingMsg = {
          conversationId,
          messageType: "FILE",
          content: fileUrl,
        };

        socket.emit("send_message", outGoingMsg);
      }
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      // Clear the input so you can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header: Back to Inbox Button */}
      <div className="bg-[#f8faff] border-b border-blue-100 px-4 py-3 flex items-center">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Inbox
        </button>
      </div>
      {/* Customer Info Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                chatPartner?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${chatPartner?.name}`
              }
              alt="avatar"
              className="w-10 h-10 rounded-full bg-gray-200 object-cover"
            />
            {/* Online Indicator Dot */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {chatPartner?.name || "Customer"}
            </h2>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{" "}
              Online
            </p>
          </div>
        </div>
        {/* Top Right Action Icons */}
        <div className="flex gap-4 text-gray-400">
          <button className="hover:text-gray-700">
            <Phone size={20} />
          </button>
          <button className="hover:text-gray-700">
            <Video size={20} />
          </button>
          <button className="hover:text-gray-700">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-0 space-y-6 bg-white">
        {loading ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            Loading messages...
          </div>
        ) : (
          message.map((msg, index) => {
            const isAgent = msg.senderType === "AGENT";
            return (
              <div
                key={msg.id || index}
                className={`flex ${isAgent ? "justify-end" : "justify-start"} items-end gap-2 mb-4`}
              >
                {/* Customer Avatar on the left */}
                {!isAgent && (
                  <img
                    src={
                      chatPartner?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${chatPartner?.name}`
                    }
                    className="w-6 h-6 rounded-full object-cover mb-5"
                    alt="avatar"
                  />
                )}
                <div
                  className={`flex flex-col ${isAgent ? "items-end" : "items-start"} max-w-[65%]`}
                >
                  {/* The Bubble */}
                  <div
                    className={`px-4 py-3 text-sm shadow-sm ${
                      isAgent
                        ? "bg-pink-100/80 text-gray-800 rounded-2xl rounded-tr-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {/* Check if it's a file type! */}
                    {msg.messageType === "FILE" ||
                    msg.messageType === "IMAGE" ? (
                      typeof msg.content === "string" && msg.content.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img
                          src={msg.content.startsWith("http") ? msg.content : `https://shelynx.mediaclocksoft.com.au${msg.content}`}
                          alt="Attachment"
                          className="max-w-[200px] rounded-lg"
                        />
                      ) : (
                        <a
                          href={typeof msg.content === "string" && msg.content.startsWith("http") ? msg.content : `https://shelynx.mediaclocksoft.com.au${msg.content}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-blue-600 font-medium"
                        >
                          View Attachment
                        </a>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* The Timestamp below bubble */}
                  <div className="text-[10px] text-gray-400 mt-1 flex gap-1 font-medium">
                    {isAgent ? "Sarah L." : chatPartner?.name || "Customer"}
                    <span>•</span>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,application/pdf,video/mp4"
        />
      </div>
      {/* Input Area */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2 bg-[#fbfcfd]"
        >
          <button
            type="button"
            className={`text-gray-400 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-600'}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Smile size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2 text-gray-700"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="text-white bg-[#6b4c53] hover:bg-[#573d43] disabled:opacity-50 p-2 rounded-md transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActiveChat;
