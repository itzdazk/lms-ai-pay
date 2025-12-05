import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
      case 'admin':
        return 'destructive';
      case 'instructor':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'instructor':
        return 'Giảng viên';
      case 'student':
        return 'Học viên';
      default:
        return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
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

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có người dùng nào
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[#2D2D2D]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#1F1F1F] hover:bg-[#1F1F1F]">
            <TableHead className="text-white">Người dùng</TableHead>
            <TableHead className="text-white">Email</TableHead>
            <TableHead className="text-white">Vai trò</TableHead>
            <TableHead className="text-white">Trạng thái</TableHead>
            <TableHead className="text-white">Ngày tạo</TableHead>
            <TableHead className="text-white text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const initials = user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow
                key={user.id}
                className="border-[#2D2D2D] hover:bg-[#1F1F1F]"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{user.fullName}</p>
                      <p className="text-sm text-gray-400">@{user.userName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-400">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
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
                        {user.status === 'active' ? (
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

