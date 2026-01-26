import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase-auth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import "../styles/Users.css";

interface UsersProps {
  user?: any;
}

interface NormalizedUser {
  id: string;
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
  const [users, setUsers] = useState<NormalizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Firestore からユーザー情報を読み込み
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        
        // Check if db is initialized
        if (!db) {
          console.error("Firestore is not initialized. Check Firebase configuration.");
          setIsError(true);
          setIsLoading(false);
          return;
        }
        
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || null,
              email: data.email || null,
              role: data.role || "user",
              createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
              updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            } as NormalizedUser;
          });
        setUsers(usersData);
      } catch (error) {
        console.error("Error loading users:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="users-container">
        <LoadingSpinner message="ユーザー情報を読み込み中..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="users-container">
        <ErrorMessage
          message="ユーザー情報の取得に失敗しました。"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // フィルタリング
  let filteredUsers = users;
  if (roleFilter !== "all") {
    filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
  }

  // ソート
  filteredUsers = [...filteredUsers].sort((a, b) => {
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
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name || "-"}</td>
                <td>{user.email || "-"}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === "admin" ? "管理者" : "ユーザー"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>条件に合致するユーザーがありません</p>
        </div>
      )}
    </div>
  );
}
