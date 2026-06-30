import React, { useState, useEffect, useMemo } from 'react';
import { useStore, type WholesaleCustomer, type WholesaleDailyEntryItem } from '../context/StoreContext';
import { format } from 'date-fns';
import {
  Box, Typography, Button, TextField, IconButton, Grid, Card, CardContent, Divider, Chip, Paper, InputAdornment
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';

const WholesaleDaily: React.FC = () => {
  const { wholesaleCustomers, milkList, saveWholesaleDailyEntry, wholesaleDaily } = useStore();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for the inputs: { customerId: { [milkName]: qty, paid } }
  const [inputs, setInputs] = useState<{ [id: string]: { qtys: { [milk: string]: string }, paid: string } }>({});

  const activeCustomers = wholesaleCustomers.filter(c => c.isActive);

  const filteredCustomers = activeCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  useEffect(() => {
    // Initialize inputs when date changes, customers load, or wholesaleDaily updates
    const newInputs: any = {};
    activeCustomers.forEach(c => {
      const existingEntry = wholesaleDaily.find(d => d.wholesaleCustomerId === c.id && d.date === date);
      
      const defaultQtys: any = {};
      milkList.forEach(m => defaultQtys[m.name] = '');
      let paid = '';

      if (existingEntry) {
        existingEntry.items.forEach(item => {
          defaultQtys[item.milkName] = item.qty.toString();
        });
        if (existingEntry.amountPaid > 0) {
          paid = existingEntry.amountPaid.toString();
        }
      }
      newInputs[c.id] = { qtys: defaultQtys, paid };
    });
    setInputs(newInputs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wholesaleCustomers.length, milkList.length, date, wholesaleDaily]);

  const { todayTotalQty, todayTotalAmount } = useMemo(() => {
    let qty = 0;
    let amount = 0;
    activeCustomers.forEach(c => {
      const custInputs = inputs[c.id];
      if (custInputs) {
        milkList.forEach(m => {
          const q = parseFloat(custInputs.qtys[m.name] || '0');
          if (q > 0) {
            qty += q;
            const rate = c.pricing[m.name] || m.price;
            amount += Number((q * rate).toFixed(2));
          }
        });
      }
    });
    return { todayTotalQty: qty, todayTotalAmount: Number(amount.toFixed(2)) };
  }, [inputs, activeCustomers, milkList]);

  const handleQtyChange = (id: string, milkName: string, val: string) => {
    setInputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        qtys: {
          ...prev[id].qtys,
          [milkName]: val
        }
      }
    }));
  };

  const handlePaidChange = (id: string, val: string) => {
    setInputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        paid: val
      }
    }));
  };

  const handleSaveEntry = (customer: WholesaleCustomer) => {
    const custInputs = inputs[customer.id];
    if (!custInputs) return;

    const paidNum = parseFloat(custInputs.paid || '0');
    
    let totalBill = 0;
    const items: WholesaleDailyEntryItem[] = [];

    let hasAnyQty = false;

    milkList.forEach(m => {
      const q = parseFloat(custInputs.qtys[m.name] || '0');
      if (q > 0) {
        hasAnyQty = true;
        const rate = customer.pricing[m.name] || m.price; // fallback to retail if not set
        const amount = Number((q * rate).toFixed(2));
        totalBill += amount;
        items.push({ milkName: m.name, qty: q, rate, amount });
      }
    });

    if (!hasAnyQty && paidNum === 0) {
      alert("Please enter at least one quantity or a payment amount before saving.");
      return;
    }

    saveWholesaleDailyEntry({
      date,
      wholesaleCustomerId: customer.id,
      items,
      totalBill,
      amountPaid: paidNum,
    });

    alert(`Saved entry for ${customer.name}`);
  };

  const sendWhatsApp = (c: WholesaleCustomer) => {
    const formattedMobile = c.mobile.startsWith('91') ? c.mobile : `91${c.mobile}`;
    const balanceText = c.balance > 0 
      ? `*Total Pending Amount: ₹${c.balance}*` 
      : (c.balance < 0 ? `*Advance Amount: ₹${Math.abs(c.balance)}*` : `*No dues pending (Cleared)*`);

    const message = `Hello *${c.name}*,

Greetings from *Shree Sai Krupa Kirana Store*.

${balanceText}

Please make the payment at your earliest convenience.

*Online Payment (PhonePe): 9898801505*

📊 To view your complete purchase and payment history, please visit the Customer Portal:
https://sskmilk.vercel.app/ 

*Login Instructions:*
Open the Customer Portal on your mobile device.
Enter your registered mobile number.

*Thank you for your support!*`;

    const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 }, pb: 12 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Wholesale Daily Sheet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Enter daily quantities for all milk types and received payments
          </Typography>
        </Box>
        <TextField
          type="date"
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search buyers by name or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: '15px', bgcolor: '#fff' }
            }
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredCustomers.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 4, textAlign: 'center', background: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
              <Typography color="text.secondary">No active wholesale customers found.</Typography>
            </Box>
          </Grid>
        ) : (
          filteredCustomers.map((c) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={c.id}>
              <Card sx={{ borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ p: 2.5, background: 'rgba(0,0,0,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{c.name}</Typography>
                    <Chip 
                      label={c.balance > 0 ? `Pending: ₹${c.balance}` : (c.balance < 0 ? `Advance: ₹${Math.abs(c.balance)}` : 'Balance: ₹0')} 
                      size="small"
                      color={c.balance > 0 ? "error" : (c.balance < 0 ? "success" : "default")}
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                  </Box>
                  <IconButton onClick={() => sendWhatsApp(c)} sx={{ color: '#25D366', bgcolor: 'rgba(37, 211, 102, 0.1)' }}>
                    <WhatsAppIcon />
                  </IconButton>
                </Box>
                <Divider />
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2, letterSpacing: 0.5 }}>MILK QUANTITIES (Ltr)</Typography>
                  <Grid container spacing={2}>
                    {milkList.map(m => (
                      <Grid size={{ xs: 6 }} key={m.id}>
                        <TextField 
                          fullWidth
                          size="small" 
                          type="number" 
                          label={`${m.name} (₹${c.pricing[m.name] || m.price})`}
                          value={inputs[c.id]?.qtys[m.name] || ''} 
                          onChange={(e) => handleQtyChange(c.id, m.name, e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField 
                        fullWidth
                        label="Amount Paid Today (₹)"
                        type="number" 
                        value={inputs[c.id]?.paid || ''} 
                        onChange={(e) => handlePaidChange(c.id, e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 3 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Qty: {
                        (() => {
                          const custInputs = inputs[c.id];
                          let qty = 0;
                          if (custInputs) {
                            milkList.forEach(m => {
                              const q = parseFloat(custInputs.qtys[m.name] || '0');
                              if (q > 0) qty += q;
                            });
                          }
                          return qty;
                        })()
                      } Ltr</Typography>
                      <Typography sx={{ fontWeight: 800, color: 'error.main' }}>
                        Bill Amount: ₹{
                          (() => {
                            const custInputs = inputs[c.id];
                            let amount = 0;
                            if (custInputs) {
                              milkList.forEach(m => {
                                const q = parseFloat(custInputs.qtys[m.name] || '0');
                                if (q > 0) {
                                  const rate = c.pricing[m.name] || m.price;
                                  amount += (q * rate);
                                }
                              });
                            }
                            return Number(amount.toFixed(2));
                          })()
                        }
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      onClick={() => handleSaveEntry(c)}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
                        textTransform: 'none',
                        px: 4,
                        py: 1,
                        fontWeight: 700,
                        boxShadow: '0 4px 15px rgba(0, 114, 255, 0.2)',
                      }}
                    >
                      Save Entry
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Sticky Bottom Real-time Totals */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: { xs: 0, md: 280 }, 
          right: 0, 
          bgcolor: '#fff', 
          p: 2, 
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', 
          zIndex: 10,
          borderTop: '1px solid rgba(0,0,0,0.1)' 
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: 800, mx: 'auto' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>TOTAL INPUT QTY</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>{todayTotalQty} Ltr</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>TOTAL BILL AMOUNT</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>₹{todayTotalAmount}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default WholesaleDaily;
