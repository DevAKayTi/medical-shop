import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/ui/ToastProvider";
import LoginPage from "@/pages/auth/login";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import DashboardIndex from "@/pages/dashboard";

import InventoryPage from "@/pages/dashboard/inventory";
import CustomersPage from "@/pages/dashboard/customers";
import ReportsPage from "@/pages/dashboard/reports";
import SettingsPage from "@/pages/dashboard/settings";
import PosPage from "@/pages/dashboard/pos";
import SalesHistoryPage from "@/pages/dashboard/sales";
import RevenueDetailsPage from "@/pages/dashboard/revenue";
import PurchasesPage from "@/pages/dashboard/purchases";
import RegistersPage from "@/pages/dashboard/registers";
import ShiftsPage from "@/pages/dashboard/shifts";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardIndex />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesHistoryPage />} />
            <Route path="revenue" element={<RevenueDetailsPage />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="registers" element={<RegistersPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Redirect root to dashboard (which redirects to login if auth missing) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
