import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useApi } from './hooks/useApi';
import { useAquariums } from './hooks/useAquariums';
import type { Aquarium, CreateAquariumDto } from './types/shared';

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newAquarium, setNewAquarium] = useState<CreateAquariumDto>({
    name: '',
    type: 'reef',
    volume: 0,
    description: '',
  });
  const { syncUser, getCurrentUser } = useApi();
  const { getAquariums, createAquarium, deleteAquarium } = useAquariums();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Sync user to database on login
      syncUser()
        .then(() => getCurrentUser())
        .then(() => getAquariums())
        .then((aquariumData) => setAquariums(aquariumData))
        .catch((error) => console.error('Failed to sync user:', error));
    }
  }, [isAuthenticated, user]);

  const handleCreateAquarium = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAquarium(newAquarium);
      setAquariums([created, ...aquariums]);
      setShowForm(false);
      setNewAquarium({ name: '', type: 'reef', volume: 0, description: '' });
    } catch (error) {
      console.error('Failed to create aquarium:', error);
    }
  };

  const handleDeleteAquarium = async (id: string) => {
    try {
      await deleteAquarium(id);
      setAquariums(aquariums.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete aquarium:', error);
    }
  };

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
            <div className="header-controls">
              <h2>Welcome, {user?.name || user?.email}!</h2>
              <button
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                className="logout-btn"
              >
                Log Out
              </button>
            </div>

            <div className="aquariums-section">
              <div className="section-header">
                <h3>My Aquariums</h3>
                <button onClick={() => setShowForm(!showForm)} className="add-btn">
                  {showForm ? 'Cancel' : '+ Add Aquarium'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleCreateAquarium} className="aquarium-form">
                  <input
                    type="text"
                    placeholder="Tank Name"
                    value={newAquarium.name}
                    onChange={(e) =>
                      setNewAquarium({ ...newAquarium, name: e.target.value })
                    }
                    required
                  />
                  <select
                    value={newAquarium.type}
                    onChange={(e) =>
                      setNewAquarium({ ...newAquarium, type: e.target.value })
                    }
                    required
                  >
                    <option value="reef">Reef</option>
                    <option value="saltwater">Saltwater</option>
                    <option value="freshwater">Freshwater</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Volume (gallons)"
                    value={newAquarium.volume || ''}
                    onChange={(e) =>
                      setNewAquarium({
                        ...newAquarium,
                        volume: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newAquarium.description}
                    onChange={(e) =>
                      setNewAquarium({ ...newAquarium, description: e.target.value })
                    }
                  />
                  <button type="submit" className="submit-btn">
                    Create Aquarium
                  </button>
                </form>
              )}

              <div className="aquariums-list">
                {aquariums.length === 0 ? (
                  <p className="empty-state">No aquariums yet. Add your first one!</p>
                ) : (
                  aquariums.map((aquarium) => (
                    <div key={aquarium.id} className="aquarium-card">
                      <div className="aquarium-header">
                        <h4>{aquarium.name}</h4>
                        <button
                          onClick={() => handleDeleteAquarium(aquarium.id)}
                          className="delete-btn"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="aquarium-details">
                        <span className="type-badge">{aquarium.type}</span>
                        <span className="volume">{aquarium.volume}g</span>
                      </div>
                      {aquarium.description && (
                        <p className="description">{aquarium.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
