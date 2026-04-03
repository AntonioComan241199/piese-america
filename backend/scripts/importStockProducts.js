import mongoose from 'mongoose';
import csv from 'csv-parser';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import StockProduct from '../models/StockProduct.js';

await mongoose.connect(process.env.MONGODB_URI);

const results = [];
const csvPath = join(__dirname, '../scripts/produse-non-tecdoc.csv'); // ajustează dacă e altundeva

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    if (row.id && row.title) {
      results.push({
        code: row.code?.trim() || row.id,
        title: row.title?.trim(),
        slug: row.slug?.trim(),
        content: row.content?.trim(),
        short_description: row.short_description?.trim(),
        stock: ['in_stock','in_supplier_stock','not_in_stock'].includes(row.stock) ? row.stock : 'in_stock',
        active: row.active === 'active' ? 'active' : 'inactive',
        manufacturer_id: Number(row.manufacturer_id) || 0,
        catalog_id: Number(row.catalog_id) || 0,
        type: row.type?.trim(),
      });
    }
  })
  .on('end', async () => {
    try {
      await StockProduct.insertMany(results, { ordered: false });
      console.log(`✅ Importate ${results.length} produse`);
    } catch (err) {
      console.error('❌ Eroare import:', err.message);
    } finally {
      mongoose.disconnect();
    }
  });