-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'gerente');
CREATE TYPE sale_status AS ENUM ('activa', 'anulada');
CREATE TYPE payment_status AS ENUM ('pendiente', 'pagado', 'vencido');
CREATE TYPE movement_type AS ENUM ('venta', 'anulacion', 'ajuste');
CREATE TYPE ncf_type AS ENUM ('B01', 'B02');

-- USERS TABLE (Linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'vendedor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Trigger to create a public user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_role_str text;
BEGIN
  -- Get role from metadata and sanitize
  v_role_str := new.raw_user_meta_data->>'role';
  
  -- Validate role string to prevent cast errors
  IF v_role_str IS NOT NULL AND v_role_str IN ('admin', 'vendedor', 'gerente') THEN
    v_role := v_role_str::public.user_role;
  ELSE
    v_role := 'vendedor'::public.user_role;
  END IF;

  INSERT INTO public.users (id, email, nombre, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), 
    v_role
  );
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log internal error if possible, but at least allow transaction to fail with distinct message
    RAISE EXCEPTION 'Error interno creando usuario en public.users: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PRODUCTOS
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100),
    medida VARCHAR(50),
    precio_venta_base NUMERIC(12,2) NOT NULL,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    proveedor VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- LOTES (Stock Real)
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    precio_compra NUMERIC(12,2) NOT NULL,
    cantidad_inicial INTEGER NOT NULL CHECK (cantidad_inicial >= 0),
    cantidad_actual INTEGER NOT NULL CHECK (cantidad_actual >= 0),
    fecha_importacion DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- CLIENTES
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('normal','mayorista')),
    descuento_fijo NUMERIC(5,2) DEFAULT 0,
    limite_credito NUMERIC(12,2) DEFAULT 0,
    dias_credito INTEGER DEFAULT 0,
    rnc_cedula VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- NCF CONTROL
CREATE TABLE ncf_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo ncf_type NOT NULL,
    rango_inicio VARCHAR(20) NOT NULL,
    rango_fin VARCHAR(20) NOT NULL,
    secuencia_actual VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- VENTAS
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    vendedor_id UUID REFERENCES users(id),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    subtotal NUMERIC(12,2) NOT NULL,
    itbis NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    descuento_total NUMERIC(12,2) DEFAULT 0,
    tipo_ncf ncf_type NOT NULL,
    ncf VARCHAR(20) UNIQUE NOT NULL,
    estado sale_status DEFAULT 'activa',
    es_credito BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- VENTA DETALLE
CREATE TABLE venta_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    descuento NUMERIC(12,2) DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL
);

-- MOVIMIENTOS STOCK
CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES lotes(id) ON DELETE RESTRICT,
    tipo movement_type NOT NULL,
    cantidad INTEGER NOT NULL,
    usuario_id UUID REFERENCES users(id),
    referencia_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- CUENTAS POR COBRAR
CREATE TABLE cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id),
    monto_total NUMERIC(12,2) NOT NULL,
    monto_pagado NUMERIC(12,2) DEFAULT 0,
    balance_pendiente NUMERIC(12,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado payment_status DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- PAGOS
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
    monto NUMERIC(12,2) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    metodo_pago VARCHAR(50)
);

-- VISTAS
CREATE OR REPLACE VIEW stock_total_productos AS
SELECT 
    p.id,
    p.sku,
    p.marca,
    p.modelo,
    p.medida,
    COALESCE(SUM(l.cantidad_actual), 0) AS stock_total,
    p.stock_minimo
FROM productos p
LEFT JOIN lotes l ON p.id = l.producto_id
GROUP BY p.id;

CREATE OR REPLACE VIEW productos_criticos AS
SELECT *
FROM stock_total_productos
WHERE stock_total <= stock_minimo;

-- INDEXES
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_lotes_producto ON lotes(producto_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_movimientos_lote ON movimientos_stock(lote_id);
CREATE INDEX idx_cuentas_estado ON cuentas_por_cobrar(estado);

-- RLS (Row Level Security) - Enable generic readable access for now, restrict writes
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Adjust as needed for strict security)
-- (Note: 'products' in SQL above is 'productos', let's stick to Spanish names)
CREATE POLICY "Public read access" ON productos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can read everything" ON lotes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read everything" ON clientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read everything" ON ventas FOR SELECT USING (auth.role() = 'authenticated');

-- TRANSACTIONAL SALE PROCESSING FUNCTION
CREATE OR REPLACE FUNCTION process_sale(
  p_cliente_id UUID,
  p_vendedor_id UUID,
  p_subtotal NUMERIC,
  p_itbis NUMERIC,
  p_total NUMERIC,
  p_tipo_ncf ncf_type,
  p_items JSONB, -- Array of objects: { lote_id, cantidad, precio, descuento }
  p_es_credito BOOLEAN
) RETURNS UUID AS $$
DECLARE
  v_venta_id UUID;
  v_ncf VARCHAR;
  item JSONB;
  v_lote_id UUID;
  v_cantidad INTEGER;
  v_precio NUMERIC;
  v_descuento NUMERIC;
  v_item_subtotal NUMERIC;
BEGIN
  -- 1. Generate NCF (Simplified logic, implies strictly sequential)
  -- Ideally, fetch next sequence from ncf_control and update it
  -- For this example, generating a placeholder or using a separate function is best.
  -- Let's assume a simplified NCF generation for the demo:
  v_ncf := 'B02' || floor(random() * 100000000)::text; 

  -- 2. Insert Venta
  INSERT INTO ventas (cliente_id, vendedor_id, subtotal, itbis, total, tipo_ncf, ncf, es_credito)
  VALUES (p_cliente_id, p_vendedor_id, p_subtotal, p_itbis, p_total, p_tipo_ncf, v_ncf, p_es_credito)
  RETURNING id INTO v_venta_id;

  -- 3. Process Items
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_lote_id := (item->>'lote_id')::UUID;
    v_cantidad := (item->>'cantidad')::INTEGER;
    v_precio := (item->>'precio')::NUMERIC;
    v_descuento := (item->>'descuento')::NUMERIC;
    v_item_subtotal := (item->>'subtotal')::NUMERIC;

    -- Check stock and update atomically
    UPDATE lotes
    SET cantidad_actual = cantidad_actual - v_cantidad
    WHERE id = v_lote_id AND cantidad_actual >= v_cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for lote %', v_lote_id;
    END IF;

    -- Insert Detalle
    INSERT INTO venta_detalle (venta_id, lote_id, cantidad, precio_unitario, descuento, subtotal)
    VALUES (v_venta_id, v_lote_id, v_cantidad, v_precio, v_descuento, v_item_subtotal);

    -- Log Movement
    INSERT INTO movimientos_stock (lote_id, tipo, cantidad, usuario_id, referencia_id)
    VALUES (v_lote_id, 'venta', -v_cantidad, p_vendedor_id, v_venta_id);
  END LOOP;

  -- 4. Create Receivable if credit
  IF p_es_credito THEN
    INSERT INTO cuentas_por_cobrar (venta_id, cliente_id, monto_total, balance_pendiente, fecha_vencimiento)
    VALUES (v_venta_id, p_cliente_id, p_total, p_total, (now() + interval '30 days')::date);
  END IF;

  RETURN v_venta_id;
END;
$$ LANGUAGE plpgsql;
