'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/profile.css';

interface ProfileStats {
  createdStories: number;
  playedStories: number;
  favoriteStories: number;
}

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [stats, setStats] = useState<ProfileStats>({
    createdStories: 0,
    playedStories: 0,
    favoriteStories: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();

        if (data.success) {
          setDisplayName(data.profile.displayName);
          setEditName(data.profile.displayName);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('โหลดโปรไฟล์ไม่สำเร็จ:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </main>
    );
  }

  if (!isSignedIn || !user) {
    router.push('/');
    return null;
  }

  const saveDisplayName = async () => {
    const name = editName.trim();

    if (name.length < 2 || name.length > 50) {
      setMessage('นามสมมุติต้องมีความยาว 2-50 ตัวอักษร');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: name,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage(data.message || 'บันทึกไม่สำเร็จ');
        return;
      }

      setDisplayName(data.profile.displayName);
      setEditName(data.profile.displayName);
      setIsEditing(false);
      setMessage('');
    } catch (error) {
      console.error(error);
      setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const closeEditModal = () => {
    if (saving) return;

    setIsEditing(false);
    setEditName(displayName);
    setMessage('');
  };

  return (
    <main className="profile-page">
      <div className="profile-container">

        <button
          type="button"
          className="profile-back"
          onClick={() => router.push('/')}
        >
          ‹ กลับสู่หน้าหลัก
        </button>

        {/* Profile Card */}
        <section className="profile-card">
          <div className="profile-avatar-wrapper">
            <img
              src={user.imageUrl}
              alt="รูปโปรไฟล์"
              className="profile-avatar"
            />
          </div>

          <div className="profile-info">
            <span className="profile-label">
              นามสมมุติ
            </span>

            <h1>
              {loading ? 'กำลังโหลด...' : displayName}
            </h1>

            <p>
              ชื่อที่ใช้แสดงใน GonnaTales
            </p>
          </div>

          <button
            type="button"
            className="profile-edit-button"
            onClick={() => {
              setEditName(displayName);
              setIsEditing(true);
              setMessage('');
            }}
          >
            แก้ไขชื่อ
          </button>
        </section>

        {/* Edit Name Popup */}
        {isEditing && (
          <div
            className="profile-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeEditModal();
              }
            }}
          >
            <section className="profile-modal">
              <div className="profile-modal-header">
                <div>
                  <span className="profile-modal-eyebrow">
                    PROFILE
                  </span>

                  <h2>
                    เปลี่ยนนามสมมุติ
                  </h2>
                </div>

                <button
                  type="button"
                  className="profile-modal-close"
                  onClick={closeEditModal}
                  disabled={saving}
                  aria-label="ปิด"
                >
                  ×
                </button>
              </div>

              <div className="profile-modal-body">
                <label
                  htmlFor="display-name"
                  className="profile-modal-label"
                >
                  นามสมมุติ
                </label>

                <input
                  id="display-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveDisplayName();
                    }

                    if (e.key === 'Escape') {
                      closeEditModal();
                    }
                  }}
                  maxLength={50}
                  autoFocus
                  disabled={saving}
                  placeholder="เช่น NightWalker"
                  className="profile-modal-input"
                />

                <div className="profile-modal-footer-text">
                  <span>
                    ชื่อนี้จะแสดงให้ผู้เล่นคนอื่นเห็นในเส้นเรื่องของคุณ
                  </span>

                  <span>
                    {editName.length}/50
                  </span>
                </div>

                {message && (
                  <p className="profile-message">
                    {message}
                  </p>
                )}
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-modal-cancel"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  className="profile-modal-save"
                  onClick={saveDisplayName}
                  disabled={saving}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Statistics */}
        <section className="profile-section">
          <h2>สถิติของฉัน</h2>

          <div className="profile-stats">
            <div className="profile-stat-card">
              <div className="profile-stat-number">
                {loading ? '—' : stats.createdStories}
              </div>

              <div className="profile-stat-label">
                เรื่องที่สร้าง
              </div>
            </div>

            <div className="profile-stat-card">
              <div className="profile-stat-number">
                {loading ? '—' : stats.playedStories}
              </div>

              <div className="profile-stat-label">
                เส้นเรื่องที่เล่น
              </div>
            </div>

            <div className="profile-stat-card">
              <div className="profile-stat-number">
                {loading ? '—' : stats.favoriteStories}
              </div>

              <div className="profile-stat-label">
                เรื่องโปรด
              </div>
            </div>
          </div>
        </section>

        {/* My Activities */}
        <section className="profile-section profile-activity-section">
          <h2>กิจกรรมของฉัน</h2>

          <div className="profile-activities">

            <button
              type="button"
              className="profile-activity-item"
              onClick={() => router.push('/my-stories')}
            >
              <div className="profile-activity-content">
                <h3>เรื่องที่สร้าง</h3>

                <p>
                  ดูเรื่องราวที่คุณสร้างไว้
                </p>
              </div>

              <span className="profile-activity-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              className="profile-activity-item"
              onClick={() => router.push('/favorites')}
            >
              <div className="profile-activity-content">
                <h3>เรื่องโปรด</h3>

                <p>
                  ดูเรื่องราวที่คุณบันทึกไว้
                </p>
              </div>

              <span className="profile-activity-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              className="profile-activity-item"
              onClick={() => router.push('/profile/branches')}
            >
              <div className="profile-activity-content">
                <h3>เส้นเรื่องของฉัน</h3>

                <p>
                  ดูเส้นเรื่องที่คุณเคยเล่น
                </p>
              </div>

              <span className="profile-activity-arrow">
                →
              </span>
            </button>

          </div>
        </section>

      </div>
    </main>
  );
}