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

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
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

  protagonist?: string;
  worldSetting?: string;

  coverUrl: string;
  author: string;

  totalChapters: number;
  currentChapter: number;
  wordCount: number;

  isFavorite?: boolean;
  isTrending?: boolean;
  isFresh?: boolean;
  isBanned?: boolean;

  /*
   * สถานะการเผยแพร่นิยาย
   *
   * false = ส่วนตัว
   * true  = เผยแพร่แล้ว
   */
  isPublished: boolean;

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