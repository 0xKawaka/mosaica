import React, { useRef, useState } from 'react';
import Canvas from './Canvas';
import { PixelInfos } from '../customTypes';

interface CanvasContainerProps {
  grid: PixelInfos[][];
  pendingPixels: { x: number; y: number; color: string }[];
  onPixelClick: (x: number, y: number) => void;
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  grid,
  pendingPixels,
  onPixelClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasX, setCanvasX] = useState(window.innerWidth / 2); // Start centered
  const [canvasY, setCanvasY] = useState(window.innerHeight / 2);

  // Handle zoom with the scroll wheel, adjusting around cursor position
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomAmount = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(canvasScale + zoomAmount, 0.5), 5);
    const scaleRatio = newScale / canvasScale;

    const newCanvasX = mouseX - (mouseX - canvasX) * scaleRatio;
    const newCanvasY = mouseY - (mouseY - canvasY) * scaleRatio;

    setCanvasScale(newScale);
    setCanvasX(newCanvasX);
    setCanvasY(newCanvasY);
  };

  // Handle panning when dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX - canvasX;
    const startY = e.clientY - canvasY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setCanvasX(moveEvent.clientX - startX);
      setCanvasY(moveEvent.clientY - startY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      style={{
        overflow: 'hidden',
        position: 'relative',
        width: '100vw',
        height: '100vh',
        cursor: 'grab',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <Canvas
        grid={grid}
        pendingPixels={pendingPixels}
        canvasScale={canvasScale}
        canvasX={canvasX}
        canvasY={canvasY}
        onPixelClick={onPixelClick}
      />
    </div>
  );
};

export default CanvasContainer;
