import mongoose from "mongoose";

const fireExtinguisherSchema = new mongoose.Schema({
  Title: { 
    type: String, 
    required: true,
    trim: true // Adăugăm trim pentru a curăța automat spațiile
  },
  Type: { 
    type: String, 
    required: true,
    trim: true 
  },
  "Image Src": { 
    type: String, 
    required: false 
  },
  Description: { 
    type: String, 
    required: true,
    trim: true 
  },
  "Option1 Value": { 
    type: String, 
    required: true,
    trim: true 
  },
  "Variant Price": { 
    type: Number, 
    required: true,
    min: [0, 'Prețul nu poate fi negativ'],
    set: v => Math.round(v * 100) / 100 // Rotunjește la 2 zecimale
  },
  Usage: { 
    type: String, 
    required: false,
    trim: true 
  }
}, { 
  timestamps: true 
});

// Middleware pre-save pentru a asigura curățarea datelor
fireExtinguisherSchema.pre('save', function(next) {
  // Verificăm dacă titlul a fost modificat
  if (this.isModified('Title')) {
    // Eliminăm spațiile multiple și la început/sfârșit
    this.Title = this.Title.trim().replace(/\s+/g, ' ');
  }
  next();
});

export default mongoose.model("FireExtinguisher", fireExtinguisherSchema);