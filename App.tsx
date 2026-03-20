
import React, { useState, useEffect } from 'react';
import { AppView, Language, Theme, Sale, Product, Client } from './types';
import { translations } from './translations';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PosTerminalView from './components/PosTerminalView';
import InventoryView from './components/InventoryView';
import ReceivablesView from './components/ReceivablesView';
import LoginView from './components/LoginView';
import ClientsView from './components/ClientsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut, refresh: refreshAuth } = useAuth();
  const {
    products, sales, receivables, clients, loading: dataLoading,
    processSale, refresh, addProduct, updateProduct, addClient, registerLot, registerPayment,
    updateOrganization, uploadLogo
  } = useData(user?.organization_id);

  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [selectedClientForInterface, setSelectedClientForInterface] = useState<Client | null>(null);
  const [posSearchTerm, setPosSearchTerm] = useState('');

  const t = translations[lang];

  // Reset POS search when leaving the view
  useEffect(() => {
    if (activeView !== AppView.SALES) {
      setPosSearchTerm('');
    }
  }, [activeView]);

  useEffect(() => {
    const savedLang = localStorage.getItem('im_app_lang') as Language;
    if (savedLang) setLang(savedLang);

    const savedTheme = localStorage.getItem('im_app_theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('im_app_theme', newTheme);
  };

  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('im_app_lang', l);
  };

  const handleLogout = () => {
    signOut();
  };

  const handleProcessSale = async (sale: Sale) => {
    if (!user) return;
    try {
      const clientId = sale.cliente_id || clients[0]?.id;

      if (!clientId) {
        throw new Error('Debe seleccionar un cliente para procesar la venta.');
      }

      // Map items to include valid Lote IDs
      const mappedItems = await Promise.all(sale.items.map(async (item) => {
        // Find oldest lote with available stock for this product
        const { data: lotes, error } = await supabase
          .from('lotes')
          .select('id, cantidad_actual')
          .eq('producto_id', item.id)
          .gt('cantidad_actual', 0)
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) throw error;
        if (!lotes || lotes.length === 0) throw new Error(`Stock insuficiente para ${item.nombre || item.sku}`);

        return {
          lote_id: lotes[0].id,
          cantidad: item.cantidad,
          precio: item.precio_unitario,
          descuento: item.descuento || 0,
          subtotal: item.subtotal
        };
      }));

      // Use custom prefix or default B02
      const prefix = user.organization?.config?.invoice_prefix || 'B02';
      const ncf = `${prefix}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

      const rpcArgs = {
        p_cliente_id: clientId,
        p_vendedor_id: user.id || user.id, // Ensure it exists
        p_subtotal: sale.subtotal,
        p_impuestos: sale.impuestos,
        p_total: sale.total,
        p_tipo_ncf: prefix,
        p_comprobante: ncf,
        p_items: mappedItems,
        p_es_credito: sale.es_credito || false
      };

      console.log('Final RPC Args:', rpcArgs);
      await processSale(rpcArgs);
      alert(`${t.sales} ${sale.id} processed successfully!`);
      refresh();

    } catch (e: any) {
      console.error(e);
      alert(`Error processing sale: ${e.message}`);
    }
  };

  const handleRegisterPayment = async (id: string, amount: number) => {
    try {
      await registerPayment(id, amount);
      alert('Pago registrado correctamente');
    } catch (e: any) {
      alert('Error registrando pago: ' + e.message);
    }
  };

  const handleAddProduct = async (prod: any, initialStock?: number, initialCost?: number) => {
    try {
      await addProduct(prod, initialStock, initialCost);
      alert('Producto agregado');
    } catch (e: any) { alert(e.message); }
  };

  const handleRegisterLot = async (sku: string, qty: number, cost: number) => {
    try {
      await registerLot(sku, qty, cost);
      alert('Lote registrado');
    } catch (e: any) { alert(e.message); }
  };

  const handleAddClient = async (client: any) => {
    try {
      await addClient(client);
      alert('Cliente agregado');
    } catch (e: any) { alert(e.message); }
  };

  const handleNewSale = (client: Client) => {
    setSelectedClientForInterface(client);
    setActiveView(AppView.SALES);
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <LoginView onLogin={() => { }} />;

  const renderView = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return (
          <DashboardView
            products={products}
            sales={sales}
            receivables={receivables} 
            user={user}
            t={t}
            onNewInvoice={() => setActiveView(AppView.SALES)}
          />
        );
      case AppView.SALES:
        return (
          <PosTerminalView
            products={products}
            clients={clients}
            user={user}
            initialClient={selectedClientForInterface}
            key={selectedClientForInterface ? `pos-${selectedClientForInterface.id}` : 'pos-default'}
            onProcessSale={handleProcessSale}
            t={t}
            initialSearchTerm={posSearchTerm}
          />
        );
      case AppView.INVENTORY:
        return (
          <InventoryView
            products={products}
            setProducts={() => { }} // Legacy
            user={user}
            onAddProduct={handleAddProduct}
            onUpdateProduct={async (id, updates) => {
              try {
                await updateProduct(id, updates);
                alert('Updated successfully');
              } catch (e: any) { alert(e.message); }
            }}
            onRegisterLot={handleRegisterLot}
            t={t}
          />
        );
      case AppView.RECEIVABLES:
        return <ReceivablesView receivables={receivables} onRegisterPayment={handleRegisterPayment} user={user} t={t} />;
      case AppView.CLIENTS:
        return (
          <ClientsView
            clients={clients}
            setClients={() => { }}
            onAddClient={handleAddClient}
            onNewSale={handleNewSale}
            sales={sales}
            receivables={receivables}
            t={t}
          />
        );
      case AppView.REPORTS:
        return <ReportsView sales={sales} products={products} receivables={receivables} clients={clients} user={user} t={t} />;
      case AppView.SETTINGS:
        return (
          <SettingsView 
            user={user} 
            onUpdateOrganization={updateOrganization} 
            onRefreshAuth={refreshAuth} 
            onUploadLogo={uploadLogo}
            t={t} 
          />
        );
      default:
        return <DashboardView products={products} sales={sales} receivables={receivables} user={user} t={t} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} bg-background-light dark:bg-background-dark`}>
      <Sidebar
        activeView={activeView}
        onViewChange={(v) => { setActiveView(v); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        user={user}
        t={t}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          user={user}
          onLogout={handleLogout}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          theme={theme}
          toggleTheme={toggleTheme}
          lang={lang}
          changeLang={changeLang}
          products={products}
          onProductSelect={(product) => {
            setPosSearchTerm(product.sku); // Use SKU for precise filtering
            setActiveView(AppView.SALES); // Assuming AppView.SALES is the POS view
          }}
          onSettingsClick={() => setActiveView(AppView.SETTINGS)}
        />
        <main className="flex-1 overflow-y-auto custom-scroll relative bg-slate-50 dark:bg-slate-900/40">
          {dataLoading ? <div className="p-8">Loading data...</div> : renderView()}
        </main>

        {/* Mobile Overlay */}
        {isSidebarOpen && window.innerWidth < 1024 && (
          <div
            className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
