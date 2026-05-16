const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function fix() {
  console.log('Sredjujem kategorije i uklanjam duplikate...');
  
  // 1. Obrisi sve vesti koje nemaju sadrzaj (to su prazni duplikati koji su nastali tokom migracije/importa)
  const deleteResult = db.prepare("DELETE FROM vests WHERE sadrzaj IS NULL OR sadrzaj = ''").run();
  console.log(`- Obrisano ${deleteResult.changes} praznih duplikata.`);

  // 2. Prebaci sve ostale vesti u kategoriju "Vesti"
  const updateResult = db.prepare("UPDATE vests SET kategorija = 'Vesti'").run();
  console.log(`- Prebaceno ${updateResult.changes} vesti u kategoriju 'Vesti'.`);

  // 3. Postavi ih sve kao objavljene (za svaki slucaj)
  const now = new Date().toISOString();
  const publishResult = db.prepare("UPDATE vests SET published_at = ? WHERE published_at IS NULL").run(now);
  console.log(`- Zvanicno objavljeno jos ${publishResult.changes} vesti.`);

  db.close();
  console.log('\nGotovo! Restartuj Strapi i proveri sajt.');
}

fix().catch(err => console.error('Greska:', err));
