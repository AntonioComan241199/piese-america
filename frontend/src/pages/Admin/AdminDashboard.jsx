import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import RealtimeStats from './RealtimeStats';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: "Produse Uleiuri",
      path: "/admin/oil-products",
      icon: "fas fa-oil-can",
      description: "Gestionează catalogul de uleiuri, prețuri și stocuri",
      color: "#4CAF50",
    },
    {
      title: "Stingătoare",
      path: "/admin/fire-extinguishers",
      icon: "fas fa-fire-extinguisher",
      description: "Administrează stingătoarele și verificările periodice",
      color: "#f44336",
    },
    {
      title: "Evidenta Oferte Admin",
      path: "/admin-orders",
      icon: "fas fa-tags",
      description: "Vizualizează și gestionează toate ofertele primite",
      color: "#2196F3",
    },
    {
      title: "Evidenta Comenzi Admin",
      path: "/admin-offers",
      icon: "fas fa-shopping-cart",
      description: "Monitorizează și procesează comenzile active",
      color: "#FF9800",
    },
  ];

  return (
    <Container fluid className="py-5 px-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Panou de Administrare</h2>
        <div className="text-muted">
          <i className="fas fa-calendar-alt me-2"></i>
          {new Date().toLocaleDateString('ro-RO', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Navigation Cards */}
      <Row className="g-4 mb-5">
        {dashboardItems.map((item, index) => (
          <Col key={index} md={6} lg={4} xl={3}>
            <Card 
              className="dashboard-card h-100 shadow-sm hover-effect" 
              onClick={() => navigate(item.path)}
            >
              <Card.Body className="d-flex flex-column">
                <div 
                  className="icon-circle mb-3" 
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <i 
                    className={`${item.icon} fa-2x`} 
                    style={{ color: item.color }}
                  ></i>
                </div>
                <Card.Title className="mb-3">{item.title}</Card.Title>
                <Card.Text className="text-muted flex-grow-1">
                  {item.description}
                </Card.Text>
                <button
                  className="btn btn-primary mt-3 w-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                  style={{
                    backgroundColor: item.color,
                    border: 'none'
                  }}
                >
                  <i className="fas fa-arrow-right me-2"></i>
                  Accesează
                </button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Statistics Section */}
      <Card className="dashboard-stats-card">
        <Card.Body>
          <RealtimeStats />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;