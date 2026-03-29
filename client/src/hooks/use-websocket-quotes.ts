/**
 * useWebSocketQuotes
 *
 * Connects to the /ws/quotes WebSocket endpoint for real-time price updates.
 * Falls back gracefully if WebSocket is unavailable.
 *
 * Features:
 *   - Exponential backoff reconnection (1s → 2s → 4s → … → 30s max)
 *   - Heartbeat ping every 30 seconds
 *   - Exposes quotes, connectionState, and lastUpdated
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface QuoteData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  open: number;
  timestamp: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected" | "disabled";

const WS_ENABLED = import.meta.env.VITE_WEBSOCKET_ENABLED !== "false";
const MAX_RECONNECT_DELAY_MS = 30_000;
const PING_INTERVAL_MS = 30_000;

export function useWebSocketQuotes() {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    WS_ENABLED ? "connecting" : "disabled"
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(1_000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!WS_ENABLED || !mountedRef.current) return;

    // Build WebSocket URL from current page origin
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/quotes`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setConnectionState("connecting");

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionState("connected");
        reconnectDelayRef.current = 1_000; // reset backoff on success

        // Start heartbeat
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "quotes" && Array.isArray(msg.data)) {
            setQuotes(msg.data);
            setLastUpdated(new Date());
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        clearTimers();
        setConnectionState("disconnected");

        // Exponential backoff reconnect
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose will fire after onerror — reconnect handled there
        ws.close();
      };
    } catch {
      // WebSocket not supported or URL invalid — disable
      setConnectionState("disabled");
    }
  }, [clearTimers]);

  useEffect(() => {
    mountedRef.current = true;
    if (WS_ENABLED) connect();

    return () => {
      mountedRef.current = false;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearTimers]);

  return { quotes, connectionState, lastUpdated };
}
