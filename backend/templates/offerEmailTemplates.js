export const offerEmailTemplates = {
  /**
   * Template pentru email cu ofertă către client
   */
  offerToClient: (offerNumber, offerLink) => `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; background-color: #007bff; color: white; 
            padding: 12px 30px; text-decoration: none; border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { border-top: 1px solid #eee; padding-top: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Oferta #${offerNumber}</h1>
            <p>Piese Auto America</p>
          </div>
          <div class="content">
            <p>Salut!</p>
            <p>Ai primit această ofertă pentru comanda ta. Te rugăm să o verifici și să ne comunici decizia ta.</p>
            <a href="${offerLink}" class="button">Vezi Oferta</a>
            <p>Dacă ai întrebări, nu ezita să ne contactezi.</p>
          </div>
          <div class="footer">
            <p>Mulțumim pentru încrederea acordată!</p>
            <p><strong>Echipa Piese Auto America</strong></p>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru email de acceptare ofertă către admin
   */
  offerAcceptanceToAdmin: (offerNumber, offerLink) => `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; background-color: #28a745; color: white; 
            padding: 12px 30px; text-decoration: none; border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Oferta Acceptată!</h1>
            <p>Oferta #${offerNumber}</p>
          </div>
          <div class="content">
            <p>Salut, Admin!</p>
            <p>Clientul a acceptat oferta <strong>#${offerNumber}</strong>.</p>
            <p>Poți vizualiza detaliile complete și procesa comanda:</p>
            <a href="${offerLink}" class="button">Vezi Oferta</a>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru email de respingere ofertă către admin
   */
  offerRejectionToAdmin: (offerNumber, offerLink) => `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; background-color: #dc3545; color: white; 
            padding: 12px 30px; text-decoration: none; border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Oferta Respinsă</h1>
            <p>Oferta #${offerNumber}</p>
          </div>
          <div class="content">
            <p>Salut, Admin!</p>
            <p>Clientul a respins oferta <strong>#${offerNumber}</strong>.</p>
            <p>Poți vizualiza detaliile și eventual să creezi o nouă ofertă:</p>
            <a href="${offerLink}" class="button">Vezi Oferta</a>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru actualizare status livrare
   */
  deliveryStatusUpdate: (offerNumber, statusMessage) => `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Actualizare Livrare</h1>
            <p>Oferta #${offerNumber}</p>
          </div>
          <div class="content">
            <p>Salut!</p>
            <p>Statusul livrării pentru oferta <strong>#${offerNumber}</strong> a fost actualizat.</p>
            <p><strong>Status nou:</strong> ${statusMessage}</p>
            <p>Mulțumim pentru răbdare!</p>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru notificare ofertă nouă către admin
   */
  newOfferNotificationToAdmin: (offerNumber, orderNumber, offerLink) => `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; background-color: #6f42c1; color: white; 
            padding: 12px 30px; text-decoration: none; border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Ofertă Nouă Creată</h1>
            <p>Oferta #${offerNumber}</p>
          </div>
          <div class="content">
            <p>Salut, Admin!</p>
            <p>O nouă ofertă a fost generată pentru comanda <strong>#${orderNumber}</strong>.</p>
            <p>Numărul ofertei: <strong>#${offerNumber}</strong></p>
            <a href="${offerLink}" class="button">Vezi Oferta</a>
          </div>
        </div>
      </body>
    </html>
  `
};