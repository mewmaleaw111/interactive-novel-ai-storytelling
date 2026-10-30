'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminConfirmModal from './AdminConfirmModal';

type AdminSessionActionsProps = {
  storyId: string;
  sessionId: string;
  isBanned: boolean;
};

export default function AdminSessionActions({
  storyId,
  sessionId,
  isBanned,
}: AdminSessionActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState<
    'ban' | 'unban' | 'delete' | null
  >(null);

  async function handleBanToggle() {
    const action = isBanned ? 'ปลดแบน' : 'แบน';

    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/stories/${storyId}/sessions/${sessionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isBanned: !isBanned,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `ไม่สามารถ${action}เส้นเรื่องได้`
        );
      }

      setConfirmModal(null);
      router.refresh();
    } catch (error) {
      console.error('Session Ban Toggle Error:', error);

      alert(
        error instanceof Error
          ? error.message
          : `ไม่สามารถ${action}เส้นเรื่องได้`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/stories/${storyId}/sessions/${sessionId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'ไม่สามารถลบเส้นเรื่องได้'
        );
      }

      setConfirmModal(null);
      router.refresh();
    } catch (error) {
      console.error('Session Delete Error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถลบเส้นเรื่องได้'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="admin-session-actions">
        <button
          type="button"
          onClick={() =>
            setConfirmModal(isBanned ? 'unban' : 'ban')
          }
          disabled={loading}
          className={
            isBanned
              ? 'admin-session-unban-button'
              : 'admin-session-ban-button'
          }
        >
          {isBanned ? 'ยกเลิกแบน' : 'แบน'}
        </button>

        <button
          type="button"
          onClick={() => setConfirmModal('delete')}
          disabled={loading}
          className="admin-session-delete-button"
        >
          ลบ
        </button>
      </div>

      <AdminConfirmModal
        open={confirmModal !== null}
        variant={confirmModal ?? 'ban'}
        title={
          confirmModal === 'delete'
            ? 'ยืนยันการลบเส้นเรื่อง'
            : confirmModal === 'unban'
              ? 'ยืนยันการปลดแบน'
              : 'ยืนยันการแบนเส้นเรื่อง'
        }
        description={
          confirmModal === 'delete'
            ? 'ต้องการลบเส้นเรื่องนี้ใช่หรือไม่?\n\nข้อมูลเส้นเรื่องและบทที่สร้างไว้จะถูกลบ และไม่สามารถกู้คืนได้'
            : confirmModal === 'unban'
              ? 'ต้องการปลดแบนเส้นเรื่องนี้ใช่หรือไม่?'
              : 'ต้องการแบนเส้นเรื่องนี้ใช่หรือไม่?'
        }
        confirmText={
          confirmModal === 'delete'
            ? 'ยืนยันการลบ'
            : confirmModal === 'unban'
              ? 'ยืนยันปลดแบน'
              : 'ยืนยันการแบน'
        }
        loading={loading}
        onCancel={() => {
          if (!loading) {
            setConfirmModal(null);
          }
        }}
        onConfirm={() => {
          if (confirmModal === 'delete') {
            handleDelete();
          } else {
            handleBanToggle();
          }
        }}
      />
    </>
  );
}