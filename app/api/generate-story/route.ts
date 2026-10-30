import { NextResponse, after } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI } from '@google/genai';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isUserBanned } from '@/lib/auth/user';

/*
 * เวลาสูงสุดที่ route นี้ทำงานได้ (วินาที)
 * การสร้างบทยาว ๆ ด้วย Gemini ใช้เวลานาน ถ้าไม่ตั้งค่านี้
 * แพลตฟอร์ม serverless จะตัดที่ค่า default (มักสั้นมาก) แล้วผู้ใช้เห็นเป็น error
 */
export const maxDuration = 60;

const DEFAULT_MODELS = ['gemini-3.5-flash-lite'];

/*
 * ใช้เฉพาะ gemini-3.5-flash-lite
 * (ถ้าต้องการโมเดลสำรอง ตั้ง env GEMINI_MODELS คั่นด้วย comma ตามลำดับที่ต้องการ)
 */
const modelsToTry: string[] = (() => {
  const fromEnv = (process.env.GEMINI_MODELS || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : DEFAULT_MODELS;
})();

/*
 * ระดับการ "คิด" ของโมเดล (ไม่บังคับ) เช่น minimal / low
 * ลดระดับลงจะเร็วขึ้นมากสำหรับงานเขียนนิยาย
 * ปล่อยว่างไว้ = ใช้ค่า default ของโมเดล
 */
const THINKING_LEVEL = (process.env.GEMINI_THINKING_LEVEL || '').trim();

/*
 * จำนวนบทล่าสุดที่ส่งให้ AI แบบเต็ม ส่วนบทเก่ากว่านั้นส่งเฉพาะช่วงต้นบท
 * เพื่อไม่ให้ prompt โตตามจำนวนบทจนช้าลงเรื่อย ๆ
 */
const CONTEXT_FULL_CHAPTERS = Math.max(
  1,
  Number(process.env.STORY_CONTEXT_FULL_CHAPTERS) || 3
);

const CONTEXT_OLD_CHAPTER_CHARS = Math.max(
  100,
  Number(process.env.STORY_CONTEXT_OLD_CHAPTER_CHARS) || 600
);

type ExtractedRelationship = {
  from: string;
  to: string;
  relationship_type: string;
  description: string;
};

type GeneratedChapterResult = {
  title?: string;
  content: string;
  choices?: string[];
  status: {
    location: string;
    physicalCondition: string;
    inventory: string[];
    importantSituation: string;
  };
};

/* =========================================================
   Helper: Parse Generated Chapter

   - ตัดโค้ดบล็อก / ข้อความส่วนเกินรอบ JSON
   - requireChoices = true  → ต้องมี 3 ตัวเลือกพอดี
   - requireChoices = false → (บทสุดท้าย) ไม่ใช้ตัวเลือก
   ถ้าไม่ผ่านจะ throw เพื่อให้ตัวช่วยสร้างลองใหม่อัตโนมัติ
========================================================= */

function extractJsonObject(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw firstError;
  }
}

function parseGeneratedChapter(
  text: string,
  { requireChoices }: { requireChoices: boolean }
): GeneratedChapterResult {
  const parsed = extractJsonObject(text) as GeneratedChapterResult;

  if (
    !parsed ||
    typeof parsed.content !== 'string' ||
    !parsed.content.trim()
  ) {
    throw new Error('AI ส่งข้อมูลบทนิยายไม่ครบ');
  }

  const choices = Array.isArray(parsed.choices)
    ? parsed.choices
      .filter((choice): choice is string => typeof choice === 'string')
      .map((choice) => choice.trim())
      .filter(Boolean)
      .slice(0, 3)
    : [];

  if (requireChoices && choices.length !== 3) {
    throw new Error('AI ส่งตัวเลือกไม่ครบ 3 ตัวเลือก');
  }

  const status = parsed.status || ({} as GeneratedChapterResult['status']);

  return {
    title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
    content: parsed.content.trim(),
    choices: requireChoices ? choices : [],
    status: {
      location: typeof status.location === 'string' ? status.location.trim() : '',
      physicalCondition:
        typeof status.physicalCondition === 'string'
          ? status.physicalCondition.trim()
          : '',
      inventory: Array.isArray(status.inventory)
        ? status.inventory
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
        : [],
      importantSituation:
        typeof status.importantSituation === 'string'
          ? status.importantSituation.trim()
          : '',
    },
  };
}

/* =========================================================
   Helper: Gemini JSON Generation (retry + fallback)

   แก้ปัญหา "ต้องกดลองใหม่หลายรอบ":
   เดิม retry เฉพาะตอน API error / ข้อความว่าง ส่วน JSON เสีย
   หรือตัวเลือกไม่ครบ จะ error ทันที ทั้งที่ลองอีกครั้งมักผ่าน
   ตอนนี้ "สร้าง + ตรวจ/แปลง" อยู่ใน loop เดียวกัน

   - JSON/ตัวเลือกไม่ผ่าน → ลองโมเดลเดิมอีกครั้ง แล้วค่อยสลับโมเดล
   - API error → สลับโมเดลทันที ไม่หน่วงเวลา
   - โมเดลที่ error จะถูกพักชั่วคราว ไม่เสียเวลาลองซ้ำทุก request
   - มี timeout ต่อครั้ง และเพดานเวลารวมให้อยู่ในช่วง maxDuration
========================================================= */

class GeminiGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiGenerationError';
  }
}

const MODEL_COOLDOWN_MS = 60_000;
const modelCooldownUntil = new Map<string, number>();

function getModelOrder(): string[] {
  const now = Date.now();

  const healthy = modelsToTry.filter(
    (model) => (modelCooldownUntil.get(model) ?? 0) <= now
  );

  // ถ้าทุกตัวถูกพักอยู่ ให้ลองทั้งหมดตามลำดับเดิม
  return healthy.length > 0 ? healthy : modelsToTry;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function generateValidatedJson<T>({
  ai,
  prompt,
  parse,
  label,
  totalBudgetMs = 52_000,
  attemptTimeoutMs = 40_000,
  maxAttempts = 6,
}: {
  ai: GoogleGenAI;
  prompt: string;
  parse: (text: string) => T;
  label: string;
  totalBudgetMs?: number;
  attemptTimeoutMs?: number;
  maxAttempts?: number;
}): Promise<T> {
  const startedAt = Date.now();
  const models = getModelOrder();

  let attempts = 0;
  let lastError = '';

  for (const model of models) {
    // มีโมเดลเดียว → ลองซ้ำได้ 3 ครั้ง, มีสำรอง → ลองโมเดลเดิมซ้ำ 1 ครั้งก่อนสลับ
    const triesPerModel = models.length === 1 ? 3 : 2;

    for (let tryOnModel = 0; tryOnModel < triesPerModel; tryOnModel++) {
      const remaining = totalBudgetMs - (Date.now() - startedAt);

      if (attempts >= maxAttempts || remaining < 6_000) {
        throw new GeminiGenerationError(
          lastError || 'หมดเวลาในการสร้างเนื้อหา'
        );
      }

      attempts++;

      const controller = new AbortController();
      const timeoutMs = Math.min(attemptTimeoutMs, remaining);
      let timer: ReturnType<typeof setTimeout> | undefined;

      let text = '';

      try {
        console.log(
          `🤖 [${label}] attempt ${attempts} → ${model}`
        );

        const request = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            abortSignal: controller.signal,
            ...(THINKING_LEVEL
              ? {
                thinkingConfig: {
                  thinkingLevel: THINKING_LEVEL,
                },
              }
              : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        });

        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(
              new Error(`${model} timed out after ${timeoutMs}ms`)
            );
          }, timeoutMs);
        });

        const response = await Promise.race([request, timeout]);

        text = response.text || '';

        const finishReason =
          response.candidates?.[0]?.finishReason;

        if (!text.trim()) {
          throw new Error(
            `${model} returned empty response${finishReason ? ` (${finishReason})` : ''
            }`
          );
        }

        if (String(finishReason) === 'MAX_TOKENS') {
          throw new Error(`${model} output was truncated (MAX_TOKENS)`);
        }
      } catch (error) {
        // API error / timeout / ว่างเปล่า → สลับไปโมเดลถัดไปทันที
        lastError = describeError(error);

        console.error(
          `❌ [${label}] Gemini error (${model}):`,
          lastError
        );

        if (models.length === 1 && tryOnModel < triesPerModel - 1) {
          // มีโมเดลเดียว ไม่มีตัวสำรอง → ลองซ้ำอีกครั้งหลังพักสั้น ๆ
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }

        modelCooldownUntil.set(model, Date.now() + MODEL_COOLDOWN_MS);
        break;
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }

      try {
        const result = parse(text);

        // ใช้งานได้ → เอาโมเดลนี้ออกจากรายการพัก (ถ้ามี)
        modelCooldownUntil.delete(model);

        console.log(
          `✅ [${label}] ok (${model}, attempt ${attempts}, ${Date.now() - startedAt}ms)`
        );

        return result;
      } catch (error) {
        // ผลลัพธ์ไม่ผ่านการตรวจ → ลองอีกครั้ง (โมเดลเดิมก่อน)
        lastError = describeError(error);

        console.error(
          `⚠️ [${label}] invalid output (${model}):`,
          lastError
        );
      }
    }
  }

  throw new GeminiGenerationError(
    lastError || 'AI ไม่สามารถสร้างเนื้อหาได้'
  );
}

