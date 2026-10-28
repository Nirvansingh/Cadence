-- ==============================================================================
-- Cadence Schema: Multi-Tenant Productivity Architecture
-- Migration: 001_initial_schema.sql
-- Description: Creates relational tables for tasks, habits, habit_logs, 
--              notes, timetable_slots, focus_logs, and user_streaks.
-- Security: Enables Row Level Security (RLS) on all tables with strict user isolation.
-- ==============================================================================

-- 1. Helper function to auto-update 'updated_at' timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Tasks & Subtasks
-- ------------------------------------------------------------------------------
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null check (status in ('todo', 'in_progress', 'done')) default 'todo',
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  due_date text,
  tags text[] default '{}',
  subtasks jsonb default '[]'::jsonb,
  sort_order integer default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create trigger tr_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Habits
-- ------------------------------------------------------------------------------
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('study', 'coding', 'health', 'routine', 'mindset')),
  time_of_day text not null check (time_of_day in ('morning', 'afternoon', 'evening', 'night', 'anytime')),
  cue text default '',
  routine text default '',
  reward text default '',
  icon text,
  color text,
  target_days_mask integer not null default 127,
  frequency text default 'daily',
  stack_after_habit_id text,
  sort_order integer default 0,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

create trigger tr_habits_updated_at
  before update on public.habits
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Habit Completion Logs
-- ------------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  completed_date text not null, -- 'YYYY-MM-DD'
  notes text,
  is_deleted boolean not null default false,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habit_logs enable row level security;

create policy "Users can view their own habit logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habit logs"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habit logs"
  on public.habit_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own habit logs"
  on public.habit_logs for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. Notes
-- ------------------------------------------------------------------------------
create table if not exists public.notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text default '',
  tags text[] default '{}',
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

create trigger tr_notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Timetable Slots
-- ------------------------------------------------------------------------------
create table if not exists public.timetable_slots (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time text not null, -- 'HH:MM'
  end_time text not null,   -- 'HH:MM'
  title text not null,
  category text not null check (category in ('school', 'tuition', 'study', 'workout', 'meals', 'sleep', 'other')),
  note text,
  sort_order integer default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.timetable_slots enable row level security;

create policy "Users can view their own timetable slots"
  on public.timetable_slots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own timetable slots"
  on public.timetable_slots for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own timetable slots"
  on public.timetable_slots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own timetable slots"
  on public.timetable_slots for delete
  using (auth.uid() = user_id);

create trigger tr_timetable_slots_updated_at
  before update on public.timetable_slots
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. Focus Sessions
-- ------------------------------------------------------------------------------
create table if not exists public.focus_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date_str text not null, -- 'YYYY-MM-DD'
  minutes integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.focus_logs enable row level security;

create policy "Users can view their own focus logs"
  on public.focus_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own focus logs"
  on public.focus_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own focus logs"
  on public.focus_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own focus logs"
  on public.focus_logs for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. User Streaks
-- ------------------------------------------------------------------------------
create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_active_date text,
  freezes_available integer not null default 2,
  freeze_dates text[] default '{}',
  active_dates text[] default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

create policy "Users can view their own streak"
  on public.user_streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own streak"
  on public.user_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own streak"
  on public.user_streaks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger tr_user_streaks_updated_at
  before update on public.user_streaks
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 9. Realtime Publication Enablement
-- ------------------------------------------------------------------------------
-- Enable real-time replication for multi-device sync
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.habits;
alter publication supabase_realtime add table public.habit_logs;
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.timetable_slots;
alter publication supabase_realtime add table public.focus_logs;
alter publication supabase_realtime add table public.user_streaks;
