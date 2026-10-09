-- Run AFTER the base schema from the technical document.
-- Adds what the frontend relies on: drop dates, profile creation on sign-up,
-- Row Level Security, and realtime stock updates.

-- 1. Optional drop date, drives the countdown on the home and drops pages.
alter table products add column if not exists drop_at timestamptz;

-- 2. Create a profiles row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Admin check used by the policies below.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. Row Level Security.
alter table profiles         enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table product_images   enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;

-- Profiles: read your own, update your own without changing your role.
create policy "profiles read own" on profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles update own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

-- Catalog: anyone can read, only admins can write.
create policy "products public read" on products for select using (true);
create policy "variants public read" on product_variants for select using (true);
create policy "images public read" on product_images for select using (true);
create policy "products admin write" on products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "variants admin write" on product_variants
  for all using (public.is_admin()) with check (public.is_admin());
create policy "images admin write" on product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders: customers read their own, admins read and update all.
-- Orders are INSERTED by /api/checkout with the service role key, which bypasses RLS.
create policy "orders read own" on orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders admin update" on orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "order items read own" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- 5. Realtime stock counters on the product page.
alter publication supabase_realtime add table product_variants;

-- 6. Make yourself an admin (replace the email, run once after signing up).
-- update profiles set role = 'admin' where email = 'you@example.com';