/* =========================================================
   Helper: Build Chapter Context

   ประกอบบทก่อนหน้าจากฐานข้อมูลฝั่งเซิร์ฟเวอร์ (ไม่เชื่อข้อมูลจาก client
   และไม่ต้องอัปโหลดเนื้อเรื่องทั้งหมดทุกครั้ง)
   - บทล่าสุด CONTEXT_FULL_CHAPTERS บท → ส่งเต็ม
   - บทเก่ากว่า → ส่งเฉพาะช่วงต้นบท + การตัดสินใจของผู้เล่น
========================================================= */

type ContextChapter = {
  chapterNumber: number;
  title?: string | null;
  content?: string | null;
  userChoice?: string | null;
};

function buildChapterContext(chapters: ContextChapter[]): string {
  const sorted = [...chapters].sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  const fullFrom = Math.max(0, sorted.length - CONTEXT_FULL_CHAPTERS);

  return sorted
    .map((chapter, index) => {
      const content = chapter.content || '';
      const isFull = index >= fullFrom;

      const body = isFull
        ? content
        : content.length > CONTEXT_OLD_CHAPTER_CHARS
          ? `${content.slice(0, CONTEXT_OLD_CHAPTER_CHARS)}\n... (ตัดทอน เหลือเฉพาะช่วงต้นบท)`
          : content;

      const decision =
        !isFull && chapter.userChoice
          ? `\nการตัดสินใจของผู้เล่นก่อนบทนี้: ${chapter.userChoice}`
          : '';

      return `
บทที่ ${chapter.chapterNumber || ''}

ชื่อบท:
${chapter.title || ''}${decision}

เนื้อหา:
${body}
`;
    })
    .join('\n');
}

/* =========================================================
   Helper: Get / Create Game Session
========================================================= */

async function getOrCreateGameSession(
  userId: string,
  storyId: string,
  currentChapter: number
) {
  const { data: existingSession, error: findError } =
    await supabaseAdmin
      .from('game_sessions')
      .select(
        'id, user_id, story_id, current_chapter, status, current_inventory, current_location, physical_condition, important_situation, is_public'
      )
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .maybeSingle();

  if (findError) {
    console.error(
      'Find Game Session Error:',
      JSON.stringify(findError, null, 2)
    );
  }

  if (existingSession) {
    return existingSession;
  }

  const { data: newSession, error: createError } =
    await supabaseAdmin
      .from('game_sessions')
      .insert({
        user_id: userId,
        story_id: storyId,
        current_chapter: currentChapter,
        status: 'in_progress',
        current_inventory: [],
        current_location: '',
        physical_condition: '',
        important_situation: '',
        is_public: false,
      })
      .select()
      .single();

  if (createError) {
    if (createError.code === '23505') {
      console.log(
        '⚠️ Session already exists, loading existing session...'
      );

      const {
        data: existingSessionAfterConflict,
        error: reloadError,
      } = await supabaseAdmin
        .from('game_sessions')
        .select(
          'id, user_id, story_id, current_chapter, status, current_inventory, current_location, physical_condition, important_situation, is_public'
        )
        .eq('user_id', userId)
        .eq('story_id', storyId)
        .maybeSingle();

      if (reloadError) {
        console.error(
          'Reload Game Session Error:',
          JSON.stringify(reloadError, null, 2)
        );

        return null;
      }

      if (existingSessionAfterConflict) {
        console.log(
          '✅ Using existing game session after conflict:',
          existingSessionAfterConflict.id
        );

        return existingSessionAfterConflict;
      }
    }

    console.error(
      'Create Game Session Error:',
      JSON.stringify(createError, null, 2)
    );

    return null;
  }

  if (!newSession) {
    console.error(
      'Game session was not created'
    );

    return null;
  }

  console.log(
    '✅ New game session created:',
    newSession.id
  );

  return newSession;
}

/* =========================================================
   Helper: Save Chat Log
========================================================= */

async function saveChatLog(
  sessionId: string,
  chapter: number,
  role: 'user' | 'model',
  content: string
) {
  if (!content || !content.trim()) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('chat_logs')
    .insert({
      session_id: sessionId,
      chapter,
      role,
      content: content.trim(),
    });

  if (error) {
    console.error(
      'Chat Log Error:',
      JSON.stringify(error, null, 2)
    );
  } else {
    console.log(
      `✅ Chat log saved: ${role} / chapter ${chapter}`
    );
  }
}

/* =========================================================
   Helper: Initialize Session Characters
========================================================= */

async function initializeSessionCharacters(
  sessionId: string,
  storyId: string
) {
  try {
    /* =====================================================
       Load Base Characters
    ===================================================== */

    const [baseResult, existingResult] = await Promise.all([
      supabaseAdmin
        .from('characters')
        .select(
          'id, name, gender, role, appearance, personality, initial_items'
        )
        .eq('story_id', storyId),
      supabaseAdmin
        .from('session_characters')
        .select('id, name')
        .eq('session_id', sessionId),
    ]);

    const {
      data: baseCharacters,
      error: baseCharacterError,
    } = baseResult;

    const {
      data: existingSessionCharacters,
      error: existingSessionCharacterError,
    } = existingResult;

    if (baseCharacterError) {
      console.error(
        '❌ Load Base Characters Error:',
        JSON.stringify(baseCharacterError, null, 2)
      );

      return;
    }

    if (!baseCharacters || baseCharacters.length === 0) {
      console.log(
        'ℹ️ No base characters to initialize'
      );

      return;
    }

    if (existingSessionCharacterError) {
      console.error(
        '❌ Load Session Characters Error:',
        JSON.stringify(
          existingSessionCharacterError,
          null,
          2
        )
      );

      return;
    }

    const existingNames = new Set(
      (existingSessionCharacters || []).map(
        (character) =>
          character.name.trim().toLowerCase()
      )
    );

    /* =====================================================
       Copy Base Characters Into Session
    ===================================================== */

    const charactersToInsert =
      baseCharacters
        .filter(
          (character) =>
            !existingNames.has(
              character.name.trim().toLowerCase()
            )
        )
        .map((character) => ({
          session_id: sessionId,
          base_character_id: character.id,
          name: character.name,
          gender: character.gender,
          role: character.role,
          appearance: character.appearance,
          personality: character.personality,
          initial_items:
            Array.isArray(character.initial_items)
              ? character.initial_items
              : [],
        }));

    if (charactersToInsert.length === 0) {
      console.log(
        'ℹ️ Session characters already initialized'
      );

      return;
    }

    const {
      error: insertError,
    } = await supabaseAdmin
      .from('session_characters')
      .insert(charactersToInsert);

    if (insertError) {
      console.error(
        '❌ Initialize Session Characters Error:',
        JSON.stringify(insertError, null, 2)
      );

      return;
    }

    console.log(
      `✅ Initialized ${charactersToInsert.length} session character(s)`
    );
  } catch (error) {
    console.error(
      '❌ Initialize Session Characters Exception:',
      error
    );
  }
}

/* =========================================================
   Helper: Load Session Characters / Relationships
========================================================= */

async function loadSessionCharacterContext(
  sessionId: string
) {
  try {
    const [characterResult, relationshipResult] = await Promise.all([
      supabaseAdmin
        .from('session_characters')
        .select(`
          id,
          name,
          gender,
          role,
          appearance,
          personality,
          initial_items
        `)
        .eq('session_id', sessionId)
        .order('created_at', {
          ascending: true,
        }),
      supabaseAdmin
        .from('session_character_relationships')
        .select(`
          id,
          from_character_id,
          to_character_id,
          relationship_type,
          description
        `)
        .eq('session_id', sessionId)
        .order('created_at', {
          ascending: true,
        }),
    ]);

    const {
      data: characters,
      error: characterError,
    } = characterResult;

    if (characterError) {
      console.error(
        '❌ Load Session Characters Context Error:',
        JSON.stringify(
          characterError,
          null,
          2
        )
      );

      return {
        characters: [],
        relationships: [],
      };
    }

    const {
      data: relationships,
      error: relationshipError,
    } = relationshipResult;

    if (relationshipError) {
      console.error(
        '❌ Load Session Relationships Context Error:',
        JSON.stringify(
          relationshipError,
          null,
          2
        )
      );

      return {
        characters: characters || [],
        relationships: [],
      };
    }

    return {
      characters: characters || [],
      relationships: relationships || [],
    };
  } catch (error) {
    console.error(
      '❌ Load Session Character Context Exception:',
      error
    );

    return {
      characters: [],
      relationships: [],
    };
  }
}

/* =========================================================
   Helper: Sync Character Relationships From Chapter

   สำคัญ:
   - ไม่สร้าง Character ใหม่
   - Character สำคัญต้องมาจาก Story ตอนสร้างเท่านั้น
   - ตรวจจับเฉพาะ Relationship ของตัวละครที่มีอยู่แล้ว
========================================================= */

