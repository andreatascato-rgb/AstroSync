import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import UsersManagement from './UsersManagement';

function Dashboard({ user, onLogout }) {
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Verifica token e carica dati utente
    const verifyUser = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setUserData(response.data.user);
      } catch (error) {
        console.error('Errore verifica utente:', error);
        // Token non valido, logout
        authAPI.logout();
        onLogout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [onLogout]);

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>AstroSync Dashboard</h1>
        <button
          onClick={() => {
            authAPI.logout();
            onLogout();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Tabs Navigation */}
      {(userData?.role === 'creator' || userData?.role === 'admin') && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '2px solid #dee2e6',
          }}
        >
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'profile' ? '#007bff' : 'transparent',
              color: activeTab === 'profile' ? 'white' : '#007bff',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #007bff' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
            }}
          >
            👤 Profilo
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'users' ? '#007bff' : 'transparent',
              color: activeTab === 'users' ? 'white' : '#007bff',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #007bff' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            }}
          >
            👥 Utenti e Ruoli
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h2>Benvenuto, {userData?.name || userData?.email}!</h2>
          <div style={{ marginTop: '20px' }}>
            <p>
              <strong>Email:</strong> {userData?.email}
            </p>
            <p>
              <strong>ID Utente:</strong> {userData?.id}
            </p>
            <p>
              <strong>Ruolo:</strong>{' '}
              <span
                style={{
                  backgroundColor:
                    userData?.role === 'creator'
                      ? '#6f42c1'
                      : userData?.role === 'admin'
                      ? '#007bff'
                      : '#6c757d',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {userData?.role === 'creator'
                  ? '👑 Creator'
                  : userData?.role === 'admin'
                  ? '⚙️ Admin'
                  : '👤 Utente'}
              </span>
            </p>
            <p>
              <strong>Registrato il:</strong>{' '}
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString('it-IT')
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (userData?.role === 'creator' || userData?.role === 'admin') && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <UsersManagement />
        </div>
      )}

      {activeTab === 'profile' && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
          <h3>Area Funzionalità</h3>
          <p>Qui verranno aggiunte le funzionalità principali dell'app.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

