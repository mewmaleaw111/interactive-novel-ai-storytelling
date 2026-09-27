'use client';

import { useEffect, useState } from 'react';
import {
    useParams,
    useRouter,
    useSearchParams,
} from 'next/navigation';

import '@/styles/reader.css';

type Branch = {
    sessionId: string;
    userId: string;
    userName: string;
    currentChapter: number;
    status: string;
    isPublic: boolean;
    generatedChapters: number;
    createdAt: string;
    updatedAt: string;
};

type BranchResponse = {
    success: boolean;
    story?: {
        id: string;
        title: string;
        coverImageUrl?: string;
        genre?: string;
        tone?: string;
        synopsis?: string;
    };
    branches?: Branch[];
    error?: string;
};

export default function BranchesPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const storyId = params.id as string;
    const from = searchParams.get('from');

    const [storyTitle, setStoryTitle] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [genre, setGenre] = useState('');
    const [tone, setTone] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleBack = () => {
        switch (from) {
            case 'home':
                router.push('/');
                break;

            case 'discover':
                router.push('/discover');
                break;

            case 'profile':
                router.push('/profile/branches');
                break;

            default:
                router.push(`/story/${storyId}`);
                break;
        }
    };

    useEffect(() => {
        if (!storyId) return;

        async function loadBranches() {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(
                    `/api/stories/${storyId}/branches`
                );

                const data: BranchResponse =
                    await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.error ||
                            'ไม่สามารถโหลดเส้นเรื่องได้'
                    );
                }

                setStoryTitle(
                    data.story?.title ?? ''
                );

                setCoverImageUrl(
                    data.story?.coverImageUrl ?? ''
                );

                setGenre(
                    data.story?.genre ?? ''
                );

                setTone(
                    data.story?.tone ?? ''
                );

                setSynopsis(
                    data.story?.synopsis ?? ''
                );

                setBranches(
                    data.branches ?? []
                );
            } catch (err) {
                console.error(
                    'Error loading branches:',
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : 'เกิดข้อผิดพลาดในการโหลดเส้นเรื่อง'
                );
            } finally {
                setLoading(false);
            }
        }

        loadBranches();
    }, [storyId]);

    const coverSrc =
        coverImageUrl || '/images/default-cover.png';

    return (
        <div className="reader-wrapper">

            {/* Header */}
            <header className="reader-header branches-reader-header">
                <div className="branches-header-inner">
                    <button
                        className="btn-back"
                        onClick={handleBack}
                    >
                        ‹ ย้อนกลับ
                    </button>

                    <div style={{ width: '90px' }} />
                </div>
            </header>

            <main className="reader-content">

                {/* Loading */}
                {loading && (
                    <div className="branches-loading">
                        <div className="branches-loading-content">

                            <div className="branches-loading-story">

                                <div className="branches-loading-cover" />

                                <div className="branches-loading-title" />

                                <div className="branches-loading-badges">
                                    <span />
                                    <span />
                                </div>

                                <div className="branches-loading-synopsis">
                                    <span />
                                    <span />
                                    <span />
                                </div>

                            </div>

                            <div className="story-meta-banner">

                                <div className="branches-loading-meta-badges">
                                    <span />
                                    <span />
                                </div>

                                <div className="branches-loading-meta-text">
                                    <span />
                                    <span />
                                </div>

                            </div>

                            <div className="branches-loading-list">

                                {[1, 2, 3].map((item) => (
                                    <article
                                        key={item}
                                        className="chapter-block"
                                    >
                                        <div className="chapter-heading">

                                            <div className="branches-loading-branch-label" />

                                            <div className="branches-loading-branch-title" />

                                        </div>

                                        <div className="branches-loading-branch-info">
                                            <span />
                                            <span />
                                            <span />
                                        </div>

                                        <div className="branches-loading-button" />
                                    </article>
                                ))}

                            </div>

                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="reader-empty">
                        <div className="reader-empty-state">

                            <div className="reader-empty-symbol reader-error-symbol">
                                !
                            </div>

                            <span className="reader-empty-eyebrow">
                                เกิดข้อผิดพลาด
                            </span>

                            <h2>
                                ไม่สามารถโหลดเส้นเรื่องได้
                            </h2>

                            <p>{error}</p>

                            <button
                                className="chapter-nav-button"
                                onClick={() =>
                                    window.location.reload()
                                }
                                style={{
                                    marginTop: '1.25rem',
                                }}
                            >
                                ลองอีกครั้ง
                            </button>

                        </div>
                    </div>
                )}

                {/* Story Content */}
                {!loading && !error && (
                    <>
                        {/* Story Cover + Information */}
                        <div
                            style={{
                                textAlign: 'center',
                                marginBottom: '3rem',
                            }}
                        >
                            <img
                                src={coverSrc}
                                alt={storyTitle}
                                style={{
                                    display: 'block',
                                    width: '180px',
                                    height: '260px',
                                    objectFit: 'cover',
                                    margin:
                                        '0 auto 1.5rem',
                                    borderRadius:
                                        'var(--radius-md)',
                                    boxShadow:
                                        'var(--shadow-md)',
                                    border:
                                        '1px solid var(--border-color)',
                                }}
                                onError={(event) => {
                                    const image =
                                        event.currentTarget;

                                    if (
                                        image.src.endsWith(
                                            '/images/default-cover.png'
                                        )
                                    ) {
                                        return;
                                    }

                                    image.src =
                                        '/images/default-cover.png';
                                }}
                            />

                            <h1
                                className="chapter-title"
                                style={{
                                    fontSize: '2rem',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                {storyTitle}
                            </h1>

                            {/* Genre + Tone */}
                            {(genre || tone) && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexWrap: 'wrap',
                                        marginBottom: '1.25rem',
                                    }}
                                >
                                    {genre && (
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor:
                                                    'var(--accent-light)',
                                                border:
                                                    '1px solid var(--border-color)',
                                                color:
                                                    'var(--accent-color)',
                                                padding:
                                                    '0.45rem 0.8rem',
                                                borderRadius:
                                                    'var(--radius-sm)',
                                            }}
                                        >
                                            {genre}
                                        </span>
                                    )}

                                    {tone && (
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor:
                                                    'var(--accent-light)',
                                                border:
                                                    '1px solid var(--border-color)',
                                                color:
                                                    'var(--accent-color)',
                                                padding:
                                                    '0.45rem 0.8rem',
                                                borderRadius:
                                                    'var(--radius-sm)',
                                            }}
                                        >
                                            {tone}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Synopsis */}
                            {synopsis && (
                                <p
                                    className="premise font-serif"
                                    style={{
                                        maxWidth: '650px',
                                        margin: '0 auto',
                                    }}
                                >
                                    "{synopsis}"
                                </p>
                            )}
                        </div>

                        {/* Story Meta */}
                        <div className="story-meta-banner">
                            <div className="story-badges">
                                <span className="badge">
                                    เส้นเรื่องทั้งหมด
                                </span>

                                <span className="badge">
                                    {branches.length} เส้นทาง
                                </span>
                            </div>

                            <p className="premise font-serif">
                                "แต่ละการตัดสินใจ
                                อาจนำเรื่องราวไปสู่จุดจบที่แตกต่างกัน"
                            </p>

                            <div className="chapter-counter">
                                {branches.length > 0
                                    ? 'เลือกเส้นเรื่องที่ต้องการอ่าน'
                                    : 'ยังไม่มีเส้นเรื่องที่สร้างขึ้น'}
                            </div>
                        </div>

                        {/* Empty */}
                        {branches.length === 0 && (
                            <div
                                className="reader-empty"
                                style={{
                                    minHeight: '260px',
                                    padding:
                                        '2.5rem 1rem 4rem',
                                }}
                            >
                                <div className="reader-empty-state">

                                    <div className="reader-empty-symbol">
                                        <span className="reader-empty-symbol-book">
                                            <span />
                                            <span />
                                        </span>
                                    </div>

                                    <span className="reader-empty-eyebrow">
                                        เส้นเรื่อง
                                    </span>

                                    <h2>
                                        ยังไม่มีเส้นเรื่องอื่น
                                    </h2>

                                    <p>
                                        เมื่อผู้เล่นสร้างเส้นทางของตัวเอง
                                        <br />
                                        เส้นเรื่องจะแสดงอยู่ที่นี่
                                    </p>

                                </div>
                            </div>
                        )}

                        {/* Branch List */}
                        {branches.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.25rem',
                                }}
                            >
                                {branches.map(
                                    (branch, index) => (
                                        <article
                                            key={branch.sessionId}
                                            className="chapter-block"
                                            style={{
                                                marginBottom: 0,
                                            }}
                                        >
                                            <div className="chapter-heading">
                                                <span>
                                                    เส้นเรื่องที่ {index + 1}
                                                </span>

                                                <h2 className="chapter-title">
                                                    {branch.userName}
                                                </h2>
                                            </div>

                                            <div
                                                style={{
                                                    color:
                                                        'var(--text-secondary)',
                                                    lineHeight: 1.8,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap:
                                                            '0.5rem 1.25rem',
                                                        marginBottom:
                                                            '1rem',
                                                        fontSize:
                                                            '0.85rem',
                                                    }}
                                                >
                                                    <span>
                                                        บทล่าสุด:{' '}
                                                        <strong>
                                                            {
                                                                branch.currentChapter
                                                            }
                                                        </strong>
                                                    </span>

                                                    <span>
                                                        สร้างเพิ่ม:{' '}
                                                        <strong>
                                                            {
                                                                branch.generatedChapters
                                                            }
                                                        </strong>{' '}
                                                        บท
                                                    </span>

                                                    <span>
                                                        {branch.status ===
                                                        'in_progress'
                                                            ? 'กำลังดำเนินเรื่อง'
                                                            : branch.status}
                                                    </span>
                                                </div>

                                                <button
                                                    className="btn-next-chapter"
                                                    style={{
                                                        padding:
                                                            '0.7rem 1.2rem',
                                                    }}
                                                    onClick={() =>
                                                        router.push(
                                                            `/story/${storyId}/branches/${branch.sessionId}${
                                                                from
                                                                    ? `?from=${from}`
                                                                    : ''
                                                            }`
                                                        )
                                                    }
                                                >
                                                    อ่านเส้นเรื่อง ›
                                                </button>
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}