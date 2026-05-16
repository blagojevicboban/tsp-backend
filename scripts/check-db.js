const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

console.log('Provera podataka u bazi...');

const rows = db.prepare('SELECT naslov, slug FROM vests LIMIT 10').all();
console.log('Prvih 10 naslova i slugova u Strapi bazi:');
rows.forEach((row, i) => {
  console.log(`${i+1}. Naslov: "${row.naslov}" | Slug: "${row.slug}"`);
});

const count = db.prepare('SELECT COUNT(*) as total FROM vests').get();
console.log(`\nUkupno vesti u bazi: ${count.total}`);

db.close();
