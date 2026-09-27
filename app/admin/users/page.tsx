'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminConfirmModal from '@/components/admin/AdminConfirmModal';

type User = {
  userId: string;
  displayName: string;
  createdAt: string | null;
  updatedAt: string | null;
  storyCount: number;
  sessionCount: number;
  isBanned: boolean;
};

function formatDate(date: string | null) {
  if (!date) {
    return '-';
  }

  return new Date(date).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitial(name: string) {
  const value = name.trim();

  if (!value) {
    return 'ผ';
  }

  return value.charAt(0).toUpperCase();
}

function AdminUsersLoading() {
  return (
    <div className="admin-users-loading-state">
      <section className="admin-users-overview admin-users-overview-skeleton">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="admin-users-overview-card admin-skeleton-card"
          >
            <div className="admin-skeleton-line admin-skeleton-label" />
            <div className="admin-skeleton-line admin-skeleton-number" />
            <div className="admin-skeleton-line admin-skeleton-description" />
          </div>
        ))}
      </section>

      <section className="admin-management-card admin-users-card">
        <div className="admin-users-toolbar">
          <div className="admin-users-section-title">
            <div>
              <div className="admin-skeleton-line admin-skeleton-title" />
              <div className="admin-skeleton-line admin-skeleton-subtitle" />
            </div>
          </div>

          <div className="admin-users-search-skeleton">
            <div className="admin-skeleton-search-icon" />
            <div className="admin-skeleton-search-text" />
          </div>
        </div>

        <div className="admin-users-table-wrapper admin-users-loading-table">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th className="admin-users-col-user">
                  ผู้ใช้
                </th>

                <th>
                  นิยาย
                </th>

                <th>
                  Sessions
                </th>

                <th>
                  วันที่สมัคร
                </th>

                <th>
                  สถานะ
                </th>

                <th className="admin-users-col-action">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-skeleton-avatar" />

                      <div className="admin-user-info admin-user-skeleton-info">
                        <div className="admin-skeleton-line admin-skeleton-user-name" />
                        <div className="admin-skeleton-line admin-skeleton-user-id" />
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="admin-skeleton-line admin-skeleton-stat" />
                  </td>

                  <td>
                    <div className="admin-skeleton-line admin-skeleton-stat" />
                  </td>

                  <td>
                    <div className="admin-skeleton-line admin-skeleton-date" />
                  </td>

                  <td>
                    <div className="admin-skeleton-status" />
                  </td>

                  <td>
                    <div className="admin-story-actions admin-skeleton-actions">
                      <div className="admin-skeleton-action admin-skeleton-action-view" />
                      <div className="admin-skeleton-action admin-skeleton-action-ban" />
                      <div className="admin-skeleton-action admin-skeleton-action-delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-users-mobile-list admin-users-loading-mobile">
          {[1, 2, 3].map((item) => (
            <article
              key={item}
              className="admin-user-mobile-card"
            >
              <div className="admin-user-mobile-top">
                <div className="admin-user-cell">
                  <div className="admin-skeleton-avatar" />

                  <div className="admin-user-info admin-user-skeleton-info">
                    <div className="admin-skeleton-line admin-skeleton-user-name" />
                    <div className="admin-skeleton-line admin-skeleton-user-id" />
                  </div>
                </div>

                <div className="admin-skeleton-mobile-arrow" />
              </div>

              <div className="admin-user-mobile-status">
                <div className="admin-skeleton-status" />
              </div>

              <div className="admin-user-mobile-stats">
                <div>
                  <div className="admin-skeleton-line admin-skeleton-mobile-label" />
                  <div className="admin-skeleton-line admin-skeleton-mobile-value" />
                </div>

                <div>
                  <div className="admin-skeleton-line admin-skeleton-mobile-label" />
                  <div className="admin-skeleton-line admin-skeleton-mobile-value" />
                </div>

                <div>
                  <div className="admin-skeleton-line admin-skeleton-mobile-label" />
                  <div className="admin-skeleton-line admin-skeleton-mobile-date" />
                </div>
              </div>

              <div className="admin-user-mobile-actions">
                <div className="admin-skeleton-mobile-action admin-skeleton-mobile-detail" />
                <div className="admin-skeleton-mobile-action admin-skeleton-mobile-ban" />
                <div className="admin-skeleton-mobile-action admin-skeleton-mobile-delete" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    type: 'ban' | 'unban' | 'delete';
    user: User;
  } | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch('/api/admin/users');

        if (!response.ok) {
          throw new Error('Failed to load users');
        }

        const data = await response.json();

        setUsers(data.users ?? []);
      } catch (error) {
        console.error('Admin Users Error:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.displayName.toLowerCase().includes(keyword) ||
        user.userId.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const totalStories = useMemo(() => {
    return users.reduce(
      (total, user) => total + user.storyCount,
      0
    );
  }, [users]);

  const totalSessions = useMemo(() => {
    return users.reduce(
      (total, user) => total + user.sessionCount,
      0
    );
  }, [users]);

  const clearSearch = () => {
    setSearch('');
  };

  async function toggleBan(user: User) {
    const action = user.isBanned ? 'unban' : 'ban';

    try {
      setActionUserId(user.userId);

      const response = await fetch(
        `/api/admin/users/${user.userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้'
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.userId === user.userId
            ? {
                ...currentUser,
                isBanned: !currentUser.isBanned,
              }
            : currentUser
        )
      );

      setConfirmModal(null);
    } catch (error) {
      console.error('Toggle User Ban Error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้'
      );
    } finally {
      setActionUserId(null);
    }
  }

  async function deleteUser(user: User) {
    try {
      setActionUserId(user.userId);

      const response = await fetch(
        `/api/admin/users/${user.userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'ไม่สามารถลบผู้ใช้ได้'
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            currentUser.userId !== user.userId
        )
      );

      setConfirmModal(null);

      alert('ลบผู้ใช้เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Delete User Error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการลบผู้ใช้'
      );
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <main className="admin-page admin-users-page">
      <div className="admin-container">
        <header className="admin-page-header admin-users-header">
          <Link href="/admin" className="admin-back-link">
            ‹ กลับหน้า Admin
          </Link>

          <span className="admin-label">
            GONNATALES ADMIN
          </span>

          <h1>
            ผู้ใช้
          </h1>

          <p className="admin-description">
            จัดการและตรวจสอบข้อมูลผู้ใช้งานภายใน GonnaTales
          </p>
        </header>

        {!loading && !error && (
          <section className="admin-users-overview">
            <div className="admin-users-overview-card">
              <div className="admin-users-overview-label">
                ผู้ใช้ทั้งหมด
              </div>

              <div className="admin-users-overview-value">
                {users.length}
              </div>

              <div className="admin-users-overview-description">
                บัญชีที่มีข้อมูลในระบบ
              </div>
            </div>

            <div className="admin-users-overview-card">
              <div className="admin-users-overview-label">
                นิยายทั้งหมด
              </div>

              <div className="admin-users-overview-value">
                {totalStories}
              </div>

              <div className="admin-users-overview-description">
                นิยายที่ผู้ใช้สร้าง
              </div>
            </div>

            <div className="admin-users-overview-card">
              <div className="admin-users-overview-label">
                Game Sessions
              </div>

              <div className="admin-users-overview-value">
                {totalSessions}
              </div>

              <div className="admin-users-overview-description">
                เส้นเรื่องที่ถูกสร้าง
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <AdminUsersLoading />
        ) : (
          <section className="admin-management-card admin-users-card">
            <div className="admin-users-toolbar">
              <div className="admin-users-section-title">
                <div>
                  <h2>รายชื่อผู้ใช้</h2>

                  <p>
                    {search
                      ? `พบ ${filteredUsers.length} จาก ${users.length} ผู้ใช้`
                      : `${users.length} ผู้ใช้ในระบบ`}
                  </p>
                </div>
              </div>

              <div className="admin-search-wrapper admin-users-search">
                <svg
                  className="admin-search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="ค้นหาผู้ใช้..."
                  className="admin-search-input"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="admin-search-clear"
                    aria-label="ล้างการค้นหา"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {!error && filteredUsers.length === 0 && (
              <div className="admin-users-message">
                <div className="admin-users-empty-mark">
                  {search ? '0' : '—'}
                </div>

                <div>
                  <h3>
                    {search ? 'ไม่พบผู้ใช้' : 'ยังไม่มีผู้ใช้'}
                  </h3>

                  <p>
                    {search
                      ? 'ลองค้นหาด้วยชื่อหรือ User ID อื่น'
                      : 'ยังไม่มีข้อมูลผู้ใช้ในระบบ'}
                  </p>

                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="admin-users-retry"
                    >
                      ล้างการค้นหา
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="admin-users-message">
                <div className="admin-users-message-icon">
                  !
                </div>

                <div>
                  <h3>ไม่สามารถโหลดข้อมูลผู้ใช้ได้</h3>

                  <p>
                    เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ
                  </p>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="admin-users-retry"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              </div>
            )}

            {!error && filteredUsers.length > 0 && (
              <>
                <div className="admin-users-table-wrapper">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th className="admin-users-col-user">
                          ผู้ใช้
                        </th>

                        <th>
                          นิยาย
                        </th>

                        <th>
                          Sessions
                        </th>

                        <th>
                          วันที่สมัคร
                        </th>

                        <th>
                          สถานะ
                        </th>

                        <th className="admin-users-col-action">
                          จัดการ
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.userId}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar">
                                {getInitial(user.displayName)}
                              </div>

                              <div className="admin-user-info">
                                <strong>
                                  {user.displayName}
                                </strong>

                                <span title={user.userId}>
                                  {user.userId}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="admin-user-stat">
                              {user.storyCount}
                            </span>
                          </td>

                          <td>
                            <span className="admin-user-stat">
                              {user.sessionCount}
                            </span>
                          </td>

                          <td>
                            <span className="admin-user-date">
                              {formatDate(user.createdAt)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                user.isBanned
                                  ? 'admin-user-status is-banned'
                                  : 'admin-user-status is-active'
                              }
                            >
                              {user.isBanned
                                ? 'ถูกแบน'
                                : 'ใช้งานปกติ'}
                            </span>
                          </td>

                          <td className="admin-users-action-cell">
                            <div className="admin-story-actions">
                              <Link
                                href={`/admin/users/${user.userId}`}
                                className="admin-view-button"
                              >
                                ดูรายละเอียด
                              </Link>

                              <button
                                type="button"
                                className={
                                  user.isBanned
                                    ? 'admin-action-button admin-unban-button'
                                    : 'admin-action-button admin-ban-button'
                                }
                                onClick={() =>
                                  setConfirmModal({
                                    type: user.isBanned
                                      ? 'unban'
                                      : 'ban',
                                    user,
                                  })
                                }
                                disabled={
                                  actionUserId === user.userId
                                }
                              >
                                {actionUserId === user.userId
                                  ? 'กำลังดำเนินการ...'
                                  : user.isBanned
                                    ? 'ยกเลิกแบน'
                                    : 'แบน'}
                              </button>

                              <button
                                type="button"
                                className="admin-action-button admin-delete-button"
                                onClick={() =>
                                  setConfirmModal({
                                    type: 'delete',
                                    user,
                                  })
                                }
                                disabled={
                                  actionUserId === user.userId
                                }
                              >
                                {actionUserId === user.userId
                                  ? 'กำลังดำเนินการ...'
                                  : 'ลบ'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-users-mobile-list">
                  {filteredUsers.map((user) => {
                    const isActionLoading =
                      actionUserId === user.userId;

                    return (
                      <article
                        key={user.userId}
                        className="admin-user-mobile-card"
                      >
                        <div className="admin-user-mobile-top">
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">
                              {getInitial(user.displayName)}
                            </div>

                            <div className="admin-user-info">
                              <strong>
                                {user.displayName}
                              </strong>

                              <span title={user.userId}>
                                {user.userId}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/admin/users/${user.userId}`}
                            className="admin-user-mobile-link"
                            aria-label={`ดูรายละเอียด ${user.displayName}`}
                          >
                            →
                          </Link>
                        </div>

                        <div className="admin-user-mobile-status">
                          <span
                            className={
                              user.isBanned
                                ? 'admin-user-status is-banned'
                                : 'admin-user-status is-active'
                            }
                          >
                            {user.isBanned
                              ? 'ถูกแบน'
                              : 'ใช้งานปกติ'}
                          </span>
                        </div>

                        <div className="admin-user-mobile-stats">
                          <div>
                            <span>นิยาย</span>
                            <strong>{user.storyCount}</strong>
                          </div>

                          <div>
                            <span>Sessions</span>
                            <strong>{user.sessionCount}</strong>
                          </div>

                          <div>
                            <span>สมัครเมื่อ</span>
                            <strong>
                              {formatDate(user.createdAt)}
                            </strong>
                          </div>
                        </div>

                        <div
                          className={`admin-user-mobile-actions ${
                            isActionLoading
                              ? 'is-loading'
                              : ''
                          }`}
                        >
                          <Link
                            href={`/admin/users/${user.userId}`}
                            className="admin-view-button"
                          >
                            ดูรายละเอียด
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                type: user.isBanned
                                  ? 'unban'
                                  : 'ban',
                                user,
                              })
                            }
                            disabled={isActionLoading}
                            className={`admin-action-button ${
                              user.isBanned
                                ? 'admin-unban-button'
                                : 'admin-ban-button'
                            } ${
                              isActionLoading
                                ? 'is-loading'
                                : ''
                            }`}
                          >
                            {isActionLoading
                              ? 'กำลังดำเนินการ...'
                              : user.isBanned
                                ? 'ยกเลิกแบน'
                                : 'แบน'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                type: 'delete',
                                user,
                              })
                            }
                            disabled={isActionLoading}
                            className={`admin-action-button admin-delete-button ${
                              isActionLoading
                                ? 'is-loading'
                                : ''
                            }`}
                          >
                            {isActionLoading
                              ? 'กำลังดำเนินการ...'
                              : 'ลบ'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      <AdminConfirmModal
        open={confirmModal !== null}
        variant={confirmModal?.type ?? 'ban'}
        title={
          confirmModal?.type === 'delete'
            ? 'ยืนยันการลบผู้ใช้'
            : confirmModal?.type === 'unban'
              ? 'ยืนยันการยกเลิกแบน'
              : 'ยืนยันการแบนผู้ใช้'
        }
        description={
          confirmModal?.type === 'delete'
            ? `ต้องการลบผู้ใช้ "${confirmModal.user.displayName}" หรือไม่?\n\nข้อมูลนิยายและข้อมูลที่เกี่ยวข้องกับผู้ใช้นี้จะถูกลบออกจากระบบ และไม่สามารถกู้คืนได้`
            : confirmModal?.type === 'unban'
              ? `ต้องการยกเลิกการแบน "${confirmModal.user.displayName}" หรือไม่?`
              : `ต้องการแบน "${confirmModal?.user.displayName}" หรือไม่?`
        }
        confirmText={
          confirmModal?.type === 'delete'
            ? 'ยืนยันการลบ'
            : confirmModal?.type === 'unban'
              ? 'ยืนยันยกเลิกแบน'
              : 'ยืนยันการแบน'
        }
        loading={actionUserId !== null}
        onCancel={() => {
          if (actionUserId === null) {
            setConfirmModal(null);
          }
        }}
        onConfirm={() => {
          if (!confirmModal) {
            return;
          }

          if (confirmModal.type === 'delete') {
            deleteUser(confirmModal.user);
            return;
          }

          toggleBan(confirmModal.user);
        }}
      />
    </main>
  );
}