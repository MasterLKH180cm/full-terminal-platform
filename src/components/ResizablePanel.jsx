import { useState, useRef, useEffect } from 'react';

export default function ResizablePanel({ children, minWidth = 300, minHeight = 200, defaultWidth, defaultHeight }) {
  const [size, setSize] = useState({ 
    width: defaultWidth || minWidth, 
    height: defaultHeight || minHeight 
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleMouseDown = (direction) => (e) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      if (resizeDirection.includes('right')) {
        newWidth = Math.max(minWidth, startSize.current.width + deltaX);
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(minHeight, startSize.current.height + deltaY);
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight, resizeDirection]);

  return (
    <div
      style={{
        position: 'relative',
        width: size.width,
        height: size.height,
        minWidth,
        minHeight,
        flexShrink: 0
      }}
    >
      {children}
      
      {/* Right resize handle */}
      <div
        onMouseDown={handleMouseDown('right')}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '1px',
          height: 'inherit',
          cursor: 'ew-resize',
          background: isResizing && resizeDirection === 'right' ? 'var(--border-color, #4a9eff)' : 'transparent',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color, #4a9eff)'}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.background = 'transparent')}
      />
      
      {/* Bottom resize handle */}
      <div
        onMouseDown={handleMouseDown('bottom')}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '1px',
          width: 'inherit',
          cursor: 'ns-resize',
          background: isResizing && resizeDirection === 'bottom' ? 'var(--border-color, #4a9eff)' : 'transparent',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color, #4a9eff)'}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.background = 'transparent')}
      />
      
      {/* Corner resize handle */}
      <div
        onMouseDown={handleMouseDown('right-bottom')}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '12px',
          height: '12px',
          cursor: 'nwse-resize',
          background: 'var(--border-color, #4a9eff)',
          borderRadius: '0 0 8px 0',
          opacity: isResizing && resizeDirection === 'right-bottom' ? 1 : 0.3,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.opacity = '0.3')}
      />
    </div>
  );
}
