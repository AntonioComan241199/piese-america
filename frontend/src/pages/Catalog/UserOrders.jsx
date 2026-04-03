import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Container, Table, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosInstance';

const STATUS_META = {
  in_asteptare: { label: 'În așteptare', badge: 'warning' },
  pregatita: { label: 'Pregătită', badge: 'info' },
  livrata: { label: 'Livrată', badge: 'success' },
  anulata: { label: 'Anulată', badge: 'danger' },
};

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const navigate = useNavigate();
  const requestIdRef = useRef(0);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'N/A';

    return parsedDate.toLocaleDateString('ro-RO');
  }, []);

  const formatMoney = useCallback((value) => {
    const amount = Number(value) || 0;
    return `${amount.toFixed(2)} RON`;
  }, []);

  const getStatusBadge = useCallback((status) => {
    const meta = STATUS_META[status] || {
      label: status || 'Necunoscut',
      badge: 'secondary',
    };

    return <Badge bg={meta.badge}>{meta.label}</Badge>;
  }, []);

  const fetchOrders = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const response = await axiosInstance.get('/catalog-orders/my-orders');

      if (currentRequestId !== requestIdRef.current) return;

      const safeOrders = Array.isArray(response.data) ? response.data : [];
      setOrders(safeOrders);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;

      console.error('Eroare la încărcarea comenzilor:', err);
      setOrders([]);
      toast.error('Nu am putut încărca comenzile.');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const normalizedOrders = useMemo(() => {
    return orders.map((order) => {
      const subtotal = Number(order.totalAmount) || 0;
      const totalWithVat = subtotal * 1.21;

      return {
        ...order,
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
        totalWithVat,
      };
    });
  }, [orders]);

  if (!initialized && loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <div>Se încarcă comenzile...</div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Comenzile mele (Catalog)</h2>
          <p className="text-muted mb-0">
            Vezi istoricul comenzilor plasate pentru produsele din catalog.
          </p>
        </div>

        <Button variant="outline-primary" onClick={fetchOrders} disabled={loading}>
          <i className="ri-refresh-line me-2"></i>
          Refresh
        </Button>
      </div>

      {normalizedOrders.length === 0 ? (
        <Card className="p-5 text-center shadow-sm border-0 rounded-4">
          <h4 className="fw-bold">Nu ai nicio comandă plasată încă</h4>
          <p className="text-muted mb-4">
            Când vei plasa o comandă, o vei vedea aici.
          </p>
          <div>
            <Button variant="primary" onClick={() => navigate('/catalog')}>
              Mergi la Catalog
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="table-responsive">
            <Table hover className="align-middle bg-white mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Nr. Comandă</th>
                  <th>Data</th>
                  <th>Produse</th>
                  <th>Total (cu TVA)</th>
                  <th>Status</th>
                  <th className="text-center">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {normalizedOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link
                        to={`/my-orders-catalog/${order._id}`}
                        className="fw-bold text-primary text-decoration-none"
                      >
                        #{order.orderNumber || order._id}
                      </Link>
                    </td>

                    <td>{formatDate(order.createdAt)}</td>

                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {order.itemCount} {order.itemCount === 1 ? 'piesă' : 'piese'}
                      </Badge>
                    </td>

                    <td className="fw-bold">{formatMoney(order.totalWithVat)}</td>

                    <td>{getStatusBadge(order.status)}</td>

                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/my-orders-catalog/${order._id}`)}
                      >
                        Vezi Detalii / PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {loading && initialized && (
        <div className="text-center text-muted small mt-3">
          Se actualizează comenzile...
        </div>
      )}
    </Container>
  );
};

export default UserOrders;