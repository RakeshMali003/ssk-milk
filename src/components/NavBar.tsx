import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Avatar,
  IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MilkIcon from '@mui/icons-material/WaterDrop';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StoreIcon from '@mui/icons-material/Store';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';

import { useStore } from '../context/StoreContext';

const drawerWidth = 280;

interface NavBarProps {
  mobileOpen?: boolean;
  handleDrawerToggle?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ mobileOpen, handleDrawerToggle }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isSupabaseActive } = useStore();

  // If we are on the login page, don't show the navbar
  if (location.pathname === '/login') {
    return null;
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const menuItems = [
    { text: t('navbar.daily_inventory'), icon: <ListAltIcon />, path: '/daily' },
    { text: t('navbar.dashboard'), icon: <DashboardIcon />, path: '/' },
    { text: t('navbar.milk_inventory'), icon: <MilkIcon />, path: '/milk' },
    { text: t('navbar.customer_inventory'), icon: <PeopleIcon />, path: '/customers' },
    { text: 'Wholesale Customers', icon: <StoreIcon />, path: '/wholesale-customers' },
    { text: 'Wholesale Daily', icon: <AssignmentIcon />, path: '/wholesale-daily' },
    { text: t('navbar.sales_report'), icon: <TrendingUpIcon />, path: '/sales' },
    { text: t('navbar.payment_history'), icon: <PaymentIcon />, path: '/payments' },
    { text: 'Billing', icon: <ReceiptLongIcon />, path: '/billing' },
  ];

  const drawerContent = (
    <>
      <Box>
        {/* Header Branding */}
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
          </Box>

          {/* Database connection status indicator */}
          <Box
            sx={{
              mt: 2,
              px: 2,
              py: 0.5,
              borderRadius: 5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid',
              borderColor: isSupabaseActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.2)',
              bgcolor: isSupabaseActive ? 'rgba(46, 204, 113, 0.05)' : 'rgba(241, 196, 15, 0.05)',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: isSupabaseActive ? '#2ecc71' : '#f1c40f',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(0.95)', boxShadow: isSupabaseActive ? '0 0 0 0 rgba(46, 204, 113, 0.7)' : '0 0 0 0 rgba(241, 196, 15, 0.7)' },
                  '70%': { transform: 'scale(1)', boxShadow: isSupabaseActive ? '0 0 0 6px rgba(46, 204, 113, 0)' : '0 0 0 6px rgba(241, 196, 15, 0)' },
                  '100%': { transform: 'scale(0.95)', boxShadow: isSupabaseActive ? '0 0 0 0 rgba(46, 204, 113, 0)' : '0 0 0 0 rgba(241, 196, 15, 0)' },
                }
              }}
            />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isSupabaseActive ? '#27ae60' : '#d35400' }}>
              {isSupabaseActive ? 'Supabase Active' : 'Offline Demo'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />

        {/* Menu Navigation */}
        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={handleDrawerToggle} // Close drawer on mobile after nav
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive ? 'rgba(0, 114, 255, 0.08)' : 'transparent',
                    borderLeft: isActive ? '4px solid #0072FF' : '4px solid transparent',
                    color: isActive ? '#0072FF' : 'rgba(30, 41, 59, 0.7)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      color: '#0072FF',
                      '& .MuiListItemIcon-root': {
                        color: '#0072FF',
                      },
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? '#0072FF' : 'rgba(30, 41, 59, 0.5)',
                      minWidth: 40,
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.95rem',
                          fontWeight: isActive ? 700 : 500,
                        }
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer Controls */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 0.6)', fontWeight: 500 }}>
            {i18n.language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
          </Typography>
          <IconButton onClick={toggleLanguage} sx={{ color: '#0072FF', bgcolor: 'rgba(0, 114, 255, 0.08)' }}>
            <LanguageIcon />
          </IconButton>
        </Box>

        <ListItemButton
          component={NavLink}
          to="/login"
          sx={{
            borderRadius: 2,
            color: '#ff4d4d',
            backgroundColor: 'rgba(255, 77, 77, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 77, 77, 0.15)',
              color: '#ff6666',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary={t('navbar.logout')}
            slotProps={{
              primary: {
                sx: {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }
              }
            }}
          />
        </ListItemButton>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      aria-label="mailbox folders"
    >
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default NavBar;
