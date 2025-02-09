import OilProduct from "../models/oilProductsModel.js";
import { v4 as uuidv4 } from "uuid";
import { JSDOM } from "jsdom";

// Funcție pentru eliminarea HTML-ului din Body (HTML)
const stripHtml = (html) => {
  if (!html) return "";
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
};

// Obține toate produsele
const getAllOilProducts = async (req, res) => {
  try {
    const products = await OilProduct.find();

    // Unificăm câmpul de "Utilizare"
    const formattedProducts = products.map((product) => ({
      ...product._doc,
      Utilizare: product.Utilizare || "",
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error("❌ Eroare la obținerea produselor:", error);
    res.status(500).json({ error: "Eroare la obținerea produselor" });
  }
};

// Adaugă un produs (Admin)
const addOilProduct = async (req, res) => {
  try {
    console.log("🔹 Request primit pentru adăugare produs:", req.body, req.file);

    const { Title, Type, "Variant Price": VariantPrice } = req.body;
    const ImageSrc = req.file ? `/uploads/${req.file.filename}` : req.body["Image Src"];

    if (!Title || !Type || !VariantPrice || !ImageSrc) {
      return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate." });
    }

    const newProduct = new OilProduct({
      Title,
      Type,
      "Variant Price": VariantPrice,
      "Image Src": ImageSrc, // Salvăm calea imaginii
      "Variant Image": req.body["Variant Image"] || ImageSrc, // Dacă nu există, folosim aceeași imagine
      "Option1 Value": req.body["Option1 Value"] || "",
      "Body (HTML)": req.body["Body (HTML)"] || "",
      Utilizare: req.body["Utilizare"] || "",
      source: "manual",
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("❌ Eroare la adăugarea produsului:", error);
    res.status(500).json({ error: "Eroare la adăugarea produsului" });
  }
};

// Șterge un produs
const deleteOilProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await OilProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Produsul nu a fost găsit." });
    }

    res.json({ message: "Produs șters cu succes." });
  } catch (error) {
    console.error("Eroare la ștergerea produsului:", error);
    res.status(500).json({ error: "Eroare la ștergerea produsului." });
  }
};

// Actualizează un produs
const updateOilProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { Title, "Body (HTML)": BodyHTML } = req.body;

    const updatedData = {
      ...req.body,
      "SEO Title": req.body["SEO Title"] || Title,
      "SEO Description": req.body["SEO Description"] || stripHtml(BodyHTML).substring(0, 160),
    };

    const updatedProduct = await OilProduct.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: "Produsul nu a fost găsit." });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Eroare la actualizare:", error);
    res.status(500).json({ error: "Eroare la actualizare." });
  }
};

// **🔹 Funcția pentru upload imagini**
const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nicio imagine încărcată." });
    }

    console.log("🔹 Imagine încărcată:", req.file.filename);
    
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error("❌ Eroare la încărcarea imaginii:", error);
    res.status(500).json({ error: "Eroare la încărcarea imaginii." });
  }
};

// 🔹 **Exportăm toate funcțiile corect**
export { getAllOilProducts, addOilProduct, updateOilProduct, deleteOilProduct, uploadImage };
