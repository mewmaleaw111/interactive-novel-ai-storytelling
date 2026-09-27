'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  CreateStoryFormData,
  Gender,
  Genre,
  NarrativeTone,
  StoryLength,
  SupportingCharacter,
} from '../types/story';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRES: Genre[] = [
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

const TONES: NarrativeTone[] = [
  'มืดมนและสมจริง',
  'สดใสและจินตนาการ',
  'โรแมนติก',
  'ปรัชญา',
  'ตลกขบขัน',
  'ระทึกขวัญ',
];

const LENGTHS: {
  label: StoryLength;
  desc: string;
}[] = [
    {
      label: 'เรื่องสั้น',
      desc: '~5 บท',
    },
    {
      label: 'นวนิยายขนาดกลาง',
      desc: '~15 บท',
    },
    {
      label: 'นวนิยายยาว',
      desc: '~30+ บท',
    },
  ];

const GENDERS: Gender[] = [
  'ชาย',
  'หญิง',
  'ไม่ระบุ',
];

const createEmptySupportingCharacter =
  (): SupportingCharacter => ({
    name: '',
    gender: 'ไม่ระบุ',
    personality: '',
    items: '',
  });

const DEFAULT_FORM_DATA: CreateStoryFormData = {
  title: '',
  corePremise: '',
  genre: 'แฟนตาซี',
  tone: 'มืดมนและสมจริง',
  length: 'นวนิยายขนาดกลาง',

  // ตัวละครหลัก
  protagonist: '',
  protagonistGender: 'ไม่ระบุ',
  protagonistPersonality: '',
  protagonistItems: '',

  // ตัวละครประกอบ (NPC)
  supportingCharacters: [],

  // โลก / ฉากหลัง
  worldSetting: '',
};

const DRAFT_KEY =
  'GonnaTales_create_story_draft';

export const CreateStoryModal: React.FC<
  CreateStoryModalProps
> = ({
  isOpen,
  onClose,
}) => {
    const router = useRouter();

    const [step, setStep] =
      useState<1 | 2 | 3>(1);

    const [formData, setFormData] =
      useState<CreateStoryFormData>(
        DEFAULT_FORM_DATA
      );

    const [coverImageUrl, setCoverImageUrl] =
      useState('');

    const [coverPreview, setCoverPreview] =
      useState('');

    const [isUploadingCover, setIsUploadingCover] =
      useState(false);

    const [coverError, setCoverError] =
      useState('');

    const [isRestoringDraft, setIsRestoringDraft] =
      useState(false);

    const fileInputRef =
      useRef<HTMLInputElement>(null);

    // ==========================================
    // RESTORE DRAFT
    // ==========================================

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const savedDraft =
        sessionStorage.getItem(DRAFT_KEY);

      if (!savedDraft) {
        setIsRestoringDraft(false);
        return;
      }

      try {
        const data = JSON.parse(savedDraft);

        const restoredSupportingCharacters =
          Array.isArray(
            data.supportingCharacters
          )
            ? data.supportingCharacters
              .filter(
                (character: unknown) =>
                  character &&
                  typeof character === 'object'
              )
              .map(
                (
                  character: Partial<SupportingCharacter>
                ) => ({
                  name:
                    typeof character.name ===
                      'string'
                      ? character.name
                      : '',

                  gender:
                    character.gender === 'ชาย' ||
                      character.gender === 'หญิง' ||
                      character.gender === 'ไม่ระบุ'
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
          title:
            data.title || '',

          corePremise:
            data.corePremise || '',

          genre:
            data.genre || 'แฟนตาซี',

          tone:
            data.tone ||
            'มืดมนและสมจริง',

          length:
            data.length ||
            'นวนิยายขนาดกลาง',

          // ตัวละครหลัก
          protagonist:
            data.protagonist || '',

          protagonistGender:
            data.protagonistGender === 'ชาย' ||
              data.protagonistGender === 'หญิง' ||
              data.protagonistGender === 'ไม่ระบุ'
              ? data.protagonistGender
              : 'ไม่ระบุ',

          protagonistPersonality:
            data.protagonistPersonality || '',

          protagonistItems:
            data.protagonistItems || '',

          // ตัวละครประกอบ
          supportingCharacters:
            restoredSupportingCharacters,

          // โลก / ฉากหลัง
          worldSetting:
            data.worldSetting || '',
        });

        if (data.coverImageUrl) {
          setCoverImageUrl(
            data.coverImageUrl
          );

          setCoverPreview(
            data.coverImageUrl
          );
        }

        // ถ้าชื่อเรื่องหรือพล็อตหลักยังไม่ครบ
        // ให้กลับไป Step 1 เสมอ
        if (
          typeof data.step === 'number' &&
          data.step >= 1 &&
          data.step <= 3
        ) {
          const hasTitle =
            typeof data.title === 'string' &&
            data.title.trim().length > 0;

          const hasCorePremise =
            typeof data.corePremise === 'string' &&
            data.corePremise.trim().length > 0;

          if (hasTitle && hasCorePremise) {
            setStep(data.step);
          } else {
            setStep(1);
          }
        }
      } catch (error) {
        console.error(
          'Restore draft error:',
          error
        );
      } finally {
        setIsRestoringDraft(false);
      }
    }, [isOpen]);

    // ==========================================
    // AUTO SAVE DRAFT
    // ==========================================

    useEffect(() => {
      if (
        !isOpen ||
        isRestoringDraft
      ) {
        return;
      }

      try {
        const draft = {
          ...formData,
          coverImageUrl,
          step,
        };

        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify(draft)
        );
      } catch (error) {
        console.error(
          'Save draft error:',
          error
        );
      }
    }, [
      formData,
      coverImageUrl,
      step,
      isOpen,
      isRestoringDraft,
    ]);

    // ==========================================
    // UPDATE FORM
    // ==========================================

    const updateFormData = (
      changes: Partial<CreateStoryFormData>
    ) => {
      setFormData((prev) => ({
        ...prev,
        ...changes,
      }));
    };

    // ==========================================
    // NPC
    // ==========================================

    const addSupportingCharacter = () => {
      setFormData((prev) => ({
        ...prev,
        supportingCharacters: [
          ...prev.supportingCharacters,
          createEmptySupportingCharacter(),
        ],
      }));
    };

    const updateSupportingCharacter = (
      index: number,
      changes: Partial<SupportingCharacter>
    ) => {
      setFormData((prev) => ({
        ...prev,
        supportingCharacters:
          prev.supportingCharacters.map(
            (character, characterIndex) =>
              characterIndex === index
                ? {
                  ...character,
                  ...changes,
                }
                : character
          ),
      }));
    };

    const removeSupportingCharacter = (
      index: number
    ) => {
      setFormData((prev) => ({
        ...prev,
        supportingCharacters:
          prev.supportingCharacters.filter(
            (_, characterIndex) =>
              characterIndex !== index
          ),
      }));
    };

    // ==========================================
    // SAVE DRAFT IMMEDIATELY
    // ==========================================

    const saveDraftNow = (
      extraCoverUrl?: string
    ) => {
      try {
        const draft = {
          ...formData,

          coverImageUrl:
            extraCoverUrl ??
            coverImageUrl,

          step,
        };

        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify(draft)
        );
      } catch (error) {
        console.error(
          'Immediate draft save error:',
          error
        );
      }
    };

    // ==========================================
    // NEXT
    // ==========================================

    const handleNext = (
      e?: React.MouseEvent<HTMLButtonElement>
    ) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (step === 1) {
        if (
          formData.title.trim() === '' ||
          formData.corePremise.trim() === ''
        ) {
          console.log(
            '❌ ยังไม่ได้กรอกชื่อเรื่องหรือพล็อตหลัก'
          );
          return;
        }

        setStep(2);
        return;
      }

      if (step === 2) {
        setStep(3);
      }
    };

    // ==========================================
    // BACK
    // ==========================================

    const handleBack = (
      e?: React.MouseEvent<HTMLButtonElement>
    ) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (step === 3) {
        setStep(2);
        return;
      }

      if (step === 2) {
        setStep(1);
      }
    };

    // ==========================================
    // CLOSE
    // ==========================================

    const handleClose = (
      e?: React.MouseEvent<HTMLButtonElement>
    ) => {
      e?.preventDefault();
      e?.stopPropagation();

      sessionStorage.removeItem(
        DRAFT_KEY
      );

      setStep(1);

      setFormData({
        ...DEFAULT_FORM_DATA,
        supportingCharacters: [],
      });

      setCoverImageUrl('');
      setCoverPreview('');
      setCoverError('');
      setIsUploadingCover(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onClose();
    };

    // ==========================================
    // COVER UPLOAD
    // ==========================================

    const handleCoverChange = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      e.stopPropagation();

      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      setCoverError('');

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setCoverError(
          'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP'
        );

        e.target.value = '';

        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setCoverError(
          'ขนาดไฟล์ต้องไม่เกิน 5 MB'
        );

        e.target.value = '';

        return;
      }

      // บันทึกข้อมูลก่อน Upload
      saveDraftNow();

      // Preview
      const previewUrl =
        URL.createObjectURL(file);

      setCoverPreview(
        previewUrl
      );

      setIsUploadingCover(true);

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

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
            'ไม่สามารถอัปโหลดหน้าปกได้'
          );
        }

        setCoverImageUrl(
          data.url
        );

        setCoverPreview(
          data.url
        );

        // บันทึก Draft ทันที
        saveDraftNow(
          data.url
        );

        console.log(
          'Cover uploaded successfully'
        );
      } catch (error) {
        console.error(
          'Cover Upload Error:',
          error
        );

        setCoverImageUrl('');

        setCoverError(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถอัปโหลดหน้าปกได้'
        );
      } finally {
        setIsUploadingCover(false);

        e.target.value = '';

        URL.revokeObjectURL(
          previewUrl
        );
      }
    };

    // ==========================================
    // OPEN FILE PICKER
    // ==========================================

    const handleSelectCover = (
      e: React.MouseEvent<HTMLButtonElement>
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        isUploadingCover
      ) {
        return;
      }

      fileInputRef.current?.click();
    };

    // ==========================================
    // SUBMIT
    // ==========================================

    const handleSubmit = (
      e: React.MouseEvent<HTMLButtonElement>
    ) => {
      e.preventDefault();
      e.stopPropagation();

      // ชื่อเรื่อง + พล็อตหลัก + ตัวละครหลัก เป็นข้อมูลจำเป็น
      if (
        !formData.title.trim() ||
        !formData.corePremise.trim() ||
        !formData.protagonist.trim()
      ) {
        return;
      }

      // ถ้ามี NPC ต้องกรอกชื่อ NPC ทุกตัว
      const hasInvalidSupportingCharacter =
        formData.supportingCharacters.some(
          (character) =>
            !character.name.trim()
        );

      if (
        hasInvalidSupportingCharacter
      ) {
        return;
      }

      if (
        isUploadingCover
      ) {
        return;
      }

      // ========================================
      // CLEAN NPC
      // ========================================

      const cleanSupportingCharacters =
        formData.supportingCharacters
          .map((character) => ({
            name:
              character.name.trim(),

            gender:
              character.gender,

            personality:
              character.personality.trim(),

            items:
              character.items.trim(),
          }))
          .filter(
            (character) =>
              character.name.length > 0
          );

      const cleanFormData: CreateStoryFormData & {
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

        // ตัวละครหลัก
        protagonist:
          formData.protagonist.trim(),

        protagonistGender:
          formData.protagonistGender,

        protagonistPersonality:
          formData.protagonistPersonality.trim(),

        protagonistItems:
          formData.protagonistItems.trim(),

        // ตัวละครประกอบ
        supportingCharacters:
          cleanSupportingCharacters,

        // โลก / ฉากหลัง
        worldSetting:
          formData.worldSetting.trim(),

        coverImageUrl:
          coverImageUrl,
      };

      console.log(
        'Create Story Data:',
        cleanFormData
      );

      sessionStorage.setItem(
        'GonnaTales_create_story',
        JSON.stringify(
          cleanFormData
        )
      );

      sessionStorage.removeItem(
        DRAFT_KEY
      );

      onClose();

      router.push(
        '/story/generating'
      );
    };

    // ==========================================
    // CLOSED
    // ==========================================

    if (!isOpen) {
      return null;
    }

    return (
      <div
        className="story-modal-overlay"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          className="story-modal"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >

          {/* =====================================
          HEADER
        ====================================== */}

          <div className="story-modal-header">

            <div className="story-modal-header-content">

              <div className="story-modal-step-indicator">

                <span>
                  📌 ขั้นตอนที่ {step} จาก 3
                </span>

                <span className="story-modal-step-tag">

                  {step === 1 &&
                    'พล็อตเรื่อง (Premise)'}

                  {step === 2 &&
                    'สไตล์และหมวดหมู่ (Style)'}

                  {step === 3 &&
                    'รายละเอียดเพิ่มเติม (Details)'}

                </span>

              </div>

            </div>

            <button
              type="button"
              className="story-modal-close"
              onClick={handleClose}
            >
              ✕
            </button>

          </div>

          {/* =====================================
          BODY
        ====================================== */}

          <div className="story-modal-body">

            {/* =====================================
            STEP 1
          ====================================== */}

            {step === 1 && (
              <div className="story-modal-step-content">

                <h2>
                  เรื่องราวของคุณเกี่ยวกับอะไร?
                </h2>

                <div className="story-form-field">

                  <label>
                    ชื่อเรื่อง *
                  </label>

                  <input
                    type="text"
                    placeholder="เช่น ผู้เขียนแผนที่แห่งรัตติกาล..."
                    value={
                      formData.title
                    }
                    onChange={(e) =>
                      updateFormData({
                        title:
                          e.target.value,
                      })
                    }
                  />

                </div>

                <div className="story-form-field">

                  <label>
                    พล็อตหลัก / เรื่องย่อ
                    {' '}
                    (Core Premise) *
                  </label>

                  <textarea
                    rows={5}
                    placeholder="นักวาดแผนที่หนุ่มค้นพบว่าแผนที่ที่เขาวาดสามารถเปลี่ยนแปลงความจริงได้..."
                    value={
                      formData.corePremise
                    }
                    onChange={(e) =>
                      updateFormData({
                        corePremise:
                          e.target.value,
                      })
                    }
                  />

                  <small className="story-modal-form-tip">
                    AI จะใช้พล็อตนี้เป็นจุดเริ่มต้น
                    ในการสร้างเนื้อเรื่องทั้งหมดของคุณ
                  </small>

                </div>

              </div>
            )}

            {/* =====================================
            STEP 2
          ====================================== */}

            {step === 2 && (
              <div className="story-modal-step-content">

                <h2>
                  กำหนดโทนและหมวดหมู่ของเรื่อง
                </h2>

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    หมวดหมู่ (Genre)
                  </label>

                  <div className="story-modal-pill-grid">

                    {GENRES.map(
                      (genre) => (
                        <button
                          key={genre}
                          type="button"
                          className={`story-modal-pill-btn ${formData.genre ===
                              genre
                              ? 'selected'
                              : ''
                            }`}
                          onClick={() =>
                            updateFormData({
                              genre,
                            })
                          }
                        >
                          {genre}
                        </button>
                      )
                    )}

                  </div>

                </div>

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    โทนเรื่อง
                    (Narrative Tone)
                  </label>

                  <div className="story-modal-pill-grid">

                    {TONES.map(
                      (tone) => (
                        <button
                          key={tone}
                          type="button"
                          className={`story-modal-pill-btn ${formData.tone ===
                              tone
                              ? 'selected'
                              : ''
                            }`}
                          onClick={() =>
                            updateFormData({
                              tone,
                            })
                          }
                        >
                          {tone}
                        </button>
                      )
                    )}

                  </div>

                </div>

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    ความยาวของเรื่อง
                    (Story Length)
                  </label>

                  <div className="story-modal-length-grid">

                    {LENGTHS.map(
                      (item) => (
                        <button
                          key={
                            item.label
                          }
                          type="button"
                          className={`story-modal-length-card ${formData.length ===
                              item.label
                              ? 'selected'
                              : ''
                            }`}
                          onClick={() =>
                            updateFormData({
                              length:
                                item.label,
                            })
                          }
                        >
                          <span className="story-modal-length-title">
                            {
                              item.label
                            }
                          </span>

                          <span className="story-modal-length-desc">
                            {
                              item.desc
                            }
                          </span>
                        </button>
                      )
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* =====================================
            STEP 3
          ====================================== */}

            {step === 3 && (
              <div className="story-modal-step-content">

                <h2>
                  ระบุตัวละครและฉากหลัง
                </h2>

                {/* ==================================
                MAIN CHARACTER
              =================================== */}

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    ตัวละครหลัก
                  </label>

                  <div className="story-modal-character-section">

                    {/* ชื่อ */}

                    <div className="story-form-field">

                      <label>
                        ชื่อตัวละครหลัก *
                      </label>

                      <input
                        type="text"
                        placeholder="เช่น อลัน"
                        value={
                          formData.protagonist
                        }
                        onChange={(e) =>
                          updateFormData({
                            protagonist:
                              e.target.value,
                          })
                        }
                      />

                    </div>

                    {/* เพศ */}

                    <div className="story-form-field">

                      <label>
                        เพศตัวละครหลัก
                      </label>

                      <select
                        value={
                          formData.protagonistGender
                        }
                        onChange={(e) =>
                          updateFormData({
                            protagonistGender:
                              e.target.value as Gender,
                          })
                        }
                      >
                        {GENDERS.map(
                          (gender) => (
                            <option
                              key={gender}
                              value={gender}
                            >
                              {gender}
                            </option>
                          )
                        )}
                      </select>

                    </div>

                    {/* บุคลิก */}

                    <div className="story-form-field">

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
                        rows={4}
                        placeholder="เช่น เป็นคนสุขุม รอบคอบ ชอบช่วยเหลือผู้อื่น มีความสามารถในการใช้ดาบและอ่านแผนที่โบราณ..."
                        value={
                          formData.protagonistPersonality
                        }
                        onChange={(e) =>
                          updateFormData({
                            protagonistPersonality:
                              e.target.value,
                          })
                        }
                      />

                      <small className="story-modal-form-tip">
                        อธิบายบุคลิก จุดเด่น
                        ความสามารถ หรือข้อจำกัด
                        ของตัวละครหลัก
                      </small>

                    </div>

                    {/* ของที่พก */}

                    <div className="story-form-field">

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
                        rows={3}
                        placeholder="เช่น ดาบสั้น 1 เล่ม, สมุดบันทึก, เข็มทิศโบราณ..."
                        value={
                          formData.protagonistItems
                        }
                        onChange={(e) =>
                          updateFormData({
                            protagonistItems:
                              e.target.value,
                          })
                        }
                      />

                      <small className="story-modal-form-tip">
                        ระบุสิ่งของที่ตัวละครมี
                        ตั้งแต่เริ่มเรื่อง
                      </small>

                    </div>

                  </div>

                </div>

                {/* ==================================
                SUPPORTING CHARACTERS / NPC
              =================================== */}

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    ตัวละครประกอบ (NPC)
                  </label>

                  <div className="story-modal-character-section">

                    <small className="story-modal-form-tip">
                      เพิ่มตัวละครประกอบที่ต้องการ
                      ให้มีอยู่ในเรื่องตั้งแต่เริ่มต้น
                      สามารถเพิ่มได้หลายตัว
                    </small>

                    {/* NPC LIST */}

                    {formData.supportingCharacters.map(
                      (
                        character,
                        index
                      ) => (
                        <div
                          key={index}
                          className="story-modal-character-section"
                          style={{
                            marginTop:
                              '16px',
                            padding:
                              '18px',
                            border:
                              '1px solid rgba(0,0,0,0.08)',
                            borderRadius:
                              '12px',
                          }}
                        >

                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'space-between',
                              gap: '12px',
                              marginBottom:
                                '14px',
                            }}
                          >

                            <strong>
                              ตัวละครประกอบ{' '}
                              {index + 1}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                removeSupportingCharacter(
                                  index
                                )
                              }
                              style={{
                                border:
                                  'none',
                                background:
                                  'transparent',
                                cursor:
                                  'pointer',
                                color:
                                  '#b42318',
                                fontSize:
                                  '14px',
                              }}
                            >
                              🗑 ลบตัวละคร
                            </button>

                          </div>

                          {/* NAME */}

                          <div className="story-form-field">

                            <label>
                              ชื่อ *
                            </label>

                            <input
                              type="text"
                              placeholder="เช่น แทน"
                              value={
                                character.name
                              }
                              onChange={(
                                e
                              ) =>
                                updateSupportingCharacter(
                                  index,
                                  {
                                    name:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                            />

                          </div>

                          {/* GENDER */}

                          <div className="story-form-field">

                            <label>
                              เพศ
                            </label>

                            <select
                              value={
                                character.gender
                              }
                              onChange={(e) =>
                                updateSupportingCharacter(
                                  index,
                                  {
                                    gender:
                                      e.target
                                        .value as Gender,
                                  }
                                )
                              }
                            >
                              {GENDERS.map(
                                (gender) => (
                                  <option
                                    key={gender}
                                    value={gender}
                                  >
                                    {gender}
                                  </option>
                                )
                              )}
                            </select>

                          </div>

                          {/* PERSONALITY */}

                          <div className="story-form-field">

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
                              rows={4}
                              placeholder="เช่น เป็นคนใจเย็น ฉลาด มีความสามารถในการต่อสู้และใช้เวทมนตร์..."
                              value={character.personality}
                              onChange={(e) =>
                                updateSupportingCharacter(
                                  index,
                                  {
                                    personality:
                                      e.target.value,
                                  }
                                )
                              }
                            />

                          </div>

                          {/* ITEMS */}

                          <div className="story-form-field">

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
                              rows={3}
                              placeholder="เช่น ดาบสั้น, ยารักษา, เหรียญเก่า..."
                              value={character.items}
                              onChange={(e) =>
                                updateSupportingCharacter(
                                  index,
                                  {
                                    items:
                                      e.target.value,
                                  }
                                )
                              }
                            />

                          </div>

                        </div>
                      )
                    )}

                    {/* ADD NPC */}

                    <button
                      type="button"
                      onClick={
                        addSupportingCharacter
                      }
                      style={{
                        width:
                          '100%',
                        marginTop:
                          '16px',
                        padding:
                          '12px 16px',
                        border:
                          '1px dashed rgba(0,0,0,0.2)',
                        borderRadius:
                          '10px',
                        background:
                          'transparent',
                        cursor:
                          'pointer',
                        fontWeight:
                          600,
                      }}
                    >
                      ＋ เพิ่มตัวละครประกอบ
                    </button>

                  </div>

                </div>

                {/* ==================================
                WORLD SETTING
              =================================== */}

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    โลก / ฉากหลัง
                  </label>

                  <div className="story-form-field">

                    <label>
                      โลก / ฉากหลัง
                      {' '}
                      (ไม่จำเป็นต้องระบุ)
                    </label>

                    <textarea
                      rows={4}
                      placeholder="เช่น เมืองลอนดอนยุควิกตอเรียนที่ซ่อนเร้นเวทมนตร์..."
                      value={
                        formData.worldSetting
                      }
                      onChange={(e) =>
                        updateFormData({
                          worldSetting:
                            e.target.value,
                        })
                      }
                    />

                    <small className="story-modal-form-tip">
                      กำหนดสถานที่ ยุคสมัย สังคม
                      หรือกฎของโลกในเรื่อง
                    </small>

                  </div>

                </div>

                {/* ==================================
                COVER
              =================================== */}

                <div className="story-modal-form-section">

                  <label className="story-modal-section-label">
                    หน้าปกนิยาย
                    {' '}
                    (ไม่จำเป็นต้องระบุ)
                  </label>

                  <div className="story-modal-cover-upload">

                    {coverPreview ? (
                      <div className="story-modal-cover-preview-wrapper">

                        <img
                          src={
                            coverPreview
                          }
                          alt="ตัวอย่างหน้าปกนิยาย"
                          className="story-modal-cover-preview"
                        />

                      </div>
                    ) : (
                      <div className="story-modal-cover-placeholder">

                        <span className="story-modal-cover-icon">
                          🖼️
                        </span>

                        <span>
                          ยังไม่ได้เลือกหน้าปก
                        </span>

                      </div>
                    )}

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleCoverChange
                      }
                      style={{
                        display:
                          'none',
                      }}
                    />

                    <button
                      type="button"
                      className="story-modal-cover-button"
                      onClick={
                        handleSelectCover
                      }
                      disabled={
                        isUploadingCover
                      }
                    >
                      {isUploadingCover
                        ? 'กำลังอัปโหลด...'
                        : coverPreview
                          ? 'เปลี่ยนหน้าปก'
                          : 'เลือกหน้าปก'}
                    </button>

                    {isUploadingCover && (
                      <small className="story-modal-form-tip">
                        กำลังอัปโหลดหน้าปกไปยังระบบ...
                      </small>
                    )}

                    {coverImageUrl &&
                      !isUploadingCover && (
                        <small className="story-modal-form-tip story-modal-success">
                          ✓ อัปโหลดหน้าปกสำเร็จ
                        </small>
                      )}

                    {coverError && (
                      <small className="story-modal-form-tip story-modal-cover-error">
                        {
                          coverError
                        }
                      </small>
                    )}

                    <small className="story-modal-form-tip">
                      รองรับ JPG, PNG, WEBP
                      ขนาดไม่เกิน 5 MB
                    </small>

                  </div>

                </div>

                {/* ==================================
                BLUEPRINT
              =================================== */}

                <div className="story-modal-blueprint">

                  <span className="story-modal-blueprint-title">
                    📐 โครงร่างนิยาย
                    (STORY BLUEPRINT)
                  </span>

                  <p className="story-modal-blueprint-story-title">

                    <strong>
                      ชื่อเรื่อง:
                    </strong>{' '}

                    {formData.title}

                  </p>

                  <div className="story-modal-blueprint-tags">

                    <span className="story-modal-tag">
                      {
                        formData.genre
                      }
                    </span>

                    <span className="story-modal-tag">
                      {
                        formData.tone
                      }
                    </span>

                    <span className="story-modal-tag">
                      {
                        formData.length
                      }
                    </span>

                    {formData.supportingCharacters
                      .length >
                      0 && (
                        <span className="story-modal-tag">
                          NPC{' '}
                          {
                            formData
                              .supportingCharacters
                              .length
                          } คน
                        </span>
                      )}

                  </div>

                  {formData.corePremise && (
                    <p className="story-modal-blueprint-premise">
                      "
                      {
                        formData.corePremise
                      }
                      "
                    </p>
                  )}

                </div>

              </div>
            )}

          </div>

          {/* =====================================
          FOOTER
        ====================================== */}

          <div className="story-modal-footer">

            {step > 1 ? (
              <button
                type="button"
                className="story-modal-cancel"
                onClick={handleBack}
              >
                ‹ ย้อนกลับ
              </button>
            ) : (
              <button
                type="button"
                className="story-modal-cancel"
                onClick={handleClose}
              >
                ยกเลิก
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="story-modal-save"
                onClick={handleNext}
                disabled={
                  step === 1 &&
                  (
                    formData.title.trim() === '' ||
                    formData.corePremise.trim() === ''
                  )
                }
              >
                ถัดไป ›
              </button>
            ) : (
              <button
                type="button"
                className="story-modal-generate"
                onClick={handleSubmit}
                disabled={
                  !formData.title.trim() ||
                  !formData.corePremise.trim() ||
                  !formData.protagonist.trim() ||
                  formData.supportingCharacters.some(
                    (character) =>
                      !character.name.trim()
                  ) ||
                  isUploadingCover
                }
              >
                ✨ เริ่มสร้างนิยาย
              </button>
            )}

          </div>

        </div>
      </div>
    );
  };