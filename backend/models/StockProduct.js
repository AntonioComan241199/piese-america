import mongoose from 'mongoose';

const StockProductSchema = new mongoose.Schema({
  code:              { type: String, required: true, unique: true },
  title:             { type: String, required: true },
  slug:              { type: String },
  content:           { type: String },
  short_description: { type: String },
  stock:             { type: String, enum: ['in_stock', 'in_supplier_stock', 'not_in_stock'], default: 'in_stock' },
  active:            { type: String, enum: ['active', 'inactive'], default: 'active' },
  manufacturer_id:   { type: Number },
  catalog_id:        { type: Number },
  type:              { type: String },
  image:             { type: String },
  first_page:        { type: Boolean, default: false },
  offer:             { type: Boolean, default: false },
  price:             { type: Number, default: 0 },
  currency:          { type: String, default: "RON" },
}, { timestamps: true });

export default mongoose.model('StockProduct', StockProductSchema);