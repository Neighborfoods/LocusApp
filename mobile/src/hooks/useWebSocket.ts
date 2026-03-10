import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getTokens } from '@utils/keychain';

const WS_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '').replace('http', 'ws') ?? 'ws://129.146.186.180';

interface WsMessage {
  type: string;
  payload: unknown;
}

type MessageHandler = (payload: unknown) => void;

interface UseWebSocketOptions {
  communityId?: string;
  onMessage?: (msg: WsMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({ communityId, onMessage, onConnect, onDisconnect }: UseWebSocketOptions = {}) {
  const ws = useRef<WebSocket | null>(null);
  const handlers = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECTS = 5;

  const connect = useCallback(async () => {
    try {
      const tokens = await getTokens();
      if (!tokens?.accessToken) return;

      const url = communityId
        ? `${WS_BASE_URL}/ws?token=${tokens.accessToken}&community=${communityId}`
        : `${WS_BASE_URL}/ws?token=${tokens.accessToken}`;

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          onMessage?.(msg);
          const typeHandlers = handlers.current.get(msg.type) ?? [];
          typeHandlers.forEach((h) => h(msg.payload));
        } catch {
          // ignore parse errors
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        scheduleReconnect();
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch {
      scheduleReconnect();
    }
  }, [communityId]);

  const scheduleReconnect = useCallback(() => {
    setReconnectAttempts((prev) => {
      if (prev >= MAX_RECONNECTS) return prev;
      const delay = Math.min(1000 * 2 ** prev, 30000);
      reconnectTimer.current = setTimeout(connect, delay);
      return prev + 1;
    });
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    ws.current?.close();
  }, []);

  const send = useCallback((type: string, payload?: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const on = useCallback((type: string, handler: MessageHandler) => {
    const existing = handlers.current.get(type) ?? [];
    handlers.current.set(type, [...existing, handler]);
    return () => {
      const updated = (handlers.current.get(type) ?? []).filter((h) => h !== handler);
      handlers.current.set(type, updated);
    };
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect]);

  // Reconnect on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && !isConnected) connect();
      if (state === 'background') disconnect();
    });
    return () => sub.remove();
  }, [isConnected, connect, disconnect]);

  return { isConnected, send, on, disconnect, reconnectAttempts };
}
