const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function find() {
  console.log('Trazim gde Strapi 5 cuva metapodatke za vest 1043...');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'vests%'").all();
  console.log('\nTabele povezane sa vestima:');
  tables.forEach(t => console.log(`- ${t.name}`));

  console.log('\nSadrzaj tih tabela za ID 1043:');
  for (const t of tables) {
    try {
      // Proveravamo da li postoji kolona 'entity_id' ili 'vest_id' ili slicno
      const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
      // Filtriramo u JS-u jer ne znamo ime kolone
      const match = rows.filter(r => Object.values(r).includes(1043) || Object.values(r).includes('b8p15bnn60yimdynlybafvtv'));
      if (match.length > 0) {
        console.log(`\n[Tabela: ${t.name}] Pronadjeno podudaranje:`);
        console.log(match[0]);
      }
    } catch (e) {}
  }

  db.close();
}

find().catch(err => console.error('Greska:', err));
