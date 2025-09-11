export const authEmailTemplates = {
  /**
   * Template pentru email de resetare parolă
   */
  passwordReset: (resetLink, userFirstName = '') => `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            padding: 0;
          }
          .header { 
            background-color: #007bff; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            text-align: center;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Resetare Parolă</h1>
            <p>Piese Auto America</p>
          </div>
          <div class="content">
            ${userFirstName ? `<p>Salut, ${userFirstName}!</p>` : '<p>Salut!</p>'}
            <p>Ai primit acest email deoarece ai solicitat resetarea parolei pentru contul tău de la Piese Auto America.</p>
            <p>Pentru a continua cu resetarea parolei, click pe butonul de mai jos:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Resetează Parola</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>Acest link este valabil doar 1 oră</li>
                <li>Dacă nu ai solicitat resetarea parolei, te rugăm să ignori acest email</li>
                <li>Nu împărtăși acest link cu nimeni</li>
              </ul>
            </div>
            <p>Dacă butonul nu funcționează, copiază și lipește următorul link în browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
            <p>© ${new Date().getFullYear()} Piese Auto America. Toate drepturile rezervate.</p>
            <p><a href="mailto:contact@pieseautoamerica.ro">Contact</a> | <a href="https://pieseautoamerica.ro">Site Web</a></p>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru email de confirmare înregistrare
   */
  welcomeEmail: (userFirstName, userType) => `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #28a745; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .features {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .features ul {
            margin: 0;
            padding-left: 20px;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            text-align: center;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bine ai venit!</h1>
            <p>Piese Auto America</p>
          </div>
          <div class="content">
            <p>Salut, ${userFirstName}!</p>
            <p>Îți mulțumim că te-ai înregistrat pe platforma noastră ca <strong>${userType === 'persoana_fizica' ? 'persoană fizică' : 'persoană juridică'}</strong>!</p>
            
            <div class="features">
              <h3>Ce poți face acum:</h3>
              <ul>
                <li>🔍 Caută piese auto pentru orice tip de vehicul</li>
                <li>📋 Solicită oferte personalizate</li>
                <li>📊 Urmărește statusul comenzilor tale</li>
                <li>💬 Comunică direct cu echipa noastră</li>
                <li>📱 Accesează platforma de pe orice dispozitiv</li>
              </ul>
            </div>
            
            <p>Echipa noastră de specialiști este gata să te ajute cu orice ai nevoie pentru vehiculul tău.</p>
            <p>Dacă ai întrebări sau ai nevoie de ajutor, nu ezita să ne contactezi!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Piese Auto America. Toate drepturile rezervate.</p>
            <p><a href="mailto:contact@pieseautoamerica.ro">Contact</a> | <a href="https://pieseautoamerica.ro">Site Web</a></p>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru email de confirmare schimbare parolă
   */
  passwordChanged: (userFirstName) => `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #17a2b8; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .alert {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            text-align: center;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Parolă Actualizată</h1>
            <p>Piese Auto America</p>
          </div>
          <div class="content">
            ${userFirstName ? `<p>Salut, ${userFirstName}!</p>` : '<p>Salut!</p>'}
            
            <div class="alert">
              ✅ <strong>Parola ta a fost schimbată cu succes!</strong>
            </div>
            
            <p>Îți confirmăm că parola pentru contul tău de la Piese Auto America a fost actualizată în data de <strong>${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Nu ai fost tu?</strong><br>
              Dacă nu ai schimbat parola, te rugăm să ne contactezi imediat la <a href="mailto:contact@pieseautoamerica.ro">contact@pieseautoamerica.ro</a> sau să resetezi parola pentru siguranță.
            </div>
            
            <p>Pentru securitatea contului tău, toate sesiunile active au fost deconectate și va trebui să te autentifici din nou.</p>
            
            <p><strong>Sfaturi pentru o parolă sigură:</strong></p>
            <ul>
              <li>Folosește o combinație de litere mari și mici, cifre și simboluri</li>
              <li>Evită să folosești aceeași parolă pentru mai multe conturi</li>
              <li>Schimbă parola periodic</li>
              <li>Nu împărtăși parola cu nimeni</li>
            </ul>
          </div>
          <div class="footer">
            <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
            <p>© ${new Date().getFullYear()} Piese Auto America. Toate drepturile rezervate.</p>
            <p><a href="mailto:contact@pieseautoamerica.ro">Contact</a> | <a href="https://pieseautoamerica.ro">Site Web</a></p>
          </div>
        </div>
      </body>
    </html>
  `,

  /**
   * Template pentru email de alertă securitate
   */
  securityAlert: (userFirstName, activity, ipAddress, userAgent) => `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #dc3545; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .activity-details {
            background-color: #f8f9fa;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
          }
          .footer { 
            border-top: 1px solid #eee; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            text-align: center;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alertă Securitate</h1>
            <p>Piese Auto America</p>
          </div>
          <div class="content">
            ${userFirstName ? `<p>Salut, ${userFirstName}!</p>` : '<p>Salut!</p>'}
            
            <p><strong>Am detectat activitate suspicioasă pe contul tău.</strong></p>
            
            <div class="activity-details">
              <h4>Detalii activitate:</h4>
              <p><strong>Activitate:</strong> ${activity}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</p>
              <p><strong>Adresa IP:</strong> ${ipAddress || 'Necunoscută'}</p>
              <p><strong>Browser:</strong> ${userAgent || 'Necunoscut'}</p>
            </div>
            
            <p><strong>Ai fost tu?</strong> Dacă da, poți ignora acest mesaj.</p>
            
            <p><strong>Nu ai fost tu?</strong> Te rugăm să:</p>
            <ul>
              <li>Îți schimbi parola imediat</li>
              <li>Verifici setările de securitate ale contului</li>
              <li>Ne contactezi la <a href="mailto:contact@pieseautoamerica.ro">contact@pieseautoamerica.ro</a></li>
            </ul>
          </div>
          <div class="footer">
            <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
            <p>© ${new Date().getFullYear()} Piese Auto America. Toate drepturile rezervate.</p>
            <p><a href="mailto:contact@pieseautoamerica.ro">Contact</a> | <a href="https://pieseautoamerica.ro">Site Web</a></p>
          </div>
        </div>
      </body>
    </html>
  `
};