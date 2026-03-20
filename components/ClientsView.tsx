import React, { useState } from 'react';
import { Client, Sale, Receivable } from '../types';

interface ClientsViewProps {
  clients: Client[];
  sales?: Sale[];
  receivables?: Receivable[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  t: any;
  onAddClient?: (client: Partial<Client>) => Promise<void>;
  onNewSale?: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, sales, receivables, setClients, t, onAddClient, onNewSale }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    nombre: '', 
    identificacion_fiscal: '', 
    email: '',
    telefono: '',
    tipo: 'normal', 
    descuento_fijo: 0, 
    limite_credito: 0, 
    dias_credito: 30
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddClient) {
      await onAddClient(newClient);
      setShowAdd(false);
      setNewClient({ 
        nombre: '', 
        identificacion_fiscal: '', 
        email: '',
        telefono: '',
        tipo: 'normal', 
        descuento_fijo: 0, 
        limite_credito: 0, 
        dias_credito: 30 
      });
    }
  };

  const clientSales = selectedClient && sales ? sales.filter(s => s.cliente_id === selectedClient.id) : [];
  const clientReceivables = selectedClient && receivables ? receivables.filter(r => r.cliente_id === selectedClient.id) : [];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.clients}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage business profiles and credit statuses.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg hover:bg-primary-dark transition-all"
        >
          {t.newClient}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {(client.nombre || '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate dark:text-white">{client.nombre}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{client.email || 'No Email'}</p>
              </div>
            </div>
            <div className="space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ID</span>
                <span className="font-mono font-bold dark:text-slate-300">{client.identificacion_fiscal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${client.tipo === 'mayorista' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                  {client.tipo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Limit</span>
                <span className="font-mono font-bold dark:text-slate-300">RD$ {client.limite_credito.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClient(client)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Details
              </button>
              <button
                onClick={() => onNewSale && onNewSale(client)}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary-dark transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{t.newClient}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Client Name</label>
                <input required className="w-full dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-lg text-sm" value={newClient.nombre} onChange={e => setNewClient({ ...newClient, nombre: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tax ID / Identification</label>
                <input className="w-full dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-lg text-sm" value={newClient.identificacion_fiscal} onChange={e => setNewClient({ ...newClient, identificacion_fiscal: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                  <input type="email" className="w-full dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-lg text-sm" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                  <input type="tel" className="w-full dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-lg text-sm" value={newClient.telefono} onChange={e => setNewClient({ ...newClient, telefono: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Discount (%)</label>
                  <input type="number" className="w-full dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-lg text-sm" value={newClient.descuento_fijo} onChange={e => setNewClient({ ...newClient, descuento_fijo: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
                  <select className="w-full dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-lg text-sm" value={newClient.tipo} onChange={e => setNewClient({ ...newClient, tipo: e.target.value as any })}>
                    <option value="normal">Normal</option>
                    <option value="mayorista">Mayorista</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold dark:text-white">{selectedClient.nombre}</h3>
                <p className="text-slate-500 text-sm">{selectedClient.identificacion_fiscal || 'No Tax ID'}</p>
                <p className="text-slate-400 text-xs mt-1">{selectedClient.email} • {selectedClient.telefono}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center dark:text-white">
                <span className="material-icons text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Credit Limit</p>
                <p className="font-mono font-bold text-lg dark:text-slate-200">RD$ {selectedClient.limite_credito.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Pending Balance</p>
                <p className="font-mono font-bold text-lg text-red-500">
                  RD$ {clientReceivables.reduce((acc, r) => acc + r.balance_pendiente, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Total Purchases</p>
                <p className="font-mono font-bold text-lg text-green-600">
                  {clientSales.length}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-sm mb-4 uppercase text-slate-400">Recent Transactions</h4>
            <div className="space-y-3">
              {clientSales.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No sales history found.</p>
              ) : (
                clientSales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <div>
                      <p className="font-bold text-sm dark:text-slate-200">Invoice #{sale.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-400">{new Date(sale.fecha).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm dark:text-slate-200">RD$ {sale.total.toLocaleString()}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${sale.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {sale.estado}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setSelectedClient(null)} className="px-6 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm dark:text-slate-200">Close</button>
              <button
                onClick={() => {
                  if (onNewSale) onNewSale(selectedClient);
                }}
                className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
