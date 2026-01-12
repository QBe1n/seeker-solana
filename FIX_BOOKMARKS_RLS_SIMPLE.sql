-- Исправить RLS политики для bookmarks
-- Запустите в Supabase SQL Editor

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
    FOR DELETE TO public USING (true);
