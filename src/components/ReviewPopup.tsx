import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Typography,
  Box
} from '@mui/material';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useStore, type Customer, type WholesaleCustomer } from '../context/StoreContext';

interface ReviewPopupProps {
  customerId: string;
  customerName: string;
}

const ReviewPopup: React.FC<ReviewPopupProps> = ({ customerId, customerName }) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if the user has already seen or submitted the review popup
    const hasReviewed = localStorage.getItem(`has_reviewed_${customerId}`);
    if (!hasReviewed) {
      // Small delay before showing popup
      const timer = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [customerId]);

  const handleSubmit = async () => {
    if (!rating || rating === 0) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('customer_reviews').insert([{
          customer_id: customerId,
          customer_name: customerName,
          rating: rating,
          comment: comment
        }]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to submit review', err);
      }
    }
    
    // Mark as reviewed in local storage regardless of success (to prevent annoyance)
    localStorage.setItem(`has_reviewed_${customerId}`, 'true');
    setSubmitted(true);
    setTimeout(() => setOpen(false), 2000);
  };

  const handleClose = () => {
    localStorage.setItem(`has_reviewed_${customerId}`, 'true');
    setOpen(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="primary">Thank you for your review!</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Rate Your Experience</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          How satisfied are you with our milk delivery service?
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            size="large"
          />
        </Box>
        <TextField
          label="Leave a comment (optional)"
          multiline
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          variant="outlined"
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">Skip</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!rating || rating === 0}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewPopup;
