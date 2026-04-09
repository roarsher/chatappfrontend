 

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

 const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

export const useCall = (currentUser) => {
  const { socketRef, socketVersion } = useSocket();

  const [callState,   setCallState]   = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream,setRemoteStream]= useState(null);
  const [isMuted,     setIsMuted]     = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const peerRef         = useRef(null);
  const localStreamRef  = useRef(null);  // Always holds the live stream object

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack         = null;
      peerRef.current.onicecandidate  = null;
      peerRef.current.onconnectionstatechange = null;
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

  // ─── Create peer connection ────────────────────────────────────────────────
  const createPeer = useCallback((targetUserId, callId) => {
    //const peer = new RTCPeerConnection(ICE_SERVERS);
    const peer = new RTCPeerConnection({
    ...ICE_SERVERS,
    iceCandidatePoolSize: 10,
    });

    peer.onicecandidate = ({ candidate }) => {
      const socket = socketRef.current;
      if (candidate && socket) {
        socket.emit('iceCandidate', { callId, candidate, targetUserId });
      }
    };

    // Remote tracks arriving → set remoteStream state
    peer.ontrack = (event) => {
      // event.streams[0] is the full MediaStream from the remote peer
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        // Fallback: build a stream from individual tracks
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
      setCallState((prev) => prev ? { ...prev, status: 'active' } : prev);
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      console.log('Peer connection state:', state);
      if (['failed', 'disconnected', 'closed'].includes(state)) {
        cleanup();
        setCallState(null);
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log('ICE state:', peer.iceConnectionState);
    };

    return peer;
  }, [socketRef, cleanup]);

  // ─── Get user media ───────────────────────────────────────────────────────
  const getMedia = useCallback(async (callType) => {
    const constraints = {
      audio: true,
      video: callType === 'video'
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);   // This triggers the local <video> to show caller's face
    return stream;
  }, []);

  // ─── Start outgoing call ──────────────────────────────────────────────────
  const startCall = useCallback(async (remoteUser, callType) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      alert('Not connected to server. Please wait and try again.');
      return;
    }
    if (peerRef.current) {
      alert('A call is already in progress.');
      return;
    }
    try {
      // 1. Get local camera/mic FIRST so caller sees themselves immediately
      const stream = await getMedia(callType);

      const callId = `${currentUser._id}_${remoteUser._id}_${Date.now()}`;
      const peer   = createPeer(remoteUser._id, callId);
      peerRef.current = peer;

      // 2. Add local tracks to peer so the other side receives them
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      // 3. Create and send offer
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === 'video' });
      await peer.setLocalDescription(offer);

      socket.emit('callUser', { receiverId: remoteUser._id, callType, offer, callId });

      // Set callState AFTER media acquired so modal opens showing local video
      setCallState({ callId, type: callType, direction: 'outgoing', status: 'ringing', remoteUser });
    } catch (err) {
      console.error('startCall error:', err);
      cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Camera/microphone access denied.\nPlease allow permissions in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera or microphone found.\nPlease connect a device and try again.');
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
      // 1. Get local media (callee also needs to show their video)
      const stream = await getMedia(callState.type);

      const peer = createPeer(callState.remoteUser._id, callState.callId);
      peerRef.current = peer;

      // 2. Add local tracks
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      // 3. Set caller's offer as remote description
      await peer.setRemoteDescription(new RTCSessionDescription(callState.offer));

      // 4. Create and send answer
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

  // ─── End call ─────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    const socket = socketRef.current;
    if (!callState) return;
    if (socket) socket.emit('endCall', { callId: callState.callId, targetUserId: callState.remoteUser._id });
    cleanup();
    setCallState(null);
  }, [callState, socketRef, cleanup]);

  // ─── Toggle mute ──────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const enabled = !localStreamRef.current.getAudioTracks()[0]?.enabled;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    setIsMuted(!enabled);
  }, []);

  // ─── Toggle camera ────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const enabled = !localStreamRef.current.getVideoTracks()[0]?.enabled;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = enabled; });
    setIsCameraOff(!enabled);
  }, []);

  // ─── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onIncomingCall = ({ callId, callerId, callerName, callType, offer }) => {
      setCallState((prev) => {
        if (prev && prev.status !== 'ended') return prev; // Don't interrupt active call
        return {
          callId, type: callType, direction: 'incoming', status: 'ringing',
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
        console.error('setRemoteDescription error:', e);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (peerRef.current && candidate) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('addIceCandidate error:', e);
        }
      }
    };

    const onCallRejected = () => { cleanup(); setCallState(null); };
    const onCallEnded    = () => { cleanup(); setCallState(null); };
    const onCallFailed   = ({ reason }) => {
      cleanup(); setCallState(null);
      alert(`Call failed: ${reason}`);
    };

    socket.on('incomingCall',  onIncomingCall);
    socket.on('callAccepted',  onCallAccepted);
    socket.on('iceCandidate',  onIceCandidate);
    socket.on('callRejected',  onCallRejected);
    socket.on('callEnded',     onCallEnded);
    socket.on('callFailed',    onCallFailed);

    return () => {
      socket.off('incomingCall',  onIncomingCall);
      socket.off('callAccepted',  onCallAccepted);
      socket.off('iceCandidate',  onIceCandidate);
      socket.off('callRejected',  onCallRejected);
      socket.off('callEnded',     onCallEnded);
      socket.off('callFailed',    onCallFailed);
    };
  }, [socketVersion, cleanup]); // eslint-disable-line

  return { callState, localStream, remoteStream, isMuted, isCameraOff, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera };
};