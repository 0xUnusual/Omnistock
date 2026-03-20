
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  CLIENTS = 'CLIENTS',
  RECEIVABLES = 'RECEIVABLES',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export type UserRole = 'admin';
export type Language = 'en' | 'es';
export type Theme = 'light' | 'dark';

export interface Organization {
  id: string;
  nombre: string;
  slug: string;
  config?: {
    currency: string;
    tax_name: string;
    tax_rate: number;
    logo_url?: string;
    invoice_prefix?: string; // Custom invoice prefix (e.g., 'INV-', 'B01-')
    theme_color?: string;
  };
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  organization_id: string; // Required for SaaS
  organization?: Organization; // Loaded in useAuth
  avatar?: string;
}

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  unidad_medida?: string;
  precio_venta_base: number;
  stock_total: number;
  stock_minimo: number;
  proveedor?: string;
  image_url?: string;
  atributos_extra?: Record<string, any>;
  organization_id: string;
  // Legacy support/helper
  marca?: string; 
  modelo?: string;
}

export interface Sale {
  id: string;
  fecha: string;
  items: CartItem[];
  subtotal: number;
  impuestos: number; // Renamed from ITBIS
  total: number;
  cliente_id?: string;
  vendedor_id?: string;
  estado: 'activa' | 'anulada';
  comprobante?: string; // Generic name for NCF
  es_credito?: boolean;
  descuento_global?: number;
  organization_id: string;
}

export interface CartItem extends Product {
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

export interface KPI {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: string;
  color: string;
  subText?: string;
  progress?: number;
}

export interface Receivable {
  id: string;
  venta_id: string;
  cliente_id: string;
  cliente_nombre?: string;
  monto_total: number;
  monto_pagado: number;
  balance_pendiente: number;
  fecha_vencimiento: string;
  estado: 'pendiente' | 'pagado' | 'vencido';
  organization_id: string;
}

export interface Client {
  id: string;
  nombre: string;
  tipo: string; // 'normal' | 'mayorista' or custom
  descuento_fijo: number;
  limite_credito: number;
  dias_credito: number;
  identificacion_fiscal?: string; // Generic for RNC/Cedula
  email?: string;
  telefono?: string;
  organization_id: string;
}
