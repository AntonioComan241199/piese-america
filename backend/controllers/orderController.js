import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import Notification from "../models/Notification.js";
import { errorHandler } from "../utils/error.js";
import nodemailer from 'nodemailer';


// Creare cerere de ofertă
export const createOrder = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    carMake,
    carModel,
    carYear,
    fuelType,
    enginePower,
    engineSize,
    transmission,
    vin,
    partDetails,
    userType,
    companyDetails,
  } = req.body;

  try {
    // Validare date în funcție de userType
    if (userType === "persoana_fizica") {
      if (!firstName || !lastName) {
        return next(errorHandler(400, "Prenumele și numele sunt obligatorii pentru persoanele fizice."));
      }
    } else if (userType === "persoana_juridica") {
      if (!companyDetails?.companyName || !companyDetails?.cui || !companyDetails?.nrRegCom) {
        return next(errorHandler(400, "Detaliile companiei sunt obligatorii pentru persoanele juridice."));
      }
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "orderNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const orderNumber = counter.value;

    const newOrder = new Order({
      orderNumber,
      userId: req.user.id,
      userType,
      firstName,
      lastName,
      companyDetails: userType === "persoana_juridica" ? companyDetails : {},
      email,
      phoneNumber,
      carMake,
      carModel,
      carYear,
      fuelType,
      enginePower,
      engineSize,
      transmission,
      vin,
      partDetails,
    });

    await newOrder.save();

    // Notificare pentru admini
    await Notification.create({
      userId: null, // Notificare generală pentru admini
      type: "cerere_noua",
      message: `O cerere de ofertă a fost creată de ${
        userType === "persoana_fizica"
          ? `${firstName} ${lastName} (${email}, Tel: ${phoneNumber})`
          : `${companyDetails.companyName} (${email}, Tel: ${phoneNumber})`
      }, cu număr cerere: #${orderNumber}.`,
    });

    res.status(201).json({ success: true, message: "Cererea de ofertă a fost creată cu succes!", order: newOrder });
  } catch (error) {
    next(error);
  }
};

const handleDateChange = (e) => {
  const localDate = new Date(e.target.value); // Data locală selectată
  const utcDate = new Date(localDate.toISOString()); // Convertim la UTC
  setStartDate(utcDate.toISOString()); // Salvăm data în UTC
};


// Obținerea cererilor de ofertă cu filtrare corectă pe intervalul de date
// Obținerea cererilor de ofertă cu filtrare corectă pe intervalul de date
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, orderNumber, selectedDate, phoneNumber } = req.query;
    const filters = {};

    // Filtrare după status
    if (status) filters.status = status;

    // Filtrare după număr ofertă
    if (orderNumber) filters.orderNumber = orderNumber;

    // Filtrare după numărul de telefon
    if (phoneNumber) {
      filters.phoneNumber = { $regex: phoneNumber, $options: "i" };  // Filtrare case-insensitive
    }

    // Filtrare pe o singură dată (selectedDate)
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      filters.orderDate = { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() };
    }

    // Căutare cereri în baza filtrelor aplicate
    const orders = await Order.find(filters)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber status total")
      .sort({ orderDate: -1 })  // Ordine descrescătoare pe orderDate
      .skip((page - 1) * limit) // Paginare
      .limit(parseInt(limit)); // Limitează numărul de cereri returnate

    // Calcularea numărului total de cereri care se potrivesc filtrelor
    const totalOrders = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / limit), // Calcularea numărului de pagini
      },
    });
  } catch (error) {
    next(error);
  }
};





// Export cereri de ofertă
export const exportOrders = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;
    const orders = await Order.find().populate("userId", "email firstName lastName");

    if (format === "csv") {
      const csvData = orders.map((order) =>
        [
          order.orderNumber,
          order.userType === "persoana_fizica"
            ? `${order.firstName} ${order.lastName}`
            : order.companyDetails.companyName,
          order.email,
          order.phoneNumber,
          order.status,
        ].join(",")
      );
      csvData.unshift("OrderNumber,Name,Email,PhoneNumber,Status"); // Header

      const filePath = path.join(__dirname, "..", "exports", `orders-${Date.now()}.csv`);
      fs.writeFileSync(filePath, csvData.join("\n"));

      res.download(filePath);
    } else {
      res.status(400).json({ success: false, message: "Formatul de export nu este suportat." });
    }
  } catch (error) {
    next(error);
  }
};

// Obținere cererile unui utilizator
export const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, orderNumber, orderDate } = req.query;

    const filters = { userId: req.user.id };

    // Filtrare după status
    if (status) filters.status = status;

    // Filtrare după numărul comenzii
    if (orderNumber) filters.orderNumber = orderNumber;

    // Filtrare pe o singură dată (orderDate)
    if (orderDate) {
      const startOfDay = new Date(orderDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      filters.orderDate = { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() };
    }

    const orders = await Order.find(filters)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber status total")
      .sort({ orderDate: -1 })  // Ordine descrescătoare pe orderDate
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};


