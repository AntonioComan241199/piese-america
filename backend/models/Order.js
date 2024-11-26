import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    text: { type: String, required: true }, // Textul comentariului
    date: { type: Date, default: Date.now }, // Data adăugării comentariului
    user: { type: String, required: true }, // Utilizatorul care a adăugat comentariul
});

const OrderSchema = new mongoose.Schema({
    firstName: { type: String, required: true }, // Prenumele clientului
    lastName: { type: String, required: true },  // Numele clientului
    email: { type: String, required: true },     // Email-ul clientului
    phoneNumber: { type: String, required: true }, // Telefonul clientului
    carMake: { type: String, required: true },   // Marca mașinii
    carModel: { type: String, required: true },  // Modelul mașinii
    carYear: { type: Number, required: true },   // Anul de fabricație al mașinii
    fuelType: { type: String, required: true },    // Motorizare
    engineSize: { type: Number, required: true }, // Capacitate cilindrică
    transmission: { type: String, required: true }, // Cutie de vite
    vin : { type: String, required: true }, // Numărul de identificare al vehiculului
    partDetails: { type: String, required: true }, // Detalii piesă comandată
    status: { type: String, default: 'pending' }, // Statusul comenzii (pending, processed, completed)
    orderDate: { type: Date, default: Date.now }, // Data la care s-a plasat comanda
    comments: [CommentSchema], // Adaugă câmpul comments
});


const Order = mongoose.model('Order', OrderSchema);

export default Order;