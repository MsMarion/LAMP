-- Seed data. Run after schema.sql:  mysql -u root -p < sql/seed.sql
--
-- Default passwords (bcrypt hashes below, generated to match PHP password_hash):
--   root            -> COP4331root!   (must_change_password = 1)
--   everyone else   -> Password123!

USE lamp_project;

INSERT INTO users (id, username, email, full_name, password_hash, role, is_disabled, must_change_password) VALUES
  (1, 'root',   NULL,                  'Application Administrator', '$2y$10$pmB1oPb0uzlsul7Jy77AfuiHrU/vOwX1vHVvJfZ52lDKc7.JsVIgm', 'admin', 0, 1),
  (2, 'admin2', 'admin2@example.com',  'Morgan Admin',              '$2y$10$eLwqCe04IgtNa7tY14TaaOVByCq/2N7n6FQIxdqEXAkj78z4f00yy', 'admin', 0, 0),
  (3, 'alice',  'alice@example.com',   'Alice Johnson',             '$2y$10$eLwqCe04IgtNa7tY14TaaOVByCq/2N7n6FQIxdqEXAkj78z4f00yy', 'user',  0, 0),
  (4, 'bob',    'bob@example.com',     'Bob Martinez',              '$2y$10$eLwqCe04IgtNa7tY14TaaOVByCq/2N7n6FQIxdqEXAkj78z4f00yy', 'user',  0, 0),
  (5, 'carol',  'carol@example.com',   'Carol Nguyen',              '$2y$10$eLwqCe04IgtNa7tY14TaaOVByCq/2N7n6FQIxdqEXAkj78z4f00yy', 'user',  0, 0),
  (6, 'dave',   'dave@example.com',    'Dave Disabled',             '$2y$10$eLwqCe04IgtNa7tY14TaaOVByCq/2N7n6FQIxdqEXAkj78z4f00yy', 'user',  1, 0);

INSERT INTO contacts (user_id, name, phone, email, address, notes) VALUES
  (3, 'Brian Smith',     '407-555-0101', 'brian.smith@example.com', '100 Main St, Orlando, FL',      'Coworker'),
  (3, 'Bria Lopez',      '407-555-0102', 'bria.lopez@example.com',  '22 Oak Ave, Orlando, FL',       'Study group'),
  (3, 'Samantha Brown',  '321-555-0103', 'sam.brown@example.com',   NULL,                            NULL),
  (3, 'Dr. Patel',       '407-555-0104', NULL,                      '5 Clinic Way, Oviedo, FL',      'Dentist'),
  (3, 'Mom',             '305-555-0105', NULL,                      NULL,                            'Call Sundays'),
  (4, 'Brian Smith',     '407-555-0201', 'bsmith@example.com',      NULL,                            'Same name as alice''s contact, different owner'),
  (4, 'Kevin Tran',      '407-555-0202', 'kevin.tran@example.com',  '9 Pine Rd, Winter Park, FL',    NULL),
  (4, 'Laura Chen',      '689-555-0203', 'laura.chen@example.com',  NULL,                            'Landlord'),
  (5, 'Pizza Palace',    '407-555-0301', NULL,                      '400 University Blvd, Orlando',  'Order #2 is the good one'),
  (5, 'Jordan Rivera',   '407-555-0302', 'jordan.r@example.com',    NULL,                            NULL),
  (6, 'Old Friend',      '407-555-0401', NULL,                      NULL,                            'Owner is disabled');
