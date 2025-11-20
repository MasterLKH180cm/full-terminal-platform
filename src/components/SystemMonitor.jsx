import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function SystemMonitor() {
  const [sysInfo, setSysInfo] = useState(null);

  useEffect(() => {
    const fetchSysInfo = async () => {
      try {
        const info = await invoke('get_sysinfo');
        setSysInfo(info);
      } catch (err) {
        console.error('Failed to fetch system info:', err);
      }
    };

    fetchSysInfo();
    const interval = setInterval(fetchSysInfo, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (!sysInfo) {
    return <div className="system-monitor">Loading system info...</div>;
  }

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const memoryPercent = ((sysInfo.memory_used / sysInfo.memory_total) * 100).toFixed(1);
  const diskPercent = ((sysInfo.disk_used / sysInfo.disk_total) * 100).toFixed(1);

  return (
    <div className="system-monitor">
      <div className="monitor-item">
        <span className="monitor-label">CPU:</span>
        <span className="monitor-value">{sysInfo.cpu_usage.toFixed(1)}%</span>
        <div className="monitor-bar">
          <div 
            className="monitor-bar-fill" 
            style={{ width: `${Math.min(sysInfo.cpu_usage, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="monitor-item">
        <span className="monitor-label">RAM:</span>
        <span className="monitor-value">
          {formatBytes(sysInfo.memory_used)} / {formatBytes(sysInfo.memory_total)} ({memoryPercent}%)
        </span>
        <div className="monitor-bar">
          <div 
            className="monitor-bar-fill" 
            style={{ width: `${memoryPercent}%` }}
          />
        </div>
      </div>
      
      <div className="monitor-item">
        <span className="monitor-label">Disk:</span>
        <span className="monitor-value">
          {formatBytes(sysInfo.disk_used)} / {formatBytes(sysInfo.disk_total)} ({diskPercent}%)
        </span>
        <div className="monitor-bar">
          <div 
            className="monitor-bar-fill" 
            style={{ width: `${diskPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
