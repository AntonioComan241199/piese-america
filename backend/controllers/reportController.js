import Report from '../models/Report.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Offer from '../models/Offer.js';

// Funcție pentru obținerea statisticilor în timp real
export const getRealtimeStats = async (req, res) => {
  try {
    // Calculează statisticile pentru utilizatori
    const totalUsers = await User.countDocuments();
    const usersByType = {
      persoana_fizica: await User.countDocuments({ userType: 'persoana_fizica' }),
      persoana_juridica: await User.countDocuments({ userType: 'persoana_juridica' })
    };
    const usersByRole = {
      client: await User.countDocuments({ role: 'client' }),
      admin: await User.countDocuments({ role: 'admin' })
    };
    
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    // Calculează statisticile pentru comenzi
    const totalOrders = await Order.countDocuments();
    const ordersByStatus = {
      asteptare_oferta: await Order.countDocuments({ status: 'asteptare_oferta' }),
      ofertat: await Order.countDocuments({ status: 'ofertat' }),
      comanda_spre_finalizare: await Order.countDocuments({ status: 'comanda_spre_finalizare' }),
      oferta_acceptata: await Order.countDocuments({ status: 'oferta_acceptata' }),
      oferta_respinsa: await Order.countDocuments({ status: 'oferta_respinsa' }),
      livrare_in_procesare: await Order.countDocuments({ status: 'livrare_in_procesare' }),
      livrata: await Order.countDocuments({ status: 'livrata' }),
      anulata: await Order.countDocuments({ status: 'anulata' })
    };

    // Calculează statisticile pentru oferte
    const totalOffers = await Offer.countDocuments();
    const offersByStatus = {
      proiect: await Offer.countDocuments({ status: 'proiect' }),
      trimisa: await Offer.countDocuments({ status: 'trimisa' }),
      comanda_spre_finalizare: await Offer.countDocuments({ status: 'comanda_spre_finalizare' }),
      oferta_acceptata: await Offer.countDocuments({ status: 'oferta_acceptata' }),
      oferta_respinsa: await Offer.countDocuments({ status: 'oferta_respinsa' }),
      livrare_in_procesare: await Offer.countDocuments({ status: 'livrare_in_procesare' }),
      livrata: await Offer.countDocuments({ status: 'livrata' }),
      anulata: await Offer.countDocuments({ status: 'anulata' })
    };

    const offersAggregate = await Offer.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$total" },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalValue = offersAggregate[0]?.totalValue || 0;
    const averageValue = totalValue / (offersAggregate[0]?.count || 1);

    const stats = {
      userStats: {
        totalUsers,
        usersByType,
        usersByRole,
        newUsersThisMonth
      },
      orderStats: {
        totalOrders,
        ordersByStatus,
        ordersByUserType: usersByType,
        ordersThisMonth: await Order.countDocuments({
          createdAt: { $gte: firstDayOfMonth }
        })
      },
      offerStats: {
        totalOffers,
        offersByStatus,
        totalValue,
        averageValue,
        offersThisMonth: await Offer.countDocuments({
          createdAt: { $gte: firstDayOfMonth }
        })
      }
    };

    // Salvează statisticile în baza de date
    const report = await Report.create({
      type: 'realtime',
      data: stats,
      generatedBy: req.user.id,
      notes: 'Statistici în timp real'
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error generating realtime stats:', error);
    res.status(500).json({ message: 'Eroare la generarea statisticilor în timp real.' });
  }
};

// Funcție pentru obținerea istoricului rapoartelor
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea rapoartelor.' });
  }
};