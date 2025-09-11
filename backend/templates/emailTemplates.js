export const emailTemplates = {
  /**
   * Template pentru email de cerere nouă
   */
  newOrderEmail: (orderLink, orderNumber) => `
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

          .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

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

          .email-body {
            padding: 20px;
            text-align: center;
          }

          .email-body p {
            font-size: 16px;
            color: #555555;
          }

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
          <div class="email-header">
            <h1>Nouă solicitare pentru piese auto</h1>
            <p>Comanda #${orderNumber}</p>
          </div>
          
          <div class="email-body">
            <p>Salut, <strong>admin</strong>!</p>
            <p>Un client a trimis o solicitare de ofertă pentru piese auto. Detalii suplimentare sunt disponibile la următorul link:</p>
            <a href="${orderLink}" class="cta-button">Vezi cererea de ofertă</a>
          </div>

          <div class="footer">
            <p>Acesta este un mesaj automat generat de aplicația <strong>Piese Auto America</strong>.</p>
            <p>Îți mulțumim că faci parte din echipa noastră!</p>
            <p><a href="mailto:antonio.coman99@gmail.com">Contactează-ne</a> pentru orice întrebări.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru email de actualizare status
   */
  statusUpdateEmail: (orderNumber, status) => `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #007bff;">Actualizare Status Comandă</h2>
          <p>Statusul comenzii <strong>#${orderNumber}</strong> a fost actualizat la <strong>${status}</strong>.</p>
          <p>Mulțumim pentru încrederea acordată!</p>
        </div>
      </body>
    </html>
  `
};