async function syncCharactersFromChapter({
  ai,
  storyId,
  sessionId,
  chapterNumber,
  chapterContent,
}: {
  ai: GoogleGenAI;
  storyId: string;
  sessionId: string;
  chapterNumber: number;
  chapterContent: string;
}) {
  try {
    console.log(
      '========================================'
    );

    console.log(
      `CHARACTER SYNC START - CHAPTER ${chapterNumber}`
    );

    console.log(
      'Story ID:',
      storyId
    );

    console.log(
      'Session ID:',
      sessionId
    );

    /* =====================================================
       1. Initialize Session Characters

       Character ทั้งหมดต้องมาจาก Base Characters
       ที่เจ้าของกำหนดตอนสร้างเรื่อง
    ===================================================== */

    await initializeSessionCharacters(
      sessionId,
      storyId
    );

    /* =====================================================
       2. Load Existing Session Characters
    ===================================================== */

    const {
      data: existingCharacters,
      error: existingCharacterError,
    } = await supabaseAdmin
      .from('session_characters')
      .select(
        'id, base_character_id, name, gender, role, appearance, personality, initial_items'
      )
      .eq(
        'session_id',
        sessionId
      );

    if (existingCharacterError) {
      console.error(
        '❌ Load Session Characters Error:',
        JSON.stringify(
          existingCharacterError,
          null,
          2
        )
      );

      return;
    }

    const characters =
      existingCharacters || [];

    console.log(
      'Session Characters:',
      characters.map(
        (character) =>
          `${character.name} (${character.role})`
      )
    );

    /* =====================================================
       3. Find Protagonist
    ===================================================== */

    const protagonist =
      characters.find(
        (character) =>
          character.role === 'player'
      );

    const protagonistName =
      protagonist?.name || '';

    console.log(
      'Protagonist:',
      protagonistName || 'ไม่พบตัวเอก'
    );

    /* =====================================================
       4. Create Character List For AI

       สำคัญ:
       ส่งเฉพาะตัวละครที่มีอยู่แล้ว
       เพื่อให้ AI ตรวจจับ Relationship เท่านั้น
    ===================================================== */

    const characterList =
      characters.length > 0
        ? characters
          .map(
            (character) =>
              `- ${character.name} [${character.role}]`
          )
          .join('\n')
        : 'ยังไม่มีตัวละคร';

    /* =====================================================
       5. Relationship Extraction Prompt

       ห้ามสร้าง Character ใหม่
    ===================================================== */

    const extractionPrompt = `
คุณคือระบบวิเคราะห์ความสัมพันธ์ของตัวละคร
สำหรับเกม Interactive Novel ของ GonnaTales

หน้าที่ของคุณคืออ่านข้อความบทที่ ${chapterNumber}
แล้วตรวจจับ "ความสัมพันธ์ระหว่างตัวละคร"
จากเหตุการณ์ที่เกิดขึ้นจริงในบทนี้

==================================================
ตัวละครที่มีอยู่ใน Database
==================================================

${characterList}

ตัวละครเอกของเรื่องคือ:

${protagonistName || 'ไม่ทราบ'}

==================================================
กฎสำคัญมาก
==================================================

1. ห้ามสร้างตัวละครใหม่โดยเด็ดขาด

2. ห้ามสร้างหรือเพิ่มตัวละครใหม่ใด ๆ

3. ตัวละครที่สามารถใช้ใน relationships
   ต้องเป็นตัวละครที่มีอยู่ใน Database ด้านบนเท่านั้น

4. หากบทพูดถึงบุคคลที่ไม่มีอยู่ใน Database
   เช่น
   - ชาวบ้าน
   - ทหาร
   - คนขายของ
   - หญิงสาวนิรนาม
   - ชายแปลกหน้า
   - ฝูงชน
   - ผู้คนทั่วไป

   ให้ถือว่าเป็นบุคคลทั่วไป
   และห้ามสร้างเป็น Character

5. หากมีบุคคลใหม่ที่มีบทบาทสำคัญในเรื่อง
   แต่ไม่มีอยู่ใน Database
   ให้ "ไม่ต้องสร้างตัวละคร"
   และไม่ต้องสร้าง Relationship กับบุคคลนั้น

6. ห้ามเดาชื่อตัวละครใหม่จากเนื้อเรื่อง

==================================================
กฎการตรวจจับ Relationship
==================================================

ให้ตรวจจับเฉพาะความสัมพันธ์ที่เนื้อเรื่อง
ระบุหรือสื่ออย่างชัดเจน

ตัวอย่าง:

"เธอเป็นแฟนของอาร์เธอร์"

ถ้า "เธอ" ไม่มีอยู่ใน Database
→ ห้ามสร้าง Relationship

ถ้ามี:

มีนา
อาร์เธอร์

ให้สร้าง:

{
  "from": "มีนา",
  "to": "อาร์เธอร์",
  "relationship_type": "แฟน",
  "description": "มีนาเป็นแฟนของอาร์เธอร์"
}

==================================================
ตัวอย่าง Relationship
==================================================

"เขาเป็นเพื่อนสนิทของอาร์เธอร์"
→ relationship_type = "เพื่อน"

"หญิงสาวคนนั้นคือพี่สาวของอาร์เธอร์"
→ relationship_type = "พี่น้อง"

"ทั้งสองคนรักกัน"
→ relationship_type = "คนรัก"

"เขาเป็นศัตรูกับอาร์เธอร์"
→ relationship_type = "ศัตรู"

==================================================
กฎเกี่ยวกับตัวเอก
==================================================

ถ้าเนื้อเรื่องใช้คำว่า:

"ตัวเอก"
"พระเอก"
"นางเอก"
"ผู้เล่น"

ให้ตีความว่าเป็น:

${protagonistName || 'ไม่ทราบ'}

ห้ามใช้คำเหล่านี้ใน from หรือ to
ถ้ามีตัวละครเอกอยู่ใน Database

ตัวอย่าง:

ผิด:

{
  "from": "มีนา",
  "to": "ตัวเอก"
}

ถูก:

{
  "from": "มีนา",
  "to": "${protagonistName || 'ชื่อตัวเอก'}"
}

==================================================
กฎการจับคู่ชื่อ
==================================================

ถ้า Database มี:

"อาร์เธอร์ เพนเดิลตัน"

และเนื้อเรื่องเขียน:

"อาร์เธอร์"

ให้ใช้:

"อาร์เธอร์ เพนเดิลตัน"

ใน Relationship

==================================================
สำคัญที่สุด
==================================================

หากตัวละครไม่มีอยู่ใน Database:

ห้ามสร้าง Character
ห้ามเพิ่ม Character
ห้ามสร้าง Relationship กับตัวละครนั้น

ให้สนใจเฉพาะตัวละครที่มีอยู่แล้วเท่านั้น

==================================================
รูปแบบ JSON
==================================================

ตอบ JSON เท่านั้น

{
  "relationships": [
    {
      "from": "ชื่อตัวละครที่มีอยู่ใน Database",
      "to": "ชื่อตัวละครที่มีอยู่ใน Database",
      "relationship_type": "ประเภทความสัมพันธ์",
      "description": "รายละเอียด"
    }
  ]
}

ถ้าไม่มีความสัมพันธ์ใหม่:

{
  "relationships": []
}

==================================================
บทนิยาย
==================================================

${chapterContent}
`;

    /* =====================================================
       6. Call Gemini
    ===================================================== */

    let extractionText = '';

    for (
      let i = 0;
      i < modelsToTry.length;
      i++
    ) {
      try {
        const response =
          await ai.models.generateContent({
            model:
              modelsToTry[i],

            contents:
              extractionPrompt,

            config: {
              responseMimeType:
                'application/json',
            },
          });

        extractionText =
          response.text || '';

        if (
          extractionText.trim()
        ) {
          break;
        }
      } catch (error) {
        console.error(
          `Relationship extraction error (${modelsToTry[i]}):`,
          error
        );

        if (i < modelsToTry.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 300)
          );
        }
      }
    }

    if (
      !extractionText.trim()
    ) {
      console.error(
        '❌ Relationship extraction returned empty result'
      );

      return;
    }

    console.log(
      'RAW RELATIONSHIP EXTRACTION:',
      extractionText
    );

    /* =====================================================
       7. Parse JSON
    ===================================================== */

    let extracted: {
      relationships?: ExtractedRelationship[];
    };

    try {
      extracted =
        JSON.parse(
          extractionText
        );
    } catch (error) {
      console.error(
        '❌ Relationship JSON Parse Error:',
        error
      );

      return;
    }

    const relationships =
      Array.isArray(
        extracted.relationships
      )
        ? extracted.relationships
        : [];

    console.log(
      'Detected Relationships:',
      relationships
    );

    /* =====================================================
       8. Build Character Resolver
    ===================================================== */

    const currentCharacters =
      characters;

    const currentProtagonist =
      currentCharacters.find(
        (character) =>
          character.role === 'player'
      );

    function normalizeName(
      value: string
    ) {
      return value
        .trim()
        .toLowerCase()
        .replace(
          /\s+/g,
          ' '
        );
    }

    function resolveCharacter(
      value: string
    ) {
      if (!value) {
        return null;
      }

      const normalized =
        normalizeName(value);

      /* -----------------------------------------------
         Protagonist aliases
      ------------------------------------------------ */

      if (
        normalized === 'ตัวเอก' ||
        normalized === 'พระเอก' ||
        normalized === 'นางเอก' ||
        normalized === 'ผู้เล่น' ||
        normalized === 'protagonist' ||
        normalized === 'player'
      ) {
        return (
          currentProtagonist ||
          null
        );
      }

      /* -----------------------------------------------
         Exact match
      ------------------------------------------------ */

      const exact =
        currentCharacters.find(
          (character) =>
            normalizeName(
              character.name
            ) === normalized
        );

      if (exact) {
        return exact;
      }

      /* -----------------------------------------------
         Partial match
      ------------------------------------------------ */

      const partial =
        currentCharacters.find(
          (character) => {
            const name =
              normalizeName(
                character.name
              );

            return (
              name.includes(
                normalized
              ) ||
              normalized.includes(
                name
              )
            );
          }
        );

      if (partial) {
        return partial;
      }

      return null;
    }

    /* =====================================================
       9. Save Relationships

       สำคัญ:
       Relationship ต้องอ้างอิง Character
       ที่มีอยู่ใน Session เท่านั้น
    ===================================================== */

    for (
      const relationship of
      relationships
    ) {
      if (
        !relationship ||
        !relationship.from ||
        !relationship.to ||
        !relationship.relationship_type
      ) {
        continue;
      }

      const fromCharacter =
        resolveCharacter(
          relationship.from
        );

      const toCharacter =
        resolveCharacter(
          relationship.to
        );

      console.log(
        'Resolving session relationship:',
        {
          from:
            relationship.from,

          to:
            relationship.to,

          type:
            relationship.relationship_type,

          resolvedFrom:
            fromCharacter?.name ||
            null,

          resolvedTo:
            toCharacter?.name ||
            null,
        }
      );

      /* -----------------------------------------------
         Character ไม่พบ

         ไม่สร้าง Character ใหม่
         และไม่บันทึก Relationship
      ------------------------------------------------ */

      if (
        !fromCharacter ||
        !toCharacter
      ) {
        console.warn(
          '⚠️ Relationship skipped - character not found:',
          {
            from:
              relationship.from,

            to:
              relationship.to,
          }
        );

        continue;
      }

      /* -----------------------------------------------
         Prevent self relationship
      ------------------------------------------------ */

      if (
        fromCharacter.id ===
        toCharacter.id
      ) {
        continue;
      }

      /* -----------------------------------------------
         Check existing relationship
      ------------------------------------------------ */

      const {
        data:
        existingRelationship,
      } = await supabaseAdmin
        .from(
          'session_character_relationships'
        )
        .select('id')
        .eq(
          'session_id',
          sessionId
        )
        .eq(
          'from_character_id',
          fromCharacter.id
        )
        .eq(
          'to_character_id',
          toCharacter.id
        )
        .maybeSingle();

      if (
        existingRelationship
      ) {
        console.log(
          'Session relationship already exists:',
          fromCharacter.name,
          '→',
          toCharacter.name
        );

        continue;
      }

      /* -----------------------------------------------
         Insert Session Relationship
      ------------------------------------------------ */

      const {
        error:
        relationshipError,
      } = await supabaseAdmin
        .from(
          'session_character_relationships'
        )
        .insert({
          session_id:
            sessionId,

          from_character_id:
            fromCharacter.id,

          to_character_id:
            toCharacter.id,

          relationship_type:
            relationship.relationship_type
              .trim(),

          description:
            relationship.description
              ?.trim() ||
            null,
        });

      if (
        relationshipError
      ) {
        console.error(
          '❌ Session Relationship Insert Error:',
          JSON.stringify(
            relationshipError,
            null,
            2
          )
        );
      } else {
        console.log(
          `✅ Session Relationship Created: ${fromCharacter.name} → ${toCharacter.name} (${relationship.relationship_type})`
        );
      }
    }

    console.log(
      `✅ CHARACTER SYNC COMPLETE - CHAPTER ${chapterNumber}`
    );

    console.log(
      '========================================'
    );
  } catch (error) {
    console.error(
      '❌ Character Sync Error:',
      error
    );
  }
}

