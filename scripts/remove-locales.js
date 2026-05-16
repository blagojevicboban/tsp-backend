const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function fix() {
  console.log('Uklanjam jezike (postavljam na NULL) jer sistem ne koristi i18n...');
  
  const result = db.prepare('UPDATE vests SET locale = NULL').run();
  console.log(`- Azurirano ${result.changes} vesti. Jezik postavljen na NULL.`);

  db.close();
  console.log('\nGotovo! Restartuj Strapi i osvezi Admin panel.');
}

fix().catch(err => console.error('Greska:', err));
