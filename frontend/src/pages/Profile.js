import { useEffect, useState } from 'react';
import { Card, Container, Row, Col, Button, Form, Alert, Modal } from "react-bootstrap";
import {
  BsPerson, BsEnvelope, BsLock, BsPencil, BsCheck, BsX,
  BsShield, BsPersonGear, BsEye, BsEyeSlash
} from 'react-icons/bs';
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import Footer from "../components/footer";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          setUserType(data.type);
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('Error al obtener el usuario.');
      }
    };
    fetchUser();
  }, []);

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setNewValue(currentValue);
    setConfirmPassword('');
    setModalVisible(true);
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (field === 'email') setCodeSent(false);
  };

  const handleSendVerificationCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email: newValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setCodeSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (editingField === 'email' && !codeSent) {
      setError('Por favor, envía el código de verificación antes de guardar.');
      return;
    }
    if (editingField === 'password' && newValue !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const requestBody = { [editingField]: newValue, confirmPassword };
      if (editingField === 'email' && codeSent) {
        requestBody.verificationCode = verificationCode;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Error inesperado del servidor');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error desconocido');
      }

      setUser((prev) => ({ ...prev, [editingField]: newValue }));
      setModalVisible(false);
      setError('');

      // Update localStorage if user data changed
      if (editingField === 'name' || editingField === 'email') {
        const updatedUser = JSON.parse(localStorage.getItem('user'));
        updatedUser[editingField] = newValue;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setError('');
    setNewValue('');
    setConfirmPassword('');
    setVerificationCode('');
    setCodeSent(false);
    setEditingField(null);
  };

  const getInitials = (name) => (!name ? 'U' : name.split(' ').map(n => n[0]).join('').toUpperCase());

  const getUserTypeInfo = (type) => {
    return type === 'admin'
      ? { label: 'Administrador', icon: BsShield, color: 'warning' }
      : { label: 'Usuario', icon: BsPerson, color: 'info' };
  };

  // Visual surfaces
  const cardStyle = {
    border: 'none',
    borderRadius: '18px',
    boxShadow: '0 8px 28px rgba(16,24,40,0.10)',
    transition: 'transform .25s ease, box-shadow .25s ease',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
    position: 'relative',
    overflow: 'hidden'
  };
  const cardHoverStyle = { transform: 'translateY(-4px)', boxShadow: '0 16px 44px rgba(16,24,40,0.16)' };

  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    padding: '12px 24px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
  };

  const backgroundPattern = {
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
    zIndex: 1
  };

  if (!user) {
    return (
      <LayoutWithSidebar>
        <div className="d-flex flex-column min-vh-100" style={{
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          background: 'linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)'
        }}>
          <div className="d-flex justify-content-center align-items-center flex-grow-1">
            <div className="text-center">
              <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }} />
              <h5 className="fw-semibold mb-2">Cargando perfil...</h5>
              <p className="text-muted">Obteniendo información del usuario</p>
            </div>
          </div>
          <Footer />
        </div>
      </LayoutWithSidebar>
    );
  }

  const typeInfo = getUserTypeInfo(user.type);
  const TypeIcon = typeInfo.icon;

  return (
    <LayoutWithSidebar>
      <div
        className="d-flex flex-column min-vh-100 profile-page"
        style={{
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          paddingTop: "60px",
          background: 'linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)'
        }}
      >
        <div className="flex-grow-1 d-flex flex-column" style={{ overflow: "auto", padding: '0 24px 24px' }}>
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center py-4 gap-3">
            <div>
              <h1 className="fw-bold mb-1 pf-title">Mi Perfil</h1>
              <p className="mb-0 pf-text-subtle" style={{ fontSize: "1.05rem" }}>
                Gestiona tu información personal y configuración de cuenta
              </p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button
                className="bg-white rounded-circle p-3 shadow-sm border-0 pf-contrast-surface"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,24,40,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(16,24,40,0.08)";
                }}
                aria-label="Opciones de perfil"
              >
                <BsPersonGear size={20} className="pf-icon-primary" />
              </button>
            </div>
          </div>

          <Container fluid className="px-0">
            {/* Error */}
            {error && (
              <Alert
                variant="danger"
                className="d-flex align-items-center mb-4 pf-alert"
              >
                <BsX size={20} className="me-2" />
                {error}
              </Alert>
            )}

            {/* Cards */}
            <Row className="g-4">
              {/* Main */}
              <Col xs={12} lg={8}>
                <Card
                  style={cardStyle}
                  className="profile-card"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,24,40,0.10)';
                  }}
                >
                  <div style={backgroundPattern} />
                  <Card.Body className="p-4 p-sm-5 position-relative" style={{ zIndex: 2 }}>
                    {/* Header */}
                    <div className="d-flex align-items-center mb-4 mb-sm-5 flex-wrap gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold pf-avatar"
                        style={{
                          width: 'clamp(72px, 14vw, 100px)',
                          height: 'clamp(72px, 14vw, 100px)',
                          background: user.type === 'admin'
                            ? 'linear-gradient(135deg, #ff9a56 0%, #ffad56 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: 'clamp(1.4rem, 3.2vw, 2.2rem)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          border: '3px solid rgba(255,255,255,0.9)'
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="flex-grow-1">
                        <h2 className="fw-bold mb-2 pf-text-title" style={{ fontSize: 'clamp(1.25rem, 2.4vw, 2rem)' }}>
                          {user.name}
                        </h2>
                        <div className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap">
                          <span
                            className={`badge bg-${typeInfo.color} bg-opacity-20 text-${typeInfo.color} px-3 py-2 pf-role-badge text-white`}
                          >
                            <TypeIcon size={16} className="me-2" />
                            {typeInfo.label}
                          </span>
                          <span className="badge bg-success bg-opacity-20 text-white px-3 py-2 pf-role-badge">
                            ● Cuenta Activa
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="row g-3 g-sm-4">
                      {/* Name */}
                      <div className="col-12">
                        <div className="pf-field">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2">
                                <div className="pf-chip me-3">
                                  <BsPerson size={18} className="pf-icon-primary" />
                                </div>
                                <span className="fw-semibold pf-text-title" style={{ fontSize: '1rem' }}>
                                  Nombre Completo
                                </span>
                              </div>
                              <p className="mb-0 ps-5 pf-text-strong">
                                {user.name}
                              </p>
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit('name', user.name)}
                              className="pf-btn-outline"
                            >
                              <BsPencil size={14} className="me-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-12">
                        <div className="pf-field">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2">
                                <div className="pf-chip me-3">
                                  <BsEnvelope size={18} className="pf-icon-success" />
                                </div>
                                <span className="fw-semibold pf-text-title" style={{ fontSize: '1rem' }}>
                                  Correo Electrónico
                                </span>
                              </div>
                              <p className="mb-0 ps-5 pf-text-strong">
                                {user.email}
                              </p>
                            </div>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleEdit('email', user.email)}
                              className="pf-btn-outline"
                            >
                              <BsPencil size={14} className="me-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="col-12">
                        <div className="pf-field">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2">
                                <div className="pf-chip me-3">
                                  <BsLock size={18} className="pf-icon-warning" />
                                </div>
                                <span className="fw-semibold pf-text-title" style={{ fontSize: '1rem' }}>
                                  Contraseña
                                </span>
                              </div>
                              <p className="mb-0 ps-5 pf-text-strong" style={{ letterSpacing: '2px' }}>
                                ••••••••••••
                              </p>
                            </div>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEdit('password', '')}
                              className="pf-btn-outline"
                            >
                              <BsPencil size={14} className="me-1" />
                              Cambiar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Side card */}
              <Col xs={12} lg={4}>
                <Card
                  style={cardStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,24,40,0.10)';
                  }}
                >
                  <div style={backgroundPattern} />
                  <Card.Body className="p-4 text-center position-relative" style={{ zIndex: 2 }}>
                    <div className="mb-4">
                      <div className="pf-chip pf-chip--brand mb-4" style={{ width: 80, height: 80 }}>
                        <TypeIcon size={32} className="pf-icon-primary" />
                      </div>
                      <h4 className="fw-semibold mb-3 pf-text-title">Información de Cuenta</h4>
                    </div>

                    <div className="text-start">
                      <div className="d-flex justify-content-between py-3 border-bottom pf-border-soft">
                        <span className="pf-text-subtle fw-medium">Tipo de cuenta:</span>
                        <span className="fw-bold pf-text-primary">{typeInfo.label}</span>
                      </div>
                        <div className="d-flex justify-content-between py-3 border-bottom pf-border-soft">
                            <span className="pf-text-subtle fw-medium">Correo electrónico:</span>
                            <span className="fw-bold pf-text-primary">{user.email}</span>
                      </div>
                    </div>

                    <div className="mt-4">
  <p className="pf-text-subtle mb-3" style={{ fontSize: '0.95rem' }}>
    ¿Necesitas ayuda con tu cuenta?
  </p>
  <Button
    as="a"
    href={`mailto:clairityapp@gmail.com?subject=${encodeURIComponent('Soporte de cuenta - Clairity')}&body=${encodeURIComponent('Hola equipo Clairity,\n\nDescribo mi problema:\n\n')}`}
    variant="outline-primary"
    className="w-100 pf-btn-outline"
  >
    Contactar Soporte
  </Button>
