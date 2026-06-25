import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type MilkItem } from '../context/StoreContext';
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
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const MilkInventory: React.FC = () => {
  const { t } = useTranslation();
  const { milkList, addMilk, editMilk, deleteMilk, clearTable } = useStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MilkItem | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const [errorName, setErrorName] = useState(false);
  const [errorPrice, setErrorPrice] = useState(false);

  const handleOpen = (item?: MilkItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setPrice(item.price.toString());
    } else {
      setEditingItem(null);
      setName('');
      setPrice('');
    }
    setErrorName(false);
    setErrorPrice(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    let valid = true;
    if (!name.trim()) {
      setErrorName(true);
      valid = false;
    } else {
      setErrorName(false);
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorPrice(true);
      valid = false;
    } else {
      setErrorPrice(false);
    }

    if (!valid) return;

    if (editingItem) {
      editMilk(editingItem.id, { name, price: priceNum });
    } else {
      addMilk({ name, price: priceNum });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('milk.confirm_delete'))) {
      deleteMilk(id);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear ALL milk types?')) {
      if (window.confirm('WARNING: This will permanently remove all milk types from the database and unlink them from all customers. This cannot be undone. Are you absolutely sure?')) {
        await clearTable('milk_items');
        window.location.reload(); // Reload to refresh state cleanly
      }
    }
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            {t('milk.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {t('milk.subtitle')}
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
            {t('milk.add_milk')}
          </Button>
        </Box>
      </Box>

      {/* Guidance Alert */}
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
            {t('milk.guide')}
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('milk.milk_name')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('milk.price')}</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {t('milk.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {milkList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No milk variants added yet. Click 'Add Milk Type' to add.
                </TableCell>
              </TableRow>
            ) : (
              milkList.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{item.name}</TableCell>
                  <TableCell sx={{ color: '#0072FF', fontWeight: 700 }}>₹{item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpen(item)} sx={{ color: '#0072FF', mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} sx={{ color: '#ff4d4d' }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 4,
            width: '100%',
            maxWidth: 450,
            p: 2,
            boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'text.primary', fontWeight: 800 }}>
          {editingItem ? t('milk.edit_milk') : t('milk.add_milk')}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label={t('milk.milk_name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errorName}
            helperText={errorName ? t('milk.name_required') : ''}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          <TextField
            fullWidth
            label={t('milk.price')}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errorPrice}
            helperText={errorPrice ? t('milk.price_required') : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
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
            {t('milk.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MilkInventory;
