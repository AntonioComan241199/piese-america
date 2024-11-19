import React from 'react'
import '../../styles/footer.css'
import {Container, Row, Col, ListGroup, ListGroupItem} from 'reactstrap'
import { Link } from 'react-router-dom'

const quicKinks =[
    {
        path: '/home',
        display: 'Home'
    },
    {
        path: '/about',
        display: 'About'
    },
    {
        path: '/contact',
        display: 'Contact'
    }
]

const Footer = () => {

    const date = new Date()
    const year = date.getFullYear()
  return (
    <footer className='footer'>
        <Container>
            <Row>
                <Col lg='4' md='4' sm='12'>
                    <div className='logo footer__logo'>
                        <h1>
                        <Link to='/home' className='d-flex align-items-center gap-3'>
                            <i className='ri-car-line'></i>
                            <span>Piese Auto <br /> America</span>
                        </Link>
                        </h1>
                    </div>
                    <p className='footer__logo_content'>
                    Piese auto America este un magazin online de piese auto importate din America. Oferim o gama variata de produse de cea mai buna calitate la preturi accesibile.
                    Aducem piese auto din America la comanda, in cel mai scurt timp posibil.
                    </p>
                </Col>

                <Col lg='2' md='4' sm='6'>
                    <div className="mb-4">
                        <h5 className="footer__link-title">Quick Links</h5>
                        <ListGroup>
                            {
                                quicKinks.map((item, index) => (
                                    <ListGroupItem key={index} className='p-0 mt-3 quick__link'>
                                        <Link to={item.path}>{item.display}</Link>
                                    </ListGroupItem>
                                ))
                            }
                        </ListGroup>
                    </div>
                </Col>

                <Col lg='3' md='4' sm='6'>
                    <div className="mb-4">
                    <h5 className="footer__link-title mb-4">Sediu central</h5>
                    <p className="office__info">
                        Bucuresti, Bd. Marasti 25, Sector 1
                    </p>
                    <p className="office__info">
                        Telefon: 0740 121 689
                    </p>
                    <p className="office__info">
                        Email:  <a href="mailto:costel.barbu@artri.ro">costel.barbu@artri.ro</a>
                    </p>
                    <p className="office__info">
                        Program: Luni - Vineri 09:00 - 17:00
                    </p>
                    </div>
                </Col>

                <Col lg='3' md='12' sm='6'>
                    <div className="mb-4">
                        <h5 className="footer__link-title">Newsletter</h5>
                        <p className="section__description">Abonați-vă la noutățile și actualizările noastre.</p>
                        <div className="newsletter">
                            <input type="email" placeholder="Email" />
                            <span><i className='ri-send-plane-line'></i></span>
                        </div>
                    </div>
                </Col>

                <Col lg='12'>
                    <div className="footer__bottom">
                        <p className="section__drescription d-flex align-items-center justify-content-center gap-1 pt-4">
                            <i className='ri-copyright-line'></i>Copyright {year}, Piese Auto America. Toate drepturile rezervate.
                        </p>
                    </div>
                </Col>
            </Row>
        </Container>
    </footer>
  )
}

export default Footer