import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export default function DraggableGrid({ blocks, onLayoutChange, onRemoveBlock, renderBlock }) {
  const [layouts, setLayouts] = useState({ lg: [] });
  const [mounted, setMounted] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [compactType] = useState('vertical');

  // Initialize layout from blocks
  useEffect(() => {
    const initialLayout = blocks.map((block, i) => ({
      i: block.id,
      x: (i * 6) % 12,
      y: Math.floor(i / 2) * 4,
      w: 6,
      h: 4,
      minW: 3,
      minH: 3
    }));
    
    setLayouts({ lg: initialLayout });
    setMounted(true);
  }, [blocks.length]);

  const handleLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts);
    
    if (onLayoutChange && layout) {
      const orderedBlocks = layout
        .sort((a, b) => {
          if (a.y === b.y) return a.x - b.x;
          return a.y - b.y;
        })
        .map(item => blocks.find(b => b.id === item.i))
        .filter(Boolean);
      
      onLayoutChange(orderedBlocks);
    }
  };

  const handleBreakpointChange = (breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  };

  const handleRemoveBlock = (blockId, e) => {
    e.stopPropagation();
    if (onRemoveBlock) {
      onRemoveBlock(blockId);
    }
  };

  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'var(--text-primary, #ffffff)'
      }}>
        Loading grid layout...
      </div>
    );
  }

  return (
    <ResponsiveReactGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={60}
      containerPadding={[8, 8]}
      margin={[16, 16]}
      measureBeforeMount={false}
      useCSSTransforms={mounted}
      compactType={compactType}
      preventCollision={false}
      onLayoutChange={handleLayoutChange}
      onBreakpointChange={handleBreakpointChange}
      isDraggable={true}
      isResizable={true}
      draggableHandle=".drag-handle"
      resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'e']}
    >
      {blocks.map((block) => (
        <div
          key={block.id}
          style={{
            background: 'var(--bg-primary, #1e1e1e)',
            border: '1px solid var(--border-color, #4a9eff)',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            position: 'relative'
          }}
        >
          {/* Minimized Drag Handle - Top bar */}
          <div
            className="drag-handle"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, transparent 0%, var(--border-color, #4a9eff) 50%, transparent 100%)',
              cursor: 'move',
              zIndex: 10,
              opacity: 0.6,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.height = '6px';
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'var(--border-color, #4a9eff)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.height = '4px';
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.background = 'linear-gradient(90deg, transparent 0%, var(--border-color, #4a9eff) 50%, transparent 100%)';
            }}
          />

          {/* Close Button */}
          <button
            onClick={(e) => handleRemoveBlock(block.id, e)}
            className="block-close-btn"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px solid #ff4444',
              background: 'rgba(255, 68, 68, 0.1)',
              color: '#ff4444',
              fontSize: '16px',
              fontWeight: 'bold',
              lineHeight: '1',
              cursor: 'pointer',
              zIndex: 15,
              opacity: 0,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff4444';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ff4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Remove block"
          >
            ×
          </button>

          {/* Optional: Centered drag indicator (only visible on hover) */}
          <div
            className="drag-indicator"
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 8px',
              background: 'rgba(74, 158, 255, 0.8)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '4px',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: 'none',
              zIndex: 11,
              whiteSpace: 'nowrap'
            }}
          >
            ⋮⋮ DRAG
          </div>

          {/* Content */}
          <div 
            style={{ 
              flex: 1, 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingTop: '4px'
            }}
            onMouseEnter={(e) => {
              const indicator = e.currentTarget.parentElement.querySelector('.drag-indicator');
              const closeBtn = e.currentTarget.parentElement.querySelector('.block-close-btn');
              if (indicator) indicator.style.opacity = '1';
              if (closeBtn) closeBtn.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              const indicator = e.currentTarget.parentElement.querySelector('.drag-indicator');
              const closeBtn = e.currentTarget.parentElement.querySelector('.block-close-btn');
              if (indicator) indicator.style.opacity = '0';
              if (closeBtn) closeBtn.style.opacity = '0';
            }}
          >
            {renderBlock(block)}
          </div>
        </div>
      ))}
    </ResponsiveReactGridLayout>
  );
}
