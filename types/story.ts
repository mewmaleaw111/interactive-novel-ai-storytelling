export type Genre =
  | 'แฟนตาซี'
  | 'โรแมนติก'
  | 'สืบสวนสอบสวน'
  | 'ไซไฟ'
  | 'ประวัติศาสตร์'
  | 'สยองขวัญ'
  | 'ดราม่า'
  | 'แอ็กชัน'
  | 'ผจญภัย';

export type NarrativeTone =
  | 'มืดมนและสมจริง'
  | 'สดใสและจินตนาการ'
  | 'โรแมนติก'
  | 'ปรัชญา'
  | 'ตลกขบขัน'
  | 'ระทึกขวัญ';

export type StoryLength =
  | 'เรื่องสั้น'
  | 'นวนิยายขนาดกลาง'
  | 'นวนิยายยาว';

export type Gender =
  | 'ชาย'
  | 'หญิง'
  | 'ไม่ระบุ';

/* =========================================================
   ประเภทข้อความในเนื้อเรื่อง

   ใช้สำหรับแยกการแสดงผลของนิยาย เช่น

   narration  = การบรรยาย
   dialogue   = บทสนทนา
   action     = การกระทำ / เหตุการณ์
   thought    = ความคิดของตัวละคร
   emphasis   = เหตุการณ์หรือข้อความสำคัญ
   scene      = เปลี่ยนฉาก / เวลา / สถานที่
========================================================= */

export type StoryContentBlockType =
  | 'narration'
  | 'dialogue'
  | 'action'
  | 'thought'
  | 'emphasis'
  | 'scene';

/* =========================================================
   ตัวละครที่พูด

   ใช้เฉพาะ dialogue
========================================================= */

export interface StoryDialogue {
  character?: string;
  text: string;
}

/* =========================================================
   Block ของเนื้อเรื่อง

   ตัวอย่าง:

   {
     type: 'narration',
     text: 'สายฝนตกลงมาอย่างไม่ขาดสาย...'
   }

   {
     type: 'dialogue',
     character: 'แทน',
     text: 'เราต้องไปเดี๋ยวนี้'
   }

   {
     type: 'action',
     text: 'เขาชักดาบออกจากฝัก'
   }

   {
     type: 'thought',
     text: 'นี่มันเกิดอะไรขึ้นกันแน่...'
   }
========================================================= */

export interface StoryContentBlock {
  id?: string;

  type: StoryContentBlockType;

  text: string;

  /**
   * ชื่อตัวละครสำหรับบทพูด
   */
  character?: string;

  /**
   * ใช้สำหรับกำหนดลำดับหรือจังหวะของเนื้อเรื่อง
   */
  order?: number;
}

/* =========================================================
   Chapter
========================================================= */

export interface Chapter {
  id: string;

  chapterNumber: number;

  title: string;

  /**
   * เนื้อเรื่องแบบเดิม
   *
   * เก็บเอาไว้เพื่อรองรับนิยายเก่า
   * และข้อมูลที่ยังไม่ได้ migrate
   */
  content: string;

  /**
   * เนื้อเรื่องแบบแบ่งประเภท
   *
   * ReaderView จะใช้ blocks เป็นหลัก
   */
  contentBlocks?: StoryContentBlock[];

  /**
   * ตัวเลือกสำหรับแตกแขนงเรื่อง
   *
   * จำกัดจำนวนที่แสดงในหน้าอ่านตาม ReaderView
   */
  choices?: string[];

  /**
   * การตัดสินใจของผู้ใช้ที่ทำให้เกิดบทนี้
   */
  userPromptChoice?: string;

  createdAt: string;
}

/* =========================================================
   ตัวละครประกอบ (NPC)

   ตัวละครเหล่านี้เป็น NPC ที่ผู้สร้างนิยายกำหนดไว้
   ตั้งแต่ตอนสร้าง Story
========================================================= */

export interface SupportingCharacter {
  name: string;

  gender: Gender;

  personality: string;

  items: string;
}

/* =========================================================
   Story
========================================================= */

export interface Story {
  id: string;

  title: string;

  corePremise: string;

  genre: Genre;

  tone: NarrativeTone;

  length: StoryLength;

  /* -------------------------------------------------------
     ตัวละครหลัก
  ------------------------------------------------------- */

  protagonist?: string;

  worldSetting?: string;

  /* -------------------------------------------------------
     ปกนิยาย
  ------------------------------------------------------- */

  coverUrl: string;

  author: string;

  /* -------------------------------------------------------
     ความคืบหน้า
  ------------------------------------------------------- */

  totalChapters: number;

  currentChapter: number;

  wordCount: number;

  /* -------------------------------------------------------
     สถานะปัจจุบันของเรื่อง
  ------------------------------------------------------- */

  currentLocation?: string;

  physicalCondition?: string;

  currentInventory?: string[];

  importantSituation?: string;

  /* -------------------------------------------------------
     สถานะเว็บไซต์
  ------------------------------------------------------- */

  isFavorite?: boolean;

  isTrending?: boolean;

  isFresh?: boolean;

  isBanned?: boolean;

  isPublished: boolean;

  /* -------------------------------------------------------
     บททั้งหมด
  ------------------------------------------------------- */

  chapters: Chapter[];
}

/* =========================================================
   Create Story Form Data
========================================================= */

export interface CreateStoryFormData {
  title: string;

  corePremise: string;

  genre: Genre;

  tone: NarrativeTone;

  length: StoryLength;

  /* -------------------------------------------------------
     ตัวละครหลัก
  ------------------------------------------------------- */

  protagonist: string;

  protagonistGender: Gender;

  protagonistPersonality: string;

  protagonistItems: string;

  /* -------------------------------------------------------
     ตัวละครประกอบ (NPC)

     สามารถเพิ่มได้หลายตัว

     ตัวอย่าง:

     supportingCharacters: [
       {
         name: 'แทน',
         gender: 'ชาย',
         personality: 'ใจเย็น ฉลาด...',
         items: 'ดาบสั้น, ยา'
       },
       {
         name: 'ทิว',
         gender: 'หญิง',
         personality: 'ร่าเริง...',
         items: 'ธนู, มีด'
       }
     ]
  ------------------------------------------------------- */

  supportingCharacters: SupportingCharacter[];

  /* -------------------------------------------------------
     โลก / ฉากหลัง
  ------------------------------------------------------- */

  worldSetting: string;
}