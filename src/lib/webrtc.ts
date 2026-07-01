"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "./socket";

// STUN handles most networks; TURN relays media when peers are behind
// symmetric NATs (e.g. two people on different mobile networks).
// Defaults use the public OpenRelay project TURN; override with your own via
// NEXT_PUBLIC_TURN_URL / NEXT_PUBLIC_TURN_USER / NEXT_PUBLIC_TURN_PASS.
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl.split(","),
      username: process.env.NEXT_PUBLIC_TURN_USER,
      credential: process.env.NEXT_PUBLIC_TURN_PASS,
    });
  } else {
    // free public fallback so cross-network video works out of the box
    servers.push(
      { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
    );
  }
  return servers;
}

const ICE_SERVERS: RTCIceServer[] = buildIceServers();

interface PeerEntry {
  pc: RTCPeerConnection;
  userId: string;
}

/**
 * Full-mesh WebRTC over Socket.IO signaling.
 * - The newly-joining peer initiates offers to all existing peers (avoids glare).
 * - Returns the local stream + a map of remote streams keyed by userId.
 * - If the socket isn't connected or camera/mic is unavailable, it degrades
 *   gracefully: the room still works, tiles just fall back to avatars.
 */
export function useMesh({
  roomId,
  active,
  micOn,
  camOn,
}: {
  roomId: string;
  active: boolean;
  micOn: boolean;
  camOn: boolean;
}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const peers = useRef<Map<string, PeerEntry>>(new Map());
  const localRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!active || !socket) return;

    let cancelled = false;

    const updateStreams = () => {
      const next: Record<string, MediaStream> = {};
      peers.current.forEach(({ pc, userId }) => {
        const [remote] = pc.getReceivers().map((r) => r.track).filter(Boolean).length
          ? [new MediaStream(pc.getReceivers().map((r) => r.track).filter((t): t is MediaStreamTrack => !!t))]
          : [];
        if (remote) next[userId] = remote;
      });
      setStreams(next);
    };

    const makePeer = (socketId: string, userId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localRef.current?.getTracks().forEach((t) => pc.addTrack(t, localRef.current!));
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("rtc:signal", { to: socketId, data: { candidate: e.candidate } });
      };
      pc.ontrack = () => updateStreams();
      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) updateStreams();
      };
      peers.current.set(socketId, { pc, userId });
      return pc;
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localRef.current = stream;
        setLocalStream(stream);
      } catch {
        setMediaError("Camera/mic unavailable — you're in listen-only mode.");
      }

      // announce ourselves; server replies with existing peers
      socket.emit("rtc:join", { roomId });

      socket.on("rtc:peers", async ({ peers: list }: { peers: { socketId: string; userId: string }[] }) => {
        for (const { socketId, userId } of list) {
          if (!socketId || peers.current.has(socketId)) continue;
          const pc = makePeer(socketId, userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("rtc:signal", { to: socketId, data: { sdp: pc.localDescription } });
        }
      });

      socket.on("rtc:peer-joined", ({ socketId, userId }: { socketId: string; userId: string }) => {
        // existing peer: wait for the newcomer's offer (they initiate)
        if (socketId && userId && !peers.current.has(socketId)) makePeer(socketId, userId);
      });

      socket.on(
        "rtc:signal",
        async ({ from, userId, data }: { from: string; userId: string; data: any }) => {
          let entry = peers.current.get(from);
          if (!entry) {
            makePeer(from, userId);
            entry = peers.current.get(from);
          }
          const pc = entry!.pc;
          if (data.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            if (data.sdp.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit("rtc:signal", { to: from, data: { sdp: pc.localDescription } });
            }
          } else if (data.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch {
              /* ignore late candidates */
            }
          }
        }
      );

      socket.on("rtc:peer-left", ({ socketId }: { socketId: string }) => {
        const entry = peers.current.get(socketId);
        if (entry) {
          entry.pc.close();
          peers.current.delete(socketId);
          updateStreams();
        }
      });
    };

    start();

    return () => {
      cancelled = true;
      socket.off("rtc:peers");
      socket.off("rtc:peer-joined");
      socket.off("rtc:signal");
      socket.off("rtc:peer-left");
      peers.current.forEach(({ pc }) => pc.close());
      peers.current.clear();
      localRef.current?.getTracks().forEach((t) => t.stop());
      localRef.current = null;
      setLocalStream(null);
      setStreams({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, active]);

  // reflect mic/cam toggles onto local tracks
  useEffect(() => {
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);
  useEffect(() => {
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = camOn));
  }, [camOn]);

  return { localStream, streams, mediaError };
}
