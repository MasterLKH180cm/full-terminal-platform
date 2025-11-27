import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import Terminal from './components/Terminal';
import DraggableGrid from './components/DraggableGrid';
import GridLayoutControls from './components/GridLayoutControls';
import { LayoutManager as LM } from './utils/layoutManager';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

// Lazy load heavy components
const ResourceMonitor = lazy(() => import('./components/ResourceMonitor'));
const Settings = lazy(() => import('./components/Settings'));
const NewTerminalModal = lazy(() => import('./components/NewTerminalModal'));
const LayoutManager = lazy(() => import('./components/LayoutManager'));

// Memoized style objects
const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  background: 'var(--bg-primary, #1e1e1e)',
  border: '1px solid var(--border-color, #4a9eff)',
  borderRadius: '6px',
  flexShrink: 0
};

const buttonBaseStyle = {
  padding: '6px 12px',
  borderRadius: '4px',
  border: '1px solid var(--border-color, #4a9eff)',
  color: 'var(--text-primary, #ffffff)',
  cursor: 'pointer',
  fontSize: '12px'
};

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTerminalModal, setShowNewTerminalModal] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showGridControls, setShowGridControls] = useState(false);
  const [showResourceMonitor, setShowResourceMonitor] = useState(false);
  const [terminals, setTerminals] = useState([{ id: 1, shellType: localStorage.getItem('defaultShell') || 'cmd' }]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const [blocks, setBlocks] = useState([
    { id: 'terminal-1', type: 'terminal', terminalId: 1, shellType: localStorage.getItem('defaultShell') || 'cmd' }
  ]);
  const [gridLayout, setGridLayout] = useState({ columns: 2, gap: 16, minWidth: 100 });
  const [resourceData, setResourceData] = useState([]);
  const maxPoints = 60;
  const dataRef = useRef([]);
  const rafIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Throttled resource data collection (reduced to 2 updates per second)
  useEffect(() => {
    let mounted = true;
    const UPDATE_INTERVAL = 500; // 500ms instead of 1000ms but batched

    const fetchResourceData = async () => {
      if (!mounted) return;
      
      const now = Date.now();
      if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
        rafIdRef.current = requestAnimationFrame(fetchResourceData);
        return;
      }
      
      lastUpdateRef.current = now;

      try {
        const sysInfo = await invoke('get_system_info');
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        const newPoint = {
          time: timestamp,
          cpu: parseFloat(sysInfo.cpu.toFixed(1)),
          memory: parseFloat(sysInfo.memory.toFixed(1))
        };

        const newData = [...dataRef.current, newPoint].slice(-maxPoints);
        dataRef.current = newData;
        
        // Only update state if monitor is visible
        if (showResourceMonitor) {
          setResourceData(newData);
        }
      } catch (error) {
        console.error('Failed to fetch resource data:', error);
      }
      
      rafIdRef.current = requestAnimationFrame(fetchResourceData);
    };

    rafIdRef.current = requestAnimationFrame(fetchResourceData);

    return () => {
      mounted = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [showResourceMonitor]);

  // Load default layout on mount
  useEffect(() => {
    const defaultLayout = LM.loadDefault();
    if (defaultLayout && defaultLayout.length > 0) {
      // Filter out monitor blocks
      const filteredLayout = defaultLayout.filter(b => b.type !== 'monitor');
      setBlocks(filteredLayout);
      // Extract terminal info
      const terminalBlocks = filteredLayout.filter(b => b.type === 'terminal');
      if (terminalBlocks.length > 0) {
        setTerminals(terminalBlocks.map(b => ({ id: b.terminalId, shellType: b.shellType })));
        setActiveTerminal(terminalBlocks[0].terminalId);
      }
    }
  }, []);

  const addTerminal = useCallback((shellType) => {
    setTerminals(prev => {
      const newId = Math.max(...prev.map(t => t.id), 0) + 1;
      const newTerminal = { id: newId, shellType };
      return [...prev, newTerminal];
    });
    
    setBlocks(prev => {
      const newId = Math.max(...terminals.map(t => t.id), 0) + 1;
      return [...prev, { 
        id: `terminal-${newId}`, 
        type: 'terminal', 
        terminalId: newId,
        shellType 
      }];
    });
    
    setActiveTerminal(Math.max(...terminals.map(t => t.id), 0) + 1);
  }, [terminals]);

  const removeTerminal = useCallback((id) => {
    setTerminals(prev => {
      if (prev.length === 1) return prev;
      const newTerminals = prev.filter(t => t.id !== id);
      
      if (activeTerminal === id && newTerminals.length > 0) {
        setActiveTerminal(newTerminals[0].id);
      }
      
      return newTerminals;
    });
    
    setBlocks(prev => prev.filter(b => b.terminalId !== id));
  }, [activeTerminal]);

  const handleReorder = useCallback((fromIndex, toIndex) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      return newBlocks;
    });
  }, []);

  const handleLoadLayout = useCallback((layoutBlocks) => {
    const filteredLayout = layoutBlocks.filter(b => b.type !== 'monitor');
    setBlocks(filteredLayout);
    const terminalBlocks = filteredLayout.filter(b => b.type === 'terminal');
    if (terminalBlocks.length > 0) {
      setTerminals(terminalBlocks.map(b => ({ id: b.terminalId, shellType: b.shellType })));
      setActiveTerminal(terminalBlocks[0].terminalId);
    }
    setShowLayoutManager(false);
  }, []);

  const handleLayoutChange = useCallback((orderedBlocks) => {
    if (orderedBlocks && orderedBlocks.length === blocks.length) {
      setBlocks(orderedBlocks);
    }
  }, [blocks.length]);

  const handleRemoveBlock = useCallback((blockId) => {
    setBlocks(prev => {
      if (prev.length <= 1) {
        alert('Cannot remove the last block!');
        return prev;
      }

      const block = prev.find(b => b.id === blockId);
      if (block && block.type === 'terminal') {
        setTerminals(t => {
          const newTerminals = t.filter(term => term.id !== block.terminalId);
          
          if (activeTerminal === block.terminalId && newTerminals.length > 0) {
            setActiveTerminal(newTerminals[0].id);
          }
          
          return newTerminals;
        });
      }

      return prev.filter(b => b.id !== blockId);
    });
  }, [activeTerminal]);

  const renderBlock = useCallback((block) => {
    if (block.type === 'terminal') {
      const terminal = terminals.find(t => t.id === block.terminalId);
      return (
        <Terminal 
          key={block.id}
          id={block.terminalId} 
          onFocus={setActiveTerminal}
          initialShellType={terminal?.shellType}
        />
      );
    }
    return null;
  }, [terminals]);

  // Memoize button styles
  const newTerminalButtonStyle = useMemo(() => ({
    ...buttonBaseStyle,
    background: 'var(--bg-secondary, #2d2d2d)'
  }), []);

  const gridButtonStyle = useMemo(() => ({
    ...buttonBaseStyle,
    background: showGridControls ? 'var(--border-color, #4a9eff)' : 'var(--bg-secondary, #2d2d2d)'
  }), [showGridControls]);

  const layoutButtonStyle = useMemo(() => ({
    ...buttonBaseStyle,
    background: 'var(--bg-secondary, #2d2d2d)'
  }), []);

  const settingsButtonStyle = useMemo(() => ({
    ...buttonBaseStyle,
    background: 'var(--bg-secondary, #2d2d2d)'
  }), []);

  const floatingButtonStyle = useMemo(() => ({
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '2px solid var(--border-color, #4a9eff)',
    background: showResourceMonitor ? 'var(--border-color, #4a9eff)' : 'var(--bg-secondary, #2d2d2d)',
    color: 'var(--text-primary, #ffffff)',
    cursor: 'pointer',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
    zIndex: 1000
  }), [showResourceMonitor]);

  const toggleResourceMonitor = useCallback(() => {
    setShowResourceMonitor(prev => !prev);
  }, []);

  const toggleGridControls = useCallback(() => {
    setShowGridControls(prev => !prev);
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary, #1e1e1e)',
      padding: '8px',
      gap: '8px',
      overflow: 'hidden'
    }}>
      <header style={headerStyle}>
        <h1 style={{ color: 'var(--text-primary, #ffffff)', margin: 0, fontSize: '16px' }}>
          Full Terminal Platform
        </h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowNewTerminalModal(true)}
            style={newTerminalButtonStyle}
          >
            ➕ New Terminal
          </button>
          <button
            onClick={toggleGridControls}
            style={gridButtonStyle}
          >
            🔲 Grid
          </button>
          <button
            onClick={() => setShowLayoutManager(true)}
            style={layoutButtonStyle}
          >
            📐 Layouts
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={settingsButtonStyle}
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
        padding: '2px'
      }}>
        <DraggableGrid 
          blocks={blocks}
          onLayoutChange={handleLayoutChange}
          onRemoveBlock={handleRemoveBlock}
          renderBlock={renderBlock}
        />
      </div>

      <button
        onClick={toggleResourceMonitor}
        style={floatingButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Resource Monitor"
      >
        📊
      </button>

      {showResourceMonitor && (
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
          zIndex: 2000,
          padding: '20px'
        }}
        onClick={toggleResourceMonitor}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '900px',
              height: '70%',
              maxHeight: '600px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={toggleResourceMonitor}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid var(--border-color, #4a9eff)',
                background: 'var(--bg-secondary, #2d2d2d)',
                color: 'var(--text-primary, #ffffff)',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2001
              }}
            >
              ✕
            </button>
            <Suspense fallback={<div style={{color: '#fff'}}>Loading...</div>}>
              <ResourceMonitor data={resourceData} />
            </Suspense>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}

export default App;
