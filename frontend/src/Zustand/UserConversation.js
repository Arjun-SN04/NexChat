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

  // ── Unread notifications: { [senderId: string]: number } ──
  unreadCounts: {},

  // Increment unread — always store as string key
  addUnread: (senderId) =>
    set((state) => {
      const key = senderId?.toString()
      if (!key) return state
      return {
        unreadCounts: {
          ...state.unreadCounts,
          [key]: (state.unreadCounts[key] || 0) + 1,
        },
      }
    }),

  // Clear unread when user opens that chat
  clearUnread: (senderId) =>
    set((state) => {
      const key = senderId?.toString()
      if (!key) return state
      const next = { ...state.unreadCounts }
      delete next[key]
      return { unreadCounts: next }
    }),
}))

export default useConversation
