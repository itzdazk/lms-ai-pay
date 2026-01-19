// backend/src/controllers/system-config.controller.js
import systemConfigService from '../services/system-config.service.js'
import ApiResponse from '../utils/response.util.js'
import { asyncHandler } from '../middlewares/error.middleware.js'

class SystemConfigController {
    /**
     * @route   GET /api/v1/admin/system-config
     * @desc    Get all system settings (Admin only)
     * @access  Private (Admin)
     */
    getConfig = asyncHandler(async (req, res) => {
        const settings = await systemConfigService.getSettings()

        return ApiResponse.success(
            res,
            settings,
            'Lấy cài đặt hệ thống thành công'
        )
    })

    /**
     * @route   PUT /api/v1/admin/system-config
     * @desc    Update system settings (Admin only)
     * @access  Private (Admin)
     */
    updateConfig = asyncHandler(async (req, res) => {
        const { settings } = req.body
        const userId = req.user?.id

        console.log('📥 Controller received:', {
            bodyKeys: Object.keys(req.body || {}),
            settingsKeys: settings ? Object.keys(settings) : 'no settings',
            userId,
        })

        if (!settings || typeof settings !== 'object') {
            console.error('❌ Invalid settings:', settings)
            return ApiResponse.error(
                res,
                'Dữ liệu cài đặt không hợp lệ',
                400
            )
        }

        const updated = await systemConfigService.updateSettings(
            settings,
            userId
        )

        console.log('✅ Settings updated successfully')

        return ApiResponse.success(
            res,
            updated,
            'Cập nhật cài đặt hệ thống thành công'
        )
    })

    /**
     * @route   GET /api/v1/system-config/public
     * @desc    Get public system settings (Contact info, system name, logo)
     * @access  Public
     */
    getPublicConfig = asyncHandler(async (req, res) => {
        const publicSettings = await systemConfigService.getPublicSettings()

        return ApiResponse.success(
            res,
            publicSettings,
            'Lấy cài đặt công khai thành công'
        )
    })

    /**
     * @route   GET /api/v1/system-config/registration-enabled
     * @desc    Check if user registration is enabled
     * @access  Public
     */
    checkRegistrationEnabled = asyncHandler(async (req, res) => {
        const enabled = await systemConfigService.isRegistrationEnabled()

        return ApiResponse.success(
            res,
            { enabled },
            'Kiểm tra trạng thái đăng ký thành công'
        )
    })
}

export default new SystemConfigController()
