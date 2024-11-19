import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    firstName: { type: String, required: true }, // Prenumele clientului
    lastName: { type: String, required: true },  // Numele clientului
    email: { type: String, required: true },     // Email-ul clientului
    phoneNumber: { type: String, required: true }, // Telefonul clientului
    carMake: { type: String, required: true },   // Marca mașinii
    carModel: { type: String, required: true },  // Modelul mașinii
    carYear: { type: Number, required: true },   // Anul de fabricație al mașinii
    engine: { type: String, required: true },    // Motorizare
    partDetails: { type: String, required: true }, // Detalii piesă comandată
    status: { type: String, default: 'pending' }, // Statusul comenzii (pending, processed, completed)
    orderDate: { type: Date, default: Date.now }, // Data la care s-a plasat comanda
});


const Order = mongoose.model('Order', OrderSchema);

export default Order;