-- SCHEMA PARA MIGRAR DJVIP A SUPABASE (POSTGRESQL)

-- 1. Tabla de perfiles de DJs (enlace uno a uno con auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  phone text,
  active_plan text default 'free',
  subscription_status text default 'inactive',
  expires_at timestamptz,
  device_id text,
  logo_url text,
  demo_limit integer default 35,
  demo_limit_expires_at bigint,
  premium_limit integer default 80,
  premium_limit_expires_at bigint,
  extra_requests integer default 0,
  extra_requests_expires_at bigint,
  strict_limit_enabled boolean default true,
  logo_upload_enabled boolean default false,
  custom_settings jsonb default '{}'::jsonb,
  revenue numeric(10, 2) default 0.0,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Crear políticas de acceso para perfiles
create policy "Cualquiera puede leer perfiles de DJs" on public.profiles
  for select using (true);

create policy "Los usuarios pueden actualizar su propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- 2. Trigger automático para crear perfil al registrar usuario en Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, active_plan, subscription_status, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    'free',
    'inactive',
    new.created_at
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Tabla de eventos
create table public.events (
  id text primary key, -- ej: default-event o default-event-UID
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'Mi Gran Evento VIP',
  dj_name text default 'DJ MasterMix',
  active boolean default true,
  archived boolean default false,
  theme_color text default '#7c3aed',
  theme_color_secondary text default '#06b6d4',
  web_name text default 'DJ a la Carta',
  event_type text default 'Otro',
  logo_url text,
  tips_enabled boolean default false,
  paypal_username text,
  mercadopago_link text,
  promo_enabled boolean default false,
  promo_whatsapp text,
  promo_website text,
  promo_instagram text,
  promo_tiktok text,
  production_url text,
  custom_genres text,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Cualquiera puede ver eventos activos" on public.events
  for select using (true);

create policy "Los DJs pueden gestionar sus propios eventos" on public.events
  for all using (auth.uid() = owner_id);


-- 4. Tabla de peticiones activas (cola de peticiones)
create table public.requests (
  id text primary key, -- ej: push key ID generado
  event_id text references public.events(id) on delete cascade not null,
  title text default 'Tema no especificado',
  artist text default 'Artista no especificado',
  genre text default 'Personalizado',
  dedication text,
  status text default 'pending', -- pending, playing, accepted, rejected
  votes integer default 1,
  is_repeat boolean default false,
  timestamp bigint not null,
  created_at timestamptz default now()
);

alter table public.requests enable row level security;

create policy "Cualquiera puede leer peticiones" on public.requests
  for select using (true);

create policy "Cualquiera puede crear peticiones" on public.requests
  for insert with check (true);

create policy "Cualquiera puede actualizar/votar peticiones" on public.requests
  for update using (true);

create policy "Los DJs dueños pueden eliminar peticiones" on public.requests
  for delete using (
    exists (
      select 1 from public.events e 
      where e.id = requests.event_id and e.owner_id = auth.uid()
    )
  );


-- 5. Tabla de votantes por petición (para prevenir doble voto)
create table public.request_voters (
  id uuid default gen_random_uuid() primary key,
  request_id text references public.requests(id) on delete cascade not null,
  session_id text not null,
  created_at timestamptz default now(),
  unique(request_id, session_id)
);

alter table public.request_voters enable row level security;

create policy "Cualquiera puede ver votantes" on public.request_voters
  for select using (true);

create policy "Cualquiera puede registrar su voto" on public.request_voters
  for insert with check (true);


-- 6. Tabla de canciones reproducidas (historial)
create table public.played_requests (
  id text primary key,
  event_id text references public.events(id) on delete cascade not null,
  title text default 'Tema no especificado',
  artist text default 'Artista no especificado',
  genre text default 'Personalizado',
  dedication text,
  status text default 'playing',
  votes integer default 1,
  is_repeat boolean default false,
  timestamp bigint not null,
  played_at bigint not null,
  created_at timestamptz default now()
);

alter table public.played_requests enable row level security;

create policy "Cualquiera puede leer historial" on public.played_requests
  for select using (true);

create policy "Los DJs dueños pueden gestionar el historial" on public.played_requests
  for all using (
    exists (
      select 1 from public.events e 
      where e.id = played_requests.event_id and e.owner_id = auth.uid()
    )
  );


-- 7. Tabla de mensajes de soporte (chat)
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null, -- ej: chat_DJUID_SESSIONID
  message text not null,
  sender text not null, -- client o dj
  timestamp bigint not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Cualquiera puede participar en chats" on public.chat_messages
  for all using (true);


-- 8. Funciones RPC para votos atómicos
create or replace function public.increment_votes(row_id text)
returns void as $$
begin
  update public.requests
  set votes = votes + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_votes(row_id text)
returns void as $$
begin
  update public.requests
  set votes = greatest(1, votes - 1)
  where id = row_id;
end;
$$ language plpgsql security definer;
