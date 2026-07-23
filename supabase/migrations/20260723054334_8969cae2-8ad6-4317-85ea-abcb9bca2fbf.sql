
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Restrict public bucket listing: keep public read of individual files, require auth to list
DROP POLICY IF EXISTS "product-assets public read" ON storage.objects;
CREATE POLICY "product-assets authenticated read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'product-assets');
CREATE POLICY "product-assets anon read direct" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'product-assets');
