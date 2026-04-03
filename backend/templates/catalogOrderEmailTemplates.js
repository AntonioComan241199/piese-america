export const catalogOrderEmailTemplates = {
  newOrderToCustomer: (order, helpers) => `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Comanda ta a fost înregistrată</h2>
      <p>Comanda <strong>#${order.orderNumber}</strong> a fost plasată cu succes.</p>
      <p><strong>Total:</strong> ${helpers.formatMoney(order.totalAmount)}</p>
      <p><strong>Adresa facturare:</strong> ${helpers.formatAddress(order.billingAddress)}</p>
      <p><strong>Adresa livrare:</strong> ${
        order.pickupAtCentral
          ? 'Ridicare de la sediul central'
          : helpers.formatAddress(order.deliveryAddress)
      }</p>

      <h3>Produse comandate</h3>
      ${helpers.buildItemsTable(order.items)}
    </div>
  `,

  newOrderToAdmin: (order, helpers) => `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Comandă nouă plasată</h2>
      <p><strong>Număr comandă:</strong> ${order.orderNumber}</p>
      <p><strong>Client:</strong> ${helpers.getCustomerName(order)}</p>
      <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
      <p><strong>Telefon:</strong> ${order.phoneNumber || 'N/A'}</p>
      <p><strong>Total:</strong> ${helpers.formatMoney(order.totalAmount)}</p>

      <h3>Produse</h3>
      ${helpers.buildItemsTable(order.items)}
    </div>
  `,

  statusUpdateToCustomer: (order, statusLabel) => `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Status comandă actualizat</h2>
      <p>Comanda <strong>#${order.orderNumber}</strong> este acum <strong>${statusLabel}</strong>.</p>
    </div>
  `,
};