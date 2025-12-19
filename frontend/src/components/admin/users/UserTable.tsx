import {
  DarkOutlineTable,
  DarkOutlineTableBody,
  DarkOutlineTableHead,
  DarkOutlineTableHeader,
  DarkOutlineTableRow,
} from '../../../ui/dark-outline-table';
import { Loader2 } from 'lucide-react';
import { UserRow } from './UserRow';
import type { User } from '../../../lib/api/types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangeRole: (user: User) => void;
  onChangeStatus: (user: User) => void;
  loading?: boolean;
  selectedRowId?: string | null;
  onRowSelect?: (userId: string | null) => void;
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  onChangeRole,
  onChangeStatus,
  loading = false,
  selectedRowId,
  onRowSelect,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Đang tải...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Không có người dùng nào</p>
      </div>
    );
  }

  return (
    <DarkOutlineTable>
      <DarkOutlineTableHeader>
        <DarkOutlineTableRow>
          <DarkOutlineTableHead className="text-left">Người dùng</DarkOutlineTableHead>
          <DarkOutlineTableHead className="text-left">Vai trò</DarkOutlineTableHead>
          <DarkOutlineTableHead className="text-left">Trạng thái</DarkOutlineTableHead>
          <DarkOutlineTableHead className="text-left">Ngày tạo</DarkOutlineTableHead>
          <DarkOutlineTableHead className="text-left">Cập nhật</DarkOutlineTableHead>
          <DarkOutlineTableHead className="text-right">Thao tác</DarkOutlineTableHead>
        </DarkOutlineTableRow>
      </DarkOutlineTableHeader>
      <DarkOutlineTableBody>
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onChangeRole={onChangeRole}
            onChangeStatus={onChangeStatus}
            isSelected={selectedRowId === user.id}
            onSelect={onRowSelect || (() => {})}
          />
        ))}
      </DarkOutlineTableBody>
    </DarkOutlineTable>
  );
}
