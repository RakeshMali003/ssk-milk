import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface MilkItem {
  id: string;
  name: string;
  price: number;
}

export interface MilkSubscription {
  milkName: string;
  defaultQty: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  subscriptions: MilkSubscription[];
  isActive: boolean;
}

export interface DeliveryItem {
  customerId: string;
  customerName: string;
  milkName: string;
  qty: number;
  delivered: boolean;
}

export interface DailyRecord {
  date: string;
  deliveries: DeliveryItem[];
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'unpaid';
  method: 'cash' | 'upi';
  notes: string;
}

export interface WholesaleCustomer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  pricing: { [milkName: string]: number };
  balance: number;
  isActive: boolean;
}

export interface WholesaleDailyEntryItem {
  milkName: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface WholesaleDailyEntry {
  id: string;
  date: string;
  wholesaleCustomerId: string;
  items: WholesaleDailyEntryItem[];
  totalBill: number;
  amountPaid: number;
  balanceForward: number;
}

interface StoreContextType {
  milkList: MilkItem[];
  customers: Customer[];
  dailyRecords: { [date: string]: DeliveryItem[] };
  payments: Payment[];
  wholesaleCustomers: WholesaleCustomer[];
  wholesaleDaily: WholesaleDailyEntry[];
  isLoading: boolean;
  isSupabaseActive: boolean;
  addMilk: (milk: Omit<MilkItem, 'id'>) => void | Promise<void>;
  editMilk: (id: string, updated: Omit<MilkItem, 'id'>) => void | Promise<void>;
  deleteMilk: (id: string) => void | Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => void | Promise<void>;
  editCustomer: (id: string, updated: Omit<Customer, 'id'>) => void | Promise<void>;
  deleteCustomer: (id: string) => void | Promise<void>;
  saveDailyRecord: (date: string, deliveries: DeliveryItem[]) => void | Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => void | Promise<void>;
  updatePaymentStatus: (id: string, status: Payment['status']) => void | Promise<void>;
  addWholesaleCustomer: (customer: Omit<WholesaleCustomer, 'id' | 'balance'>) => void | Promise<void>;
  editWholesaleCustomer: (id: string, updated: Omit<WholesaleCustomer, 'id' | 'balance'>) => void | Promise<void>;
  deleteWholesaleCustomer: (id: string) => void | Promise<void>;
  saveWholesaleDailyEntry: (entry: Omit<WholesaleDailyEntry, 'id' | 'balanceForward'>) => void | Promise<void>;
  clearTable: (tableName: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const initialMilk: MilkItem[] = [
  { id: 'm1', name: 'Cow Milk (Full Cream)', price: 60 },
  { id: 'm2', name: 'Buffalo Milk', price: 70 },
  { id: 'm3', name: 'Taaza Milk (Pouch)', price: 54 },
  { id: 'm4', name: 'Gold Milk (Premium)', price: 66 },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Ramesh Sharma', email: 'ramesh@gmail.com', mobile: '9876543210', address: 'Plot 42, Sector 5, Vashi', subscriptions: [{ milkName: 'Cow Milk (Full Cream)', defaultQty: 2 }], isActive: true },
  { id: 'c2', name: 'Sanjay Patel', email: 'sanjay.p@gmail.com', mobile: '9822334455', address: 'B-201, Green Heights, Koparkhairane', subscriptions: [{ milkName: 'Buffalo Milk', defaultQty: 1.5 }], isActive: true },
  { id: 'c3', name: 'Sunita Deshmukh', email: 'sunita.d@gmail.com', mobile: '9123456789', address: 'Row House 3, Sector 12, Sanpada', subscriptions: [{ milkName: 'Taaza Milk (Pouch)', defaultQty: 3 }], isActive: true },
  { id: 'c4', name: 'Amit Verma', email: 'amit@verma.com', mobile: '9555112233', address: 'A-405, Sai Krupa Towers, Nerul', subscriptions: [{ milkName: 'Gold Milk (Premium)', defaultQty: 2 }], isActive: true },
  { id: 'c5', name: 'Kiran Yadav', email: 'kiran.yadav@gmail.com', mobile: '8888999900', address: 'Chawl No. 4, Turbhe Store', subscriptions: [{ milkName: 'Cow Milk (Full Cream)', defaultQty: 1 }], isActive: true },
];

const initialPayments: Payment[] = [
  { id: 'p1', customerId: 'c1', customerName: 'Ramesh Sharma', amount: 1800, date: '2026-06-15', status: 'completed', method: 'upi', notes: 'June Half Payment' },
  { id: 'p2', customerId: 'c2', customerName: 'Sanjay Patel', amount: 2100, date: '2026-06-10', status: 'completed', method: 'cash', notes: 'May Bill Paid' },
  { id: 'p3', customerId: 'c3', customerName: 'Sunita Deshmukh', amount: 1620, date: '2026-06-20', status: 'pending', method: 'upi', notes: 'Pending confirmation' },
  { id: 'p4', customerId: 'c4', customerName: 'Amit Verma', amount: 3960, date: '2026-06-05', status: 'unpaid', method: 'cash', notes: 'To be paid tomorrow' },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [milkList, setMilkList] = useState<MilkItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dailyRecords, setDailyRecords] = useState<{ [date: string]: DeliveryItem[] }>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [wholesaleCustomers, setWholesaleCustomers] = useState<WholesaleCustomer[]>([]);
  const [wholesaleDaily, setWholesaleDaily] = useState<WholesaleDailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase or fallback to localStorage
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        try {
          // 1. Fetch milk items
          const { data: milkData, error: milkError } = await supabase
            .from('milk_items')
            .select('*')
            .order('name');
          if (milkError) throw milkError;
          
          const mappedMilkList = (milkData || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            price: Number(m.price),
          }));
          setMilkList(mappedMilkList);

