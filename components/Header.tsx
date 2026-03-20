
import React, { useState, useMemo } from 'react';
import { User, Language, Theme, Product } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
  lang: Language;
  changeLang: (l: Language) => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, toggleSidebar, theme, toggleTheme, lang, changeLang, products, onProductSelect, onSettingsClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term) ||
      (p.descripcion || '').toLowerCase().includes(term) ||
      (p.categoria || '').toLowerCase().includes(term)
    ).slice(0, 10);
  }, [products, searchTerm]);

  return (
    <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 z-20 shrink-0 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
        >
          <span className="material-icons">menu</span>
        </button>

        <div className="hidden md:flex flex-1 max-w-lg relative z-50">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">search</span>
          <input
            type="text"
            placeholder="Search products, category, SKU..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-700 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowResults(true)}
          />

          {/* Search Results Dropdown */}
          {showResults && searchTerm && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)}></div>
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-96 overflow-y-auto custom-scroll z-50">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        onProductSelect(product);
                        setShowResults(false);
                        setSearchTerm('');
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800/50 last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-icons text-slate-400 text-lg">inventory_2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{product.nombre}</h4>
                          <span className="text-xs font-bold text-primary whitespace-nowrap ml-2">RD$ {(product.precio_venta_base || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{product.sku} • {product.categoria}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${product.stock_total > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {product.stock_total} DISP
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No products found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Language Switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => changeLang('en')}
            className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
          >EN</button>
          <button
            onClick={() => changeLang('es')}
            className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'es' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
          >ES</button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center"
        >
          <span className="material-icons text-lg">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
        </button>

        <button className="hidden sm:flex p-2 text-slate-400 hover:text-primary relative rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-icons">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 group p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <div className="text-right hidden sm:block px-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{user.nombre}</p>
              <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider leading-none">{user.role}</p>
            </div>
            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
              <img src={user.avatar || `https://picsum.photos/seed/${user.email}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => { onSettingsClick(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <span className="material-icons text-sm">settings</span> Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-semibold"
                >
                  <span className="material-icons text-sm">logout</span> Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header >
  );
};

export default Header;
