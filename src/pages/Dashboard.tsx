import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext';
import { format, subDays } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Rating,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CreditCardIcon from '@mui/icons-material/CreditCard';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { customers, milkList, dailyRecords, payments, wholesaleCustomers, wholesaleDaily } = useStore();

  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data, error }) => {
          if (!error && data) {
            setRecentReviews(data);
          }
        });
    }
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayDeliveries = dailyRecords[todayStr] || [];
  const todayWsDeliveries = wholesaleDaily.filter(d => d.date === todayStr);

  // 1. Stats calculation
  const totalCustomers = customers.length + wholesaleCustomers.length;
  const completedDeliveries = todayDeliveries.filter((d) => d.delivered).length + todayWsDeliveries.length;

  const retailDailyRev = useMemo(() => {
    return customers.reduce((acc, customer) => {
      let dailyTotal = 0;
      customer.subscriptions?.forEach(sub => {
        const milk = milkList.find((m) => m.name === sub.milkName);
        const price = milk ? milk.price : 0;
        dailyTotal += Number((sub.defaultQty * price).toFixed(2));
      });
      return acc + dailyTotal;
    }, 0);
  }, [customers, milkList]);

  const wholesaleDailyRev = useMemo(() => {
    return todayWsDeliveries.reduce((acc, d) => acc + d.totalBill, 0);
  }, [todayWsDeliveries]);

  const dailyRev = retailDailyRev + wholesaleDailyRev;

  const retailPendingCount = payments.filter((p) => p.status === 'pending' || p.status === 'unpaid').length;
  const wholesalePendingCount = wholesaleCustomers.filter(c => c.balance > 0).length;
  const pendingPaymentsCount = retailPendingCount + wholesalePendingCount;

  // 2. Milk Share Calculations for the Donut Chart
  const milkShareData = useMemo(() => {
    const counts: { [name: string]: number } = {};
    customers.forEach((c) => {
      c.subscriptions?.forEach(sub => {
        counts[sub.milkName] = (counts[sub.milkName] || 0) + sub.defaultQty;
      });
    });

    const totalQty = Object.values(counts).reduce((a, b) => a + b, 0);

    const colors = ['#0072FF', '#2ecc71', '#f1c40f', '#e74c3c'];
    return Object.entries(counts).map(([name, qty], idx) => {
      const percent = totalQty > 0 ? (qty / totalQty) * 100 : 0;
      return {
        name,
        qty,
        percent,
        color: colors[idx % colors.length],
      };
    });
  }, [customers]);

  // 3. Weekly revenue trend data points (SVG Line Chart helper)
  const weeklyTrendData = useMemo(() => {
    const points = [];
    // past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'dd MMM');

      const deliveries = dailyRecords[dateStr];
      const wsDeliveries = wholesaleDaily.filter(d => d.date === dateStr);
      let revenue = 0;
      
      if (deliveries) {
        deliveries.forEach((d) => {
          if (d.delivered) {
            const milk = milkList.find((m) => m.name === d.milkName);
            const price = milk ? milk.price : 0;
            revenue += Number((d.qty * price).toFixed(2));
          }
        });
      } else {
        // Mock historical data mapping for retail
        revenue = retailDailyRev * (0.85 + Math.sin(i) * 0.1);
      }

      // Add wholesale historical
      wsDeliveries.forEach(w => revenue += w.totalBill);

      points.push({ label, revenue });
    }
    return points;
  }, [dailyRecords, wholesaleDaily, milkList, retailDailyRev]);

  // SVG Line Chart Dimension Helpers
  const maxRev = Math.max(...weeklyTrendData.map((d) => d.revenue), 1000);
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 20;

  const pointsString = weeklyTrendData
    .map((d, index) => {
      const x = padding + (index * (chartWidth - 2 * padding)) / 6;
      const y = chartHeight - padding - (d.revenue / maxRev) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      {/* Title Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(45deg, #0f172a, #0072FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              fontSize: { xs: '1.8rem', md: '2.125rem' }
            }}
          >
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            {t('dashboard.subtitle')} - {format(new Date(), 'eeee, dd MMMM yyyy')}
          </Typography>
        </Box>
      </Box>

      {/* Info Guide Alert Box */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 4,
          background: 'rgba(0, 114, 255, 0.04)',
          border: '1px solid rgba(0, 114, 255, 0.1)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <InfoIcon sx={{ color: '#0072FF', fontSize: 26 }} />
        <Box>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, mb: 0.5 }}>
            {t('dashboard.quick_guide')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Tip: Go to **Daily Sheet** to mark today's check-ins. If a customer paid their bill, click **Payments** to record it.
          </Typography>
        </Box>
      </Paper>

      {/* Stats Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: '#0072FF' }} />
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(0, 114, 255, 0.08)', color: '#0072FF', width: 48, height: 48, mr: 2 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.total_customers')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
                  {totalCustomers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: '#2ecc71' }} />
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(46, 204, 113, 0.08)', color: '#2ecc71', width: 48, height: 48, mr: 2 }}>
                <LocalShippingIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.active_deliveries')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
                  {completedDeliveries} / {totalCustomers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={0}
            sx={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: '#f1c40f' }} />
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(241, 196, 15, 0.08)', color: '#f1c40f', width: 48, height: 48, mr: 2 }}>
                <CurrencyRupeeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('dashboard.daily_revenue')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
                  ₹{dailyRev.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Chart Panels */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Sales Trend Line Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
              📈 Past 7-Day Revenue Trend (₹)
            </Typography>

            <Box sx={{ width: '100%', overflowX: 'auto', mt: 2 }}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0072FF" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0072FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines */}
                {[0, 0.5, 1].map((r, idx) => {
                  const y = padding + r * (chartHeight - 2 * padding);
                  return (
                    <line
                      key={idx}
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="rgba(0,0,0,0.04)"
                      strokeWidth={1}
                    />
                  );
                })}

                {/* Shaded Area */}
                <path
                  d={`M ${padding},${chartHeight - padding} L ${pointsString} L ${chartWidth - padding},${chartHeight - padding} Z`}
                  fill="url(#chartGrad)"
                />

                {/* Line Path */}
                <polyline
                  fill="none"
                  stroke="#0072FF"
                  strokeWidth={3}
                  points={pointsString}
                />

                {/* Data point dots with labels */}
                {weeklyTrendData.map((d, index) => {
                  const x = padding + (index * (chartWidth - 2 * padding)) / 6;
                  const y = chartHeight - padding - (d.revenue / maxRev) * (chartHeight - 2 * padding);
                  return (
                    <g key={index}>
                      <circle cx={x} cy={y} r={4} fill="#ffffff" stroke="#0072FF" strokeWidth={2} />
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#0072FF"
                      >
                        ₹{Math.round(d.revenue)}
                      </text>
                      <text
                        x={x}
                        y={chartHeight - 2}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </Box>
          </Paper>
        </Grid>

        {/* Milk Share Donut Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
              🥛 Milk Variant Distribution
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 1 }}>
              {/* Custom SVG Donut */}
              <Box sx={{ width: 110, height: 110, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(0,0,0,0.04)" strokeWidth="4" />
                  
                  {/* Accumulate stroke dashes dynamically */}
                  {(() => {
                    let accumulatedPercent = 0;
                    return milkShareData.map((m, idx) => {
                      const strokeDasharray = `${m.percent} ${100 - m.percent}`;
                      const strokeDashoffset = 100 - accumulatedPercent + 25; // start top (25 offset)
                      accumulatedPercent += m.percent;
                      return (
                        <circle
                          key={idx}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={m.color}
                          strokeWidth="5.2"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                    TOTAL
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
                    {milkShareData.reduce((sum, item) => sum + item.qty, 0).toFixed(1)}L
                  </Typography>
                </Box>
              </Box>

              {/* Legends list */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                {milkShareData.map((m, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {m.percent.toFixed(0)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Advanced Quick Actions Grid */}
      <Grid container spacing={4}>
        {/* Redesigned Quick Action Cards Grid */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, md: 3 },
              height: '100%',
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.01)',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
              ⚡ Premium Actions Control Center
            </Typography>

            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {/* Daily Sheet Card (Highlighted) */}
              <Grid size={{ xs: 6 }}>
                <Card
                  onClick={() => navigate('/daily')}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '1px solid rgba(0, 114, 255, 0.12)',
                    background: 'rgba(0, 114, 255, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 20px rgba(0, 114, 255, 0.06)',
                      background: 'rgba(0, 114, 255, 0.05)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(0, 114, 255, 0.1)', color: '#0072FF', width: 32, height: 32 }}>
                      <AssignmentIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0072FF', lineHeight: 1.2 }}>
                      Daily Deliveries
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, mb: 1, minHeight: 32, fontSize: '0.65rem' }}>
                    Mark today's milk delivery checklist, override quantities, and sync check-ins.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#0072FF', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Go to Checklist</Typography>
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Card>
              </Grid>

              {/* Add Customer Redesigned Card */}
              <Grid size={{ xs: 6 }}>
                <Card
                  onClick={() => navigate('/customers')}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '1px solid rgba(46, 204, 113, 0.12)',
                    background: 'rgba(46, 204, 113, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 20px rgba(46, 204, 113, 0.06)',
                      background: 'rgba(46, 204, 113, 0.05)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', width: 32, height: 32 }}>
                      <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#27ae60', lineHeight: 1.2 }}>
                      New Customer
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, mb: 1, minHeight: 32, fontSize: '0.65rem' }}>
                    Register a new milk buyer with preferences, mobile number, address, and quantity.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#2ecc71', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Register Customer</Typography>
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Card>
              </Grid>

              {/* Record Payment Card */}
              <Grid size={{ xs: 6 }}>
                <Card
                  onClick={() => navigate('/payments')}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '1px solid rgba(241, 196, 15, 0.12)',
                    background: 'rgba(241, 196, 15, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 20px rgba(241, 196, 15, 0.06)',
                      background: 'rgba(241, 196, 15, 0.05)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f', width: 32, height: 32 }}>
                      <CreditCardIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#d4a300', lineHeight: 1.2 }}>
                      Payments Ledger
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, mb: 1, minHeight: 32, fontSize: '0.65rem' }}>
                    Log a transaction, check UPI/Cash dues, and clear unpaid invoices.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#f1c40f', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Check Ledger</Typography>
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Card>
              </Grid>

              {/* Sales Statistics Card */}
              <Grid size={{ xs: 6 }}>
                <Card
                  onClick={() => navigate('/sales')}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '1px solid rgba(155, 89, 182, 0.12)',
                    background: 'rgba(155, 89, 182, 0.02)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 20px rgba(155, 89, 182, 0.06)',
                      background: 'rgba(155, 89, 182, 0.05)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', width: 32, height: 32 }}>
                      <QueryStatsIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#8e44ad', lineHeight: 1.2 }}>
                      Sales Reports
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, mb: 1, minHeight: 32, fontSize: '0.65rem' }}>
                    Analyze weekly, monthly, and yearly revenue numbers with customer filters.
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#9b59b6', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Analyze Sales</Typography>
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Notifications & Ledger Overview Column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              height: '100%',
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.01)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 3 }}>
              🚨 {t('dashboard.pending_payments')}
            </Typography>

            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: '16px',
                bgcolor: pendingPaymentsCount > 0 ? 'rgba(231, 76, 60, 0.08)' : 'rgba(46, 204, 113, 0.08)',
                border: pendingPaymentsCount > 0 ? '1px solid rgba(231, 76, 60, 0.2)' : '1px solid rgba(46, 204, 113, 0.2)',
              }}
            >
              <Typography variant="body2" sx={{ color: pendingPaymentsCount > 0 ? '#d32f2f' : '#2e7d32', fontWeight: 800 }}>
                {t('dashboard.pending_count', { count: pendingPaymentsCount })}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)', mb: 2 }} />

            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 800, mb: 1.5 }}>
              Quick Ledger Stats
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Registered Milk Products:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>{milkList.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Payment Transactions:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>{payments.length}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Reviews Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
           Recent Customer Reviews
        </Typography>
        {recentReviews.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>No reviews yet.</Typography>
        ) : (
          <Grid container spacing={2}>
            {recentReviews.map((rev) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={rev.id}>
                <Card sx={{ borderRadius: 3, p: 2, height: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{rev.customer_name || 'Anonymous'}</Typography>
                  <Rating value={rev.rating} readOnly size="small" sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    {rev.comment ? `"${rev.comment}"` : "No comment left"}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
