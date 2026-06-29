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
  Chip
} from '@mui/material';
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

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
        User Login Logs
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 4 }}>
        Track customer portal logins and sessions
      </Typography>

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
  );
};

export default UserLogins;
