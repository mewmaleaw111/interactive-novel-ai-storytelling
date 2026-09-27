'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  useUser,
  SignInButton,
} from '@clerk/nextjs';

import {
  CreateStoryFormData,
  Genre,
  NarrativeTone,
  StoryLength,
  SupportingCharacter,
  Gender,
} from '@/types/story';

const DRAFT_KEY =
  'GonnaTales_create_story_draft';

const CREATE_KEY =
  'GonnaTales_create_story';

const genres: Genre[] = [
  'แฟนตาซี',
  'โรแมนติก',
  'สืบสวนสอบสวน',
  'ไซไฟ',
  'ประวัติศาสตร์',
  'สยองขวัญ',
  'ดราม่า',
  'แอ็กชัน',
  'ผจญภัย',
];

const tones: NarrativeTone[] = [
  'มืดมนและสมจริง',
  'สดใสและจินตนาการ',
  'โรแมนติก',
  'ปรัชญา',
  'ตลกขบขัน',
  'ระทึกขวัญ',
];

const lengths: StoryLength[] = [
  'เรื่องสั้น',
  'นวนิยายขนาดกลาง',
  'นวนิยายยาว',
];

const genders: Gender[] = [
  'ชาย',
  'หญิง',
  'ไม่ระบุ',
];

const emptyForm: CreateStoryFormData = {
  title: '',
  corePremise: '',
  genre: 'แฟนตาซี',
  tone: 'สดใสและจินตนาการ',
  length: 'เรื่องสั้น',

  protagonist: '',
  protagonistGender: 'ไม่ระบุ',
  protagonistPersonality: '',
  protagonistItems: '',

  supportingCharacters: [],

  worldSetting: '',
};

