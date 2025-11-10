import paymentService from '../services/payment.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class TransactionsController {
    getTransactions = asyncHandler(async (req, res) => {
        const result = await paymentService.getTransactions(req.user, req.query)
        return ApiResponse.success(
            res,
            result,
            'Transactions fetched successfully'
        )
    })

    getTransactionById = asyncHandler(async (req, res) => {
        const { transactionId } = req.params
        const result = await paymentService.getTransactionById(
            req.user,
            parseInt(transactionId, 10)
        )
        return ApiResponse.success(
            res,
            result,
            'Transaction detail fetched successfully'
        )
    })
}

export default new TransactionsController()


