-- MODELO DE DATOS PARA EL BLOG DE MARKETING
-- Ejecutar desde Supabase > SQL Editor. No colocar aquí credenciales reales.
-- Para el primer administrador, crear antes un usuario en Authentication > Users,
-- luego insertarlo en site_admins usando su UUID (véase README).

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_articles (
  slug text primary key,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint blog_articles_slug_length check (char_length(slug) between 3 and 100),
  constraint blog_articles_content_object check (jsonb_typeof(content) = 'object')
);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  author_name text not null,
  body text not null,
  status text not null default 'approved',
  created_at timestamptz not null default now(),
  constraint blog_comments_status_check check (status in ('approved','hidden')),
  constraint blog_comments_name_check check (char_length(btrim(author_name)) between 2 and 60),
  constraint blog_comments_body_check check (char_length(btrim(body)) between 5 and 1000),
  constraint blog_comments_slug_check check (char_length(article_slug) between 3 and 100)
);

create index if not exists idx_blog_comments_article_date
  on public.blog_comments (article_slug, created_at desc);

-- Se ejecuta como propietario para comprobar el registro de administradores,
-- sin permitir a los visitantes agregar sus propios permisos.
create or replace function public.is_blog_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_blog_admin() from public;
grant execute on function public.is_blog_admin() to anon, authenticated;

alter table public.site_admins enable row level security;
alter table public.blog_articles enable row level security;
alter table public.blog_comments enable row level security;

-- Solo un usuario autenticado puede leer su propia pertenencia a admin.
drop policy if exists "Admin consulta sus privilegios" on public.site_admins;
create policy "Admin consulta sus privilegios" on public.site_admins
for select to authenticated using ((select auth.uid()) = user_id);
-- No hay política INSERT/UPDATE/DELETE para site_admins desde la API.

-- Un visitante solo lee artículos publicados; solamente un admin puede editarlos.
drop policy if exists "Lectura de artículos publicados" on public.blog_articles;
create policy "Lectura de artículos publicados" on public.blog_articles
for select to anon, authenticated using (is_published = true or (select public.is_blog_admin()));
drop policy if exists "Administrador crea artículos" on public.blog_articles;
create policy "Administrador crea artículos" on public.blog_articles
for insert to authenticated with check ((select public.is_blog_admin()));
drop policy if exists "Administrador edita artículos" on public.blog_articles;
create policy "Administrador edita artículos" on public.blog_articles
for update to authenticated using ((select public.is_blog_admin()))
with check ((select public.is_blog_admin()));

-- Los comentarios aprobados son visibles. Un admin también ve los ocultos.
drop policy if exists "Lectura de comentarios visibles" on public.blog_comments;
create policy "Lectura de comentarios visibles" on public.blog_comments
for select to anon, authenticated using (status = 'approved' or (select public.is_blog_admin()));

-- Solo se permite publicar como aprobado, evitando que visitantes cambien el
-- estado de comentarios existentes. Restricciones de longitud están en la tabla.
drop policy if exists "Visitantes pueden comentar" on public.blog_comments;
create policy "Visitantes pueden comentar" on public.blog_comments
for insert to anon, authenticated with check (status = 'approved');

drop policy if exists "Administrador modera comentarios" on public.blog_comments;
create policy "Administrador modera comentarios" on public.blog_comments
for update to authenticated using ((select public.is_blog_admin()))
with check ((select public.is_blog_admin()));

-- Bucket público de LECTURA, pero escritura restringida a administradores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 8388608, ARRAY['image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Lectura de imágenes del blog" on storage.objects;
create policy "Lectura de imágenes del blog" on storage.objects
for select to anon, authenticated
using (bucket_id = 'blog-images');

drop policy if exists "Admin sube imágenes al blog" on storage.objects;
create policy "Admin sube imágenes al blog" on storage.objects
for insert to authenticated
with check (bucket_id = 'blog-images' and (select public.is_blog_admin()));

drop policy if exists "Admin elimina imágenes del blog" on storage.objects;
create policy "Admin elimina imágenes del blog" on storage.objects
for delete to authenticated
using (bucket_id = 'blog-images' and (select public.is_blog_admin()));

-- IMPORTANTE: el antispam del navegador (honeypot + espera de 45 s) es básico;
-- puede evadirse. Para tráfico real se recomienda Turnstile y una Edge Function.
