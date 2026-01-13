import { useState } from "react";
import { trpc } from "../lib/trpc";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import "../styles/Users.css";

interface UsersProps {
  user?: any;
}

// Normalize user object to handle both MySQL and Firebase formats
interface NormalizedUser {
  id: number | string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export function Users({ user }: UsersProps) {
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const usersQuery = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      setSuccessMessage("ロールを更新しました");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
      usersQuery.refetch();
    },
    onError: (error) => {
      setErrorMessage(error.message || "ロール更新に失敗しました");
      setSuccessMessage("");
    },
  });

  const handleRoleChange = (userId: number | string, newRole: "user" | "admin", email?: string) => {
    const numericId = typeof userId === "string" ? parseInt(userId, 10) : userId;
    setErrorMessage("");
    setSuccessMessage("");
    updateRoleMutation.mutate({ userId: numericId, role: newRole, email });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  if (usersQuery.isLoading) {
    return (
      <div className="users-container">
        <LoadingSpinner message="ユーザー情報を読み込み中..." />
      </div>
    );
  }

  if (usersQuery.isError) {
    return (
      <div className="users-container">
        <ErrorMessage
          message="ユーザー情報の取得に失敗しました。"
          onRetry={() => usersQuery.refetch()}
        />
      </div>
    );
  }

  // Normalize users to handle both MySQL and Firebase formats
  let users: NormalizedUser[] = (usersQuery.data || []).map((u: any) => ({
    id: u.id,
    name: u.name || null,
    email: u.email || null,
    role: u.role || "user",
    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
  }));

  // フィルタリング
  if (roleFilter !== "all") {
    users = users.filter((u) => u.role === roleFilter);
  }

  // ソート
  users = [...users].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof typeof a];
    let bVal: any = b[sortColumn as keyof typeof b];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1>ユーザー管理</h1>
          <p>システムユーザーの一覧と管理</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message-inline">
          ✕ {errorMessage}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-group">
          <label>ロールフィルタ：</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">すべて</option>
            <option value="admin">管理者</option>
            <option value="user">ユーザー</option>
          </select>
        </div>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")} className="sortable">
                ID {sortColumn === "id" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("name")} className="sortable">
                名前 {sortColumn === "name" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("email")} className="sortable">
                メール {sortColumn === "email" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("role")} className="sortable">
                ロール {sortColumn === "role" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("createdAt")} className="sortable">
                作成日時 {sortColumn === "createdAt" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name || "-"}</td>
                <td>{user.email || "-"}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as "user" | "admin", user.email || undefined)
                    }
                    className="role-select"
                    disabled={updateRoleMutation.isPending}
                  >
                    <option value="user">ユーザー</option>
                    <option value="admin">管理者</option>
                  </select>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <p>条件に合致するユーザーがありません</p>
        </div>
      )}
    </div>
  );
}
