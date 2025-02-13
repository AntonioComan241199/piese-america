import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Spinner, Card, Row, Col, Container } from 'react-bootstrap';

const API_URL = import.meta.env.VITE_API_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

const RealtimeStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Nu sunteți autentificat. Token-ul lipsește.');
        }

        const response = await fetch(`${API_URL}/reports/realtime`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Eroare la încărcarea datelor.');
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Nu s-au putut încărca statisticile.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <div className="alert alert-info" role="alert">
          Nu există date disponibile
        </div>
      </Container>
    );
  }

  const userTypeData = {
    labels: ['Persoană Fizică', 'Persoană Juridică'],
    datasets: [{
      data: [
        stats?.userStats?.usersByType?.persoana_fizica || 0,
        stats?.userStats?.usersByType?.persoana_juridica || 0
      ],
      backgroundColor: ['#4e73df', '#1cc88a'],
      borderWidth: 1
    }]
  };

  const userRoleData = {
    labels: ['Client', 'Admin'],
    datasets: [{
      data: [
        stats?.userStats?.usersByRole?.client || 0,
        stats?.userStats?.usersByRole?.admin || 0
      ],
      backgroundColor: ['#36b9cc', '#f6c23e'],
      borderWidth: 1
    }]
  };

  const orderStatusData = {
    labels: Object.keys(stats?.orderStats?.ordersByStatus || {}).map(key => 
      key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ),
    datasets: [{
      label: 'Comenzi după status',
      data: Object.values(stats?.orderStats?.ordersByStatus || {}),
      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
      borderWidth: 1
    }]
  };

  const offerStatusData = {
    labels: Object.keys(stats?.offerStats?.offersByStatus || {}).map(key => 
      key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ),
    datasets: [{
      label: 'Oferte după status',
      data: Object.values(stats?.offerStats?.offersByStatus || {}),
      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
      borderWidth: 1
    }]
  };

  // Calculăm numărul total de oferte livrate
  const totalOffersLivrate = stats?.offerStats?.offersByStatus?.livrata || 0;

  // Calculăm valoarea totală doar pentru ofertele livrate
  const totalValueLivrate = stats?.offerStats?.offersByStatus?.livrata
    ? (stats.offerStats.totalValue * stats.offerStats.offersByStatus.livrata) / stats.offerStats.totalOffers
    : 0;

  return (
    <Container fluid className="px-4">
      <h2 className="h3 mb-4 text-gray-800">Statistici în timp real</h2>

      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-4">
          <Card className="border-left-primary shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Conturi Create
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats?.userStats?.totalUsers || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="border-left-success shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Cereri de Oferte
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats?.orderStats?.totalOrders || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="border-left-info shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Total Oferte Livrate
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalOffersLivrate}
                  </div>
                  <div className="text-xs text-muted mt-2">
                    {stats?.offerStats?.offersThisMonth || 0} ofertari luna aceasta
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-shopping-cart fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4">
          <Card className="border-left-warning shadow h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Valoare Totală Oferte Livrate
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalValueLivrate.toFixed(2)} RON
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6} lg={6} className="mb-4">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Comenzi după Status</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Bar data={orderStatusData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={6} lg={6} className="mb-4">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Oferte după Status</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Bar data={offerStatusData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={6} lg={6} className="mb-4">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Distribuția Utilizatorilor după Tip</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Pie data={userTypeData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={6} lg={6} className="mb-4">
          <Card className="shadow mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Distribuția Utilizatorilor după Rol</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Pie data={userRoleData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RealtimeStats;