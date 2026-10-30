'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminConfirmModal from '@/components/admin/AdminConfirmModal';

type Story = {
    id: string;
    title: string;
    synopsis: string | null;
    genre: string | null;
    tone: string | null;
    total_chapters: number;
    is_published: boolean;
    is_banned: boolean;
    created_at: string | null;
    updated_at: string | null;
    user_id: string | null;
};

export default function AdminStoriesPage() {
    const [stories, setStories] = useState<Story[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [actionStoryId, setActionStoryId] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        type: 'ban' | 'unban' | 'delete';
        story: Story;
    } | null>(null);

    useEffect(() => {
        async function loadStories() {
            try {
                setLoading(true);
                setError(false);

                const response = await fetch('/api/admin/stories');

                if (!response.ok) {
                    throw new Error('Failed to load stories');
                }

                const data = await response.json();

                setStories(data.stories ?? []);
            } catch (error) {
                console.error('Admin Stories Error:', error);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        loadStories();
    }, []);

    const filteredStories = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return stories;
        }

        return stories.filter((story) =>
            story.title.toLowerCase().includes(keyword)
        );
    }, [stories, search]);

    const clearSearch = () => {
        setSearch('');
    };

    const toggleBanStory = async (story: Story) => {
        const action = story.is_banned
            ? 'ยกเลิกแบน'
            : 'แบน';

        try {
            setActionStoryId(story.id);

            const response = await fetch(
                `/api/admin/stories/${story.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        isBanned: !story.is_banned,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || `ไม่สามารถ${action}นิยายได้`
                );
            }

            setStories((currentStories) =>
                currentStories.map((item) =>
                    item.id === story.id
                        ? {
                              ...item,
                              is_banned: !item.is_banned,
                          }
                        : item
                )
            );

            setConfirmModal(null);
        } catch (error) {
            console.error(
                'Toggle Story Ban Error:',
                error
            );

            window.alert(
                error instanceof Error
                    ? error.message
                    : `ไม่สามารถ${action}นิยายได้`
            );
        } finally {
            setActionStoryId(null);
        }
    };

    const deleteStory = async (story: Story) => {
        try {
            setActionStoryId(story.id);

            const response = await fetch(
                `/api/admin/stories/${story.id}`,
                {
                    method: 'DELETE',
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'ไม่สามารถลบนิยายได้'
                );
            }

            setStories((currentStories) =>
                currentStories.filter(
                    (item) => item.id !== story.id
                )
            );

            setConfirmModal(null);
        } catch (error) {
            console.error(
                'Delete Story Error:',
                error
            );

            window.alert(
                error instanceof Error
                    ? error.message
                    : 'ไม่สามารถลบนิยายได้'
            );
        } finally {
            setActionStoryId(null);
        }
    };

    if (loading) {
        return (
            <main className="admin-page admin-stories">
                <div className="admin-container">
                    <div className="admin-page-header">
                        <div>
                            <div className="admin-skeleton-back" />

                            <div className="admin-skeleton-label" />

                            <div className="admin-skeleton-title" />

                            <div className="admin-skeleton-description" />
                        </div>
                    </div>

                    <div className="admin-skeleton-search" />

                    <div className="admin-skeleton-summary" />

                    <section className="admin-table-card admin-stories-skeleton-table">
                        <div className="admin-skeleton-table-head">
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="admin-skeleton-table-row">
                            <div className="admin-skeleton-story">
                                <span />
                                <span />
                            </div>
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="admin-skeleton-table-row">
                            <div className="admin-skeleton-story">
                                <span />
                                <span />
                            </div>
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="admin-skeleton-table-row">
                            <div className="admin-skeleton-story">
                                <span />
                                <span />
                            </div>
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="admin-skeleton-table-row">
                            <div className="admin-skeleton-story">
                                <span />
                                <span />
                            </div>
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="admin-page admin-stories">
                <div className="admin-container">
                    <div className="admin-error">
                        <h1>ไม่สามารถโหลดข้อมูลนิยายได้</h1>

                        <p>
                            เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูล
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="admin-page admin-stories">
            <div className="admin-container">
                {/* Header */}
                <div className="admin-page-header admin-stories-header">
                    <Link
                        href="/admin"
                        className="admin-back-link"
                    >
                        ‹ กลับไปแดชบอร์ด
                    </Link>

                    <span className="admin-label">
                        GONNATALES ADMIN
                    </span>

                    <h1>
                        จัดการนิยาย
                    </h1>

                    <p className="admin-description">
                        ตรวจสอบและจัดการนิยายทั้งหมดในระบบ
                    </p>
                </div>

                {/* Search */}
                <div className="admin-search-form">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="ค้นหาชื่อเรื่อง..."
                        className="admin-search-input"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="admin-clear-button"
                            aria-label="ล้างการค้นหา"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Result */}
                <div className="admin-story-search-summary">
                    <span>
                        {search.trim()
                            ? `พบ ${filteredStories.length} เรื่องจาก "${search.trim()}"`
                            : `พบทั้งหมด ${filteredStories.length} เรื่อง`}
                    </span>
                </div>

                {/* Stories */}
                <section className="admin-table-card">
                    {filteredStories.length > 0 ? (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>นิยาย</th>
                                        <th>ประเภท</th>
                                        <th>ตอน</th>
                                        <th>สถานะ</th>
                                        <th>วันที่สร้าง</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStories.map(
                                        (story) => (
                                            <tr key={story.id}>
                                                <td>
                                                    <div className="admin-story-title">
                                                        <strong>
                                                            {story.title}
                                                        </strong>

                                                        <span>
                                                            {story.synopsis
                                                                ? story
                                                                      .synopsis
                                                                      .length >
                                                                  90
                                                                    ? `${story.synopsis.slice(
                                                                          0,
                                                                          90
                                                                      )}...`
                                                                    : story.synopsis
                                                                : 'ไม่มีเรื่องย่อ'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {story.genre ||
                                                        '-'}
                                                </td>

                                                <td>
                                                    {story.total_chapters}
                                                </td>

                                                <td>
                                                    {story.is_banned ? (
                                                        <span className="admin-status banned">
                                                            ถูกแบน
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={
                                                                story.is_published
                                                                    ? 'admin-status published'
                                                                    : 'admin-status draft'
                                                            }
                                                        >
                                                            {story.is_published
                                                                ? 'เผยแพร่'
                                                                : 'ส่วนตัว'}
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        story.created_at
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="admin-story-actions">
                                                        <Link
                                                            href={`/admin/stories/${story.id}`}
                                                            className="admin-view-button"
                                                        >
                                                            ดูรายละเอียด
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            className={
                                                                story.is_banned
                                                                    ? 'admin-action-button admin-unban-button'
                                                                    : 'admin-action-button admin-ban-button'
                                                            }
                                                            onClick={() =>
                                                                setConfirmModal({
                                                                    type: story.is_banned
                                                                        ? 'unban'
                                                                        : 'ban',
                                                                    story,
                                                                })
                                                            }
                                                            disabled={
                                                                actionStoryId ===
                                                                story.id
                                                            }
                                                        >
                                                            {actionStoryId ===
                                                            story.id
                                                                ? 'กำลังดำเนินการ...'
                                                                : story.is_banned
                                                                  ? 'ยกเลิกแบน'
                                                                  : 'แบน'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admin-action-button admin-delete-button"
                                                            onClick={() =>
                                                                setConfirmModal({
                                                                    type: 'delete',
                                                                    story,
                                                                })
                                                            }
                                                            disabled={
                                                                actionStoryId ===
                                                                story.id
                                                            }
                                                        >
                                                            {actionStoryId ===
                                                            story.id
                                                                ? 'กำลังดำเนินการ...'
                                                                : 'ลบ'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="admin-empty">
                            <h2>ไม่พบรายการนิยาย</h2>

                            <p>
                                {search.trim()
                                    ? `ไม่พบเรื่องที่ตรงกับ "${search.trim()}"`
                                    : 'ยังไม่มีนิยายในระบบ'}
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <AdminConfirmModal
                open={confirmModal !== null}
                variant={confirmModal?.type ?? 'ban'}
                title={
                    confirmModal?.type === 'delete'
                        ? 'ยืนยันการลบนิยาย'
                        : confirmModal?.type === 'unban'
                          ? 'ยืนยันการยกเลิกแบน'
                          : 'ยืนยันการแบน'
                }
                description={
                    confirmModal?.type === 'delete'
                        ? `ต้องการลบนิยาย "${confirmModal.story.title}" หรือไม่?\n\nการลบจะไม่สามารถกู้คืนได้`
                        : confirmModal?.type === 'unban'
                          ? `ต้องการยกเลิกแบน "${confirmModal.story.title}" หรือไม่?`
                          : `ต้องการแบน "${confirmModal?.story.title}" หรือไม่?`
                }
                confirmText={
                    confirmModal?.type === 'delete'
                        ? 'ยืนยันการลบ'
                        : confirmModal?.type === 'unban'
                          ? 'ยืนยันยกเลิกแบน'
                          : 'ยืนยันการแบน'
                }
                loading={actionStoryId !== null}
                onCancel={() => {
                    if (actionStoryId === null) {
                        setConfirmModal(null);
                    }
                }}
                onConfirm={() => {
                    if (!confirmModal) {
                        return;
                    }

                    if (confirmModal.type === 'delete') {
                        deleteStory(confirmModal.story);
                    } else {
                        toggleBanStory(confirmModal.story);
                    }
                }}
            />
        </main>
    );
}

function formatDate(date: string | null) {
    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}