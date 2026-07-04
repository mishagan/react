import React, {useState} from 'react';
import {useDbVersion} from '../lib/useDb.js';
import {createProject} from '../domain/entities.js';
import {
  getProjectsForForeman,
  getMembershipsForProject,
  getAllRoomsForProject,
} from '../domain/queries.js';
import {
  getProjectProgress,
  getOpenIssuesForProject,
  getBlockedRooms,
} from '../domain/status.js';
import {ACCESS_LEVEL} from '../domain/constants.js';
import {
  Button,
  Card,
  PageTitle,
  SectionTitle,
  InviteCode,
  Field,
  TextInput,
} from '../components/ui.jsx';

// Screen 2: Foreman project list — each project is a live status card.
export default function ForemanProjectList({nav}) {
  useDbVersion();
  const projects = getProjectsForForeman(nav.user.id);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject({
      name: name.trim(),
      address: address.trim(),
      createdByUserId: nav.user.id,
    });
    setName('');
    setAddress('');
  }

  return (
    <div className="space-y-5">
      <PageTitle subtitle={`Welcome back, ${nav.user.name}`}>Projects</PageTitle>

      {projects.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand/15 text-2xl">
            🏗
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-steel">
            No projects yet
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500">
            Create your first project below — then add buildings, floors, rooms
            and tasks, and invite your crew with the project code.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} nav={nav} />
          ))}
        </ul>
      )}

      <section>
        <SectionTitle>Create a project</SectionTitle>
        <Card className="p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <Field label="Name">
              <TextInput value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Address">
              <TextInput
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </Field>
            <Button type="submit">Create project</Button>
          </form>
        </Card>
      </section>
    </div>
  );
}

function ProjectCard({project, nav}) {
  const progress = getProjectProgress(project.id);
  const rooms = getAllRoomsForProject(project.id).length;
  const crew = getMembershipsForProject(project.id).filter(
    m => m.accessLevel === ACCESS_LEVEL.GRANTED
  ).length;
  const openIssues = getOpenIssuesForProject(project.id).length;
  const blocked = getBlockedRooms(project.id).length;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-steel">
              {project.name}
            </h3>
            <p className="text-sm text-zinc-500">
              {project.address || '(no address)'}
            </p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div className="mb-1">Invite code</div>
            <InviteCode code={project.inviteCode} />
          </div>
        </div>

        {/* live progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-go"
              style={{width: `${progress.percent}%`}}
            />
          </div>
          <span className="font-display text-sm font-bold text-steel">
            {progress.percent}%
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Pill>{rooms} rooms</Pill>
          <Pill>{crew} crew</Pill>
          {openIssues > 0 && (
            <Pill className="bg-red-50 text-hazard">{openIssues} open issue{openIssues === 1 ? '' : 's'}</Pill>
          )}
          {blocked > 0 && (
            <Pill className="bg-red-50 text-hazard">{blocked} blocked</Pill>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => nav.go('control', {projectId: project.id})}>
            Site control
          </Button>
          <Button
            variant="secondary"
            onClick={() => nav.go('project', {projectId: project.id})}>
            Structure
          </Button>
          <Button
            variant="secondary"
            onClick={() => nav.go('requests', {projectId: project.id})}>
            Requests
          </Button>
          <Button
            variant="secondary"
            onClick={() => nav.go('report', {projectId: project.id})}>
            Report
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Pill({children, className = ''}) {
  return (
    <span
      className={`rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-600 ${className}`}>
      {children}
    </span>
  );
}
