import { useState, useEffect } from 'react'
import { authAPI } from './services/api'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se c'è un token salvato
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          // Verifica token con il server
          const response = await authAPI.getCurrentUser()
          setUser(response.data.user)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Token non valido:', error)
          // Token non valido, rimuovi
          authAPI.logout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = () => {
    const storedUser = authAPI.getStoredUser()
    setUser(storedUser)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <p>Caricamento...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div>
      {showRegister ? (
        <>
          <Register onRegisterSuccess={handleLoginSuccess} />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>
              Già registrato?{' '}
              <button
                onClick={() => setShowRegister(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Accedi
              </button>
            </p>
          </div>
        </>
      ) : (
        <>
          <Login onLoginSuccess={handleLoginSuccess} />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>
              Non hai un account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Registrati
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default App
