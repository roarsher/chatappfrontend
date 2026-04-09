// import React, { useEffect, useRef } from 'react';

// export default function CallModal({
//   callState,
//   localStream,
//   remoteStream,
//   isMuted,
//   isCameraOff,
//   onAccept,
//   onReject,
//   onEnd,
//   onToggleMute,
//   onToggleCamera,
// }) {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//   }, [localStream]);

//   useEffect(() => {
//     if (remoteVideoRef.current && remoteStream) {
//       remoteVideoRef.current.srcObject = remoteStream;
//     }
//   }, [remoteStream]);

//   if (!callState) return null;

//   const { type, direction, status, remoteUser } = callState;
//   const isVideo = type === 'video';
//   const isRinging = status === 'ringing';
//   const isActive = status === 'active' || status === 'connecting';

//   return (
//     <div className="call-overlay">
//       <div className={`call-modal ${isVideo && isActive ? 'call-modal--video' : ''}`}>

//         {/* ── Video streams (only shown during video call) ── */}
//         {isVideo && isActive && (
//           <div className="call-video-container">
//             <video
//               ref={remoteVideoRef}
//               className="call-video-remote"
//               autoPlay
//               playsInline
//             />
//             <video
//               ref={localVideoRef}
//               className="call-video-local"
//               autoPlay
//               playsInline
//               muted
//             />
//           </div>
//         )}

//         {/* ── Avatar shown for audio calls or while ringing ── */}
//         {(!isVideo || isRinging) && (
//           <div className="call-avatar-section">
//             <div className="call-avatar-ring">
//               <div className="call-avatar-ring__inner">
//                 {remoteUser.username?.[0]?.toUpperCase()}
//               </div>
//             </div>
//             <div className="call-user-name">{remoteUser.username}</div>
//             <div className="call-status-label">
//               {direction === 'incoming' && isRinging && `Incoming ${type} call…`}
//               {direction === 'outgoing' && isRinging && `Calling…`}
//               {status === 'connecting' && 'Connecting…'}
//               {status === 'active' && (isVideo ? '🎥 Video call' : '🎙 Audio call')}
//             </div>
//           </div>
//         )}

//         {/* ── Controls ── */}
//         <div className="call-controls">
//           {/* Incoming ringing: accept / reject */}
//           {direction === 'incoming' && isRinging && (
//             <>
//               <button className="call-btn call-btn--reject" onClick={onReject} title="Decline">
//                 <span>✕</span>
//               </button>
//               <button className="call-btn call-btn--accept" onClick={onAccept} title="Accept">
//                 <span>📞</span>
//               </button>
//             </>
//           )}

//           {/* Outgoing ringing: cancel */}
//           {direction === 'outgoing' && isRinging && (
//             <button className="call-btn call-btn--reject" onClick={onEnd} title="Cancel">
//               <span>✕</span>
//             </button>
//           )}

//           {/* Active call controls */}
//           {isActive && (
//             <>
//               <button
//                 className={`call-btn call-btn--ctrl ${isMuted ? 'call-btn--active' : ''}`}
//                 onClick={onToggleMute}
//                 title={isMuted ? 'Unmute' : 'Mute'}
//               >
//                 {isMuted ? '🔇' : '🎙'}
//               </button>

//               {isVideo && (
//                 <button
//                   className={`call-btn call-btn--ctrl ${isCameraOff ? 'call-btn--active' : ''}`}
//                   onClick={onToggleCamera}
//                   title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
//                 >
//                   {isCameraOff ? '🚫' : '📹'}
//                 </button>
//               )}