</div>

                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>

          {/* Modal */}
          <Modal show={modalVisible} onHide={handleCloseModal} centered backdrop="static" size="md">
            <Modal.Header
              closeButton
              className="border-0 pb-0"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                borderRadius: '20px 20px 0 0'
              }}
            >
              <Modal.Title className="d-flex align-items-center fw-bold pf-text-title" style={{ fontSize: '1.5rem' }}>
                <BsPencil size={24} className="me-3 pf-icon-primary" />
                Editar {editingField === 'name' ? 'Nombre' : editingField === 'email' ? 'Email' : 'Contraseña'}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)', padding: '2rem' }}
            >
              {editingField === 'email' && !codeSent ? (
                <>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold pf-text-title mb-2" style={{ fontSize: '1rem' }}>
                      Nuevo correo electrónico
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Ingresa tu nuevo correo"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="pf-input"
                    />
                  </Form.Group>
                  <Button
                    className="w-100"
                    style={primaryButtonStyle}
                    onClick={handleSendVerificationCode}
                    disabled={loading || !newValue}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar código de verificación'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {editingField !== 'email' && (
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold pf-text-title mb-2" style={{ fontSize: '1rem' }}>
                        {editingField === 'name' ? 'Nombre completo' : 'Nueva contraseña'}
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={editingField === 'password' && !showPassword ? 'password' : 'text'}
                          placeholder={editingField === 'name' ? 'Ingresa tu nombre' : 'Ingresa tu nueva contraseña'}
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          className="pf-input"
                          style={{ paddingRight: editingField === 'password' ? '50px' : undefined }}
                        />
                        {editingField === 'password' && (
                          <Button
                            variant="link"
                            className="position-absolute end-0 top-50 translate-middle-y p-0 me-3"
                            style={{ border: 'none', background: 'none' }}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                          </Button>
                        )}
                      </div>
                    </Form.Group>
                  )}

                  {editingField === 'password' && (
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold pf-text-title mb-2" style={{ fontSize: '1rem' }}>
                        Confirmar contraseña
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirma tu nueva contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pf-input"
                          style={{ paddingRight: '50px' }}
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y p-0 me-3"
                          style={{ border: 'none', background: 'none' }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                        </Button>
                      </div>
                    </Form.Group>
                  )}

                  {editingField === 'email' && codeSent && (
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold pf-text-title mb-2" style={{ fontSize: '1rem' }}>
                        Código de verificación
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingresa el código enviado a tu correo"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="pf-input"
                      />
                    </Form.Group>
                  )}

                  <div className="d-flex gap-3 justify-content-end">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCloseModal}
                      className="pf-btn-outline"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="d-flex align-items-center"
                      style={primaryButtonStyle}
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <BsCheck size={18} className="me-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </Modal.Body>
          </Modal>
        </div>

        <Footer />
      </div>
    </LayoutWithSidebar>
  );
};

export default Profile;
