import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true },
});

const Counter = mongoose.model("Counter", CounterSchema);

export default Counter;
