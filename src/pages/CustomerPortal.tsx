import React, { useState, useMemo } from 'react';
import { useStore, type Customer, type WholesaleCustomer, type DailyInventory, type WholesaleDailyEntry } from '../context/StoreContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Card, CardContent
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomerPortal: React.FC = () => {
  const { customers, wholesaleCustomers, dailyRecords, wholesaleDaily, milkList, payments } = useStore();
  
  const customerId = sessionStorage.getItem('ssk_customer_id');
  const customerType = sessionStorage.getItem('ssk_customer_type'); // 'retail' | 'wholesale'

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Get current customer
  const customer = useMemo(() => {
    if (customerType === 'retail') return customers.find(c => c.id === customerId);
    return wholesaleCustomers.find(c => c.id === customerId);
  }, [customers, wholesaleCustomers, customerId, customerType]);

  const retailCustomer = customerType === 'retail' ? customer as Customer : null;
  const wholesaleCustomer = customerType === 'wholesale' ? customer as WholesaleCustomer : null;

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(parseISO(`${selectedMonth}-01`));

  // Get monthly deliveries
  const monthlyData = useMemo(() => {
    if (!customer) return [];
    
    if (retailCustomer) {
      const records: { date: string; qty: number; amount: number; price: number; milkName: string }[] = [];
      Object.keys(dailyRecords).forEach(dateStr => {
        const dateObj = parseISO(dateStr);
        if (isWithinInterval(dateObj, { start: monthStart, end: monthEnd })) {
          const entry = dailyRecords[dateStr].find(d => d.customerId === customer.id);
          if (entry && entry.delivered) {
            const milkItem = milkList.find(m => m.name === entry.milkName);
            const price = milkItem ? milkItem.price : 0;
            records.push({ date: dateStr, qty: entry.qty, amount: entry.qty * price, price, milkName: entry.milkName });
          }
        }
      });
      return records.sort((a, b) => a.date.localeCompare(b.date));
    } else if (wholesaleCustomer) {
      return wholesaleDaily
        .filter(d => d.wholesaleCustomerId === customer.id && d.date.startsWith(selectedMonth))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  }, [customer, retailCustomer, wholesaleCustomer, dailyRecords, wholesaleDaily, selectedMonth, monthStart, monthEnd, milkList]);

  const totalPendingAmount = useMemo(() => {
    if (retailCustomer) {
      return payments
        .filter(p => p.customerId === customer.id && (p.status === 'pending' || p.status === 'unpaid'))
        .reduce((acc, p) => acc + p.amount, 0);
    } else if (wholesaleCustomer) {
      return wholesaleCustomer.balance;
    }
    return 0;
  }, [customer, retailCustomer, wholesaleCustomer, payments]);

  const totalMonthlyAmount = useMemo(() => {
    if (retailCustomer) {
      return (monthlyData as any[]).reduce((acc, curr) => acc + curr.amount, 0);
    } else if (wholesaleCustomer) {
      return (monthlyData as WholesaleDailyEntry[]).reduce((acc, curr) => acc + curr.totalBill, 0);
    }
    return 0;
  }, [monthlyData, retailCustomer, wholesaleCustomer]);

  const generatePDF = () => {
    if (!customer) return;
    const doc = new jsPDF();
    const invoiceDate = format(new Date(), 'dd MMM yyyy');
    const billMonth = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy');

    // --- Header ---
    doc.setFillColor(0, 114, 255);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 14, 25);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("SHREE SAI KRUPA", 140, 20);
    doc.setFontSize(10);
    doc.text("Kirana & Milk Store", 140, 26);
    doc.text("Ph: 9898801505", 140, 32);

    // --- Bill To Section ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(customer.name, 14, 62);
    if (customer.address) doc.text(customer.address, 14, 68);
    doc.text(`Mobile: ${customer.mobile}`, 14, customer.address ? 74 : 68);

    // --- Invoice Details ---
    doc.setFont("helvetica", "bold");
    doc.text(`Billing Month:`, 140, 55);
    doc.text(`Invoice Date:`, 140, 62);
    
    doc.setFont("helvetica", "normal");
    doc.text(billMonth, 170, 55);
    doc.text(invoiceDate, 170, 62);

    let currentY = 85;

    if (retailCustomer) {
      const tableColumn = ["Date", "Milk Type", "Qty", "Price/Ltr", "Amount (Rs)"];
      const tableRows: any[] = [];
      
      (monthlyData as any[]).forEach(entry => {
        tableRows.push([
          format(parseISO(entry.date), 'dd MMM yyyy'),
          entry.milkName,
          entry.qty.toString(),
          entry.price.toString(),
          entry.amount.toString()
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 114, 255] }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Qty: ${(monthlyData as any[]).reduce((a,b)=>a+b.qty,0)} Ltr`, 14, currentY);
      doc.text(`Total Bill Amount: Rs. ${totalMonthlyAmount}`, 140, currentY);
    } else if (wholesaleCustomer) {
      const wData = monthlyData as WholesaleDailyEntry[];
      const tableColumn = ["Date", "Items", "Bill Amount", "Paid", "Balance Fwd"];
      const tableRows: any[] = [];
      
      wData.forEach(d => {
        const itemStr = d.items.map(i => `${i.qty}L ${i.milkName}`).join(', ');
        tableRows.push([
          format(parseISO(d.date), 'dd MMM yyyy'),
          itemStr,
          `Rs. ${d.totalBill}`,
          `Rs. ${d.amountPaid}`,
          `Rs. ${d.balanceForward}`
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 114, 255] }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    currentY += 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(231, 76, 60);
    doc.text(`TOTAL PENDING BALANCE: Rs. ${totalPendingAmount > 0 ? totalPendingAmount : 0}`, 14, currentY);
    
    if (totalPendingAmount < 0) {
      doc.setTextColor(46, 204, 113);
      doc.text(`ADVANCE BALANCE: Rs. ${Math.abs(totalPendingAmount)}`, 14, currentY + 7);
      currentY += 7;
    }

    // Signature
    currentY += 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text('Online Payment (PhonePe): 9898801505', 14, currentY);
    doc.text('Note: Please pay within 5 days.', 14, currentY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text('Authorized Signatory', 160, currentY + 5);

    doc.save(`Invoice_${customer.name.replace(/ /g, '_')}_${selectedMonth}.pdf`);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  if (!customer) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Customer not found.</Typography>
        <Button onClick={handleLogout} sx={{ mt: 2 }}>Back to Login</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Welcome, {customer.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Here is your milk delivery dashboard.
          </Typography>
        </Box>
        <Button onClick={handleLogout} variant="outlined" color="error">
          Logout
        </Button>
      </Box>

      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)', color: '#fff', borderRadius: 4 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.5, opacity: 0.9 }}>
            TOTAL PENDING AMOUNT
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>
            ₹{totalPendingAmount > 0 ? totalPendingAmount : 0}
          </Typography>
          {totalPendingAmount < 0 && (
            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
              Advance: ₹{Math.abs(totalPendingAmount)}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Select Month"
            onChange={(e) => setSelectedMonth(e.target.value)}
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

        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={generatePDF}
          sx={{ borderRadius: 2, background: '#2ecc71', '&:hover': { background: '#27ae60' } }}
        >
          Download PDF Bill
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Table>
          <TableHead sx={{ background: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
              {wholesaleCustomer && <TableCell sx={{ fontWeight: 700 }}>Bill Amount</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {monthlyData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No deliveries found for this month.
                </TableCell>
              </TableRow>
            ) : (
              (monthlyData as any[]).map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{format(parseISO(row.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    {retailCustomer 
                      ? `${row.qty} Ltr` 
                      : row.items.map((i: any) => `${i.qty}L ${i.milkName}`).join(', ')
                    }
                  </TableCell>
                  {wholesaleCustomer && (
                    <TableCell sx={{ fontWeight: 600 }}>₹{row.totalBill}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CustomerPortal;
