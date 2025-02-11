import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: "Produse Uleiuri",
      path: "/admin/oil-products",
      icon: "fas fa-oil-can",
      description: "Gestionează produsele de uleiuri",
      color: "#4CAF50"
    },
    {
      title: "Stingătoare",
      path: "/admin/fire-extinguishers",
      icon: "fas fa-fire-extinguisher",
      description: "Gestionează stingătoarele",
      color: "#f44336"
    },
    {
      title: "Evidenta Oferte Admin",
      path: "/admin-orders",
      icon: "fas fa-tags",
      description: "Evidenta Oferte Admin",
      color: "#2196F3"
    },
    {
      title: "Evidenta Comenzi Admin",
      path: "/admin-offers",
      icon: "fas fa-shopping-cart",
      description: "Evidenta Comenzi Admin",
      color: "#FF9800"
    }
  ];

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Panou de Administrare</h2>
      <Row className="g-4">
        {dashboardItems.map((item, index) => (
          <Col key={index} md={6} lg={3}>
            <Card 
              className="dashboard-card h-100 shadow-sm" 
              onClick={() => navigate(item.path)}
            >
              <Card.Body className="text-center">
                <div 
                  className="icon-circle mb-3" 
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <i 
                    className={`${item.icon} fa-2x`} 
                    style={{ color: item.color }}
                  ></i>
                </div>
                <Card.Title>{item.title}</Card.Title>
                <Card.Text className="text-muted">
                  {item.description}
                </Card.Text>
                <button
                  className="btn btn-primary mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                  style={{
                    backgroundColor: item.color,
                    border: 'none'
                  }}
                >
                  Accesează
                </button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default AdminDashboard;