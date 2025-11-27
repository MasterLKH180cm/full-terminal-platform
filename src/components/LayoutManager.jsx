import { useState, useEffect, useRef } from 'react';
import { LayoutManager as LM } from '../utils/layoutManager';

export default function LayoutManager({ currentBlocks, onLoadLayout, onClose }) {
  const [layouts, setLayouts] = useState({});
  const [layoutName, setLayoutName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = () => {
    setLayouts(LM.getAllLayouts());
  };

  const handleSave = () => {
    if (layoutName.trim()) {
      LM.saveLayout(layoutName.trim(), currentBlocks);
      loadLayouts();
      setLayoutName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoad = (name) => {
    const layout = LM.loadLayout(name);
    if (layout && onLoadLayout) {
      onLoadLayout(layout.blocks);
    }
  };

  const handleDelete = (name) => {
    if (confirm(`Delete layout "${name}"?`)) {
      LM.deleteLayout(name);
      loadLayouts();
    }
  };

  const handleSaveAsDefault = () => {
    LM.saveAsDefault(currentBlocks);
    alert('Current layout saved as default!');
  };

  const handleExport = (name) => {
    const layout = LM.loadLayout(name);
    if (layout) {
      LM.exportLayout(name, layout.blocks);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const layout = await LM.importLayout(file);
        if (layout.name && layout.blocks) {
          LM.saveLayout(layout.name, layout.blocks);
          loadLayouts();
          alert(`Layout "${layout.name}" imported successfully!`);
        }
      } catch (error) {
        alert('Failed to import layout: ' + error.message);
      }
    }
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
        minWidth: '100px',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px', fontSize: '18px' }}>
          Layout Manager
        </h2>

        {/* Current Layout Actions */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--text-primary, #ffffff)', fontSize: '14px', marginBottom: '8px' }}>
            Current Layout
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSaveDialog(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #4a9eff)',
                background: 'var(--border-color, #4a9eff)',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              💾 Save Layout
            </button>
            <button
              onClick={handleSaveAsDefault}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #4a9eff)',
                background: 'var(--bg-secondary, #2d2d2d)',
                color: 'var(--text-primary, #ffffff)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ⭐ Save as Default
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #4a9eff)',
                background: 'var(--bg-secondary, #2d2d2d)',
                color: 'var(--text-primary, #ffffff)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📥 Import Layout
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--bg-secondary, #2d2d2d)',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #4a9eff)'
          }}>
            <label style={{ color: 'var(--text-primary, #ffffff)', display: 'block', marginBottom: '6px', fontSize: '13px' }}>
              Layout Name:
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Enter layout name..."
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color, #4a9eff)',
                background: 'var(--bg-primary, #1e1e1e)',
                color: 'var(--text-primary, #ffffff)',
                marginBottom: '8px',
                fontSize: '13px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--border-color, #4a9eff)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Save
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setLayoutName(''); }}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #888',
                  background: 'transparent',
                  color: 'var(--text-primary, #ffffff)',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Saved Layouts */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--text-primary, #ffffff)', fontSize: '14px', marginBottom: '8px' }}>
            Saved Layouts ({Object.keys(layouts).length})
          </h3>
          {Object.keys(layouts).length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No saved layouts yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(layouts).map(([name, layout]) => (
                <div
                  key={name}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-secondary, #2d2d2d)',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary, #ffffff)', fontWeight: 'bold', fontSize: '13px' }}>
                      {name}
                    </div>
                    <div style={{ color: '#888', fontSize: '11px' }}>
                      {layout.blocks.length} blocks • {new Date(layout.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleLoad(name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color, #4a9eff)',
                        background: 'var(--border-color, #4a9eff)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleExport(name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #888',
                        background: 'transparent',
                        color: 'var(--text-primary, #ffffff)',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      📤
                    </button>
                    <button
                      onClick={() => handleDelete(name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #ff4444',
                        background: 'transparent',
                        color: '#ff4444',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
