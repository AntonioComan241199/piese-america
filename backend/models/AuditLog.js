import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
    action: { type: String, required: true }, // Ex.: "Order Status Updated", "User Login"
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Cine a efectuat acțiunea
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false }, // Dacă este legat de o comandă
    details: { type: String, required: false }, // Ex.: "Status changed to 'processed'"
    timestamp: { type: Date, default: Date.now }, // Data la care s-a efectuat acțiunea
});

const Log = mongoose.model('Log', LogSchema);

export default Log;