          // 2. Fetch customers
          const { data: customerData, error: custError } = await supabase
            .from('customers')
            .select('*')
            .order('name');
          if (custError) throw custError;

          const mappedCustomers = (customerData || []).map((c: any) => {
            let parsedSubs: MilkSubscription[] = [];
            try {
              if (c.subscriptions) {
                parsedSubs = typeof c.subscriptions === 'string' ? JSON.parse(c.subscriptions) : c.subscriptions;
              } else {
                // Fallback to legacy columns
                const milkItem = mappedMilkList.find((m) => m.id === c.milk_item_id);
                if (milkItem && c.daily_qty) {
                  parsedSubs = [{ milkName: milkItem.name, defaultQty: Number(c.daily_qty) }];
                }
              }
            } catch(e) {}
            
            return {
              id: c.id,
              name: c.name,
              email: c.email || '',
              mobile: c.mobile,
              address: c.address || '',
              subscriptions: parsedSubs,
              isActive: c.is_active !== false,
            };
          });
          setCustomers(mappedCustomers);

          // 3. Fetch daily inventory
          const { data: dailyData, error: dailyError } = await supabase
            .from('daily_inventory')
            .select('*');
          if (dailyError) throw dailyError;

          const recordsGrouped: { [date: string]: DeliveryItem[] } = {};
          (dailyData || []).forEach((row: any) => {
            const dateStr = row.delivery_date;
            const cust = mappedCustomers.find((c) => c.id === row.customer_id);
            const milkItem = mappedMilkList.find((m) => m.id === row.milk_item_id);
            
            if (!recordsGrouped[dateStr]) {
              recordsGrouped[dateStr] = [];
            }
            
            recordsGrouped[dateStr].push({
              customerId: row.customer_id,
              customerName: cust ? cust.name : 'Unknown Customer',
              milkName: milkItem ? milkItem.name : 'Unknown Milk',
              qty: Number(row.qty),
              delivered: row.delivered,
            });
          });
          setDailyRecords(recordsGrouped);

          // 4. Fetch payments
          const { data: paymentData, error: payError } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
          if (payError) throw payError;

