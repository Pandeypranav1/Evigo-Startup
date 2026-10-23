import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { consumeRequestLimit, requestIdentity } from '@/lib/request-limit';

interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

function validatePayload(payload: any): string | null {
  if (!payload) return 'Invalid request body';
  const { name, email, message } = payload as ContactMessage;
  if (typeof name !== 'string' || !name.trim() || name.length > 150) return 'Name is required';
  if (typeof email !== 'string' || !email.trim() || email.length > 254) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email address';
  if (typeof message !== 'string' || !message.trim() || message.length > 5000) return 'Message is required';
  return null;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { name, email, message } = payload as ContactMessage;

    if (!await consumeRequestLimit("contact", requestIdentity(req), 5, 3600)) {
      return NextResponse.json({ error: "Too many support requests. Please try again later." }, { status: 429 });
    }
    const supabase = createAdminClient();

    // Do not chain .select() — the RLS policy may only allow INSERT, not SELECT.
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name: name.trim(), email: email.trim(), message: message.trim() });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save your message. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Message sent successfully!' }, { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error in /api/contact:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
