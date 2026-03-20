-- 1. ESTRUCTURA DE ORGANIZACIÓN (SAAS)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    config JSONB DEFAULT '{
        "currency": "DOP",
        "tax_name": "ITBIS",
        "tax_rate": 18,
        "tax_included": false
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. ALTERAR TABLA DE USUARIOS PARA VINCULAR A ORGANIZACIÓN
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 3. REFACTORIZACIÓN DE PRODUCTOS (GENÉRICO)
ALTER TABLE productos RENAME COLUMN marca TO nombre;
ALTER TABLE productos RENAME COLUMN modelo TO descripcion;
ALTER TABLE productos RENAME COLUMN medida TO categoria;

ALTER TABLE productos ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(50) DEFAULT 'unidades';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS atributos_extra JSONB DEFAULT '{}'::jsonb;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- SKU único por organización
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_sku_org ON productos(sku, organization_id);

-- 4. VINCULAR OTRAS TABLAS A ORGANIZACIÓN
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE clientes RENAME COLUMN rnc_cedula TO identificacion_fiscal;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE ventas RENAME COLUMN itbis TO impuestos;
ALTER TABLE ventas RENAME COLUMN ncf TO comprobante;

ALTER TABLE cuentas_por_cobrar ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Agregar organization_id a otras tablas operativas para RLS fácil
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE movimientos_stock ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 5. ACTUALIZAR VISTAS PARA INCLUIR NUEVOS CAMPOS
DROP VIEW IF EXISTS productos_criticos;
DROP VIEW IF EXISTS stock_total_productos CASCADE;

CREATE OR REPLACE VIEW stock_total_productos AS
SELECT 
    p.id,
    p.sku,
    p.nombre,
    p.descripcion,
    p.categoria,
    p.organization_id,
    COALESCE(SUM(l.cantidad_actual), 0) AS stock_total,
    p.stock_minimo,
    p.precio_venta_base
FROM productos p
LEFT JOIN lotes l ON p.id = l.producto_id
GROUP BY p.id, p.sku, p.nombre, p.descripcion, p.categoria, p.organization_id, p.stock_minimo, p.precio_venta_base;

CREATE OR REPLACE VIEW productos_criticos AS
SELECT *
FROM stock_total_productos
WHERE stock_total <= stock_minimo;

-- 6. ACTUALIZAR FUNCIÓN DE USUARIO (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_name text;
  v_role public.user_role;
  v_role_str text;
BEGIN
  v_org_name := COALESCE(new.raw_user_meta_data->>'organization_name', new.raw_user_meta_data->>'nombre', 'Mi Empresa');
  
  INSERT INTO organizations (nombre, slug)
  VALUES (v_org_name, LOWER(REPLACE(v_org_name || '-' || substr(new.id::text, 1, 4), ' ', '-')))
  RETURNING id INTO v_org_id;

  v_role_str := new.raw_user_meta_data->>'role';
  IF v_role_str IS NOT NULL AND v_role_str IN ('admin', 'vendedor', 'gerente') THEN
    v_role := v_role_str::public.user_role;
  ELSE
    v_role := 'admin'::public.user_role;
  END IF;

  INSERT INTO public.users (id, email, nombre, role, organization_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), 
    v_role,
    v_org_id
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. RE-IMPLEMENTACIÓN DE process_sale CON MULTI-TENANCY
CREATE OR REPLACE FUNCTION process_sale(
  p_cliente_id UUID,
  p_vendedor_id UUID,
  p_subtotal NUMERIC,
  p_impuestos NUMERIC,
  p_total NUMERIC,
  p_tipo_ncf VARCHAR(20),
  p_comprobante VARCHAR(20),
  p_items JSONB, -- Array: { lote_id, cantidad, precio, descuento, subtotal }
  p_es_credito BOOLEAN,
  p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  item JSONB;
  v_lote_id UUID;
  v_cantidad INTEGER;
  v_precio NUMERIC;
  v_descuento NUMERIC;
  v_item_subtotal NUMERIC;
BEGIN
  -- Insert Venta con comprobante personalizado/SaaS
  INSERT INTO ventas (cliente_id, vendedor_id, subtotal, impuestos, total, tipo_ncf, comprobante, es_credito, organization_id)
  VALUES (p_cliente_id, p_vendedor_id, p_subtotal, p_impuestos, p_total, p_tipo_ncf, p_comprobante, p_es_credito, p_organization_id)
  RETURNING id INTO v_venta_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_lote_id := (item->>'lote_id')::UUID;
    v_cantidad := (item->>'cantidad')::INTEGER;
    v_precio := (item->>'precio')::NUMERIC;
    v_descuento := (item->>'descuento')::NUMERIC;
    v_item_subtotal := (item->>'subtotal')::NUMERIC;

    UPDATE lotes
    SET cantidad_actual = cantidad_actual - v_cantidad
    WHERE id = v_lote_id AND cantidad_actual >= v_cantidad AND organization_id = p_organization_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente o lote no pertenece a la organización';
    END IF;

    INSERT INTO venta_detalle (venta_id, lote_id, cantidad, precio_unitario, descuento, subtotal)
    VALUES (v_venta_id, v_lote_id, v_cantidad, v_precio, v_descuento, v_item_subtotal);

    INSERT INTO movimientos_stock (lote_id, tipo, cantidad, usuario_id, referencia_id, organization_id)
    VALUES (v_lote_id, 'venta', -v_cantidad, p_vendedor_id, v_venta_id, p_organization_id);
  END LOOP;

  IF p_es_credito THEN
    INSERT INTO cuentas_por_cobrar (venta_id, cliente_id, monto_total, balance_pendiente, fecha_vencimiento, organization_id)
    VALUES (v_venta_id, p_cliente_id, p_total, p_total, (now() + interval '30 days')::date, p_organization_id);
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql;
