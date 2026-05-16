const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function fix() {
  console.log('Popravljam jezike (locales) za vesti (v2)...');
  
  // 1. Saznaj koji je glavni jezik u sistemu
  let locale = 'sr'; // Default pretpostavka
  try {
    const localeRow = db.prepare('SELECT code FROM i18n_locale LIMIT 1').get();
    if (localeRow) {
      locale = localeRow.code;
      console.log(`- Pronasao sam sistemni jezik: '${locale}'`);
    }
  } catch (e) {
    // Ako ne postoji i18n_locale, mozda je strapi_locales (zavisi od verzije)
    try {
      const localeRow = db.prepare('SELECT code FROM strapi_locales LIMIT 1').get();
      if (localeRow) locale = localeRow.code;
    } catch (e2) {
      console.log(`- Ne mogu da nadjem tabelu jezika, koristicu '${locale}'`);
    }
  }

  // 2. Postavi taj jezik svim vestima koje ga nemaju
  // Koristimo SINGLE QUOTES ('') za prazan string u SQL-u
  const result = db.prepare("UPDATE vests SET locale = ? WHERE locale IS NULL OR locale = ''").run(locale);
  console.log(`- Azurirano ${result.changes} vesti. Postavljen jezik na '${locale}'.`);

  db.close();
  console.log('\nGotovo! Restartuj Strapi.');
}

fix().catch(err => console.error('Greska:', err));
