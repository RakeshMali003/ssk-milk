import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Rating,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO } from 'date-fns';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

interface Review {
  id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchReviews();
  }, [filterRating]);

  const fetchReviews = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('customer_reviews').select('*').order('created_at', { ascending: false });
        if (filterRating !== 'all') {
          query = query.eq('rating', filterRating);
        }

        const { data, error } = await query;
        if (error) throw error;
        setReviews(data as Review[]);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('customer_reviews').delete().eq('id', id);
          if (error) throw error;
          setReviews(reviews.filter(r => r.id !== id));
        } catch (error) {
          console.error("Error deleting review:", error);
        }
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all reviews? This action cannot be undone.')) {
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('customer_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          setReviews([]);
        } catch (error) {
          console.error("Error clearing reviews:", error);
        }
      }
    }
  };

  return (
    <Box sx={{ py: 2, px: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Customer Reviews
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Manage feedback from your customers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Filter by Rating</InputLabel>
            <Select
              value={filterRating}
              label="Filter by Rating"
              onChange={(e) => setFilterRating(e.target.value as number | 'all')}
            >
              <MenuItem value="all">All Ratings</MenuItem>
              <MenuItem value={5}>5 Stars</MenuItem>
              <MenuItem value={4}>4 Stars</MenuItem>
              <MenuItem value={3}>3 Stars</MenuItem>
              <MenuItem value={2}>2 Stars</MenuItem>
              <MenuItem value={1}>1 Star</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleClearAll}
            disabled={reviews.length === 0}
            sx={{ borderRadius: 2, fontWeight: 700, height: '100%', py: 1.5 }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Comment</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No reviews found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((rev) => (
                <TableRow key={rev.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{rev.customer_name || 'Anonymous'}</TableCell>
                  <TableCell>
                    <Rating value={rev.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, color: 'text.secondary', fontStyle: rev.comment ? 'normal' : 'italic' }}>
                    {rev.comment || 'No comment left'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{format(parseISO(rev.created_at), 'dd MMM yyyy')}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{format(parseISO(rev.created_at), 'hh:mm a')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                     <IconButton color="error" onClick={() => handleDelete(rev.id)}>
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

      {/* Mobile Cards View */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <Typography sx={{ color: 'text.secondary' }}>No reviews found for this filter.</Typography>
          </Box>
        ) : (
          reviews.map((rev) => (
            <Paper key={rev.id} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{rev.customer_name || 'Anonymous'}</Typography>
                <IconButton color="error" size="small" onClick={() => handleDelete(rev.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Rating value={rev.rating} readOnly size="small" sx={{ mb: 1.5 }} />
              <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: 2, mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: rev.comment ? 'normal' : 'italic' }}>
                  {rev.comment || 'No comment left'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {format(parseISO(rev.created_at), 'dd MMM yyyy, hh:mm a')}
                </Typography>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Reviews;
