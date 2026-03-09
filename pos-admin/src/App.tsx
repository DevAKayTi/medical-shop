import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { UsersPage } from "@/pages/UsersPage";
import { RolesPage } from "@/pages/RolesPage";
import { PermissionsPage } from "@/pages/PermissionsPage";
import { CreateRolePage } from "@/pages/CreateRolePage";
import { CreateUserPage } from "@/pages/CreateUserPage";
import { EditUserPage } from "@/pages/EditUserPage";
import { EditRolePage } from "@/pages/EditRolePage";
import { LoginPage } from "@/pages/LoginPage";
import { ShopsPage } from "@/pages/ShopsPage";
import { CreateShopPage } from "@/pages/CreateShopPage";
import { EditShopPage } from "@/pages/EditShopPage";
import { CreateShopUserPage } from "@/pages/shop-users/CreateShopUserPage";
import { EditShopUserPage } from "@/pages/shop-users/EditShopUserPage";
import { ShopUsersPage } from "@/pages/shop-users/ShopUsersPage";
import { ShopRolesPage } from "@/pages/shop-users/ShopRolesPage";
import { ShopSettingsPage } from "@/pages/ShopSettingsPage";
import { ActivityLogsPage } from "@/pages/ActivityLogsPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Loader2 } from "lucide-react";

// Placeholder for unbuilt pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex h-[60vh] items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-muted-foreground">This page is under construction.</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="pos-admin-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />

              {/* Tenants (Shops) */}
              <Route path="shops" element={<ShopsPage />} />
              <Route path="shops/create" element={<CreateShopPage />} />
              <Route path="shops/edit/:id" element={<EditShopPage />} />
              <Route path="staffs" element={<ShopUsersPage />} />
              <Route path="staffs/create" element={<CreateShopUserPage />} />
              <Route path="staffs/edit/:id" element={<EditShopUserPage />} />
              <Route path="role-permissions" element={<ShopRolesPage />} />
              <Route path="shops/settings" element={<ShopSettingsPage />} />
              <Route path="shops/logs" element={<ActivityLogsPage />} />
              <Route path="shops/active" element={<PlaceholderPage title="Active Shops" />} />
              <Route path="shops/trial" element={<PlaceholderPage title="Trial Shops" />} />
              <Route path="shops/suspended" element={<PlaceholderPage title="Suspended Shops" />} />
              <Route path="owners" element={<PlaceholderPage title="Shop Owners" />} />

              {/* Sales */}
              <Route path="orders" element={<PlaceholderPage title="Orders" />} />
              <Route path="orders/pending" element={<PlaceholderPage title="Pending Orders" />} />
              <Route path="orders/completed" element={<PlaceholderPage title="Completed Orders" />} />
              <Route path="transactions" element={<PlaceholderPage title="Transactions" />} />
              <Route path="transactions/refunds" element={<PlaceholderPage title="Refunds" />} />
              <Route path="transactions/exchanges" element={<PlaceholderPage title="Exchanges" />} />
              <Route path="promotions/discounts" element={<PlaceholderPage title="Discounts" />} />
              <Route path="promotions/coupons" element={<PlaceholderPage title="Coupons" />} />

              {/* Catalog */}
              <Route path="products" element={<PlaceholderPage title="Products" />} />
              <Route path="products/categories" element={<PlaceholderPage title="Categories" />} />
              <Route path="products/inventory" element={<PlaceholderPage title="Inventory" />} />

              {/* People */}
              <Route path="customers" element={<PlaceholderPage title="Customers" />} />
              <Route path="customers/segments" element={<PlaceholderPage title="Customer Segments" />} />
              <Route path="staff" element={<PlaceholderPage title="Employees" />} />
              <Route path="staff/shifts" element={<PlaceholderPage title="Shifts" />} />
              <Route path="staff/roles" element={<PlaceholderPage title="Staff Roles" />} />

              {/* ── User Management (separate pages) ── */}
              <Route path="users" element={<PermissionGuard permissions="read-user"><UsersPage /></PermissionGuard>} />
              <Route path="users/create" element={<PermissionGuard permissions="create-user"><CreateUserPage /></PermissionGuard>} />
              <Route path="users/edit/:id" element={<PermissionGuard permissions="update-user"><EditUserPage /></PermissionGuard>} />
              <Route path="users/active" element={<PermissionGuard permissions="read-user"><UsersPage /></PermissionGuard>} />
              <Route path="users/suspended" element={<PermissionGuard permissions="read-user"><UsersPage /></PermissionGuard>} />
              <Route path="roles" element={<PermissionGuard permissions="read-role"><RolesPage /></PermissionGuard>} />
              <Route path="roles/manage" element={<PermissionGuard permissions="update-role"><RolesPage /></PermissionGuard>} />
              <Route path="roles/create" element={<PermissionGuard permissions="create-role"><CreateRolePage /></PermissionGuard>} />
              <Route path="roles/edit/:id" element={<PermissionGuard permissions="update-role"><EditRolePage /></PermissionGuard>} />
              <Route path="permissions" element={<PermissionGuard permissions="read-permission"><PermissionsPage /></PermissionGuard>} />
              <Route path="permissions/matrix" element={<PermissionGuard permissions="read-permission"><PermissionsPage /></PermissionGuard>} />

              {/* Finance */}
              <Route path="finance/revenue" element={<PlaceholderPage title="Revenue" />} />
              <Route path="finance/payouts" element={<PlaceholderPage title="Payouts" />} />
              <Route path="finance/reports" element={<PlaceholderPage title="Financial Reports" />} />
              <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
              <Route path="analytics/revenue" element={<PlaceholderPage title="Revenue Analytics" />} />
              <Route path="analytics/traffic" element={<PlaceholderPage title="Traffic Analytics" />} />

              {/* System */}
              <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="settings/account" element={<PlaceholderPage title="Account Settings" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
