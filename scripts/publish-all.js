const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new DatabaseSync(DB_FILE);

function cleanEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#8220;|&#8221;|&#8222;/g, '"')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

async function publish() {
  console.log('Pripremam vesti za javni prikaz...');
  
  const now = new Date().toISOString();
  
  // 1. Ocisti naslove od HTML entiteta
  const vests = db.prepare('SELECT id, naslov FROM vests').all();
  let cleanedCount = 0;
  
  const updateNaslov = db.prepare('UPDATE vests SET naslov = ? WHERE id = ?');
  
  for (const v of vests) {
    const newNaslov = cleanEntities(v.naslov);
    if (newNaslov !== v.naslov) {
      updateNaslov.run(newNaslov, v.id);
      cleanedCount++;
    }
  }
  console.log(`- Ocisceno ${cleanedCount} naslova.`);

  // 2. "Objavi" sve vesti koje imaju sadrzaj (postavi publishedAt)
  const result = db.prepare(`
    UPDATE vests 
    SET published_at = ? 
    WHERE published_at IS NULL AND sadrzaj IS NOT NULL AND sadrzaj != ''
  `).run(now);

  console.log(`- Zvanicno objavljeno ${result.changes} vesti.`);
  
  db.close();
  console.log('\nSve je spremno! Restartuj Strapi i proveri sajt.');
}

publish().catch(err => console.error('Greska:', err));
