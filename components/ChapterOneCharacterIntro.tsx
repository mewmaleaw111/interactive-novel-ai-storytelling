'use client';

import React from 'react';

interface IntroCharacter {
  id?: string;
  name?: string | null;
  role?: string | null;
  personality?: string | null;
  image_url?: string | null;
}

interface ChapterOneCharacterIntroProps {
  characters: IntroCharacter[];
}

function isProtagonist(
  character: IntroCharacter
) {
  const role = String(
    character.role || ''
  )
    .trim()
    .toLowerCase();

  return (
    role === 'player' ||
    role === 'protagonist' ||
    role === 'ผู้เล่น'
  );
}

/**
 * แสดงรูปตัวละครตอนต้นบทที่ 1
 * พร้อมชื่อและลักษณะนิสัยใต้รูป
 *
 * แสดงเฉพาะตัวละครที่ผู้สร้างอัปโหลดรูปไว้
 * ตัวละครหลักจะอยู่ก่อน แล้วตามด้วย NPC
 */
export default function ChapterOneCharacterIntro({
  characters,
}: ChapterOneCharacterIntroProps) {
  const withImage = (characters || [])
    .filter(
      (character) =>
        typeof character.image_url ===
          'string' &&
        character.image_url.trim() !== ''
    )
    .sort(
      (a, b) =>
        Number(isProtagonist(b)) -
        Number(isProtagonist(a))
    );

  if (withImage.length === 0) {
    return null;
  }

  return (
    <section
      className="chapter-character-intro"
      aria-label="ตัวละครในเรื่อง"
    >

      <h2 className="chapter-character-intro-title">
        ตัวละครในเรื่อง
      </h2>

      <div className="chapter-character-intro-grid">

        {withImage.map(
          (character, index) => (
            <figure
              key={
                character.id ||
                `${character.name}-${index}`
              }
              className="chapter-character-card"
            >

              <div className="chapter-character-image">
                <img
                  src={
                    character.image_url as string
                  }
                  alt={
                    character.name ||
                    'ตัวละคร'
                  }
                  loading="lazy"
                />
              </div>

              <figcaption className="chapter-character-caption">

                <span className="chapter-character-role">
                  {isProtagonist(character)
                    ? 'ตัวละครหลัก'
                    : 'ตัวละครประกอบ'}
                </span>

                <strong>
                  {character.name ||
                    'ไม่ระบุชื่อ'}
                </strong>

                {character.personality && (
                  <p>
                    {character.personality}
                  </p>
                )}

              </figcaption>

            </figure>
          )
        )}

      </div>

    </section>
  );
}
