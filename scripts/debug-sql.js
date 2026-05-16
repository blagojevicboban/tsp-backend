const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE = path.join(__dirname, '../backup.sql');

async function debug() {
  console.log('DEBUG: Proveravam backup.sql...');
  
  if (!fs.existsSync(SQL_FILE)) {
    console.error('Fajl backup.sql nije pronadjen!');
    return;
  }

  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let linesFound = 0;
  let rowsFound = 0;

  for await (const line of rl) {
    if (line.includes('INSERT INTO') && line.includes('tsp_posts')) {
      linesFound++;
      console.log(`\nPronasao sam INSERT liniju br. ${linesFound}`);
      
      const valuesMatch = line.match(/\((.*?)\)(?:,|$)/g);
      if (valuesMatch) {
        console.log(`Linija sadrzi ${valuesMatch.length} redova.`);
        for (let i = 0; i < Math.min(valuesMatch.length, 3); i++) {
          const parts = parseSqlRow(valuesMatch[i]);
          console.log(`Red ${i+1}: Broj kolona=${parts.length}, Tip="${parts[20]}", Naslov="${parts[5]?.substring(0, 30)}..."`);
          rowsFound++;
        }
      }
      
      if (linesFound >= 5) break;
    }
  }

  if (linesFound === 0) {
    console.log('Nisam pronasao nijednu INSERT INTO tsp_posts liniju! Proveri da li se tabela mozda zove drugacije.');
  }
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
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

debug();
