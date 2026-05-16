const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

async function compare() {
  console.log('Upoređujem novu vest (1043) i staru vest (1)...');
  
  const nova = db.prepare('SELECT * FROM vests WHERE id = 1043').get();
  const stara = db.prepare('SELECT * FROM vests WHERE id = 1').get();
  
  if (!nova || !stara) {
    console.log('Greska: Nisam nasao jednu od vesti.');
    return;
  }

  console.log('\n--- RAZLIKE ---');
  Object.keys(nova).forEach(key => {
    if (nova[key] !== stara[key]) {
      console.log(`Polje: ${key}`);
      console.log(`  Nova (1043): ${nova[key]}`);
      console.log(`  Stara (1):   ${stara[key]}`);
    }
  });

  db.close();
}

compare().catch(err => console.error('Greska:', err));
