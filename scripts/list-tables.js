const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new Database(DB_FILE);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Sve tabele u bazi:');
tables.forEach(t => console.log(`- ${t.name}`));

db.close();
