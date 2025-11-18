import express from 'express'
import transactionsController from '../controllers/transactions.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
    getTransactionsValidator,
    getTransactionByIdValidator,
} from '../validators/transactions.validator.js'

const router = express.Router()

// All transactions endpoints require authentication
router.use(authenticate)

/**
 * @route   GET /api/v1/transactions
 * @desc    Get payment transactions (current user or all if admin)
 * @access  Private
 * @query   page, limit, status, paymentGateway, startDate, endDate, userId
 */
router.get(
    '/',
    getTransactionsValidator,
    transactionsController.getTransactions
)

/**
 * @route   GET /api/v1/transactions/:transactionId
 * @desc    Get transaction detail by ID
 * @access  Private (Owner or Admin)
 */
router.get(
    '/:transactionId',
    getTransactionByIdValidator,
    transactionsController.getTransactionById
)

export default router
