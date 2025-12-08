import { useState } from 'react';
import {
  DarkOutlineTable,
  DarkOutlineTableBody,
  DarkOutlineTableCell,
  DarkOutlineTableHead,
  DarkOutlineTableHeader,
  DarkOutlineTableRow,
} from '../ui/dark-outline-table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import type { User } from '../../lib/api/types';
import { formatDate } from '../../lib/utils';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangeRole: (user: User) => void;
  onChangeStatus: (user: User) => void;
  loading?: boolean;
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  onChangeRole,
  onChangeStatus,
  loading = false,
}: UserTableProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'INSTRUCTOR':
        return 'default';
      case 'STUDENT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'BANNED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'INSTRUCTOR':
        return 'Giảng viên';
      case 'STUDENT':
        return 'Học viên';
      default:
        return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'BANNED':
        return 'Đã khóa';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có người dùng nào
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-300 dark:border-[#2D2D2D]">
      <DarkOutlineTable>
        <DarkOutlineTableHeader>
          <DarkOutlineTableRow>
            <DarkOutlineTableHead>Người dùng</DarkOutlineTableHead>
            <DarkOutlineTableHead>Email</DarkOutlineTableHead>
            <DarkOutlineTableHead>Vai trò</DarkOutlineTableHead>
            <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
            <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
            <DarkOutlineTableHead className="text-right">Thao tác</DarkOutlineTableHead>
          </DarkOutlineTableRow>
        </DarkOutlineTableHeader>
        <DarkOutlineTableBody>
          {users.map((user) => {
            const initials = user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <DarkOutlineTableRow key={user.id}>
                <DarkOutlineTableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || user.avatar} alt={user.fullName} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{user.userName}</p>
                    </div>
                  </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>{user.email}</DarkOutlineTableCell>
                <DarkOutlineTableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>
                  {formatDate(user.createdAt)}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2D2D2D]">
                      <DropdownMenuItem
                        onClick={() => onEdit(user)}
                        className="text-white hover:bg-[#2D2D2D] cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onChangeRole(user)}
                        className="text-white hover:bg-[#2D2D2D] cursor-pointer"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Đổi vai trò
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onChangeStatus(user)}
                        className="text-white hover:bg-[#2D2D2D] cursor-pointer"
                      >
                        {user.status === 'ACTIVE' ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Kích hoạt tài khoản
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="text-red-400 hover:bg-[#2D2D2D] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DarkOutlineTableCell>
              </DarkOutlineTableRow>
            );
          })}
        </DarkOutlineTableBody>
      </DarkOutlineTable>
    </div>
  );
}

