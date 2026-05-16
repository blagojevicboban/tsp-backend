const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function find() {
  console.log('UNIVERZALNA PRETRAGA: Trazim ID 1 ili 1043 u CELOJ bazi...');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  for (const t of tables) {
    if (t.name.startsWith('sqlite_')) continue;
    try {
      const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
      // Trazimo ID 1 ili 1043 ili njihove document_id-jeve
      const match = rows.filter(r => 
        Object.values(r).includes(1) || 
        Object.values(r).includes(1043) ||
        Object.values(r).includes('xdybx3jvn1uto8u80og3jhwt') ||
        Object.values(r).includes('b8p15bnn60yimdynlybafvtv')
      );
      
      if (match.length > 0) {
        console.log(`\n>>> Pronadjeno u tabeli: ${t.name}`);
        console.log(match[0]);
      }
    } catch (e) {}
  }

  db.close();
}

find().catch(err => console.error('Greska:', err));
