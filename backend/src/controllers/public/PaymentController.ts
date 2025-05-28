import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { paymentProcessSchema, paymentRefundSchema } from '../../schemas/payment';
import { AppDataSource } from '../../config/data-source';
import { Booking, BookingStatus } from '../../entities/Booking';
import { Payment } from '../../entities/Payment';

const bookingRepo = AppDataSource.getRepository(Booking);
const paymentRepo = AppDataSource.getRepository(Payment);

export const PaymentController = {
  /**
   * Process payment for a booking
   */
  async processPayment(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const validatedData = paymentProcessSchema.parse(req.body);
      const { bookingId, amount, paymentMethod, currency, metadata } = validatedData;

      // TODO: DB integration - Process payment
      // This should:
      // 1. Verify booking exists and belongs to user
      // 2. Verify booking amount matches payment amount
      // 3. Process payment through payment gateway
      // 4. Create payment record
      // 5. Update booking status
      const mockPayment = {
        id: 'payment-1',
        bookingId,
        amount,
        currency,
        method: paymentMethod,
        status: 'completed',
        transactionId: 'txn_123456',
        metadata,
        createdAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: mockPayment
      });
    } catch (err: unknown) {
      console.error('Error processing payment:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Refund a payment
   */
  async refundPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const validatedData = paymentRefundSchema.parse(req.body);
      const { reason, amount, metadata } = validatedData;

      // TODO: DB integration - Process refund
      // This should:
      // 1. Verify payment exists and belongs to user
      // 2. Check if refund is allowed (time window, status)
      // 3. Process refund through payment gateway
      // 4. Create refund record
      // 5. Update payment and booking status
      const mockRefund = {
        id: 'refund-1',
        paymentId,
        amount: amount || 50, // Use full amount if not specified
        reason,
        status: 'completed',
        transactionId: 'ref_123456',
        metadata,
        createdAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: mockRefund
      });
    } catch (err: unknown) {
      console.error('Error processing refund:', err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Process payment for a booking (new endpoint)
   */
  async processPaymentApi(req: Request, res: Response) {
    try {
      const { bookingId, paymentMethod, amount } = req.body;
      if (!bookingId || !paymentMethod || !amount) {
        return res.status(400).json({ success: false, message: 'Missing required fields', error: null });
      }
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      // TODO: Fetch booking, validate ownership, check amount
      // TODO: Simulate payment processing
      // TODO: Update booking status to PAID and confirm booking
      return res.status(200).json({
        success: true,
        message: 'Payment processed and booking confirmed',
        data: { bookingId, paymentMethod, amount, status: 'PAID' }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Payment processing failed', error: err.message });
    }
  },

  /**
   * Refund a payment (new endpoint)
   */
  async refundPaymentApi(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: null });
      }
      const { paymentId, amount, reason } = req.body;
      if (!paymentId || !amount || !reason) {
        return res.status(400).json({ success: false, message: 'Missing required fields', error: null });
      }
      // TODO: Validate payment, process refund in DB
      return res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: { paymentId, amount, reason, status: 'REFUNDED' }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to refund payment', error: err.message });
    }
  }
};