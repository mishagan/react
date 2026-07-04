import React from 'react';
import {ROOM_STATUS, ROOM_STATUS_LABEL} from '../domain/constants.js';

// -----------------------------------------------------------------------------
// PlanMap — the interactive floor plan. Generates a schematic SVG plan from the
// real rooms (adaptive grid layout), tints each room by its derived status, and
// makes every room a clickable/keyboard-focusable target. Presentational only:
// data (rooms + statuses) comes in via props.
//
// Color = status job: tint fill + strong stroke, but identity is never
// color-alone — each room carries its name, status label and task count.
// -----------------------------------------------------------------------------

// Status marks. Grey is intentionally neutral ("not started"); it passes 3:1
// contrast on white and pairs with a visible text label on every room.
const STATUS_INK = {
  [ROOM_STATUS.TODO]: '#71717a',
  [ROOM_STATUS.IN_PROGRESS]: '#2563eb',
  [ROOM_STATUS.BLOCKED]: '#dc2626',
  [ROOM_STATUS.DONE]: '#16a34a',
};
const STATUS_TINT = {
  [ROOM_STATUS.TODO]: 'rgba(113, 113, 122, 0.08)',
  [ROOM_STATUS.IN_PROGRESS]: 'rgba(37, 99, 235, 0.12)',
  [ROOM_STATUS.BLOCKED]: 'rgba(220, 38, 38, 0.12)',
  [ROOM_STATUS.DONE]: 'rgba(22, 163, 74, 0.12)',
};

const WALL = '#1e293b';

export default function PlanMap({rooms, title, onSelectRoom}) {
  const n = rooms.length;
  if (n === 0) return null;

  // Adaptive grid: 1–2 rooms → one row; 3–4 → 2×2; more → 3 per row.
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);

  const M = 24; // outer margin
  const W = 840;
  const cellW = (W - 2 * M) / cols;
  const cellH = 200;
  const H = 2 * M + rows * cellH + (title ? 40 : 0);
  const top = M + (title ? 40 : 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Floor plan: ${rooms
        .map(r => `${r.room.name} ${ROOM_STATUS_LABEL[r.status]}`)
        .join(', ')}`}
      className="w-full bg-white">
      {title && (
        <text x={M} y={M + 12} fontSize="18" fontWeight="700" fill={WALL}>
          {title}
        </text>
      )}

      {rooms.map((entry, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // Last row may be partial — stretch its rooms to fill the width.
        const isLastRow = row === rows - 1;
        const lastRowCount = n - (rows - 1) * cols;
        const w = isLastRow ? (W - 2 * M) / lastRowCount : cellW;
        const x = M + col * w;
        const y = top + row * cellH;
        return (
          <Room
            key={entry.room.id}
            x={x}
            y={y}
            w={w}
            h={cellH}
            entry={entry}
            onSelect={onSelectRoom}
          />
        );
      })}

      {/* Outer wall drawn last so it stays crisp above room strokes. */}
      <rect
        x={M}
        y={top}
        width={W - 2 * M}
        height={rows * cellH}
        fill="none"
        stroke={WALL}
        strokeWidth="8"
      />
    </svg>
  );
}

function Room({x, y, w, h, entry, onSelect}) {
  const {room, status, taskCount} = entry;
  const ink = STATUS_INK[status];
  const label = ROOM_STATUS_LABEL[status];
  const cx = x + w / 2;

  const activate = () => onSelect && onSelect(room.id);

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${room.name} — ${label}, ${taskCount} task${taskCount === 1 ? '' : 's'}`}
      onClick={activate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
      className="cursor-pointer outline-none [&:focus-visible_rect:first-of-type]:stroke-[5] [&:hover_rect:first-of-type]:stroke-[5]">
      <title>{`${room.name} — ${label} · ${taskCount} task${taskCount === 1 ? '' : 's'}`}</title>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={STATUS_TINT[status]}
        stroke={WALL}
        strokeWidth="3"
      />
      {/* status marker + text block, centered */}
      <circle cx={cx} cy={y + h / 2 - 34} r="7" fill={ink} />
      <text
        x={cx}
        y={y + h / 2}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={WALL}>
        {room.name}
      </text>
      <text
        x={cx}
        y={y + h / 2 + 26}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        letterSpacing="1"
        fill={ink}>
        {label.toUpperCase()}
      </text>
      <text
        x={cx}
        y={y + h / 2 + 48}
        textAnchor="middle"
        fontSize="12"
        fill="#52525b">
        {taskCount} task{taskCount === 1 ? '' : 's'}
      </text>
    </g>
  );
}
