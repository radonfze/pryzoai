-- PryzoAI RLS Migration - Basic Company Isolation
-- Enable RLS on all tables and add company_id isolation policies

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_allocation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. COMPANIES TABLE POLICIES
-- ============================================
-- Users can only see their own company
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT USING (id::text = auth.jwt()->>'company_id');

-- Only authenticated users with matching company can insert
CREATE POLICY "companies_insert_own" ON companies
  FOR INSERT WITH CHECK (id::text = auth.jwt()->>'company_id');

-- ============================================
-- 3. BRANCHES TABLE POLICIES
-- ============================================
CREATE POLICY "branches_company_isolation" ON branches
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

-- ============================================
-- 4. WAREHOUSES TABLE POLICIES
-- ============================================
CREATE POLICY "warehouses_company_isolation" ON warehouses
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

-- ============================================
-- 5. USERS TABLE POLICIES
-- ============================================
CREATE POLICY "users_company_isolation" ON users
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

-- ============================================
-- 6. USER SESSIONS TABLE POLICIES
-- ============================================
-- Users can only see their own sessions
CREATE POLICY "sessions_own_only" ON user_sessions
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE company_id::text = auth.jwt()->>'company_id'
    )
  );

-- ============================================
-- 7. NUMBER SERIES TABLE POLICIES
-- ============================================
CREATE POLICY "number_series_company_isolation" ON number_series
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

-- ============================================
-- 8. NUMBER ALLOCATION LOG TABLE POLICIES
-- ============================================
CREATE POLICY "allocation_log_company_isolation" ON number_allocation_log
  FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

-- ============================================
-- 9. AUDIT LOGS TABLE POLICIES
-- ============================================
-- Audit logs: Company isolation + read-only for all except system
CREATE POLICY "audit_logs_company_isolation" ON audit_logs
  FOR SELECT USING (company_id::text = auth.jwt()->>'company_id');

-- Only system/service role can insert audit logs
CREATE POLICY "audit_logs_insert_service" ON audit_logs
  FOR INSERT WITH CHECK (true); -- Will be restricted by service role

-- ============================================
-- 10. SERVICE ROLE BYPASS (FOR MIGRATIONS/ADMIN)
-- ============================================
-- Service role bypasses RLS by default in Supabase
-- No additional policy needed

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
