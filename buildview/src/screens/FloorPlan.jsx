import React from 'react';
import {useDbVersion} from '../lib/useDb.js';
import {db} from '../data/db.js';
import {getRooms, getTasks} from '../domain/queries.js';
import {getRoomStatus} from '../domain/status.js';
import {ROOM_STATUS, ROOM_STATUS_LABEL} from '../domain/constants.js';
import PlanMap from '../components/PlanMap.jsx';
import {asset} from '../lib/assets.js';
import {Card, PageTitle, SectionTitle} from '../components/ui.jsx';

// Feature 2: Plan-first floor view. An interactive schematic plan generated
// from the real rooms — every room is clickable and tinted by derived status.
export default function FloorPlan({nav, params}) {
  useDbVersion();
  const floor = db.floors.get(params.floorId);
  if (!floor) {
    return <Card className="p-6 text-center text-zinc-600">Floor not found.</Card>;
  }
  const building = db.buildings.get(floor.buildingId);
  const rooms = getRooms(floor.id).map(room => ({
    room,
    status: getRoomStatus(room.id),
    taskCount: getTasks(room.id).length,
  }));

  return (
    <div className="space-y-5">
      <PageTitle subtitle={building ? `${building.name} · ${floor.name}` : floor.name}>
        Floor plan
      </PageTitle>

      <Legend />

      {rooms.length === 0 ? (
        <Card className="p-4 text-sm text-zinc-500">No rooms on this floor.</Card>
      ) : (
        <Card className="overflow-hidden">
          <PlanMap
            rooms={rooms}
            onSelectRoom={roomId => nav.go('room', {roomId})}
          />
          <p className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500">
            Tap a room to open it. Status is derived live from its tasks and
            issues.
          </p>
        </Card>
      )}

      <SectionTitle>Reference drawings</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {[
          [asset('demo-assets/drawings/habs-residence-floorplan.jpg'), 'Measured drawing (HABS)'],
          [asset('demo-assets/floor-plans/sample-floorplan.jpg'), 'Sample floor plan'],
        ].map(([src, label]) => (
          <Card key={src} className="overflow-hidden">
            <img src={src} alt={label} className="aspect-video w-full bg-white object-contain" />
            <div className="p-2 text-xs font-medium text-zinc-600">{label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    [ROOM_STATUS.TODO, 'bg-zinc-500'],
    [ROOM_STATUS.IN_PROGRESS, 'bg-progress'],
    [ROOM_STATUS.BLOCKED, 'bg-hazard'],
    [ROOM_STATUS.DONE, 'bg-go'],
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
      {items.map(([status, color]) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className={`inline-block size-3 rounded-sm ${color}`} />
          {ROOM_STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  );
}
