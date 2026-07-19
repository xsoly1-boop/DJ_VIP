import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = `
-- 1. Modificar políticas de profiles
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Los usuarios o admin pueden actualizar perfiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'dj@admin.com'
  );

-- 2. Modificar políticas de events
DROP POLICY IF EXISTS "Los DJs pueden gestionar sus propios eventos" ON public.events;
CREATE POLICY "Los DJs o admin pueden gestionar eventos" ON public.events
  FOR ALL USING (
    auth.uid() = owner_id OR 
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'dj@admin.com'
  );

-- 3. Modificar políticas de requests
DROP POLICY IF EXISTS "Los DJs dueños pueden eliminar peticiones" ON public.requests;
CREATE POLICY "Los DJs dueños o admin pueden eliminar peticiones" ON public.requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = requests.event_id AND (e.owner_id = auth.uid() OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'dj@admin.com')
    )
  );

-- 4. Modificar políticas de played_requests
DROP POLICY IF EXISTS "Los DJs dueños pueden gestionar el historial" ON public.played_requests;
CREATE POLICY "Los DJs dueños o admin pueden gestionar el historial" ON public.played_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = played_requests.event_id AND (e.owner_id = auth.uid() OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = 'dj@admin.com')
    )
  );
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Applying RLS policy updates for Master Admin...");
    await client.query(sql);
    console.log("RLS policies updated successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
