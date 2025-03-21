import express from "express";
import {
  createOffer,
  getOfferByOrderId,
  getOfferById,
  updateOffer,
  deleteOffer,
  updateDeliveryStatus,
  getAllOffers,
  acceptOffer,
  rejectOffer,
  updateSelectedParts,
  exportOffers,
  getUserOffers,
  getOfferStats,
  updateQuantities,
  finalizeOffer,
  sendOfferEmail,
  updateOfferStatus,
  acceptOfferEmail,
  rejectOfferEmail,
  updateOfferProducts,
  addOfferProducts
} from "../controllers/offerController.js";
import { verifyToken, checkRole } from "../utils/verifyToken.js";

const router = express.Router();

/**
 * Rute pentru administratori
 */
// Creare ofertă (admin)
router.post("/admin", verifyToken, checkRole("admin"), createOffer);

// Obținere toate ofertele (admin)
router.get("/admin", verifyToken, checkRole("admin"), getAllOffers);

// Actualizare ofertă (admin)
router.patch("/admin/:offerId", verifyToken, checkRole("admin"), updateOffer);

// Export oferte (admin)
router.get("/admin/export", verifyToken, checkRole("admin"), exportOffers);


// Ștergere ofertă (admin)
router.delete("/admin/:offerId", verifyToken, checkRole("admin"), deleteOffer);

// Actualizare status livrare (admin)
router.patch("/admin/:offerId/delivery", verifyToken, checkRole("admin"), updateDeliveryStatus);

// Obținere statistici oferte (admin)
router.get("/admin/stats", verifyToken, checkRole("admin"), getOfferStats);

/**
 * Rute pentru utilizatori autentificați
 */

// Obținere oferte proprii cu paginare și filtrare (client)
router.get("/client", verifyToken, getUserOffers);

// Obținere ofertă după ID (admin/client)
router.get("/:offerId", verifyToken, getOfferById);

// Obținere ofertă pentru o comandă specifică (admin/client)
router.get("/order/:orderId", verifyToken, getOfferByOrderId);

// Acceptare ofertă (client)
router.patch("/:offerId/accept", verifyToken, acceptOffer);

// Respingere ofertă (client)
router.patch("/:offerId/reject", verifyToken, rejectOffer);

// Selectarea pieselor (client)
router.patch("/:offerId/selected-parts", verifyToken, updateSelectedParts);

// Actualizare status ofertă
router.patch("/:offerId/update-status", verifyToken, updateOfferStatus);


// Actualizare cantități piese (client)
router.patch("/:offerId/update-quantities", verifyToken, updateQuantities);

router.patch("/:offerId/finalize", verifyToken, finalizeOffer);



router.post("/send-email", verifyToken, sendOfferEmail);
router.post("/accept-email", acceptOfferEmail); // Ruta pentru acceptarea ofertei
router.post("/reject-email", rejectOfferEmail); // Ruta pentru respingerea ofertei

// Actualizare produse într-o ofertă (admin)
router.put("/admin/:offerId/update-products", 
  verifyToken, 
  checkRole("admin"), 
  updateOfferProducts
);

// Adăugare produse noi într-o ofertă (admin)
router.post("/admin/:offerId/add-products", 
  verifyToken, 
  checkRole("admin"), 
  addOfferProducts
);


export default router;
