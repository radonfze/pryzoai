-- Row Level Security (RLS) Policies for PryzoAI ERP
-- These policies must be applied to the PostgreSQL database to enforce tenant isolation.

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- 1. Companies Table Policy
-- Users can only see their own company
CREATE POLICY "Users can view their own company" ON companies
  USING (id = (current_setting('app.current_company_id')::uuid));

-- 2. General Tenant Policy
-- Applied to most tables (customers, items, invoices, etc.)
-- Assumes 'company_id' column exists
CREATE POLICY "Tenant Isolation Policy" ON customers
  USING (company_id = (current_setting('app.current_company_id')::uuid));

CREATE POLICY "Tenant Isolation Policy" ON suppliers
  USING (company_id = (current_setting('app.current_company_id')::uuid));

CREATE POLICY "Tenant Isolation Policy" ON items
  USING (company_id = (current_setting('app.current_company_id')::uuid));

CREATE POLICY "Tenant Isolation Policy" ON sales_invoices
  USING (company_id = (current_setting('app.current_company_id')::uuid));

-- 3. User Policy
-- Users can see their own profile
CREATE POLICY "User Profile Policy" ON users
  USING (id = auth.uid());

-- Usage in Application:
-- The middleware/backend must set the configuration parameter before queries:
-- SET app.current_company_id = 'uuid-of-company';
-- SET app.current_user_id = 'uuid-of-user';

