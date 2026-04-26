import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(merchantId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (merchantId) socket.emit('join-merchant', merchantId);
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => { socket.disconnect(); };
  }, [merchantId]);

  return { socket: socketRef.current, isConnected };
}
