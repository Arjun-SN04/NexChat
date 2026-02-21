import { useEffect } from "react";
import { useSocket } from "./SocketProvider";
import useConversation from "../Zustand/UserConversation";

const useListenMessages = () => {
  const { socket } = useSocket();
  const { setMessages, setSelectedConversation, selectedConversation } = useConversation();

  useEffect(() => {
    if (!socket) return;

    // New message from someone
    const handleNewMessage = (newMessage) => {
      console.log("📨 Received socket message:", newMessage);
      if (
        selectedConversation &&
        newMessage.senderId?.toString() === selectedConversation._id?.toString()
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    // Other user deleted a message
    const handleMessageDeleted = (messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    // Other user edited a message
    const handleMessageEdited = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    };

    // Conversation deleted by other user
    const handleConversationDeleted = ({ otherUserId }) => {
      if (
        selectedConversation &&
        selectedConversation._id?.toString() === otherUserId?.toString()
      ) {
        setMessages([]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("conversationDeleted", handleConversationDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("conversationDeleted", handleConversationDeleted);
    };
  }, [socket, selectedConversation, setMessages]);
};

export default useListenMessages;
