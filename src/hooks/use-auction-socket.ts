"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { resolveBaseUrl } from "@/lib/api-client";

export type AuctionEventName =
  | "CONNECTED"
  | "AUCTION_STARTED"
  | "AUCTION_PAUSED"
  | "AUCTION_RESUMED"
  | "PLAYER_CHANGED"
  | "BID_PLACED"
  | "PLAYER_SOLD"
  | "PLAYER_UNSOLD"
  | "AUCTION_COMPLETED"
  // replies to this socket only (team owners)
  | "AUTHED"
  | "AUTH_FAILED"
  | "BID_ACCEPTED"
  | "BID_REJECTED";

export interface AuctionMessage {
  event: AuctionEventName;
  auctionId?: string;
  data: Record<string, unknown>;
}

type Status = "connecting" | "open" | "closed";

const SOCKET_REPLIES: ReadonlySet<AuctionEventName> = new Set<AuctionEventName>([
  "AUTHED",
  "AUTH_FAILED",
  "BID_ACCEPTED",
  "BID_REJECTED",
]);

/**
 * Subscribes to live auction events and refreshes the auction state when the
 * server reports a change, so every connected screen stays in step without
 * polling or page reloads.
 *
 * With `authToken` the socket also authenticates as a team owner (re-sent on
 * every reconnect) and `sendBid` becomes usable.
 */
export function useAuctionSocket(
  auctionId: string | undefined,
  options: {
    onEvent?: (message: AuctionMessage) => void;
    notify?: boolean;
    authToken?: string | null;
  } = {}
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("connecting");
  const [authed, setAuthed] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  // keep the latest callback/token without forcing a reconnect when they change
  const onEventRef = useRef(options.onEvent);
  const tokenRef = useRef(options.authToken ?? null);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);
  useEffect(() => {
    tokenRef.current = options.authToken ?? null;
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN && tokenRef.current) {
      socket.send(JSON.stringify({ action: "auth", token: tokenRef.current }));
    }
  }, [options.authToken]);
  const notify = options.notify ?? true;

  useEffect(() => {
    if (!auctionId) return;

    // same host substitution as the REST client, so the socket follows the page host
    const base = resolveBaseUrl(process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3005/ws");
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");

      const socket = new WebSocket(`${base}?auctionId=${auctionId}`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        attemptsRef.current = 0;
        setStatus("open");
        if (tokenRef.current) {
          socket.send(JSON.stringify({ action: "auth", token: tokenRef.current }));
        }
      };

      socket.onmessage = (event) => {
        let message: AuctionMessage;
        try {
          message = JSON.parse(event.data as string) as AuctionMessage;
        } catch {
          return;
        }

        if (message.event === "CONNECTED") return;

        if (SOCKET_REPLIES.has(message.event)) {
          if (message.event === "AUTHED") setAuthed(true);
          if (message.event === "AUTH_FAILED") setAuthed(false);
          onEventRef.current?.(message);
          return;
        }

        // the server is the source of truth — refetch rather than guess
        queryClient.invalidateQueries({ queryKey: queryKeys.auctionState(auctionId) });

        if (
          message.event === "PLAYER_SOLD" ||
          message.event === "PLAYER_UNSOLD" ||
          message.event === "AUCTION_COMPLETED"
        ) {
          queryClient.invalidateQueries({ queryKey: queryKeys.auction(auctionId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.teams });
          queryClient.invalidateQueries({ queryKey: ["auction", auctionId, "players"] });
          queryClient.invalidateQueries({ queryKey: queryKeys.teamSession });
        }

        if (notify) {
          if (message.event === "PLAYER_SOLD") {
            const team = message.data.team as { name?: string } | undefined;
            toast.success(`Sold to ${team?.name ?? "the winning team"}`);
          } else if (message.event === "PLAYER_UNSOLD") {
            toast("Player went unsold");
          } else if (message.event === "AUCTION_COMPLETED") {
            toast.success("Auction completed");
          }
        }

        onEventRef.current?.(message);
      };

      socket.onclose = () => {
        if (cancelled) return;
        setStatus("closed");
        setAuthed(false);
        // back off, but keep trying — an auction screen must recover on its own
        const delay = Math.min(1000 * 2 ** attemptsRef.current, 15_000);
        attemptsRef.current += 1;
        reconnectRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      setAuthed(false);
    };
  }, [auctionId, queryClient, notify]);

  /** Sends a team bid. Returns false when the socket is not open. */
  const sendBid = useCallback((auctionPlayerId: string, amount: number): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ action: "bid", auctionPlayerId, amount }));
    return true;
  }, []);

  return { status, authed, sendBid };
}