export default function CreateStoryPage() {
  const router = useRouter();

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const {
    user,
    isLoaded,
  } = useUser();

  const [step, setStep] =
    useState(1);

  const [formData, setFormData] =
    useState<CreateStoryFormData>(
      emptyForm
    );

  const [coverImageUrl, setCoverImageUrl] =
    useState('');

  const [isUploading, setIsUploading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const hasRestoredDraft =
    useRef(false);

  /* =====================================================
     Restore Draft
  ===================================================== */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      return;
    }

    try {
      const savedDraft =
        sessionStorage.getItem(
          DRAFT_KEY
        );

      if (savedDraft) {
        const parsed =
          JSON.parse(savedDraft);

        if (parsed.formData) {
          const savedFormData =
            parsed.formData;

          const restoredProtagonistGender: Gender =
            savedFormData.protagonistGender ===
              'ชาย' ||
            savedFormData.protagonistGender ===
              'หญิง' ||
            savedFormData.protagonistGender ===
              'ไม่ระบุ'
              ? savedFormData.protagonistGender
              : 'ไม่ระบุ';

          const restoredSupportingCharacters =
            Array.isArray(
              savedFormData.supportingCharacters
            )
              ? savedFormData.supportingCharacters
                  .filter(
                    (
                      character: SupportingCharacter
                    ) =>
                      character &&
                      typeof character.name ===
                        'string'
                  )
                  .map(
                    (
                      character: SupportingCharacter
                    ) => ({
                      name:
                        typeof character.name ===
                          'string'
                          ? character.name
                          : '',

                      gender:
                        character.gender ===
                          'ชาย' ||
                        character.gender ===
                          'หญิง' ||
                        character.gender ===
                          'ไม่ระบุ'
                          ? character.gender
                          : 'ไม่ระบุ',

                      personality:
                        typeof character.personality ===
                          'string'
                          ? character.personality
                          : '',

                      items:
                        typeof character.items ===
                          'string'
                          ? character.items
                          : '',
                    })
                  )
              : [];

          setFormData({
            ...emptyForm,
            ...savedFormData,

            protagonistGender:
              restoredProtagonistGender,

            supportingCharacters:
              restoredSupportingCharacters,
          });
        }

        if (parsed.coverImageUrl) {
          setCoverImageUrl(
            parsed.coverImageUrl
          );
        }

        if (parsed.step) {
          setStep(parsed.step);
        }
      }
    } catch (error) {
      console.error(
        'Restore draft error:',
        error
      );
    } finally {
      hasRestoredDraft.current =
        true;
    }
  }, [
    isLoaded,
    user,
  ]);

  /* =====================================================
     Auto Save Draft
  ===================================================== */

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    if (!hasRestoredDraft.current) {
      return;
    }

    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          formData,
          coverImageUrl,
          step,
        })
      );
    } catch (error) {
      console.error(
        'Save draft error:',
        error
      );
    }
  }, [
    isLoaded,
    user,
    formData,
    coverImageUrl,
    step,
  ]);

  /* =====================================================
     Update Form
  ===================================================== */

  const updateField = <
    K extends keyof CreateStoryFormData
  >(
    field: K,
    value: CreateStoryFormData[K]
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =====================================================
     Supporting Characters
  ===================================================== */

  const addSupportingCharacter = () => {
    const newCharacter: SupportingCharacter = {
      name: '',
      gender: 'ไม่ระบุ',
      personality: '',
      items: '',
    };

    setFormData((previous) => ({
      ...previous,
      supportingCharacters: [
        ...previous.supportingCharacters,
        newCharacter,
      ],
    }));
  };

  const updateSupportingCharacter = <
    K extends keyof SupportingCharacter
  >(
    index: number,
    field: K,
    value: SupportingCharacter[K]
  ) => {
    setFormData((previous) => ({
      ...previous,
      supportingCharacters:
        previous.supportingCharacters.map(
          (
            character,
            characterIndex
          ) =>
            characterIndex === index
              ? {
                  ...character,
                  [field]: value,
                }
              : character
        ),
    }));
  };

  const removeSupportingCharacter = (
    index: number
  ) => {
    setFormData((previous) => ({
      ...previous,
      supportingCharacters:
        previous.supportingCharacters.filter(
          (_, characterIndex) =>
            characterIndex !== index
        ),
    }));
  };

  /* =====================================================
     Cover Upload
  ===================================================== */

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadData =
        new FormData();

      uploadData.append(
        'file',
        file
      );

      const response =
        await fetch(
          '/api/upload-cover',
          {
            method: 'POST',
            body: uploadData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'อัปโหลดรูปไม่สำเร็จ'
        );
      }

      setCoverImageUrl(
        data.url
      );
    } catch (error) {
      console.error(
        'Cover upload error:',
        error
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* =====================================================
     Step Validation
  ===================================================== */

  const canNext = () => {
    if (step === 1) {
      if (
        formData.title.trim() === ''
      ) {
        return false;
      }

      if (
        formData.corePremise.trim() === ''
      ) {
        return false;
      }

      return true;
    }

    if (step === 2) {
      if (
        formData.protagonist.trim() === ''
      ) {
        return false;
      }

      const hasEmptyNpcName =
        formData.supportingCharacters.some(
          (character) =>
            character.name.trim() === ''
        );

      if (hasEmptyNpcName) {
        return false;
      }

      return true;
    }

    return true;
  };

  /* =====================================================
     Navigation
  ===================================================== */

  const handleNext = () => {
    if (!canNext()) {
      return;
    }

    setStep((previous) =>
      Math.min(
        previous + 1,
        3
      )
    );
  };

  const handleBack = () => {
    if (step === 1) {
      sessionStorage.removeItem(
        DRAFT_KEY
      );

      router.push('/');
      return;
    }

    setStep((previous) =>
      Math.max(
        previous - 1,
        1
      )
    );
  };

  /* =====================================================
     Submit
  ===================================================== */

  const handleSubmit = () => {
    if (!isLoaded || !user) {
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (!formData.title.trim()) {
      return;
    }

    if (!formData.corePremise.trim()) {
      return;
    }

    if (!formData.protagonist.trim()) {
      return;
    }

    const hasEmptyNpcName =
      formData.supportingCharacters.some(
        (character) =>
          character.name.trim() === ''
      );

    if (hasEmptyNpcName) {
      return;
    }

    setIsSubmitting(true);

    const cleanSupportingCharacters =
      formData.supportingCharacters
        .filter(
          (character) =>
            character.name.trim() !== ''
        )
        .map(
          (character) => ({
            name:
              character.name.trim(),

            gender:
              character.gender ||
              'ไม่ระบุ',

            personality:
              character.personality.trim(),

            items:
              character.items.trim(),
          })
        );

    const cleanFormData:
      CreateStoryFormData & {
        coverImageUrl: string;
      } = {
        title:
          formData.title.trim(),

        corePremise:
          formData.corePremise.trim(),

        genre:
          formData.genre,

        tone:
          formData.tone,

        length:
          formData.length,

        protagonist:
          formData.protagonist.trim(),

        protagonistGender:
          formData.protagonistGender ||
          'ไม่ระบุ',

        protagonistPersonality:
          formData.protagonistPersonality.trim(),

        protagonistItems:
          formData.protagonistItems.trim(),

        supportingCharacters:
          cleanSupportingCharacters,

        worldSetting:
          formData.worldSetting.trim(),

        coverImageUrl:
          coverImageUrl,
      };

    try {
      sessionStorage.removeItem(
        'GonnaTales_generated_story'
      );

      sessionStorage.removeItem(
        'GonnaTales_generating_story_id'
      );

      sessionStorage.setItem(
        CREATE_KEY,
        JSON.stringify(
          cleanFormData
        )
      );

      sessionStorage.removeItem(
        DRAFT_KEY
      );

      router.push(
        '/story/generating'
      );
    } catch (error) {
      console.error(
        'Create story navigation error:',
        error
      );

      setIsSubmitting(false);
    }
  };

  /* =====================================================
     AUTH LOADING
  ===================================================== */

  if (!isLoaded) {
    return (
      <main className="story-create-page">
        <div className="story-create-auth-loading">
          <div className="story-create-auth-spinner" />

          <h2>
            กำลังตรวจสอบการเข้าสู่ระบบ...
          </h2>

          <p>
            กรุณารอสักครู่
          </p>
        </div>
      </main>
    );
  }

  /* =====================================================
     Not Logged In
  ===================================================== */

  if (!user) {
    return (
      <main className="login-required-page">
        <div className="login-required-card">

          <div className="login-required-icon">
            <span>🔐</span>
          </div>

          <div className="login-required-content">
            <p className="login-required-label">
              GonnaTales
            </p>

            <h1>
              กรุณาเข้าสู่ระบบ
            </h1>

            <p className="login-required-description">
              เข้าสู่ระบบเพื่อเริ่มอ่านนิยาย
              <br />
              และบันทึกความคืบหน้าของคุณ
            </p>
          </div>

          <div className="login-required-actions">

            <SignInButton mode="modal">
              <button
                type="button"
                className="login-required-primary"
              >
                <span>
                  เข้าสู่ระบบ
                </span>

                <span className="button-arrow">
                  →
                </span>
              </button>
            </SignInButton>

            <button
              type="button"
              className="login-required-secondary"
              onClick={() =>
                router.push('/')
              }
            >
              ‹ กลับหน้าหลัก
            </button>

          </div>

          <p className="login-required-footer">
            Your stories, your journey.
          </p>

        </div>
      </main>
    );
  }

  /* =====================================================
     CREATE STORY PAGE
  ===================================================== */

  return (
    <main className="story-create-page">
      <div className="story-create-container">

        {/* =================================================
            Header
        ================================================= */}

        <header className="story-create-header">

          <button
            type="button"
            className="story-create-back"
            onClick={handleBack}
          >
            ‹ กลับหน้าหลัก
          </button>

          <div className="story-create-heading">

            <h1>
              สร้างนิยายเรื่องใหม่
            </h1>

            <p>
              เปลี่ยนจินตนาการของคุณให้กลายเป็นเรื่องราว
            </p>

          </div>

        </header>

        {/* =================================================
            Progress
        ================================================= */}

        <div className="story-create-progress">

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className={`story-create-progress-item ${
                  step >= item
                    ? 'active'
                    : ''
                }`}
              >

                <div className="story-create-progress-number">
                  {item}
                </div>

                <span>
                  {item === 1 &&
                    'พื้นฐานเรื่อง'}

                  {item === 2 &&
                    'ตัวละคร'}

                  {item === 3 &&
                    'รูปแบบเรื่อง'}
                </span>

              </div>
            )
          )}

        </div>

        {/* =================================================
            Form Card
        ================================================= */}

        <section className="story-create-card">

          {/* ===============================================
              STEP 1
          =============================================== */}

          {step === 1 && (
            <div className="story-create-step">

              <div className="story-create-step-heading">

                <span>
                  ขั้นตอนที่ 1
                </span>

                <h2>
                  มาเริ่มต้นเรื่องราวกัน
                </h2>

                <p>
                  กำหนดพื้นฐานของนิยายที่คุณอยากสร้าง
                </p>

              </div>

              <div className="story-create-fields">

                <div className="story-create-field">

                  <label>
                    ชื่อเรื่อง
                    <span className="story-create-required">
                      {' '} *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      formData.title
                    }
                    onChange={(e) =>
                      updateField(
                        'title',
                        e.target.value
                      )
                    }
                    placeholder="เช่น คืนที่ดวงจันทร์หายไป"
                  />

                </div>

                <div className="story-create-field">

                  <label>
                    เรื่องย่อ / แก่นเรื่อง
                    <span className="story-create-required">
                      {' '} *
                    </span>
                  </label>

                  <textarea
                    value={
                      formData.corePremise
                    }
                    onChange={(e) =>
                      updateField(
                        'corePremise',
                        e.target.value
                      )
                    }
                    placeholder="เล่าไอเดียหลักของเรื่องที่คุณอยากให้เกิดขึ้น..."
                    rows={6}
                  />

                </div>

                <div className="story-create-field">

                  <label>
                    แนวเรื่อง
                  </label>

                  <div className="story-create-options">

                    {genres.map(
                      (genre) => (
                        <button
                          key={genre}
                          type="button"
                          className={
                            formData.genre ===
                              genre
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'genre',
                              genre
                            )
                          }
                        >
                          {genre}
                        </button>
                      )
                    )}

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ===============================================
              STEP 2
          =============================================== */}

          {step === 2 && (
            <div className="story-create-step">

              <div className="story-create-step-heading">

                <span>
                  ขั้นตอนที่ 2
                </span>

                <h2>
                  ตัวละครและโลกของเรื่อง
                </h2>

                <p>
                  กำหนดตัวละครหลัก ตัวละครประกอบ ฉากหลัง และบรรยากาศของนิยาย
                </p>

              </div>

              <div className="story-create-fields">

                {/* =================================================
                    ตัวละครหลัก
                ================================================= */}

                <div className="story-create-section-heading">

                  <h3>
                    ตัวละครหลัก
                  </h3>

                  <p>
                    ข้อมูลนี้จะใช้เป็นตัวละครหลักของเรื่องตั้งแต่บทแรก
                  </p>

                </div>

                <div className="story-create-field">

                  <label>
                    ชื่อตัวละครหลัก
                    <span className="story-create-required">
                      {' '} *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      formData.protagonist
                    }
                    onChange={(e) =>
                      updateField(
                        'protagonist',
                        e.target.value
                      )
                    }
                    placeholder="เช่น อาร์เธอร์ เพนเดิลตัน"
                  />

                </div>

                {/* =================================================
                    เพศตัวละครหลัก
                ================================================= */}

                <div className="story-create-field">

                  <label>
                    เพศตัวละครหลัก
                  </label>

                  <div className="story-create-options">

                    {genders.map(
                      (gender) => (
                        <button
                          key={gender}
                          type="button"
                          className={
                            formData.protagonistGender ===
                              gender
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'protagonistGender',
                              gender
                            )
                          }
                        >
                          {gender}
                        </button>
                      )
                    )}

                  </div>

                </div>

                <div className="story-create-field">

                  <label>
                    นิสัยและความสามารถตัวละครหลัก
                    <span className="story-create-optional">
                      {' '} (ไม่จำเป็น)
                    </span>
                  </label>

                  <p>
                    หากไม่ระบุ AI จะช่วยสร้างให้เหมาะสมกับเรื่อง
                  </p>

                  <textarea
                    value={
                      formData.protagonistPersonality
                    }
                    onChange={(e) =>
                      updateField(
                        'protagonistPersonality',
                        e.target.value
                      )
                    }
                    placeholder="เช่น สุขุม รอบคอบ ไม่ไว้ใจคนง่าย สามารถใช้เวทมนตร์ไฟได้..."
                    rows={5}
                  />

                </div>

                <div className="story-create-field">

                  <label>
                    ของที่พกติดตัว
                    <span className="story-create-optional">
                      {' '} (ไม่จำเป็น)
                    </span>
                  </label>

                  <p>
                    หากไม่ระบุ AI จะกำหนดสิ่งของให้เหมาะสมกับเรื่อง
                  </p>

                  <textarea
                    value={
                      formData.protagonistItems
                    }
                    onChange={(e) =>
                      updateField(
                        'protagonistItems',
                        e.target.value
                      )
                    }
                    placeholder="เช่น ดาบเก่า 1 เล่ม, หนังสือเวทมนตร์, เหรียญของแม่..."
                    rows={4}
                  />

                </div>

                {/* =================================================
                    ตัวละครประกอบ
                ================================================= */}

                <div className="story-create-section-heading story-create-supporting-section-heading">

                  <div className="story-create-supporting-header">

                    <div>

                      <h3>
                        ตัวละครประกอบ (NPC)
                      </h3>

                      <p>
                        เพิ่มตัวละครที่คุณต้องการให้มีอยู่ในเรื่องตั้งแต่เริ่มต้น
                      </p>

                    </div>

                    <button
                      type="button"
                      className="story-create-secondary"
                      onClick={
                        addSupportingCharacter
                      }
                    >
                      ＋ เพิ่มตัวละคร
                    </button>

                  </div>

                </div>

                {formData.supportingCharacters.length >
                  0 && (
                    <div className="story-create-supporting-list">

                      {formData.supportingCharacters.map(
                        (
                          character,
                          index
                        ) => (
                          <div
                            key={index}
                            className="story-create-supporting-character"
                          >

                            <div className="story-create-supporting-character-header">

                              <strong>
                                ตัวละครประกอบ #{index + 1}
                              </strong>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSupportingCharacter(
                                    index
                                  )
                                }
                                className="story-create-remove-character"
                              >
                                ลบตัวละคร
                              </button>

                            </div>

                            <div className="story-create-field">

                              <label>
                                ชื่อตัวละคร
                                <span className="story-create-required">
                                  {' '} *
                                </span>
                              </label>

                              <input
                                type="text"
                                value={
                                  character.name
                                }
                                onChange={(e) =>
                                  updateSupportingCharacter(
                                    index,
                                    'name',
                                    e.target.value
                                  )
                                }
                                placeholder="เช่น ลีอา"
                              />

                            </div>

                            {/* =================================================
                                เพศ NPC
                            ================================================= */}

                            <div className="story-create-field">

                              <label>
                                เพศตัวละคร
                              </label>

                              <div className="story-create-options">

                                {genders.map(
                                  (gender) => (
                                    <button
                                      key={gender}
                                      type="button"
                                      className={
                                        character.gender ===
                                          gender
                                          ? 'selected'
                                          : ''
                                      }
                                      onClick={() =>
                                        updateSupportingCharacter(
                                          index,
                                          'gender',
                                          gender
                                        )
                                      }
                                    >
                                      {gender}
                                    </button>
                                  )
                                )}

                              </div>

                            </div>

                            <div className="story-create-field">

                              <label>
                                นิสัยและความสามารถ
                                <span className="story-create-optional">
                                  {' '} (ไม่จำเป็น)
                                </span>
                              </label>

                              <p>
                                หากไม่ระบุ AI จะช่วยสร้างให้เหมาะสมกับเรื่อง
                              </p>

                              <textarea
                                value={
                                  character.personality
                                }
                                onChange={(e) =>
                                  updateSupportingCharacter(
                                    index,
                                    'personality',
                                    e.target.value
                                  )
                                }
                                placeholder="เช่น ร่าเริง ช่างพูด เชี่ยวชาญการรักษาและสมุนไพร..."
                                rows={4}
                              />

                            </div>

                            <div className="story-create-field">

                              <label>
                                ของที่พกติดตัว
                                <span className="story-create-optional">
                                  {' '} (ไม่จำเป็น)
                                </span>
                              </label>

                              <p>
                                หากไม่ระบุ AI จะกำหนดสิ่งของให้เหมาะสมกับเรื่อง
                              </p>

                              <textarea
                                value={
                                  character.items
                                }
                                onChange={(e) =>
                                  updateSupportingCharacter(
                                    index,
                                    'items',
                                    e.target.value
                                  )
                                }
                                placeholder="เช่น กระเป๋าสมุนไพร, มีดสั้น, ยารักษา..."
                                rows={3}
                              />

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                {/* =================================================
                    โลก / ฉากหลัง
                ================================================= */}

                <div className="story-create-section-heading">

                  <h3>
                    โลก / ฉากหลัง
                  </h3>

                  <p>
                    กำหนดสถานที่ ยุคสมัย หรือสภาพแวดล้อมของเรื่อง
                  </p>

                </div>

                <div className="story-create-field">

                  <label>
                    โลก / สถานที่
                    <span className="story-create-optional">
                      {' '} (ไม่จำเป็น)
                    </span>
                  </label>

                  <textarea
                    value={
                      formData.worldSetting
                    }
                    onChange={(e) =>
                      updateField(
                        'worldSetting',
                        e.target.value
                      )
                    }
                    placeholder="เช่น เมืองเล็ก ๆ ที่ซ่อนอยู่ท่ามกลางป่า ผู้คนในเมืองใช้เวทมนตร์เป็นเรื่องปกติ..."
                    rows={5}
                  />

                </div>

                {/* =================================================
                    โทนของเรื่อง
                ================================================= */}

                <div className="story-create-field">

                  <label>
                    โทนของเรื่อง
                  </label>

                  <div className="story-create-options">

                    {tones.map(
                      (tone) => (
                        <button
                          key={tone}
                          type="button"
                          className={
                            formData.tone ===
                              tone
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'tone',
                              tone
                            )
                          }
                        >
                          {tone}
                        </button>
                      )
                    )}

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ===============================================
              STEP 3
          =============================================== */}

          {step === 3 && (
            <div className="story-create-step">

              <div className="story-create-step-heading">

                <span>
                  ขั้นตอนที่ 3
                </span>

                <h2>
                  รายละเอียดสุดท้าย
                </h2>

                <p>
                  เลือกความยาว เพิ่มภาพปก และตรวจสอบข้อมูลก่อนสร้าง
                </p>

              </div>

              <div className="story-create-fields">

                <div className="story-create-field">

                  <label>
                    ความยาวของนิยาย
                  </label>

                  <div className="story-create-length-options">

                    {lengths.map(
                      (length) => (
                        <button
                          key={length}
                          type="button"
                          className={
                            formData.length ===
                              length
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'length',
                              length
                            )
                          }
                        >

                          <strong>
                            {length}
                          </strong>

                          <span>
                            {length ===
                              'เรื่องสั้น' &&
                              '5 บท'}

                            {length ===
                              'นวนิยายขนาดกลาง' &&
                              '15 บท'}

                            {length ===
                              'นวนิยายยาว' &&
                              '30 บท'}
                          </span>

                        </button>
                      )
                    )}

                  </div>

                </div>

                <div className="story-create-field">

                  <label>
                    ภาพปก
                    <span className="story-create-optional">
                      {' '} (ไม่จำเป็น)
                    </span>
                  </label>

                  <div className="story-create-cover">

                    {coverImageUrl ? (
                      <img
                        src={
                          coverImageUrl
                        }
                        alt="ภาพปกนิยาย"
                      />
                    ) : (
                      <div className="story-create-cover-empty">
                        ยังไม่มีภาพปก
                      </div>
                    )}

                  </div>

                  <label className="story-create-upload">

                    {isUploading
                      ? 'กำลังอัปโหลด...'
                      : 'เลือกภาพปก'}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleCoverUpload
                      }
                    />

                  </label>

                </div>

                <div className="story-create-summary">

                  <div>
                    <span>
                      ชื่อเรื่อง
                    </span>

                    <strong>
                      {formData.title ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      แนว
                    </span>

                    <strong>
                      {formData.genre}
                    </strong>
                  </div>

                  <div>
                    <span>
                      โทน
                    </span>

                    <strong>
                      {formData.tone}
                    </strong>
                  </div>

                  <div>
                    <span>
                      ความยาว
                    </span>

                    <strong>
                      {formData.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      ตัวละครหลัก
                    </span>

                    <strong>
                      {formData.protagonist ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      เพศตัวละครหลัก
                    </span>

                    <strong>
                      {formData.protagonistGender}
                    </strong>
                  </div>

                  <div>
                    <span>
                      ตัวละครประกอบ
                    </span>

                    <strong>
                      {
                        formData.supportingCharacters.filter(
                          (character) =>
                            character.name.trim() !==
                            ''
                        ).length
                      }{' '}
                      ตัว
                    </strong>
                  </div>

                  {formData.supportingCharacters
                    .filter(
                      (character) =>
                        character.name.trim() !==
                        ''
                    )
                    .map(
                      (
                        character,
                        index
                      ) => (
                        <div
                          key={index}
                        >
                          <span>
                            NPC #{index + 1}
                          </span>

                          <strong>
                            {character.name}
                            {' '}
                            ({character.gender})
                          </strong>
                        </div>
                      )
                    )}

                  <div>
                    <span>
                      โลก / ฉากหลัง
                    </span>

                    <strong>
                      {formData.worldSetting ||
                        '-'}
                    </strong>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              Footer
          ================================================= */}

          <div className="story-create-footer">

            <button
              type="button"
              className="story-create-secondary"
              onClick={handleBack}
            >
              {step === 1
                ? 'ยกเลิก'
                : 'ย้อนกลับ'}
            </button>

            {step < 3 ? (
              <button
                type="button"
                className="story-create-primary"
                onClick={handleNext}
                disabled={!canNext()}
              >
                ถัดไป →
              </button>
            ) : (
              <button
                type="button"
                className="story-create-primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'กำลังเตรียมเรื่อง...'
                  : 'สร้างนิยาย'}
              </button>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}