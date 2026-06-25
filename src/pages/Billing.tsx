import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type Customer } from '../context/StoreContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
  IconButton,
  Divider,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

const Billing: React.FC = () => {
  const { t } = useTranslation();
  const { customers, milkList, dailyRecords, payments, clearTable } = useStore();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Generate Date boundaries for selected month
  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(parseISO(`${selectedMonth}-01`));

  // Billing calculation logic
  const customerBills = useMemo(() => {
    return customers.map(customer => {
      let totalAmount = 0;
      let totalQty = 0;
      const dailyEntries: { date: string; qty: number; amount: number; price: number; milkName: string }[] = [];

      // Look through all records for this month
      Object.keys(dailyRecords).forEach(dateStr => {
        const dateObj = parseISO(dateStr);
        if (isWithinInterval(dateObj, { start: monthStart, end: monthEnd })) {
          const recordList = dailyRecords[dateStr];
          const custRecord = recordList.find(r => r.customerId === customer.id);
          
          if (custRecord && custRecord.delivered) {
            const milkItem = milkList.find(m => m.name === custRecord.milkName);
            const price = milkItem ? milkItem.price : 0;
            const amount = custRecord.qty * price;

            totalAmount += amount;
            totalQty += custRecord.qty;
            dailyEntries.push({
              date: dateStr,
              qty: custRecord.qty,
              amount: amount,
              price: price,
              milkName: custRecord.milkName,
            });
          }
        }
      });

      // Sort entries by date
      dailyEntries.sort((a, b) => a.date.localeCompare(b.date));

      const custPayments = payments.filter(p => p.customerId === customer.id && p.date.startsWith(selectedMonth));

      return {
        customer,
        totalAmount,
        totalQty,
        dailyEntries,
        custPayments,
      };
    });
  }, [customers, dailyRecords, milkList, monthStart, monthEnd, payments, selectedMonth]);

  const handleOpenDetails = (customerInfo: any) => {
    setSelectedCustomer(customerInfo);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
  };

  const generatePDF = (custBill: any, autoDownload = true) => {
    const doc = new jsPDF();
    const cust = custBill.customer;
    const invoiceDate = format(new Date(), 'dd MMM yyyy');
    const billMonth = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy');

    // --- Header ---
    doc.setFillColor(0, 114, 255); // Blue primary color
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
    doc.text(cust.name, 14, 62);
    if (cust.address) doc.text(cust.address, 14, 68);
    doc.text(`Mobile: ${cust.mobile}`, 14, cust.address ? 74 : 68);

    // --- Invoice Details ---
    doc.setFont("helvetica", "bold");
    doc.text(`Billing Month:`, 140, 55);
    doc.text(`Invoice Date:`, 140, 62);
    
    doc.setFont("helvetica", "normal");
    doc.text(billMonth, 170, 55);
    doc.text(invoiceDate, 170, 62);

    // --- Table ---
    const tableColumn = ["Date", "Milk Type", "Qty", "Price/Ltr", "Amount (Rs)"];
    const tableRows: any[] = [];

    custBill.dailyEntries.forEach((entry: any) => {
      const entryData = [
        format(parseISO(entry.date), 'dd MMM yyyy'),
        entry.milkName,
        entry.qty.toString(),
        `Rs. ${entry.price}`,
        `Rs. ${entry.amount}`,
      ];
      tableRows.push(entryData);
    });

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 114, 255], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 248, 250] },
    });

    // --- Totals ---
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Quantity: ${custBill.totalQty} Ltrs/Pcs`, 14, finalY + 15);
    
    // Total Amount Box
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(0, 114, 255);
    doc.rect(130, finalY + 10, 65, 12, 'FD');
    doc.setTextColor(0, 114, 255);
    doc.text(`TOTAL: Rs. ${custBill.totalAmount}`, 135, finalY + 18);

    let currentY = finalY + 35;

    // --- Payment History Table ---
    if (custBill.custPayments && custBill.custPayments.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Payment Ledger (Current Month):", 14, currentY);
      
      const pTableColumn = ["Date", "Status", "Amount (Rs)", "Note"];
      const pTableRows: any[] = [];
      custBill.custPayments.forEach((p: any) => {
        pTableRows.push([
          format(parseISO(p.date), 'dd MMM yyyy'),
          p.status.toUpperCase(),
          `Rs. ${p.amount}`,
          p.note || '-'
        ]);
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [pTableColumn],
        body: pTableRows,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 2 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Payment Info & Notes ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Online Payment (PhonePe):", 14, currentY);
    doc.setFontSize(14);
    doc.setTextColor(0, 114, 255);
    doc.text("9898801505", 14, currentY + 7);

    doc.setTextColor(220, 53, 69); // Red for emphasis
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("NOTE: Please pay the payment within 5 days. Do not delay.", 14, currentY + 17);
    doc.text("Please share a screenshot of the payment.", 14, currentY + 22);

    // --- Signature ---
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(14);
    doc.text("Shree Sai Krupa", 150, currentY + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Authorized Signatory", 150, currentY + 20);

    if (autoDownload) {
      doc.save(`Invoice_${cust.name.replace(/\s+/g, '_')}_${selectedMonth}.pdf`);
    }
    return doc;
  };

  const handleWhatsApp = (custBill: any) => {
    // Generate and download PDF first
    generatePDF(custBill, true);

    const cust = custBill.customer;
    const formattedMobile = cust.mobile.startsWith('91') ? cust.mobile : `91${cust.mobile}`;
    const monthName = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy');
    
    const message = `नमस्ते *${cust.name}*, 
