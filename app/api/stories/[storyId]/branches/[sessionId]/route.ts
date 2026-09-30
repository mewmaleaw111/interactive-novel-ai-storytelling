import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      storyId: string;
      sessionId: string;
    }>;
  }
) {
  try {
    const {
      storyId,
      sessionId,
    } = await params;

    if (!storyId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing storyId or sessionId',
        },
        { status: 400 }
      );
    }

    const { userId } = await auth();

    // ==================================================
    // 1. ตรวจสอบ Story
    // ==================================================

    const {
      data: story,
      error: storyError,
    } = await supabaseAdmin
      .from('stories')
      .select(
        `
        id,
        title,
        user_id,
        total_chapters,
        cover_image_url,
        genre,
        tone,
        synopsis,
        is_published,
        is_banned
        `
      )
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    if (story.is_banned) {
      return NextResponse.json(
        {
          success: false,
          error:
            'นิยายเรื่องนี้ถูกระงับการใช้งาน',
        },
        { status: 403 }
      );
    }

    // ==================================================
    // 2. โหลด Username ของเจ้าของ Story
    // ==================================================

    let creatorName = 'ไม่ระบุชื่อ';

    if (story.user_id) {
      const {
        data: creatorProfile,
        error: creatorProfileError,
      } = await supabaseAdmin
        .from('profiles')
        .select(
          'user_id, display_name'
        )
        .eq(
          'user_id',
          story.user_id
        )
        .maybeSingle();

      if (creatorProfileError) {
        console.error(
          'Error loading creator profile:',
          creatorProfileError
        );
      }

      if (
        creatorProfile?.display_name &&
        creatorProfile.display_name.trim()
      ) {
        creatorName =
          creatorProfile.display_name.trim();
      }
    }

    // ==================================================
    // 3. โหลด Branch
    // ==================================================

    const {
      data: session,
      error: sessionError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select(
        `
        id,
        user_id,
        story_id,
        current_chapter,
        status,
        is_public,
        current_location,
        physical_condition,
        current_inventory,
        important_situation,
        created_at,
        updated_at
        `
      )
      .eq('id', sessionId)
      .eq('story_id', storyId)
      .single();

    if (
      sessionError ||
      !session
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Branch not found',
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 4. ตรวจสอบสิทธิ์การเข้าถึง Branch
    // ==================================================

    const isOwner =
      userId === session.user_id;

    if (!isOwner) {
      if (!story.is_published) {
        return NextResponse.json(
          {
            success: false,
            error:
              'นิยายเรื่องนี้ยังไม่ได้เผยแพร่',
          },
          { status: 403 }
        );
      }

      if (!session.is_public) {
        return NextResponse.json(
          {
            success: false,
            error:
              'เส้นเรื่องนี้เป็น Private และไม่เปิดให้ผู้เล่นอื่นเข้าชม',
          },
          { status: 403 }
        );
      }
    }

    // ==================================================
    // 5. โหลด Username ของเจ้าของ Branch
    // ==================================================

    let userName = 'ไม่ระบุชื่อ';

    if (session.user_id) {
      const {
        data: playerProfile,
        error: playerProfileError,
      } = await supabaseAdmin
        .from('profiles')
        .select(
          'user_id, display_name'
        )
        .eq(
          'user_id',
          session.user_id
        )
        .maybeSingle();

      if (playerProfileError) {
        console.error(
          'Error loading player profile:',
          playerProfileError
        );
      }

      if (
        playerProfile?.display_name &&
        playerProfile.display_name.trim()
      ) {
        userName =
          playerProfile.display_name.trim();
      }
    }

    // ==================================================
    // 6. โหลด Characters ของ Branch
    // ==================================================

    const {
      data: sessionCharacters,
      error: charactersError,
    } = await supabaseAdmin
      .from('session_characters')
      .select(
        `
        id,
        name,
        gender,
        role,
        appearance,
        personality,
        initial_items,
        created_at
        `
      )
      .eq(
        'session_id',
        sessionId
      )
      .order('created_at', {
        ascending: true,
      });

    if (charactersError) {
      console.error(
        'Error loading session characters:',
        charactersError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to load branch characters',
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 7. โหลด Chapter กลางของ Story
    // ==================================================

    const {
      data: sharedChapters,
      error: sharedError,
    } = await supabaseAdmin
      .from('chapters')
      .select(
        `
        id,
        chapter_number,
        title,
        content,
        created_at
        `
      )
      .eq('story_id', storyId)
      .order('chapter_number', {
        ascending: true,
      });

    if (sharedError) {
      console.error(
        'Error loading shared chapters:',
        sharedError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to load story chapters',
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 8. โหลด Chapter ของ Branch
    // ==================================================

    const {
      data: sessionChapters,
      error: sessionChapterError,
    } = await supabaseAdmin
      .from('session_chapters')
      .select(
        `
        id,
        session_id,
        chapter_number,
        title,
        content,
        user_choice,
        created_at
        `
      )
      .eq(
        'session_id',
        sessionId
      )
      .order('chapter_number', {
        ascending: true,
      });

    if (sessionChapterError) {
      console.error(
        'Error loading session chapters:',
        sessionChapterError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to load branch chapters',
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 9. รวม Chapter กลาง + Branch
    // ==================================================

    const chapterMap = new Map<
      number,
      {
        id: string;
        chapterNumber: number;
        title: string;
        content: string;
        userPromptChoice?: string;
        createdAt: string;
      }
    >();

    // ==================================================
    // Shared Chapters
    // ==================================================

    for (
      const chapter of
      sharedChapters ?? []
    ) {
      chapterMap.set(
        chapter.chapter_number,
        {
          id: chapter.id,

          chapterNumber:
            chapter.chapter_number,

          title:
            chapter.title ??
            `บทที่ ${chapter.chapter_number}`,

          content:
            chapter.content,

          createdAt:
            chapter.created_at,
        }
      );
    }

    // ==================================================
    // Branch Chapters
    // ==================================================

    for (
      const chapter of
      sessionChapters ?? []
    ) {
      chapterMap.set(
        chapter.chapter_number,
        {
          id: chapter.id,

          chapterNumber:
            chapter.chapter_number,

          title:
            chapter.title ??
            `บทที่ ${chapter.chapter_number}`,

          content:
            chapter.content,

          userPromptChoice:
            chapter.user_choice ??
            undefined,

          createdAt:
            chapter.created_at,
        }
      );
    }

    const chapters =
      Array.from(
        chapterMap.values()
      ).sort(
        (a, b) =>
          a.chapterNumber -
          b.chapterNumber
      );

    // ==================================================
    // 10. จัดรูปข้อมูล Characters
    // ==================================================

    const characters = (
      sessionCharacters ?? []
    ).map((character) => ({
      id: character.id,
      name: character.name,
      gender: character.gender ?? '',
      role: character.role ?? 'npc',
      appearance:
        character.appearance ?? '',
      personality:
        character.personality ?? '',
      initial_items:
        Array.isArray(
          character.initial_items
        )
          ? character.initial_items
          : [],
    }));

    // ==================================================
    // 11. Response
    // ==================================================

    return NextResponse.json({
      success: true,

      story: {
        id: story.id,

        title: story.title,

        totalChapters:
          story.total_chapters,

        coverImageUrl:
          story.cover_image_url ?? '',

        genre:
          story.genre ?? '',

        tone:
          story.tone ?? '',

        synopsis:
          story.synopsis ?? '',

        isPublished:
          story.is_published,

        creatorName,
      },

      branch: {
        sessionId:
          session.id,

        userId:
          session.user_id,

        userName,

        isPublic:
          session.is_public,

        isOwner,

        currentChapter:
          session.current_chapter,

        status:
          session.status,

        createdAt:
          session.created_at,

        updatedAt:
          session.updated_at,
      },

      // ==================================================
      // สถานะปัจจุบันของเส้นเรื่อง
      // ==================================================

      currentStatus: {
        location:
          session.current_location ?? '',

        physicalCondition:
          session.physical_condition ?? '',

        inventory:
          Array.isArray(
            session.current_inventory
          )
            ? session.current_inventory
            : [],

        importantSituation:
          session.important_situation ?? '',
      },

      // ==================================================
      // ตัวละครใน Session
      // ==================================================

      characters,

      // ==================================================
      // Chapters
      // ==================================================

      chapters,
    });
  } catch (error) {
    console.error(
      'Unexpected error loading branch:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}