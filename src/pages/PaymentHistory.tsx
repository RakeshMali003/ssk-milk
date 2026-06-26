import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type Payment } from '../context/StoreContext';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  TablePagination,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const PaymentHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { payments, customers, addPayment, updatePaymentStatus } = useStore();
  const [open, setOpen] = useState(false);

  // Filter and pagination states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [searchText, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Text Search Filter (name or mobile)
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const cust = customers.find((c) => c.id === p.customerId);
        const nameMatch = p.customerName.toLowerCase().includes(query);
        const mobileMatch = cust ? cust.mobile.includes(query) : false;
        if (!nameMatch && !mobileMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [payments, searchText, statusFilter, customers]);

  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredPayments, page, rowsPerPage]);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Payment['status']>('completed');
  const [method, setMethod] = useState<Payment['method']>('upi');
  const [notes, setNotes] = useState('');

  // Validations
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const handleOpen = () => {
    setCustomerId(customers.length > 0 ? customers[0].id : '');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('completed');
    setMethod('upi');
    setNotes('');
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    const tempErrors: { [key: string]: boolean } = {};
    if (!customerId) tempErrors.customerId = true;

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) tempErrors.amount = true;

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId);
    if (!selectedCust) return;

    addPayment({
      customerId,
      customerName: selectedCust.name,
      amount: amtNum,
      date,
      status,
      method,
      notes,
    });

    setOpen(false);
  };

  const toggleStatus = (item: Payment) => {
    const nextStatus = item.status === 'pending' || item.status === 'unpaid' ? 'completed' : 'pending';
    updatePaymentStatus(item.id, nextStatus);
  };

  const handleWhatsAppReminder = (p: Payment) => {
    const cust = customers.find((c) => c.id === p.customerId);
    const mobile = cust ? cust.mobile : '';
    if (!mobile) {
      alert(i18n.language === 'hi' ? 'इस ग्राहक का मोबाइल नंबर उपलब्ध नहीं है!' : 'Mobile number not found for this customer!');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    const formattedMobile = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;

    const enMessage = `Dear *${p.customerName}*, this is a friendly reminder from *Shree Sai Krupa Kirana Store*. Your milk delivery payment of *₹${p.amount}* is pending. Kindly clear the dues via UPI or Cash. Thank you!`;
    const hiMessage = `नमस्ते *${p.customerName}*, *श्री साई कृपा किराना स्टोर* की ओर से एक विनम्र अनुस्मारक। आपका दूध का बकाया भुगतान *₹${p.amount}* अभी लंबित है। कृपया यूपीआई या नकद के माध्यम से भुगतान करें। धन्यवाद!`;

    const message = i18n.language === 'hi' ? hiMessage : enMessage;
    const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            {t('payments.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {t('payments.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          size="small"
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1,
            background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
            fontWeight: 700,
            boxShadow: '0 4px 15px rgba(0, 114, 255, 0.2)',
          }}
        >
          {t('payments.add_payment')}
        </Button>
      </Box>

      {/* Guide notes */}
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
            {t('payments.guide')}
          </Typography>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Grid container spacing={3} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Search Customer"
              placeholder="Search by name or mobile..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Filter Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Filter Status"
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="completed">{t('payments.completed')}</MenuItem>
                <MenuItem value="pending">{t('payments.pending')}</MenuItem>
                <MenuItem value="unpaid">{t('payments.unpaid')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('payments.customer_name')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('payments.amount')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('payments.date')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('payments.status')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('payments.method')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('payments.notes')}</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>Quick Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No payment ledger transactions logged yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((p) => (
                <TableRow
                  key={p.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{p.customerName}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>₹{p.amount.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{p.date}</TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 850,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        color:
                          p.status === 'completed'
                            ? '#2e7d32'
                            : p.status === 'pending'
                            ? '#b78103'
                            : '#c62828',
                        bgcolor:
                          p.status === 'completed'
                            ? 'rgba(46, 204, 113, 0.08)'
                            : p.status === 'pending'
                            ? 'rgba(241, 196, 15, 0.08)'
                            : 'rgba(231, 76, 60, 0.08)',
                      }}
                    >
                      {p.status === 'completed'
                        ? t('payments.completed')
                        : p.status === 'pending'
                        ? t('payments.pending')
                        : t('payments.unpaid')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      {p.method === 'upi' ? (
                        <AccountBalanceWalletIcon sx={{ fontSize: 18, color: '#0072FF' }} />
                      ) : (
                        <PaymentsIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                      )}
                      <Typography variant="body2">
                        {p.method === 'upi' ? t('payments.upi') : t('payments.cash')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    {p.notes || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<CheckCircleOutlineIcon />}
                        onClick={() => toggleStatus(p)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          color: p.status === 'completed' ? 'text.secondary' : '#2e7d32',
                        }}
                      >
                        {p.status === 'completed' ? 'Mark Pending' : 'Mark Paid'}
                      </Button>
                      {(p.status === 'pending' || p.status === 'unpaid') && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<WhatsAppIcon />}
                          onClick={() => handleWhatsAppReminder(p)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: '#25D366',
                            color: '#128C7E',
                            '&:hover': {
                              borderColor: '#128C7E',
                              backgroundColor: 'rgba(37, 211, 102, 0.08)',
                            },
                          }}
                        >
                          {i18n.language === 'hi' ? 'स्मरण पत्र' : 'Remind'}
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {filteredPayments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <Typography sx={{ color: 'text.secondary' }}>No payment ledger transactions logged yet.</Typography>
          </Box>
        ) : (
          paginatedPayments.map((p) => (
            <Card key={p.id} sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>{p.customerName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{p.date}</Typography>
                  </Box>
                  <Typography sx={{ color: 'text.primary', fontWeight: 800 }}>₹{p.amount.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.02)', p: 1, borderRadius: 2, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    {p.method === 'upi' ? (
                      <AccountBalanceWalletIcon sx={{ fontSize: 18, color: '#0072FF' }} />
                    ) : (
                      <PaymentsIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {p.method === 'upi' ? t('payments.upi') : t('payments.cash')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 850,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      color: p.status === 'completed' ? '#2e7d32' : p.status === 'pending' ? '#b78103' : '#c62828',
                      bgcolor: p.status === 'completed' ? 'rgba(46, 204, 113, 0.08)' : p.status === 'pending' ? 'rgba(241, 196, 15, 0.08)' : 'rgba(231, 76, 60, 0.08)',
                    }}
                  >
                    {p.status === 'completed' ? t('payments.completed') : p.status === 'pending' ? t('payments.pending') : t('payments.unpaid')}
                  </Typography>
                </Box>
                
                {p.notes && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontStyle: 'italic' }}>
                    Notes: {p.notes}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.04)', pt: 1, gap: 1 }}>
                  {(p.status === 'pending' || p.status === 'unpaid') && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => handleWhatsAppReminder(p)}
                      sx={{ borderRadius: 2, textTransform: 'none', px: 1, minWidth: 0 }}
                    >
                      <WhatsAppIcon fontSize="small" />
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => toggleStatus(p)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      color: p.status === 'completed' ? 'text.secondary' : '#2e7d32',
                      borderColor: p.status === 'completed' ? 'rgba(0,0,0,0.1)' : '#2e7d32',
                    }}
                  >
                    {p.status === 'completed' ? 'Mark Pending' : 'Mark Paid'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredPayments.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        sx={{
          mt: 2,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          background: '#ffffff',
        }}
      />

      {/* Add Payment Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 4,
              width: '100%',
              maxWidth: 450,
              p: 2,
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
            }
          }
        }}
      >
        <DialogTitle sx={{ color: 'text.primary', fontWeight: 800 }}>
          {t('payments.add_payment')}
        </DialogTitle>
        <DialogContent sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControl fullWidth error={errors.customerId}>
            <InputLabel id="cust-select-label">{t('payments.customer_name')}</InputLabel>
            <Select
              labelId="cust-select-label"
              value={customerId}
              label={t('payments.customer_name')}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
            {errors.customerId && <FormHelperText>Please select customer</FormHelperText>}
          </FormControl>

          <TextField
            fullWidth
            label={t('payments.amount')}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            helperText={errors.amount ? 'Valid amount is required' : ''}
          />

          <TextField
            fullWidth
            type="date"
            label={t('payments.date')}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl fullWidth>
            <InputLabel id="status-select-label">{t('payments.status')}</InputLabel>
            <Select
              labelId="status-select-label"
              value={status}
              label={t('payments.status')}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <MenuItem value="completed">{t('payments.completed')}</MenuItem>
              <MenuItem value="pending">{t('payments.pending')}</MenuItem>
              <MenuItem value="unpaid">{t('payments.unpaid')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="method-select-label">{t('payments.method')}</InputLabel>
            <Select
              labelId="method-select-label"
              value={method}
              label={t('payments.method')}
              onChange={(e) => setMethod(e.target.value as any)}
            >
              <MenuItem value="upi">{t('payments.upi')}</MenuItem>
              <MenuItem value="cash">{t('payments.cash')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('payments.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {t('milk.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 3,
              background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 114, 255, 0.2)',
            }}
          >
            {t('payments.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory;
