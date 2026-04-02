export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { poemText, poemTitle, customDirection } = await request.json();
    if (!poemText) {
      return NextResponse.json({ error: 'Texto do poema é obrigatório' }, { status: 400 });
    }

    const directionPart = customDirection
      ? `\n\nAdditional artistic direction from the user: "${customDirection}". Please follow this direction carefully.`
      : '';

    const prompt = `Create a beautiful, artistic, painterly illustration inspired by this poem titled "${poemTitle ?? 'Untitled'}". The poem reads: "${poemText?.slice(0, 500) ?? ''}".${directionPart}\n\nStyle: watercolor painting, soft and ethereal, poetic atmosphere, warm colors with golden and navy tones, no text or words in the image.`;

    const response = await fetch('https://routellm.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-11-20',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image'],
        image_config: { num_images: 1, aspect_ratio: '3:2' },
      }),
    });

    if (!response?.ok) {
      const errText = await response?.text?.() ?? '';
      console.error('Image gen API error:', response.status, errText);
      return NextResponse.json({ error: `Erro ao gerar imagem: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('Image gen response keys:', JSON.stringify(Object.keys(data ?? {})));

    const choice = data?.choices?.[0]?.message;
    let imageUrl = '';

    // Try multiple response formats
    if (choice?.images?.length > 0) {
      imageUrl = choice.images[0]?.image_url?.url ?? choice.images[0]?.url ?? '';
    } else if (choice?.content) {
      // Check if content contains a URL
      const urlMatch = choice.content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp|gif)[^\s"'<>]*/i);
      if (urlMatch) {
        imageUrl = urlMatch[0];
      }
      // Check for markdown image
      const mdMatch = choice.content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (!imageUrl && mdMatch) {
        imageUrl = mdMatch[1];
      }
      // Check for data URL
      if (!imageUrl && choice.content.startsWith('data:image')) {
        imageUrl = choice.content;
      }
    }

    if (!imageUrl) {
      console.error('No image found in response:', JSON.stringify(data?.choices?.[0]?.message ?? {}).slice(0, 500));
      return NextResponse.json({ error: 'Nenhuma imagem gerada. Tente novamente.' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Generate image error:', error?.message ?? error);
    return NextResponse.json({ error: 'Erro ao gerar imagem. Tente novamente.' }, { status: 500 });
  }
}
