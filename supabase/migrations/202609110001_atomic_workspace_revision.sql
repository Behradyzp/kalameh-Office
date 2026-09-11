alter table public.workspace_state
  add column if not exists revision bigint not null default 0;

create index if not exists workspace_state_revision_idx
  on public.workspace_state (id, revision);
