-- Create admin user
-- Run this after database initialization

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, verified)
VALUES (
  'admin@chemicaloop.com',
  '$2a$10$rJzKvL2KvZQZQZQZQZQZQu',
  'Admin User',
  'ADMIN',
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert operator user (password: operator123)
INSERT INTO users (email, password_hash, name, role, verified)
VALUES (
  'operator@chemicaloop.com',
  '$2a$10$rJzKvL2KvZQZQZQZQZQZQu',
  'Operator User',
  'OPERATOR',
  true
) ON CONFLICT (email) DO NOTHING;

-- Sample product
INSERT INTO categories (name, name_en, description)
VALUES ('溶剂类', 'Solvents', 'Chemical solvents for industrial use')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, name_en, cas, formula, description, specifications, application, reference_price)
VALUES (
  '乙酸',
  'Acetic Acid',
  '64-19-7',
  'CH3COOH',
  'A clear colorless liquid with a pungent vinegar odor.',
  'Purity: ≥99.5%, Acid Value: 762-770 mg KOH/g',
  'Used in chemical synthesis, food preservation, and industrial cleaning.',
  1.50
) ON CONFLICT DO NOTHING;

-- Sample inquiry
INSERT INTO inquiries (user_id, product_id, quantity, target_price, message, status)
VALUES (
  (SELECT id FROM users WHERE email = 'operator@chemicaloop.com'),
  (SELECT id FROM products WHERE name_en = 'Acetic Acid'),
  1000,
  1.40,
  'I am interested in purchasing 1000kg of acetic acid. Please provide quotation.',
  'PENDING'
) ON CONFLICT DO NOTHING;

COMMIT;
