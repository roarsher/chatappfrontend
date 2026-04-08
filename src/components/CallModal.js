import React, { useEffect, useRef } from 'react';

export default function CallModal({
  callState,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!callState) return null;

  const { type, direction, status, remoteUser } = callState;
  const isVideo = type === 'video';
  const isRinging = status === 'ringing';
  const isActive = status === 'active' || status === 'connecting';

  return (
    <div className="call-overlay">
      <div className={`call-modal ${isVideo && isActive ? 'call-modal--video' : ''}`}>

        {/* ── Video streams (only shown during video call) ── */}
        {isVideo && isActive && (
          <div className="call-video-container">
            <video
              ref={remoteVideoRef}
              className="call-video-remote"
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className="call-video-local"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}

        {/* ── Avatar shown for audio calls or while ringing ── */}
        {(!isVideo || isRinging) && (
          <div className="call-avatar-section">
            <div className="call-avatar-ring">
              <div className="call-avatar-ring__inner">
                {remoteUser.username?.[0]?.toUpperCase()}
              </div>
            </div>
            <div className="call-user-name">{remoteUser.username}</div>
            <div className="call-status-label">
              {direction === 'incoming' && isRinging && `Incoming ${type} call…`}
              {direction === 'outgoing' && isRinging && `Calling…`}
              {status === 'connecting' && 'Connecting…'}
              {status === 'active' && (isVideo ? '🎥 Video call' : '🎙 Audio call')}
            </div>
          </div>
        )}

        {/* ── Controls ── */}
        <div className="call-controls">
          {/* Incoming ringing: accept / reject */}
          {direction === 'incoming' && isRinging && (
            <>
              <button className="call-btn call-btn--reject" onClick={onReject} title="Decline">
                <span>✕</span>
              </button>
              <button className="call-btn call-btn--accept" onClick={onAccept} title="Accept">
                <span>📞</span>
              </button>
            </>
          )}

          {/* Outgoing ringing: cancel */}
          {direction === 'outgoing' && isRinging && (
            <button className="call-btn call-btn--reject" onClick={onEnd} title="Cancel">
              <span>✕</span>
            </button>
          )}

          {/* Active call controls */}
          {isActive && (
            <>
              <button
                className={`call-btn call-btn--ctrl ${isMuted ? 'call-btn--active' : ''}`}
                onClick={onToggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎙'}
              </button>

              {isVideo && (
                <button
                  className={`call-btn call-btn--ctrl ${isCameraOff ? 'call-btn--active' : ''}`}
                  onClick={onToggleCamera}
                  title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isCameraOff ? '🚫' : '📹'}
                </button>
              )}

              <button className="call-btn call-btn--reject" onClick={onEnd} title="End call">
                <span>📵</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
