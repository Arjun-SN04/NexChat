import { useEffect, useState } from "react";
import axios from "axios";
import useConversation from "../Zustand/UserConversation";

const useGetMessages = () => {
    const [loading, setLoading] = useState(false);
    const { selectedConversation, setMessages ,messages} = useConversation();

    useEffect(() => {
        const getMessages = async () => {
            if (!selectedConversation?._id) return;

            setLoading(true);
            try {
                const res = await axios.get(
                    `/api/message/get/${selectedConversation._id}`,
                    { withCredentials: true }
                );
                setMessages(res.data);
                setLoading(false);

            } catch (error) {
                console.log(error);
            }
        };

        getMessages();
    }, [selectedConversation,setMessages]);

    return { loading ,messages };
};

export default useGetMessages;
