import { useRef, useEffect, useCallback, useState } from 'react';
import { getSocket } from './useSocket';
import type { StrokeData } from '../types';

interface UseCanvasProps {
  isDrawer: boolean;
  isActive: boolean; // game is in 'drawing' phase
}

interface DrawState {
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

export const useCanvas = ({ isDrawer, isActive }: UseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<ImageData[]>([]);

  const [drawState, setDrawState] = useState<DrawState>({
    color: '#1a1a2e',
    size: 6,
    tool: 'pen',
  });

  const getContext = (): CanvasRenderingContext2D | null => {
    return canvasRef.current?.getContext('2d') || null;
  };

  const getRelativePos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e instanceof TouchEvent) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const saveUndo = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > 30) undoStack.current.shift();
  }, []);

  const drawLine = useCallback((
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    size: number,
    tool: 'pen' | 'eraser'
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const drawDot = useCallback((
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number },
    color: string,
    size: number,
    tool: 'pen' | 'eraser'
  ) => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? size * 1.5 : size / 2), 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();
  }, []);

  // Receive remote draw events
  const applyRemoteStroke = useCallback((data: StrokeData) => {
    const ctx = getContext();
    if (!ctx) return;

    if (data.type === 'start' && data.x !== undefined && data.y !== undefined) {
      lastPoint.current = { x: data.x, y: data.y };
      drawDot(ctx, lastPoint.current, data.color!, data.size!, data.tool || 'pen');
    } else if (data.type === 'move' && data.x !== undefined && data.y !== undefined && lastPoint.current) {
      drawLine(ctx, lastPoint.current, { x: data.x, y: data.y }, data.color!, data.size!, data.tool || 'pen');
      lastPoint.current = { x: data.x, y: data.y };
    } else if (data.type === 'end') {
      lastPoint.current = null;
    }
  }, [drawLine, drawDot]);

  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    undoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || undoStack.current.length === 0) return;

    const prev = undoStack.current.pop()!;
    ctx.putImageData(prev, 0, 0);

    const socket = getSocket();
    socket.emit('draw_undo');
  }, []);

  // Receive undo from server (redraw strokes)
  const applyRemoteUndo = useCallback((strokes: StrokeData[]) => {
    clearCanvas();
    // Replay all strokes up to undo point
    let prevPoint: { x: number; y: number } | null = null;
    const ctx = getContext();
    if (!ctx) return;

    strokes.forEach(stroke => {
      if (stroke.type === 'start' && stroke.x !== undefined) {
        prevPoint = { x: stroke.x, y: stroke.y! };
        drawDot(ctx, prevPoint, stroke.color!, stroke.size!, stroke.tool || 'pen');
      } else if (stroke.type === 'move' && stroke.x !== undefined && prevPoint) {
        drawLine(ctx, prevPoint, { x: stroke.x, y: stroke.y! }, stroke.color!, stroke.size!, stroke.tool || 'pen');
        prevPoint = { x: stroke.x, y: stroke.y! };
      } else if (stroke.type === 'end') {
        prevPoint = null;
      }
    });
  }, [clearCanvas, drawLine, drawDot]);

  // Mouse/Touch handlers (only for drawer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer || !isActive) return;

    const socket = getSocket();

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getRelativePos(e, canvas);
      isDrawing.current = true;
      saveUndo();
      lastPoint.current = pos;

      const ctx = getContext()!;
      drawDot(ctx, pos, drawState.color, drawState.size, drawState.tool);

      socket.emit('draw_start', {
        x: pos.x, y: pos.y,
        color: drawState.color,
        size: drawState.size,
        tool: drawState.tool,
      });
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current || !lastPoint.current) return;
      const pos = getRelativePos(e, canvas);

      const ctx = getContext()!;
      drawLine(ctx, lastPoint.current, pos, drawState.color, drawState.size, drawState.tool);
      lastPoint.current = pos;

      socket.emit('draw_move', { x: pos.x, y: pos.y });
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      isDrawing.current = false;
      lastPoint.current = null;
      socket.emit('draw_end', {});
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [isDrawer, isActive, drawState, drawLine, drawDot, saveUndo]);

  // Socket listeners for remote drawing
  useEffect(() => {
    const socket = getSocket();

    socket.on('draw_data', (data: StrokeData) => {
      applyRemoteStroke(data);
    });

    socket.on('canvas_clear', () => {
      clearCanvas();
    });

    socket.on('draw_undo', ({ strokes }: { strokes: StrokeData[] }) => {
      applyRemoteUndo(strokes);
    });

    return () => {
      socket.off('draw_data');
      socket.off('canvas_clear');
      socket.off('draw_undo');
    };
  }, [applyRemoteStroke, clearCanvas, applyRemoteUndo]);

  // Initialize canvas with white background
  useEffect(() => {
    clearCanvas();
  }, [clearCanvas]);

  const emitClear = useCallback(() => {
    clearCanvas();
    const socket = getSocket();
    socket.emit('canvas_clear');
  }, [clearCanvas]);

  return {
    canvasRef,
    drawState,
    setDrawState,
    clearCanvas: emitClear,
    undo,
  };
};
