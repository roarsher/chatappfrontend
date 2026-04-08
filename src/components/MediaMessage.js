import React, { useState } from 'react';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaMessage({ message, isSent }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  const src = message.fileUrl ? `${serverUrl}${message.fileUrl}` : null;

  if (message.type === 'image') {
    return (
      <>
        <div
          className={`media-message media-message--image ${isSent ? 'sent' : 'received'}`}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={src}
            alt={message.fileName || 'Image'}
            className="media-img"
            loading="lazy"
          />
          <div className="media-overlay">
            <span>🔍 View</span>
          </div>
        </div>

        {lightboxOpen && (
          <div className="lightbox" onClick={() => setLightboxOpen(false)}>
            <img src={src} alt={message.fileName} className="lightbox-img" onClick={(e) => e.stopPropagation()} />
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
            <a
              className="lightbox-download"
              href={src}
              download={message.fileName}
              onClick={(e) => e.stopPropagation()}
            >
              ⬇ Download
            </a>
          </div>
        )}
      </>
    );
  }

  if (message.type === 'video') {
    return (
      <div className={`media-message media-message--video ${isSent ? 'sent' : 'received'}`}>
        <video
          src={src}
          controls
          className="media-video"
          preload="metadata"
        />
        <div className="media-filename">{message.fileName}</div>
      </div>
    );
  }

  // Generic file
  return (
    <a
      href={src}
      download={message.fileName}
      className={`media-message media-message--file ${isSent ? 'sent' : 'received'}`}
      target="_blank"
      rel="noreferrer"
    >
      <span className="media-file-icon">📄</span>
      <div className="media-file-info">
        <div className="media-file-name">{message.fileName}</div>
        <div className="media-file-size">{formatSize(message.fileSize)}</div>
      </div>
      <span className="media-file-dl">⬇</span>
    </a>
  );
}
