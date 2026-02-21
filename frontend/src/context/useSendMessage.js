import { useState } from "react";
import axios from "axios";
import useConversation from "../Zustand/UserConversation";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { selectedConversation, messages, setMessages } = useConversation();

  const sendMessage = async (messageText) => {
    if (!selectedConversation?._id || !messageText.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `/api/message/send/${selectedConversation._id}`,
        { message: messageText },
        { withCredentials: true }
      );
      setMessages([...messages, res.data]);
    } catch (error) {
      console.log("sendMessage error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessage };
};

export default useSendMessage;
