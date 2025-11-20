import { useState, useEffect, useRef, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { invoke } from '@tauri-apps/api/core';

const ResourceMonitor = memo(function ResourceMonitor() {
  const [data, setData] = useState([]);
  const maxPoints = 60;
  const dataRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(async () => {
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

        dataRef.current = [...dataRef.current, newPoint].slice(-maxPoints);
        setData(dataRef.current);
      } catch (error) {
        console.error('Failed to fetch resource data:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'var(--bg-primary, #1e1e1e)',
      border: '1px solid var(--border-color, #4a9eff)',
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px', margin: 0 }}>
        Resource Monitor
      </h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="time" 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#888"
              tick={{ fill: '#888', fontSize: 11 }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #4a9eff',
                borderRadius: '4px'
              }}
              animationDuration={200}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cpu" 
              stroke="#4a9eff" 
              strokeWidth={2}
              dot={false}
              name="CPU (%)"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="memory" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={false}
              name="Memory (%)"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default ResourceMonitor;
