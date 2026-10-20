import { useEffect } from 'react'

// Sets the browser tab title, e.g. "Sign in · NexChat".
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · NexChat` : 'NexChat — Real-time messaging'
  }, [title])
}

export default usePageTitle
