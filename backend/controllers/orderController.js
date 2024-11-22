import Order from "../models/Order.js";
import { createLog } from "../utils/createLog.js";

// 1. Creare comandă nouă
export const createOrder = async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();

        // Creează log după salvarea comenzii
        await createLog({
            action: "Order Created",
            userId: req.user._id, // Utilizează _id în loc de id
            orderId: order._id,
            details: `Order created for ${order.carMake} ${order.carModel}`,
        });

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Preluare toate comenzile (doar pentru admin)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find(); // Găsește toate comenzile
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Preluare comenzile unui client (pe baza email-ului, după autentificare)
export const getClientOrders = async (req, res) => {
    try {
        console.log("User info:", req.user); // Loghează utilizatorul autenticat
        const clientEmail = req.user.email;
        const orders = await Order.find({ email: clientEmail });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// 4. Actualizare status comandă (de ex. pending -> processed)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID-ul comenzii din URL
        const { status } = req.body; // Statusul nou din corpul requestului

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true } // Returnează comanda actualizată
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Creează log pentru actualizarea statusului comenzii
        await createLog({
            action: "Order Status Updated",
            userId: req.user.id, // presupunem că middleware-ul de autentificare a adăugat utilizatorul în req
            orderId: order._id,
            details: `Order status changed to ${status}`,
        });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Ștergere comandă
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params; // ID-ul comenzii din URL
        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Creează log pentru ștergerea comenzii
        await createLog({
            action: "Order Deleted",
            userId: req.user.id, // presupunem că middleware-ul de autentificare a adăugat utilizatorul în req
            orderId: order._id,
            details: `Order for ${order.carMake} ${order.carModel} was deleted`,
        });

        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
