// Central export for all API modules
export { default as apiClient } from './client';
export * from './types';
export { authApi } from './auth';
export { coursesApi } from './courses';
export { dashboardApi } from './dashboard';
export { usersApi } from './users';
export type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  GetUsersParams,
  UpdateUserRequest,
  ChangeRoleRequest,
  ChangeStatusRequest,
} from './users';

