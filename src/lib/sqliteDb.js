import fs from 'fs';
import path from 'path';

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(process.cwd(), 'reliefos.db');
    const sqlPath = path.join(process.cwd(), 'reliefos.sql');

    dbInstance = new DatabaseSync(dbPath);

    // Initialize schema and seeds from reliefos.sql if available
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      dbInstance.exec(sqlContent);
    }

    return dbInstance;
  } catch (err) {
    console.warn('[ReliefOS SQLite] Native DatabaseSync error, falling back to in-memory store:', err.message);
    return null;
  }
}

// In-memory fallback if node:sqlite has permission issues
const fallbackUsers = [
  {
    id: 'usr-admin-01',
    name: 'Commander Sarah Chen',
    email: 'admin@reliefos.org',
    password: 'admin123',
    role: 'admin',
    phone: '+1 (555) 019-2834',
    organization: 'Central Incident Command (NDMA)',
    location: 'Central Operations Bunker',
    theme_accent: 'red',
    created_at: new Date().toISOString()
  },
  {
    id: 'usr-camp-02',
    name: 'Major Marcus Vance',
    email: 'camp@reliefos.org',
    password: 'camp123',
    role: 'camp_manager',
    phone: '+1 (555) 024-8172',
    organization: 'Logistics & Shelter Division 4',
    location: 'Sector 4 Hope Camp (Coastal)',
    theme_accent: 'amber',
    created_at: new Date().toISOString()
  },
  {
    id: 'usr-vol-03',
    name: 'Alex Rivera',
    email: 'volunteer@reliefos.org',
    password: 'vol123',
    role: 'volunteer',
    phone: '+1 (555) 038-9921',
    organization: 'Red Cross Rapid Volunteer Corps',
    location: 'Forward Medical Outpost Alpha',
    theme_accent: 'emerald',
    created_at: new Date().toISOString()
  }
];

export function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  const db = getDatabase();
  if (db) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?');
      const user = stmt.get(normalized);
      if (user) return user;
    } catch (e) {
      console.warn('[SQLite findUserByEmail error]:', e.message);
    }
  }
  return fallbackUsers.find(u => u.email.toLowerCase() === normalized) || null;
}

export function getAllUsers() {
  const db = getDatabase();
  if (db) {
    try {
      const stmt = db.prepare('SELECT id, name, email, role, phone, organization, location, theme_accent, created_at, last_login FROM users ORDER BY created_at ASC');
      return stmt.all();
    } catch (e) {
      console.warn('[SQLite getAllUsers error]:', e.message);
    }
  }
  return fallbackUsers.map(u => ({ ...u, password: '[PROTECTED]' }));
}

export function createUser({ name, email, password, role = 'volunteer', phone = '', organization = 'ReliefOS Rapid Volunteer', location = 'Field Operations' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  
  // Choose theme accent according to role
  const theme_accent = role === 'admin' ? 'red' : role === 'camp_manager' ? 'amber' : 'emerald';
  const id = `usr-${role.slice(0, 3)}-${Date.now().toString(36)}`;

  const db = getDatabase();
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, password, role, phone, organization, location, theme_accent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, name, normalizedEmail, password, role, phone, organization, location, theme_accent);

      // Also append to local reliefos.sql file so judges see their account in the physical SQL file
      try {
        const sqlPath = path.join(process.cwd(), 'reliefos.sql');
        if (fs.existsSync(sqlPath)) {
          const sqlInsert = `\n-- Registered during Hackathon Testing\nINSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent) VALUES ('${id}', '${name.replace(/'/g, "''")}', '${normalizedEmail}', '${password.replace(/'/g, "''")}', '${role}', '${(phone || '').replace(/'/g, "''")}', '${(organization || '').replace(/'/g, "''")}', '${(location || '').replace(/'/g, "''")}', '${theme_accent}');\n`;
          fs.appendFileSync(sqlPath, sqlInsert, 'utf8');
        }
      } catch (err) {
        console.warn('[SQLite append to SQL file error]:', err.message);
      }

      return { id, name, email: normalizedEmail, role, phone, organization, location, theme_accent };
    } catch (e) {
      console.warn('[SQLite createUser error]:', e.message);
      throw e;
    }
  }

  // Fallback
  const existing = fallbackUsers.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) throw new Error('User with this email already exists');
  const newUser = { id, name, email: normalizedEmail, password, role, phone, organization, location, theme_accent, created_at: new Date().toISOString() };
  fallbackUsers.push(newUser);

  // Also append to local reliefos.sql file so judges see their account in the physical SQL file
  try {
    const sqlPath = path.join(process.cwd(), 'reliefos.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlInsert = `\n-- Registered during Hackathon Testing\nINSERT OR REPLACE INTO users (id, name, email, password, role, phone, organization, location, theme_accent) VALUES ('${id}', '${name.replace(/'/g, "''")}', '${normalizedEmail}', '${password.replace(/'/g, "''")}', '${role}', '${(phone || '').replace(/'/g, "''")}', '${(organization || '').replace(/'/g, "''")}', '${(location || '').replace(/'/g, "''")}', '${theme_accent}');\n`;
      fs.appendFileSync(sqlPath, sqlInsert, 'utf8');
    }
  } catch (err) {
    console.warn('[SQLite append to SQL file error]:', err.message);
  }

  return newUser;
}

export function recordLogin(userId, email, role, theme_accent) {
  const db = getDatabase();
  if (db) {
    try {
      const stmt = db.prepare('INSERT INTO login_logs (user_id, email, role, theme_accent) VALUES (?, ?, ?, ?)');
      stmt.run(userId, email, role, theme_accent);

      const updateStmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(userId);
    } catch (e) {
      console.warn('[SQLite recordLogin error]:', e.message);
    }
  }
}

export function getSqlFileContent() {
  try {
    const sqlPath = path.join(process.cwd(), 'reliefos.sql');
    if (fs.existsSync(sqlPath)) {
      return fs.readFileSync(sqlPath, 'utf8');
    }
  } catch (e) {
    console.warn('[SQLite getSqlFileContent error]:', e.message);
  }
  return '-- reliefos.sql file';
}
