
import React, { useMemo } from 'react';
import { Product, Sale, Receivable, KPI, User } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  receivables: Receivable[];
  user: User;
  t: any;
  onNewInvoice?: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ products, sales, receivables, user, t, onNewInvoice }) => {
  const currency = user.organization?.config?.currency || 'RD$';

  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.precio_venta_base * p.stock_total), 0);
    const todaySales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalReceivables = receivables.reduce((acc, r) => acc + r.balance_pendiente, 0);
    const lowStockCount = products.filter(p => p.stock_total <= p.stock_minimo).length;

    return { totalInventoryValue, todaySales, totalReceivables, lowStockCount };
  }, [products, sales, receivables]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.categoria || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: products.length > 0 ? Math.round((count / products.length) * 100) : 0,
      color: `hsl(${Math.random() * 360}, 70%, 60%)` 
    }));
  }, [products]);

  const kpis = [
    { label: t.inventoryValue, value: `${currency} ${stats.totalInventoryValue.toLocaleString()}`, trendLabel: 'assets', icon: 'warehouse', color: 'text-primary' },
    { label: t.todayRevenue, value: `${currency} ${stats.todaySales.toLocaleString()}`, trendLabel: 'sales', icon: 'payments', color: 'text-green-600' },
    { label: t.totalReceivables, value: `${currency} ${stats.totalReceivables.toLocaleString()}`, trendLabel: 'pending', icon: 'account_balance_wallet', color: 'text-orange-600' },
    { label: t.lowStock, value: stats.lowStockCount.toString(), trendLabel: 'critical items', icon: 'report_problem', color: stats.lowStockCount > 0 ? 'text-red-600' : 'text-slate-400' },
  ];

  const criticalItems = products.filter(p => p.stock_total <= p.stock_minimo).slice(0, 5);

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.overview}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Operational status updated in real-time.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onNewInvoice}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark shadow-lg transition-all"
          >
            {t.newInvoice}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 ${kpi.color}`}>
                <span className="material-icons">{kpi.icon}</span>
              </div>
            </div>
            <div className="flex items-center text-xs gap-1">
              <span className="text-slate-400 font-medium">{kpi.trendLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold mb-6">Inventory by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryDistribution.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-4">
            {categoryDistribution.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-500">{item.name}</span>
                </div>
                <span className="font-bold dark:text-slate-300">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-icons text-red-500">priority_high</span>
              {t.criticalStock}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.name}</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.sku}</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.stock}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {criticalItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-sm dark:text-slate-200">{p.nombre}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">{p.stock_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
