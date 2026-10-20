import { create } from 'zustand'

const useConversation = create((set) => ({
  selectedConversation: null,
  // Switching chats also cancels any reply/edit in progress
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation, replyingTo: null, editingMessage: null, pendingFile: null, selectionMode: false, selectedIds: [] }),

  // Multi-select mode for forwarding / copying / deleting several messages
  selectionMode: false,
  selectedIds: [],
  startSelection: (id) => set({ selectionMode: true, selectedIds: id ? [id] : [], replyingTo: null, editingMessage: null }),
  toggleSelected: (id) =>
    set((state) => {
      const selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id]
      return { selectedIds }
    }),
  clearSelection: () => set({ selectionMode: false, selectedIds: [] }),

  // Message ids to forward (opens the forward dialog when set)
  forwardIds: null,
  setForwardIds: (forwardIds) => set({ forwardIds }),

  // File chosen for the next message: { file, kind, previewUrl, originalSize }
  pendingFile: null,
  setPendingFile: (pendingFile) => set({ pendingFile }),

  // Message the composer is replying to / editing (only one at a time)
  replyingTo: null,
  setReplyingTo: (replyingTo) => set({ replyingTo, editingMessage: null }),
  editingMessage: null,
  setEditingMessage: (editingMessage) => set({ editingMessage, replyingTo: null }),

  // Message to flash briefly after jumping to it from a reply
  highlightedId: null,
  setHighlightedId: (highlightedId) => set({ highlightedId }),

  messages: [],
  setMessages: (messagesOrUpdater) =>
    set((state) => ({
      messages:
        typeof messagesOrUpdater === 'function'
          ? messagesOrUpdater(state.messages)
          : messagesOrUpdater,
    })),

  // Contact list (filled by the sidebar, reused by the welcome screen)
  contacts: [],
  setContacts: (contacts) => set({ contacts }),

  // Who is typing to me right now: { [userId]: true }
  typingUsers: {},
  setTyping: (userId, isTyping) =>
    set((state) => {
      const next = { ...state.typingUsers }
      if (isTyping) next[String(userId)] = true
      else delete next[String(userId)]
      return { typingUsers: next }
    }),

  // Last message per contact for the sidebar: { [userId]: message }
  previews: {},
  setPreviews: (previews) => set({ previews }),
  upsertPreview: (userId, message) =>
    set((state) => ({ previews: { ...state.previews, [String(userId)]: message } })),

  setUnreadCounts: (unreadCounts) => set({ unreadCounts }),

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
