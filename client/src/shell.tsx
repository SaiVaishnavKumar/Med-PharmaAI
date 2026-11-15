import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { PointOfSale } from './pages/PointOfSale';
import { Catalogue } from './pages/Catalogue';
import { Inventory } from './pages/Inventory';
import { SalesHistory } from './pages/SalesHistory';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { Returns } from './pages/Returns';
import { Purchases } from './pages/Purchases';
import { Suppliers } from './pages/Suppliers';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { Copilot } from './pages/Copilot';
import { Login } from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<PointOfSale />} />
        <Route path="medicines" element={<Catalogue />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<SalesHistory />} />
        <Route path="returns" element={<Returns />} />
        <Route path="invoices/:invoiceNumber" element={<InvoiceDetail />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="copilot" element={<Copilot />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export { Login };
