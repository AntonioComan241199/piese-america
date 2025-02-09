import mongoose from "mongoose";

const oilProductSchema = new mongoose.Schema({
  customId: { type: String, unique: true, sparse: true },
  Title: { type: String, required: true },
  Type: { type: String, required: true },
  "Body (HTML)": { type: String, required: false },
  "Image Src": { type: String, required: true },
  "Variant Image": { type: String, required: false },
  "Variant Price": { type: String, required: true },
  "Option1 Value": { type: String, required: false },
  "SEO Title": { type: String, required: false },
  "SEO Description": { type: String, required: false },
  "Utilizare": { type: String, required: false }, // Schimbăm denumirea pentru a evita eroarea
  source: { type: String, enum: ["imported", "manual"], default: "imported" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: "oil_products", timestamps: true });

const OilProduct = mongoose.model("oil_product", oilProductSchema);
export default OilProduct;
