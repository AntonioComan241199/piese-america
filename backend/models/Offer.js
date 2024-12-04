import mongoose from "mongoose";

// Schema pentru opțiunile unei piese
const OptionSchema = new mongoose.Schema({
  manufacturer: { type: String, required: true }, // Producătorul piesei
  price: { type: Number, required: true }, // Prețul opțiunii
  description: { type: String }, // Descriere opțională
});




// Schema pentru piesele din ofertă
const PartSchema = new mongoose.Schema({
  partCode: { type: String, required: true }, // Codul piesei
  partType: { type: String, required: true }, // Tipul piesei
  manufacturer: { type: String, required: true }, // Producătorul piesei
  pricePerUnit: {
    type: Number,
    required: true,
    min: [0.01, "Prețul trebuie să fie pozitiv și mai mare decât zero."],
  }, // Prețul per unitate
  quantity: {
    type: Number,
    required: true,
    min: [1, "Cantitatea trebuie să fie cel puțin 1."],
  }, // Cantitatea
  total: { type: Number, required: true }, // Total calculat
  options: {
    type: [OptionSchema],
    default: [], // Asigură-te că este întotdeauna un array
  },
  selectedOption: { type: mongoose.Schema.Types.ObjectId, ref: "Option" }, // Opțiunea selectată de client
});

PartSchema.virtual("selectedOptionDetails", {
  ref: "Option",
  localField: "selectedOption",
  foreignField: "_id",
  justOne: true,
});


// Schema pentru piesele selectate
const SelectedPartSchema = new mongoose.Schema({
  partCode: { type: String, required: true },
  partType: { type: String, required: true },
  manufacturer: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
  selectedOption: { type: mongoose.Schema.Types.ObjectId, ref: "Option", required: true },
});

// Schema pentru ofertă
const OfferSchema = new mongoose.Schema({
  offerNumber: { type: Number, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  parts: [PartSchema], // Lista pieselor și opțiunilor
  selectedParts: [SelectedPartSchema], // Piesele selectate de client
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["proiect", "trimisa", "comanda_spre_finalizare", "oferta_acceptata", "oferta_respinsa"],
    default: "proiect",
  },
  billingAddress: {
    street: { type: String },
    number: { type: String },
    block: { type: String },
    entrance: { type: String },
    apartment: { type: String },
    county: { type: String },
    city: { type: String },
  },
  deliveryAddress: {
    street: { type: String },
    number: { type: String },
    block: { type: String },
    entrance: { type: String },
    apartment: { type: String },
    county: { type: String },
    city: { type: String },
  },
  pickupAtCentral: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


OfferSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});


OfferSchema.index({ status: 1 });
OfferSchema.index({ orderId: 1 });


// Middleware pentru generarea automată a `offerNumber`
OfferSchema.pre("save", async function (next) {
  this.updatedAt = Date.now();
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
