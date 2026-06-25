import React, { useRef, useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useGameStore } from '../store/gameStore';
import './Canvas.css';

export const Canvas: React.FC = () => {
  const { isDrawer, gameState } = useGameStore();
  const isActive = gameState?.phase === 'drawing';

  const { canvasRef, drawState, setDrawState, clearCanvas, undo } = useCanvas({
    isDrawer,
    isActive,
  });

  const COLORS = [
    '#1a1a2e', '#ffffff', '#ff4757', '#ff6b35', '#ffd60a',
    '#7bed9f', '#00d4ff', '#7c5cbf', '#ff69b4', '#a29bfe',
    '#fd79a8', '#00b894', '#0984e3', '#e17055', '#636e72',
    '#dfe6e9', '#6c5ce7', '#00cec9', '#fdcb6e', '#e84393',
  ];

  const SIZES = [
    { value: 3, label: 'XS' },
    { value: 6, label: 'S' },
    { value: 12, label: 'M' },
    { value: 24, label: 'L' },
    { value: 40, label: 'XL' },
  ];

  if (!isDrawer) {
    return (
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="drawing-canvas viewer-canvas"
        />
      </div>
    );
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className={`drawing-canvas ${isActive ? 'active-canvas' : 'inactive-canvas'}`}
        style={{ cursor: isActive ? (drawState.tool === 'eraser' ? 'cell' : 'crosshair') : 'default' }}
      />

      {/* Toolbar */}
      {isActive && (
        <div className="canvas-toolbar">
          {/* Colors */}
          <div className="toolbar-section colors-section">
            <button
              className={`tool-btn ${drawState.tool === 'eraser' ? 'selected' : ''}`}
              onClick={() => setDrawState(s => ({ ...s, tool: 'eraser' }))}
              data-tooltip="Eraser"
              style={{ background: drawState.tool === 'eraser' ? 'rgba(236, 72, 153, 0.2)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            >
              🧹
            </button>
            <div style={{ width: '2px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
            {COLORS.map(color => (
              <button
                key={color}
                className={`color-btn ${drawState.color === color && drawState.tool === 'pen' ? 'selected' : ''}`}
                style={{ background: color, border: color === '#ffffff' ? '1.5px solid #ccc' : 'none' }}
                onClick={() => setDrawState(s => ({ ...s, color, tool: 'pen' }))}
                data-tooltip={color}
              />
            ))}
          </div>

          {/* Brush Sizes */}
          <div className="toolbar-section size-section">
            {SIZES.map(s => (
              <button
                key={s.value}
                className={`size-btn ${drawState.size === s.value && drawState.tool === 'pen' ? 'selected' : ''}`}
                onClick={() => setDrawState(ds => ({ ...ds, size: s.value, tool: 'pen' }))}
                data-tooltip={s.label}
              >
                <div className="size-dot" style={{ width: Math.min(s.value, 20), height: Math.min(s.value, 20) }} />
              </button>
            ))}
          </div>

          {/* Tools */}
          <div className="toolbar-section tools-section">
            <button className="tool-btn" onClick={undo} data-tooltip="Undo">
              ↩️
            </button>
            <button className="tool-btn tool-btn--danger" onClick={clearCanvas} data-tooltip="Clear All">
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
