
import React, { useMemo, useState } from 'react';
import { Product, Sale, Receivable, Client, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import InvoiceReceipt from './InvoiceReceipt';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
  receivables?: Receivable[];
  clients: Client[];
  user: User;
  t: any;
}

const ReportsView: React.FC<ReportsViewProps> = ({ sales, products, receivables = [], clients, user, t }) => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleExport = (type: 'sales' | 'inventory' | 'receivables') => {
    // ... existed logic ...
    let data: any[] = [];
    let filename = '';

    if (type === 'sales') {
      data = sales;
      filename = `sales_report_${Date.now()}.csv`;
    } else if (type === 'inventory') {
      data = products;
      filename = `inventory_report_${Date.now()}.csv`;
    } else {
      data = receivables;
      filename = `receivables_report_${Date.now()}.csv`;
    }

    if (!data.length) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row =>
      Object.values(row).map(v =>
        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(",")
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salesData = useMemo(() => {
    const grouped = sales.reduce((acc, sale) => {
      const date = new Date(sale.fecha).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  }, [sales]);

  const categoryValueData = useMemo(() => {
    const grouped = products.reduce((acc, p) => {
      const cat = p.categoria || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + (p.stock_total * (p.precio_venta_base || 0));
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([category, value]) => ({ category, value }));
  }, [products]);

  const currency = user.organization?.config?.currency || 'RD$';

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.reports}</h1>
          <p className="mt-1 text-sm text-slate-500">Advanced reports and operational analytics.</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => handleExport('sales')}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
          >
            Export Sales
          </button>
          <button
            onClick={() => handleExport('inventory')}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
          >
            Export Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden min-h-[350px]">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <span className="material-icons text-primary">analytics</span>
            Daily Sales Trend
          </h3>
          <div className="h-64 w-full">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No sales data available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden min-h-[350px]">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <span className="material-icons text-primary">bar_chart</span>
            Inventory Value by Category
          </h3>
          <div className="h-64 w-full">
            {categoryValueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryValueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No inventory data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold">Recent Sales Log</h3>
          <span className="text-xs text-slate-400 font-medium">Last 50 transactions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-left">
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">ID</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Date</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Total</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Type</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.slice(0, 50).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">#{sale.id}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(sale.fecha).toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-primary">{currency} {sale.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sale.es_credito ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {sale.es_credito ? 'CREDIT' : 'CASH'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-lg transition-all text-xs font-bold"
                    >
                      <span className="material-icons text-sm">receipt</span>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <InvoiceReceipt 
          sale={selectedSale}
          user={user}
          client={clients.find(c => c.id === selectedSale.cliente_id)}
          onClose={() => setSelectedSale(null)}
          t={t}
        />
      )}
    </div>
  );
};

export default ReportsView;
