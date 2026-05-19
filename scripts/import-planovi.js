const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../.tmp/data.db');
const db = new DatabaseSync(DB_FILE);

const PLANOVI_SRC_DIR = 'C:\\tsp\\tspedurs\\public\\planovi';
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(PLANOVI_SRC_DIR)) {
  console.error('Planovi source directory not found:', PLANOVI_SRC_DIR);
  process.exit(1);
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const plansMapping = {
  // Plans by grade/profile
  '1_12 - TIT.pdf': {
    naziv: 'Техничар информационих технологија (ИТ) - 1. и 2. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '1_34 - ETIT.pdf': {
    naziv: 'Техничар информационих технологија (ИТ) - 3. и 4. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '2_12 - EDV.pdf': {
    naziv: 'Електротехничар за електронику на возилима - 1. и 2. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '2_34 - ETOIE.pdf': {
    naziv: 'Електротехничар обновљивих извора енергије - 3. и 4. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '3_123 - TM.pdf': {
    naziv: 'Техничар мехатронике - 1, 2. и 3. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '3_4 - TM.pdf': {
    naziv: 'Техничар мехатронике - 4. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '4_12 - TKUCNC.pdf': {
    naziv: 'Техничар за компјутерско управљање (ЦНЦ) машина - 1. и 2. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '4_34 - TKUCNC.pdf': {
    naziv: 'Техничар за компјутерско управљање (ЦНЦ) машина - 3. и 4. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '5 - TDS.pdf': {
    naziv: 'Техничар друмског саобраћаја - Комплетан план',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '6_12 - VMV.PDF': {
    naziv: 'Возач моторних возила - 1. и 2. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '6_12 - VMV.pdf': {
    naziv: 'Возач моторних возила - 1. и 2. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  '6_3 - VMV.pdf': {
    naziv: 'Возач моторних возила - 3. разред',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },

  // Complete/special subject plans
  'informatika.pdf': {
    naziv: 'Информатика',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  },
  'tit_sp_12_2024.pdf': {
    naziv: 'Техничар ИТ (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2024-12-01'
  },
  'tm_8_2023.pdf': {
    naziv: 'Техничар мехатронике (8_2023)',
    kategorija: 'планови-и-програми',
    datum: '2023-08-01'
  },
  'tm_sp_13_2020.pdf': {
    naziv: 'Техничар мехатронике (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2020-03-01'
  },
  'TKU CNC masina PPNU strucni predmeti 2020.pdf': {
    naziv: 'ЦНЦ Машине (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2020-01-01'
  },
  'etit_sp_09_2020.pdf': {
    naziv: 'Аутомеханичар (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2020-09-01'
  },
  'etoie_sp_5_2017.pdf': {
    naziv: 'Обновљиви извори енергије (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2017-05-01'
  },
  'teh_drum_saob_sp_8_2018.pdf': {
    naziv: 'Техничар друмског саобраћаја (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2018-08-01'
  },
  'vmv_oo_8_2018.pdf': {
    naziv: 'Возач моторних возила (стручни предмети)',
    kategorija: 'планови-и-програми',
    datum: '2018-08-01'
  },

  // Other unlisted files
  'PG_013_2024_008.pdf': {
    naziv: 'Уписни планови (PG_013_2024_008)',
    kategorija: 'планови-и-програми',
    datum: '2024-01-01'
  },
  'Planovi i programi 2025-26.pdf': {
    naziv: 'Планови и програми школе 2025-26',
    kategorija: 'планови-и-програми',
    datum: '2025-09-01'
  }
};

function generateDocumentId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizeForHash(filename) {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
}

function run() {
  console.log('--- STARTING PLAN IMPORT TO STRAPI ---');
  
  const filesInDir = fs.readdirSync(PLANOVI_SRC_DIR);
  console.log(`Found ${filesInDir.length} files in ${PLANOVI_SRC_DIR}.`);

  let importedCount = 0;

  for (const filename of filesInDir) {
    if (!filename.toLowerCase().endsWith('.pdf')) {
      continue;
    }

    const mapping = plansMapping[filename] || {
      naziv: filename.replace('.pdf', ''),
      kategorija: 'планови-и-програми',
      datum: '2025-09-01'
    };

    const filePath = path.join(PLANOVI_SRC_DIR, filename);
    const stat = fs.statSync(filePath);
    const fileSizeKb = stat.size / 1024;

    // Check if the file is already uploaded
    const checkFile = db.prepare("SELECT id, hash FROM files WHERE name = ?").all(filename);
    let fileId;
    let fileHash;

    const now = Date.now();

    if (checkFile.length > 0) {
      fileId = checkFile[0].id;
      fileHash = checkFile[0].hash;
      console.log(`[-] File '${filename}' already exists in Strapi files table (ID: ${fileId}). Skipping file copy/insert.`);
    } else {
      // Generate a unique hash and copy the file
      const cleanBase = sanitizeForHash(filename);
      const randomSuffix = Math.random().toString(36).substring(2, 12);
      fileHash = `${cleanBase}_${randomSuffix}`;
      const destFilename = `${fileHash}.pdf`;
      const destPath = path.join(UPLOADS_DIR, destFilename);

      fs.copyFileSync(filePath, destPath);
      console.log(`[+] Copied '${filename}' to uploads as '${destFilename}'.`);

      // Insert file record
      const fileDocId = generateDocumentId();
      const insertFile = db.prepare(`
        INSERT INTO files (
          document_id, name, alternative_text, caption, focal_point, 
          width, height, formats, hash, ext, mime, size, url, 
          preview_url, provider, provider_metadata, folder_path, 
          created_at, updated_at, published_at, created_by_id, updated_by_id, locale
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const fileResult = insertFile.run(
        fileDocId,
        filename,
        null, // alternative_text
        null, // caption
        null, // focal_point
        null, // width
        null, // height
        null, // formats
        fileHash,
        '.pdf',
        'application/pdf',
        fileSizeKb,
        `/uploads/${destFilename}`,
        null, // preview_url
        'local',
        null, // provider_metadata
        '/1',
        now,
        now,
        now,
        null,
        null,
        null
      );

      // get last_insert_rowid()
      const rowIdQuery = db.prepare("SELECT last_insert_rowid() as id");
      fileId = rowIdQuery.all()[0].id;
      console.log(`[+] Inserted file record in 'files' (ID: ${fileId}).`);
    }

    // Now check if a document with this title already exists in 'dokumenta'
    const checkDoc = db.prepare("SELECT id FROM dokumenta WHERE naziv = ?").all(mapping.naziv);
    if (checkDoc.length > 0) {
      console.log(`[-] Document '${mapping.naziv}' already exists (ID: ${checkDoc[0].id}). Skipping document insertion.`);
      continue;
    }

    // Generate document_id for the draft and published entries
    const docId = generateDocumentId();

    const insertDoc = db.prepare(`
      INSERT INTO dokumenta (
        document_id, naziv, kategorija, datum, 
        created_at, updated_at, published_at, 
        created_by_id, updated_by_id, locale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Insert Draft Row
    const draftRes = insertDoc.run(
      docId,
      mapping.naziv,
      mapping.kategorija,
      mapping.datum,
      now,
      now,
      null, // published_at is null for draft
      null,
      null,
      null
    );
    const draftRowId = db.prepare("SELECT last_insert_rowid() as id").all()[0].id;

    // 2. Insert Published Row
    const pubRes = insertDoc.run(
      docId,
      mapping.naziv,
      mapping.kategorija,
      mapping.datum,
      now,
      now,
      now, // published_at is populated
      null,
      null,
      null
    );
    const pubRowId = db.prepare("SELECT last_insert_rowid() as id").all()[0].id;

    console.log(`[+] Created Draft (ID: ${draftRowId}) & Published (ID: ${pubRowId}) records in 'dokumenta'.`);

    // 3. Link files in files_related_mph for both Draft and Published rows
    const insertRelation = db.prepare(`
      INSERT INTO files_related_mph (
        file_id, related_id, related_type, field, [order]
      ) VALUES (?, ?, ?, ?, ?)
    `);

    insertRelation.run(fileId, draftRowId, 'api::dokument.dokument', 'fajl', 1.0);
    insertRelation.run(fileId, pubRowId, 'api::dokument.dokument', 'fajl', 1.0);

    console.log(`[+] Linked file ID ${fileId} to dokument IDs ${draftRowId} and ${pubRowId}.`);
    importedCount++;
  }

  console.log(`\n--- IMPORT COMPLETED: ${importedCount} plans imported successfully! ---`);
}

run();
db.close();
