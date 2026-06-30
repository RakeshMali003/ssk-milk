import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

interface UserActivity {
  mobile_no: string;
  customer_name: string;
  last_device_details: string;
  last_login_time: string;
  visit_count: number;
}

const UserLogins: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('user_activity')
            .select('*')
            .order('last_login_time', { ascending: false });

          if (error) throw error;
          setActivities(data as UserActivity[]);
        } catch (error) {
          console.error("Error fetching user activity:", error);
        }
      }
      setLoading(false);
    };

    fetchActivities();
  }, []);

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all login logs? This action cannot be undone.')) {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('user_activity').delete().neq('mobile_no', 'impossible');
          if (error) throw error;
          setActivities([]);
        } catch (error) {
          console.error("Error clearing user activity:", error);
        }
      }
    }
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            User Login Logs
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Track customer portal logins and sessions
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />}
          onClick={handleClearAll}
          disabled={activities.length === 0}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Clear All
        </Button>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Device & Browser</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total Visits</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No login activities found.
                </TableCell>
              </TableRow>
            ) : (
              activities.map((act) => {
                const isOnline = differenceInMinutes(new Date(), parseISO(act.last_login_time)) < 30;
                return (
                  <TableRow key={act.mobile_no}>
                    <TableCell>
                       <Typography variant="body2" sx={{ fontWeight: 700 }}>{act.customer_name}</Typography>
                       <Typography variant="caption" sx={{ color: 'text.secondary' }}>{act.mobile_no}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={act.last_device_details}>
                      {act.last_device_details}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{format(parseISO(act.last_login_time), 'dd MMM yyyy')}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{format(parseISO(act.last_login_time), 'hh:mm a')}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{act.visit_count}</TableCell>
                    <TableCell>
                       <Chip 
                         label={isOnline ? "Online" : "Offline"} 
                         size="small" 
                         color={isOnline ? "success" : "default"}
                         sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                       />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>

      {/* Mobile Cards View */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <Typography sx={{ color: 'text.secondary' }}>No login activities found.</Typography>
          </Box>
        ) : (
          activities.map((act) => {
            const isOnline = differenceInMinutes(new Date(), parseISO(act.last_login_time)) < 30;
            return (
              <Paper key={act.mobile_no} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 800 }}>{act.customer_name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{act.mobile_no}</Typography>
                  </Box>
                  <Chip 
                    label={isOnline ? "Online" : "Offline"} 
                    size="small" 
                    color={isOnline ? "success" : "default"}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: 2, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>DEVICE & BROWSER</Typography>
                  <Typography variant="caption" sx={{ color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {act.last_device_details}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>LAST LOGIN</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{format(parseISO(act.last_login_time), 'dd MMM yy')} <span style={{ color: '#64748b' }}>{format(parseISO(act.last_login_time), 'hh:mm a')}</span></Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>TOTAL VISITS</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{act.visit_count}</Typography>
                  </Box>
                </Box>
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default UserLogins;
