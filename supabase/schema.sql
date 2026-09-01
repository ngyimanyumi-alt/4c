-- 4C 班務管理 Supabase schema
-- 匿名寫入僅供示範：正式學校使用前，請改為 Supabase Auth + 更嚴格 RLS。

create extension if not exists pgcrypto;

create table if not exists public.students (
  id bigint generated always as identity primary key,
  class_id text not null default '4C',
  student_number integer not null,
  name text not null,
  absent_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_student_number_positive check (student_number > 0),
  constraint students_absent_days_non_negative check (absent_days >= 0),
  constraint students_class_student_unique unique (class_id, student_number)
);

create table if not exists public.duty_overrides (
  id bigint generated always as identity primary key,
  class_id text not null default '4C',
  duty_date date not null,
  duty_slot text not null,
  duty_offset integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint duty_slot_allowed check (duty_slot in ('早會', '黑板', '地面')),
  constraint duty_override_unique unique (class_id, duty_date, duty_slot)
);

create table if not exists public.todos (
  id bigint generated always as identity primary key,
  class_id text not null default '4C',
  text text not null,
  category text not null default '一般',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_links (
  id bigint generated always as identity primary key,
  class_id text not null default '4C',
  title text not null,
  url text not null,
  icon text not null default '🔗',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_links_url_format check (url ~ '^https?://')
);

create index if not exists idx_students_class on public.students (class_id, student_number);
create index if not exists idx_duty_overrides_class on public.duty_overrides (class_id, duty_date);
create index if not exists idx_todos_class on public.todos (class_id, completed);
create index if not exists idx_custom_links_class on public.custom_links (class_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_students_set_updated_at on public.students;
create trigger trg_students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_duty_overrides_set_updated_at on public.duty_overrides;
create trigger trg_duty_overrides_set_updated_at
before update on public.duty_overrides
for each row execute function public.set_updated_at();

drop trigger if exists trg_todos_set_updated_at on public.todos;
create trigger trg_todos_set_updated_at
before update on public.todos
for each row execute function public.set_updated_at();

drop trigger if exists trg_custom_links_set_updated_at on public.custom_links;
create trigger trg_custom_links_set_updated_at
before update on public.custom_links
for each row execute function public.set_updated_at();

alter table public.students enable row level security;
alter table public.duty_overrides enable row level security;
alter table public.todos enable row level security;
alter table public.custom_links enable row level security;

-- 允許所有人讀取 4C（公開看板）
drop policy if exists students_read_4c on public.students;
create policy students_read_4c
on public.students
for select
to anon, authenticated
using (class_id = '4C');

drop policy if exists duty_overrides_read_4c on public.duty_overrides;
create policy duty_overrides_read_4c
on public.duty_overrides
for select
to anon, authenticated
using (class_id = '4C');

drop policy if exists todos_read_4c on public.todos;
create policy todos_read_4c
on public.todos
for select
to anon, authenticated
using (class_id = '4C');

drop policy if exists custom_links_read_4c on public.custom_links;
create policy custom_links_read_4c
on public.custom_links
for select
to anon, authenticated
using (class_id = '4C');

-- 示範模式：允許匿名寫入 4C
-- 正式上線請改成 to authenticated 並加上 user/class 關聯條件
drop policy if exists students_write_4c_demo on public.students;
create policy students_write_4c_demo
on public.students
for all
to anon, authenticated
using (class_id = '4C')
with check (class_id = '4C');

drop policy if exists duty_overrides_write_4c_demo on public.duty_overrides;
create policy duty_overrides_write_4c_demo
on public.duty_overrides
for all
to anon, authenticated
using (class_id = '4C')
with check (class_id = '4C');

drop policy if exists todos_write_4c_demo on public.todos;
create policy todos_write_4c_demo
on public.todos
for all
to anon, authenticated
using (class_id = '4C')
with check (class_id = '4C');

drop policy if exists custom_links_write_4c_demo on public.custom_links;
create policy custom_links_write_4c_demo
on public.custom_links
for all
to anon, authenticated
using (class_id = '4C')
with check (class_id = '4C');

insert into public.students (class_id, student_number, name, absent_days)
values
  ('4C', 1, '陳大文', 0),
  ('4C', 2, '李小美', 0),
  ('4C', 3, '王俊傑', 0)
on conflict (class_id, student_number) do update
set name = excluded.name;

insert into public.todos (class_id, text, category, completed)
select '4C', item_text, item_category, false
from (
  values
    ('交數學作業', '功課'),
    ('明天帶體育服', '提醒')
) as seed(item_text, item_category)
where not exists (
  select 1
  from public.todos t
  where t.class_id = '4C'
    and t.text = seed.item_text
    and t.category = seed.item_category
);

insert into public.custom_links (class_id, title, url, icon)
select '4C', '學校網站', 'https://www.edb.gov.hk/', '🏫'
where not exists (
  select 1
  from public.custom_links l
  where l.class_id = '4C'
    and l.title = '學校網站'
    and l.url = 'https://www.edb.gov.hk/'
);
