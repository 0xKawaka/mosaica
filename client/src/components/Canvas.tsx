import React, { useRef, useEffect, useCallback } from 'react';
import { PixelInfos } from '../customTypes';

interface CanvasProps {
  grid: PixelInfos[][];
  pendingPixels: { x: number; y: number; color: string }[];
  canvasScale: number;
  canvasX: number;
  canvasY: number;
  onPixelClick: (x: number, y: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  grid,
  pendingPixels,
  canvasScale,
  canvasX,
  canvasY,
  onPixelClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const basePixelSize = 10;

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaledPixelSize = basePixelSize * canvasScale;

    // Draw grid pixels
    grid.forEach(row =>
      row.forEach(({ x, y, color }) => {
        ctx.fillStyle = color || 'white';
        ctx.fillRect(
          x * scaledPixelSize,
          y * scaledPixelSize,
          scaledPixelSize,
          scaledPixelSize
        );
      })
    );

    // Draw pending pixels
    pendingPixels.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        x * scaledPixelSize,
        y * scaledPixelSize,
        scaledPixelSize,
        scaledPixelSize
      );
    });
  }, [grid, pendingPixels, canvasScale]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Get the click position relative to the canvas element
    const clickX = (event.clientX - rect.left);
    const clickY = (event.clientY - rect.top);

    // Convert the click position to grid coordinates
    const gridX = Math.floor((clickX / (basePixelSize * canvasScale)) / canvasScale);
    const gridY = Math.floor((clickY / (basePixelSize * canvasScale)) / canvasScale);

    // Check grid boundaries
    if (gridX >= 0 && gridX < grid.length && gridY >= 0 && gridY < grid[0].length) {
      onPixelClick(gridX, gridY);
    } else {
      console.log("Clicked outside of grid boundaries:", gridX, gridY);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={grid.length * basePixelSize * canvasScale}
      height={grid[0].length * basePixelSize * canvasScale}
      onClick={handleCanvasClick}
      style={{
        transform: `translate(${canvasX}px, ${canvasY}px) scale(${canvasScale})`,
        transformOrigin: 'top left',
        border: '1px solid black',
        cursor: 'pointer',
        imageRendering: 'pixelated', // Ensures sharp rendering for pixel art
      }}
    />
  );
};

export default Canvas;

