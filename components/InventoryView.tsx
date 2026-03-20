
import React, { useState, useMemo } from 'react';
import { Product, User } from '../types';

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  user: User;
  t: any;
  onAddProduct?: (product: Partial<Product>, initialStock?: number, initialCost?: number) => Promise<void>;
  onUpdateProduct?: (id: string, updates: Partial<Product>) => Promise<void>;
  onRegisterLot?: (sku: string, qty: number, cost: number) => Promise<void>;
}

const InventoryView: React.FC<InventoryViewProps> = ({ products, user, t, onAddProduct, onUpdateProduct, onRegisterLot }) => {
  const currency = user.organization?.config?.currency || 'RD$';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddLot, setShowAddLot] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    sku: '', nombre: '', descripcion: '', categoria: '', unidad_medida: 'unidades', precio_venta_base: 0, stock_minimo: 10, proveedor: ''
  });

  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editStockQty, setEditStockQty] = useState(0);
  const [editStockCost, setEditStockCost] = useState(0);

  const [lotSku, setLotSku] = useState('');
  const [lotQty, setLotQty] = useState(1);
  const [lotCost, setLotCost] = useState(0);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.categoria || 'General'))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || p.categoria === categoryFilter;
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Low Stock' && (p.stock_total || 0) > 0 && (p.stock_total || 0) <= (p.stock_minimo || 0)) ||
        (statusFilter === 'Out of Stock' && (p.stock_total || 0) === 0) ||
        (statusFilter === 'Healthy' && (p.stock_total || 0) > (p.stock_minimo || 0));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddProduct) {
      await onAddProduct(newProduct, lotQty, lotCost);
      setShowAddProduct(false);
      setNewProduct({ sku: '', nombre: '', descripcion: '', categoria: '', unidad_medida: 'unidades', precio_venta_base: 0, stock_minimo: 10, proveedor: '' });
      setLotQty(0);
      setLotCost(0);
    }
  };

  const handleRegisterLotSubmit = async () => {
    if (onRegisterLot) {
      await onRegisterLot(lotSku, lotQty, lotCost);
      setShowAddLot(false);
      setLotQty(1);
      setLotCost(0);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct && editingProduct.id) {
      if (onUpdateProduct) {
        await onUpdateProduct(editingProduct.id, editingProduct);
      }
      if (onRegisterLot && editStockQty > 0 && editingProduct.sku) {
        await onRegisterLot(editingProduct.sku, editStockQty, editStockCost);
      }
      setShowEditProduct(false);
      setEditingProduct(null);
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct({ ...product });
    setEditStockQty(0);
    setEditStockCost(0);
    setShowEditProduct(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.inventory}</h1>
          <p className="mt-1 text-sm text-slate-500">Universal stock tracking for your business.</p>
        </div>

        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => { setShowAddLot(true); setLotSku(products[0]?.sku || ''); }}
            className="px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-all"
          >
            {t.registerLot}
          </button>
          <button
            onClick={() => setShowAddProduct(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark shadow-md transition-all"
          >
            {t.addProduct}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">{t.search}</label>
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="SKU, Name, Description..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">{t.category}</label>
            <select
              className="w-full py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">{t.status}</label>
            <select
              className="w-full py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Healthy">Healthy Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{t.name}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{t.sku}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">{t.stock}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-right">{t.price}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{p.nombre}</div>
                    <div className="text-xs text-slate-500">{p.descripcion} • {p.categoria}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.stock_total === 0 ? 'bg-red-100 text-red-700' :
                      p.stock_total <= p.stock_minimo ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {p.stock_total} {p.unidad_medida}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold">{currency} {(p.precio_venta_base || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(p); }}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                      title="Edit Product"
                    >
                      <span className="material-icons text-lg">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
            <h3 className="text-xl font-bold mb-6">{t.addProduct}</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-primary border-b border-primary/20 pb-2 uppercase tracking-wider">Product Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                    <input required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" placeholder="e.g. Acme Widget 500" value={newProduct.nombre} onChange={e => setNewProduct({ ...newProduct, nombre: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <textarea className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" placeholder="Detailed product description..." value={newProduct.descripcion} onChange={e => setNewProduct({ ...newProduct, descripcion: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SKU (Unique ID)</label>
                    <input required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5 font-mono" placeholder="e.g. AC-WID-001" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                    <input required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" placeholder="e.g. Tools" value={newProduct.categoria} onChange={e => setNewProduct({ ...newProduct, categoria: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Unit of Measure</label>
                    <select className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={newProduct.unidad_medida} onChange={e => setNewProduct({ ...newProduct, unidad_medida: e.target.value })}>
                      <option value="unidades">Units (unid)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="litros">Liters (L)</option>
                      <option value="metros">Meters (m)</option>
                      <option value="cajas">Boxes (bx)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier</label>
                    <input className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" placeholder="Optional" value={newProduct.proveedor || ''} onChange={e => setNewProduct({ ...newProduct, proveedor: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-primary border-b border-primary/20 pb-2 uppercase tracking-wider">Inventory & Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Selling Price (Base)</label>
                    <input type="number" step="0.01" required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={newProduct.precio_venta_base} onChange={e => setNewProduct({ ...newProduct, precio_venta_base: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Minimum Stock Level</label>
                    <input type="number" required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={newProduct.stock_minimo} onChange={e => setNewProduct({ ...newProduct, stock_minimo: parseInt(e.target.value) })} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-bold mb-3 text-slate-500 uppercase">Initial Stock Movement</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Quantity</label>
                      <input type="number" className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={lotQty} onChange={e => setLotQty(parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Purchase Cost (Unit)</label>
                      <input type="number" step="0.01" className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={lotCost} onChange={e => setLotCost(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
            <h3 className="text-xl font-bold mb-6">Edit Product</h3>
            <form onSubmit={handleEditProductSubmit} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-primary border-b border-primary/20 pb-2 uppercase tracking-wider">Product Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                    <input required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={editingProduct.nombre} onChange={e => setEditingProduct({ ...editingProduct, nombre: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <textarea className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={editingProduct.descripcion} onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                    <input required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={editingProduct.categoria} onChange={e => setEditingProduct({ ...editingProduct, categoria: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                    <input required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={editingProduct.unidad_medida} onChange={e => setEditingProduct({ ...editingProduct, unidad_medida: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-primary border-b border-primary/20 pb-2 uppercase tracking-wider">Pricing & Alerts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Selling Price</label>
                    <input type="number" step="0.01" required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={editingProduct.precio_venta_base} onChange={e => setEditingProduct({ ...editingProduct, precio_venta_base: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Low Stock Alert</label>
                    <input type="number" required className="w-full border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg p-2.5" value={editingProduct.stock_minimo} onChange={e => setEditingProduct({ ...editingProduct, stock_minimo: parseInt(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowEditProduct(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Lot Modal (Stock entry) */}
      {showAddLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-sm p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{t.registerLot}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Product SKU</label>
                <select
                  className="w-full dark:bg-slate-800 dark:border-slate-700 rounded-lg"
                  value={lotSku}
                  onChange={(e) => setLotSku(e.target.value)}
                >
                  {products.map(p => <option key={p.id} value={p.sku}>{p.sku} - {p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity To Add</label>
                <input type="number" value={lotQty} onChange={(e) => setLotQty(parseInt(e.target.value))} className="w-full dark:bg-slate-800 dark:border-slate-700 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cost Per Unit</label>
                <input type="number" step="0.01" value={lotCost} onChange={(e) => setLotCost(parseFloat(e.target.value))} className="w-full dark:bg-slate-800 dark:border-slate-700 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddLot(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">Cancel</button>
                <button type="button" onClick={handleRegisterLotSubmit} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Add Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
