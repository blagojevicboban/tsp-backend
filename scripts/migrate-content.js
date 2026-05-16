const fs = require('fs');
const readline = require('readline');
const Database = require('better-sqlite3');
const path = require('path');

// Putanje do fajlova
const SQL_FILE = path.join(__dirname, '../backup.sql');
const DB_FILE = path.join(__dirname, '../.tmp/data.db');

if (!fs.existsSync(DB_FILE)) {
  console.error('Baza podataka nije pronadjena na putanji:', DB_FILE);
  process.exit(1);
}

const db = new Database(DB_FILE);

async function migrate() {
  console.log('Pokrecem migraciju sadrzaja iz backup.sql u data.db...');
  
  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  let updated = 0;

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `tsp_posts` VALUES')) {
      // Izvlacenje redova iz INSERT komande
      // Ovo je malo triki jer redovi mogu imati zareze unutar teksta
      // Ali svaki red pocinje sa ( i zavrsava sa ),
      
      const valuesMatch = line.match(/\((.*?)\)(?:,|$)/g);
      if (valuesMatch) {
        for (const valueRow of valuesMatch) {
          // Parsiranje jednog reda (vrlo uprosceno, ali cesto radi za SQL dumpove)
          // Red izgleda otprilike ovako: (ID, author, date, date_gmt, content, title, excerpt, status, ...)
          // Koristicemo split po ',' ali pazljivo sa navodnicima
          
          const parts = parseSqlRow(valueRow);
          
          if (parts.length >= 6) {
            const id = parts[0];
            const content = parts[4];
            const title = parts[5];
            const slug = parts[11]; // post_name
            const type = parts[19]; // post_type

            if (type === 'post' || type === 'vest') {
              // Pokusaj da pronadjes vest u Strapi bazi po naslovu ili slugu
              const stmt = db.prepare('UPDATE vests SET sadrzaj = ? WHERE naslov = ? AND (sadrzaj IS NULL OR sadrzaj = "")');
              const result = stmt.run(content, title);
              
              if (result.changes > 0) {
                updated++;
                if (updated % 50 === 0) console.log(`Azurirano ${updated} vesti...`);
              }
            }
          }
        }
      }
    }
  }

  console.log(`Zavrseno! Azurirano ukupno ${updated} vesti.`);
  db.close();
}

// Pomocna funkcija za grubo parsiranje SQL reda
function parseSqlRow(row) {
  // Skidamo zagrade na pocetku i kraju
  const content = row.trim().slice(1, -1);
  const parts = [];
  let current = '';
  let inString = false;
  let quoteChar = '';

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
  // Unescape SQL quotes
  return clean.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
}

migrate().catch(err => {
  console.error('Greska tokom migracije:', err);
});
