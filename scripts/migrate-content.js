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

function normalize(str) {
  if (!str) return '';
  return str
    .replace(/&#8220;|&#8221;|&#8222;|&#8211;|&#8212;|&#8216;|&#8217;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function migrate() {
  console.log('Pokrecem FINALNU migraciju sadrzaja...');
  
  const strapiVests = db.prepare('SELECT id, naslov, slug FROM vests').all();
  console.log(`Ucitano ${strapiVests.length} vesti iz Strapi baze.`);

  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inTable = false;
  let updated = 0;
  let totalFoundInSql = 0;

  for await (const line of rl) {
    const trimLine = line.trim();

    if (trimLine.includes('INSERT INTO') && trimLine.includes('tsp_posts')) {
      inTable = true;
      continue;
    }

    if (inTable) {
      if (trimLine.startsWith('(')) {
        const parts = parseSqlRow(trimLine);
        
        if (parts.length >= 21) {
          const content = parts[4];
          const wpTitle = parts[5];
          const wpSlug = parts[11];
          const type = parts[20];

          if (type === 'post' || type === 'vest' || type === 'article') {
            totalFoundInSql++;
            
            const match = strapiVests.find(v => 
              v.slug === wpSlug || 
              normalize(v.naslov) === normalize(wpTitle)
            );

            if (match && content && content.length > 10) {
              const stmt = db.prepare('UPDATE vests SET sadrzaj = ? WHERE id = ? AND (sadrzaj IS NULL OR sadrzaj = "")');
              const result = stmt.run(content, match.id);
              
              if (result.changes > 0) {
                updated++;
                if (updated % 50 === 0) console.log(`Azurirano ${updated} vesti...`);
              }
            }
          }
        }
      }

      if (trimLine.endsWith(';')) {
        inTable = false;
      }
    }
  }

  console.log(`\nMigracija zavrsena!`);
  console.log(`- Pronadjeno postova u SQL-u: ${totalFoundInSql}`);
  console.log(`- Uspesno azurirano u bazi: ${updated}`);
  db.close();
}

function parseSqlRow(row) {
  let content = row.trim();
  if (content.startsWith('(')) content = content.slice(1);
  if (content.endsWith('),')) content = content.slice(0, -2);
  if (content.endsWith(');')) content = content.slice(0, -2);
  
  const parts = [];
  let current = '';
  let inString = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === "'" && (i === 0 || content[i-1] !== '\\')) {
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
