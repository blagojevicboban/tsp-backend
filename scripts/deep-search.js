const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function search() {
  console.log('Duboka pretraga za "Test 123" u svim tabelama...');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  for (const t of tables) {
    if (t.name.startsWith('sqlite_')) continue;
    try {
      const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
      const match = rows.filter(r => JSON.stringify(r).includes('Test 123') || JSON.stringify(r).includes('b8p15bnn60yimdynlybafvtv'));
      
      if (match.length > 0) {
        console.log(`\n>>> Pronadjeno u tabeli: ${t.name}`);
        console.log(match[0]);
      }
    } catch (e) {}
  }

  db.close();
}

search().catch(err => console.error('Greska:', err));
