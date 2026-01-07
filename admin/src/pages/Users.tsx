import { useState } from "react";
import { trpc } from "../lib/trpc";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import "../styles/Users.css";

export function Users() {
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const usersQuery = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
    },
  });

  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
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

  let users = usersQuery.data || [];

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
          <p>ユーザーの一覧と権限管理</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>権限フィルタ：</label>
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
              <th onClick={() => handleSort("email")} className="sortable">
                メールアドレス {sortColumn === "email" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("name")} className="sortable">
                名前 {sortColumn === "name" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("role")} className="sortable">
                権限 {sortColumn === "role" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("createdAt")} className="sortable">
                登録日時 {sortColumn === "createdAt" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email || "-"}</td>
                <td>{user.name || "-"}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as "user" | "admin")
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
