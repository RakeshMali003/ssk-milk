import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  Fade,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
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
  const [showPassword, setShowPassword] = useState(false);
  
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
      if (isSupabaseConfigured) {
        // 1. Insert into historical log
        supabase.from('user_login_logs').insert([{
          mobile_no: mobile,
          device_details: navigator.userAgent
        }]).then();

        // 2. Upsert into activity tracker for dashboard
        supabase.rpc('upsert_user_activity', {
          p_mobile_no: mobile,
          p_customer_name: matchedCust.name,
          p_device_details: navigator.userAgent
        }).then(({ error }) => {
           if (error) {
              // Fallback if RPC fails, we can just select and update
              supabase.from('user_activity').select('visit_count').eq('mobile_no', mobile).single().then(({ data }) => {
                 if (data) {
                    supabase.from('user_activity').update({
                       last_device_details: navigator.userAgent,
                       last_login_time: new Date().toISOString(),
                       visit_count: data.visit_count + 1,
                       customer_name: matchedCust.name
                    }).eq('mobile_no', mobile).then();
                 } else {
                    supabase.from('user_activity').insert([{
                       mobile_no: mobile,
                       customer_name: matchedCust.name,
                       last_device_details: navigator.userAgent,
                       last_login_time: new Date().toISOString(),
                       visit_count: 1
                    }]).then();
                 }
              });
           }
        });
      }
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Fade in={true} timeout={800}>
        <Card
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            width: '100%',
            maxWidth: 1000,
            minHeight: { xs: 'auto', md: 600 },
            borderRadius: { xs: '10px !important', md: 4 },
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            background: '#ffffff',
          }}
        >
          {/* Left Side Branding */}
          <Box
            sx={{
              flex: { xs: '0 0 auto', md: '1 1 50%' },
              background: 'linear-gradient(135deg, #0072FF 0%, #00C6FF 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: { xs: 3, md: 8 },
              position: 'relative',
              overflow: 'hidden',
              textAlign: { xs: 'center', md: 'left' }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '120%',
                height: '120%',
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                zIndex: 0,
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1, mb: { xs: 1, md: 3 } }}>
                <WaterDropIcon sx={{ fontSize: { xs: 36, md: 48 } }} />
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                  SSK DAIRY
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: { xs: 0, md: 2 }, opacity: 0.9, fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
                Premium Milk Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.8, display: { xs: 'none', md: 'block' } }}>
                Streamline your daily deliveries, manage customers efficiently, and track all payments seamlessly in one modern control center.
              </Typography>
            </Box>
          </Box>

          {/* Right Side Form */}
          <Box
            sx={{
              flex: { xs: '1 1 auto', md: '1 1 50%' },
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 3, md: 6 },
              position: 'relative',
            }}
          >
            {/* Floating Language Toggle */}
            <IconButton
              onClick={toggleLanguage}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: '#0072FF',
                bgcolor: 'rgba(0, 114, 255, 0.08)',
                '&:hover': { bgcolor: 'rgba(0, 114, 255, 0.15)' },
              }}
            >
              <LanguageIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mb: 1 }}>
                  Welcome Back
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {t('login.subtitle')}
                </Typography>
              </Box>

              <Tabs 
                value={tabIndex} 
                onChange={(_, val) => { setTabIndex(val); setError(''); }} 
                variant="fullWidth" 
                sx={{ 
                  mb: 4, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '1rem' }
                }}
              >
                <Tab label="Customer Portal" />
                <Tab label="Admin Dashboard" />
              </Tabs>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {tabIndex === 1 && (
                <Box component="form" onSubmit={handleAdminLogin}>
                  <TextField
                    fullWidth
                    label={t('login.email')}
                    variant="outlined"
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      mb: 2.5,
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: <LockOpenIcon sx={{ color: 'action.active', mr: 1.5, fontSize: 20 }} />
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('login.password')}
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                      mb: 4,
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: <LockOpenIcon sx={{ color: 'action.active', mr: 1.5, fontSize: 20 }} />,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    size="large"
                    sx={{
                      py: 1.8,
                      borderRadius: 2,
                      fontSize: '1.1rem',
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
                    Login as Admin
                  </Button>
                </Box>
              )}

              {tabIndex === 0 && (
                <Box component="form" onSubmit={handleCustomerLogin}>
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
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: <PhoneAndroidIcon sx={{ color: 'action.active', mr: 1.5, fontSize: 20 }} />
                      }
                    }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    size="large"
                    sx={{
                      py: 1.8,
                      borderRadius: 2,
                      fontSize: '1.1rem',
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
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      </Fade>
    </Box>
  );
};

export default Login;
