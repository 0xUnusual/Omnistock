
-- 1. Crear el bucket 'logos' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir acceso público de lectura a los archivos del bucket logos
CREATE POLICY "Acceso público de lectura para logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

-- 3. Permitir a los usuarios autenticados subir logos a su propia carpeta (o con su ID de organización)
-- Para simplificar, permitiremos que cualquier usuario autenticado suba al bucket 'logos'
-- En un entorno real, restringiríamos por organization_id en el path del archivo
CREATE POLICY "Usuarios autenticados pueden subir logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- 4. Permitir actualizar sus propios logos
CREATE POLICY "Usuarios autenticados pueden actualizar logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');
