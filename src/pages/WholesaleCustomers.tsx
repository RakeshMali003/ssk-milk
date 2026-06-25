import React, { useState, useMemo } from 'react';
import { useStore, type WholesaleCustomer } from '../context/StoreContext';
import { format, parseISO } from 'date-fns';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogContent, DialogActions, IconButton, InputAdornment, Divider, Switch, FormControlLabel, Chip, Grid, Select, MenuItem, FormControl, InputLabel, Card, CardContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

const WholesaleCustomers: React.FC = () => {
  const { wholesaleCustomers, milkList, addWholesaleCustomer, editWholesaleCustomer, deleteWholesaleCustomer, wholesaleDaily } = useStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WholesaleCustomer | null>(null);

  // History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<WholesaleCustomer | null>(null);
  const [historyMonth, setHistoryMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  
  // Local state for pricing map: milkName -> customRate string
  const [pricing, setPricing] = useState<{ [milkName: string]: string }>({});
  
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const handleOpen = (item?: WholesaleCustomer) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setMobile(item.mobile);
      setAddress(item.address);
      const strPricing: any = {};
      Object.keys(item.pricing).forEach(k => {
        strPricing[k] = item.pricing[k].toString();
      });
      setPricing(strPricing);
      setIsActive(item.isActive);
    } else {
      setEditingItem(null);
      setName('');
      setMobile('');
      setAddress('');
      const defaultPricing: any = {};
      milkList.forEach(m => {
        defaultPricing[m.name] = m.price.toString();
      });
      setPricing(defaultPricing);
      setIsActive(true);
    }
    setErrors({});
    setOpen(true);
  };

  const handleOpenHistory = (item: WholesaleCustomer) => {
    setSelectedHistoryCustomer(item);
    setHistoryMonth(format(new Date(), 'yyyy-MM'));
    setHistoryOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setSelectedHistoryCustomer(null);
  };

  const historyData = useMemo(() => {
    if (!selectedHistoryCustomer) return [];
    return wholesaleDaily
      .filter(d => d.wholesaleCustomerId === selectedHistoryCustomer.id && d.date.startsWith(historyMonth))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [wholesaleDaily, selectedHistoryCustomer, historyMonth]);

  const handlePricingChange = (milkName: string, val: string) => {
    setPricing(prev => ({ ...prev, [milkName]: val }));
  };

  const handleSave = () => {
    const tempErrors: { [key: string]: boolean } = {};
    if (!name.trim()) tempErrors.name = true;
    if (!mobile.trim()) tempErrors.mobile = true;
    
    const parsedPricing: { [milkName: string]: number } = {};
    milkList.forEach(m => {
      const val = parseFloat(pricing[m.name]);
      if (isNaN(val) || val < 0) {
        tempErrors[`price_${m.name}`] = true;
      } else {
        parsedPricing[m.name] = val;
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const payload = {
      name,
      mobile,
      address,
      pricing: parsedPricing,
      isActive,
    };

    if (editingItem) {
      editWholesaleCustomer(editingItem.id, payload);
    } else {
      addWholesaleCustomer(payload);
    }
    setOpen(false);
  };

  const handleDelete = (c: WholesaleCustomer) => {
    if (window.confirm(`Are you sure you want to delete the wholesale customer ${c.name}?`)) {
      if (window.confirm(`WARNING: This will permanently delete ALL delivery history and balances for ${c.name}. Are you absolutely sure?`)) {
        deleteWholesaleCustomer(c.id);
      }
    }
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Wholesale Customers
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Manage bulk buyers and their specific rates for all milk types
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
            fontWeight: 700,
            boxShadow: '0 4px 15px rgba(0, 114, 255, 0.2)',
          }}
        >
          Add Wholesale Buyer
        </Button>
      </Box>

      <Grid container spacing={3}>
        {wholesaleCustomers.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
              <Typography sx={{ color: 'text.secondary' }}>No wholesale customers registered yet.</Typography>
            </Box>
          </Grid>
        ) : (
          wholesaleCustomers.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>{c.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{c.mobile}</Typography>
                  </Box>
                  <Chip 
                    label={c.isActive ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={c.isActive ? 'success' : 'default'} 
                    sx={{ fontWeight: 600, height: 24 }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>CUSTOM RATES</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {Object.keys(c.pricing || {}).length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Default Rates</Typography>
                    ) : (
                      Object.keys(c.pricing || {}).map(milkName => (
                        <Chip 
                          key={milkName} 
                          label={`${milkName}: ₹${c.pricing[milkName]}`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ color: '#0072FF', borderColor: 'rgba(0, 114, 255, 0.3)', fontWeight: 600 }}
                        />
                      ))
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>CURRENT BALANCE</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: c.balance > 0 ? '#e74c3c' : (c.balance < 0 ? '#2ecc71' : 'text.primary') }}>
                    {c.balance > 0 ? `Pending: ₹${c.balance}` : (c.balance < 0 ? `Advance: ₹${Math.abs(c.balance)}` : '₹0')}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 2 }}>
                  <Button 
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => handleOpenHistory(c)}
                    sx={{ color: '#2ecc71', borderColor: 'rgba(46, 204, 113, 0.5)', '&:hover': { borderColor: '#2ecc71', bgcolor: 'rgba(46, 204, 113, 0.05)' }, fontWeight: 700 }}
                  >
                    History
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpen(c)}
                    sx={{ flexGrow: 1, color: '#0072FF', borderColor: 'rgba(0, 114, 255, 0.5)', '&:hover': { borderColor: '#0072FF', bgcolor: 'rgba(0, 114, 255, 0.05)' }, fontWeight: 700 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => handleDelete(c)}
                    sx={{ color: '#e74c3c', borderColor: 'rgba(231, 76, 60, 0.5)', '&:hover': { borderColor: '#e74c3c', bgcolor: 'rgba(231, 76, 60, 0.05)' }, fontWeight: 700, minWidth: 40 }}
                  >
                    X
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: '#ffffff', borderRadius: 5, width: '100%', maxWidth: 600, overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', px: 4, py: 3, color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {editingItem ? 'Edit Wholesale Buyer' : 'Add Wholesale Buyer'}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                error={errors.name} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color={errors.name ? "error" : "action"} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)}
                error={errors.mobile} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon color={errors.mobile ? "error" : "action"} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Delivery Address (Optional)" value={address} onChange={(e) => setAddress(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1.2 }}>WHOLESALE PRICING SETUP</Typography>
            <Divider sx={{ flexGrow: 1, ml: 2 }} />
          </Box>

          <Grid container spacing={2}>
            {milkList.map((m) => (
              <Grid item xs={12} sm={6} key={m.id}>
                <TextField
                  fullWidth 
                  label={`${m.name} Rate (₹/L)`} 
                  type="number" 
                  value={pricing[m.name] || ''} 
                  onChange={(e) => handlePricingChange(m.name, e.target.value)}
                  error={errors[`price_${m.name}`]} 
                  InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon color={errors[`price_${m.name}`] ? "error" : "action"} /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, p: 2, borderRadius: 2, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{isActive ? "Account is Active" : "Account is Inactive"}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{isActive ? "Customer will appear in daily sheets." : "Customer is hidden from daily deliveries."}</Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600, mr: 1, textTransform: 'none', fontSize: '1rem' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, px: 5, py: 1.2, background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', fontWeight: 700, textTransform: 'none', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0, 114, 255, 0.3)' }}>
            {editingItem ? 'Update Details' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={historyOpen}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { background: '#ffffff', borderRadius: 5, overflow: 'hidden' },
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', px: 4, py: 3, color: '#fff', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {selectedHistoryCustomer?.name} - Delivery History
          </Typography>
          <FormControl sx={{ minWidth: 150, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
            <Select
              value={historyMonth}
              onChange={(e) => setHistoryMonth(e.target.value)}
              size="small"
              sx={{ color: '#fff', '& .MuiSelect-icon': { color: '#fff' } }}
            >
              {[...Array(6)].map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const val = format(d, 'yyyy-MM');
                const label = format(d, 'MMMM yyyy');
                return <MenuItem key={val} value={val}>{label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>

        <DialogContent sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f8fafc' }}>
          {historyData.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
              <Typography sx={{ color: 'text.secondary' }}>
                No entries found for this month.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {historyData.map((row) => (
                <Grid item xs={12} key={row.id}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(0,0,0,0.01)' }}>
                      <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {row.date ? format(new Date(row.date), 'EEEE, dd MMM yyyy') : 'Unknown Date'}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: row.balanceForward > 0 ? 'error.main' : (row.balanceForward < 0 ? 'success.main' : 'text.secondary') }}>
                        C/F Balance: ₹{Math.abs(row.balanceForward)} {row.balanceForward > 0 ? '(Pending)' : (row.balanceForward < 0 ? '(Advance)' : '')}
                      </Typography>
                    </Box>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1 }}>ITEMS DELIVERED</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(Array.isArray(row.items) ? row.items : []).map((i: any, idx: number) => (
                              <Chip key={idx} label={`${i.qty}L ${i.milkName}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>TODAY'S BILL</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: 'error.main' }}>+ ₹{row.totalBill}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>AMOUNT PAID</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: 'success.main' }}>- ₹{row.amountPaid}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 2 }}>
          <Button onClick={handleCloseHistory} variant="contained" sx={{ borderRadius: 2, background: '#27ae60', fontWeight: 700, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WholesaleCustomers;