// Obținere detalii comandă
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "email firstName lastName")
      .populate("offerId", "offerNumber parts total");

    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// Actualizare status cerere
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ["asteptare_oferta", "ofertat", "comanda_spre_finalizare", "finalizare", "livrat"];
    if (!validStatuses.includes(status)) {
      return next(errorHandler(400, "Status invalid."));
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    await Notification.create({
      userId: order.userId,
      type: "actualizare_status",
      message: `Statusul comenzii #${order.orderNumber} a fost actualizat la ${status}.`,
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Adăugare comentariu la cerere
export const addCommentToOrder = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Verificăm dacă utilizatorul este autenticat
    if (!req.user) {
      return next(errorHandler(401, "Autentificare necesară."));
    }

    // Caută cererea după ID
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    // Determină numele utilizatorului în funcție de tipul de utilizator
    let userName;
    if (req.user.role === "admin") {
      userName = "Admin";
    } else if (req.user.userType === "persoana_fizica") {
      userName = `${req.user.firstName} ${req.user.lastName}`;
    } else if (req.user.userType === "persoana_juridica" && req.user.companyDetails?.companyName) {
      userName = req.user.companyDetails.companyName;
    } else {
      userName = "Client";
    }

    // Creează comentariul
    const comment = {
      text,
      user: userName,
    };

    // Adaugă comentariul la cerere și salvează
    order.comments.push(comment);
    await order.save();

    // Trimite răspunsul
    res.status(200).json({ success: true, comments: order.comments });
  } catch (error) {
    next(error); // Tratează eroarea cu middleware-ul de erori
  }
};




// Ștergere cerere de ofertă
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return next(errorHandler(404, "Cererea de ofertă nu a fost găsită."));
    }

    res.status(200).json({ success: true, message: "Cererea de ofertă a fost ștearsă cu succes." });
  } catch (error) {
    next(error);
  }
};

export const sendOrderEmail = async (req, res, next) => {
  const { orderLink, orderNumber } = req.body; // Folosim orderNumber în loc de orderId

  if (!orderLink || !orderNumber) {
    return next(errorHandler(400, "Link-ul sau numărul comenzii nu sunt furnizate."));
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "SendGrid", // Folosește serviciul de email SendGrid
      auth: {
        user: "apikey", // Folosește "apikey" ca user
        pass: process.env.SENDGRID_API_KEY, // Cheia API de la SendGrid
      },
    });

    // Mesajul emailului cu subiect îmbunătățit
    const mailOptions = {
      from: "antonio.coman99@gmail.com", // Adresa expeditorului
      to: "antonio.coman99@gmail.com", // Email-ul adminului
      subject: `Nouă solicitare pentru piese auto - Comanda #${orderNumber}`, // Folosim orderNumber în subiect
      text: `Salut! Un client a trimis o solicitare de ofertă. Poți vizualiza cererea completă accesând link-ul: ${orderLink}. Detalii suplimentare sunt disponibile în aplicație.`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f8f9fc;
                color: #333;
                margin: 0;
                padding: 0;
                line-height: 1.6;
              }
    
              /* Containerele */
              .email-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
    
              /* Header */
              .email-header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 2px solid #f1f1f1;
              }
    
              .email-header h1 {
                color: #007bff;
                font-size: 24px;
                margin: 0;
              }
    
              /* Textul principal */
              .email-body {
                padding: 20px;
                text-align: center;
              }
    
              .email-body p {
                font-size: 16px;
                color: #555555;
              }
    
              /* Buton CTA */
              .cta-button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 15px 25px;
                font-size: 18px;
                border-radius: 5px;
                margin-top: 20px;
                font-weight: bold;
                transition: background-color 0.3s;
              }
    
              .cta-button:hover {
                background-color: #0056b3;
              }
    
              /* Footer */
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #f1f1f1;
                font-size: 14px;
                color: #888;
              }
    
              .footer a {
                color: #007bff;
                text-decoration: none;
              }
    
              @media (max-width: 600px) {
                .email-container {
                  padding: 10px;
                }
                .email-header h1 {
                  font-size: 22px;
                }
                .cta-button {
                  font-size: 16px;
                  padding: 12px 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <!-- Header -->
              <div class="email-header">
                <h1>Nouă solicitare pentru piese auto</h1>
                <p>Comanda #${orderNumber}</p> <!-- Folosim orderNumber în titlu -->
              </div>
              
              <!-- Body -->
              <div class="email-body">
                <p>Salut, <strong>admin</strong>!</p>
                <p>Un client a trimis o solicitare de ofertă pentru piese auto. Detalii suplimentare sunt disponibile la următorul link:</p>
                <a href="${orderLink}" class="cta-button">Vezi cererea de ofertă</a>
              </div>
    
              <!-- Footer -->
              <div class="footer">
                <p>Acesta este un mesaj automat generat de aplicația <strong>Piese Auto America</strong>.</p>
                <p>Îți mulțumim că faci parte din echipa noastră!</p>
                <p><a href="mailto:antonio.coman99@gmail.com">Contactează-ne</a> pentru orice întrebări.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
    
    // Trimitem emailul
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email-ul cu link-ul cererii a fost trimis cu succes." });
    
      
  } catch (error) {
    console.error("Eroare la trimiterea email-ului:", error);
    return next(errorHandler(500, "Eroare la trimiterea email-ului: " + error.message));
  }
};

