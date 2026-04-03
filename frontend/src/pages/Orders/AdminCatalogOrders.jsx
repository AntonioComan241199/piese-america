import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { Table, Button, Form, Badge, Card, Container, Row, Col, Spinner } from "react-bootstrap";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const STATUS_META = {
  in_asteptare: { label: "În așteptare", badge: "warning" },
  pregatita: { label: "Pregătită", badge: "info" },
  livrata: { label: "Livrată", badge: "success" },
  anulata: { label: "Anulată", badge: "danger" },
};

const AdminCatalogOrders = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialStatus = searchParams.get("status") || "";
  const initialOrderNumber = searchParams.get("orderNumber") || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [debouncedOrderNumber, setDebouncedOrderNumber] = useState(initialOrderNumber);

  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrderNumber(orderNumber.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [orderNumber]);

  useEffect(() => {
    const params = {};

    if (currentPage > 1) params.page = String(currentPage);
    if (statusFilter) params.status = statusFilter;
    if (debouncedOrderNumber) params.orderNumber = debouncedOrderNumber;

    setSearchParams(params, { replace: true });
  }, [currentPage, statusFilter, debouncedOrderNumber, setSearchParams]);

  const fetchOrders = useCallback(
    async (page = currentPage, status = statusFilter, orderNo = debouncedOrderNumber) => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const response = await axiosInstance.get(`/catalog-orders/admin`, {
          params: {
            page,
            status,
            orderNumber: orderNo,
            type: "catalog_order",
          },
        });

        if (currentRequestId !== requestIdRef.current) return;

        const safeOrders = Array.isArray(response.data?.data) ? response.data.data : [];
        const pages =
          response.data?.pagination?.pages ??
          response.data?.pagination?.totalPages ??
          1;

        setOrders(safeOrders);
        setTotalPages(pages);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;

        console.error("Eroare la încărcarea comenzilor:", err);
        setOrders([]);
        setTotalPages(1);
        toast.error("Eroare la încărcarea comenzilor din catalog.");
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    },
    [currentPage, statusFilter, debouncedOrderNumber]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    setCurrentPage(1);
  }, [statusFilter, debouncedOrderNumber, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders(currentPage, statusFilter, debouncedOrderNumber);
  }, [isAuthenticated, currentPage, statusFilter, debouncedOrderNumber, fetchOrders]);

  const handleRefresh = useCallback(() => {
    fetchOrders(currentPage, statusFilter, debouncedOrderNumber);
  }, [fetchOrders, currentPage, statusFilter, debouncedOrderNumber]);

  const handleFilterSubmit = useCallback(() => {
    setCurrentPage(1);
    fetchOrders(1, statusFilter, debouncedOrderNumber);
  }, [fetchOrders, statusFilter, debouncedOrderNumber]);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("");
    setOrderNumber("");
    setDebouncedOrderNumber("");
    setCurrentPage(1);
  }, []);

  const handleStatusUpdate = useCallback(
    async (orderId, newStatus, currentStatus) => {
      if (newStatus === currentStatus || updatingStatusId) return;

      setUpdatingStatusId(orderId);

      try {
        await axiosInstance.patch(`/catalog-orders/${orderId}`, { status: newStatus });

        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );

        toast.success(`Status actualizat: ${STATUS_META[newStatus]?.label || newStatus}`);
      } catch (err) {
        console.error("Eroare la actualizarea statusului:", err);
        toast.error("Eroare la actualizarea statusului.");
      } finally {
        setUpdatingStatusId(null);
      }
    },
    [updatingStatusId]
  );

  const formatDate = useCallback((date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatMoney = useCallback((value) => {
    const amount = Number(value) || 0;
    return `${amount.toFixed(2)} RON`;
  }, []);

  const getStatusBadge = useCallback((status) => {
    const meta = STATUS_META[status] || { label: status || "Necunoscut", badge: "secondary" };
    return <Badge bg={meta.badge}>{meta.label}</Badge>;
  }, []);

  const paginationItems = useMemo(() => {
    if (totalPages <= 1) return [];

    const items = [];
    const addPage = (value) => items.push({ type: "page", value, active: value === currentPage });
    const addEllipsis = (key) => items.push({ type: "ellipsis", value: key });

    addPage(1);

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    if (start > 2) addEllipsis("left");

    for (let i = start; i <= end; i++) {
      addPage(i);
    }

    if (end < totalPages - 1) addEllipsis("right");

    if (totalPages > 1) addPage(totalPages);

    return items;
  }, [currentPage, totalPages]);

  const normalizedOrders = useMemo(() => {
    return orders.map((order) => {
      const totalWithoutVat = Number(order.totalAmount) || 0;
      const totalWithVat = totalWithoutVat * 1.21;

      return {
        ...order,
        totalWithoutVat,
        totalWithVat,
        clientName:
          order.userType === "persoana_juridica"
            ? order.companyDetails?.companyName || "N/A"
            : `${order.firstName || ""} ${order.lastName || ""}`.trim() || "N/A",
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
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
          <h2 className="fw-bold text-primary mb-1">Comenzi Catalog (Stoc)</h2>
          <p className="text-muted mb-0">
            Gestionează comenzile plasate pentru produsele din stoc.
          </p>
        </div>

        <Button variant="outline-primary" onClick={handleRefresh} disabled={loading}>
          <i className="ri-refresh-line me-2"></i>
          Refresh
        </Button>
      </div>

      <Card className="mb-4 border-0 shadow-sm rounded-4">
        <Card.Body className="p-3 p-md-4">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label className="fw-semibold">Număr comandă</Form.Label>
              <Form.Control
                placeholder="Caută după nr. comandă..."
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilterSubmit()}
              />
            </Col>

            <Col md={4}>
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Toate statusurile</option>
                <option value="in_asteptare">În așteptare</option>
                <option value="pregatita">Pregătită pentru livrare</option>
                <option value="livrata">Livrată</option>
                <option value="anulata">Anulată</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Button
                variant="primary"
                className="w-100"
                onClick={handleFilterSubmit}
                disabled={loading}
              >
                Filtrează
              </Button>
            </Col>

            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={handleClearFilters}
                disabled={!statusFilter && !orderNumber}
              >
                Resetează
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <Table hover className="bg-white align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Nr. Comandă</th>
                <th>Client</th>
                <th>Produse</th>
                <th>Total (cu TVA)</th>
                <th>Data</th>
                <th>Status</th>
                <th className="text-center">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {normalizedOrders.length > 0 ? (
                normalizedOrders.map((order) => {
                  const isUpdatingThisRow = updatingStatusId === order._id;

                  return (
                    <tr key={order._id}>
                      <td>
                        <Link
                          to={`/admin/catalog-orders/${order._id}`}
                          className="fw-bold text-primary text-decoration-none"
                        >
                          #{order.orderNumber || order._id}
                        </Link>
                      </td>

                      <td>
                        {order.clientName}
                        <br />
                        <small className="text-muted">{order.phoneNumber || "N/A"}</small>
                      </td>

                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {order.itemCount} repere
                        </Badge>
                      </td>

                      <td className="fw-bold text-success">
                        {formatMoney(order.totalWithVat)}
                      </td>

                      <td>{formatDate(order.createdAt)}</td>

                      <td>{getStatusBadge(order.status)}</td>

                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center align-items-center flex-wrap">
                          <Form.Select
                            size="sm"
                            style={{ width: "150px" }}
                            value={order.status}
                            disabled={isUpdatingThisRow}
                            onChange={(e) =>
                              handleStatusUpdate(order._id, e.target.value, order.status)
                            }
                          >
                            <option value="in_asteptare">În așteptare</option>
                            <option value="pregatita">Pregătită</option>
                            <option value="livrata">Livrată</option>
                            <option value="anulata">Anulată</option>
                          </Form.Select>

                          <Link
                            to={`/admin/catalog-orders/${order._id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Detalii
                          </Link>

                          {isUpdatingThisRow && (
                            <Spinner animation="border" size="sm" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    Nu există comenzi în catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {loading && initialized && (
        <div className="text-center text-muted small mt-3">
          Se actualizează rezultatele...
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <nav aria-label="Paginare comenzi catalog">
            <ul className="pagination justify-content-center flex-wrap mb-0">
              <li className={`page-item ${currentPage === 1 || loading ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Înapoi
                </button>
              </li>

              {paginationItems.map((item, index) => {
                if (item.type === "ellipsis") {
                  return (
                    <li key={`${item.value}-${index}`} className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                  );
                }

                return (
                  <li
                    key={item.value}
                    className={`page-item ${item.active ? "active" : ""}`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      disabled={loading}
                      onClick={() => setCurrentPage(item.value)}
                    >
                      {item.value}
                    </button>
                  </li>
                );
              })}

              <li className={`page-item ${currentPage === totalPages || loading ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Înainte
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </Container>
  );
};

export default AdminCatalogOrders;