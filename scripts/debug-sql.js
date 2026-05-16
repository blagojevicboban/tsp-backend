const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE = path.join(__dirname, '../backup.sql');

async function debug() {
  console.log('DEBUG v2: Detaljna analiza backup.sql...');
  
  if (!fs.existsSync(SQL_FILE)) {
    console.error('Fajl backup.sql nije pronadjen!');
    return;
  }

  const fileStream = fs.createReadStream(SQL_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inTable = false;
  let linesProcessed = 0;
  let rowsFound = 0;

  for await (const line of rl) {
    linesProcessed++;
    
    // Detektuj pocetak INSERT-a za tsp_posts
    if (line.includes('INSERT INTO') && line.includes('tsp_posts')) {
      inTable = true;
      console.log(`\nPronasao sam pocetak tabele na liniji ${linesProcessed}`);
      continue;
    }

    if (inTable) {
      // Svaki red podataka pocinje sa ( i zavrsava sa ), ili );
      const trimLine = line.trim();
      if (trimLine.startsWith('(')) {
        rowsFound++;
        const parts = parseSqlRow(trimLine);
        
        if (rowsFound <= 10) {
          console.log(`Red ${rowsFound}: Kolone=${parts.length}, Tip="${parts[20]}", Naslov="${parts[5]?.substring(0, 40)}..."`);
        }

        if (rowsFound === 10) {
          console.log('... i tako dalje ...');
        }
      }

      // Ako linija zavrsava sa ; to je kraj INSERT bloka
      if (trimLine.endsWith(';')) {
        inTable = false;
        console.log(`Zavrsen blok podataka. Pronadjeno ${rowsFound} redova.`);
        if (rowsFound >= 50) break;
      }
    }

    if (linesProcessed % 100000 === 0) {
      process.stdout.write('.');
    }
  }

  if (rowsFound === 0) {
    console.log('\nNije pronadjen nijedan red podataka! Mozda je format fajla drugaciji.');
  }
}

function parseSqlRow(row) {
  // Skidamo ( na pocetku i ), ili ); na kraju
  let content = row.trim();
  if (content.startsWith('(')) content = content.slice(1);
  if (content.endsWith('),')) content = content.slice(0, -2);
  if (content.endsWith(');')) content = content.slice(0, -2);
  
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
