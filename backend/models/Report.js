import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['realtime', 'daily', 'weekly', 'monthly']
  },
  data: {
    userStats: {
      totalUsers: Number,
      usersByType: {
        persoana_fizica: Number,
        persoana_juridica: Number
      },
      usersByRole: {
        client: Number,
        admin: Number
      },
      newUsersThisMonth: Number
    },
    orderStats: {
      totalOrders: Number,
      ordersByStatus: {
        asteptare_oferta: Number,
        ofertat: Number,
        comanda_spre_finalizare: Number,
        oferta_acceptata: Number,
        oferta_respinsa: Number,
        livrare_in_procesare: Number,
        livrata: Number,
        anulata: Number
      },
      ordersByUserType: {
        persoana_fizica: Number,
        persoana_juridica: Number
      },
      ordersThisMonth: Number
    },
    offerStats: {
      totalOffers: Number,
      offersByStatus: {
        proiect: Number,
        trimisa: Number,
        comanda_spre_finalizare: Number,
        oferta_acceptata: Number,
        oferta_respinsa: Number,
        livrare_in_procesare: Number,
        livrata: Number,
        anulata: Number
      },
      totalValue: Number,
      averageValue: Number,
      offersThisMonth: Number
    }
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedDate: {
    type: Date,
    default: Date.now
  },
  notes: String
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);