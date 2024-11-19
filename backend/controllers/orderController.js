import Order from '../models/Order.js'; // Importăm modelul Order

// 1. Creare comandă nouă
export const createOrder = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phoneNumber,
            carMake,
            carModel,
            carYear,
            engine,
            partDetails,
        } = req.body;

        // Creăm o comandă nouă pe baza datelor primite
        const newOrder = new Order({
            firstName,
            lastName,
            email,
            phoneNumber,
            carMake,
            carModel,
            carYear,
            engine,
            partDetails,
        });

        await newOrder.save(); // Salvăm comanda în baza de date
        res.status(201).json({ message: 'Comanda a fost creată cu succes!' });
    } catch (error) {
        console.error('Eroare la crearea comenzii:', error);
        res.status(500).json({ message: 'Eroare la crearea comenzii.' });
    }
};

// 2. Preluare toate comenzile (doar pentru admin)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find(); // Preluăm toate comenzile
        res.status(200).json(orders);
    } catch (error) {
        console.error('Eroare la preluarea comenzilor:', error);
        res.status(500).json({ message: 'Eroare la preluarea comenzilor.' });
    }
};

// 3. Preluare comenzile unui client (pe baza email-ului, după autentificare)
export const getClientOrders = async (req, res) => {
    try {
        const clientEmail = req.user.email; // Email-ul utilizatorului logat
        const orders = await Order.find({ email: clientEmail }); // Filtrăm comenzile după email
        res.status(200).json(orders);
    } catch (error) {
        console.error('Eroare la preluarea comenzilor clientului:', error);
        res.status(500).json({ message: 'Eroare la preluarea comenzilor.' });
    }
};

// 4. Actualizare status comandă (de ex. pending -> processed)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID-ul comenzii
        const { status } = req.body; // Statusul nou

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true } // Returnăm comanda actualizată
        );

        if (!order) {
            return res.status(404).json({ message: 'Comanda nu a fost găsită.' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Eroare la actualizarea statusului comenzii:', error);
        res.status(500).json({ message: 'Eroare la actualizarea statusului comenzii.' });
    }
};

// 5. Ștergere comandă
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params; // ID-ul comenzii

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({ message: 'Comanda nu a fost găsită.' });
        }

        res.status(200).json({ message: 'Comanda a fost ștearsă cu succes!' });
    } catch (error) {
        console.error('Eroare la ștergerea comenzii:', error);
        res.status(500).json({ message: 'Eroare la ștergerea comenzii.' });
    }
};