          const mappedPayments = (paymentData || []).map((p: any) => {
            const cust = mappedCustomers.find((c) => c.id === p.customer_id);
            let reactStatus: 'pending' | 'completed' | 'unpaid' = 'pending';
            if (p.status === 'paid') reactStatus = 'completed';
            else if (p.status === 'pending') reactStatus = 'unpaid';
            
            const methodValid: 'cash' | 'upi' = p.mode === 'upi' ? 'upi' : 'cash';

            return {
              id: p.id,
              customerId: p.customer_id,
              customerName: cust ? cust.name : 'Unknown Customer',
              amount: Number(p.amount),
              date: p.payment_date,
              status: reactStatus,
              method: methodValid,
              notes: p.note || '',
            };
          });
          setPayments(mappedPayments);

          // 5. Fetch wholesale customers
          const { data: wsCustData, error: wsCustError } = await supabase
            .from('wholesale_customers')
            .select('*')
            .order('name');
          if (wsCustError) throw wsCustError;

          const mappedWsCustomers = (wsCustData || []).map((c: any) => {
            let parsedPricing = {};
            try {
              parsedPricing = typeof c.pricing === 'string' ? JSON.parse(c.pricing) : (c.pricing || {});
            } catch(e) {}
            return {
              id: c.id,
              name: c.name,
              mobile: c.mobile,
              address: c.address || '',
              pricing: parsedPricing,
              balance: Number(c.balance || 0),
              isActive: c.is_active !== false,
            };
          });
          setWholesaleCustomers(mappedWsCustomers);

          // 6. Fetch wholesale daily entries
          const { data: wsDailyData, error: wsDailyError } = await supabase
            .from('wholesale_daily_entries')
            .select('*')
            .order('entry_date');
          if (wsDailyError) throw wsDailyError;

