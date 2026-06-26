import React, { useState, useMemo } from 'react';
import { useStore, type Customer, type WholesaleCustomer, type WholesaleDailyEntry } from '../context/StoreContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomerPortal: React.FC = () => {
  const { customers, wholesaleCustomers, dailyRecords, wholesaleDaily, milkList, payments } = useStore();
  
  const customerId = sessionStorage.getItem('ssk_customer_id');
  const customerType = sessionStorage.getItem('ssk_customer_type'); // 'retail' | 'wholesale'

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);

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
      // Calculate all-time billed amount
      const totalBilled = Object.keys(dailyRecords).reduce((acc, dateStr) => {
        const entry = dailyRecords[dateStr].find(d => d.customerId === customer?.id);
        if (entry && entry.delivered) {
           const milkItem = milkList.find(m => m.name === entry.milkName);
           const price = milkItem ? milkItem.price : 0;
           return acc + (entry.qty * price);
        }
        return acc;
      }, 0);
      
      // Calculate all-time completed payments
      const totalPaid = payments
        .filter(p => p.customerId === customer?.id && p.status === 'completed')
        .reduce((acc, p) => acc + p.amount, 0);
        
      return totalBilled - totalPaid;
    } else if (wholesaleCustomer) {
      return wholesaleCustomer.balance;
    }
    return 0;
  }, [customer, retailCustomer, wholesaleCustomer, monthlyData, payments, selectedMonth]);

  const totalMonthlyAmount = useMemo(() => {
    if (retailCustomer) {
      return (monthlyData as any[]).reduce((acc, curr) => acc + curr.amount, 0);
    } else if (wholesaleCustomer) {
      return (monthlyData as WholesaleDailyEntry[]).reduce((acc, curr) => acc + curr.totalBill, 0);
    }
    return 0;
  }, [monthlyData, retailCustomer, wholesaleCustomer]);

  const generatePDF = (action: 'download' | 'view' = 'download') => {
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
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.text("Savalram Mali", 150, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text('Authorized Signatory', 150, currentY + 5);

    if (action === 'download') {
      doc.save(`Invoice_${customer.name.replace(/ /g, '_')}_${selectedMonth}.pdf`);
    } else {
      setPdfDataUri(doc.output('datauristring'));
      setOpenPdfDialog(true);
    }
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

      <Card sx={{ mb: 4, background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        <Box sx={{ p: 4, textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.5, color: 'text.secondary' }}>
            TOTAL PENDING AMOUNT
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, color: totalPendingAmount > 0 ? '#e74c3c' : (totalPendingAmount < 0 ? '#2ecc71' : 'text.primary') }}>
            ₹{totalPendingAmount > 0 ? totalPendingAmount : 0}
          </Typography>
          {totalPendingAmount < 0 && (
            <Typography variant="body1" sx={{ mt: 1, color: '#2ecc71', fontWeight: 600 }}>
              Advance Balance: ₹{Math.abs(totalPendingAmount)}
            </Typography>
          )}
        </Box>
        <Box sx={{ background: 'rgba(0,114,255,0.02)', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>SHREE SAI KRUPA</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Kirana & Milk Store</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Authorized Signatory</Typography>
            <Typography variant="body1" sx={{ fontFamily: 'cursive', fontStyle: 'italic', color: '#0072FF', fontWeight: 600 }}>Savalram Mali</Typography>
          </Box>
        </Box>
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

        <Box>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => generatePDF('view')}
            sx={{ borderRadius: 2, mr: 2 }}
          >
            View PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => generatePDF('download')}
            sx={{ borderRadius: 2, background: '#2ecc71', '&:hover': { background: '#27ae60' } }}
          >
            Download
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {monthlyData.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <Typography sx={{ color: 'text.secondary' }}>No deliveries found for this month.</Typography>
          </Box>
        ) : (
          (monthlyData as any[]).map((row, idx) => (
            <Card key={idx} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{format(parseISO(row.date), 'dd MMM yyyy')}</Typography>
                  {wholesaleCustomer && <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2ecc71' }}>₹{row.totalBill}</Typography>}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {retailCustomer 
                    ? `${row.qty} Ltr` 
                    : row.items.map((i: any) => `${i.qty}L ${i.milkName}`).join(', ')
                  }
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* PDF Viewer Dialog */}
      <Dialog open={openPdfDialog} onClose={() => setOpenPdfDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Bill Details (PDF)</Typography>
          <Button onClick={() => setOpenPdfDialog(false)} color="inherit">Close</Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '75vh', overflow: 'hidden' }}>
          {pdfDataUri && (
            <iframe src={pdfDataUri} width="100%" height="100%" style={{ border: 'none' }} title="PDF Bill" />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomerPortal;
