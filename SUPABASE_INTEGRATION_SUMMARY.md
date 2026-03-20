# Supabase Integration Summary

We have successfully integrated Supabase into the IM App. The application now uses Supabase for authentication, database storage, and real-time data fetching.

## Key Changes

1.  **Database Schema**: A comprehensive SQL schema (`SUPABASE_SETUP.sql`) was created, defining tables for `users`, `products`, `sales` (ventas), `clients` (clientes), and `receivables` (cuentas_por_cobrar), along with views and security policies.
2.  **Authentication**: The `useAuth` hook was implemented to manage user sessions using Supabase Auth. Users can sign up and sign in, with their profiles stored in a dedicated `users` table.
3.  **Data Fetching**: The `useData` hook centralizes data loading from Supabase tables (`stock_total_productos`, `ventas`, `cuentas_por_cobrar`, `clientes`).
4.  **Component Updates**:
    *   `App.tsx`: Central hub for data and auth state.
    *   `LoginView`: Real authentication flows.
    *   `DashboardView`, `PosTerminalView`, `InventoryView`, `ReceivablesView`, `ClientsView`: Updated to use the new data structures and Spanish field names (e.g., `nombre`, `stock_total`, `precio_venta_base`).

## Setup Instructions

1.  **Supabase Project**: Ensure you have a Supabase project created.
2.  **Database Setup**: Copy the contents of `SUPABASE_SETUP.sql` and run it in the SQL Editor of your Supabase dashboard to create the tables, views, and functions.
3.  **Environment Variables**: Update `.env.local` with your actual Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
4.  **Run Application**:
    ```bash
    npm run dev
    ```

## Functionality Notes

*   **Sales Processing**: The POS terminal now prepares sales data. For full functionality, ensure the `process_sale` RPC function in Supabase corresponds to the data structure sent by the frontend (currently simplified for demonstration).
*   **Role-Based Access**: The app supports roles (admin, vendedor, gerente), which are stored in the user metadata and the database.

The application is now ready for testing with a live database.
