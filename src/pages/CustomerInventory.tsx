import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type Customer } from '../context/StoreContext';
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
  const [milkName, setMilkName] = useState('');
  const [dailyQty, setDailyQty] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Form validations
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const handleOpen = (item?: Customer) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setEmail(item.email);
      setMobile(item.mobile);
      setAddress(item.address);
      setMilkName(item.milkName);
      setDailyQty(item.dailyQty.toString());
      setIsActive(item.isActive);
    } else {
      setEditingItem(null);
      setName('');
      setEmail('');
      setMobile('');
      setAddress('');
      setMilkName(milkList.length > 0 ? milkList[0].name : '');
      setDailyQty('1');
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
    if (!milkName) tempErrors.milkName = true;

    const qtyNum = parseFloat(dailyQty);
    if (isNaN(qtyNum) || qtyNum <= 0) tempErrors.dailyQty = true;

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const payload = {
      name,
      email,
      mobile,
      address,
      milkName,
      dailyQty: qtyNum,
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
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No customers registered yet. Click 'Add Customer' to start.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
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
                  <TableCell sx={{ color: '#0072FF', fontWeight: 600 }}>{c.milkName}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>{c.dailyQty} Pcs/Ltr</TableCell>
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

          <FormControl fullWidth error={errors.milkName}>
            <InputLabel id="milk-label">{t('customer.preferred_milk')}</InputLabel>
            <Select
              labelId="milk-label"
              value={milkName}
              label={t('customer.preferred_milk')}
              onChange={(e) => setMilkName(e.target.value)}
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
            {errors.milkName && <FormHelperText>Select Preferred Milk</FormHelperText>}
          </FormControl>

          <TextField
            fullWidth
            label={t('customer.daily_qty')}
            type="number"
            value={dailyQty}
            onChange={(e) => setDailyQty(e.target.value)}
            error={errors.dailyQty}
            helperText={errors.dailyQty ? t('customer.qty_required') : ''}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ShoppingCartIcon sx={{ color: 'rgba(0,0,0,0.4)' }} />
                  </InputAdornment>
                ),
              }
            }}
          />

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
