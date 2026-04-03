import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { removeFromCart, updateQty } from '../../slices/cartSlice';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

const CartPage = () => {
  const items = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartSummary = useMemo(() => {
    const distinctProducts = items.length;

    const totalUnits = items.reduce((acc, item) => {
      return acc + (Number(item.qty) || 0);
    }, 0);

    const totalPrice = items.reduce((acc, item) => {
      return acc + ((Number(item.price) || 0) * (Number(item.qty) || 0));
    }, 0);

    return {
      distinctProducts,
      totalUnits,
      totalPrice,
    };
  }, [items]);

  const getSafeQty = useCallback((value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
  }, []);

  const getImageUrl = useCallback((image) => {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return `${API_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`;
  }, []);

  const handleQtyChange = useCallback((id, value) => {
    const safeQty = getSafeQty(value);
    dispatch(updateQty({ id, qty: safeQty }));
  }, [dispatch, getSafeQty]);

  const handleIncreaseQty = useCallback((id, currentQty) => {
    dispatch(updateQty({ id, qty: getSafeQty((currentQty || 0) + 1) }));
  }, [dispatch, getSafeQty]);

  const handleDecreaseQty = useCallback((id, currentQty) => {
    dispatch(updateQty({ id, qty: getSafeQty((currentQty || 1) - 1) }));
  }, [dispatch, getSafeQty]);

  const handleRemoveItem = useCallback((id) => {
    dispatch(removeFromCart(id));
  }, [dispatch]);

  const handleCheckout = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <div className="py-5">
          <i className="ri-shopping-cart-line display-1 text-muted mb-4"></i>
          <h3 className="fw-bold">Coșul tău este gol</h3>
          <p className="text-muted mb-4">
            Nu ai adăugat nicio piesă în coș încă.
          </p>
          <Link to="/catalog" className="btn btn-primary px-4">
            Mergi la Catalog
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 py-lg-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h2 className="mb-1 fw-bold">Coșul de piese</h2>
          <p className="text-muted mb-0">
            Verifică produsele selectate înainte de a trimite cererea.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Badge bg="light" text="dark" className="px-3 py-2 border">
            {cartSummary.distinctProducts} produse
          </Badge>
          <Badge bg="light" text="dark" className="px-3 py-2 border">
            {cartSummary.totalUnits} bucăți
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          {items.map((item) => {
            const itemQty = getSafeQty(item.qty);
            const itemPrice = Number(item.price) || 0;
            const lineTotal = itemPrice * itemQty;
            const imageUrl = getImageUrl(item.image);
            const hasPrice = Number.isFinite(itemPrice) && itemPrice > 0;

            return (
              <Card key={item._id} className="mb-3 shadow-sm border-0 rounded-4 overflow-hidden">
                <Card.Body className="p-3 p-md-4">
                  <Row className="align-items-center g-3">
                    <Col xs={12} sm={3} md={2}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title || 'Produs'}
                          className="img-fluid rounded-3 border"
                          style={{
                            width: '100%',
                            height: '96px',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light rounded-3 border d-flex align-items-center justify-content-center"
                          style={{ width: '100%', height: '96px' }}
                        >
                          <i className="ri-image-line text-muted fs-2"></i>
                        </div>
                      )}
                    </Col>

                    <Col xs={12} sm={9} md={5}>
                      <h5 className="mb-2 fw-semibold">{item.title || 'Produs fără denumire'}</h5>
                      <div className="text-muted small mb-2">
                        Cod: <span className="fw-medium">{item.code || '—'}</span>
                      </div>

                      <div className="mb-1">
                        <span className="fw-bold text-primary fs-5">
                          {hasPrice ? `${itemPrice.toFixed(2)} RON` : 'Preț la cerere'}
                        </span>
                      </div>

                      {hasPrice && (
                        <small className="text-muted">
                          Subtotal: {lineTotal.toFixed(2)} RON
                        </small>
                      )}
                    </Col>

                    <Col xs={12} md={3}>
                      <Form.Label
                        htmlFor={`qty-${item._id}`}
                        className="small text-muted mb-2 d-block"
                      >
                        Cantitate
                      </Form.Label>

                      <InputGroup>
                        <Button
                          variant="outline-secondary"
                          onClick={() => handleDecreaseQty(item._id, itemQty)}
                          aria-label={`Scade cantitatea pentru ${item.title}`}
                        >
                          <i className="ri-subtract-line"></i>
                        </Button>

                        <Form.Control
                          id={`qty-${item._id}`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={itemQty}
                          onChange={(e) => handleQtyChange(item._id, e.target.value)}
                          className="text-center fw-semibold"
                          aria-label={`Cantitate pentru ${item.title}`}
                        />

                        <Button
                          variant="outline-secondary"
                          onClick={() => handleIncreaseQty(item._id, itemQty)}
                          aria-label={`Crește cantitatea pentru ${item.title}`}
                        >
                          <i className="ri-add-line"></i>
                        </Button>
                      </InputGroup>
                    </Col>

                    <Col xs={12} md={2} className="text-md-end">
                      <Button
                        variant="outline-danger"
                        className="rounded-pill px-3"
                        onClick={() => handleRemoveItem(item._id)}
                        aria-label={`Elimină ${item.title} din coș`}
                      >
                        <i className="ri-delete-bin-line me-1"></i>
                        Șterge
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })}

          <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 mt-4">
            <Link to="/catalog" className="btn btn-outline-secondary px-4">
              <i className="ri-arrow-left-line me-1"></i>
              Continuă cumpărăturile
            </Link>
          </div>
        </Col>

        <Col lg={4}>
          <Card
            className="shadow-sm border-0 rounded-4 sticky-top"
            style={{ top: '100px' }}
          >
            <Card.Body className="p-4">
              <Card.Title className="mb-4 fw-bold fs-4">Sumar Cerere</Card.Title>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Produse distincte</span>
                <span className="fw-semibold">{cartSummary.distinctProducts}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Număr total bucăți</span>
                <span className="fw-semibold">{cartSummary.totalUnits}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Livrare</span>
                <span className="text-success fw-medium">Calculată ulterior</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold fs-5">Total estimat</span>
                <span className="fw-bold fs-4 text-primary">
                  {cartSummary.totalPrice.toFixed(2)} RON
                </span>
              </div>

              <Button
                variant="primary"
                className="w-100 py-3 fs-5 fw-semibold rounded-3"
                onClick={handleCheckout}
              >
                Finalizează Comanda
                <i className="ri-arrow-right-line ms-2"></i>
              </Button>

              <p className="text-muted small mt-3 text-center mb-0">
                Prețul final și costul de livrare vor fi confirmate de un operator.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;