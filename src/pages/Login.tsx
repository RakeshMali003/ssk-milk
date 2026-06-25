import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  Fade,
  Tabs,
  Tab,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { useStore } from '../context/StoreContext';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { customers, wholesaleCustomers } = useStore();

  const [tabIndex, setTabIndex] = useState(0);

  // Admin State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Customer State
  const [mobile, setMobile] = useState('');
  
  const [error, setError] = useState('');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t('login.email_error'));
      return;
    }
    
    if (isSupabaseConfigured) {
      const { data, error: sbError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
        
      if (sbError || !data) {
        setError('Invalid email or password.');
        return;
      }
    } else {
      // Fallback for local testing if Supabase isn't configured
      if (email !== 'admin@gmail.com' || password !== 'password') {
        setError('Invalid email or password. (Local Mode expects admin@gmail.com / password)');
        return;
      }
    }

    setError('');
    sessionStorage.setItem('ssk_auth_role', 'admin');
    navigate('/');
  };

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }

    // Check retail customers
    let matchedCust = customers.find(c => c.mobile.includes(mobile));
    let type = 'retail';

    if (!matchedCust) {
      // Check wholesale customers
      matchedCust = wholesaleCustomers.find(c => c.mobile.includes(mobile)) as any;
      type = 'wholesale';
    }

    if (matchedCust) {
      setError('');
      sessionStorage.setItem('ssk_auth_role', 'customer');
      sessionStorage.setItem('ssk_customer_id', matchedCust.id);
      sessionStorage.setItem('ssk_customer_type', type);
      navigate('/customer-portal');
    } else {
      setError("Mobile number not found. Please contact the store.");
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, #e0f2fe, #f1f5f9, #e2e8f0)',
        zIndex: 9999,
      }}
    >
      {/* Floating Language Toggle */}
      <IconButton
        onClick={toggleLanguage}
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          color: '#0072FF',
          bgcolor: 'rgba(0, 114, 255, 0.08)',
          '&:hover': { bgcolor: 'rgba(0, 114, 255, 0.15)' },
        }}
      >
        <LanguageIcon />
      </IconButton>

      <Fade in={true} timeout={800}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 450,
            mx: 2,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: 6,
              background: 'linear-gradient(90deg, #00C6FF, #0072FF)',
            }}
          />
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0, 114, 255, 0.08)',
                  color: '#0072FF',
                  mb: 2,
                }}
              >
                <LockOpenIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                {t('login.welcome')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {t('login.subtitle')}
              </Typography>
            </Box>

            <Tabs 
              value={tabIndex} 
              onChange={(_, val) => { setTabIndex(val); setError(''); }} 
              variant="fullWidth" 
              sx={{ mb: 3 }}
            >
              <Tab label="Admin Login" sx={{ fontWeight: 700 }} />
              <Tab label="Customer Login" sx={{ fontWeight: 700 }} />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {tabIndex === 0 && (
              <Box component="form" onSubmit={handleAdminLogin} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label={t('login.email')}
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(_) => setEmail(_.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('login.password')}
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
                    boxShadow: '0 8px 20px rgba(0, 114, 255, 0.3)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 25px rgba(0, 114, 255, 0.4)',
                    },
                  }}
                >
                  {t('login.login_button')}
                </Button>
              </Box>
            )}

            {tabIndex === 1 && (
              <form onSubmit={handleCustomerLogin}>
                <TextField
                  fullWidth
                  label="Registered Mobile Number"
                  variant="outlined"
                  margin="normal"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9898801505"
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: <PhoneAndroidIcon sx={{ color: 'action.active', mr: 1 }} />
                    }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    boxShadow: '0 8px 20px rgba(46, 204, 113, 0.3)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 25px rgba(46, 204, 113, 0.4)',
                    },
                  }}
                >
                  View My Bill
                </Button>
              </form>
            )}

            <Box
              sx={{
                mt: 4,
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                💡 <strong>{i18n.language === 'en' ? 'Quick Help:' : 'त्वरित सहायता:'}</strong> {t('login.guide')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default Login;
