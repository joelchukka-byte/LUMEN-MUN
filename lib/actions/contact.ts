'use server';

import { db, contactMessages } from '@/db';
import { contactMessage, fieldErrors } from '@/lib/validation';
import { sendMail } from '@/lib/mail';
import { getContactSettings } from '@/lib/content';

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const ROUTING: Record<string, keyof Awaited<ReturnType<typeof getContactSettings>>> = {
  'Sponsorship & partnerships': 'partners',
  'Press & media': 'press',
};

/**
 * Contact form. VIVAMUN emailed these and kept no record; here the message is
 * written to the database first and emailed second, so nothing is lost when
 * mail is unconfigured or the SMTP host is having a bad day.
 */
export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactMessage.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    topic: formData.get('topic'),
    message: formData.get('message'),
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), message: 'Check the fields below.' };
  }

  const data = parsed.data;

  await db.insert(contactMessages).values({
    name: data.name,
    email: data.email,
    topic: data.topic,
    message: data.message,
  });

  const contact = await getContactSettings();
  const inbox = contact[ROUTING[data.topic] ?? 'delegates'] as string;

  await sendMail({
    to: inbox,
    subject: `[${data.topic}] ${data.name}`,
    text: `${data.message}\n\n- ${data.name} <${data.email}>`,
  });

  return {
    ok: true,
    message:
      'Message received. Delegate Affairs replies within 24 hours on weekdays: check your spam folder if nothing arrives.',
  };
}