यह आपका *${monthName}* का दूध का बिल है।
*कुल मात्रा:* ${custBill.totalQty} Ltrs/Pcs
*कुल राशि (Total Amount):* ₹${custBill.totalAmount}

कृपया इस संदेश के साथ भेजे गए PDF बिल की जांच करें।

*Online Payment (PhonePe):* 9898801505

*NOTE:* Please pay the payment within 5 days. Do not delay.
Please share a screenshot of the payment.

धन्यवाद!
*श्री साई कृपा किराना स्टोर*`;

    const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Billing & Invoices
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Generate monthly bills and send them to your customers
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<DeleteSweepIcon />}
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear ALL payments and daily records?')) {
                if (window.confirm('WARNING: This will permanently delete all daily logs and payment history. Are you absolutely sure?')) {
                  await clearTable('daily_inventory');
                  await clearTable('payments');
                  window.location.reload();
                }
              }
            }}
            color="error"
            sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 700 }}
          >
            Clear All Data
          </Button>
          <TextField
            type="month"
            label="Select Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
        </Box>
      </Box>

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
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Mobile</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Total Qty</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Total Amount</TableCell>
              <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customerBills.map((bill, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.01)' },
                  transition: 'background-color 0.2s',
                }}
              >
                <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{bill.customer.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{bill.customer.mobile}</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>{bill.totalQty}</TableCell>
                <TableCell sx={{ color: '#2ecc71', fontWeight: 800 }}>₹{bill.totalAmount}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ReceiptLongIcon />}
                    onClick={() => handleOpenDetails(bill)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    View Bill
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bill Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        {selectedCustomer && (
          <>
            <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Bill Details: {(selectedCustomer as any).customer.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Month: {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy')}
                </Typography>
              </Box>
              <IconButton onClick={handleClose} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedCustomer as any).dailyEntries.map((entry: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{format(parseISO(entry.date), 'dd MMM')}</TableCell>
                        <TableCell>{entry.milkName}</TableCell>
                        <TableCell>{entry.qty}</TableCell>
                        <TableCell>₹{entry.price}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{entry.amount}</TableCell>
                      </TableRow>
                    ))}
                    {(selectedCustomer as any).dailyEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No deliveries recorded for this month.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary', mr: 2 }}>
                  Total Amount:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#27ae60' }}>
                  ₹{(selectedCustomer as any).totalAmount}
                </Typography>
              </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
              <Button 
                onClick={() => generatePDF(selectedCustomer, true)}
                startIcon={<PictureAsPdfIcon />}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Download PDF
              </Button>
              <Button 
                onClick={() => handleWhatsApp(selectedCustomer)}
                startIcon={<WhatsAppIcon />}
                variant="contained"
                color="success"
                sx={{ borderRadius: 2, boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)' }}
              >
                Send via WhatsApp
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

    </Box>
  );
};

export default Billing;
