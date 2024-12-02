import CarModel from "../models/CarModel.js";

// Obține anii disponibili
export const getYears = async (req, res) => {
  try {
    const years = await CarModel.distinct("year");
    if (!years.length) {
      return res.status(404).json({ message: "No years found in the database." });
    }
    res.status(200).json({ success: true, years });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch years", error: error.message });
  }
};

// Obține mărcile disponibile pentru un an
export const getMakes = async (req, res) => {
  const { year } = req.query;

  if (!year || isNaN(year)) {
    return res.status(400).json({ message: "Invalid or missing 'year' parameter." });
  }

  try {
    const makes = await CarModel.distinct("make", { year: Number(year) });
    if (!makes.length) {
      return res.status(404).json({ message: `No makes found for the year ${year}.` });
    }
    res.status(200).json({ success: true, makes });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch makes", error: error.message });
  }
};

// Obține modelele disponibile pentru un an și marcă
export const getModels = async (req, res) => {
  const { year, make } = req.query;

  if (!year || isNaN(year)) {
    return res.status(400).json({ message: "Invalid or missing 'year' parameter." });
  }

  if (!make) {
    return res.status(400).json({ message: "Missing 'make' parameter." });
  }

  try {
    const models = await CarModel.distinct("model", { year: Number(year), make });
    if (!models.length) {
      return res.status(404).json({ message: `No models found for the year ${year} and make '${make}'.` });
    }
    res.status(200).json({ success: true, models });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch models", error: error.message });
  }
};
