import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  TablePagination,
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const SalesReport: React.FC = () => {
  const { t } = useTranslation();
  const { dailyRecords, milkList, customers, clearTable } = useStore();

  const [customerFilter, setCustomerFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [filterYear, setFilterYear] = useState('2026');
  const [filterMonth, setFilterMonth] = useState('06'); // June

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [customerFilter, searchText, timeframe, filterYear, filterMonth]);

  // Extract all delivered items into an flat array
  const allDeliveredSales = useMemo(() => {
    const list: Array<{
      date: string;
      customerId: string;
      customerName: string;
      milkName: string;
      qty: number;
      price: number;
      amount: number;
    }> = [];

    Object.entries(dailyRecords).forEach(([dateStr, deliveries]) => {
      deliveries.forEach((del) => {
        if (del.delivered) {
          // find price from milk list
          const milk = milkList.find((m) => m.name === del.milkName);
          const price = milk ? milk.price : 0;
          list.push({
            date: dateStr,
            customerId: del.customerId,
            customerName: del.customerName,
            milkName: del.milkName,
            qty: del.qty,
            price: price,
            amount: del.qty * price,
          });
        }
      });
    });
    return list;
  }, [dailyRecords, milkList]);

  // Filter list based on UI selections
  const filteredSales = useMemo(() => {
    return allDeliveredSales.filter((sale) => {
      // 1. Customer Dropdown Filter
      if (customerFilter !== 'all' && sale.customerId !== customerFilter) {
        return false;
      }

      // 2. Text Search Filter (name or mobile)
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const cust = customers.find((c) => c.id === sale.customerId);
        const nameMatch = sale.customerName.toLowerCase().includes(query);
        const mobileMatch = cust ? cust.mobile.includes(query) : false;
        if (!nameMatch && !mobileMatch) {
          return false;
        }
      }

      // 3. Timeframe Filter
      const [year, month] = sale.date.split('-'); // e.g. "2026-06-24"
      if (timeframe === 'daily') {
        return year === filterYear && month === filterMonth;
      } else if (timeframe === 'monthly') {
        return year === filterYear;
      } else if (timeframe === 'yearly') {
        return true; 
      }

      return true;
    });
  }, [allDeliveredSales, customerFilter, searchText, timeframe, filterYear, filterMonth, customers]);

  // Paginated subset of sales
  const paginatedSales = useMemo(() => {
    return filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSales, page, rowsPerPage]);

  // Calculate totals
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredSales]);

  const totalQuantity = useMemo(() => {
    return filteredSales.reduce((sum, item) => sum + item.qty, 0);
  }, [filteredSales]);

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 }, pb: { xs: 10, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            {t('sales.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {t('sales.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DeleteSweepIcon />}
          onClick={async () => {
            if (window.confirm('Are you sure you want to clear ALL sales records?')) {
              if (window.confirm('WARNING: This will permanently delete all sales data. Are you absolutely sure?')) {
                await clearTable('sales');
                window.location.reload();
              }
            }
          }}
          color="error"
          sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          Clear All Sales
        </Button>
      </Box>

      {/* Guide Card */}
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
            {t('sales.guide')}
          </Typography>
        </CardContent>
      </Card>

      {/* Metric Widgets */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(46, 204, 113, 0.08)', color: '#2ecc71', width: 48, height: 48, mr: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {t('sales.total_revenue')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                  ₹{totalRevenue.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(0, 114, 255, 0.08)', color: '#0072FF', width: 48, height: 48, mr: 2 }}>
                <LocalDrinkIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {t('sales.total_quantity')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                  {totalQuantity.toFixed(1)} Ltrs/Pcs
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls Panel */}
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
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700, mb: 2 }}>
          {t('sales.filter')}
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Search Customer"
              placeholder="Name or mobile..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="cust-filter-label">{t('sales.customer')}</InputLabel>
              <Select
                labelId="cust-filter-label"
                value={customerFilter}
                label={t('sales.customer')}
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                <MenuItem value="all">{t('sales.all_customers')}</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="timeframe-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-label"
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value as any)}
              >
                <MenuItem value="daily">{t('sales.daily')}</MenuItem>
                <MenuItem value="monthly">{t('sales.monthly')}</MenuItem>
                <MenuItem value="yearly">{t('sales.yearly')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {timeframe !== 'yearly' && (
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Year"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              />
            </Grid>
          )}

          {timeframe === 'daily' && (
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Month (MM)"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Sales Report Table */}
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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('sales.date')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('sales.customer')}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Quantity</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Rate</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{t('sales.amount')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No sales found matching search parameters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSales.map((item, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ color: 'text.secondary' }}>{item.date}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{item.customerName}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{item.milkName}</TableCell>
                  <TableCell sx={{ color: 'text.primary' }}>{item.qty}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>₹{item.price.toFixed(2)}</TableCell>
                  <TableCell sx={{ color: '#2e7d32', fontWeight: 700 }}>₹{item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredSales.length}
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
    </Box>
  );
};

export default SalesReport;
