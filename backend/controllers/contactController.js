import nodemailer from "nodemailer";

const sendContactEmail = async (req, res) => {
    const { name, email, message } = req.body;
  
    try {
      // Configurarea transportorului pentru SendGrid
      const transporter = nodemailer.createTransport({
        service: "SendGrid", // SendGrid SMTP service
        auth: {
          user: "apikey", // Folosește "apikey" ca user
          pass: process.env.SENDGRID_API_KEY, // Folosește cheia API SendGrid ca parolă
        },
      });
  
      // Setează detaliile email-ului
      const mailOptions = {
        from: "antonio.coman99@gmail.com", // Schimbă cu o adresă verificată din SendGrid
        to: "antonio.coman99@gmail.com", // Adresa destinatarului
        subject: `Mesaj de la ${name} - Formular de contact`,
        text: `Mesajul de la ${name} (${email}):\n\n${message}`,
        html: `<p>Mesajul de la <strong>${name}</strong> (${email}):</p><p>${message}</p>`,
      };
  
      // Trimite email-ul
      await transporter.sendMail(mailOptions);
  
      // Răspuns pentru succes
      res.status(200).json({ message: "Mesajul a fost trimis cu succes!" });
    } catch (error) {
      console.error("Eroare la trimiterea mesajului:", error);
      res.status(500).json({ message: "Eroare la trimiterea mesajului." });
    }
  };
  

export { sendContactEmail };
