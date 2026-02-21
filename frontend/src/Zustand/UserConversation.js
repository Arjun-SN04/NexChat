import { create } from 'zustand'

const useConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
  messages: [],
  setMessages: (messagesOrUpdater) =>
    set((state) => ({
      messages:
        typeof messagesOrUpdater === 'function'
          ? messagesOrUpdater(state.messages)
          : messagesOrUpdater,
    })),

  // ── Unread notifications: { [senderId]: count } ──
  unreadCounts: {},

  // Increment unread for a sender
  addUnread: (senderId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [senderId]: (state.unreadCounts[senderId] || 0) + 1,
      },
    })),

  // Clear unread for a sender (when user opens their chat)
  clearUnread: (senderId) =>
    set((state) => {
      const next = { ...state.unreadCounts }
      delete next[senderId]
      return { unreadCounts: next }
    }),
}))

export default useConversation
