INSERT INTO roles(key, name) VALUES 
('admin', 'Admin'),
('account_manager', 'Account Manager'), 
('creative', 'Creative'),
('analyst', 'Analyst')
ON CONFLICT (key) DO NOTHING;