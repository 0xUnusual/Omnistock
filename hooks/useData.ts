import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Product, Sale, Receivable, Client } from '../types';

export function useData(orgId?: string) {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orgId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [orgId]);

    async function fetchData() {
        if (!orgId) return;
        setLoading(true);
        try {
            const [prodRes, stockRes, saleRes, recRes, clientRes] = await Promise.all([
                supabase.from('productos').select('*').eq('organization_id', orgId),
                supabase.from('stock_total_productos').select('id, stock_total').eq('organization_id', orgId),
                supabase.from('ventas').select('*, items:venta_detalle(*)').eq('organization_id', orgId),
                supabase.from('cuentas_por_cobrar').select('*, cliente:clientes(nombre)').eq('organization_id', orgId),
                supabase.from('clientes').select('*').eq('organization_id', orgId)
            ]);

            if (prodRes.data) {
                const stockMap = new Map(stockRes.data?.map((s: any) => [s.id, s.stock_total]) || []);
                setProducts(prodRes.data.map((p: any) => ({
                    ...p,
                    stock_total: stockMap.get(p.id) || 0
                })));
            }

            if (saleRes.data) {
                setSales(saleRes.data);
            }

            if (recRes.data) {
                setReceivables(recRes.data.map((r: any) => ({
                    ...r,
                    cliente_nombre: r.cliente?.nombre
                })));
            }

            if (clientRes.data) setClients(clientRes.data);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function processSale(saleData: any) {
        if (!orgId) return;
        // Ensure orgId is passed to the RPC if needed, though usually the RPC should handle it via auth.uid()
        const { data, error } = await supabase.rpc('process_sale', { ...saleData, p_organization_id: orgId });
        if (error) throw error;
        await fetchData();
        return data;
    }

    async function addProduct(product: Partial<Product>, initialStock: number = 0, initialCost: number = 0) {
        if (!orgId) return;
        const { data: newProd, error } = await supabase.from('productos').insert({
            sku: product.sku,
            nombre: product.nombre,
            descripcion: product.descripcion,
            categoria: product.categoria,
            unidad_medida: product.unidad_medida,
            precio_venta_base: product.precio_venta_base,
            stock_minimo: product.stock_minimo || 10,
            proveedor: product.proveedor,
            organization_id: orgId
        }).select().single();

        if (error) throw error;

        if (initialStock > 0 && newProd) {
            const { error: lotError } = await supabase.from('lotes').insert({
                producto_id: newProd.id,
                cantidad_inicial: initialStock,
                cantidad_actual: initialStock,
                precio_compra: initialCost,
                fecha_importacion: new Date()
            });

            if (lotError) console.error("Error creating initial lot:", lotError);
        }

        await fetchData();
    }

    async function addClient(client: Partial<Client>) {
        if (!orgId) return;
        const { error } = await supabase.from('clientes').insert({
            nombre: client.nombre,
            identificacion_fiscal: client.identificacion_fiscal,
            tipo: client.tipo,
            descuento_fijo: client.descuento_fijo,
            limite_credito: client.limite_credito,
            dias_credito: client.dias_credito,
            email: client.email,
            telefono: client.telefono,
            organization_id: orgId
        });
        if (error) throw error;
        await fetchData();
    }

    async function registerLot(sku: string, qty: number, cost: number) {
        if (!orgId) return;
        const product = products.find(p => p.sku === sku);
        if (!product) throw new Error('Product not found');

        const { error } = await supabase.from('lotes').insert({
            producto_id: product.id,
            cantidad_inicial: qty,
            cantidad_actual: qty,
            precio_compra: cost,
            fecha_importacion: new Date()
        });
        if (error) throw error;
        await fetchData();
    }

    async function registerPayment(receivableId: string, amount: number) {
        if (!orgId) return;
        const { error: payError } = await supabase.from('pagos').insert({
            cuenta_id: receivableId,
            monto: amount,
            metodo_pago: 'efectivo'
        });
        if (payError) throw payError;

        const receivable = receivables.find(r => r.id === receivableId);
        if (receivable) {
            const newBalance = receivable.balance_pendiente - amount;
            const newStatus = newBalance <= 0 ? 'pagado' : receivable.estado;

            const { error: updateError } = await supabase.from('cuentas_por_cobrar')
                .update({
                    balance_pendiente: newBalance,
                    monto_pagado: (receivable.monto_pagado || 0) + amount,
                    estado: newStatus
                })
                .eq('id', receivableId);

            if (updateError) throw updateError;
        }
        await fetchData();
    }

    async function updateProduct(id: string, updates: Partial<Product>) {
        if (!orgId) return;
        const { error } = await supabase.from('productos').update({
            sku: updates.sku,
            nombre: updates.nombre,
            descripcion: updates.descripcion,
            categoria: updates.categoria,
            unidad_medida: updates.unidad_medida,
            precio_venta_base: updates.precio_venta_base,
            stock_minimo: updates.stock_minimo,
            proveedor: updates.proveedor
        }).eq('id', id).eq('organization_id', orgId);

        if (error) throw error;
        await fetchData();
    }

    async function updateOrganization(updates: any) {
        if (!orgId) {
            throw new Error('No orgId found in hook state');
        }
        
        console.log("Updating organization:", orgId, updates);

        const { data, error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', orgId)
            .select();

        if (error) {
            console.error("Update error:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn("No rows updated for orgId:", orgId);
            throw new Error('No se pudo encontrar la organización para actualizar. Verifica el ID en la base de datos.');
        }

        console.log("Update success:", data);
        return data;
    }

    async function uploadLogo(file: File) {
        if (!orgId) return;
        const fileExt = file.name.split('.').pop();
        const fileName = `${orgId}-logo.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    return {
        products, sales, receivables, clients, loading,
        processSale, addProduct, updateProduct, addClient, registerLot, registerPayment,
        updateOrganization, uploadLogo,
        refresh: fetchData
    };
}
