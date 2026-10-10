'use client';

import React, { useEffect, useState } from 'react';
import '../../styles/guide.css';

const sections = [
  {
    id: 'getting-started',
    title: 'เริ่มต้นใช้งาน',
  },
  {
    id: 'home',
    title: 'หน้าหลัก',
  },
  {
    id: 'discover',
    title: 'สำรวจนิยาย',
  },
  {
    id: 'create-story',
    title: 'สร้างนิยายใหม่',
  },
  {
    id: 'reading',
    title: 'การอ่านนิยาย',
  },
  {
    id: 'my-stories',
    title: 'นิยายของฉัน',
  },
  {
    id: 'favorites',
    title: 'นิยายโปรด',
  },
  {
    id: 'faq',
    title: 'คำถามที่พบบ่อย',
  },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections
        .map((section) => document.getElementById(section.id))
        .filter(Boolean) as HTMLElement[];

      let currentSection = sections[0].id;

      for (const section of sectionElements) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= 180) {
          currentSection = section.id;
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <main className="guide-page">
      <aside className="guide-sidebar">
        <div className="guide-sidebar-title">
          คู่มือการใช้งาน
        </div>

        <nav className="guide-navigation">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`guide-nav-item ${activeSection === section.id ? 'active' : ''
                }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      <section className="guide-content">
        <header className="guide-header">
          <span className="guide-eyebrow">
            GonnaTales GUIDE
          </span>

          <h1>
            คู่มือการใช้งาน GonnaTales
          </h1>

          <p>
            คู่มือสำหรับการใช้งาน GonnaTales
            ตั้งแต่การเริ่มต้นใช้งาน การสร้างนิยาย
            ไปจนถึงการอ่านและจัดการนิยายของคุณ
          </p>
        </header>

        <section
          id="getting-started"
          className="guide-section"
        >
          <span className="guide-section-number">
            01
          </span>

          <h2>เริ่มต้นใช้งาน</h2>

          <p>
            เริ่มต้นใช้งาน GonnaTales
            ด้วยการสมัครสมาชิกหรือเข้าสู่ระบบ
          </p>

          <figure className="guide-figure">
            <img
              src="/guide/home.png"
              alt="หน้าหลักของ GonnaTales"
              className="guide-screenshot"
            />

            <figcaption className="guide-caption">
              ภาพที่ 1 แสดงหน้าหลักของ GonnaTales
            </figcaption>
          </figure>
        </section>

        <section
          id="home"
          className="guide-section"
        >
          <span className="guide-section-number">
            02
          </span>

          <h2>หน้าหลัก</h2>

          <p>
            หน้าหลักใช้สำหรับดูนิยายที่กำลังอ่านต่อ
            และเข้าถึงฟังก์ชันหลักของเว็บไซต์
          </p>

          <figure className="guide-figure">
            <img
              src="/guide/home.png"
              alt="หน้าหลักของ GonnaTales"
              className="guide-screenshot"
            />

            <figcaption className="guide-caption">
              ภาพที่ 2 แสดงหน้าหลักของ GonnaTales
            </figcaption>
          </figure>
        </section>

        <section
          id="discover"
          className="guide-section"
        >
          <span className="guide-section-number">
            03
          </span>

          <h2>สำรวจนิยาย</h2>

          <p>
            ใช้หน้าสำรวจเพื่อค้นหาและเลือกอ่านนิยาย
            จากเรื่องราวที่มีอยู่ในระบบ
          </p>

          <figure className="guide-figure">
            <img
              src="/guide/home.png"
              alt="หน้าสำรวจนิยายของ GonnaTales"
              className="guide-screenshot"
            />

            <figcaption className="guide-caption">
              ภาพที่ 3 แสดงหน้าสำรวจนิยาย
            </figcaption>
          </figure>
        </section>

        <section
          id="create-story"
          className="guide-section"
        >
          <span className="guide-section-number">
            04
          </span>

          <h2>สร้างนิยายใหม่</h2>

          <p>
            สร้างนิยายใหม่ผ่านขั้นตอนการกำหนดแนวคิด
            รูปแบบ และรายละเอียดของเรื่อง
          </p>

          <div className="guide-step">
            <h3>ขั้นตอนที่ 1 — Premise</h3>

            <p>
              กำหนดชื่อเรื่องและแนวคิดหลักของนิยาย
              เพื่อใช้เป็นพื้นฐานในการสร้างเรื่องราว
            </p>

            <figure className="guide-figure">
              <img
                src="/guide/home.png"
                alt="ขั้นตอน Premise สำหรับสร้างนิยาย"
                className="guide-screenshot"
              />

              <figcaption className="guide-caption">
                ภาพที่ 4 แสดงขั้นตอน Premise สำหรับกำหนดแนวคิดของนิยาย
              </figcaption>
            </figure>
          </div>

          <div className="guide-step">
            <h3>ขั้นตอนที่ 2 — Style</h3>

            <p>
              เลือกแนวของนิยาย โทนการเล่าเรื่อง
              และความยาวของเรื่อง
            </p>

            <figure className="guide-figure">
              <img
                src="/guide/home.png"
                alt="ขั้นตอน Style สำหรับสร้างนิยาย"
                className="guide-screenshot"
              />

              <figcaption className="guide-caption">
                ภาพที่ 5 แสดงขั้นตอน Style สำหรับกำหนดรูปแบบของนิยาย
              </figcaption>
            </figure>
          </div>

          <div className="guide-step">
            <h3>ขั้นตอนที่ 3 — Details</h3>

            <p>
              ระบุรายละเอียดของตัวละครเอก
              รวมถึงโลกและสถานที่ของเรื่อง
            </p>

            <figure className="guide-figure">
              <img
                src="/guide/home.png"
                alt="ขั้นตอน Details สำหรับสร้างนิยาย"
                className="guide-screenshot"
              />

              <figcaption className="guide-caption">
                ภาพที่ 6 แสดงขั้นตอน Details สำหรับกำหนดรายละเอียดของนิยาย
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="reading"
          className="guide-section"
        >
          <span className="guide-section-number">
            05
          </span>

          <h2>การอ่านนิยาย</h2>

          <p>
            อ่านนิยายที่สร้างขึ้นและดำเนินเรื่องต่อ
            ผ่านหน้า Reading Interface
          </p>

          <figure className="guide-figure">
            <img
              src="/guide/home.png"
              alt="หน้าอ่านนิยายของ GonnaTales"
              className="guide-screenshot"
            />

            <figcaption className="guide-caption">
              ภาพที่ 7 แสดงหน้าอ่านนิยายของ GonnaTales
            </figcaption>
          </figure>
        </section>

        <section
          id="my-stories"
          className="guide-section"
        >
          <span className="guide-section-number">
            06
          </span>

          <h2>นิยายของฉัน</h2>

          <p>
            จัดการนิยายที่สร้างไว้ เช่น
            แต่งต่อ แก้ไข เผยแพร่ และลบนิยาย
          </p>

          <figure className="guide-figure">
            <img
              src="/guide/home.png"
              alt="หน้านิยายของฉัน"
              className="guide-screenshot"
            />

            <figcaption className="guide-caption">
              ภาพที่ 8 แสดงหน้านิยายของฉันสำหรับจัดการนิยาย
            </figcaption>
          </figure>
        </section>

        <section
          id="favorites"
          className="guide-section"
        >
          <span className="guide-section-number">
            07
          </span>

          <h2>นิยายโปรด</h2>

          <p>
            ดูนิยายที่บันทึกไว้เป็นนิยายโปรด
            เพื่อกลับมาอ่านได้สะดวก
          </p>

          <figure className="guide-figure">
            <img
              src="/guide/home.png"
              alt="รายการนิยายโปรด"
              className="guide-screenshot"
            />

            <figcaption className="guide-caption">
              ภาพที่ 9 แสดงรายการนิยายโปรด
            </figcaption>
          </figure>
        </section>

        <section
          id="faq"
          className="guide-section"
        >
          <span className="guide-section-number">
            08
          </span>

          <h2>คำถามที่พบบ่อย</h2>

          <div className="guide-faq">
            <div className="guide-faq-item">
              <h3>
                สามารถกลับมาอ่านนิยายที่อ่านค้างไว้ได้หรือไม่?
              </h3>

              <p>
                สามารถกลับมาอ่านต่อจากจุดที่อ่านค้างไว้ได้
              </p>
            </div>

            <div className="guide-faq-item">
              <h3>
                สามารถแก้ไขนิยายที่สร้างไว้ได้หรือไม่?
              </h3>

              <p>
                สามารถจัดการและแก้ไขนิยายของคุณได้จากหน้า
                นิยายของฉัน
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}