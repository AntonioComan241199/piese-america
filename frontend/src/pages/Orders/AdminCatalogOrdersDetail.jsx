import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  ListGroup,
  Spinner,
  Modal,
  Form,
  InputGroup,
} from 'react-bootstrap';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const STATUS_META = {
  in_asteptare: { label: 'ÎN AȘTEPTARE', badge: 'warning', button: 'outline-warning' },
  pregatita: { label: 'PREGĂTITĂ', badge: 'info', button: 'outline-info' },
  livrata: { label: 'LIVRATĂ', badge: 'success', button: 'outline-success' },
  anulata: { label: 'ANULATĂ', badge: 'danger', button: 'outline-danger' },
};

const mapOrderItemsToEditable = (items = []) =>
  items.map((item) => ({
    productId: item.productId || item._id || item.id || null,
    code: item.code || '',
    title: item.title || '',
    price: Number(item.price) || 0,
    qty: Number(item.qty) || 1,
    image: item.image || '',
  }));

const AdminCatalogOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [savingItems, setSavingItems] = useState(false);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const requestIdRef = useRef(0);

  const normalizeText = useCallback((text) => {
    if (!text) return '';
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const formatMoney = useCallback((value) => {
    const amount = Number(value) || 0;
    return `${amount.toFixed(2)} RON`;
  }, []);

  const formatDate = useCallback((value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('ro-RO');
  }, []);

  const formatAddress = useCallback((address) => {
    if (!address) return 'N/A';

    const line1 = [address.street, address.number ? `Nr. ${address.number}` : null]
      .filter(Boolean)
      .join(', ');

    const line2 = [
      address.block ? `Bloc ${address.block}` : null,
      address.entrance ? `Scara ${address.entrance}` : null,
      address.apartment ? `Ap. ${address.apartment}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    const line3 = [address.city, address.county].filter(Boolean).join(', ');

    return [line1, line2, line3].filter(Boolean).join('\n') || 'N/A';
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/catalog-orders/${id}`);

      if (currentRequestId !== requestIdRef.current) return;

      const fetchedOrder = response.data;
      setOrder(fetchedOrder);
      setEditableItems(mapOrderItemsToEditable(fetchedOrder.items || []));
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;

      console.error('Eroare la încărcarea comenzii:', err);
      toast.error('Nu am putut încărca detaliile comenzii.');
      navigate('/admin/catalog-orders', { replace: true });
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const computedItems = useMemo(() => {
    if (!editableItems?.length) return [];

    return editableItems.map((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const lineTotal = qty * price;

      return {
        ...item,
        safeQty: qty,
        safePrice: price,
        lineTotal,
      };
    });
  }, [editableItems]);

  const summary = useMemo(() => {
    const subtotal = computedItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const tva = subtotal * 0.21;
    const totalCuTva = subtotal + tva;

    return {
      subtotal,
      tva,
      totalCuTva,
    };
  }, [computedItems]);

  const statusMeta = useMemo(() => {
    return STATUS_META[order?.status] || STATUS_META.in_asteptare;
  }, [order?.status]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (!order || newStatus === order.status || updatingStatus) return;

      setUpdatingStatus(true);

      try {
        await axiosInstance.patch(`/catalog-orders/${id}`, { status: newStatus });
        setOrder((prev) => ({ ...prev, status: newStatus }));
        toast.success('Status actualizat cu succes!');
      } catch (err) {
        console.error('Eroare la actualizarea statusului:', err);
        toast.error('Eroare la actualizarea statusului.');
      } finally {
        setUpdatingStatus(false);
      }
    },
    [id, order, updatingStatus]
  );

  const handleQtyChange = useCallback((index, value) => {
    setEditableItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty: Math.max(1, Number(value) || 1) }
          : item
      )
    );
  }, []);


  const handleRemoveItem = useCallback((index) => {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEditableItems(mapOrderItemsToEditable(order?.items || []));
    setIsEditingItems(false);
  }, [order]);

  const fetchCatalogProducts = useCallback(async (search = '') => {
    setLoadingCatalog(true);

    try {
      const { data } = await axiosInstance.get('/stock-products', {
        params: {
          search,
          limit: 20,
        },
      });

      const products = data?.products || data || [];
      setCatalogProducts(products);
    } catch (err) {
      console.error('Eroare la încărcarea catalogului:', err);
      toast.error('Nu am putut încărca produsele din catalog.');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const handleOpenAddProductModal = useCallback(() => {
    setShowAddProductModal(true);
    fetchCatalogProducts('');
  }, [fetchCatalogProducts]);

  const handleAddProductToOrder = useCallback((product) => {
    setEditableItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          (item.productId && item.productId === product._id) ||
          (item.code && product.code && item.code === product.code)
      );

      if (existingIndex !== -1) {
        return prev.map((item, i) =>
          i === existingIndex
            ? { ...item, qty: Number(item.qty) + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product._id || product.id || null,
          code: product.code || '',
          title: product.title || product.name || 'Produs fără nume',
          price: Number(product.price) || 0,
          qty: 1,
          image: product.image || '',
        },
      ];
    });

    toast.success('Produs adăugat în comandă.');
  }, []);

  const handleSaveItems = useCallback(async () => {
    if (!editableItems.length) {
      toast.error('Comanda trebuie să conțină cel puțin un produs.');
      return;
    }

    setSavingItems(true);

    try {
      const payload = {
        items: editableItems.map((item) => ({
          productId: item.productId || null,
          code: item.code,
          title: item.title,
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 1,
          image: item.image || '',
        })),
        totalAmount: computedItems.reduce((acc, item) => acc + item.lineTotal, 0),
      };

      const { data } = await axiosInstance.patch(`/catalog-orders/${id}/items`, payload);

      setOrder((prev) => ({
        ...prev,
        ...data,
        items: payload.items,
        totalAmount: payload.totalAmount,
      }));

      setEditableItems(payload.items);
      setIsEditingItems(false);

      toast.success('Produsele comenzii au fost actualizate.');
    } catch (err) {
      console.error('Eroare la salvarea produselor:', err);
      toast.error('Nu am putut salva modificările.');
    } finally {
      setSavingItems(false);
    }
  }, [editableItems, computedItems, id]);

  const generateInvoicePDF = useCallback(() => {
    if (!order || !computedItems.length) {
      toast.error('Comanda nu conține produse.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const companyDetails = normalizeText(`FURNIZOR:
GLOBAL QUALITY SOLUTIONS SRL
Bdul. Marasti 25, Bucuresti, Sector 1
CUI: 17426176
Nr reg comertului: J2005006018400`);

    const buyerDetails = normalizeText(
      order.userType === 'persoana_fizica'
        ? `Nume Client: ${order.firstName || 'N/A'} ${order.lastName || 'N/A'}
Telefon: ${order.phoneNumber || 'N/A'}
Email: ${order.email || 'N/A'}`
        : `Firma: ${order.companyDetails?.companyName || 'N/A'}
CUI: ${order.companyDetails?.cui || 'N/A'}
Nr. Reg. Com: ${order.companyDetails?.nrRegCom || 'N/A'}
Telefon: ${order.phoneNumber || 'N/A'}
Email: ${order.email || 'N/A'}`
    );

    const billingAddress = normalizeText(`Adresa Facturare:
${formatAddress(order.billingAddress)}`);

    const deliveryAddress = order.pickupAtCentral
      ? normalizeText('Adresa Livrare: Ridicare de la sediul central')
      : normalizeText(`Adresa Livrare:
${formatAddress(order.deliveryAddress)}`);

    const leftStartX = 10;
    const rightStartX = 110;
    let currentY = 10;

    const companyLines = doc.splitTextToSize(companyDetails, 90);
    companyLines.forEach((line, index) => {
      doc.text(line, leftStartX, currentY + index * 5);
    });
    const companyHeight = companyLines.length * 5;

    const clientLines = doc.splitTextToSize(buyerDetails, 90);
    clientLines.forEach((line, index) => {
      doc.text(line, rightStartX, currentY + index * 5);
    });
    const clientHeight = clientLines.length * 5;

    currentY += Math.max(companyHeight, clientHeight) + 10;

    const billingLines = doc.splitTextToSize(billingAddress, 90);
    billingLines.forEach((line, index) => {
      doc.text(line, leftStartX, currentY + index * 5);
    });
    currentY += billingLines.length * 5 + 10;

    const deliveryLines = doc.splitTextToSize(deliveryAddress, 90);
    deliveryLines.forEach((line, index) => {
      doc.text(line, leftStartX, currentY + index * 5);
    });
    currentY += deliveryLines.length * 5 + 15;

    const titleText = normalizeText(
      `Factura Proforma #${order.orderNumber || order._id} / ${formatDate(order.createdAt)}`
    );
    const titleX = (doc.internal.pageSize.width - doc.getTextWidth(titleText)) / 2;
    doc.text(titleText, titleX, currentY);
    currentY += 20;

    const tableColumns = [
      'Cod',
      'Produs',
      'Cantitate',
      'Pret unitar',
      'Valoare fara TVA',
      'TVA (21%)',
      'Valoare cu TVA',
    ];

    let totalFaraTVA = 0;

    const tableRows = computedItems.map((item) => {
      const subtotalFaraTVA = item.lineTotal;
      const tva = subtotalFaraTVA * 0.21;
      const subtotalCuTVA = subtotalFaraTVA + tva;

      totalFaraTVA += subtotalFaraTVA;

      return [
        normalizeText(item.code || 'N/A'),
        normalizeText(item.title || 'N/A'),
        item.safeQty,
        formatMoney(item.safePrice),
        formatMoney(subtotalFaraTVA),
        formatMoney(tva),
        formatMoney(subtotalCuTVA),
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [tableColumns],
      body: tableRows,
      styles: { font: 'helvetica', fontSize: 9 },
      headStyles: { fontStyle: 'bold' },
    });

    const totalStartY = doc.lastAutoTable.finalY + 10;
    const tvaTotal = totalFaraTVA * 0.21;
    const totalCuTVA = totalFaraTVA + tvaTotal;

    const totalText = normalizeText(`Total fara TVA: ${formatMoney(totalFaraTVA)}`);
    const tvaText = normalizeText(`TVA (21%): ${formatMoney(tvaTotal)}`);
    const totalCuTVAText = normalizeText(`Total cu TVA: ${formatMoney(totalCuTVA)}`);

    const totalX = doc.internal.pageSize.width - doc.getTextWidth(totalText) - 10;

    doc.setFont('helvetica', 'normal');
    doc.text(totalText, totalX, totalStartY);
    doc.text(tvaText, totalX, totalStartY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(totalCuTVAText, totalX, totalStartY + 20);

    const filename = normalizeText(`Factura_Proforma_${order.orderNumber || order._id}.pdf`).replace(/\s+/g, '_');
    doc.save(filename);
  }, [order, computedItems, normalizeText, formatAddress, formatDate, formatMoney]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <div>Se încarcă detaliile comenzii...</div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5 text-center">
        Comanda nu a fost găsită.
      </Container>
    );
  }

  return (
    <>
      <Container className="py-5">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <i className="ri-arrow-left-line me-2"></i>
            Înapoi la listă
          </Button>

          <div className="d-flex flex-wrap gap-2">
            <Button variant="primary" onClick={handlePrint}>
              <i className="ri-printer-line me-2"></i>
              Printează Comanda
            </Button>
            <Button variant="success" onClick={generateInvoicePDF}>
              <i className="ri-file-list-3-line me-2"></i>
              Generează Factura (Proforma)
            </Button>
          </div>
        </div>

        <Row className="g-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 mb-4 rounded-4">
              <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center rounded-top-4">
                <h5 className="mb-0 fw-bold">
                  Comanda #{order.orderNumber || order._id}
                </h5>
                <Badge bg={statusMeta.badge} className="p-2">
                  {statusMeta.label}
                </Badge>
              </Card.Header>

              <Card.Body>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {!isEditingItems ? (
                    <Button variant="outline-primary" onClick={() => setIsEditingItems(true)}>
                      <i className="ri-edit-line me-2"></i>
                      Editează produse
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline-dark" onClick={handleOpenAddProductModal}>
                        <i className="ri-add-line me-2"></i>
                        Adaugă produs
                      </Button>

                      <Button variant="success" onClick={handleSaveItems} disabled={savingItems}>
                        <i className="ri-save-line me-2"></i>
                        {savingItems ? 'Se salvează...' : 'Salvează modificările'}
                      </Button>

                      <Button variant="outline-secondary" onClick={handleCancelEditing} disabled={savingItems}>
                        <i className="ri-close-line me-2"></i>
                        Anulează
                      </Button>
                    </>
                  )}
                </div>
                  {isEditingItems && (
                    <div className="small text-muted mb-3">
                      Poți modifica doar cantitățile și componența comenzii. Prețurile se administrează din catalog.
                    </div>
                  )}
                <Table responsive hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Produs</th>
                      <th>Cod</th>
                      <th className="text-center">Cantitate</th>
                      <th className="text-end">Preț unitar</th>
                      <th className="text-end">Total</th>
                      {isEditingItems && <th className="text-end">Acțiuni</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {computedItems.length > 0 ? (
                      computedItems.map((item, index) => (
                        <tr key={`${item.code || item.title}-${index}`}>
                          <td>
                            <div className="fw-bold">{item.title || 'N/A'}</div>
                          </td>

                          <td>
                            <code>{item.code || 'N/A'}</code>
                          </td>

                          <td className="text-center" style={{ minWidth: 120 }}>
                            {isEditingItems ? (
                              <Form.Control
                                type="number"
                                min="1"
                                className="text-center"
                                value={item.safeQty}
                                onChange={(e) => handleQtyChange(index, e.target.value)}
                              />
                            ) : (
                              item.safeQty
                            )}
                          </td>

                          <td className="text-end" style={{ minWidth: 160 }}>
                            {formatMoney(item.safePrice)}
                          </td>

                          <td className="text-end fw-bold">{formatMoney(item.lineTotal)}</td>

                          {isEditingItems && (
                            <td className="text-end">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                Șterge
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isEditingItems ? 6 : 5} className="text-center py-4 text-muted">
                          Nu există produse în această comandă.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-end mt-4">
                  <div style={{ width: '280px' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal (fără TVA):</span>
                      <span>{formatMoney(summary.subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>TVA (21%):</span>
                      <span>{formatMoney(summary.tva)}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                      <span>TOTAL:</span>
                      <span>{formatMoney(summary.totalCuTva)}</span>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body>
                <h6 className="fw-bold mb-3">Actualizează status comandă</h6>
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(STATUS_META).map(([statusKey, meta]) => (
                    <Button
                      key={statusKey}
                      variant={meta.button}
                      onClick={() => handleStatusChange(statusKey)}
                      disabled={updatingStatus || order.status === statusKey}
                    >
                      {meta.label}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 mb-4 rounded-4">
              <Card.Body>
                <h6 className="fw-bold border-bottom pb-2 mb-3">Date client</h6>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0 border-0">
                    <small className="text-muted d-block">Tip client:</small>
                    <strong>
                      {order.userType === 'persoana_juridica'
                        ? 'Persoană juridică'
                        : 'Persoană fizică'}
                    </strong>
                  </ListGroup.Item>

                  {order.userType === 'persoana_juridica' ? (
                    <>
                      <ListGroup.Item className="px-0 border-0">
                        <small className="text-muted d-block">Companie:</small>
                        <strong>{order.companyDetails?.companyName || 'N/A'}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="px-0 border-0">
                        <small className="text-muted d-block">CUI / Reg. Com:</small>
                        <strong>
                          {order.companyDetails?.cui || 'N/A'} / {order.companyDetails?.nrRegCom || 'N/A'}
                        </strong>
                      </ListGroup.Item>
                    </>
                  ) : (
                    <ListGroup.Item className="px-0 border-0">
                      <small className="text-muted d-block">Nume complet:</small>
                      <strong>{`${order.firstName || ''} ${order.lastName || ''}`.trim() || 'N/A'}</strong>
                    </ListGroup.Item>
                  )}

                  <ListGroup.Item className="px-0 border-0">
                    <small className="text-muted d-block">Telefon:</small>
                    <a href={`tel:${order.phoneNumber || ''}`} className="text-decoration-none fw-bold">
                      {order.phoneNumber || 'N/A'}
                    </a>
                  </ListGroup.Item>

                  <ListGroup.Item className="px-0 border-0">
                    <small className="text-muted d-block">Email:</small>
                    <strong>{order.email || 'N/A'}</strong>
                  </ListGroup.Item>

                  <ListGroup.Item className="px-0 border-0">
                    <small className="text-muted d-block">Dată comandă:</small>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 mb-4 rounded-4">
              <Card.Body>
                <h6 className="fw-bold border-bottom pb-2 mb-3">Adresa facturare</h6>
                <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>
                  {formatAddress(order.billingAddress)}
                </p>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 rounded-4">
              <Card.Body>
                <h6 className="fw-bold border-bottom pb-2 mb-3">Adresa livrare</h6>
                {order.pickupAtCentral ? (
                  <Badge bg="info" className="p-2 w-100">
                    RIDICARE DE LA SEDIU
                  </Badge>
                ) : (
                  <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>
                    {formatAddress(order.deliveryAddress)}
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showAddProductModal}
        onHide={() => setShowAddProductModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Adaugă produs din catalog</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              type="text"
              placeholder="Caută după nume sau cod..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchCatalogProducts(catalogSearch);
                }
              }}
            />
            <Button variant="outline-primary" onClick={() => fetchCatalogProducts(catalogSearch)}>
              Caută
            </Button>
          </InputGroup>

          {loadingCatalog ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table responsive hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Produs</th>
                  <th>Cod</th>
                  <th className="text-end">Preț</th>
                  <th className="text-end">Acțiune</th>
                </tr>
              </thead>
              <tbody>
                {catalogProducts.length > 0 ? (
                  catalogProducts.map((product) => (
                    <tr key={product._id || product.id}>
                      <td>{product.title || product.name || 'Produs fără nume'}</td>
                      <td>
                        <code>{product.code || '-'}</code>
                      </td>
                      <td className="text-end">{formatMoney(product.price)}</td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAddProductToOrder(product)}
                        >
                          Adaugă
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
                      Nu am găsit produse.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddProductModal(false)}>
            Închide
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminCatalogOrderDetail;