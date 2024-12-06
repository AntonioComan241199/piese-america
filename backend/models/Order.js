import mongoose from "mongoose";

// Schema pentru comentarii
const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true }, // Textul comentariului
  date: { type: Date, default: Date.now }, // Data adăugării comentariului
  user: { type: String, required: true }, // Utilizatorul care a adăugat comentariul
});

// Schema pentru cereri
const OrderSchema = new mongoose.Schema({
  orderNumber: { type: Number, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userType: { type: String, enum: ["persoana_fizica", "persoana_juridica"], required: true },
  firstName: { type: String }, // Prenume (pentru persoana fizică)
  lastName: { type: String },  // Nume (pentru persoana fizică)
  companyDetails: {
    companyName: { type: String }, // Numele companiei (persoană juridică)
    cui: { type: String },         // Cod unic de înregistrare (persoană juridică)
    nrRegCom: { type: String },    // Nr. Registrul Comerțului (persoană juridică)
  },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  carMake: { type: String, required: true },
  carModel: { type: String, required: true },
  carYear: { type: Number, required: true },
  fuelType: { type: String, required: true },
  enginePower: { type: Number, required: true },
  engineSize: { type: Number, required: true },
  transmission: { type: String, required: true },
  vin: { type: String, required: true },
  partDetails: { type: String, required: true },
  status: {
    type: String,
    enum: ["asteptare_oferta", "ofertat", "comanda_spre_finalizare", "oferta_acceptata", "oferta_respinsa", "livrare_in_procesare", "livrata", "anulata"],
    default: "asteptare_oferta",
  },
  orderDate: { type: Date, default: Date.now },
  comments: [CommentSchema],
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
});



// Middleware pentru generarea automată a `orderNumber`
OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const Counter = mongoose.model("Counter"); // Model pentru contor
    const counter = await Counter.findOneAndUpdate(
      { name: "orderNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    this.orderNumber = counter.value;
  }
  next();
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