          const mappedWsDaily = (wsDailyData || []).map((d: any) => {
            let parsedItems = [];
            try {
              parsedItems = typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || []);
            } catch(e) {}
            return {
              id: d.id,
              date: d.entry_date,
              wholesaleCustomerId: d.wholesale_customer_id,
              items: parsedItems,
              totalBill: Number(d.total_bill),
              amountPaid: Number(d.amount_paid),
              balanceForward: Number(d.balance_forward),
            };
          });
          setWholesaleDaily(mappedWsDaily);

        } catch (err) {
          console.error('Error loading Supabase data, falling back to local:', err);
          loadLocalFallback();
        }
      } else {
        loadLocalFallback();
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const loadLocalFallback = () => {
    const savedMilk = localStorage.getItem('ssk_milk');
    setMilkList(savedMilk ? JSON.parse(savedMilk) : initialMilk);

    const savedCustomers = localStorage.getItem('ssk_customers');
    setCustomers(savedCustomers ? JSON.parse(savedCustomers) : initialCustomers);

    const savedDaily = localStorage.getItem('ssk_daily');
    setDailyRecords(savedDaily ? JSON.parse(savedDaily) : {});

    const savedPayments = localStorage.getItem('ssk_payments');
    setPayments(savedPayments ? JSON.parse(savedPayments) : initialPayments);
  };

  // Sync back to local storage only if offline
  useEffect(() => {
    if (!isSupabaseConfigured && milkList.length > 0) {
      localStorage.setItem('ssk_milk', JSON.stringify(milkList));
    }
  }, [milkList]);

  useEffect(() => {
    if (!isSupabaseConfigured && customers.length > 0) {
      localStorage.setItem('ssk_customers', JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (!isSupabaseConfigured && Object.keys(dailyRecords).length > 0) {
      localStorage.setItem('ssk_daily', JSON.stringify(dailyRecords));
    }
  }, [dailyRecords]);

  useEffect(() => {
    if (!isSupabaseConfigured && payments.length > 0) {
      localStorage.setItem('ssk_payments', JSON.stringify(payments));
    }
  }, [payments]);

  // Actions
  const addMilk = async (milk: Omit<MilkItem, 'id'>) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('milk_items')
          .insert([{ name: milk.name, price: milk.price }])
          .select();
        if (error) throw error;
        if (data && data[0]) {
          const newItem = { id: data[0].id, name: data[0].name, price: Number(data[0].price) };
          setMilkList((prev) => [...prev, newItem]);
        }
      } catch (err) {
        console.error('Error adding milk:', err);
      }
    } else {
      const newMilk: MilkItem = { ...milk, id: 'm_' + Date.now() };
      setMilkList((prev) => [...prev, newMilk]);
    }
  };

  const editMilk = async (id: string, updated: Omit<MilkItem, 'id'>) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('milk_items')
          .update({ name: updated.name, price: updated.price })
          .eq('id', id);
        if (error) throw error;
        setMilkList((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      } catch (err) {
        console.error('Error editing milk:', err);
      }
    } else {
      setMilkList((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    }
  };

  const deleteMilk = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        // Handle dependencies before deleting to avoid FK constraint violations
        await supabase.from('customers').update({ milk_item_id: null }).eq('milk_item_id', id);
        await supabase.from('daily_inventory').update({ milk_item_id: null }).eq('milk_item_id', id);

        const { error } = await supabase
          .from('milk_items')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setMilkList((prev) => prev.filter((item) => item.id !== id));
      } catch (err: any) {
        console.error('Error deleting milk:', err);
        alert(`Failed to delete milk type: ${err.message}`);
      }
    } else {
      setMilkList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const addCustomer = async (cust: Omit<Customer, 'id'>) => {
    if (isSupabaseConfigured) {
      try {
        // Prepare legacy fields for backward compatibility if possible
        const firstSub = cust.subscriptions.length > 0 ? cust.subscriptions[0] : null;
        const milkItem = firstSub ? milkList.find((m) => m.name === firstSub.milkName) : null;
        
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: cust.name,
            email: cust.email || null,
            mobile: cust.mobile,
            address: cust.address || null,
            milk_item_id: milkItem ? milkItem.id : null,
            daily_qty: firstSub ? firstSub.defaultQty : 0,
            subscriptions: cust.subscriptions,
            is_active: cust.isActive
          }])
          .select();
        if (error) throw error;
        if (data && data[0]) {
          let parsedSubs = cust.subscriptions;
          try {
            if (data[0].subscriptions) parsedSubs = typeof data[0].subscriptions === 'string' ? JSON.parse(data[0].subscriptions) : data[0].subscriptions;
          } catch(e) {}
          
          const newCust = {
            id: data[0].id,
            name: data[0].name,
            email: data[0].email || '',
            mobile: data[0].mobile,
            address: data[0].address || '',
            subscriptions: parsedSubs,
            isActive: data[0].is_active !== false,
          };
          setCustomers((prev) => [...prev, newCust]);
        }
      } catch (err) {
        console.error('Error adding customer:', err);
      }
    } else {
      const newCust: Customer = { ...cust, id: 'c_' + Date.now() };
      setCustomers((prev) => [...prev, newCust]);
    }
  };

  const editCustomer = async (id: string, updated: Omit<Customer, 'id'>) => {
    if (isSupabaseConfigured) {
      try {
        const firstSub = updated.subscriptions.length > 0 ? updated.subscriptions[0] : null;
        const milkItem = firstSub ? milkList.find((m) => m.name === firstSub.milkName) : null;
        
        const { error } = await supabase
          .from('customers')
          .update({
            name: updated.name,
            email: updated.email || null,
            mobile: updated.mobile,
            address: updated.address || null,
            milk_item_id: milkItem ? milkItem.id : null,
            daily_qty: firstSub ? firstSub.defaultQty : 0,
            subscriptions: updated.subscriptions,
            is_active: updated.isActive
          })
          .eq('id', id);
        if (error) throw error;
        setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      } catch (err) {
        console.error('Error editing customer:', err);
      }
    } else {
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    }
  };

  const deleteCustomer = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        // Delete related records first to avoid foreign key errors
        await supabase.from('sales').delete().eq('customer_id', id);
        await supabase.from('daily_inventory').delete().eq('customer_id', id);
        await supabase.from('payments').delete().eq('customer_id', id);

        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } catch (err: any) {
        console.error('Error deleting customer:', err);
        alert(`Failed to delete: ${err.message}`);
      }
    } else {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const clearTable = async (tableName: string) => {
    if (isSupabaseConfigured) {
      try {
        // Need to bypass row limits by using an always-true filter. For UUIDs, neq a dummy string works.
        const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        return true;
      } catch (err: any) {
        console.error(`Error clearing ${tableName}:`, err);
        alert(`Failed to clear data: ${err.message}`);
        return false;
      }
    }
    return true; // Local mode fallback
  };

  const saveDailyRecord = async (dateStr: string, deliveries: DeliveryItem[]) => {
    if (isSupabaseConfigured) {
      try {
        // 1. Delete existing for this date
        const { error: delError } = await supabase
          .from('daily_inventory')
          .delete()
          .eq('delivery_date', dateStr);
        if (delError) throw delError;

        // 2. Insert new ones
        const insertRows = deliveries.map((d) => {
          const milkItem = milkList.find((m) => m.name === d.milkName);
          return {
            delivery_date: dateStr,
            customer_id: d.customerId,
            milk_item_id: milkItem ? milkItem.id : null,
            qty: d.qty,
            delivered: d.delivered,
          };
        });

        // Resolve string milk names to uuid if any
        const insertRowsResolved = insertRows.map((row) => {
          let milkItemId = row.milk_item_id;
          if (typeof milkItemId === 'string' && !milkItemId.includes('-')) {
            const found = milkList.find((m) => m.name === milkItemId);
            milkItemId = found ? found.id : null;
          }
          return {
            ...row,
            milk_item_id: milkItemId,
          };
        });

        const { error: insError } = await supabase
          .from('daily_inventory')
          .insert(insertRowsResolved);
        if (insError) throw insError;

        setDailyRecords((prev) => ({ ...prev, [dateStr]: deliveries }));
      } catch (err) {
        console.error('Error saving daily record:', err);
      }
    } else {
      setDailyRecords((prev) => ({ ...prev, [dateStr]: deliveries }));
    }
  };

  const addPayment = async (pay: Omit<Payment, 'id'>) => {
    if (isSupabaseConfigured) {
      try {
        let dbStatus = 'pending';
        if (pay.status === 'completed') dbStatus = 'paid';
        else if (pay.status === 'unpaid') dbStatus = 'pending';
        else if (pay.status === 'pending') dbStatus = 'pending';

        const { data, error } = await supabase
          .from('payments')
          .insert([{
            customer_id: pay.customerId,
            amount: pay.amount,
            status: dbStatus,
            mode: pay.method,
            note: pay.notes || null,
            payment_date: pay.date,
          }])
          .select();
        if (error) throw error;
        if (data && data[0]) {
          const methodValid: 'cash' | 'upi' = data[0].mode === 'upi' ? 'upi' : 'cash';
          const newPay: Payment = {
            id: data[0].id,
            customerId: data[0].customer_id,
            customerName: pay.customerName,
            amount: Number(data[0].amount),
            date: data[0].payment_date,
            status: pay.status,
            method: methodValid,
            notes: data[0].note || '',
          };
          setPayments((prev) => [newPay, ...prev]);
        }
      } catch (err) {
        console.error('Error adding payment:', err);
      }
    } else {
      const newPay: Payment = { ...pay, id: 'p_' + Date.now() };
      setPayments((prev) => [newPay, ...prev]);
    }
  };

  const updatePaymentStatus = async (id: string, status: Payment['status']) => {
    if (isSupabaseConfigured) {
      try {
        let dbStatus = 'pending';
        if (status === 'completed') dbStatus = 'paid';
        else if (status === 'unpaid') dbStatus = 'pending';
        else if (status === 'pending') dbStatus = 'pending';

        const updatePayload: any = { status: dbStatus };
        if (status === 'completed') {
          updatePayload.payment_date = new Date().toISOString();
        }

        const { error } = await supabase
          .from('payments')
          .update(updatePayload)
          .eq('id', id);
        if (error) throw error;
        setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status, date: status === 'completed' ? new Date().toISOString() : p.date } : p)));
      } catch (err) {
        console.error('Error updating payment status:', err);
      }
    } else {
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status, date: status === 'completed' ? new Date().toISOString() : p.date } : p)));
    }
  };

  const addWholesaleCustomer = async (cust: Omit<WholesaleCustomer, 'id' | 'balance'>) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('wholesale_customers')
          .insert([{
            name: cust.name,
            mobile: cust.mobile,
            address: cust.address || null,
            pricing: cust.pricing,
            balance: 0,
            is_active: cust.isActive
          }])
          .select();
        if (error) throw error;
        if (data && data[0]) {
          const newCust: WholesaleCustomer = {
            id: data[0].id,
            name: data[0].name,
            mobile: data[0].mobile,
            address: data[0].address || '',
            pricing: typeof data[0].pricing === 'string' ? JSON.parse(data[0].pricing) : (data[0].pricing || {}),
            balance: Number(data[0].balance),
            isActive: data[0].is_active !== false,
          };
          setWholesaleCustomers((prev) => [...prev, newCust]);
        }
      } catch (err: any) {
        console.error('Error adding wholesale customer:', err);
        alert(`Failed to save wholesale customer: ${err.message}`);
      }
    } else {
      const newCust: WholesaleCustomer = {
        ...cust,
        id: 'wc_' + Date.now(),
        balance: 0,
      };
      setWholesaleCustomers((prev) => [...prev, newCust]);
    }
  };

  const editWholesaleCustomer = async (id: string, updated: Omit<WholesaleCustomer, 'id' | 'balance'>) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('wholesale_customers')
          .update({
            name: updated.name,
            mobile: updated.mobile,
            address: updated.address || null,
            pricing: updated.pricing,
            is_active: updated.isActive
          })
          .eq('id', id);
        if (error) throw error;
        setWholesaleCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      } catch (err: any) {
        console.error('Error editing wholesale customer:', err);
        alert(`Failed to update wholesale customer: ${err.message}`);
      }
    } else {
      setWholesaleCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    }
  };

  const deleteWholesaleCustomer = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        // Delete related history first
        await supabase.from('wholesale_daily_entries').delete().eq('wholesale_customer_id', id);
        const { error } = await supabase.from('wholesale_customers').delete().eq('id', id);
        if (error) throw error;
        setWholesaleCustomers((prev) => prev.filter((c) => c.id !== id));
      } catch (err: any) {
        console.error('Error deleting wholesale customer:', err);
        alert(`Failed to delete wholesale customer: ${err.message}`);
      }
    } else {
      setWholesaleCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const saveWholesaleDailyEntry = async (entry: Omit<WholesaleDailyEntry, 'id' | 'balanceForward'>) => {
    if (isSupabaseConfigured) {
      try {
        const cust = wholesaleCustomers.find(c => c.id === entry.wholesaleCustomerId);
        if (!cust) return;

        // Check for existing entry today
        const existingEntry = wholesaleDaily.find(d => d.wholesaleCustomerId === entry.wholesaleCustomerId && d.date === entry.date);

        let balanceForward = 0;
        let diffToBalance = 0;
        const newBalanceEffect = entry.totalBill - entry.amountPaid;

        if (existingEntry) {
          const oldBalanceEffect = existingEntry.totalBill - existingEntry.amountPaid;
          diffToBalance = newBalanceEffect - oldBalanceEffect;
          balanceForward = existingEntry.balanceForward + diffToBalance;
        } else {
          diffToBalance = newBalanceEffect;
          balanceForward = cust.balance + newBalanceEffect;
        }

        const newCustomerBalance = cust.balance + diffToBalance;

        if (existingEntry) {
          // Update existing entry
          const { error: updError } = await supabase
            .from('wholesale_daily_entries')
            .update({
              items: entry.items,
              total_bill: entry.totalBill,
              amount_paid: entry.amountPaid,
              balance_forward: balanceForward
            })
            .eq('id', existingEntry.id);
          
          if (updError) throw updError;

          // Update customer balance
          const { error: custError } = await supabase
            .from('wholesale_customers')
            .update({ balance: newCustomerBalance })
            .eq('id', cust.id);
          
          if (custError) throw custError;

          const updatedEntry: WholesaleDailyEntry = { ...existingEntry, ...entry, balanceForward };
          setWholesaleDaily(prev => prev.map(d => d.id === existingEntry.id ? updatedEntry : d));
          setWholesaleCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, balance: newCustomerBalance } : c));
          
        } else {
          // Insert new entry
          const { data, error } = await supabase
            .from('wholesale_daily_entries')
            .insert([{
              entry_date: entry.date,
              wholesale_customer_id: entry.wholesaleCustomerId,
              items: entry.items,
              total_bill: entry.totalBill,
              amount_paid: entry.amountPaid,
              balance_forward: balanceForward
            }])
            .select();
          
          if (error) throw error;

          // Update customer balance
          const { error: custError } = await supabase
            .from('wholesale_customers')
            .update({ balance: newCustomerBalance })
            .eq('id', cust.id);
          
          if (custError) throw custError;

          if (data && data[0]) {
            const newEntryObj: WholesaleDailyEntry = {
              id: data[0].id,
              date: data[0].entry_date,
              wholesaleCustomerId: data[0].wholesale_customer_id,
              items: typeof data[0].items === 'string' ? JSON.parse(data[0].items) : (data[0].items || []),
              totalBill: Number(data[0].total_bill),
              amountPaid: Number(data[0].amount_paid),
              balanceForward: Number(data[0].balance_forward),
            };
            setWholesaleDaily(prev => [...prev, newEntryObj]);
            setWholesaleCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, balance: newCustomerBalance } : c));
          }
        }
      } catch (err: any) {
        console.error('Error saving wholesale entry:', err);
        alert(`Failed to save daily entry: ${err.message}`);
      }
    } else {
      const cust = wholesaleCustomers.find(c => c.id === entry.wholesaleCustomerId);
      if (!cust) return;

      const existingEntry = wholesaleDaily.find(d => d.wholesaleCustomerId === entry.wholesaleCustomerId && d.date === entry.date);

      let balanceForward = 0;
      let diffToBalance = 0;
      const newBalanceEffect = entry.totalBill - entry.amountPaid;

      if (existingEntry) {
        const oldBalanceEffect = existingEntry.totalBill - existingEntry.amountPaid;
        diffToBalance = newBalanceEffect - oldBalanceEffect;
        balanceForward = existingEntry.balanceForward + diffToBalance;
      } else {
        diffToBalance = newBalanceEffect;
        balanceForward = cust.balance + newBalanceEffect;
      }

      const newCustomerBalance = cust.balance + diffToBalance;

      if (existingEntry) {
        const updatedEntry: WholesaleDailyEntry = { ...existingEntry, ...entry, balanceForward };
        setWholesaleDaily(prev => prev.map(d => d.id === existingEntry.id ? updatedEntry : d));
      } else {
        const newEntryObj: WholesaleDailyEntry = {
          ...entry,
          id: 'wde_' + Date.now(),
          balanceForward,
        };
        setWholesaleDaily(prev => [...prev, newEntryObj]);
      }
      setWholesaleCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, balance: newCustomerBalance } : c));
    }
  };

  return (
    <StoreContext.Provider
      value={{
        milkList,
        customers,
        dailyRecords,
        payments,
        isLoading,
        isSupabaseActive: isSupabaseConfigured,
        addMilk,
        editMilk,
        deleteMilk,
        addCustomer,
        editCustomer,
        deleteCustomer,
        saveDailyRecord,
        addPayment,
        updatePaymentStatus,
        wholesaleCustomers,
        wholesaleDaily,
        addWholesaleCustomer,
        editWholesaleCustomer,
        deleteWholesaleCustomer,
        saveWholesaleDailyEntry,
        clearTable,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
