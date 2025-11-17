import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [usersResponse, statsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStats(),
      ]);

      setUsers(usersResponse.data.users || usersResponse.data);
      setStats(statsResponse.data.stats);
    } catch (err) {
      console.error('Errore caricamento dati:', err);
      setError(err.message || 'Errore durante il caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError('');
      await adminAPI.updateUserRole(userId, newRole);
      await loadData(); // Ricarica i dati
      setEditingRole(null);
    } catch (err) {
      console.error('Errore aggiornamento ruolo:', err);
      setError(err.message || 'Errore durante l\'aggiornamento del ruolo');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'utente ${userEmail}?`)) {
      return;
    }

    try {
      setError('');
      await adminAPI.deleteUser(userId);
      await loadData(); // Ricarica i dati
    } catch (err) {
      console.error('Errore eliminazione utente:', err);
      setError(err.message || 'Errore durante l\'eliminazione dell\'utente');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'creator':
        return { bg: '#6f42c1', color: '#fff' };
      case 'admin':
        return { bg: '#007bff', color: '#fff' };
      case 'user':
        return { bg: '#6c757d', color: '#fff' };
      default:
        return { bg: '#e9ecef', color: '#000' };
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'creator':
        return '👑 Creator';
      case 'admin':
        return '⚙️ Admin';
      case 'user':
        return '👤 Utente';
      default:
        return role || 'N/A';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Caricamento utenti...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>👥 Gestione Utenti e Ruoli</h2>

      {error && (
        <div
          style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Statistiche */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '30px',
          }}
        >
          <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0056b3' }}>
              {stats.total_users}
            </div>
            <div style={{ color: '#666' }}>Totale Utenti</div>
          </div>
          <div style={{ backgroundColor: '#f0e7ff', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {stats.creators}
            </div>
            <div style={{ color: '#666' }}>Creator</div>
          </div>
          <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {stats.admins}
            </div>
            <div style={{ color: '#666' }}>Admin</div>
          </div>
          <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>
              {stats.users}
            </div>
            <div style={{ color: '#666' }}>Utenti</div>
          </div>
        </div>
      )}

      {/* Tabella Utenti */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Ruolo</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Registrato</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Nessun utente trovato
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleColor = getRoleBadgeColor(user.role);
                const isEditing = editingRole === user.id;

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: isEditing ? '#f8f9fa' : '#fff',
                    }}
                  >
                    <td style={{ padding: '12px' }}>{user.id}</td>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>{user.name || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                          }}
                        >
                          <option value="user">👤 Utente</option>
                          <option value="admin">⚙️ Admin</option>
                          <option value="creator">👑 Creator</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            backgroundColor: roleColor.bg,
                            color: roleColor.color,
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-block',
                          }}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('it-IT')
                        : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              handleRoleChange(user.id, selectedRole);
                            }}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ✓ Salva
                          </button>
                          <button
                            onClick={() => {
                              setEditingRole(null);
                              setSelectedRole('');
                            }}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ✕ Annulla
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setEditingRole(user.id);
                              setSelectedRole(user.role || 'user');
                            }}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ✏️ Modifica
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            🗑️ Elimina
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersManagement;

