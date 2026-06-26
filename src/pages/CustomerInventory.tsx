import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type Customer, type MilkSubscription } from '../context/StoreContext';
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
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import MailIcon from '@mui/icons-material/Mail';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';

const CustomerInventory: React.FC = () => {
  const { t } = useTranslation();
  const { customers, milkList, addCustomer, editCustomer, deleteCustomer, clearTable } = useStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [subscriptions, setSubscriptions] = useState<MilkSubscription[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Form validations
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  const handleOpen = (item?: Customer) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setEmail(item.email);
      setMobile(item.mobile);
      setAddress(item.address);
      setSubscriptions(item.subscriptions && item.subscriptions.length > 0 ? item.subscriptions : [{ milkName: milkList.length > 0 ? milkList[0].name : '', defaultQty: 1 }]);
      setIsActive(item.isActive);
    } else {
      setEditingItem(null);
      setName('');
      setEmail('');
      setMobile('');
      setAddress('');
      setSubscriptions([{ milkName: milkList.length > 0 ? milkList[0].name : '', defaultQty: 1 }]);
      setIsActive(true);
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    const tempErrors: { [key: string]: boolean } = {};
    if (!name.trim()) tempErrors.name = true;
    if (!mobile.trim()) tempErrors.mobile = true;
    if (!address.trim()) tempErrors.address = true;
    
    if (subscriptions.length === 0) tempErrors.subscriptions = true;
    subscriptions.forEach((sub, idx) => {
      if (!sub.milkName) tempErrors[`milkName_${idx}`] = true;
      if (isNaN(sub.defaultQty) || sub.defaultQty <= 0) tempErrors[`qty_${idx}`] = true;
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const payload = {
      name,
      email,
      mobile,
      address,
      subscriptions,
      isActive,
    };

    if (editingItem) {
      editCustomer(editingItem.id, payload);
    } else {
      addCustomer(payload);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const cust = customers.find(c => c.id === id);
    const name = cust ? cust.name : 'this customer';
    if (window.confirm(`Are you sure you want to delete the retail customer ${name}?`)) {
      if (window.confirm(`WARNING: This will permanently delete ALL delivery history and payments for ${name}. Are you absolutely sure?`)) {
        deleteCustomer(id);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear ALL retail customers?')) {
      if (window.confirm('WARNING: This will permanently remove all retail customers and their associated delivery logs and payments. This cannot be undone. Are you absolutely sure?')) {
        await clearTable('customers');
        window.location.reload();
      }
    }
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            {t('customer.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {t('customer.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearAll}
            color="error"
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 700 }}
          >
            Clear All
          </Button>
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
            {t('customer.add_customer')}
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search customers by name or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: 3, bgcolor: '#fff' }
            }
          }}
        />
      </Box>

      {/* Onboarding tips */}
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
            {t('customer.guide')}
          </Typography>
        </CardContent>
      </Card>

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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('customer.name')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('customer.mobile')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('customer.address')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('customer.preferred_milk')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('customer.daily_qty')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {t('customer.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => (
                <TableRow
                  key={c.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {c.name}
                    {c.email && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {c.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{c.mobile}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.address}
                  </TableCell>
                  <TableCell sx={{ color: '#0072FF', fontWeight: 600 }}>
                    {c.subscriptions.map(s => <div key={s.milkName}>{s.milkName}</div>)}
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>
                    {c.subscriptions.map(s => <div key={s.milkName}>{s.defaultQty} Ltr</div>)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={c.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={c.isActive ? 'success' : 'default'} 
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpen(c)} sx={{ color: '#0072FF', mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(c.id)} sx={{ color: '#ff4d4d' }}>
                      <DeleteIcon />
                    </IconButton>
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
        {filteredCustomers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <Typography sx={{ color: 'text.secondary' }}>No customers found.</Typography>
          </Box>
        ) : (
          filteredCustomers.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>{c.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{c.mobile}</Typography>
                  </Box>
                  <Chip 
                    label={c.isActive ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={c.isActive ? 'success' : 'default'} 
                    sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>{c.address}</Typography>
                  {c.email && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{c.email}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.02)', p: 1, borderRadius: 2, mb: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>MILK PREF</Typography>
                    {c.subscriptions.map(s => <Typography key={s.milkName} sx={{ color: '#0072FF', fontWeight: 700, fontSize: '0.85rem' }}>{s.milkName}</Typography>)}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>DAILY QTY</Typography>
                    {c.subscriptions.map(s => <Typography key={s.milkName} sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.85rem' }}>{s.defaultQty} Ltr</Typography>)}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.04)', pt: 1 }}>
                  <IconButton onClick={() => handleOpen(c)} sx={{ color: '#0072FF', mr: 1, bgcolor: 'rgba(0,114,255,0.05)', width: 32, height: 32 }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(c.id)} sx={{ color: '#ff4d4d', bgcolor: 'rgba(255,77,77,0.05)', width: 32, height: 32 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Customer Form Dialog */}
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
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
            }
          }
        }}
      >
        {/* Header decoration */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
            px: 4,
            py: 3,
            color: '#fff',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {editingItem ? t('customer.edit_customer') : t('customer.add_customer')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5, display: 'block' }}>
            {editingItem ? 'Update details of an existing customer' : 'Add a new customer with preferred daily milk configurations'}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 4, mt: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Section 1: Customer Personal Details */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
            Personal Details
          </Typography>
          
          <TextField
            autoFocus
            fullWidth
            label={t('customer.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            helperText={errors.name ? t('customer.name_required') : ''}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'rgba(0,0,0,0.4)' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            fullWidth
            label={t('customer.mobile')}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            error={errors.mobile}
            helperText={errors.mobile ? t('customer.mobile_required') : ''}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: 'rgba(0,0,0,0.4)' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            fullWidth
            label={t('customer.email') + ' (Optional)'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MailIcon sx={{ color: 'rgba(0,0,0,0.4)' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            fullWidth
            label={t('customer.address')}
            multiline
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address}
            helperText={errors.address ? t('customer.address_required') : ''}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ mt: -2 }}>
                    <LocationOnIcon sx={{ color: 'rgba(0,0,0,0.4)' }} />
                  </InputAdornment>
                ),
              }
            }}
          />

          <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />

          {/* Section 2: Milk Delivery configurations */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
            Delivery Settings
          </Typography>

          {errors.subscriptions && <FormHelperText error>At least one milk subscription is required.</FormHelperText>}
          
          {subscriptions.map((sub, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl sx={{ flex: 2 }} error={errors[`milkName_${index}`]}>
                <InputLabel>{t('customer.preferred_milk')}</InputLabel>
                <Select
                  value={sub.milkName}
                  label={t('customer.preferred_milk')}
                  onChange={(e) => {
                    const newSubs = [...subscriptions];
                    newSubs[index].milkName = e.target.value;
                    setSubscriptions(newSubs);
                  }}
                  startAdornment={
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <WaterDropIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                >
                  {milkList.map((m) => (
                    <MenuItem key={m.id} value={m.name}>
                      {m.name} (₹{m.price}/Ltr)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                sx={{ flex: 1 }}
                label="Qty"
                type="number"
                value={sub.defaultQty}
                onChange={(e) => {
                  const newSubs = [...subscriptions];
                  newSubs[index].defaultQty = parseFloat(e.target.value) || 0;
                  setSubscriptions(newSubs);
                }}
                error={errors[`qty_${index}`]}
              />
              
              <IconButton 
                color="error" 
                onClick={() => setSubscriptions(subscriptions.filter((_, i) => i !== index))}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          
          <Button 
            startIcon={<AddIcon />} 
            onClick={() => setSubscriptions([...subscriptions, { milkName: milkList.length > 0 ? milkList[0].name : '', defaultQty: 1 }])}
            sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
          >
            Add Milk Type
          </Button>

          <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
            Status
          </Typography>
          <FormControlLabel
            control={
              <Switch 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
                color="success" 
              />
            }
            label={isActive ? "Active (Receives daily deliveries)" : "Inactive (Temporarily stopped)"}
          />

        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, pt: 1 }}>
          <Button onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {t('customer.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.2,
              background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0, 114, 255, 0.2)',
            }}
          >
            {t('customer.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerInventory;
