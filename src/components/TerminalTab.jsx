import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';

export default function TerminalTab({ tabId, isActive }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Create PTY on Rust side
    invoke('create_pty', { tabId })
      .catch(err => {
        term.writeln(`\r\n\x1b[31mFailed to create terminal: ${err}\x1b[0m\r\n`);
      });

    // Send user input to PTY
    const disposable = term.onData(data => {
      invoke('pty_write', { tabId, data })
        .catch(err => console.error('Failed to write to PTY:', err));
    });

    // Listen for PTY output
    const unlistenPromise = listen('pty-output', event => {
      const payload = event.payload;
      if (payload.tab_id === tabId && termRef.current) {
        termRef.current.write(payload.data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && termRef.current) {
        fitAddonRef.current.fit();
        const { rows, cols } = termRef.current;
        invoke('resize_pty', { tabId, cols, rows })
          .catch(err => console.error('Failed to resize PTY:', err));
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      disposable.dispose();
      unlistenPromise.then(unlisten => unlisten());
      resizeObserver.disconnect();
      if (termRef.current) {
        termRef.current.dispose();
      }
      invoke('close_pty', { tabId }).catch(err => 
        console.error('Failed to close PTY:', err)
      );
    };
  }, [tabId]);

  // Fit terminal when tab becomes active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current.fit(), 0);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: isActive ? 'block' : 'none',
      }}
    />
  );
}
