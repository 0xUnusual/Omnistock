# Omnistock: SaaS POS & Inventory Management System

**Omnistock** is a modern, high-performance, and scalable SaaS-based Point of Sale (POS) and Inventory Management system designed for retail businesses and wholesalers. Built with a "premium first" design philosophy, it offers a seamless end-to-end experience from stock reception to customer billing.

![Dashboard Preview](https://img.shields.io/badge/Status-Beta-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech-React_%7C_Vite_%7C_Tailwind_%7C_Supabase-blue)

---

## 🚀 Principal Features

### 🛒 Cloud POS Terminal
- **Instant Processing:** Real-time sale checkout with auto-generation of invoices.
- **Support for Credit/Cash:** Easily toggle between "Contado" (Cash) and "Crédito" (Credit) for clients with credit lines.
- **Smart Lote Selection:** Automatically decrements stock from the oldest lotes (FIFO) to ensure inventory freshness.
- **Multi-currency & Taxes:** Pre-configured for ITBIS (Dominican Republic) or custom tax names and rates.

### 📦 Intelligent Inventory
- **Batch/Lote Tracking:** Track every item's cost, initial stock, and current balance by lote.
- **Stock Indicators:** Visual alerts for products with low stock (below minimum).
- **History Logs:** Every stock movement (sales, adjustments, receptions) is logged for auditing.
- **Inventory Valuation:** Real-time reports on the total value of your stock by category.

### 👥 Client & Credit Management
- **Customer Profiles:** Manage contact details, tax IDs (RNC), and credit limits.
- **Accounts Receivable:** Track pending balances, aging reports, and installment payments.
- **Payment History:** Log every payment received against a specific sale with a clear audit trail.

### 📊 Advanced Reports
- **Daily Sales Trends:** Interactive charts showing your growth over time.
- **Inventory Analytics:** Analysis of stock value and critical items.
- **CSV Exports:** Download your logs (Sales, Inventory, Debtors) directly for Excel or Accounting software.

### 🏢 SaaS White-Labeling (Settings)
- **Organization Management:** Each user belongs to a unique organization with its own data isolation.
- **Custom Branding:** Upload your business logo, set your currency, and configure your own invoice prefixes (e.g., `FACT-`, `B02-`).
- **Global Taxes:** Set tax rates and naming conventions globally for your company.

### 🖨️ Premium Invoicing
- **Print-Ready Receipts:** Dedicated print-styles for a professional physical or PDF receipt.
- **Historical Invoices:** View and reprint any past invoice directly from the Reports log.
- **Glassmorphism Design:** A modern, aesthetic interface that "wows" users and clients alike.

---

## 🛠️ Tech Stack

- **Frontend:** React (TypeScript) + Vite
- **Styling:** Tailwind CSS (Custom Design System with Dark Mode support)
- **Backend/Database:** Supabase (PostgreSQL with Row Level Security - RLS)
- **State Management:** Custom React Context/Hooks architecture
- **Charts:** Recharts

---

## 🔑 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd IM-app-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup:**
   Run the SQL scripts located in the root (in order):
   - `SUPABASE_SETUP.sql` (Tables & Initial Functions)
   - `GENERIC_SAAS_MIGRATION.sql` (Multi-tenant Refactoring)
   - `FIX_RLS.sql` (Row Level Security & Permissions)

5. **Start Dev Server:**
   ```bash
   npm run dev
   ```

---

## 🔒 Security

Omnistock implements **Row Level Security (RLS)** at the database level. This ensures that even if an API key is leaked, users can *only* see and modify data that belongs to their specific `organization_id`. 

---

## 📋 License

Designed with ❤️ for professional businesses. All rights reserved.
