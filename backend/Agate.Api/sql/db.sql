INSERT INTO roles(key, name) VALUES 
('admin', 'Admin'),
('account_manager', 'Account Manager'), 
('creative', 'Creative'),
('analyst', 'Analyst')
ON CONFLICT (key) DO NOTHING;


-- 21.11.2025 scripts
ALTER TABLE concept_notes 
ADD COLUMN status text DEFAULT 'Ideas',
ADD COLUMN priority integer DEFAULT 1;

ALTER TABLE budget_lines 
ADD COLUMN category text DEFAULT 'Other',
ADD COLUMN type text DEFAULT 'Planned',
ADD COLUMN planned_amount numeric(14,2) DEFAULT 0,
ADD COLUMN description text,
ADD COLUMN vendor text,
ADD COLUMN created_at timestamp DEFAULT now(),
ADD COLUMN updated_at timestamp DEFAULT now();