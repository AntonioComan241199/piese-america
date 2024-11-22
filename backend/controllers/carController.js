// controllers/carController.js
import CarModel from "../models/CarModel.js";

// Endpoint pentru obținerea anilor disponibili
export const getYears = async (req, res) => {
  try {
    const years = await CarModel.distinct("year");
    res.status(200).json(years);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch years", error: error.message });
  }
};

// Endpoint pentru obținerea mărcilor în funcție de an
export const getMakes = async (req, res) => {
  const { year } = req.query;
  try {
    const makes = await CarModel.distinct("make", { year });
    res.status(200).json(makes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch makes", error: error.message });
  }
};

// Endpoint pentru obținerea modelelor în funcție de an și marcă
export const getModels = async (req, res) => {
  const { year, make } = req.query;
  try {
    const models = await CarModel.distinct("model", { year, make });
    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch models", error: error.message });
  }
};
