import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import ExposurePage from './pages/ExposurePage';

export default function App() {
  return (
    <div className="p-4">
      <Toaster richColors position="bottom-right" />
      <Routes>
        <Route path="/" element={<ExposurePage />} />
        <Route path="/exposure" element={<ExposurePage />} />
      </Routes>
    </div>
  );
}