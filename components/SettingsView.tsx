
import React, { useState, useRef } from 'react';
import { User, Organization } from '../types';

interface SettingsViewProps {
  user: User;
  onUpdateOrganization: (updates: any) => Promise<any>;
  onRefreshAuth: () => void;
  onUploadLogo: (file: File) => Promise<string>;
  t: any;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateOrganization, onRefreshAuth, onUploadLogo, t }) => {
  const [nombre, setNombre] = useState(user.organization?.nombre || '');
  const [logoUrl, setLogoUrl] = useState(user.organization?.config?.logo_url || '');
  const [currency, setCurrency] = useState(user.organization?.config?.currency || 'DOP');
  const [taxName, setTaxName] = useState(user.organization?.config?.tax_name || 'ITBIS');
  const [taxRate, setTaxRate] = useState(user.organization?.config?.tax_rate || 18);
  const [invoicePrefix, setInvoicePrefix] = useState(user.organization?.config?.invoice_prefix || 'INV-');
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const publicUrl = await onUploadLogo(file);
      setLogoUrl(publicUrl);
      setMessage({ type: 'success', text: 'Logo cargado temporalmente. Guarda los cambios para aplicar.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al cargar archivo: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onUpdateOrganization({
        nombre,
        config: {
          ...user.organization?.config,
          logo_url: logoUrl,
          currency,
          tax_name: taxName,
          tax_rate: Number(taxRate),
          invoice_prefix: invoicePrefix
        }
      });
      setMessage({ type: 'success', text: 'Configuración actualizada correctamente' });
      onRefreshAuth();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-icons">settings</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t.settings}</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los parámetros globales de tu negocio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Section */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-icons text-primary/60">business</span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Información del Negocio</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{t.businessName}</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{t.logoUrl}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                  className="flex-1 px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center shrink-0"
                >
                  <span className="material-icons text-xl">{uploading ? 'sync' : 'upload_file'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
             <div className="h-24 w-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               {logoUrl ? (
                 <img src={logoUrl} alt="Preview" className="h-full w-full object-contain p-2" />
               ) : (
                 <span className="material-icons text-slate-300 text-4xl">image</span>
               )}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Previsualización del Logo</p>
               <p className="text-xs text-slate-500 mt-1 max-w-sm">Este logo aparecerá en el sidebar y en tus facturas impresas. Puedes pegar una URL o cargar un archivo desde tu equipo.</p>
             </div>
          </div>
        </section>

        {/* Financial Section */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-icons text-secondary/60">payments</span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Finanzas y Facturación</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{t.currency}</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
                >
                  <option value="DOP">DOP - Peso Dominicano</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="COP">COP - Peso Colombiano</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{t.invoicePrefix}</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="B01, INV-, etc."
                  className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-primary transition-all outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{t.taxName}</label>
                <input
                  type="text"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="ITBIS, IVA, VAT..."
                  className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{t.taxRate}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
          }`}>
            <span className="material-icons">{message.type === 'success' ? 'check_circle' : 'error'}</span>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-10 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center gap-2"
          >
            {(saving || uploading) && <span className="material-icons animate-spin text-sm">sync</span>}
            {t.saveSettings}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
