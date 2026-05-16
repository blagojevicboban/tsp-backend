const fs = require('fs');
const readline = require('readline');
const Database = require('better-sqlite3');
const path = require('path');

const SQL_FILE = path.join(__dirname, '../backup.sql');
const DB_FILE = path.join(__dirname, '../.tmp/data.db');

if (!fs.existsSync(DB_FILE)) {
  console.error('Baza podataka nije pronadjena na putanji:', DB_FILE);
  process.exit(1);
}

const db = new Database(DB_FILE);

// Funkcija za ciscenje HTML entiteta i specijalnih karaktera iz naslova
function normalize(str) {
  if (!str) return '';
  return str
    .replace(/&#8220;|&#8221;|&#8222;|&#8211;|&#8212;|&#8216;|&#8217;/g, '"') // Zameni razne navodnike i crte
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ') // Svi razmaci u jedan
    .trim()
    .toLowerCase();
}

// Funkcija za kreiranje sluga iz naslova (ako zatreba za uparivanje)
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function migrate() {
  console.log('Pokrecem ROBUSNU migraciju sadrzaja...');
  
  // Ucitaj sve vesti iz Strapi baze u memoriju radi lakseg uparivanja
  const strapiVests = db.prepare('SELECT id, naslov, slug FROM vests').all();
  console.log(`Ucitano ${strapiVests.length} vesti iz Strapi baze.`);

  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let updated = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `tsp_posts` VALUES')) {
      const valuesMatch = line.match(/\((.*?)\)(?:,|$)/g);
      if (valuesMatch) {
        for (const valueRow of valuesMatch) {
          const parts = parseSqlRow(valueRow);
          
          if (parts.length >= 6) {
            const content = parts[4];
            const wpTitle = parts[5];
            const wpSlug = parts[11]; // post_name
            const type = parts[19]; // post_type

            if (type === 'post' || type === 'vest') {
              // Pokusaj uparivanja
              const match = strapiVests.find(v => 
                v.slug === wpSlug || 
                normalize(v.naslov) === normalize(wpTitle)
              );

              if (match && content && content.length > 10) {
                const stmt = db.prepare('UPDATE vests SET sadrzaj = ? WHERE id = ?');
                const result = stmt.run(content, match.id);
                
                if (result.changes > 0) {
                  updated++;
                  if (updated % 50 === 0) console.log(`Azurirano ${updated} vesti...`);
                }
              } else {
                skipped++;
              }
            }
          }
        }
      }
    }
  }

  console.log(`\nMigracija zavrsena!`);
  console.log(`- Ukupno azurirano: ${updated} vesti.`);
  console.log(`- Preskoceno (bez poklapanja): ${skipped}`);
  db.close();
}

function parseSqlRow(row) {
  const content = row.trim().slice(1, -1);
  const parts = [];
  let current = '';
  let inString = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === "'" && content[i-1] !== '\\') {
      inString = !inString;
    } else if (char === ',' && !inString) {
      parts.push(cleanValue(current));
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(cleanValue(current));
  return parts;
}

function cleanValue(val) {
  let clean = val.trim();
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1);
  }
  return clean.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
}

migrate().catch(err => console.error('Greska:', err));
