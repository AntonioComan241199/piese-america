import Order from "../models/Order.js";
import { createLog } from "../utils/createLog.js";

// 1. Creare comandă nouă
export const createOrder = async (req, res) => {
    try {
        console.log("req.user in createOrder:", req.user); // Debugging

        const order = new Order(req.body); // Creează o comandă nouă cu datele primite
        await order.save(); // Salvează comanda în baza de date

        // Creează log doar dacă utilizatorul este autentificat
        if (req.user?.id) {
            await createLog({
                action: "Order Created",
                userId: req.user.id,
                orderId: order._id,
                details: `Order created for ${order.carMake} ${order.carModel}`,
            });
        } else {
            console.warn("Utilizator neautentificat. Log-ul nu a fost creat.");
        }

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error("Error in createOrder:", error); // Debugging
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

// 6. Preluare detalii comandă după ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params; // Extrage ID-ul comenzii din URL
        const order = await Order.findById(id); // Găsește comanda în baza de date

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error in getOrderById:", error); // Debugging
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Adăugare comentariu la comandă
export const addCommentToOrder = async (req, res) => {
    try {
        const { id } = req.params; // ID-ul comenzii
        const { text, user } = req.body; // Textul comentariului și utilizatorul care l-a adăugat

        if (!text || !user) {
            return res.status(400).json({ success: false, message: "Textul și utilizatorul sunt obligatorii!" });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Comanda nu a fost găsită!" });
        }

        // Adaugă comentariul în array-ul de comentarii
        order.comments.push({ text, user });
        await order.save();

        res.status(200).json({ success: true, data: order.comments });
    } catch (error) {
        console.error("Error in addCommentToOrder:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
