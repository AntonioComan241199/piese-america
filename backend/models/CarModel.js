import mongoose from "mongoose";

const CarModelSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  body_styles: { type: [String], required: false },
});

const CarModel = mongoose.model("all_cars_model", CarModelSchema);

export default CarModel;
