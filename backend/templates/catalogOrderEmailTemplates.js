const TVA_RATE = 0.21;

export const catalogOrderEmailTemplates = {
  newOrderToCustomer: (order, helpers) => {
    const subtotal = Number(order.totalAmount) || 0;
    const tva = subtotal * TVA_RATE;
    const totalCuTVA = subtotal + tva;

    return `
    <div style="font-family: Arial, sans-serif; color: #222; max-width:640px;">
      <h2 style="color:#0a7cff; margin:0 0 12px;">Comanda ta a fost înregistrată ✅</h2>

      <p>Comanda <strong>#${order.orderNumber}</strong> a fost plasată cu succes.</p>

      <p style="margin: 14px 0;">
        <a href="${helpers.orderLink}"
           style="display:inline-block; background:#0a7cff; color:#fff; text-decoration:none; padding:10px 18px; border-radius:6px; font-weight:bold;">
          Vezi comanda
        </a>
      </p>

      <h3 style="margin:18px 0 8px;">Sumar financiar</h3>
      <p style="margin:0;"><strong>Subtotal (fără TVA):</strong> ${helpers.formatMoney(subtotal)}</p>
      <p style="margin:4px 0;"><strong>TVA (21%):</strong> ${helpers.formatMoney(tva)}</p>
      <p style="margin:4px 0; font-size:16px;"><strong>Total de plată:</strong> ${helpers.formatMoney(totalCuTVA)}</p>

      <h3 style="margin:18px 0 8px;">Adrese</h3>
      <p style="margin:0;"><strong>Facturare:</strong> ${helpers.formatAddress(order.billingAddress)}</p>
      <p style="margin:6px 0 0;"><strong>Livrare:</strong> ${
        order.pickupAtCentral ? "Ridicare de la sediul central" : helpers.formatAddress(order.deliveryAddress)
      }</p>

      <h3 style="margin:18px 0 8px;">Produse comandate</h3>
      ${helpers.buildItemsTable(order.items)}

      <p style="margin:20px 0 0;">Mulțumim,<br/><strong>Piese Auto America</strong></p>
    </div>
    `;
  },

  newOrderToAdmin: (order, helpers) => {
    const subtotal = Number(order.totalAmount) || 0;
    const tva = subtotal * TVA_RATE;
    const totalCuTVA = subtotal + tva;

    return `
    <div style="font-family: Arial, sans-serif; color: #222; max-width:640px;">
      <h2 style="color:#e63946; margin:0 0 12px;">Comandă nouă 🔔</h2>

      <p style="margin:0;"><strong>Număr:</strong> ${order.orderNumber}</p>
      <p style="margin:6px 0 0;"><strong>Client:</strong> ${helpers.getCustomerName(order)}</p>
      <p style="margin:6px 0 0;"><strong>Email:</strong> ${order.email || "N/A"}</p>
      <p style="margin:6px 0 0;"><strong>Telefon:</strong> ${order.phoneNumber || "N/A"}</p>

      <p style="margin: 14px 0 6px;">
        <a href="${helpers.orderLink}"
           style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:10px 18px; border-radius:6px; font-weight:bold;">
          Deschide în Admin
        </a>
      </p>
      <p style="margin:0; font-size:12px; color:#666;">
        Link direct: <a href="${helpers.orderLink}">${helpers.orderLink}</a>
      </p>

      <h3 style="margin:18px 0 8px;">Financiar</h3>
      <p style="margin:0;"><strong>Subtotal (fără TVA):</strong> ${helpers.formatMoney(subtotal)}</p>
      <p style="margin:4px 0;"><strong>TVA (21%):</strong> ${helpers.formatMoney(tva)}</p>
      <p style="margin:4px 0; font-size:16px;"><strong>Total:</strong> ${helpers.formatMoney(totalCuTVA)}</p>

      <h3 style="margin:18px 0 8px;">Livrare</h3>
      <p style="margin:0;">${
        order.pickupAtCentral ? "Ridicare de la sediu" : helpers.formatAddress(order.deliveryAddress)
      }</p>

      <h3 style="margin:18px 0 8px;">Produse</h3>
      ${helpers.buildItemsTable(order.items)}
    </div>
    `;
  },

  statusUpdateToCustomer: (order, statusLabel, helpers) => `
    <div style="font-family: Arial, sans-serif; color: #222; max-width:640px;">
      <h2 style="color:#0a7cff; margin:0 0 12px;">Actualizare comandă</h2>

      <p>Comanda <strong>#${order.orderNumber}</strong> este acum:</p>
      <p style="font-size:18px; margin:8px 0;"><strong>${statusLabel}</strong></p>

      ${helpers?.orderLink ? `
        <p style="margin: 14px 0;">
          <a href="${helpers.orderLink}"
             style="display:inline-block; background:#0a7cff; color:#fff; text-decoration:none; padding:10px 18px; border-radius:6px; font-weight:bold;">
            Vezi comanda
          </a>
        </p>
      ` : ""}

      <p style="margin-top:20px;">Mulțumim,<br/><strong>Piese Auto America</strong></p>
    </div>
  `,
};