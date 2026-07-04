import React from 'react';
import {useDbVersion} from '../lib/useDb.js';
import {getProject, getDashboard, getRoomLabel, getTasks} from '../domain/queries.js';
import {getRoomsWithStatus} from '../domain/status.js';
import {
  TASK_STATUS,
  TASK_STATUS_LABEL,
  ROOM_STATUS,
  ROOM_STATUS_LABEL,
} from '../domain/constants.js';
import {
  Button,
  Card,
  PageTitle,
  SectionTitle,
  StatusBadge,
} from '../components/ui.jsx';

// Screen 6: Foreman dashboard — the analytics view. Every number derives from
// getDashboard()/status.js, so the charts always match the data.
//
// Chart color = status job (state, not series): each mark ships with a visible
// label + count, never color alone. Todo-grey is #71717a (≥3:1 on white).
const TODO_INK = '#71717a';

export default function ForemanDashboard({nav, params}) {
  useDbVersion();
  const project = getProject(params.projectId);
  if (!project) {
    return <Card className="p-6 text-center text-zinc-600">Project not found.</Card>;
  }

  const dash = getDashboard(project.id);
  const segments = [
    {
      key: TASK_STATUS.DONE,
      label: TASK_STATUS_LABEL[TASK_STATUS.DONE],
      count: dash.byStatus[TASK_STATUS.DONE],
      color: 'var(--color-go)',
    },
    {
      key: TASK_STATUS.IN_PROGRESS,
      label: TASK_STATUS_LABEL[TASK_STATUS.IN_PROGRESS],
      count: dash.byStatus[TASK_STATUS.IN_PROGRESS],
      color: 'var(--color-progress)',
    },
    {
      key: TASK_STATUS.TODO,
      label: TASK_STATUS_LABEL[TASK_STATUS.TODO],
      count: dash.byStatus[TASK_STATUS.TODO],
      color: TODO_INK,
    },
  ];
  const rooms = getRoomsWithStatus(project.id);

  return (
    <div className="space-y-5">
      <PageTitle subtitle={project.name}>Dashboard</PageTitle>

      <section>
        <SectionTitle>Tasks</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={dash.totalTasks} />
          {segments.map(s => (
            <Stat key={s.key} label={s.label} value={s.count} color={s.color} />
          ))}
        </div>

        {/* Status distribution — one stacked bar, 2px surface gaps, legend
            with label + count under it. */}
        {dash.totalTasks > 0 && (
          <Card className="mt-3 p-4">
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
              {segments
                .filter(s => s.count > 0)
                .map(s => (
                  <div
                    key={s.key}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{
                      backgroundColor: s.color,
                      flexGrow: s.count,
                      flexBasis: 0,
                    }}
                  />
                ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600">
              {segments.map(s => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{backgroundColor: s.color}}
                  />
                  {s.label}
                  <span className="font-bold text-zinc-800">{s.count}</span>
                </span>
              ))}
            </div>
          </Card>
        )}
      </section>

      <section>
        <SectionTitle>Issues</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Open" value={dash.openIssueCount} color="var(--color-hazard)" />
          <Stat label="Resolved" value={dash.resolvedIssueCount} />
        </div>
      </section>

      <section>
        <SectionTitle count={rooms.length}>Progress by room</SectionTitle>
        <Card className="divide-y divide-zinc-100">
          {rooms.map(({room, status}) => (
            <RoomRow key={room.id} room={room} status={status} nav={nav} />
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle count={dash.flaggedTasks.length}>
          Flagged tasks
        </SectionTitle>
        {dash.flaggedTasks.length === 0 ? (
          <Card className="p-4 text-sm text-zinc-500">
            No flagged tasks — nothing has open issues.
          </Card>
        ) : (
          <ul className="space-y-3">
            {dash.flaggedTasks.map(t => (
              <Card key={t.id} className="border-l-4 border-hazard p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-steel">{t.title}</h3>
                    <p className="text-xs text-zinc-500">
                      {getRoomLabel(t.roomId)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-3">
                  <Button onClick={() => nav.go('task', {taskId: t.id})}>
                    Open task
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const ROOM_DOT = {
  [ROOM_STATUS.TODO]: TODO_INK,
  [ROOM_STATUS.IN_PROGRESS]: 'var(--color-progress)',
  [ROOM_STATUS.BLOCKED]: 'var(--color-hazard)',
  [ROOM_STATUS.DONE]: 'var(--color-go)',
};

// Per-room magnitude: single-hue progress fill on a neutral track, with the
// exact count as a visible label.
function RoomRow({room, status, nav}) {
  const tasks = getTasks(room.id);
  const done = tasks.filter(t => t.status === TASK_STATUS.DONE).length;
  const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
  return (
    <button
      onClick={() => nav.go('room', {roomId: room.id})}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{backgroundColor: ROOM_DOT[status]}}
        aria-hidden
      />
      <span className="w-28 shrink-0 truncate text-sm font-semibold text-steel">
        {room.name}
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
        <span
          className="block h-full rounded-full bg-go"
          style={{width: `${pct}%`}}
        />
      </span>
      <span className="w-20 shrink-0 text-right text-xs text-zinc-600">
        {done}/{tasks.length} done
      </span>
      <span className="sr-only">{ROOM_STATUS_LABEL[status]}</span>
    </button>
  );
}

function Stat({label, value, color}) {
  return (
    <Card className="overflow-hidden">
      <div
        className="h-1.5"
        style={{backgroundColor: color || 'var(--color-steel)'}}
      />
      <div className="p-3 text-center">
        <div className="font-display text-3xl font-bold text-steel">{value}</div>
        <div className="mt-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          {label}
        </div>
      </div>
    </Card>
  );
}
