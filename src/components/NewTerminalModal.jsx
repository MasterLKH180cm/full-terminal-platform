import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function NewTerminalModal({ onClose, onConfirm }) {
  const [availableShells, setAvailableShells] = useState([]);
  const [selectedShell, setSelectedShell] = useState('');

  useEffect(() => {
    const defaultShell = localStorage.getItem('defaultShell') || 'cmd';
    
    invoke('get_available_shells')
      .then((shells) => {
        setAvailableShells(shells);
        const shellExists = shells.some(s => s.shell_type === defaultShell);
        setSelectedShell(shellExists ? defaultShell : shells[0]?.shell_type || 'cmd');
      })
      .catch((err) => {
        console.error('Failed to get shells:', err);
      });
  }, []);

  const handleConfirm = () => {
    onConfirm(selectedShell);
    onClose();
  };

  const getShellIcon = (shellType) => {
    const icons = {
      powershell: '🔷',
      cmd: '⬛',
      bash: '🐚',
      zsh: '⚡'
    };
    return icons[shellType] || '💻';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-primary, #1e1e1e)',
        border: '2px solid var(--border-color, #4a9eff)',
        borderRadius: '8px',
        padding: '16px',
        minWidth: '350px',
        maxWidth: '500px'
      }}>
        <h2 style={{ 
          color: 'var(--text-primary, #ffffff)', 
          marginBottom: '12px',
          fontSize: '18px'
        }}>
          New Terminal
        </h2>

        <p style={{ 
          color: 'var(--text-primary, #ffffff)', 
          marginBottom: '12px',
          opacity: 0.8,
          fontSize: '13px'
        }}>
          Choose a shell type for the new terminal:
        </p>

        <div style={{ marginBottom: '16px' }}>
          {availableShells.map((shell) => (
            <div
              key={shell.shell_type}
              onClick={() => setSelectedShell(shell.shell_type)}
              style={{
                padding: '8px 12px',
                marginBottom: '6px',
                borderRadius: '6px',
                border: selectedShell === shell.shell_type 
                  ? '2px solid var(--border-color, #4a9eff)' 
                  : '2px solid transparent',
                background: selectedShell === shell.shell_type 
                  ? 'var(--bg-secondary, #2d2d2d)' 
                  : 'var(--bg-primary, #1e1e1e)',
                color: 'var(--text-primary, #ffffff)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                transform: selectedShell === shell.shell_type ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (selectedShell !== shell.shell_type) {
                  e.currentTarget.style.background = 'var(--bg-secondary, #2d2d2d)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedShell !== shell.shell_type) {
                  e.currentTarget.style.background = 'var(--bg-primary, #1e1e1e)';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {getShellIcon(shell.shell_type)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {shell.name}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  {shell.path}
                </div>
              </div>
              {selectedShell === shell.shell_type && (
                <span style={{ color: 'var(--border-color, #4a9eff)', fontSize: '18px' }}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'transparent',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedShell}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: selectedShell ? 'var(--border-color, #4a9eff)' : '#555',
              color: '#ffffff',
              cursor: selectedShell ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
