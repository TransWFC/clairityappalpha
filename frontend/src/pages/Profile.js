import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import NavbarComponent from "../components/NavbarComponent"; 
import perfilImage from "../resources/perfil_2.png"; 

const Profile = () => {
    const [user, setUser] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [newValue, setNewValue] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [modalVisible, setModalVisible] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                const data = await response.json();
                if (response.ok) {
                    setUser(data);
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
        if (field === 'email') setCodeSent(false);
    };

    const handleSendVerificationCode = async () => {
        try {
            const response = await fetch('/api/auth/send-verification-code-user', {
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
        try {
            const requestBody = { [editingField]: newValue, confirmPassword };
            if (editingField === 'email' && codeSent) {
                requestBody.verificationCode = verificationCode;
            }

            const response = await fetch('/api/auth/update', {
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

            console.log("Usuario actualizado:", data);

            setUser((prev) => ({ ...prev, [editingField]: newValue }));
            setModalVisible(false);
            setError('');
        } catch (error) {
            console.error("Error al actualizar:", error);
            setError(error.message);
        }
    };

    if (!user) return <p>Cargando...</p>;

    return (
        <>
            <NavbarComponent />
            <div className="container mt-5">
                <div className="card p-4 shadow-lg rounded">
                    <div className="text-center mb-4">
                        <img src={perfilImage} alt="Imagen de perfil" className="rounded-circle" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                    </div>
                    <h1 className="text-center mb-3">Perfil</h1>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <p><strong>Nombre:</strong> {user.name}</p>
                        <Pencil className="cursor-pointer text-primary" onClick={() => handleEdit('name', user.name)} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <p><strong>Email:</strong> {user.email}</p>
                        <Pencil className="cursor-pointer text-primary" onClick={() => handleEdit('email', user.email)} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <p><strong>Contraseña:</strong> ********</p>
                        <Pencil className="cursor-pointer text-primary" onClick={() => handleEdit('password', '')} />
                    </div>
                    {modalVisible && (
                        <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Editar {editingField}</h5>
                                        <button type="button" className="close" onClick={() => setModalVisible(false)}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        {editingField === 'email' && !codeSent ? (
                                            <>
                                                <input type="text" placeholder="Nuevo correo" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="form-control mt-3" />
                                                <button className="btn w-100 mt-3" onClick={handleSendVerificationCode}>Enviar código</button>
                                            </>
                                        ) : (
                                            <>
                                                <input type={editingField === 'password' ? 'password' : 'text'} value={newValue} onChange={(e) => setNewValue(e.target.value)} className="form-control mt-3" />
                                                {editingField === 'password' && <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-control mt-3" />}
                                                {editingField === 'email' && codeSent && <input type="text" placeholder="Código de verificación" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="form-control mt-3" />}
                                            </>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setModalVisible(false)}>Cancelar</button>
                                        <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Profile;
