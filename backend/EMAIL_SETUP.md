# 📧 Email Configuration Guide

Configurație simplificată: **SendGrid** pentru development și **SMTP dedicat** pentru producție.

## 🔧 Configurare Environment Variables

### Pentru Development (SendGrid)
```bash
# Environment
NODE_ENV=development

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Email Addresses (opțional - fallback automat la antonio.coman99@gmail.com)
FROM_EMAIL=antonio.coman99@gmail.com  
ADMIN_EMAIL=antonio.coman99@gmail.com
```

### Pentru Production (SMTP Dedicat)
```bash
# Environment
NODE_ENV=production

# SMTP Configuration
SMTP_HOST=mail.pieseautoamerica.ro
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@pieseautoamerica.ro
SMTP_PASSWORD=your_smtp_password_here

# TLS Settings (opțional)
SMTP_TLS_REJECT_UNAUTHORIZED=true

# Email Addresses
FROM_EMAIL=noreply@pieseautoamerica.ro
ADMIN_EMAIL=admin@pieseautoamerica.ro
```

## 🚀 Automatic Configuration

Configurația se face automat bazat pe `NODE_ENV`:

- `NODE_ENV=development` → **SendGrid** cu `antonio.coman99@gmail.com`
- `NODE_ENV=production` → **SMTP dedicat** cu `noreply@pieseautoamerica.ro`

## ⚙️ Simplified Logic

**Nu mai ai nevoie de `EMAIL_PROVIDER`!** Serviciul determină automat:

1. **Development**: SendGrid cu email verificat (`antonio.coman99@gmail.com`)
2. **Production**: SMTP dedicat cu email-ul tău de producție (`noreply@pieseautoamerica.ro`)

## 📋 Common SMTP Settings

### Gmail SMTP
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Outlook/Hotmail SMTP
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_password
```

### Custom SMTP Server
```bash
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your_password
```

## 🔍 Testing Email Configuration

Service-ul include o metodă de verificare:

```javascript
const emailService = new OfferEmailService();
const verification = await emailService.verifyEmailConnection();

if (verification.success) {
  console.log(`✅ Email setup OK using ${verification.provider}`);
} else {
  console.error(`❌ Email setup failed: ${verification.error}`);
}
```

## 📧 Email Types Sent

1. **New Order Notifications** → Admin
2. **Offer Links** → Client
3. **Offer Acceptance** → Admin
4. **Offer Rejection** → Admin
5. **Delivery Status Updates** → Client

## 🛠️ Troubleshooting

### SendGrid Issues
- Verify API key is correct
- Check SendGrid dashboard for failed sends
- Ensure FROM_EMAIL is verified in SendGrid

### SMTP Issues
- Test connection with email client first
- Check firewall/port restrictions
- Verify TLS/SSL settings
- For Gmail: use App Password, not regular password

### General Issues
- Check environment variables are loaded
- Verify email addresses are valid
- Check spam folders
- Monitor backend logs for detailed errors