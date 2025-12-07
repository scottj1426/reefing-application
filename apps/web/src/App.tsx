import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { AquariumDetail } from './components/AquariumDetail';
import { PublicCollection } from './components/PublicCollection';
import { ExploreTanks } from './components/ExploreTanks';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/aquarium/:id" element={<AquariumDetail />} />
        <Route path="/explore" element={<ExploreTanks />} />
        <Route path="/collection/:username" element={<PublicCollection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
