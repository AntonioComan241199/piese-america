import nodemailer from "nodemailer";

const sendContactEmail = async (req, res) => {
    const { name, email, message } = req.body;
  
    try {
      // Configurarea transportorului pentru SendGrid
      const transporter = nodemailer.createTransport({
        host: "mail.antoniocoman.ro", // Serverul SMTP
        port: 465, // Portul SMTP
        secure: true, // true pentru SSL (465), false pentru TLS (587)
        auth: {
          user: "no-reply@antoniocoman.ro", // Adresa ta de email
          pass: "Alexandra99.", // Parola SMTP
        },
      });
  
      // Setează detaliile email-ului
      const mailOptions = {
        from: "no-reply@antoniocoman.ro", // Schimbă cu o adresă verificată din SendGrid
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
