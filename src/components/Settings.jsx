import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function Settings({ onClose }) {
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'dark',
    primaryColor: localStorage.getItem('primaryColor') || '#4a9eff',
    layout: localStorage.getItem('layout') || 'horizontal',
    fontSize: localStorage.getItem('fontSize') || '14',
    defaultShell: localStorage.getItem('defaultShell') || 'cmd'
  });
  const [availableShells, setAvailableShells] = useState([]);

  const themes = {
    dark: { bg: '#1e1e1e', text: '#ffffff', secondary: '#2d2d2d' },
    light: { bg: '#ffffff', text: '#000000', secondary: '#f5f5f5' },
    monokai: { bg: '#272822', text: '#f8f8f2', secondary: '#3e3d32' }
  };

  useEffect(() => {
    // Fetch available shells
    invoke('get_available_shells')
      .then((shells) => {
        setAvailableShells(shells);
        if (shells.length > 0 && !localStorage.getItem('defaultShell')) {
          const newSettings = { ...settings, defaultShell: shells[0].shell_type };
          setSettings(newSettings);
          localStorage.setItem('defaultShell', shells[0].shell_type);
        }
      })
      .catch((err) => console.error('Failed to get shells:', err));
  }, []);

  const applySettings = (newSettings) => {
    const theme = themes[newSettings.theme];
    document.documentElement.style.setProperty('--bg-primary', theme.bg);
    document.documentElement.style.setProperty('--bg-secondary', theme.secondary);
    document.documentElement.style.setProperty('--text-primary', theme.text);
    document.documentElement.style.setProperty('--border-color', newSettings.primaryColor);
    
    Object.entries(newSettings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  };

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  useEffect(() => {
    applySettings(settings);
  }, []);

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
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px', fontSize: '18px' }}>
          Settings
        </h2>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: 'var(--text-primary, #ffffff)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Theme
          </label>
          <select 
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)'
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="monokai">Monokai</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: 'var(--text-primary, #ffffff)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Border Color
          </label>
          <input 
            type="color"
            value={settings.primaryColor}
            onChange={(e) => handleChange('primaryColor', e.target.value)}
            style={{
              width: '100%',
              height: '32px',
              borderRadius: '4px',
              border: '1px solid var(--border-color, #4a9eff)',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: 'var(--text-primary, #ffffff)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Layout
          </label>
          <select 
            value={settings.layout}
            onChange={(e) => handleChange('layout', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)'
            }}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="grid">Grid</option>
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: 'var(--text-primary, #ffffff)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Default Shell
          </label>
          <select 
            value={settings.defaultShell}
            onChange={(e) => handleChange('defaultShell', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)'
            }}
          >
            {availableShells.map((shell) => (
              <option key={shell.shell_type} value={shell.shell_type}>
                {shell.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ color: 'var(--text-primary, #ffffff)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Font Size: {settings.fontSize}px
          </label>
          <input 
            type="range"
            min="10"
            max="20"
            value={settings.fontSize}
            onChange={(e) => handleChange('fontSize', e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <button 
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--border-color, #4a9eff)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
