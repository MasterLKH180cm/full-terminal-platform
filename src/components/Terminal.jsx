import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import '@xterm/xterm/css/xterm.css';

export default function Terminal({ id, onFocus, initialShellType }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [error, setError] = useState(null);
  const [shellType, setShellType] = useState(initialShellType || localStorage.getItem('defaultShell') || 'cmd');
  const [availableShells, setAvailableShells] = useState([]);
  const [workingDir, setWorkingDir] = useState('');
  const commandBuffer = useRef('');

  useEffect(() => {
    // Get home directory
    invoke('get_home_directory')
      .then((dir) => {
        setWorkingDir(dir);
      })
      .catch((err) => console.error('Failed to get home directory:', err));

    // Fetch available shells
    invoke('get_available_shells')
      .then((shells) => {
        setAvailableShells(shells);
        if (!initialShellType && shells.length > 0) {
          const defaultShell = localStorage.getItem('defaultShell') || shells[0].shell_type;
          setShellType(defaultShell);
        }
      })
      .catch((err) => console.error('Failed to get shells:', err));
  }, [initialShellType]);

  useEffect(() => {
    if (!terminalRef.current) return;

    try {
      const term = new XTerm({
        cursorBlink: true,
        fontSize: parseInt(localStorage.getItem('fontSize') || '14'),
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
          background: 'var(--bg-primary, #1e1e1e)',
          foreground: 'var(--text-primary, #ffffff)',
          cursor: '#4a9eff',
        },
        allowTransparency: false,
        convertEol: true,
        scrollback: 1000,
        windowsMode: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.writeln('\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m');
      term.writeln('\x1b[1;36m║  Full Terminal Platform              ║\x1b[0m');
      term.writeln('\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m');
      term.writeln('');
      if (workingDir) {
        term.writeln(`\x1b[90mWorking directory: ${workingDir}\x1b[0m`);
      }
      term.writeln('\x1b[90mEncoding: UTF-8 | Type commands and press Enter\x1b[0m');
      term.writeln('');
      writePrompt(term, shellType);

      // Handle input
      term.onData(async (data) => {
        const code = data.charCodeAt(0);

        // Handle Enter key
        if (code === 13) {
          term.write('\r\n');
          const command = commandBuffer.current.trim();
          
          if (command) {
            if (command.toLowerCase() === 'clear' || command.toLowerCase() === 'cls') {
              term.clear();
              writePrompt(term, shellType);
            } else {
              try {
                const result = await invoke('execute_command', { 
                  command, 
                  shellType,
                  workingDir: workingDir || null
                });
                
                if (result) {
                  const lines = result.split(/\r?\n/);
                  lines.forEach((line, index) => {
                    if (line.trim() || (index > 0 && index < lines.length - 1)) {
                      term.writeln(line);
                    }
                  });
                }
              } catch (err) {
                term.writeln(`\x1b[31m✗ Error: ${err}\x1b[0m`);
              }
            }
          }
          
          commandBuffer.current = '';
          writePrompt(term, shellType);
        }
        // Handle Backspace
        else if (code === 127 || code === 8) {
          if (commandBuffer.current.length > 0) {
            commandBuffer.current = commandBuffer.current.slice(0, -1);
            term.write('\b \b');
          }
        }
        // Handle Ctrl+C
        else if (code === 3) {
          term.write('^C\r\n');
          commandBuffer.current = '';
          writePrompt(term, shellType);
        }
        // Handle Ctrl+L (clear screen)
        else if (code === 12) {
          term.clear();
          commandBuffer.current = '';
          writePrompt(term, shellType);
        }
        // Handle Tab
        else if (code === 9) {
          term.write('    ');
        }
        // Handle printable characters
        else if (code >= 32) {
          commandBuffer.current += data;
          term.write(data);
        }
      });

      const handleResize = () => {
        try {
          fitAddon.fit();
        } catch (err) {
          setError('Failed to resize terminal');
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    } catch (err) {
      setError(`Failed to initialize terminal: ${err.message}`);
    }
  }, [id, shellType, workingDir]);

  const writePrompt = (term, shell) => {
    const prompts = {
      powershell: '\x1b[1;32mPS>\x1b[0m ',
      cmd: '\x1b[1;33mC:\\>\x1b[0m ',
      bash: '\x1b[1;34m$\x1b[0m ',
      zsh: '\x1b[1;35m%\x1b[0m ',
    };
    term.write(prompts[shell] || '$ ');
  };

  const handleClick = () => {
    if (xtermRef.current) {
      xtermRef.current.focus();
      if (onFocus) {
        onFocus(id);
      }
    }
  };

  const handleShellChange = (e) => {
    const newShell = e.target.value;
    setShellType(newShell);
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln(`\x1b[1;36mSwitched to ${newShell}\x1b[0m`);
      xtermRef.current.writeln('\x1b[90mEncoding: UTF-8\x1b[0m');
      xtermRef.current.writeln('');
      writePrompt(xtermRef.current, newShell);
    }
    commandBuffer.current = '';
  };

  return (
    <div 
      onClick={handleClick}
      onFocus={handleClick}
      tabIndex={0}
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--bg-primary, #1e1e1e)',
        border: '1px solid var(--border-color, #4a9eff)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'text',
        outline: 'none'
      }}
    >
      {/* Shell selector */}
      <div style={{
        padding: '8px 12px',
        background: 'var(--bg-secondary, #2d2d2d)',
        borderBottom: '1px solid var(--border-color, #4a9eff)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <label style={{ color: 'var(--text-primary, #ffffff)', fontSize: '12px' }}>
          Shell:
        </label>
        <select
          value={shellType}
          onChange={handleShellChange}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-primary, #1e1e1e)',
            color: 'var(--text-primary, #ffffff)',
            border: '1px solid var(--border-color, #4a9eff)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {availableShells.map((shell) => (
            <option key={shell.shell_type} value={shell.shell_type}>
              {shell.name}
            </option>
          ))}
        </select>
        <span style={{ 
          marginLeft: 'auto', 
          fontSize: '11px', 
          color: '#888',
          fontFamily: 'monospace'
        }}>
          UTF-8
        </span>
      </div>

      {error && (
        <div style={{
          background: '#ff4444',
          color: '#ffffff',
          padding: '8px 12px',
          borderBottom: '1px solid #cc0000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {error}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setError(null); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}
      <div ref={terminalRef} style={{ flex: 1, padding: '8px' }} />
    </div>
  );
}
