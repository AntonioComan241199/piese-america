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

const AdminCatalogOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

      setOrder(response.data);
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
    if (!order?.items?.length) return [];

    return order.items.map((item) => {
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
  }, [order]);

  const summary = useMemo(() => {
    const subtotal = Number(order?.totalAmount) || 0;
    const tva = subtotal * 0.21;
    const totalCuTva = subtotal + tva;

    return {
      subtotal,
      tva,
      totalCuTva,
    };
  }, [order]);

  const statusMeta = useMemo(() => {
    return STATUS_META[order?.status] || STATUS_META.in_asteptare;
  }, [order?.status]);


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
              <Table responsive hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Produs</th>
                    <th>Cod</th>
                    <th className="text-center">Cantitate</th>
                    <th className="text-end">Preț unitar</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {computedItems.map((item, index) => (
                    <tr key={`${item.code || item.title}-${index}`}>
                      <td>
                        <div className="fw-bold">{item.title || 'N/A'}</div>
                      </td>
                      <td>
                        <code>{item.code || 'N/A'}</code>
                      </td>
                      <td className="text-center">{item.safeQty}</td>
                      <td className="text-end">{formatMoney(item.safePrice)}</td>
                      <td className="text-end fw-bold">{formatMoney(item.lineTotal)}</td>
                    </tr>
                  ))}
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
  );
};

export default AdminCatalogOrderDetail;