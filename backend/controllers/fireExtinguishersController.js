import FireExtinguisher from "../models/fireExtinguisherModel.js";
import { JSDOM } from "jsdom";


const stripHtml = (html) => {
  if (!html) return "";
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent || "";
};

// Obține toate stingătoarele
const getAllFireExtinguishers = async (req, res) => {
  try {
    const products = await FireExtinguisher.find();
    const formattedProducts = products.map((product) => ({
      ...product._doc,
      Usage: product.Usage || "",
    }));
    res.json(formattedProducts);
  } catch (error) {
    console.error("❌ Eroare la obținerea stingătoarelor:", error);
    res.status(500).json({ error: "Eroare la obținerea stingătoarelor" });
  }
};

// Adaugă un stingător (Admin)
const addFireExtinguisher = async (req, res) => {
  try {
    const { Title, Type, Description, ...restData } = req.body;
    
    // Validare și curățare date
    const cleanedData = {
      Title: Title.trim(),
      Type: Type.trim(),
      Description: Description.trim(),
      ...restData
    };

    const newProduct = new FireExtinguisher(cleanedData);
    await newProduct.save();
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Eroare la adăugarea produsului:", error);
    res.status(500).json({ error: "Eroare la adăugarea produsului" });
  }
};

// Șterge un stingător
const deleteFireExtinguisher = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await FireExtinguisher.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Stingătorul nu a fost găsit." });
    }

    res.json({ message: "Stingător șters cu succes." });
  } catch (error) {
    console.error("Eroare la ștergerea stingătorului:", error);
    res.status(500).json({ error: "Eroare la ștergerea stingătorului." });
  }
};

// Actualizează un stingător
const updateFireExtinguisher = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await FireExtinguisher.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: "Stingătorul nu a fost găsit." });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Eroare la actualizare:", error);
    res.status(500).json({ error: "Eroare la actualizare." });
  }
};

const uploadImage = (req, res) => {
  console.log("Request primit pentru upload");
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Files:", req.files);
  console.log("File:", req.file);
  console.log("Body:", req.body);

  try {
    if (!req.file) {
      console.log("Nu s-a primit niciun fișier");
      return res.status(400).json({ error: "Nicio imagine încărcată." });
    }

    console.log("🔹 Imagine încărcată:", req.file.filename);
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log("URL imagine:", imageUrl);
    
    return res.json({ imageUrl });
  } catch (error) {
    console.error("❌ Eroare la încărcarea imaginii:", error);
    return res.status(500).json({ error: "Eroare la încărcarea imaginii." });
  }
};

export { 
  getAllFireExtinguishers, 
  addFireExtinguisher, 
  updateFireExtinguisher, 
  deleteFireExtinguisher, 
  uploadImage 
};