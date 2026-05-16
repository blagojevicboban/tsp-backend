const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function fix() {
  console.log('Popravljam jezike (locales) za vesti...');
  
  // 1. Saznaj koji je glavni jezik u sistemu
  let locale = 'sr'; // Default pretpostavka
  try {
    const localeRow = db.prepare('SELECT code FROM strapi_locales LIMIT 1').get();
    if (localeRow) {
      locale = localeRow.code;
      console.log(`- Pronasao sam sistemni jezik: '${locale}'`);
    }
  } catch (e) {
    console.log(`- Ne mogu da pristupim tabeli strapi_locales, koristicu '${locale}'`);
  }

  // 2. Postavi taj jezik svim vestima koje ga nemaju
  const result = db.prepare('UPDATE vests SET locale = ? WHERE locale IS NULL OR locale = ""').run(locale);
  console.log(`- Azurirano ${result.changes} vesti. Postavljen jezik na '${locale}'.`);

  db.close();
  console.log('\nGotovo! Restartuj Strapi i proveri Admin panel.');
}

fix().catch(err => console.error('Greska:', err));
