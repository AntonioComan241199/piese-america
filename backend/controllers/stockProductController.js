import StockProduct from '../models/StockProduct.js';
import fs from 'fs';

export const getAll = async (req, res) => {
  try {
    const { search = "", manufacturer = "", catalog = "", page = 1, limit = 12 } = req.query;

    let filter = { active: "active" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } }
      ];
    }

    if (manufacturer) filter.manufacturer_id = manufacturer;
    if (catalog) filter.catalog_id = catalog;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await StockProduct.find(filter).skip(skip).limit(limitNum);
    const total = await StockProduct.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Eroare server" });
  }
};

export const getOne = async (req, res) => {
  try {
    const product = await StockProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produs negasit' });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`; // ← fix
    const product = await StockProduct.create(data);
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`; // ← fix
    const product = await StockProduct.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ error: 'Produs negasit' });
    res.json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const remove = async (req, res) => {
  try {
    const product = await StockProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produs negasit' });
    if (product.image) fs.unlink(product.image, () => {});
    res.json({ message: 'Produs sters' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const importCSV = async (req, res) => {
  try {
    const products = req.body.products;
    await StockProduct.insertMany(products, { ordered: false });
    res.json({ message: `${products.length} produse importate` });
  } catch (err) { res.status(400).json({ error: err.message }); }
};