import CatalogOrder from '../models/CatalogOrder.js';
import StockProduct from '../models/StockProduct.js';
import { CatalogOrderEmailService } from "../services/CatalogOrderEmailService.js";

const catalogOrderEmailService = new CatalogOrderEmailService();

export const createCatalogOrder = async (req, res) => {
  try {
    const { items, ...orderData } = req.body;

    // Convertim toate valorile numerice
    const sanitizedItems = items.map(item => ({
      ...item,
      price: Number(item.price),
      qty: Number(item.qty)
    }));

    const orderCount = await CatalogOrder.countDocuments();
    const orderNumber = `CAT-${1000 + orderCount}`;

    const newOrder = new CatalogOrder({
      ...orderData,
      items: sanitizedItems,
      orderNumber,
      userId: req.user.id,
      totalAmount: Number(orderData.totalAmount)
    });

    await newOrder.save();
    try {
      await catalogOrderEmailService.sendNewOrderToCustomer(newOrder);
      await catalogOrderEmailService.sendNewOrderToAdmin(newOrder);
    } catch (emailError) {
      console.error("Eroare trimitere email comandă nouă:", emailError.message);
    }

    // Actualizare stoc SIGURĂ
    for (const item of sanitizedItems) {
      try {
        const qty = Number(item.qty);
        if (!isNaN(qty) && qty > 0 && item.productId) {
          await StockProduct.findByIdAndUpdate(item.productId, {
            $inc: { stock: -qty }
          });
        }
      } catch (updateError) {
        console.error('Eroare stoc:', updateError.message);
      }
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Eroare creare comandă:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserCatalogOrders = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log("Căutăm comenzi pentru User ID logat:", currentUserId);

    // Folosim userId (așa cum apare în JSON-ul tău din DB)
    const orders = await CatalogOrder.find({ userId: currentUserId }).sort({ createdAt: -1 });
    
    console.log(`Am găsit ${orders.length} comenzi pentru acest utilizator.`);

    res.status(200).json(orders);
  } catch (error) {
    console.error("Eroare la recuperarea comenzilor:", error);
    res.status(500).json({ message: "Eroare la recuperarea comenzilor." });
  }
};

export const getAdminCatalogOrders = async (req, res) => {
  try {
    const orders = await CatalogOrder.find().sort({ createdAt: -1 });
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCatalogOrderById = async (req, res) => {
  try {
    const order = await CatalogOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Comanda nu există" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCatalogOrderStatus = async (req, res) => {
  try {
    const order = await CatalogOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Comanda nu există" });
    }

    const oldStatus = order.status;
    order.status = req.body.status;

    await order.save();

    if (oldStatus !== order.status) {
      try {
        await catalogOrderEmailService.sendOrderStatusUpdateToCustomer(order);
      } catch (emailError) {
        console.error("Eroare trimitere email status comandă:", emailError.message);
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCatalogOrderItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items trebuie să fie un array.' });
    }

    const order = await CatalogOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Comanda nu există' });
    }

    const sanitizedItems = items.map((item) => ({
      productId: item.productId || null,
      code: item.code || '',
      title: item.title || '',
      price: Number(item.price) || 0,
      qty: Math.max(1, Number(item.qty) || 1),
      image: item.image || '',
    }));

    const totalAmount = sanitizedItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
      0
    );

    order.items = sanitizedItems;
    order.totalAmount = totalAmount;

    await order.save();

    return res.status(200).json(order);
  } catch (error) {
    console.error('Eroare actualizare produse comandă:', error);
    return res.status(500).json({ message: error.message });
  }
};