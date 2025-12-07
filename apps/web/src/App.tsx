import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useApi } from './hooks/useApi';
import type { User } from '@reefing/shared-types';

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const { syncUser, getCurrentUser } = useApi();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Sync user to database on login
      syncUser()
        .then(() => getCurrentUser())
        .then((userData) => setDbUser(userData))
        .catch((error) => console.error('Failed to sync user:', error));
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Reefing Application</h1>
      </header>

      <main className="main">
        {!isAuthenticated ? (
          <div className="login-section">
            <h2>Welcome</h2>
            <p>Please log in to continue</p>
            <button onClick={() => loginWithRedirect()} className="login-btn">
              Log In
            </button>
          </div>
        ) : (
          <div className="user-section">
            <h2>You're logged in!</h2>

            <div className="user-info">
              <h3>Auth0 User Info:</h3>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>

            {dbUser && (
              <div className="db-user-info">
                <h3>Database User Info:</h3>
                <pre>{JSON.stringify(dbUser, null, 2)}</pre>
              </div>
            )}

            <button
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
              className="logout-btn"
            >
              Log Out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
