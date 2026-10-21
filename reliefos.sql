-- ====================================================================
-- ReliefOS + DARK ZONE: Local SQL Database Schema & Seed Data
-- Rapid Disaster Response, Dark Zone Inference & Resource Allocation
-- ====================================================================

-- Users & Operational Clearance Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'camp_manager', 'volunteer')),
  phone TEXT,
  organization TEXT DEFAULT 'ReliefOS Rapid Response',
  location TEXT DEFAULT 'Sector 1 Alpha',
  theme_accent TEXT DEFAULT 'red',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Audit / Login Log Table
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1 (Local)',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  theme_accent TEXT
);

-- ====================================================================
-- Pre-Seeded Hackathon Demo Accounts (Filled by default for judging)
-- ====================================================================

-- 1. Commander Sarah Chen (Admin / Rescue Coordinator)
--    Full command access: Dark Zone priority triage, global resource allocations, system admin
INSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent, notes) VALUES (
  'usr-admin-01',
  'Commander Sarah Chen',
  'admin@reliefos.org',
  'admin123',
  'admin',
  '+1 (555) 019-2834',
  'Central Incident Command (NDMA)',
  'Central Operations Bunker',
  'red',
  'Lead Incident Commander with full authority over Dark Zone resource allocations.'
);

-- 2. Major Marcus Vance (Camp Manager)
--    Camp operations, stock intake, daily ration distribution, emergency shortage alerts
INSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent, notes) VALUES (
  'usr-camp-02',
  'Major Marcus Vance',
  'camp@reliefos.org',
  'camp123',
  'camp_manager',
  '+1 (555) 024-8172',
  'Logistics & Shelter Division 4',
  'Sector 4 Hope Camp (Coastal)',
  'amber',
  'On-site Logistics Coordinator managing 840 displaced civilians.'
);

-- 3. Alex Rivera (Field Volunteer)
--    Field reconnaissance, duty execution, offline mesh reports, survivor assistance
INSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent, notes) VALUES (
  'usr-vol-03',
  'Alex Rivera',
  'volunteer@reliefos.org',
  'vol123',
  'volunteer',
  '+1 (555) 038-9921',
  'Red Cross Rapid Volunteer Corps',
  'Forward Medical Outpost Alpha',
  'emerald',
  'First-responder EMT certified; field triage and offline reporting specialist.'
);

-- Registered during Hackathon Testing
INSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent) VALUES ('usr-vol-mvifn46s', 'Test Responder', 'test_responder@reliefos.org', 'password123', 'volunteer', '+1 (555) 000-0000', 'ReliefOS Emergency Response Unit', 'Field Sector 1', 'emerald');

-- Registered during Hackathon Testing
INSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent) VALUES ('usr-cam-mvig399e', 'Dr. John Watson', 'john.watson@reliefos.org', 'securePass123', 'camp_manager', '+1 (555) 000-0000', 'Camp Logistics & Relief Hub', 'Sector 4 Hope Camp', 'amber');

-- Registered during Hackathon Testing
INSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent) VALUES ('usr-adm-mvig7hhe', 'Commander Maria Santos', 'maria.santos@reliefos.org', 'passMaria123', 'admin', '+1 (555) 000-0000', 'ReliefOS Rapid Volunteer', 'Forward Zone Alpha', 'red');
