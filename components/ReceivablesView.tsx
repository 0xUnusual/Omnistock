
import React, { useState } from 'react';
import { Receivable, User } from '../types';

interface ReceivablesViewProps {
  receivables: Receivable[];
  onRegisterPayment: (id: string, amount: number) => Promise<void>;
  user: User;
  t: any;
}

const ReceivablesView: React.FC<ReceivablesViewProps> = ({ receivables, onRegisterPayment, user, t }) => {
  const currency = user.organization?.config?.currency || 'RD$';
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [activeClient, setActiveClient] = useState<Receivable | null>(null);

  const handlePay = (r: Receivable) => {
    setActiveClient(r);
    setPaymentAmount(r.balance_pendiente.toString());
  };

  const confirmPayment = async () => {
    if (activeClient && paymentAmount) {
      await onRegisterPayment(activeClient.id, parseFloat(paymentAmount));
      setActiveClient(null); 
      setPaymentAmount('');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.receivables}</h1>
          <p className="text-slate-500 text-sm mt-1">Manage credit balances and collection status.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t.client}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">{t.balance}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">{t.status}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {receivables.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{row.cliente_nombre || row.cliente_id}</div>
                    <div className="text-xs text-slate-400">Inv: {row.venta_id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{currency} {row.monto_total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-bold ${row.balance_pendiente > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                      {currency} {row.balance_pendiente.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${row.estado === 'vencido' ? 'bg-red-50 text-red-600 border-red-200' :
                      row.estado === 'pagado' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                      }`}>
                      {row.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.balance_pendiente > 0 && (
                      <button
                        onClick={() => handlePay(row)}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all"
                      >
                        {t.pay}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-scaleUp">
            <h3 className="text-xl font-bold mb-2">{t.registerPayment}</h3>
            <p className="text-sm text-slate-500 mb-6">Enter payment for <strong>{activeClient.cliente_nombre || activeClient.cliente_id}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setActiveClient(null)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600">Cancel</button>
                <button onClick={confirmPayment} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivablesView;
