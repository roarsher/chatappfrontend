// client/src/components/VideoCall.jsx
import { useRef, useEffect } from "react";
import Peer from "simple-peer";
import { socket } from "../utils/socket";

export default function VideoCall() {
  const myVideo = useRef();
  const userVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myVideo.current.srcObject = stream;

        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream,
        });

        peer.on("signal", (data) => {
          socket.emit("callUser", data);
        });

        socket.on("callAccepted", (signal) => {
          peer.signal(signal);
        });

        peer.on("stream", (userStream) => {
          userVideo.current.srcObject = userStream;
        });
      });
  }, []);

  return (
    <div>
      <video ref={myVideo} autoPlay muted />
      <video ref={userVideo} autoPlay />
    </div>
  );
}