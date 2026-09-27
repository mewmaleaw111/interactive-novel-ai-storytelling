'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import '@/styles/profile-branches.css';

interface Branch {
    sessionId: string;
    userId: string;
    userName: string;

    storyId: string;
    title: string;
    synopsis: string;

    genre: string;
    tone: string;

    totalChapters: number;
    currentChapter: number;

    status: string;

    coverImageUrl: string;

    createdAt: string;
    updatedAt: string;
}

export default function ProfileBranchesPage() {
    const {
        isLoaded,
        isSignedIn,
    } = useUser();

    const router = useRouter();

    const [branches, setBranches] =
        useState<Branch[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            router.push('/');
            return;
        }

        const loadBranches = async () => {
            try {
                setLoading(true);
                setError('');

                const response =
                    await fetch(
                        '/api/profile/branches'
                    );

                const data =
                    await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.error ||
                        'ไม่สามารถโหลดเส้นเรื่องได้'
                    );
                }

                setBranches(
                    data.branches ?? []
                );
            } catch (error) {
                console.error(
                    'โหลดเส้นเรื่องไม่สำเร็จ:',
                    error
                );

                setError(
                    'ไม่สามารถโหลดเส้นเรื่องได้ กรุณาลองใหม่'
                );
            } finally {
                setLoading(false);
            }
        };

        loadBranches();
    }, [
        isLoaded,
        isSignedIn,
        router,
    ]);

    return (
        <main className="profile-branches-page">
            <div className="profile-branches-container">

                {/* Back */}
                <button
                    type="button"
                    className="profile-branches-back"
                    onClick={() =>
                        router.push('/profile')
                    }
                >
                    ‹ กลับสู่โปรไฟล์
                </button>

                {/* Header */}
                <header className="profile-branches-header">
                    <span className="profile-branches-eyebrow">
                        MY BRANCHES
                    </span>

                    <h1>
                        เส้นเรื่องของฉัน
                    </h1>

                    <p>
                        ดูเส้นทางเรื่องราวที่คุณเคยเล่น
                    </p>
                </header>

                {/* Loading Skeleton */}
                {loading && (
                    <section className="profile-branches-list">

                        {[1, 2, 3].map((item) => (
                            <article
                                key={item}
                                className="profile-branch-card branches-skeleton-card"
                            >
                                <div className="profile-branch-content">

                                    <div className="branches-skeleton-cover" />

                                    <div className="profile-branch-main">

                                        <div className="branches-skeleton-meta" />

                                        <div className="branches-skeleton-branch-title" />

                                        <div className="branches-skeleton-synopsis">
                                            <span />
                                            <span />
                                            <span />
                                        </div>

                                        <div className="branches-skeleton-player" />

                                        <div className="branches-skeleton-progress">

                                            <div className="branches-skeleton-progress-info" />

                                            <div className="branches-skeleton-progress-bar" />

                                        </div>

                                    </div>

                                    <div className="profile-branch-actions">

                                        <div className="branches-skeleton-button" />

                                        <div className="branches-skeleton-button" />

                                    </div>

                                </div>
                            </article>
                        ))}

                    </section>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="profile-branches-state">
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            ลองใหม่
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading &&
                    !error &&
                    branches.length === 0 && (
                        <div className="profile-branches-empty">

                            <h2>
                                ยังไม่มีเส้นเรื่อง
                            </h2>

                            <p>
                                เมื่อคุณเริ่มเล่นเรื่องราว
                                เส้นเรื่องของคุณจะแสดงที่นี่
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push('/discover')
                                }
                            >
                                ไปสำรวจเรื่องราว
                            </button>

                        </div>
                    )}

                {/* Branch List */}
                {!loading &&
                    !error &&
                    branches.length > 0 && (
                        <section className="profile-branches-list">

                            {branches.map((branch) => {
                                const progress =
                                    Math.min(
                                        (
                                            branch.currentChapter /
                                            Math.max(
                                                branch.totalChapters,
                                                1
                                            )
                                        ) * 100,
                                        100
                                    );

                                return (
                                    <article
                                        key={branch.sessionId}
                                        className="profile-branch-card"
                                    >
                                        <div className="profile-branch-content">

                                            <div className="profile-branch-cover">
                                                <img
                                                    src={
                                                        branch.coverImageUrl ||
                                                        '/images/default-cover.png'
                                                    }
                                                    alt={`ปกเรื่อง ${branch.title}`}
                                                    onError={(event) => {
                                                        const image =
                                                            event.currentTarget;

                                                        if (
                                                            !image.src.endsWith(
                                                                '/images/default-cover.png'
                                                            )
                                                        ) {
                                                            image.src =
                                                                '/images/default-cover.png';
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div className="profile-branch-main">

                                                <div className="profile-branch-meta">

                                                    {branch.genre && (
                                                        <span>
                                                            {branch.genre}
                                                        </span>
                                                    )}

                                                    {branch.tone && (
                                                        <span>
                                                            {branch.tone}
                                                        </span>
                                                    )}

                                                </div>

                                                <h2>
                                                    {branch.title}
                                                </h2>

                                                <p className="profile-branch-synopsis">
                                                    {branch.synopsis ||
                                                        'ไม่มีเรื่องย่อ'}
                                                </p>

                                                <div className="profile-branch-player">
                                                    เส้นเรื่องของ{' '}
                                                    <strong>
                                                        "{branch.userName}"
                                                    </strong>
                                                </div>

                                                <div className="profile-branch-progress">

                                                    <div className="profile-branch-progress-info">

                                                        <span>
                                                            บทที่{' '}
                                                            {
                                                                branch.currentChapter
                                                            }{' '}
                                                            /{' '}
                                                            {
                                                                branch.totalChapters
                                                            }
                                                        </span>

                                                        <span>
                                                            {Math.round(
                                                                progress
                                                            )}
                                                            %
                                                        </span>

                                                    </div>

                                                    <div className="profile-branch-progress-bar">

                                                        <div
                                                            className="profile-branch-progress-fill"
                                                            style={{
                                                                width: `${progress}%`,
                                                            }}
                                                        />

                                                    </div>

                                                </div>

                                            </div>

                                            <div className="profile-branch-actions">

                                                {/* เล่นต่อ */}
                                                <button
                                                    type="button"
                                                    className="profile-branch-continue"
                                                    onClick={() =>
                                                        router.push(
                                                            `/story/${branch.storyId}`
                                                        )
                                                    }
                                                >
                                                    เล่นต่อ
                                                </button>

                                                {/* ดูเส้นเรื่อง */}
                                                <button
                                                    type="button"
                                                    className="profile-branch-view"
                                                    onClick={() =>
                                                        router.push(
                                                            `/story/${branch.storyId}/branches?from=profile`
                                                        )
                                                    }
                                                >
                                                    ดูเส้นเรื่อง
                                                </button>

                                            </div>

                                        </div>
                                    </article>
                                );
                            })}

                        </section>
                    )}

            </div>
        </main>
    );
}