
-- Habilitar RLS en organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios vean su propia organización
DROP POLICY IF EXISTS "Usuarios pueden ver su propia organización" ON organizations;
CREATE POLICY "Usuarios pueden ver su propia organización" 
ON organizations FOR SELECT 
USING (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid())
);

-- Política para permitir que los administradores actualicen su propia organización
DROP POLICY IF EXISTS "Admins pueden actualizar su propia organización" ON organizations;
CREATE POLICY "Admins pueden actualizar su propia organización" 
ON organizations FOR UPDATE 
TO authenticated
USING (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Asegurar que las otras tablas tengan políticas básicas (si no las tienen)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to products by org" ON productos;
CREATE POLICY "Public access to products by org" ON productos
FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to clients by org" ON clientes;
CREATE POLICY "Public access to clients by org" ON clientes
FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to sales by org" ON ventas;
CREATE POLICY "Public access to sales by org" ON ventas
FOR ALL USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
