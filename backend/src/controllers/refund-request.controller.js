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
        const { orderId, reason, reasonType } = req.body

        const refundRequest = await refundRequestService.createRefundRequest(
            userId,
            orderId,
            reason,
            reasonType
        )

        return ApiResponse.success(
            res,
            refundRequest,
            refundRequest.status === 'REJECTED'
                ? 'Yêu cầu hoàn tiền đã bị từ chối tự động do tiến độ khóa học >= 50%'
                : refundRequest.refundType === 'FULL'
                  ? 'Yêu cầu hoàn tiền toàn bộ đã được gửi thành công'
                  : 'Yêu cầu hoàn tiền một phần đã được gửi thành công. Vui lòng chờ admin xem xét và gửi offer.',
            201
        )
    })

    /**
     * @route   GET /api/v1/refund-requests/eligibility/:orderId
     * @desc    Check refund eligibility for an order
     * @access  Private (Student)
     */
    getRefundEligibility = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const orderId = parseInt(req.params.orderId)

        if (isNaN(orderId)) {
            return ApiResponse.badRequest(res, 'Invalid order ID')
        }

        const eligibility = await refundRequestService.checkRefundEligibility(
            orderId,
            userId
        )

        return ApiResponse.success(
            res,
            eligibility,
            'Kiểm tra tính đáp ứng hoàn tiền thành công'
        )
    })

    /**
     * @route   POST /api/v1/refund-requests/:id/process
     * @desc    Process refund request (Admin only)
     * @access  Private (Admin)
     */
    processRefundRequest = asyncHandler(async (req, res) => {
        const adminUserId = req.user.id
        const requestId = parseInt(req.params.id)
        const { action, customAmount, notes } = req.body

        if (isNaN(requestId)) {
            return ApiResponse.badRequest(res, 'ID yêu cầu không hợp lệ')
        }

        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return ApiResponse.badRequest(
                res,
                'Hành động phải là APPROVE hoặc REJECT'
            )
        }

        const result = await refundRequestService.processRefundRequest(
            requestId,
            adminUserId,
            action,
            customAmount ? parseFloat(customAmount) : null,
            notes
        )

        return ApiResponse.success(
            res,
            result,
            action === 'APPROVE'
                ? 'Yêu cầu hoàn tiền đã được chấp nhận và xử lý thành công'
                : 'Yêu cầu hoàn tiền đã bị từ chối thành công'
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
            'Truy xuất yêu cầu hoàn tiền thành công'
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

        const refundRequest = await refundRequestService.getRefundRequestById(
            requestId,
            userId
        )

        return ApiResponse.success(
            res,
            refundRequest,
            'Truy xuất yêu cầu hoàn tiền thành công'
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
            'Truy xuất yêu cầu hoàn tiền thành công'
        )
    })

    /**
     * @route   GET /api/v1/admin/refund-requests
     * @desc    Get all refund requests (Admin only)
     * @access  Private (Admin)
     */
    getAllRefundRequests = asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            status,
            search,
            sort,
            startDate,
            endDate,
            minAmount,
            maxAmount,
        } = req.query

        const filters = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status: status || undefined,
            search: search || undefined,
            sort: sort || 'oldest',
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        }

        const result = await refundRequestService.getAllRefundRequests(filters)

        return ApiResponse.paginated(
            res,
            result.refundRequests,
            result.pagination,
            'Truy xuất yêu cầu hoàn tiền thành công'
        )
    })

    /**
     * @route   DELETE /api/v1/refund-requests/:id/cancel
     * @desc    Cancel refund request (Student only)
     * @access  Private (Student)
     */
    cancelRefundRequest = asyncHandler(async (req, res) => {
        const userId = req.user.id
        const requestId = parseInt(req.params.id)

        if (isNaN(requestId)) {
            return ApiResponse.badRequest(res, 'Invalid refund request ID')
        }

        const refundRequest = await refundRequestService.cancelRefundRequest(
            requestId,
            userId
        )

        return ApiResponse.success(
            res,
            refundRequest,
            'Yêu cầu hoàn tiền đã bị hủy thành công'
        )
    })
}

export default new RefundRequestController()
