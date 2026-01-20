
-- ==============================================================================
-- CLEANUP SCRIPT: PREPARING FOR PRODUCTION
-- Executes only when you are ready to remove dev backdoors
-- ==============================================================================

-- 1. Remove Dev Policies
drop policy if exists "Dev Admin Insert Generations" on public.generations;
drop policy if exists "Dev Admin Select Generations" on public.generations;
drop policy if exists "Dev Admin Delete Generations" on public.generations;
drop policy if exists "Dev Admin All Variations" on public.variations;
drop policy if exists "Dev Admin Presets" on public.user_presets;
drop policy if exists "Dev Admin Storage Upload" on storage.objects;
drop policy if exists "Dev Admin Storage Select" on storage.objects;

-- 2. Restore Strict Storage Policy (Optional - ensure strict access)
drop policy if exists "Luxifier User Storage Access" on storage.objects;
create policy "Luxifier User Storage Access" on storage.objects
  for all 
  using (auth.uid()::text = (storage.foldername(name))[1]) 
  with check (auth.uid()::text = (storage.foldername(name))[1]);

-- 3. (Optional) Delete the Dev Admin user if you want to clean the table
-- delete from public.profiles where id = 'dev-admin-id';
