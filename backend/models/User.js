import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true }, // Email unic
  password: { type: String, required: true }, // Parola hashuită
  phone: { type: String }, // Telefon opțional
  firstName: { type: String }, // Prenume pentru persoană fizică
  lastName: { type: String }, // Nume pentru persoană fizică
  userType: { type: String, enum: ["persoana_fizica", "persoana_juridica"], required: true }, // Tip utilizator
  companyDetails: {
    companyName: { type: String }, // Numele firmei (doar pentru persoană juridică)
    cui: { type: String }, // Cod unic de înregistrare
    nrRegCom: { type: String }, // Număr Registrul Comerțului
  },
  role: { type: String, enum: ["client", "admin"], default: "client" }, // Rol (client sau admin)
  refreshToken: { type: String }, // Suport pentru Refresh Token
  billingAddress: {
    street: { type: String },
    number: { type: String },
    block: { type: String },
    entrance: { type: String },
    apartment: { type: String },
    county: { type: String },
    city: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware pentru actualizarea câmpului updatedAt
UserSchema.pre("save", function (next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// Middleware pentru hash-uirea parolei
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Metodă pentru validarea parolei
UserSchema.methods.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Validări specifice în funcție de userType
UserSchema.pre("save", function (next) {
  if (this.userType === "persoana_juridica") {
    if (!this.companyDetails.companyName || !this.companyDetails.cui || !this.companyDetails.nrRegCom) {
      throw new Error("Pentru persoanele juridice, este necesar să completați toate detaliile firmei.");
    }
  }
  next();
});

const User = mongoose.model("User", UserSchema);

export default User;
