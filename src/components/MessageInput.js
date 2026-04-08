 import React, { useState, useRef, useCallback } from 'react';
 import api from '../utils/api';
 
 export default function MessageInput({ onSend, onTyping, disabled, selectedUserId, onMediaSent }) {
   const [value, setValue] = useState('');
   const [uploading, setUploading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
   const textareaRef = useRef(null);
   const fileInputRef = useRef(null);
   const isTypingRef = useRef(false);
 
   const handleChange = (e) => {
     setValue(e.target.value);
     if (!isTypingRef.current) {
       isTypingRef.current = true;
       onTyping?.(true);
     }
     const el = textareaRef.current;
     if (el) {
       el.style.height = 'auto';
       el.style.height = Math.min(el.scrollHeight, 120) + 'px';
     }
   };
 
   const handleBlur = () => {
     if (isTypingRef.current) {
       isTypingRef.current = false;
       onTyping?.(false);
     }
   };
 
   const submit = useCallback(() => {
     const trimmed = value.trim();
     if (!trimmed || disabled || uploading) return;
     onSend(trimmed);
     setValue('');
     isTypingRef.current = false;
     onTyping?.(false);
     if (textareaRef.current) textareaRef.current.style.height = 'auto';
   }, [value, disabled, uploading, onSend, onTyping]);
 
   const handleKeyDown = (e) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       submit();
     }
   };
 
   // ─── File / media upload ─────────────────────────────────────────────────────
   const handleFileChange = useCallback(async (e) => {
     const file = e.target.files?.[0];
     if (!file || !selectedUserId) return;
 
     const MAX = 50 * 1024 * 1024;
     if (file.size > MAX) return alert('File must be under 50 MB.');
 
     const formData = new FormData();
     formData.append('file', file);
     formData.append('receiverId', selectedUserId);
 
     setUploading(true);
     setUploadProgress(0);
 
     try {
       const { data } = await api.post('/chat/upload', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
         onUploadProgress: (e) => {
           setUploadProgress(Math.round((e.loaded * 100) / e.total));
         },
       });
       onMediaSent?.(data.message);
     } catch (err) {
       alert(err.response?.data?.message || 'Upload failed. Please try again.');
     } finally {
       setUploading(false);
       setUploadProgress(0);
       e.target.value = '';
     }
   }, [selectedUserId, onMediaSent]);
 
   return (
     <div className="message-input-area">
       {uploading && (
         <div className="upload-progress-bar">
           <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
           <span className="upload-progress-label">Uploading… {uploadProgress}%</span>
         </div>
       )}
 
       <div className="message-input-row">
         {/* Attach button */}
         <button
           className="attach-btn"
           onClick={() => fileInputRef.current?.click()}
           disabled={disabled || uploading || !selectedUserId}
           title="Attach photo, video, or file"
         >
           📎
         </button>
 
         <input
           ref={fileInputRef}
           type="file"
           accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
           style={{ display: 'none' }}
           onChange={handleFileChange}
         />
 
         <textarea
           ref={textareaRef}
           className="message-input"
           value={value}
           onChange={handleChange}
           onKeyDown={handleKeyDown}
           onBlur={handleBlur}
           placeholder={uploading ? 'Uploading…' : 'Write a message…'}
           rows={1}
           disabled={disabled || uploading}
         />
 
         <button
           className="btn-send"
           onClick={submit}
           disabled={!value.trim() || disabled || uploading}
           title="Send message"
         >
           ➤
         </button>
       </div>
     </div>
   );
 }
 