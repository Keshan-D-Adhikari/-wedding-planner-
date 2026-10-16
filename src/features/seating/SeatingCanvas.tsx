import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import type { SeatingTable } from '@/types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, clamp, type TableOccupancy } from './seatingUtils';
import styles from './SeatingCanvas.module.css';
import { TableNode } from './TableNode';

/** Below this, tables get too small to tap — the room scrolls instead. */
const MIN_SCALE = 0.5;
const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2] as const;

interface SeatingCanvasProps {
  tables: SeatingTable[];
  occupancy: Map<string, TableOccupancy>;
  selectedTableId: string | null;
  pendingSeats: number | null;
  onActivateTable: (table: SeatingTable) => void;
  onNudgeTable: (table: SeatingTable, dx: number, dy: number) => void;
  onBackgroundClick: () => void;
  onScaleChange: (scale: number) => void;
}

export function SeatingCanvas({
  tables,
  occupancy,
  selectedTableId,
  pendingSeats,
  onActivateTable,
  onNudgeTable,
  onBackgroundClick,
  onScaleChange,
}: SeatingCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.6);
  const [zoomIndex, setZoomIndex] = useState(1);

  // Fit the room to the available width, and refit when the window resizes.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setFitScale(entry.contentRect.width / CANVAS_WIDTH);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;
  const scale = Math.max(MIN_SCALE, fitScale * zoom);

  useEffect(() => {
    onScaleChange(scale);
  }, [scale, onScaleChange]);

  const planeStyle = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    transform: `scale(${scale})`,
    '--scale': scale,
  } as CSSProperties;

  return (
    <div className={styles.wrap}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.plane) {
            onBackgroundClick();
          }
        }}
      >
        {/* The sizer gives the scroll area the scaled room's real size. */}
        <div style={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}>
          <div className={styles.plane} style={planeStyle} data-plane="true">
            {tables.map((table) => (
              <TableNode
                key={table.id}
                table={table}
                occupancy={occupancy.get(table.id) ?? { guests: [], used: 0, free: table.capacity }}
                scale={scale}
                selected={table.id === selectedTableId}
                pendingSeats={pendingSeats}
                onActivate={onActivateTable}
                onNudge={onNudgeTable}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.zoom} role="group" aria-label="Zoom">
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => setZoomIndex((i) => clamp(i - 1, 0, ZOOM_STEPS.length - 1))}
          disabled={zoomIndex === 0}
          aria-label="Zoom out"
        >
          <Minus aria-hidden size={18} />
        </button>
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => setZoomIndex(1)}
          aria-label="Fit room to screen"
        >
          <Maximize aria-hidden size={16} />
        </button>
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => setZoomIndex((i) => clamp(i + 1, 0, ZOOM_STEPS.length - 1))}
          disabled={zoomIndex === ZOOM_STEPS.length - 1}
          aria-label="Zoom in"
        >
          <Plus aria-hidden size={18} />
        </button>
      </div>
    </div>
  );
}
