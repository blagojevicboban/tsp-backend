const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function check() {
  console.log('Provera integriteta vesti u bazi...');
  
  const rows = db.prepare('SELECT id, naslov, document_id, locale, published_at, kategorija FROM vests LIMIT 5').all();
  
  if (rows.length === 0) {
    console.log('NEMA VESTI U BAZI! (Cudno, malopre ih je bilo 496)');
    return;
  }

  console.log('Primeri vesti u bazi:');
  rows.forEach(r => {
    console.log(`ID: ${r.id}, DocumentID: ${r.document_id}, Locale: ${r.locale}, Pub: ${r.published_at}, Kat: ${r.kategorija}`);
  });

  const nullDocId = db.prepare('SELECT COUNT(*) as count FROM vests WHERE document_id IS NULL OR document_id = ""').get();
  console.log(`\nBroj vesti bez DocumentID: ${nullDocId.count}`);

  const nullLocale = db.prepare('SELECT COUNT(*) as count FROM vests WHERE locale IS NULL OR locale = ""').get();
  console.log(`Broj vesti bez Locale: ${nullLocale.count}`);

  db.close();
}

check().catch(err => console.error('Greska:', err));
