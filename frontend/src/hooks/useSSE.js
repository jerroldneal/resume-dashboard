import { useEffect, useState } from 'react';

export function useSSE(url) {
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource(url)

    eventSource.onopen = () => setConnected(true)
    eventSource.onerror = () => setConnected(false)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setEvents(prev => [...prev, data])
    }

    return () => eventSource.close()
  }, [url])

  return { events, connected }
}
