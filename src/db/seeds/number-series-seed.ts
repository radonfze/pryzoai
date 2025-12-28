export const NUMBER_SERIES_SQL = `
-- Initial Number Series Configuration for Gapless Numbering

-- Invoice Series
INSERT INTO number_series (company_id, entity_type, document_type, prefix, separator, year_format, current_value, reset_rule, scope)
SELECT id, 'invoice', 'INV', 'INV', '-', 'YYYY', 0, 'YEARLY', 'COMPANY'
FROM companies;

-- Purchase Order Series
INSERT INTO number_series (company_id, entity_type, document_type, prefix, separator, year_format, current_value, reset_rule, scope)
SELECT id, 'purchase_order', 'PO', 'PO', '-', 'YYYY', 0, 'YEARLY', 'COMPANY'
FROM companies;

-- Payment Series
INSERT INTO number_series (company_id, entity_type, document_type, prefix, separator, year_format, current_value, reset_rule, scope)
SELECT id, 'payment', 'PAY', 'PAY', '-', 'YYYY', 0, 'YEARLY', 'COMPANY'
FROM companies;

-- Customer Series
INSERT INTO number_series (company_id, entity_type, document_type, prefix, separator, year_format, current_value, reset_rule, scope)
SELECT id, 'customer', NULL, 'CUS', '-', 'NONE', 0, 'NONE', 'COMPANY'
FROM companies;
`;
