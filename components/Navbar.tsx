'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from '@clerk/nextjs';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    sessionClaims,
  } = useAuth();

  const metadata = sessionClaims?.metadata as
    | {
      role?: string;
    }
    | undefined;

  const isAdmin = metadata?.role === 'admin';

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const handleCreateStory = () => {
    sessionStorage.removeItem(
      'GonnaTales_create_story_draft'
    );

    setIsMobileMenuOpen(false);

    router.push('/story/create');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">

        {/* ==========================================
            LOGO
        ========================================== */}

        <Link
          href="/"
          className="navbar-brand"
          onClick={closeMobileMenu}
        >
          <span className="logo-mark" aria-hidden="true">
            <img
              src="/images/logo.png"
              alt=""
            />
          </span>

          <span className="logo-text">
            GonnaTales
          </span>
        </Link>


        {/* ==========================================
            DESKTOP NAVIGATION
        ========================================== */}

        <nav className="navbar-links">

          {/* หน้าหลัก */}

          <Link
            href="/"
            className={`nav-link ${isActive('/') ? 'active' : ''
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H11v16H6.5A2.5 2.5 0 0 0 4 22.5v-16Z" />
              <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
              <path d="M12 4v16" />
            </svg>

            <span>หน้าหลัก</span>
          </Link>


          {/* สำรวจ */}

          <Link
            href="/discover"
            className={`nav-link ${isActive('/discover') ? 'active' : ''
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
              />

              <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
            </svg>

            <span>สำรวจ</span>
          </Link>


          {/* นิยายของฉัน */}

          <Link
            href="/my-stories"
            className={`nav-link ${isActive('/my-stories') ? 'active' : ''
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" />
              <path d="M5 6h11" />
              <path d="M9 9h6" />
              <path d="M9 12h6" />
            </svg>

            <span>นิยายของฉัน</span>
          </Link>


          {/* ผู้ดูแลระบบ */}

          {isSignedIn && isAdmin && (
            <Link
              href="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 3 20 6v5.5c0 4.5-3 7.8-8 9.5-5-1.7-8-5-8-9.5V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>

              <span>ผู้ดูแลระบบ</span>
            </Link>
          )}

        </nav>


        {/* ==========================================
            ACTIONS
        ========================================== */}

        <div className="navbar-actions">

          {/* สร้างนิยาย */}

          <button
            type="button"
            className="btn-create-story"
            onClick={handleCreateStory}
          >
            <span
              className="create-story-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </span>

            <span>เรื่องใหม่</span>
          </button>


          {/* ========================================
              AUTHENTICATION
          ======================================== */}

          {isLoaded && (
            <>
              {!isSignedIn ? (

                <div className="navbar-auth-buttons">

                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="btn-create-story btn-signup"
                    >
                      สมัครสมาชิก
                    </button>
                  </SignUpButton>

                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="btn-create-story btn-login"
                    >
                      เข้าสู่ระบบ
                    </button>
                  </SignInButton>

                </div>

              ) : (

                <>
                  {/* โปรไฟล์ Desktop */}

                  <Link
                    href="/profile"
                    className={`nav-link navbar-profile-link ${isActive('/profile')
                      ? 'active'
                      : ''
                      }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="3.5"
                      />

                      <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
                    </svg>

                    <span>โปรไฟล์</span>
                  </Link>

                  {/* รูปโปรไฟล์ */}

                  <div className="navbar-user-button">
                    <UserButton />
                  </div>
                </>

              )}
            </>
          )}


          {/* ========================================
              MOBILE MENU BUTTON
          ======================================== */}

          <button
            type="button"
            className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''
              }`}
            onClick={() =>
              setIsMobileMenuOpen(
                (prev) => !prev
              )
            }
            aria-label={
              isMobileMenuOpen
                ? 'ปิดเมนู'
                : 'เปิดเมนู'
            }
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>

      </div>


      {/* ==========================================
          MOBILE MENU
      ========================================== */}

      <div
        className={`mobile-menu ${isMobileMenuOpen
          ? 'mobile-menu-open'
          : ''
          }`}
      >

        <nav className="mobile-menu-links">

          {/* หน้าหลัก */}

          <Link
            href="/"
            className={`mobile-nav-link ${isActive('/') ? 'active' : ''
              }`}
            onClick={closeMobileMenu}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H11v16H6.5A2.5 2.5 0 0 0 4 22.5v-16Z" />
              <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
              <path d="M12 4v16" />
            </svg>

            <span>หน้าหลัก</span>
          </Link>


          {/* สำรวจ */}

          <Link
            href="/discover"
            className={`mobile-nav-link ${isActive('/discover')
              ? 'active'
              : ''
              }`}
            onClick={closeMobileMenu}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
              />

              <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
            </svg>

            <span>สำรวจ</span>
          </Link>


          {/* นิยายของฉัน */}

          <Link
            href="/my-stories"
            className={`mobile-nav-link ${isActive('/my-stories')
              ? 'active'
              : ''
              }`}
            onClick={closeMobileMenu}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" />
              <path d="M5 6h11" />
              <path d="M9 9h6" />
              <path d="M9 12h6" />
            </svg>

            <span>นิยายของฉัน</span>
          </Link>


          {/* ผู้ดูแลระบบ */}

          {isSignedIn && isAdmin && (
            <Link
              href="/admin"
              className={`mobile-nav-link ${isActive('/admin')
                ? 'active'
                : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 3 20 6v5.5c0 4.5-3 7.8-8 9.5-5-1.7-8-5-8-9.5V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>

              <span>ผู้ดูแลระบบ</span>
            </Link>
          )}


          {/* โปรไฟล์ */}

          {isSignedIn && (
            <Link
              href="/profile"
              className={`mobile-nav-link ${isActive('/profile')
                ? 'active'
                : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="3.5"
                />

                <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
              </svg>

              <span>โปรไฟล์</span>
            </Link>
          )}

        </nav>


        {/* ========================================
            MOBILE AUTH
        ======================================== */}

        {!isSignedIn && isLoaded && (
          <div className="mobile-auth-buttons">

            <SignUpButton mode="modal">
              <button
                type="button"
                className="mobile-auth-button mobile-signup"
                onClick={closeMobileMenu}
              >
                สมัครสมาชิก
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button
                type="button"
                className="mobile-auth-button mobile-login"
                onClick={closeMobileMenu}
              >
                เข้าสู่ระบบ
              </button>
            </SignInButton>

          </div>
        )}

      </div>

    </header>
  );
};