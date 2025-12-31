// backend/src/controllers/refund-request.controller.js
import refundRequestService from '../services/refund-request.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class RefundRequestController {
    /**
     * @route   POST /api/v1/refund-requests
     * @desc    Create a refund request
     * @access  Private (Student)
     */
    createRefundRequest = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { orderId, reason } = req.body

        const refundRequest = await refundRequestService.createRefundRequest(
            userId,
            orderId,
            reason
        )

        return ApiResponse.success(
            res,
            refundRequest,
            refundRequest.status === 'REJECTED'
                ? 'Yêu cầu hoàn tiền đã bị từ chối tự động do tiến độ khóa học >= 50%'
                : 'Yêu cầu hoàn tiền đã được gửi thành công',
            201
        )
    })

    /**
     * @route   GET /api/v1/refund-requests
     * @desc    Get student's refund requests
     * @access  Private (Student)
     */
    getStudentRefundRequests = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const { page, limit, status } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status: status || undefined,
        }

        const result = await refundRequestService.getStudentRefundRequests(
            userId,
            filters
        )

        return ApiResponse.paginated(
            res,
            result.refundRequests,
            result.pagination,
            'Refund requests retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/refund-requests/:id
     * @desc    Get refund request by ID
     * @access  Private (Student, Admin)
     */
    getRefundRequestById = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const requestId = parseInt(req.params.id)

        const refundRequest =
            await refundRequestService.getRefundRequestById(requestId, userId)

        return ApiResponse.success(
            res,
            refundRequest,
            'Refund request retrieved successfully'
        )
    })

    /**
     * @route   GET /api/v1/refund-requests/order/:orderId
     * @desc    Get refund request for an order
     * @access  Private (Student)
     */
    getRefundRequestByOrderId = asyncHandler(async (req, res) => {
        const orderId = parseInt(req.params.orderId)

        const refundRequest =
            await refundRequestService.getRefundRequestByOrderId(orderId)

        return ApiResponse.success(
            res,
            refundRequest,
            'Refund request retrieved successfully'
        )
    })
}

export default new RefundRequestController()

