import mongoose from 'mongoose';

const catalogOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockProduct' },
    title: String,
    code: String,
    price: Number,
    qty: Number
  }],
  totalAmount: { type: Number, required: true },
  userType: { type: String, enum: ['persoana_fizica', 'persoana_juridica'], required: true },
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  companyDetails: {
    companyName: String,
    cui: String,
    nrRegCom: String
  },
  billingAddress: {
    street: String, number: String, block: String, 
    entrance: String, apartment: String, county: String, city: String
  },
  deliveryAddress: {
    street: String, number: String, block: String, 
    entrance: String, apartment: String, county: String, city: String
  },
  pickupAtCentral: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['in_asteptare', 'pregatita', 'livrata', 'anulata'], 
    default: 'in_asteptare' 
  }
}, { timestamps: true });


// Auto-increment pentru orderNumber (opțional, poți folosi un utilitar existent)
const CatalogOrder = mongoose.model('CatalogOrder', catalogOrderSchema);

export default CatalogOrder;