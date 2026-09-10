import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import AdminPage   from './pages/AdminPage.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"      element={<LandingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </HashRouter>
  );
}
