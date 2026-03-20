
import React from 'react';
import { Sale, User, Client } from '../types';

interface InvoiceReceiptProps {
  sale: Sale;
  user: User;
  client?: Client | null;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
  t: any;
}

const InvoiceReceipt: React.FC<InvoiceReceiptProps> = ({ 
  sale, user, client, onClose, onConfirm, showConfirmButton = false, t 
}) => {
  const orgConfig = user.organization?.config;
  const currency = orgConfig?.currency || 'RD$';
  const taxName = orgConfig?.tax_name || 'ITBIS';

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 print:hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden animate-scaleIn">
        <div id="invoice-print-area" className="p-8 bg-white text-slate-900">
          <div className="text-center space-y-4 pb-6 border-b-2 border-slate-100 border-dashed">
            <div className="h-16 flex items-center justify-center">
              {orgConfig?.logo_url ? 
                <img src={orgConfig.logo_url} alt="Logo" className="h-full object-contain" /> : 
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white"><span className="material-icons text-2xl">inventory_2</span></div>
              }
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">{user.organization?.nombre || 'OMNISTOCK'}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Comprobante de Pago</p>
            </div>
          </div>

          <div className="py-6 space-y-4">
            <div className="flex justify-between text-[10px] font-medium text-slate-500">
              <div className="space-y-1">
                <p><span className="text-slate-400 uppercase mr-1">Fecha:</span> {new Date(sale.fecha).toLocaleDateString()}</p>
                <p><span className="text-slate-400 uppercase mr-1">Hora:</span> {new Date(sale.fecha).toLocaleTimeString()}</p>
              </div>
              <div className="text-right space-y-1">
                <p><span className="text-slate-400 uppercase mr-1">Factura:</span> <span className="text-slate-900 font-bold">#{sale.id}</span></p>
                <p><span className="text-slate-400 uppercase mr-1">Metodo:</span> <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 font-bold">{sale.es_credito ? 'CRÉDITO' : 'CONTADO'}</span></p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cliente</p>
              <p className="text-xs font-bold text-slate-800">{client?.nombre || 'Consumidor Final'}</p>
              {client?.identificacion_fiscal && <p className="text-[10px] text-slate-500 mt-0.5">ID: {client.identificacion_fiscal}</p>}
            </div>

            <div className="space-y-3">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left py-2 font-bold uppercase">Item</th>
                    <th className="text-center py-2 font-bold uppercase">Cant</th>
                    <th className="text-right py-2 font-bold uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sale.items.map((item: any, idx: number) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2.5 font-medium">{item.nombre || item.producto_nombre || 'Producto'}</td>
                      <td className="text-center py-2.5 font-bold italic">{item.cantidad}</td>
                      <td className="text-right py-2.5 font-bold">{currency} {item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 space-y-2 border-t border-slate-100">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>{currency} {sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.descuento_global && sale.descuento_global > 0 && (
                <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                  <span>Descuento Especial</span>
                  <span>-{currency} {sale.descuento_global.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>{taxName} ({orgConfig?.tax_rate || 18}%)</span>
                <span>{currency} {sale.impuestos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-4">
                <span className="text-xs font-black uppercase text-slate-400">Total a Pagar</span>
                <span className="text-2xl font-black text-primary">{currency} {sale.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center pt-8">
              <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Gracias por su compra</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {showConfirmButton ? 'Cancelar' : 'Cerrar'}
          </button>
          <div className="flex gap-2 flex-[2]">
            <button 
              onClick={() => window.print()}
              className="flex-1 py-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-700 dark:text-white flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm"
            >
              <span className="material-icons text-lg">print</span>
              {t.print || 'Imprimir'}
            </button>
            {showConfirmButton && onConfirm && (
              <button 
                onClick={onConfirm}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
              >
                Confirmar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReceipt;
