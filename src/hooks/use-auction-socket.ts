"use client";

import { useEffect, useRef, useState } from "react";
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
  | "AUCTION_COMPLETED";

interface AuctionMessage {
  event: AuctionEventName;
  auctionId: string;
  data: Record<string, unknown>;
}

type Status = "connecting" | "open" | "closed";

/**
 * Subscribes to live auction events and refreshes the auction state when the
 * server reports a change, so every connected screen stays in step without
 * polling or page reloads.
 */
export function useAuctionSocket(
  auctionId: string | undefined,
  options: { onEvent?: (message: AuctionMessage) => void; notify?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  // keep the latest callback without forcing a reconnect when it changes
  const onEventRef = useRef(options.onEvent);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);
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
      };

      socket.onmessage = (event) => {
        let message: AuctionMessage;
        try {
          message = JSON.parse(event.data as string) as AuctionMessage;
        } catch {
          return;
        }

        if (message.event === "CONNECTED") return;

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
    };
  }, [auctionId, queryClient, notify]);

  return { status };
}
