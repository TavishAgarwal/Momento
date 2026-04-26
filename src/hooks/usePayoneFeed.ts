import { useState, useEffect, useRef, useCallback } from 'react';
import type { PayoneStatus } from '../types';

export function usePayoneFeed(merchantId: string = 'cafe-mueller') {
  const [status, setStatus] = useState<PayoneStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/payone/simulate?merchantId=${merchantId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as PayoneStatus;
        setStatus(data);
        setIsConnected(true);
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };
  }, [merchantId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { status, isConnected };
}