/* =========================================================
   Helper: Parse Initial Items
========================================================= */

function parseInitialItems(value: unknown): string[] {
  if (typeof value !== 'string') return [];

  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
   POST
========================================================= */

export async function POST(req: Request) {
  try {
    /* =====================================================
       Authentication
    ===================================================== */

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'กรุณาเข้าสู่ระบบก่อนสร้างนิยาย',
        },
        { status: 401 }
      );
    }

    const [banned, body] = await Promise.all([
      isUserBanned(userId),
      req.json(),
    ]);

    if (banned) {
      return NextResponse.json(
        {
          success: false,
          error:
            'บัญชีของคุณถูกระงับการใช้งาน',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       Gemini API Key
    ===================================================== */

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบ GEMINI_API_KEY',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       Request Data
    ===================================================== */

    const {
      actionType,
      formData,
      previousChapters = [],
      userChoice,
      storyTitle,
      genre,
      tone,
      storyId,
    } = body;

    /* =====================================================
       Validate Action
    ===================================================== */

    if (
      actionType !==
      'create_story' &&
      actionType !==
      'next_chapter'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'actionType ไม่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    /* =========================================================
       CREATE STORY
    ========================================================= */

    if (
      actionType ===
      'create_story'
    ) {
      if (!formData) {
        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่พบข้อมูลสำหรับสร้างนิยาย',
          },
          { status: 400 }
        );
      }

      if (!formData.title?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'กรุณาระบุชื่อเรื่อง',
          },
          { status: 400 }
        );
      }

      if (!formData.corePremise?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'กรุณาระบุเรื่องย่อ / แก่นเรื่อง',
          },
          { status: 400 }
        );
      }

      if (!formData.protagonist?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'กรุณาระบุชื่อตัวละครหลัก',
          },
          { status: 400 }
        );
      }

      /* =====================================================
         Story ID
      ===================================================== */

      const finalStoryId =
        storyId ||
        crypto.randomUUID();

      console.log(
        '========================================'
      );

      console.log(
        'CREATE STORY START'
      );

      console.log(
        'Story ID:',
        finalStoryId
      );

      console.log(
        'User ID:',
        userId
      );

      /* =====================================================
         Check Existing Story
      ===================================================== */

      const {
        data: existingStory,
        error:
        existingStoryError,
      } = await supabaseAdmin
        .from('stories')
        .select('id')
        .eq(
          'id',
          finalStoryId
        )
        .eq(
          'user_id',
          userId
        )
        .maybeSingle();

      if (
        existingStoryError
      ) {
        console.error(
          'Existing Story Check Error:',
          JSON.stringify(
            existingStoryError,
            null,
            2
          )
        );
      }

      if (existingStory) {
        return NextResponse.json({
          success: true,
          storyId:
            existingStory.id,
          alreadyCreated: true,
        });
      }

      /* =====================================================
         Gemini
      ===================================================== */

      const ai =
        new GoogleGenAI({
          apiKey,
        });

      /*
       * AI prompt เดิม
       * ไม่เปลี่ยน logic การเขียนเรื่อง
       */

      const supportingCharacters = Array.isArray(
        formData.supportingCharacters
      )
        ? formData.supportingCharacters
          .filter(
            (character: any) =>
              character &&
              typeof character.name === 'string' &&
              character.name.trim()
          )
          .map((character: any) => ({
            name: character.name.trim(),
            gender:
              character.gender === 'ชาย' ||
                character.gender === 'หญิง' ||
                character.gender === 'ไม่ระบุ'
                ? character.gender
                : 'ไม่ระบุ',
            personality:
              typeof character.personality === 'string' &&
                character.personality.trim()
                ? character.personality.trim()
                : 'ตัวละครประกอบของเรื่อง',
            initial_items: parseInitialItems(character.items),
          }))
        : [];

      const supportingCharacterPrompt =
        supportingCharacters.length > 0
          ? supportingCharacters
            .map(
              (
                character: {
                  name: string;
                  gender: 'ชาย' | 'หญิง' | 'ไม่ระบุ';
                  personality: string;
                  initial_items: string[];
                },
                index: number
              ) => `NPC ${index + 1}:
ชื่อ: ${character.name}
เพศ: ${character.gender}
นิสัยและความสามารถ: ${character.personality}
ของที่พกติดตัว: ${character.initial_items.length > 0
                  ? character.initial_items.join(', ')
                  : 'ไม่มี'
                }`
            )
            .join('\n\n')
          : 'ไม่มี NPC ที่ผู้สร้างกำหนดไว้ล่วงหน้า';

      const systemPrompt = `
คุณคือ AI นักเขียนนิยายสำหรับแอป GonnaTales

หน้าที่คือเขียนนิยาย Interactive Novel ภาษาไทย
โดยผู้เล่นสามารถตัดสินใจเพื่อกำหนดเหตุการณ์ของบทถัดไป

ข้อมูลนิยาย:
ชื่อเรื่อง: ${formData.title || 'นิยายไม่มีชื่อ'}
แนว: ${formData.genre || 'แฟนตาซี'}
โทน: ${formData.tone || 'มืดมนและสมจริง'}
เรื่องย่อ / แก่นเรื่อง: ${formData.corePremise || ''}
ตัวละครเอก: ${formData.protagonist || 'ไม่ระบุ'}
เพศตัวละครเอก: ${formData.protagonistGender || 'ไม่ระบุ'}
นิสัยและความสามารถของตัวละครเอก: ${formData.protagonistPersonality || 'ไม่ระบุ'}
ของที่ตัวละครเอกพกติดตัว: ${formData.protagonistItems || 'ไม่มี'}
ตัวละครประกอบ (NPC) ที่ผู้สร้างกำหนด:
${supportingCharacterPrompt}
โลกหรือสถานที่: ${formData.worldSetting || 'ไม่ระบุ'}

กฎสำคัญ:
- ต้องรักษาข้อมูลตัวละครที่ผู้สร้างกำหนด
- ห้ามเปลี่ยนนิสัยหรือความสามารถหลักโดยไม่มีเหตุผลในเรื่อง
- ห้ามสร้างตัวละครสำคัญใหม่ที่ไม่ได้อยู่ในข้อมูลผู้สร้าง
- สิ่งของเริ่มต้นของตัวละครต้องถูกใช้ตามความเหมาะสมและความต่อเนื่อง
- เนื้อเรื่องต้องสอดคล้องกับแนว โทน โลก และแก่นเรื่อง
- ต้องจบบทด้วยสถานการณ์ที่ทำให้ผู้เล่นตัดสินใจต่อได้

เขียนบทที่ 1 โดยตอบเป็น JSON เท่านั้น ห้ามใส่ Markdown หรือ code fence

กฎการจัดประเภทเนื้อหาใน content:
- การบรรยายทั่วไป ไม่ต้องใส่ marker
- บทพูดของตัวละคร ให้ขึ้นต้นด้วย [dialogue]
- ความคิดของตัวละคร ให้ขึ้นต้นด้วย [thought]
- การกระทำหรือเหตุการณ์ที่เกิดขึ้น ให้ขึ้นต้นด้วย [action]
- เหตุการณ์สำคัญหรือจุดที่ต้องการเน้น ให้ขึ้นต้นด้วย [important]

ตัวอย่าง:

ฝนตกหนักตั้งแต่ช่วงเย็น ถนนทั้งสายแทบไม่มีผู้คน

[action] เขาหยุดเดินและมองไปยังบ้านหลังเก่า

[dialogue] "คุณยังกลับมาที่นี่อีกทำไม?"

[thought] ฉันรู้ดีว่าที่นี่ไม่ควรมีใครอยู่

เสียงประตูชั้นบนดังขึ้นอย่างช้า ๆ

[important] แล้วไฟทั้งบ้านก็ดับลงพร้อมกัน

ข้อกำหนดสำคัญ:
- marker ต้องอยู่ต้นย่อหน้า
- ใช้เฉพาะ [dialogue], [thought], [action], [important]
- ห้ามใช้ HTML
- ห้ามใช้ CSS
- ห้ามใส่สี
- ห้ามใส่ emoji
- ห้ามใช้ Markdown
- ห้ามใส่ marker อื่นนอกเหนือจากที่กำหนด
- อย่าใส่คำอธิบายประเภท เช่น "บทสนทนา:" หรือ "ความคิด:"
- content ต้องเป็นเนื้อหานิยายจริงเท่านั้น

รูปแบบ JSON ที่ต้องส่งกลับ:
{
  "title": "ชื่อบทที่เหมาะสม",
  "content": "เนื้อหานิยายเท่านั้น ไม่ต้องใส่คำว่า บทที่ 1",
  "choices": [
    "แนวทางที่หนึ่ง",
    "แนวทางที่สอง",
    "แนวทางที่สาม"
  ],
  "status": {
    "location": "สถานที่ปัจจุบันของผู้เล่น",
    "physicalCondition": "สภาพร่างกายปัจจุบัน",
    "inventory": ["สิ่งของที่ผู้เล่นมีอยู่จริง"],
    "importantSituation": "สถานการณ์สำคัญที่กำลังเกิดขึ้น"
  }
}

กฎของ choices:
- ต้องมี 3 ตัวเลือกพอดี
- ตัวเลือกต้องเกิดจากสถานการณ์จริงตอนจบบท
- ทั้ง 3 ตัวเลือกควรนำไปสู่การดำเนินเรื่องที่แตกต่างกัน
- ห้ามเป็นตัวเลือกซ้ำกันหรือเปลี่ยนคำเฉย ๆ
- เป็นแนวทางการกระทำของผู้เล่น ไม่ใช่คำถามลอย ๆ
- ผู้เล่นสามารถพิมพ์การตัดสินใจเองได้ แม้ไม่เลือกจาก 3 แนวทาง

กฎของ status:
- ต้องสะท้อนเหตุการณ์ที่เกิดขึ้นจริงในบทนี้
- location คือสถานที่ที่ผู้เล่นอยู่เมื่อจบบท
- physicalCondition คือสภาพร่างกายล่าสุด เช่น ปกติ เหนื่อย มีบาดแผลเล็กน้อย
- inventory ต้องมีเฉพาะสิ่งของที่ผู้เล่นมีจริง ณ ตอนจบบท
- ห้ามเพิ่มสิ่งของที่ไม่ได้รับหรือไม่ได้มีมาก่อน
- importantSituation ต้องสรุปปัญหาหรือเหตุการณ์สำคัญที่กำลังดำเนินอยู่
- status ต้องสั้นและอ่านง่าย

ความยาวบท:
- บทที่ 1 ต้องมีเนื้อหาค่อนข้างละเอียด ไม่ใช่บทสรุปสั้น ๆ
- เขียนอย่างน้อยประมาณ 1,200–1,800 คำภาษาไทย หรือความยาวใกล้เคียงกัน
- แบ่งเป็นหลายย่อหน้าอย่างเป็นธรรมชาติ ประมาณ 10–16 ย่อหน้า
- แต่ละย่อหน้าควรมีรายละเอียดของฉาก การกระทำ ความคิด ความรู้สึก หรือบทสนทนาตามความเหมาะสม
- ห้ามเร่งเหตุการณ์หลายเหตุการณ์จนจบภายในไม่กี่ย่อหน้า
- อย่าใส่เนื้อหานอกเหนือจากนิยายลงใน content
- ห้ามอธิบายว่าเป็น AI
`;

      let generatedChapter: GeneratedChapterResult;

      try {
        generatedChapter = await generateValidatedJson({
          ai,
          prompt: systemPrompt,
          label: 'create_story',
          parse: (text) =>
            parseGeneratedChapter(text, { requireChoices: true }),
        });
      } catch (error) {
        console.error('❌ Chapter 1 generation failed:', error);

        return NextResponse.json(
          {
            success: false,
            error:
              'AI สร้างบทที่ 1 ไม่สำเร็จในขณะนี้ กรุณาลองใหม่อีกครั้ง',
            detail: describeError(error),
          },
          { status: 503 }
        );
      }

      let generatedText = generatedChapter.content;

      /* =====================================================
         Story Settings
      ===================================================== */

      const totalChapters =
        formData.length ===
          'เรื่องสั้น'
          ? 5
          : formData.length ===
            'นวนิยายขนาดกลาง'
            ? 15
            : 30;

      /* =====================================================
         Create Story
      ===================================================== */

      const {
        data: story,
        error: storyError,
      } = await supabaseAdmin
        .from('stories')
        .insert({
          id: finalStoryId,

          user_id: userId,

          title: formData.title.trim(),

          synopsis:
            formData.corePremise ||
            '',

          plot_structure:
            formData.corePremise ||
            '',

          genre:
            formData.genre ||
            'แฟนตาซี',

          tone:
            formData.tone ||
            'ทั่วไป',

          total_chapters:
            totalChapters,

          cover_image_url:
            formData.coverImageUrl ||
            null,

          // สร้างใหม่ = ส่วนตัว
          is_published: false,
        })
        .select()
        .single();

      if (storyError) {
        console.error(
          '❌ SUPABASE STORY ERROR:',
          JSON.stringify(
            storyError,
            null,
            2
          )
        );

        if (
          storyError.code ===
          '23505'
        ) {
          const {
            data:
            duplicateStory,
          } = await supabaseAdmin
            .from('stories')
            .select('id')
            .eq(
              'id',
              finalStoryId
            )
            .eq(
              'user_id',
              userId
            )
            .maybeSingle();

          if (duplicateStory) {
            return NextResponse.json({
              success: true,
              storyId:
                duplicateStory.id,
              alreadyCreated:
                true,
            });
          }
        }

        return NextResponse.json(
          {
            success: false,
            error:
              storyError.message ||
              'ไม่สามารถบันทึกนิยายได้',
            code:
              storyError.code ||
              null,
            details:
              storyError.details ||
              null,
            hint:
              storyError.hint ||
              null,
          },
          { status: 500 }
        );
      }

      if (!story) {
        return NextResponse.json(
          {
            success: false,
            error:
              'สร้าง Story สำเร็จแต่ไม่พบข้อมูลที่บันทึก',
          },
          { status: 500 }
        );
      }

      console.log(
        '✅ Story created:',
        story.id
      );

      /* =====================================================
         Create Protagonist
      ===================================================== */

      if (
        formData.protagonist &&
        formData.protagonist.trim()
      ) {
        const {
          error:
          characterError,
        } = await supabaseAdmin
          .from('characters')
          .insert({
            story_id: story.id,
            name: formData.protagonist.trim(),
            gender:
              formData.protagonistGender === 'ชาย' ||
                formData.protagonistGender === 'หญิง' ||
                formData.protagonistGender === 'ไม่ระบุ'
                ? formData.protagonistGender
                : 'ไม่ระบุ',
            role: 'player',
            appearance: null,
            personality:
              formData.protagonistPersonality?.trim() ||
              'ตัวละครเอกของเรื่อง',
            initial_items:
              parseInitialItems(
                formData.protagonistItems
              ),
          });

        if (
          characterError
        ) {
          console.error(
            '❌ Protagonist Error:',
            JSON.stringify(
              characterError,
              null,
              2
            )
          );
        } else {
          console.log(
            '✅ Protagonist created'
          );
        }
      }

      /* =====================================================
         Create Supporting Characters (NPC)

         NPC ที่ผู้สร้างกำหนดจะอยู่ใน Base Characters
         และจะถูก copy เข้า Session ของผู้เล่นแต่ละคน
      ===================================================== */

      if (supportingCharacters.length > 0) {
        const {
          error: supportingCharacterError,
        } = await supabaseAdmin
          .from('characters')
          .insert(
            supportingCharacters.map(
              (character: {
                name: string;
                gender: 'ชาย' | 'หญิง' | 'ไม่ระบุ';
                personality: string;
                initial_items: string[];
              }) => ({
                story_id: story.id,
                name: character.name,
                gender: character.gender,
                role: 'npc',
                appearance: null,
                personality: character.personality,
                initial_items: character.initial_items,
              })
            )
          );

        if (supportingCharacterError) {
          console.error(
            '❌ Supporting Characters Error:',
            JSON.stringify(
              supportingCharacterError,
              null,
              2
            )
          );
        } else {
          console.log(
            `✅ ${supportingCharacters.length} supporting character(s) created`
          );
        }
      }

      /* =====================================================
         Create Chapter 1
      ===================================================== */

      const {
        data: chapter,
        error:
        chapterError,
      } = await supabaseAdmin
        .from('chapters')
        .insert({
          story_id:
            story.id,

          chapter_number: 1,

          title: 'บทที่ 1',

          content:
            generatedText.trim(),

          choices:
            generatedChapter.choices || [],
        })
        .select()
        .single();

      if (
        chapterError
      ) {
        console.error(
          '❌ CHAPTER 1 INSERT ERROR:',
          JSON.stringify(
            chapterError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              chapterError.message ||
              'ไม่สามารถบันทึกบทที่ 1 ได้',
            code:
              chapterError.code ||
              null,
            details:
              chapterError.details ||
              null,
            hint:
              chapterError.hint ||
              null,
            storyId:
              story.id,
          },
          { status: 500 }
        );
      }

      console.log(
        '✅ Chapter 1 created:',
        chapter?.id
      );

      /* =====================================================
         Create Game Session
      ===================================================== */

      const session =
        await getOrCreateGameSession(
          userId,
          story.id,
          1
        );

      if (session) {
        // อัปเดตสถานะ session + เตรียมตัวละครของ session พร้อมกัน
        // (ต้องเสร็จก่อนตอบกลับ เพราะหน้าอ่านจะโหลดข้อมูลชุดนี้ทันที)
        const [{ error: sessionUpdateError }] = await Promise.all([
          supabaseAdmin
            .from('game_sessions')
            .update({
              current_chapter: 1,
              status: 'in_progress',

              current_location:
                generatedChapter.status.location || null,

              physical_condition:
                generatedChapter.status.physicalCondition || null,

              important_situation:
                generatedChapter.status.importantSituation || null,

              current_inventory:
                generatedChapter.status.inventory,

              updated_at: new Date().toISOString(),
            })
            .eq('id', session.id),

          initializeSessionCharacters(session.id, story.id),
        ]);

        if (sessionUpdateError) {
          console.error(
            'Game Session Update Error:',
            JSON.stringify(sessionUpdateError, null, 2)
          );
        }

        /* ===============================================
           งานเบื้องหลัง (ไม่บล็อกการตอบกลับ)

           - บันทึก chat log
           - วิเคราะห์ความสัมพันธ์ตัวละครด้วย Gemini อีกรอบ
             (เดิมต้องรอให้เสร็จก่อนผู้ใช้จะได้เห็นบทที่ 1)
        =============================================== */

        const sessionIdForBackground = session.id;
        const storyIdForBackground = story.id;
        const chapterTextForBackground = generatedText.trim();

        after(async () => {
          try {
            await saveChatLog(
              sessionIdForBackground,
              1,
              'model',
              chapterTextForBackground
            );

            await syncCharactersFromChapter({
              ai,
              storyId: storyIdForBackground,
              sessionId: sessionIdForBackground,
              chapterNumber: 1,
              chapterContent: chapterTextForBackground,
            });
          } catch (error) {
            console.error('Background sync (chapter 1) failed:', error);
          }
        });
      }

      console.log(
        '✅ CREATE STORY SUCCESS',
        story.id
      );

      return NextResponse.json({
        success: true,
        storyId: story.id,
        alreadyCreated: false,
      });
    }

    /* =========================================================
       NEXT CHAPTER
    ========================================================= */

    if (
      actionType ===
      'next_chapter'
    ) {
      if (!storyId) {
        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่พบ Story ID',
          },
          { status: 400 }
        );
      }

      /* =====================================================
         โหลดข้อมูลที่ไม่พึ่งกันพร้อมกัน (เดิมรอทีละ query)

         - stories          : เรื่อง
         - game_sessions    : session ของผู้เล่นคนนี้
         - chapters         : บทต้นฉบับ (shared)
      ===================================================== */

      const [storyResult, sessionResult, sharedChaptersResult] =
        await Promise.all([
          supabaseAdmin
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .maybeSingle(),

          supabaseAdmin
            .from('game_sessions')
            .select(
              'id, user_id, story_id, current_chapter, status, current_inventory, current_location, physical_condition, important_situation, is_public'
            )
            .eq('user_id', userId)
            .eq('story_id', storyId)
            .maybeSingle(),

          supabaseAdmin
            .from('chapters')
            .select(
              'id, chapter_number, title, content, created_at'
            )
            .eq('story_id', storyId)
            .order('chapter_number', { ascending: true }),
        ]);

      const { data: story, error: storyError } = storyResult;

      if (storyError || !story) {
        console.error(
          'Next chapter story error:',
          JSON.stringify(storyError, null, 2)
        );

        return NextResponse.json(
          {
            success: false,
            error: 'ไม่พบเรื่องนี้',
          },
          { status: 404 }
        );
      }

      /* =====================================================
         Story Access Control

         เจ้าของเรื่อง: เล่นได้เสมอ
         ผู้ใช้อื่น: เล่นได้เฉพาะเรื่องที่เผยแพร่แล้ว
      ===================================================== */

      if (
        story.user_id !== userId &&
        !story.is_published
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'นิยายเรื่องนี้ยังไม่ได้เผยแพร่',
          },
          { status: 403 }
        );
      }

      const {
        data: existingSession,
        error: existingSessionError,
      } = sessionResult;

      if (existingSessionError) {
        console.error(
          'Get Game Session Error:',
          JSON.stringify(existingSessionError, null, 2)
        );

        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถโหลด Session ของผู้เล่นได้',
          },
          { status: 500 }
        );
      }

      let session = existingSession;

      /* =====================================================
         Shared Chapters (เนื้อเรื่องต้นฉบับ)
      ===================================================== */

      const {
        data: databaseChapters,
        error: databaseChapterError,
      } = sharedChaptersResult;

      if (databaseChapterError) {
        console.error(
          'Database Chapters Error:',
          JSON.stringify(databaseChapterError, null, 2)
        );

        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถตรวจสอบบทของนิยายได้',
          },
          { status: 500 }
        );
      }

      const sharedChapters = databaseChapters || [];

      const latestSharedChapter =
        sharedChapters.length > 0
          ? Math.max(
            ...sharedChapters.map(
              (chapter) => chapter.chapter_number
            )
          )
          : 0;

      /* =====================================================
         ยังไม่มี Session → สร้างจากบทล่าสุดของเนื้อเรื่องต้นฉบับ
      ===================================================== */

      if (!session) {
        session = await getOrCreateGameSession(
          userId,
          story.id,
          latestSharedChapter || 1
        );

        if (!session) {
          return NextResponse.json(
            {
              success: false,
              error:
                'ไม่สามารถสร้าง Session สำหรับการเล่นได้',
            },
            { status: 500 }
          );
        }
      }

      /* =====================================================
         โหลดบทของผู้เล่นคนนี้ (session_chapters)
         พร้อมกับเตรียม/โหลดตัวละครของ session
      ===================================================== */

      const sessionIdForLoad = session.id;
      const storyIdForLoad = story.id;

      const [sessionChaptersResult, sessionCharacterContext] =
        await Promise.all([
          supabaseAdmin
            .from('session_chapters')
            .select(
              'id, session_id, chapter_number, title, content, user_choice, choices, created_at'
            )
            .eq('session_id', sessionIdForLoad)
            .order('chapter_number', { ascending: true }),

          initializeSessionCharacters(
            sessionIdForLoad,
            storyIdForLoad
          ).then(() =>
            loadSessionCharacterContext(sessionIdForLoad)
          ),
        ]);

      const {
        data: sessionChapterData,
        error: sessionChapterError,
      } = sessionChaptersResult;

      if (sessionChapterError) {
        console.error(
          'Session Chapters Error:',
          JSON.stringify(sessionChapterError, null, 2)
        );

        return NextResponse.json(
          {
            success: false,
            error: 'ไม่สามารถโหลดบทของ Session ได้',
          },
          { status: 500 }
        );
      }

      const sessionChapters = sessionChapterData || [];

      const {
        characters: sessionCharacters,
        relationships: sessionRelationships,
      } = sessionCharacterContext;

      /* =====================================================
         Calculate Latest Chapter

         ใช้ค่าที่มากที่สุดจาก:
         - shared chapters
         - session chapters
         - game session
      ===================================================== */

      const latestSessionChapter =
        sessionChapters.length > 0
          ? Math.max(
            ...sessionChapters.map(
              (chapter) => chapter.chapter_number
            )
          )
          : 0;

      const latestChapterNumber = Math.max(
        latestSharedChapter,
        latestSessionChapter,
        session.current_chapter || 0
      );

      console.log(
        `NEXT CHAPTER REQUEST story=${story.id} session=${session.id} user=${userId} shared=${latestSharedChapter} session_ch=${latestSessionChapter} current=${session.current_chapter} latest=${latestChapterNumber} characters=${sessionCharacters.length} relationships=${sessionRelationships.length}`
      );

      /* =====================================================
         Check Completed
      ===================================================== */

      if (
        latestChapterNumber >=
        story.total_chapters
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'นิยายเรื่องนี้ครบจำนวนบทแล้ว',
          },
          { status: 400 }
        );
      }

      /* =====================================================
         Next Chapter Number
      ===================================================== */

      const nextChapterNumber =
        latestChapterNumber + 1;

      /* =====================================================
         Check Existing Session Chapter

         nextChapterNumber มากกว่าบทล่าสุดที่โหลดมาแล้วเสมอ
         จึงตรวจจากข้อมูลที่มีอยู่ ไม่ต้อง query เพิ่ม
         (กรณีสองคำขอซ้อนกันจริง ๆ จะถูกกันที่ unique constraint ตอนบันทึก)
      ===================================================== */

      const existingNextChapter =
        sessionChapters.find(
          (chapter) =>
            chapter.chapter_number === nextChapterNumber
        ) || null;

      if (
        existingNextChapter
      ) {
        console.log(
          'Existing session chapter found:',
          existingNextChapter.id
        );

        const isCompleted =
          existingNextChapter.chapter_number >=
          story.total_chapters;

        const {
          error:
          existingSessionUpdateError,
        } = await supabaseAdmin
          .from('game_sessions')
          .update({
            current_chapter:
              existingNextChapter.chapter_number,

            status:
              isCompleted
                ? 'completed'
                : 'in_progress',

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            session.id
          );

        if (
          existingSessionUpdateError
        ) {
          console.error(
            'Existing Session Update Error:',
            JSON.stringify(
              existingSessionUpdateError,
              null,
              2
            )
          );
        }

        return NextResponse.json({
          success: true,

          storyId:
            story.id,

          alreadyCreated:
            true,

          chapter: {
            id:
              existingNextChapter.id,

            chapterNumber:
              existingNextChapter.chapter_number,

            title:
              existingNextChapter.title,

            content:
              existingNextChapter.content,

            userChoice:
              existingNextChapter.user_choice,

            choices:
              Array.isArray(existingNextChapter.choices)
                ? existingNextChapter.choices
                : [],

            createdAt:
              existingNextChapter.created_at,
          },
        });
      }

      /* =====================================================
         Prepare Previous Chapters

         ประกอบจากฐานข้อมูลฝั่งเซิร์ฟเวอร์:
         shared chapters + session chapters ของผู้เล่นคนนี้
         (บทของ session ทับบทต้นฉบับที่เลขเดียวกัน เหมือนที่หน้าอ่านรวมบท)

         ไม่ต้องให้ client ส่งเนื้อเรื่องทั้งเรื่องมาทุกครั้ง
         ใช้ previousChapters จาก client เฉพาะกรณีไม่มีข้อมูลในฐานข้อมูลเลย
      ===================================================== */

      const mergedChapters = new Map<number, ContextChapter>();

      for (const chapter of sharedChapters) {
        mergedChapters.set(chapter.chapter_number, {
          chapterNumber: chapter.chapter_number,
          title: chapter.title,
          content: chapter.content,
        });
      }

      for (const chapter of sessionChapters) {
        mergedChapters.set(chapter.chapter_number, {
          chapterNumber: chapter.chapter_number,
          title: chapter.title,
          content: chapter.content,
          userChoice: chapter.user_choice,
        });
      }

      const contextChapters: ContextChapter[] =
        mergedChapters.size > 0
          ? Array.from(mergedChapters.values())
          : Array.isArray(previousChapters)
            ? previousChapters.map(
              (chapter: {
                chapterNumber?: number;
                title?: string;
                content?: string;
              }) => ({
                chapterNumber: Number(chapter.chapterNumber) || 0,
                title: chapter.title,
                content: chapter.content,
              })
            )
            : [];

      const chapterContext = buildChapterContext(contextChapters);

      /* =====================================================
         Character Context
      ===================================================== */

      const characterContext =
        sessionCharacters.length > 0
          ? sessionCharacters
            .map(
              (character) => `
- ชื่อ: ${character.name}
  เพศ: ${character.gender || 'ไม่ระบุ'}
  บทบาท: ${character.role}
  รูปลักษณ์: ${character.appearance || 'ไม่ระบุ'}
  บุคลิก: ${character.personality || 'ไม่ระบุ'}
  สิ่งของเริ่มต้น: ${Array.isArray(character.initial_items)
                  ? character.initial_items.join(', ') || 'ไม่มี'
                  : 'ไม่มี'
                }
`
            )
            .join('\n')
          : 'ยังไม่มีข้อมูลตัวละครใน Session';

      /* =====================================================
         Relationship Context
      ===================================================== */

      const characterMap =
        new Map(
          sessionCharacters.map(
            (character) => [
              character.id,
              character.name,
            ]
          )
        );

      const relationshipContext =
        sessionRelationships.length > 0
          ? sessionRelationships
            .map(
              (relationship) => {
                const fromName =
                  characterMap.get(
                    relationship.from_character_id
                  ) ||
                  'ไม่ทราบ';

                const toName =
                  characterMap.get(
                    relationship.to_character_id
                  ) ||
                  'ไม่ทราบ';

                return `
- ${fromName} → ${toName}
  ความสัมพันธ์: ${relationship.relationship_type
                  }
  รายละเอียด: ${relationship.description ||
                  'ไม่ระบุ'
                  }
`;
              }
            )
            .join('\n')
          : 'ยังไม่มีข้อมูลความสัมพันธ์';

      /* =====================================================
         Gemini
 
         ไม่เปลี่ยน logic หลักของ AI
      ===================================================== */

      const ai =
        new GoogleGenAI({
          apiKey,
        });

      /* =====================================================
         Final Chapter Detection
      ===================================================== */

      const isFinalChapter =
        nextChapterNumber >=
        story.total_chapters;

      const finalChapterInstruction =
        isFinalChapter
          ? `
นี่คือบทสุดท้ายของนิยาย
- ต้องจบเรื่องอย่างสมบูรณ์ภายในบทนี้
- คลี่คลายปมหลักและผลจากการตัดสินใจล่าสุด
- ห้ามเปิดปมใหม่ที่ต้องมีบทถัดไป
- choices ต้องเป็น []
- status ต้องสะท้อนสถานะสุดท้ายของผู้เล่น
`
          : `
นี่ไม่ใช่บทสุดท้าย
- ต่อเนื่องจากบทก่อนหน้าและการตัดสินใจล่าสุดของผู้เล่น
- จบบทด้วยสถานการณ์ใหม่ที่ทำให้ผู้เล่นตัดสินใจต่อได้
- ต้องสร้าง choices จำนวน 3 ตัวเลือกพอดี
- choices ต้องเป็นการกระทำที่แตกต่างกันและสอดคล้องกับเหตุการณ์จริง
`;

      const prompt = `
คุณคือ AI นักเขียนนิยาย Interactive Novel ของ GonnaTales

ชื่อเรื่อง: ${story.title}
แนว: ${genre || story.genre || ''}
โทน: ${tone || story.tone || ''}
เรื่องย่อ: ${story.synopsis || ''}

ข้อมูลตัวละครปัจจุบันของผู้เล่น:
${characterContext}

ความสัมพันธ์ของตัวละครปัจจุบัน:
${relationshipContext}

บทก่อนหน้า:
${chapterContext}

การตัดสินใจล่าสุดของผู้เล่น:
${userChoice || 'ไม่มี'}

สถานะปัจจุบันของ Session:
- สถานที่: ${session.current_location || 'ไม่ระบุ'}
- สภาพร่างกาย: ${session.physical_condition || 'ไม่ระบุ'}
- ของติดตัว: ${Array.isArray(session.current_inventory) && session.current_inventory.length > 0 ? session.current_inventory.join(', ') : 'ไม่มี'}
- สถานการณ์สำคัญ: ${session.important_situation || 'ไม่มี'}

กฎความต่อเนื่อง:
- รักษาชื่อตัวละคร บุคลิก ความสัมพันธ์ และเหตุการณ์ให้ต่อเนื่อง
- ห้ามสร้างตัวละครสำคัญใหม่ที่ไม่ได้อยู่ใน Session
- ห้ามนำข้อมูลของผู้เล่นคนอื่นมาใช้
- การตัดสินใจล่าสุดของผู้เล่นต้องส่งผลต่อบทนี้อย่างสมเหตุสมผล
- ห้ามเปลี่ยนสถานะหรือสิ่งของโดยไม่มีเหตุการณ์รองรับ

ตอบเป็น JSON เท่านั้น ห้ามใส่ Markdown หรือ code fence

กฎการจัดประเภทเนื้อหาใน content:
- การบรรยายทั่วไป ไม่ต้องใส่ marker
- บทพูดของตัวละคร ให้ขึ้นต้นด้วย [dialogue]
- ความคิดของตัวละคร ให้ขึ้นต้นด้วย [thought]
- การกระทำหรือเหตุการณ์ที่เกิดขึ้น ให้ขึ้นต้นด้วย [action]
- เหตุการณ์สำคัญหรือจุดที่ต้องการเน้น ให้ขึ้นต้นด้วย [important]

ตัวอย่าง:

ทางเดินด้านหน้ามืดสนิท มีเพียงแสงจากหน้าต่างที่ส่องเข้ามาเป็นระยะ

[action] เขาค่อย ๆ ยกมือขึ้นจับลูกบิดประตู

[dialogue] "อย่าเพิ่งเปิด"

[thought] เสียงนั้นมาจากด้านหลังฉันได้อย่างไร

เขาหันกลับไปมอง แต่ไม่มีใครอยู่ตรงนั้น

[important] เสียงฝีเท้าดังขึ้นจากชั้นบน

ข้อกำหนดสำคัญ:
- marker ต้องอยู่ต้นย่อหน้า
- ใช้เฉพาะ [dialogue], [thought], [action], [important]
- ห้ามใช้ HTML
- ห้ามใช้ CSS
- ห้ามใส่สี
- ห้ามใส่ emoji
- ห้ามใช้ Markdown
- ห้ามใส่ marker อื่นนอกเหนือจากที่กำหนด
- อย่าใส่คำอธิบายประเภท เช่น "บทสนทนา:" หรือ "ความคิด:"
- content ต้องเป็นเนื้อหานิยายจริงเท่านั้น

รูปแบบ JSON:
{
  "title": "ชื่อบท",
  "content": "เนื้อหานิยายเท่านั้น",
  "choices": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3"],
  "status": {
    "location": "สถานที่ปัจจุบัน",
    "physicalCondition": "สภาพร่างกายปัจจุบัน",
    "inventory": ["ของที่มีจริง"],
    "importantSituation": "สถานการณ์สำคัญปัจจุบัน"
  }
}

กฎ choices:
- บทปกติ: 3 ตัวเลือกพอดี
- แต่ละตัวเลือกต้องนำไปสู่แนวทางการดำเนินเรื่องที่แตกต่างกัน
- ต้องอิงจากสถานการณ์จริงตอนจบบท
- ห้ามบังคับว่าผู้เล่นต้องเลือกจากรายการ เพราะผู้เล่นสามารถพิมพ์การตัดสินใจเองได้
- บทสุดท้าย: choices ต้องเป็น []

กฎ status:
- ต้องเป็นสถานะล่าสุด ณ ตอนจบบท
- location ต้องตรงกับสถานที่จริงในเรื่อง
- physicalCondition ต้องสะท้อนอาการล่าสุด
- inventory ต้องมีเฉพาะของที่ผู้เล่นมีจริง
- ถ้าได้รับ ใช้ สูญหาย หรือทำลายของ ต้องปรับรายการให้ถูกต้อง
- importantSituation ต้องสรุปสถานการณ์ที่กำลังเกิดขึ้น
- ถ้าไม่มีการเปลี่ยนแปลง ให้คงสถานะเดิม

${finalChapterInstruction}

เขียนบทที่ ${nextChapterNumber}
- ภาษาไทย
- เขียนเป็นนิยายจริง ไม่ใช่บทสรุป
- ความยาวประมาณ 1,200–1,800 คำภาษาไทย หรือความยาวใกล้เคียงกัน
- แบ่งเป็นประมาณ 10–16 ย่อหน้าอย่างเป็นธรรมชาติ
- ต้องมีรายละเอียดของฉาก การกระทำ ความคิด ความรู้สึก และบทสนทนาตามความเหมาะสม
- อย่าเร่งเหตุการณ์ให้จบเร็วเกินไป
- ไม่ต้องใส่คำว่า "บทที่ ${nextChapterNumber}" ซ้ำใน content
- อย่าอธิบายว่าเป็น AI
`;

      let generatedChapter: GeneratedChapterResult;

      try {
        generatedChapter = await generateValidatedJson({
          ai,
          prompt,
          label: `chapter_${nextChapterNumber}`,
          parse: (text) =>
            parseGeneratedChapter(text, {
              requireChoices: !isFinalChapter,
            }),
        });
      } catch (error) {
        console.error('❌ Next chapter generation failed:', error);

        return NextResponse.json(
          {
            success: false,
            error:
              'AI สร้างบทถัดไปไม่สำเร็จในขณะนี้ กรุณาลองใหม่อีกครั้ง',
            detail: describeError(error),
          },
          { status: 503 }
        );
      }

      let generatedText = generatedChapter.content;

      /* =====================================================
         Save Next Chapter
 
         สำคัญ:
         ใช้ session_chapters
         ไม่ใช้ chapters
      ===================================================== */

      const {
        data: chapter,
        error:
        chapterError,
      } = await supabaseAdmin
        .from('session_chapters')
        .insert({
          session_id:
            session.id,

          chapter_number:
            nextChapterNumber,

          title:
            `บทที่ ${nextChapterNumber}`,

          content:
            generatedText.trim(),

          choices:
            generatedChapter.choices || [],

          user_choice:
            userChoice &&
              String(userChoice).trim()
              ? String(userChoice).trim()
              : null,
        })
        .select()
        .single();

      /* =====================================================
         Duplicate Protection
      ===================================================== */

      if (
        chapterError
      ) {
        if (
          chapterError.code ===
          '23505'
        ) {
          const {
            data:
            duplicateChapter,
          } = await supabaseAdmin
            .from(
              'session_chapters'
            )
            .select(
              'id, session_id, chapter_number, title, content, user_choice, choices, created_at'
            )
            .eq(
              'session_id',
              session.id
            )
            .eq(
              'chapter_number',
              nextChapterNumber
            )
            .maybeSingle();

          if (
            duplicateChapter
          ) {
            return NextResponse.json({
              success: true,

              storyId:
                story.id,

              alreadyCreated:
                true,

              chapter: {
                id:
                  duplicateChapter.id,

                chapterNumber:
                  duplicateChapter.chapter_number,

                title:
                  duplicateChapter.title,

                content:
                  duplicateChapter.content,

                userChoice:
                  duplicateChapter.user_choice,

                choices:
                  Array.isArray(duplicateChapter.choices)
                    ? duplicateChapter.choices
                    : [],

                createdAt:
                  duplicateChapter.created_at,
              },
            });
          }
        }

        console.error(
          'Next Session Chapter Error:',
          JSON.stringify(
            chapterError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,

            error:
              chapterError.message ||
              'ไม่สามารถบันทึกบทใหม่ได้',

            code:
              chapterError.code ||
              null,

            details:
              chapterError.details ||
              null,

            hint:
              chapterError.hint ||
              null,
          },
          { status: 500 }
        );
      }

      if (!chapter) {
        return NextResponse.json(
          {
            success: false,
            error:
              'สร้างบทสำเร็จแต่ไม่พบข้อมูลบท',
          },
          { status: 500 }
        );
      }

      console.log(
        '✅ Session Chapter created:',
        chapter.id
      );

      /* =====================================================
         Update Game Session

         ต้องเสร็จก่อนตอบกลับ เพราะการโหลดหน้าอ่านครั้งถัดไปอ่านค่านี้
      ===================================================== */

      const isCompleted =
        nextChapterNumber >=
        story.total_chapters;

      const {
        error:
        sessionError,
      } = await supabaseAdmin
        .from('game_sessions')
        .update({
          current_chapter:
            nextChapterNumber,

          status:
            isCompleted
              ? 'completed'
              : 'in_progress',

          current_location:
            generatedChapter.status.location || null,

          physical_condition:
            generatedChapter.status.physicalCondition || null,

          important_situation:
            generatedChapter.status.importantSituation || null,

          current_inventory:
            generatedChapter.status.inventory,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          session.id
        );

      if (
        sessionError
      ) {
        console.error(
          'Game Session Update Error:',
          JSON.stringify(
            sessionError,
            null,
            2
          )
        );
      }

      /* =====================================================
         งานเบื้องหลัง (ทำต่อหลังตอบผู้ใช้แล้ว ไม่ต้องรอ)

         - บันทึก chat log ของผู้เล่นและ AI
         - Sync ความสัมพันธ์ตัวละคร (เรียก Gemini อีกรอบ
           เดิมต้องรอจนเสร็จก่อนผู้เล่นจะเห็นบทใหม่)

         ตรวจจับเฉพาะ Relationship ของตัวละครที่มีอยู่ใน Session แล้ว
         ไม่สร้าง Character ใหม่
      ===================================================== */

      const backgroundSessionId = session.id;
      const backgroundStoryId = story.id;
      const backgroundChapterNumber = nextChapterNumber;
      const backgroundChapterText = generatedText.trim();
      const backgroundUserChoice =
        userChoice && String(userChoice).trim()
          ? String(userChoice)
          : '';

      after(async () => {
        try {
          if (backgroundUserChoice) {
            await saveChatLog(
              backgroundSessionId,
              backgroundChapterNumber,
              'user',
              backgroundUserChoice
            );
          }

          await saveChatLog(
            backgroundSessionId,
            backgroundChapterNumber,
            'model',
            backgroundChapterText
          );

          await syncCharactersFromChapter({
            ai,
            storyId: backgroundStoryId,
            sessionId: backgroundSessionId,
            chapterNumber: backgroundChapterNumber,
            chapterContent: backgroundChapterText,
          });
        } catch (error) {
          console.error(
            `Background work (chapter ${backgroundChapterNumber}) failed:`,
            error
          );
        }
      });

      /* =====================================================
         Success
      ===================================================== */

      console.log(
        '========================================'
      );

      console.log(
        `✅ CHAPTER ${nextChapterNumber} SUCCESS`
      );

      console.log(
        'Story ID:',
        story.id
      );

      console.log(
        'Session ID:',
        session.id
      );

      console.log(
        'User ID:',
        userId
      );

      console.log(
        'Saved To: session_chapters'
      );

      console.log(
        '========================================'
      );

      return NextResponse.json({
        success: true,

        storyId:
          story.id,

        alreadyCreated:
          false,

        chapter: {
          id:
            chapter.id,

          chapterNumber:
            chapter.chapter_number,

          title:
            chapter.title,

          content:
            chapter.content,

          userChoice:
            chapter.user_choice,

          choices:
            Array.isArray(chapter.choices)
              ? chapter.choices
              : [],

          createdAt:
            chapter.created_at,
        },
      });
    }

    /* =========================================================
       Fallback
    ========================================================= */

    return NextResponse.json(
      {
        success: false,
        error: 'ไม่พบ action ที่รองรับ',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      '========================================'
    );

    console.error(
      '❌ GENERATE STORY API ERROR'
    );

    console.error(error);

    console.error(
      '========================================'
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}