//               <button className="call-btn call-btn--reject" onClick={onEnd} title="End call">
//                 <span>📵</span>
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useRef, useCallback } from 'react';

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
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  // ── Attach stream to a video element safely ─────────────────────────────────
  // Using a callback ref pattern so srcObject is set the moment the <video>
  // mounts, regardless of whether the stream arrived before or after render.
  const attachStream = useCallback((el, stream) => {
    if (!el || !stream) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch(() => {}); // Autoplay may be blocked; swallow silently
    }
  }, []);

  // Re-attach whenever streams change (e.g. stream arrives after element mounts)
  useEffect(() => {
    attachStream(localVideoRef.current,  localStream);
  }, [localStream,  attachStream]);

  useEffect(() => {
    attachStream(remoteVideoRef.current, remoteStream);
  }, [remoteStream, attachStream]);

  // Callback refs — fire the moment the element mounts or unmounts
  const localRefCallback = useCallback((el) => {
    localVideoRef.current = el;
    attachStream(el, localStream);
  }, [localStream, attachStream]);

  const remoteRefCallback = useCallback((el) => {
    remoteVideoRef.current = el;
    attachStream(el, remoteStream);
  }, [remoteStream, attachStream]);

  if (!callState) return null;

  const { type, direction, status, remoteUser } = callState;
  const isVideo   = type === 'video';
  const isRinging = status === 'ringing';
  const isActive  = status === 'active' || status === 'connecting';
  const initial   = remoteUser?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="call-overlay">
      <div className={`call-modal ${isVideo && isActive ? 'call-modal--video' : ''}`}>

        {/* ── Video streams ──────────────────────────────────────────────── */}
        {isVideo && isActive && (
          <div className="call-video-container">
            {/* Remote video — full screen (the person you're talking to) */}
            <video
              ref={remoteRefCallback}
              className="call-video-remote"
              autoPlay
              playsInline
            />
            {/* Local video — picture-in-picture (yourself) */}
            <video
              ref={localRefCallback}
              className="call-video-local"
              autoPlay
              playsInline
              muted     /* Always mute local to avoid echo */
            />
            {/* Show name overlay on remote video */}
            <div className="call-video-name-overlay">
              {remoteUser?.username}
            </div>
          </div>
        )}

        {/* ── Avatar / status (audio call or ringing state) ──────────────── */}
        {(!isVideo || isRinging) && (
          <div className="call-avatar-section">
            <div className="call-avatar-ring">
              <div className="call-avatar-ring__inner">{initial}</div>
            </div>
            <div className="call-user-name">{remoteUser?.username}</div>
            <div className="call-status-label">
              {direction === 'incoming' && isRinging  && `Incoming ${type} call…`}
              {direction === 'outgoing' && isRinging  && 'Calling…'}
              {status === 'connecting'                && 'Connecting…'}
              {status === 'active' && !isRinging      && (isVideo ? '📹 Video call' : '🎙 Audio call')}
            </div>
          </div>
        )}

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="call-controls">

          {/* Incoming: reject + accept */}
          {direction === 'incoming' && isRinging && (
            <>
              <div className="call-btn-wrap">
                <button className="call-btn call-btn--reject" onClick={onReject}>✕</button>
                <span className="call-btn-label">Decline</span>
              </div>
              <div className="call-btn-wrap">
                <button className="call-btn call-btn--accept" onClick={onAccept}>📞</button>
                <span className="call-btn-label">Accept</span>
              </div>
            </>
          )}

          {/* Outgoing ringing: cancel only */}
          {direction === 'outgoing' && isRinging && (
            <div className="call-btn-wrap">
              <button className="call-btn call-btn--reject" onClick={onEnd}>✕</button>
              <span className="call-btn-label">Cancel</span>
            </div>
          )}

          {/* Active call controls */}
          {isActive && (
            <>
              <div className="call-btn-wrap">
                <button
                  className={`call-btn call-btn--ctrl ${isMuted ? 'call-btn--active' : ''}`}
                  onClick={onToggleMute}
                >
                  {isMuted ? '🔇' : '🎙'}
                </button>
                <span className="call-btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              {isVideo && (
                <div className="call-btn-wrap">
                  <button
                    className={`call-btn call-btn--ctrl ${isCameraOff ? 'call-btn--active' : ''}`}
                    onClick={onToggleCamera}
                  >
                    {isCameraOff ? '🚫' : '📹'}
                  </button>
                  <span className="call-btn-label">{isCameraOff ? 'Start Cam' : 'Stop Cam'}</span>
                </div>
              )}

              <div className="call-btn-wrap">
                <button className="call-btn call-btn--reject" onClick={onEnd}>📵</button>
                <span className="call-btn-label">End</span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}