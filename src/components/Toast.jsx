import React, { useEffect, useState, useCallback } from 'react';

let listeners = [];
let idCounter = 0;

export const toast = {
  success: (message) => emit({ type: 'success', message }),
  error: (message) => emit({ type: 'error', message }),
  info: (message) => emit({ type: 'info', message }),
  message: (data) => emit({ type: 'message', ...data }), // data: { title, body, avatar, onClick }
};

function emit(payload) {
  const item = { ...payload, id: ++idCounter, createdAt: Date.now() };
  listeners.forEach((fn) => fn(item));
}

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  )
};

const COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#3b82f6',
  message: '#D24D77'
};

const ToastItem = ({ item, onDismiss }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  
  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(item.id);
    }, 300); // match exit animation duration
  }, [item.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, 5000);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  const getAvatarInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const isMessage = item.type === 'message';
  const color = COLORS[item.type];

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    minHeight: '64px',
    width: '320px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '8px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    borderLeft: `4px solid ${color}`,
    cursor: isMessage && item.onClick ? 'pointer' : 'default',
    animation: isLeaving ? 'toastSlideOut 0.3s forwards ease-in' : 'toastSlideIn 0.4s forwards cubic-bezier(0.16, 1, 0.3, 1)',
    transform: 'translateX(120%)',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const progressStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    backgroundColor: color,
    animation: 'toastProgress 5s linear forwards',
    opacity: 0.8
  };

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    alignSelf: 'flex-start',
    outline: 'none'
  };

  return (
    <div style={containerStyle} onClick={() => {
      if (isMessage && item.onClick) {
        item.onClick();
        handleDismiss();
      }
    }}>
      {!isMessage && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {ICONS[item.type]}
        </div>
      )}

      {isMessage && (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#fdf2f8',
          color: COLORS.message,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontWeight: 'bold',
          fontSize: '14px',
          backgroundImage: item.avatar ? `url(${item.avatar})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid #fbcfe8',
          boxSizing: 'border-box'
        }}>
          {!item.avatar && getAvatarInitials(item.title)}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
        {isMessage ? (
          <>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </span>
            <span style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.body}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', lineHeight: '1.4' }}>
            {item.message}
          </span>
        )}
      </div>

      <button style={closeBtnStyle} onClick={(e) => {
        e.stopPropagation();
        handleDismiss();
      }} aria-label="Close">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div style={progressStyle} />
    </div>
  );
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (item) => {
      setToasts((prev) => {
        // Add new to top, keeping max 4
        return [item, ...prev].slice(0, 4);
      });
    };
    listeners.push(onToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== onToast);
    };
  }, []);

  const handleDismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          0% { transform: translateX(120%); opacity: 0.5; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem item={t} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
