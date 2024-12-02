import mongoose from "mongoose";

// Schema pentru opțiunile unei piese
const OptionSchema = new mongoose.Schema({
  manufacturer: { type: String, required: true }, // Producătorul piesei
  price: { type: Number, required: true }, // Prețul opțiunii
  description: { type: String }, // Descriere opțională
});

// Schema pentru piesele din ofertă
const PartSchema = new mongoose.Schema({
  partType: { type: String, required: true }, // Tipul piesei (ex.: "filtru ulei")
  options: [OptionSchema], // Lista de opțiuni pentru această piesă
  selectedOption: { type: mongoose.Schema.Types.ObjectId, ref: "Option" }, // Opțiunea selectată de client
});

// Schema pentru ofertă
const OfferSchema = new mongoose.Schema({
  offerNumber: { type: Number, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  parts: [PartSchema], // Lista pieselor și opțiunilor
  total: { type: Number, default: 0 }, // Totalul va fi calculat doar după selecția clientului
  status: {
    type: String,
    enum: ["proiect", "trimisa", "comanda_spre_finalizare", "finalizat"],
    default: "proiect",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware pentru generarea automată a `offerNumber`
OfferSchema.pre("save", async function (next) {
  if (!this.offerNumber) {
    const Counter = mongoose.model("Counter"); // Model pentru contor
    const counter = await Counter.findOneAndUpdate(
      { name: "offerNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    this.offerNumber = counter.value;
  }
  next();
});

const Offer = mongoose.model("Offer", OfferSchema);

export default Offer;
