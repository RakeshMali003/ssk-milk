import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type DeliveryItem } from '../context/StoreContext';
import { format } from 'date-fns';
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
  Button,
  TextField,
  Checkbox,
  Card,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const DailyInventory: React.FC = () => {
  const { t } = useTranslation();
  const { customers, dailyRecords, saveDailyRecord } = useStore();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Load existing records or populate from customers template
  useEffect(() => {
    if (dailyRecords[date]) {
      setDeliveries(dailyRecords[date]);
    } else {
      // Map customer templates, excluding inactive ones
      const activeCustomers = customers.filter(c => c.isActive);
      const defaults = activeCustomers.map((c) => ({
        customerId: c.id,
        customerName: c.name,
        milkName: c.milkName,
        qty: c.dailyQty,
        delivered: true, // Default to true for convenience, can be unchecked
      }));
      setDeliveries(defaults);
    }
  }, [date, customers, dailyRecords]);

  const handleQtyChange = (index: number, val: string) => {
    const updated = [...deliveries];
    const parsed = parseFloat(val);
    updated[index].qty = isNaN(parsed) ? 0 : parsed;
    setDeliveries(updated);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updated = [...deliveries];
    updated[index].delivered = checked;
    setDeliveries(updated);
  };

  const handleSave = () => {
    saveDailyRecord(date, deliveries);
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            {t('daily.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {t('daily.subtitle')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            label={t('daily.date')}
            value={date}
            size="small"
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              width: 140,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            size="small"
            sx={{
              borderRadius: 2,
              px: 2,
              py: 1,
              background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)',
            }}
          >
            {t('daily.save_all')}
          </Button>
        </Box>
      </Box>

      {/* Daily guide banner */}
      <Card
        sx={{
          mb: 4,
          background: 'rgba(0, 0, 0, 0.01)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: 4,
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <InfoOutlinedIcon sx={{ color: '#0072FF', mt: 0.3 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {t('daily.guide')}
          </Typography>
        </CardContent>
      </Card>

      <TableContainer
        component={Paper}
        sx={{
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          overflowX: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.01)' }}>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('daily.customer_name')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('daily.milk_type')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('daily.qty')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('daily.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No customer delivery data available for template mapping.
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((d, index) => (
                <TableRow
                  key={d.customerId}
                  sx={{
                    backgroundColor: d.delivered ? 'transparent' : 'rgba(231, 76, 60, 0.01)',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{d.customerName}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{d.milkName}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={d.qty}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      sx={{
                        width: 90,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={d.delivered}
                        onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                        sx={{
                          color: '#0072FF',
                          '&.Mui-checked': {
                            color: '#2ecc71',
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: d.delivered ? '#2ecc71' : '#ff4d4d',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1.5,
                          bgcolor: d.delivered ? 'rgba(46, 204, 113, 0.08)' : 'rgba(231, 76, 60, 0.08)',
                        }}
                      >
                        {d.delivered ? t('daily.delivered') : t('daily.not_delivered')}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Snackbar notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {t('daily.success_save')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DailyInventory;
