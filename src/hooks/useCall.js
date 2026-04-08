 import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useCall = (currentUser) => {
  // Use socketRef so we always read the live socket, never a stale null
  const { socketRef, socketVersion } = useSocket();

  const [callState, setCallState] = useState(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  // ─── Create RTCPeerConnection ─────────────────────────────────────────────
  const createPeer = useCallback((targetUserId, callId, isInitiator) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = ({ candidate }) => {
      const socket = socketRef.current;
      if (candidate && socket) {
        socket.emit('iceCandidate', { callId, candidate, targetUserId });
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
      // Mark call as active once remote tracks arrive
      setCallState((prev) => prev ? { ...prev, status: 'active' } : prev);
    };

    peer.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(peer.connectionState)) {
        cleanup();
        setCallState(null);
      }
    };

    return peer;
  }, [socketRef, cleanup]);

  // ─── Get user media ───────────────────────────────────────────────────────
  const getMedia = useCallback(async (callType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ─── Start outgoing call ──────────────────────────────────────────────────
  const startCall = useCallback(async (remoteUser, callType) => {
    const socket = socketRef.current;
    if (!socket) {
      alert('Not connected to server. Please wait a moment and try again.');
      return;
    }
    if (peerRef.current) {
      alert('A call is already in progress.');
      return;
    }
    try {
      const stream = await getMedia(callType);
      const callId = `${currentUser._id}_${remoteUser._id}_${Date.now()}`;
      const peer = createPeer(remoteUser._id, callId, true);
      peerRef.current = peer;

      stream.getTracks().forEach((t) => peer.addTrack(t, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('callUser', { receiverId: remoteUser._id, callType, offer, callId });

      setCallState({ callId, type: callType, direction: 'outgoing', status: 'ringing', remoteUser });
    } catch (err) {
      console.error('startCall error:', err);
      cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera/microphone access denied. Please allow permissions in your browser and try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera or microphone found. Please connect a device and try again.');
      } else {
        alert('Could not start call: ' + err.message);
      }
    }
  }, [socketRef, currentUser, getMedia, createPeer, cleanup]);

  // ─── Accept incoming call ─────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const socket = socketRef.current;
    if (!callState || !socket) return;
    try {
      const stream = await getMedia(callState.type);
      const peer = createPeer(callState.remoteUser._id, callState.callId, false);
      peerRef.current = peer;

      stream.getTracks().forEach((t) => peer.addTrack(t, stream));
      await peer.setRemoteDescription(new RTCSessionDescription(callState.offer));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('acceptCall', { callId: callState.callId, answer });
      setCallState((prev) => ({ ...prev, status: 'connecting' }));
    } catch (err) {
      console.error('acceptCall error:', err);
      cleanup();
      setCallState(null);
      if (err.name === 'NotAllowedError') {
        alert('Camera/microphone access denied. Could not join the call.');
      }
    }
  }, [callState, socketRef, getMedia, createPeer, cleanup]);

  // ─── Reject call ──────────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    const socket = socketRef.current;
    if (!callState) return;
    if (socket) socket.emit('rejectCall', { callId: callState.callId });
    cleanup();
    setCallState(null);
  }, [callState, socketRef, cleanup]);

  // ─── End active call ──────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    const socket = socketRef.current;
    if (!callState) return;
    if (socket) {
      socket.emit('endCall', {
        callId: callState.callId,
        targetUserId: callState.remoteUser._id,
      });
    }
    cleanup();
    setCallState(null);
  }, [callState, socketRef, cleanup]);

  // ─── Toggle mute / camera ─────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((prev) => !prev);
  }, []);

  // ─── Socket event listeners — re-subscribe when socket reconnects ─────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onIncomingCall = ({ callId, callerId, callerName, callType, offer }) => {
      // Don't interrupt an already-active call
      setCallState((prev) => {
        if (prev && prev.status !== 'ended') return prev;
        return {
          callId,
          type: callType,
          direction: 'incoming',
          status: 'ringing',
          offer,
          remoteUser: { _id: callerId, username: callerName },
        };
      });
    };

    const onCallAccepted = async ({ answer }) => {
      if (!peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState((prev) => prev ? { ...prev, status: 'active' } : null);
      } catch (e) {
        console.error('setRemoteDescription failed:', e);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (peerRef.current && candidate) {
        try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.warn('addIceCandidate error:', e); }
      }
    };

    const onCallRejected = () => {
      cleanup();
      setCallState(null);
    };

    const onCallEnded = () => {
      cleanup();
      setCallState(null);
    };

    const onCallFailed = ({ reason }) => {
      cleanup();
      setCallState(null);
      alert(`Call failed: ${reason}`);
    };

    socket.on('incomingCall', onIncomingCall);
    socket.on('callAccepted', onCallAccepted);
    socket.on('iceCandidate', onIceCandidate);
    socket.on('callRejected', onCallRejected);
    socket.on('callEnded', onCallEnded);
    socket.on('callFailed', onCallFailed);

    return () => {
      socket.off('incomingCall', onIncomingCall);
      socket.off('callAccepted', onCallAccepted);
      socket.off('iceCandidate', onIceCandidate);
      socket.off('callRejected', onCallRejected);
      socket.off('callEnded', onCallEnded);
      socket.off('callFailed', onCallFailed);
    };
    // Re-run when socket reconnects (socketVersion increments)
  }, [socketVersion, cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
};