import { useState } from 'react';
import TerminalTab from './components/TerminalTab';
import SystemMonitor from './components/SystemMonitor';
import './App.css';

function App() {
  const [tabs, setTabs] = useState([{ id: Date.now(), title: 'Terminal 1' }]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [showMonitor, setShowMonitor] = useState(true);

  const createNewTab = () => {
    const newTab = {
      id: Date.now(),
      title: `Terminal ${tabs.length + 1}`,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId) => {
    if (tabs.length === 1) return; // Keep at least one tab
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <div className="navbar">
        <div className="nav-title">Full Terminal</div>
        <div className="nav-actions">
          <button 
            className="nav-button"
            onClick={() => setShowMonitor(!showMonitor)}
            title="Toggle System Monitor"
          >
            {showMonitor ? '📊' : '📊'}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <div className="tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="tab-title">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button className="tab-new" onClick={createNewTab}>
            +
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="terminal-container">
          {tabs.map(tab => (
            <TerminalTab
              key={tab.id}
              tabId={tab.id}
              isActive={activeTabId === tab.id}
            />
          ))}
        </div>
        
        {showMonitor && (
          <div className="sidebar">
            <SystemMonitor />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
