
-- 1. Actualizar a TODOS los usuarios existentes para que sean administradores
UPDATE public.users SET role = 'admin';

-- 2. Modificar la función de registro para que nunca falle y siempre ponga admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_name text;
BEGIN
  -- Obtener nombre de la organización
  v_org_name := COALESCE(new.raw_user_meta_data->>'organization_name', 'Mi Empresa');
  
  -- Crear organización
  INSERT INTO organizations (nombre, slug)
  VALUES (v_org_name, LOWER(REPLACE(v_org_name || '-' || substr(new.id::text, 1, 4), ' ', '-')))
  RETURNING id INTO v_org_id;

  -- Insertar usuario como ADMIN
  INSERT INTO public.users (id, email, nombre, role, organization_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), 
    'admin',
    v_org_id
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. (IMPORTANTE) Si después de ejecutar esto sigues viendo "Vendedor", 
-- por favor cierra sesión en la web y vuelve a entrar.
