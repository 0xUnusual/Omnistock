-- Enable INSERT access for authenticated users on 'clientes'
CREATE POLICY "Enable insert for authenticated users" ON "public"."clientes"
AS PERMISSIVE FOR INSERT
TO "authenticated"
WITH CHECK (true);

-- Enable UPDATE access for authenticated users on 'clientes'
CREATE POLICY "Enable update for authenticated users" ON "public"."clientes"
AS PERMISSIVE FOR UPDATE
TO "authenticated"
USING (true)
WITH CHECK (true);

-- Enable DELETE access for authenticated users on 'clientes'
CREATE POLICY "Enable delete for authenticated users" ON "public"."clientes"
AS PERMISSIVE FOR DELETE
TO "authenticated"
USING (true);

-- Enable READ access for authenticated users on 'clientes' (if not already exists)
-- Note: There was already a SELECT policy, so we don't strictly need this if generic read is enough,
-- but having explicit policies is good practice.

-- ... We should also enable policies for other tables to prevent similar errors ...

-- PRODUCTOS
CREATE POLICY "Enable insert for authenticated users" ON "public"."productos" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "public"."productos" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON "public"."productos" FOR DELETE TO "authenticated" USING (true);

-- LOTES
CREATE POLICY "Enable insert for authenticated users" ON "public"."lotes" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "public"."lotes" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON "public"."lotes" FOR DELETE TO "authenticated" USING (true);

-- VENTAS
CREATE POLICY "Enable insert for authenticated users" ON "public"."ventas" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "public"."ventas" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

-- VENTA_DETALLE
CREATE POLICY "Enable select for authenticated users" ON "public"."venta_detalle" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."venta_detalle" FOR INSERT TO "authenticated" WITH CHECK (true);

-- MOVIMIENTOS_STOCK
CREATE POLICY "Enable select for authenticated users" ON "public"."movimientos_stock" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."movimientos_stock" FOR INSERT TO "authenticated" WITH CHECK (true);

-- CUENTAS_POR_COBRAR
CREATE POLICY "Enable select for authenticated users" ON "public"."cuentas_por_cobrar" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."cuentas_por_cobrar" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON "public"."cuentas_por_cobrar" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);

-- PAGOS
CREATE POLICY "Enable select for authenticated users" ON "public"."pagos" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."pagos" FOR INSERT TO "authenticated" WITH CHECK (true);
