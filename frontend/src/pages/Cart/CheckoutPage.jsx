import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../../slices/cartSlice';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import locations from "../../assets/locations.json";

const EMPTY_PERSONAL_DATA = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

const EMPTY_COMPANY_DATA = {
  companyName: '',
  cui: '',
  nrRegCom: '',
};

const EMPTY_ADDRESS = {
  street: '',
  number: '',
  block: '',
  entrance: '',
  apartment: '',
  county: '',
  city: '',
};

const EMPTY_ERRORS = {
  personalData: {},
  companyData: {},
  billingAddress: {},
  deliveryAddress: {},
};

const EMPTY_TOUCHED = {
  personalData: {},
  companyData: {},
  billingAddress: {},
  deliveryAddress: {},
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const trimObjectValues = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, normalizeString(value)])
  );

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeString(email));
const validatePhone = (phone) => /^(\+40|0)\d{9}$/.test(String(phone || '').replace(/\s+/g, ''));
const validateCui = (cui) => /^[0-9]{2,10}$/.test(String(cui || '').trim().replace(/^RO/i, ''));
const isFilled = (value) => Boolean(normalizeString(value));

const CheckoutPage = () => {
  const items = useSelector((state) => state.cart.items);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userPrepopulated, setUserPrepopulated] = useState(false);
  const [userType, setUserType] = useState('persoana_fizica');

  const [personalData, setPersonalData] = useState(EMPTY_PERSONAL_DATA);
  const [companyData, setCompanyData] = useState(EMPTY_COMPANY_DATA);
  const [billingAddress, setBillingAddress] = useState(EMPTY_ADDRESS);
  const [deliveryAddress, setDeliveryAddress] = useState(EMPTY_ADDRESS);
  const [deliveryOption, setDeliveryOption] = useState('same_as_billing');

  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [touched, setTouched] = useState(EMPTY_TOUCHED);

  const counties = useMemo(() => {
    return [...new Set(locations.map((l) => l.judet))].sort((a, b) =>
      a === 'BUCURESTI' ? -1 : b === 'BUCURESTI' ? 1 : a.localeCompare(b)
    );
  }, []);

  const citiesByCounty = useMemo(() => {
    return locations.reduce((acc, loc) => {
      if (!acc[loc.judet]) acc[loc.judet] = [];
      acc[loc.judet].push(loc.nume);
      return acc;
    }, {});
  }, []);

  const getCities = useCallback(
    (county) => {
      if (!county || !citiesByCounty[county]) return [];
      return [...citiesByCounty[county]].sort((a, b) => a.localeCompare(b));
    },
    [citiesByCounty]
  );

  const totalPrice = useMemo(() => {
    return items.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0);
  }, [items]);

  const totalPriceWithTVA = useMemo(() => totalPrice * 1.21, [totalPrice]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const validateSection = useCallback((sectionName, data) => {
    const nextErrors = {};

    if (sectionName === 'personalData') {
      if (!isFilled(data.lastName)) nextErrors.lastName = 'Numele este obligatoriu.';
      if (!isFilled(data.firstName) && userType === 'persoana_fizica') nextErrors.firstName = 'Prenumele este obligatoriu.';
      if (!isFilled(data.email)) {
        nextErrors.email = 'Emailul este obligatoriu.';
      } else if (!validateEmail(data.email)) {
        nextErrors.email = 'Introdu o adresă de email validă.';
      }

      if (!isFilled(data.phoneNumber)) {
        nextErrors.phoneNumber = 'Telefonul este obligatoriu.';
      } else if (!validatePhone(data.phoneNumber)) {
        nextErrors.phoneNumber = 'Introdu un număr de telefon valid.';
      }
    }

    if (sectionName === 'companyData' && userType === 'persoana_juridica') {
      if (!isFilled(data.companyName)) nextErrors.companyName = 'Numele companiei este obligatoriu.';
      if (!isFilled(data.cui)) {
        nextErrors.cui = 'CUI-ul este obligatoriu.';
      } else if (!validateCui(data.cui)) {
        nextErrors.cui = 'Introdu un CUI valid.';
      }

      if (!isFilled(data.nrRegCom)) nextErrors.nrRegCom = 'Nr. Reg. Com. este obligatoriu.';
    }

    if (sectionName === 'billingAddress' || sectionName === 'deliveryAddress') {
      if (!isFilled(data.county)) nextErrors.county = 'Județul este obligatoriu.';
      if (!isFilled(data.city)) nextErrors.city = 'Orașul este obligatoriu.';
      if (!isFilled(data.street)) nextErrors.street = 'Strada este obligatorie.';
      if (!isFilled(data.number)) nextErrors.number = 'Numărul este obligatoriu.';
    }

    return nextErrors;
  }, [userType]);

  const buildAllErrors = useCallback(() => {
    const cleanPersonal = trimObjectValues(personalData);
    const cleanCompany = trimObjectValues(companyData);
    const cleanBilling = trimObjectValues(billingAddress);
    const cleanDelivery = trimObjectValues(deliveryAddress);

    return {
      personalData: validateSection('personalData', cleanPersonal),
      companyData: validateSection('companyData', cleanCompany),
      billingAddress: validateSection('billingAddress', cleanBilling),
      deliveryAddress:
        deliveryOption === 'new_address'
          ? validateSection('deliveryAddress', cleanDelivery)
          : {},
    };
  }, [
    personalData,
    companyData,
    billingAddress,
    deliveryAddress,
    deliveryOption,
    validateSection,
  ]);

  const hasErrors = useCallback((errorObject) => {
    return Object.values(errorObject).some((section) => Object.keys(section).length > 0);
  }, []);

  const isFormValid = useMemo(() => {
    if (items.length === 0) return false;
    const nextErrors = buildAllErrors();
    return !hasErrors(nextErrors);
  }, [items.length, buildAllErrors, hasErrors]);

  const markFieldTouched = useCallback((section, field) => {
    setTouched((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: true,
      },
    }));
  }, []);

  const setFieldError = useCallback((section, field, value) => {
    setErrors((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }, []);

  const clearFieldError = useCallback((section, field) => {
    setErrors((prev) => {
      const nextSection = { ...prev[section] };
      delete nextSection[field];

      return {
        ...prev,
        [section]: nextSection,
      };
    });
  }, []);

  const validateSingleField = useCallback((section, field, value, currentSectionData) => {
    const normalizedValue = normalizeString(value);
    let errorMessage = '';

    if (section === 'personalData') {
      if (field === 'lastName' && !isFilled(normalizedValue)) errorMessage = 'Numele este obligatoriu.';
      if (field === 'firstName' && userType === 'persoana_fizica' && !isFilled(normalizedValue)) errorMessage = 'Prenumele este obligatoriu.';
      if (field === 'email') {
        if (!isFilled(normalizedValue)) errorMessage = 'Emailul este obligatoriu.';
        else if (!validateEmail(normalizedValue)) errorMessage = 'Introdu o adresă de email validă.';
      }
      if (field === 'phoneNumber') {
        if (!isFilled(normalizedValue)) errorMessage = 'Telefonul este obligatoriu.';
        else if (!validatePhone(normalizedValue)) errorMessage = 'Introdu un număr de telefon valid.';
      }
    }

    if (section === 'companyData' && userType === 'persoana_juridica') {
      if (field === 'companyName' && !isFilled(normalizedValue)) errorMessage = 'Numele companiei este obligatoriu.';
      if (field === 'cui') {
        if (!isFilled(normalizedValue)) errorMessage = 'CUI-ul este obligatoriu.';
        else if (!validateCui(normalizedValue)) errorMessage = 'Introdu un CUI valid.';
      }
      if (field === 'nrRegCom' && !isFilled(normalizedValue)) errorMessage = 'Nr. Reg. Com. este obligatoriu.';
    }

    if (section === 'billingAddress' || section === 'deliveryAddress') {
      if (field === 'county' && !isFilled(normalizedValue)) errorMessage = 'Județul este obligatoriu.';
      if (field === 'city' && !isFilled(normalizedValue)) errorMessage = 'Orașul este obligatoriu.';
      if (field === 'street' && !isFilled(normalizedValue)) errorMessage = 'Strada este obligatorie.';
      if (field === 'number' && !isFilled(normalizedValue)) errorMessage = 'Numărul este obligatoriu.';
    }

    if (errorMessage) {
      setFieldError(section, field, errorMessage);
    } else {
      clearFieldError(section, field);
    }
  }, [userType, setFieldError, clearFieldError]);

  const prepopulateUserData = useCallback(async () => {
    try {
      const [userResponse, addressResponse] = await Promise.allSettled([
        axiosInstance.get('/user/me'),
        axiosInstance.get('/user/billing-address'),
      ]);

      if (userResponse.status === 'fulfilled') {
        const user = userResponse.value?.data?.user;

        if (user) {
          setUserType(user.userType || 'persoana_fizica');
          setPersonalData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phone || '',
          });
          setCompanyData(user.companyDetails || EMPTY_COMPANY_DATA);
          setUserPrepopulated(true);
        }
      }

      if (addressResponse.status === 'fulfilled') {
        const savedBillingAddress = addressResponse.value?.data?.billingAddress;
        if (savedBillingAddress) {
          const normalizedAddress = { ...EMPTY_ADDRESS, ...savedBillingAddress };
          setBillingAddress(normalizedAddress);
          setDeliveryAddress(normalizedAddress);
        }
      }
    } catch (error) {
      console.error('Eroare la preluarea datelor utilizatorului:', error?.message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      prepopulateUserData();
    } else {
      setUserPrepopulated(false);
    }
  }, [isAuthenticated, prepopulateUserData]);

  useEffect(() => {
    if (deliveryOption === 'same_as_billing') {
      setDeliveryAddress(billingAddress);
    }
  }, [billingAddress, deliveryOption]);

  const handleUserTypeChange = useCallback((newType) => {
    setUserType(newType);
    setErrors(EMPTY_ERRORS);
    setTouched(EMPTY_TOUCHED);

    if (newType === 'persoana_fizica') {
      setCompanyData(EMPTY_COMPANY_DATA);
    } else {
      setPersonalData((prev) => ({
        ...prev,
        firstName: '',
        lastName: '',
      }));
    }
  }, []);

  const handlePersonalDataChange = useCallback((field, value) => {
    setPersonalData((prev) => ({ ...prev, [field]: value }));

    if (touched.personalData[field]) {
      validateSingleField('personalData', field, value, {
        ...personalData,
        [field]: value,
      });
    }
  }, [personalData, touched.personalData, validateSingleField]);

  const handleCompanyDataChange = useCallback((field, value) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));

    if (touched.companyData[field]) {
      validateSingleField('companyData', field, value, {
        ...companyData,
        [field]: value,
      });
    }
  }, [companyData, touched.companyData, validateSingleField]);

  const handleAddressChange = useCallback((type, field, value) => {
    const section = type === 'billing' ? 'billingAddress' : 'deliveryAddress';
    const setter = type === 'billing' ? setBillingAddress : setDeliveryAddress;

    setter((prev) => {
      const nextValue =
        field === 'county'
          ? { ...prev, county: value, city: '' }
          : { ...prev, [field]: value };

      if (touched[section][field]) {
        validateSingleField(section, field, value, nextValue);
      }

      if (field === 'county') {
        clearFieldError(section, 'city');
      }

      return nextValue;
    });
  }, [touched, validateSingleField, clearFieldError]);

  const handleBlur = useCallback((section, field, value, currentSectionData) => {
    markFieldTouched(section, field);
    validateSingleField(section, field, value, currentSectionData);
  }, [markFieldTouched, validateSingleField]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Coșul este gol!');
      return;
    }

    const nextErrors = buildAllErrors();
    setErrors(nextErrors);
    setTouched({
      personalData: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
      companyData: {
        companyName: true,
        cui: true,
        nrRegCom: true,
      },
      billingAddress: {
        county: true,
        city: true,
        street: true,
        number: true,
      },
      deliveryAddress: {
        county: true,
        city: true,
        street: true,
        number: true,
      },
    });

    if (hasErrors(nextErrors)) {
      toast.error('Te rog verifică câmpurile marcate.');
      return;
    }

    const cleanedPersonalData = trimObjectValues(personalData);
    const cleanedCompanyData = trimObjectValues(companyData);
    const cleanedBillingAddress = trimObjectValues(billingAddress);
    const cleanedDeliveryAddress = trimObjectValues(deliveryAddress);

    const finalDeliveryAddress =
      deliveryOption === 'pickup'
        ? { pickup: 'Sediul Central' }
        : deliveryOption === 'same_as_billing'
          ? cleanedBillingAddress
          : cleanedDeliveryAddress;

    const orderData = {
      type: 'catalog_order',
      userType,
      email: cleanedPersonalData.email,
      phoneNumber: cleanedPersonalData.phoneNumber,
      firstName: userType === 'persoana_fizica' ? cleanedPersonalData.firstName : '',
      lastName: userType === 'persoana_fizica' ? cleanedPersonalData.lastName : '',
      companyDetails: userType === 'persoana_juridica' ? cleanedCompanyData : {},
      billingAddress: cleanedBillingAddress,
      deliveryAddress: finalDeliveryAddress,
      pickupAtCentral: deliveryOption === 'pickup',
      items: items.map((item) => ({
        productId: item._id,
        title: item.title,
        code: item.code,
        price: item.price || 0,
        qty: item.qty || 1,
      })),
      totalAmount: totalPrice,
      totalAmountWithTVA: totalPriceWithTVA,
    };

    setLoading(true);

    try {
      const response = await axiosInstance.post('/catalog-orders', orderData);

      if ([200, 201, 204].includes(response.status)) {
        toast.success('Comanda a fost trimisă cu succes! Veți fi contactat în curând.');
        dispatch(clearCart());
        navigate('/');
      }
    } catch (err) {
      console.error('Eroare la comandă:', err);
      toast.error(err.response?.data?.message || 'Eroare la trimiterea comenzii. Verificați datele.');
    } finally {
      setLoading(false);
    }
  }, [
    items,
    buildAllErrors,
    hasErrors,
    personalData,
    companyData,
    billingAddress,
    deliveryAddress,
    deliveryOption,
    userType,
    totalPrice,
    totalPriceWithTVA,
    dispatch,
    navigate,
  ]);

  const renderAddressFields = useCallback((address, type) => {
    const section = type === 'billing' ? 'billingAddress' : 'deliveryAddress';

    return (
      <Row className="g-3">
        <Col md={6}>
          <Form.Label>Județ</Form.Label>
          <Form.Select
            value={address.county}
            onChange={(e) => handleAddressChange(type, 'county', e.target.value)}
            onBlur={(e) => handleBlur(section, 'county', e.target.value, address)}
            isInvalid={touched[section].county && !!errors[section].county}
          >
            <option value="">Selectează județul</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors[section].county}
          </Form.Control.Feedback>
        </Col>

        <Col md={6}>
          <Form.Label>Oraș</Form.Label>
          <Form.Select
            value={address.city}
            onChange={(e) => handleAddressChange(type, 'city', e.target.value)}
            onBlur={(e) => handleBlur(section, 'city', e.target.value, address)}
            disabled={!address.county}
            isInvalid={touched[section].city && !!errors[section].city}
          >
            <option value="">Selectează orașul</option>
            {getCities(address.county).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors[section].city}
          </Form.Control.Feedback>
        </Col>

        <Col md={9}>
          <Form.Label>Strada</Form.Label>
          <Form.Control
            value={address.street}
            onChange={(e) => handleAddressChange(type, 'street', e.target.value)}
            onBlur={(e) => handleBlur(section, 'street', e.target.value, address)}
            isInvalid={touched[section].street && !!errors[section].street}
          />
          <Form.Control.Feedback type="invalid">
            {errors[section].street}
          </Form.Control.Feedback>
        </Col>

        <Col md={3}>
          <Form.Label>Număr</Form.Label>
          <Form.Control
            value={address.number}
            onChange={(e) => handleAddressChange(type, 'number', e.target.value)}
            onBlur={(e) => handleBlur(section, 'number', e.target.value, address)}
            isInvalid={touched[section].number && !!errors[section].number}
          />
          <Form.Control.Feedback type="invalid">
            {errors[section].number}
          </Form.Control.Feedback>
        </Col>

        <Col md={4}>
          <Form.Label>Bloc</Form.Label>
          <Form.Control
            value={address.block}
            onChange={(e) => handleAddressChange(type, 'block', e.target.value)}
          />
        </Col>

        <Col md={4}>
          <Form.Label>Scară</Form.Label>
          <Form.Control
            value={address.entrance}
            onChange={(e) => handleAddressChange(type, 'entrance', e.target.value)}
          />
        </Col>

        <Col md={4}>
          <Form.Label>Apartament</Form.Label>
          <Form.Control
            value={address.apartment}
            onChange={(e) => handleAddressChange(type, 'apartment', e.target.value)}
          />
        </Col>
      </Row>
    );
  }, [counties, errors, touched, getCities, handleAddressChange, handleBlur]);

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-primary fw-bold">Finalizare Comandă</h2>

      {isAuthenticated && userPrepopulated && (
        <div className="alert alert-info text-center">
          Câmpurile au fost precompletate cu informațiile tale și pot fi editate.
        </div>
      )}

      <Form noValidate onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col lg={7}>
            <Card className="p-4 shadow-sm border-0 mb-4 rounded-3">
              <h5 className="mb-4 text-secondary border-bottom pb-2 fw-bold">Date Client</h5>

              <div className="d-flex gap-3 mb-3">
                <Button
                  type="button"
                  variant={userType === 'persoana_fizica' ? 'primary' : 'outline-primary'}
                  onClick={() => handleUserTypeChange('persoana_fizica')}
                >
                  Persoană Fizică
                </Button>

                <Button
                  type="button"
                  variant={userType === 'persoana_juridica' ? 'primary' : 'outline-primary'}
                  onClick={() => handleUserTypeChange('persoana_juridica')}
                >
                  Persoană Juridică
                </Button>
              </div>

              {userType === 'persoana_fizica' ? (
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Nume</Form.Label>
                    <Form.Control
                      value={personalData.lastName}
                      onChange={(e) => handlePersonalDataChange('lastName', e.target.value)}
                      onBlur={(e) => handleBlur('personalData', 'lastName', e.target.value, personalData)}
                      isInvalid={touched.personalData.lastName && !!errors.personalData.lastName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.personalData.lastName}
                    </Form.Control.Feedback>
                  </Col>

                  <Col md={6}>
                    <Form.Label>Prenume</Form.Label>
                    <Form.Control
                      value={personalData.firstName}
                      onChange={(e) => handlePersonalDataChange('firstName', e.target.value)}
                      onBlur={(e) => handleBlur('personalData', 'firstName', e.target.value, personalData)}
                      isInvalid={touched.personalData.firstName && !!errors.personalData.firstName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.personalData.firstName}
                    </Form.Control.Feedback>
                  </Col>
                </Row>
              ) : (
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Label>Nume Companie</Form.Label>
                    <Form.Control
                      value={companyData.companyName}
                      onChange={(e) => handleCompanyDataChange('companyName', e.target.value)}
                      onBlur={(e) => handleBlur('companyData', 'companyName', e.target.value, companyData)}
                      isInvalid={touched.companyData.companyName && !!errors.companyData.companyName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.companyData.companyName}
                    </Form.Control.Feedback>
                  </Col>

                  <Col md={6}>
                    <Form.Label>CUI</Form.Label>
                    <Form.Control
                      value={companyData.cui}
                      onChange={(e) => handleCompanyDataChange('cui', e.target.value)}
                      onBlur={(e) => handleBlur('companyData', 'cui', e.target.value, companyData)}
                      isInvalid={touched.companyData.cui && !!errors.companyData.cui}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.companyData.cui}
                    </Form.Control.Feedback>
                  </Col>

                  <Col md={6}>
                    <Form.Label>Nr. Reg. Com.</Form.Label>
                    <Form.Control
                      value={companyData.nrRegCom}
                      onChange={(e) => handleCompanyDataChange('nrRegCom', e.target.value)}
                      onBlur={(e) => handleBlur('companyData', 'nrRegCom', e.target.value, companyData)}
                      isInvalid={touched.companyData.nrRegCom && !!errors.companyData.nrRegCom}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.companyData.nrRegCom}
                    </Form.Control.Feedback>
                  </Col>
                </Row>
              )}

              <Row className="g-3 mt-2">
                <Col md={6}>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={personalData.email}
                    readOnly
                    className="bg-light"
                    onBlur={(e) => handleBlur('personalData', 'email', e.target.value, personalData)}
                    isInvalid={touched.personalData.email && !!errors.personalData.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.personalData.email}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Emailul este preluat din contul tău.
                  </Form.Text>
                </Col>

                <Col md={6}>
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control
                    value={personalData.phoneNumber}
                    onChange={(e) => handlePersonalDataChange('phoneNumber', e.target.value)}
                    onBlur={(e) => handleBlur('personalData', 'phoneNumber', e.target.value, personalData)}
                    isInvalid={touched.personalData.phoneNumber && !!errors.personalData.phoneNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.personalData.phoneNumber}
                  </Form.Control.Feedback>
                </Col>
              </Row>
            </Card>

            <Card className="p-4 shadow-sm border-0 mb-4 rounded-3">
              <h5 className="mb-4 text-secondary border-bottom pb-2 fw-bold">Adresa de Facturare</h5>
              {renderAddressFields(billingAddress, 'billing')}
            </Card>

            <Card className="p-4 shadow-sm border-0 rounded-3">
              <h5 className="mb-4 text-secondary border-bottom pb-2 fw-bold">Opțiuni de Livrare</h5>

              <div className="mb-4 d-grid gap-2">
                <div
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded border d-flex align-items-center justify-content-between ${
                    deliveryOption === 'same_as_billing'
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-light bg-light'
                  }`}
                  onClick={() => setDeliveryOption('same_as_billing')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setDeliveryOption('same_as_billing');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="fw-semibold">Aceeași cu adresa de facturare</div>
                    <small className="text-muted">Vom folosi automat adresa introdusă mai sus.</small>
                  </div>
                  <Form.Check
                    type="radio"
                    name="delivery"
                    checked={deliveryOption === 'same_as_billing'}
                    onChange={() => setDeliveryOption('same_as_billing')}
                    className="ms-3"
                  />
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded border d-flex align-items-center justify-content-between ${
                    deliveryOption === 'pickup'
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-light bg-light'
                  }`}
                  onClick={() => setDeliveryOption('pickup')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setDeliveryOption('pickup');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="fw-semibold">Ridicare de la sediul central</div>
                    <small className="text-muted">Ridici personal comanda din locația noastră.</small>
                  </div>
                  <Form.Check
                    type="radio"
                    name="delivery"
                    checked={deliveryOption === 'pickup'}
                    onChange={() => setDeliveryOption('pickup')}
                    className="ms-3"
                  />
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded border d-flex align-items-center justify-content-between ${
                    deliveryOption === 'new_address'
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-light bg-light'
                  }`}
                  onClick={() => setDeliveryOption('new_address')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setDeliveryOption('new_address');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="fw-semibold">Altă adresă de livrare</div>
                    <small className="text-muted">Completezi o adresă separată pentru livrare.</small>
                  </div>
                  <Form.Check
                    type="radio"
                    name="delivery"
                    checked={deliveryOption === 'new_address'}
                    onChange={() => setDeliveryOption('new_address')}
                    className="ms-3"
                  />
                </div>
              </div>

              {deliveryOption === 'new_address' && renderAddressFields(deliveryAddress, 'delivery')}
            </Card>
          </Col>

          <Col lg={5}>
            <Card className="p-4 shadow-sm border-0 bg-dark text-white sticky-top rounded-3" style={{ top: '100px' }}>
              <h5 className="mb-4 border-bottom border-secondary pb-2 fw-bold">Sumar Comandă</h5>

              <div className="mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {items.map((item) => {
                  const itemPrice = item.price || 0;
                  const itemQty = item.qty || 0;
                  const lineTotal = itemPrice * itemQty;

                  return (
                    <div key={item._id} className="d-flex justify-content-between mb-3 border-bottom border-secondary pb-2">
                      <div style={{ maxWidth: '70%' }}>
                        <div className="fw-bold text-truncate">{item.title}</div>
                        <small className="text-muted">
                          {itemQty} buc. × {itemPrice.toFixed(2)} RON / buc (fără TVA)
                        </small>
                        <br />
                        <small className="text-warning-emphasis">
                          {(itemPrice * 1.21).toFixed(2)} RON / buc (cu TVA)
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-warning">
                          {(lineTotal * 1.21).toFixed(2)} RON
                        </div>
                        <small className="text-muted">
                          {lineTotal.toFixed(2)} fără TVA
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="d-flex justify-content-between mb-2 text-muted">
                <span>Total fără TVA:</span>
                <span>{totalPrice.toFixed(2)} RON</span>
              </div>

              <div className="d-flex justify-content-between fs-4 fw-bold mb-4">
                <span>Total cu TVA (21%):</span>
                <span className="text-warning">{totalPriceWithTVA.toFixed(2)} RON</span>
              </div>

              <Button
                type="submit"
                variant="warning"
                className="w-100 py-3 fs-5 fw-bold shadow"
                disabled={loading || !isFormValid}
              >
                {loading ? 'Se procesează...' : 'TRIMITE COMANDA'}
              </Button>

              {!isFormValid && (
                <small className="text-light mt-3 d-block text-center opacity-75">
                  Completează corect toate câmpurile obligatorii.
                </small>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default CheckoutPage;