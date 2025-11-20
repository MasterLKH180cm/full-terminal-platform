import { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import ResourceMonitor from './components/ResourceMonitor';
import Settings from './components/Settings';
import NewTerminalModal from './components/NewTerminalModal';
import LayoutManager from './components/LayoutManager';
import DraggableGrid from './components/DraggableGrid';
import GridLayoutControls from './components/GridLayoutControls';
import { LayoutManager as LM } from './utils/layoutManager';
import './App.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTerminalModal, setShowNewTerminalModal] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showGridControls, setShowGridControls] = useState(false);
  const [terminals, setTerminals] = useState([{ id: 1, shellType: localStorage.getItem('defaultShell') || 'cmd' }]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const [blocks, setBlocks] = useState([
    { id: 'terminal-1', type: 'terminal', terminalId: 1, shellType: localStorage.getItem('defaultShell') || 'cmd' },
    { id: 'monitor-1', type: 'monitor' }
  ]);
  const [gridLayout, setGridLayout] = useState({ columns: 2, gap: 16, minWidth: 400 });

  // Load default layout on mount
  useEffect(() => {
    const defaultLayout = LM.loadDefault();
    if (defaultLayout && defaultLayout.length > 0) {
      setBlocks(defaultLayout);
      // Extract terminal info
      const terminalBlocks = defaultLayout.filter(b => b.type === 'terminal');
      if (terminalBlocks.length > 0) {
        setTerminals(terminalBlocks.map(b => ({ id: b.terminalId, shellType: b.shellType })));
        setActiveTerminal(terminalBlocks[0].terminalId);
      }
    }
  }, []);

  const addTerminal = (shellType) => {
    const newId = Math.max(...terminals.map(t => t.id), 0) + 1;
    const newTerminal = { id: newId, shellType };
    
    setTerminals([...terminals, newTerminal]);
    setBlocks([...blocks, { 
      id: `terminal-${newId}`, 
      type: 'terminal', 
      terminalId: newId,
      shellType 
    }]);
    setActiveTerminal(newId);
  };

  const removeTerminal = (id) => {
    if (terminals.length === 1) return;
    const newTerminals = terminals.filter(t => t.id !== id);
    setTerminals(newTerminals);
    setBlocks(blocks.filter(b => b.terminalId !== id));
    if (activeTerminal === id) {
      setActiveTerminal(newTerminals[0].id);
    }
  };

  const handleReorder = (fromIndex, toIndex) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
  };

  const handleLoadLayout = (layoutBlocks) => {
    setBlocks(layoutBlocks);
    const terminalBlocks = layoutBlocks.filter(b => b.type === 'terminal');
    if (terminalBlocks.length > 0) {
      setTerminals(terminalBlocks.map(b => ({ id: b.terminalId, shellType: b.shellType })));
      setActiveTerminal(terminalBlocks[0].terminalId);
    }
    setShowLayoutManager(false);
  };

  const handleLayoutChange = (orderedBlocks) => {
    if (orderedBlocks && orderedBlocks.length === blocks.length) {
      setBlocks(orderedBlocks);
    }
  };

  const handleRemoveBlock = (blockId) => {
    // Prevent removing if it's the last block
    if (blocks.length <= 1) {
      alert('Cannot remove the last block!');
      return;
    }

    // Check if it's a terminal block
    const block = blocks.find(b => b.id === blockId);
    if (block && block.type === 'terminal') {
      // Also remove from terminals array
      const newTerminals = terminals.filter(t => t.id !== block.terminalId);
      setTerminals(newTerminals);
      
      // Update active terminal if needed
      if (activeTerminal === block.terminalId && newTerminals.length > 0) {
        setActiveTerminal(newTerminals[0].id);
      }
    }

    // Remove from blocks
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
  };

  const renderBlock = (block) => {
    if (block.type === 'terminal') {
      const terminal = terminals.find(t => t.id === block.terminalId);
      return (
        <Terminal 
          id={block.terminalId} 
          onFocus={setActiveTerminal}
          initialShellType={terminal?.shellType}
        />
      );
    } else if (block.type === 'monitor') {
      return <ResourceMonitor />;
    }
    return null;
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary, #1e1e1e)',
      padding: '12px',
      gap: '12px',
      overflow: 'hidden'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'var(--bg-primary, #1e1e1e)',
        border: '1px solid var(--border-color, #4a9eff)',
        borderRadius: '8px',
        flexShrink: 0
      }}>
        <h1 style={{ color: 'var(--text-primary, #ffffff)', margin: 0, fontSize: '20px' }}>
          Full Terminal Platform
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowNewTerminalModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ➕ New Terminal
          </button>
          <button
            onClick={() => setShowGridControls(!showGridControls)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: showGridControls ? 'var(--border-color, #4a9eff)' : 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔲 Grid
          </button>
          <button
            onClick={() => setShowLayoutManager(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📐 Layouts
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #4a9eff)',
              background: 'var(--bg-secondary, #2d2d2d)',
              color: 'var(--text-primary, #ffffff)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {showGridControls && (
        <GridLayoutControls onLayoutChange={setGridLayout} />
      )}

      <div style={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: '4px'
      }}>
        <DraggableGrid 
          blocks={blocks}
          onLayoutChange={handleLayoutChange}
          onRemoveBlock={handleRemoveBlock}
          renderBlock={renderBlock}
        />
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showNewTerminalModal && (
        <NewTerminalModal 
          onClose={() => setShowNewTerminalModal(false)}
          onConfirm={addTerminal}
        />
      )}
      {showLayoutManager && (
        <LayoutManager
          currentBlocks={blocks}
          onLoadLayout={handleLoadLayout}
          onClose={() => setShowLayoutManager(false)}
        />
      )}
    </div>
  );
}

export default App;
