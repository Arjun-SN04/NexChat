import { useState } from "react";
import axios from "axios";
import useConversation from "../Zustand/UserConversation";

// Sends a text message, optionally with a reply target and/or a file.
// Returns null on success, or an error message.
const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation, setMessages, upsertPreview } = useConversation();

  const sendMessage = async (messageText, replyTo = null, file = null, onProgress) => {
    if (!selectedConversation?._id || (!messageText.trim() && !file)) return null;

    let body = { message: messageText, replyTo };
    if (file) {
      body = new FormData();
      body.append("message", messageText);
      if (replyTo) body.append("replyTo", replyTo);
      body.append("file", file);
    }

    setLoading(true);
    try {
      const res = await axios.post(`/api/message/send/${selectedConversation._id}`, body, {
        withCredentials: true,
        onUploadProgress: (e) => onProgress?.(e.total ? e.loaded / e.total : 0),
      });
      setMessages((prev) => [...prev, res.data]);
      upsertPreview(selectedConversation._id, res.data);
      return null;
    } catch (error) {
      console.log("sendMessage error:", error);
      return error.response?.data?.error || "Message failed to send. Try again.";
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessage };
};

export default useSendMessage;
