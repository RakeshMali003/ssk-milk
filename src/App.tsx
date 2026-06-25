import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MilkInventory from './pages/MilkInventory';
import CustomerInventory from './pages/CustomerInventory';
import DailyInventory from './pages/DailyInventory';
import SalesReport from './pages/SalesReport';
import PaymentHistory from './pages/PaymentHistory';
import Billing from './pages/Billing';
import WholesaleCustomers from './pages/WholesaleCustomers';
import WholesaleDaily from './pages/WholesaleDaily';
import CustomerPortal from './pages/CustomerPortal';
import { Box, AppBar, Toolbar, IconButton, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// Route guard component
const PrivateRoute: React.FC<{ children: React.ReactNode, roleRequired?: 'admin' | 'customer' }> = ({ children, roleRequired }) => {
  const role = sessionStorage.getItem('ssk_auth_role');
  const isAuthenticated = !!role;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (roleRequired && role !== roleRequired) {
    if (role === 'customer') return <Navigate to="/customer-portal" replace />;
    if (role === 'admin') return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const drawerWidth = 280;

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <StoreProvider>
      <CssBaseline />
      {isLoginPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : sessionStorage.getItem('ssk_auth_role') === 'customer' ? (
        <PrivateRoute roleRequired="customer">
          <Routes>
            <Route path="/customer-portal" element={<CustomerPortal />} />
            <Route path="*" element={<Navigate to="/customer-portal" replace />} />
          </Routes>
        </PrivateRoute>
      ) : (
        <PrivateRoute roleRequired="admin">
          <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
              position="fixed"
              sx={{
                width: { md: `calc(100% - ${drawerWidth}px)` },
                ml: { md: `${drawerWidth}px` },
                display: { md: 'none' },
                background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
              }}
            >
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { md: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <img src="/logo.png" alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
                </Box>
              </Toolbar>
            </AppBar>
            <NavBar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: { xs: 2, md: 4 },
                pb: { xs: 12, md: 4 }, // Universal bottom padding for mobile scrolling
                minHeight: '100vh',
                width: { md: `calc(100% - ${drawerWidth}px)` },
                mt: { xs: 7, md: 0 },
                overflowX: 'hidden',
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/milk" element={<MilkInventory />} />
                <Route path="/customers" element={<CustomerInventory />} />
                <Route path="/daily" element={<DailyInventory />} />
                <Route path="/sales" element={<SalesReport />} />
                <Route path="/payments" element={<PaymentHistory />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/wholesale-customers" element={<WholesaleCustomers />} />
                <Route path="/wholesale-daily" element={<WholesaleDaily />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </PrivateRoute>
      )}
    </StoreProvider>
  );
}

export default App;
