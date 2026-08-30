'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import {
  db,
  committees,
  secretariat,
  scheduleDays,
  scheduleSessions,
  sponsors,
  faqs,
  feeTiers,
  siteContent,
  type CommitteeLevel,
  type SponsorTier,
} from '@/db';
import { requireStaff, AuthError } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';

export type ActionResult = { ok: boolean; message: string };

/**
 * Every content edit runs through here: superadmin only, audited, and it
 * revalidates the public pages so the change is live immediately rather than
 * waiting for the next deploy.
 */
async function edit(
  action: string,
  target: string,
  paths: string[],
  run: () => Promise<string>
): Promise<ActionResult> {
  try {
    const staff = await requireStaff('superadmin');
    const detail = await run();

    await writeAudit({ actor: staff.username, role: staff.role, action, target, detail });
    for (const path of [...paths, '/admin']) revalidatePath(path);

    return { ok: true, message: detail };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: 'Only a superadmin can change site content.' };
    }
    console.error('[content-action]', action, error);
    return { ok: false, message: (error as Error).message || 'That did not save.' };
  }
}

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const num = (form: FormData, key: string, fallback = 0) => {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
};
const bool = (form: FormData, key: string) => form.get(key) === 'on' || form.get(key) === 'true';

/** Newline-separated textarea → array, blank lines dropped. */
const lines = (form: FormData, key: string) =>
  str(form, key)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/* ------------------------------------------------------------- committees -- */

export async function saveCommittee(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.committee', String(id), ['/committees', '/', '/register'], async () => {
    const values = {
      code: str(formData, 'code'),
      name: str(formData, 'name'),
      level: str(formData, 'level') as CommitteeLevel,
      blurb: str(formData, 'blurb'),
      overview: str(formData, 'overview') || null,
      agendaStatus: (str(formData, 'agendaStatus') || 'classified') as 'classified' | 'released',
      agendaTitle: str(formData, 'agendaTitle') || null,
      agendaItems: lines(formData, 'agendaItems'),
      chairName: str(formData, 'chairName') || null,
      chairRole: str(formData, 'chairRole') || null,
      chairBio: str(formData, 'chairBio') || null,
      viceChairName: str(formData, 'viceChairName') || null,
      viceChairRole: str(formData, 'viceChairRole') || null,
      viceChairBio: str(formData, 'viceChairBio') || null,
      seats: num(formData, 'seats'),
      sort: num(formData, 'sort'),
      published: bool(formData, 'published'),
      updatedAt: new Date(),
    };

    if (id) {
      await db.update(committees).set(values).where(eq(committees.id, id));
      return `${values.name} saved.`;
    }

    const slug =
      str(formData, 'slug') ||
      values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    await db.insert(committees).values({ ...values, slug });
    return `${values.name} created.`;
  });
}

export async function deleteCommittee(id: number): Promise<ActionResult> {
  return edit('content.committee.delete', String(id), ['/committees', '/'], async () => {
    const [row] = await db.select().from(committees).where(eq(committees.id, id)).limit(1);
    await db.delete(committees).where(eq(committees.id, id));
    return `${row?.name ?? 'Committee'} removed.`;
  });
}

/* ------------------------------------------------------------ secretariat -- */

export async function saveMember(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.secretariat', String(id), ['/secretariat', '/about'], async () => {
    const values = {
      name: str(formData, 'name') || 'To be announced',
      role: str(formData, 'role'),
      department: str(formData, 'department'),
      bio: str(formData, 'bio') || null,
      photo: str(formData, 'photo') || null,
      email: str(formData, 'email') || null,
      sort: num(formData, 'sort'),
      published: bool(formData, 'published'),
    };

    if (id) {
      await db.update(secretariat).set(values).where(eq(secretariat.id, id));
      return `${values.role} saved.`;
    }

    await db.insert(secretariat).values(values);
    return `${values.role} added.`;
  });
}

export async function deleteMember(id: number): Promise<ActionResult> {
  return edit('content.secretariat.delete', String(id), ['/secretariat'], async () => {
    await db.delete(secretariat).where(eq(secretariat.id, id));
    return 'Member removed.';
  });
}

/* --------------------------------------------------------------- schedule -- */

export async function saveDay(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.schedule.day', String(id), ['/schedule'], async () => {
    const values = {
      label: str(formData, 'label'),
      title: str(formData, 'title'),
      note: str(formData, 'note') || null,
      date: str(formData, 'date') || null,
      sort: num(formData, 'sort'),
      published: bool(formData, 'published'),
    };

    if (id) {
      await db.update(scheduleDays).set(values).where(eq(scheduleDays.id, id));
      return `${values.label} saved.`;
    }

    await db.insert(scheduleDays).values(values);
    return `${values.label} added.`;
  });
}

export async function deleteDay(id: number): Promise<ActionResult> {
  return edit('content.schedule.day.delete', String(id), ['/schedule'], async () => {
    await db.delete(scheduleDays).where(eq(scheduleDays.id, id));
    return 'Day removed.';
  });
}

export async function saveSession(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.schedule.session', String(id), ['/schedule'], async () => {
    const values = {
      dayId: num(formData, 'dayId'),
      startsAt: str(formData, 'startsAt') || null,
      endsAt: str(formData, 'endsAt') || null,
      title: str(formData, 'title'),
      detail: str(formData, 'detail') || null,
      venue: str(formData, 'venue') || null,
      kind: str(formData, 'kind') || 'committee',
      sort: num(formData, 'sort'),
    };

    if (id) {
      await db.update(scheduleSessions).set(values).where(eq(scheduleSessions.id, id));
      return `${values.title} saved.`;
    }

    await db.insert(scheduleSessions).values(values);
    return `${values.title} added.`;
  });
}

export async function deleteSession(id: number): Promise<ActionResult> {
  return edit('content.schedule.session.delete', String(id), ['/schedule'], async () => {
    await db.delete(scheduleSessions).where(eq(scheduleSessions.id, id));
    return 'Session removed.';
  });
}

/* --------------------------------------------------------------- sponsors -- */

export async function saveSponsor(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.sponsor', String(id), ['/sponsors'], async () => {
    const values = {
      name: str(formData, 'name'),
      tier: str(formData, 'tier') as SponsorTier,
      blurb: str(formData, 'blurb') || null,
      logo: str(formData, 'logo') || null,
      url: str(formData, 'url') || null,
      price: str(formData, 'price') || null,
      perks: lines(formData, 'perks'),
      confirmed: bool(formData, 'confirmed'),
      sort: num(formData, 'sort'),
    };

    if (id) {
      await db.update(sponsors).set(values).where(eq(sponsors.id, id));
      return `${values.name} saved.`;
    }

    await db.insert(sponsors).values(values);
    return `${values.name} added.`;
  });
}

export async function deleteSponsor(id: number): Promise<ActionResult> {
  return edit('content.sponsor.delete', String(id), ['/sponsors'], async () => {
    await db.delete(sponsors).where(eq(sponsors.id, id));
    return 'Partner removed.';
  });
}

/* ------------------------------------------------------------------- FAQs -- */

export async function saveFaq(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.faq', String(id), ['/faq'], async () => {
    const values = {
      question: str(formData, 'question'),
      answer: str(formData, 'answer'),
      category: str(formData, 'category') || 'General',
      sort: num(formData, 'sort'),
      published: bool(formData, 'published'),
    };

    if (id) {
      await db.update(faqs).set(values).where(eq(faqs.id, id));
      return 'Question saved.';
    }

    await db.insert(faqs).values(values);
    return 'Question added.';
  });
}

export async function deleteFaq(id: number): Promise<ActionResult> {
  return edit('content.faq.delete', String(id), ['/faq'], async () => {
    await db.delete(faqs).where(eq(faqs.id, id));
    return 'Question removed.';
  });
}

/* ------------------------------------------------------- settings & fees -- */

export async function saveFeeTier(formData: FormData): Promise<ActionResult> {
  const id = num(formData, 'id');

  return edit('content.fee', String(id), ['/register'], async () => {
    const values = {
      code: str(formData, 'code'),
      name: str(formData, 'name'),
      amount: num(formData, 'amount'),
      description: str(formData, 'description') || null,
      appliesTo: str(formData, 'appliesTo') || 'both',
      isAddon: bool(formData, 'isAddon'),
      active: bool(formData, 'active'),
      sort: num(formData, 'sort'),
    };

    if (id) {
      await db.update(feeTiers).set(values).where(eq(feeTiers.id, id));
      return `${values.name} saved.`;
    }

    await db.insert(feeTiers).values(values);
    return `${values.name} added.`;
  });
}

export async function deleteFeeTier(id: number): Promise<ActionResult> {
  return edit('content.fee.delete', String(id), ['/register'], async () => {
    await db.delete(feeTiers).where(eq(feeTiers.id, id));
    return 'Fee tier removed.';
  });
}

export async function saveRegistrationSettings(formData: FormData): Promise<ActionResult> {
  return edit('content.registration', 'registration', ['/register', '/'], async () => {
    const value = {
      open: bool(formData, 'open'),
      opensAt: str(formData, 'opensAt') || null,
      closesAt: str(formData, 'closesAt') || null,
      message: str(formData, 'message') || 'Registration is open',
      seatsCap: num(formData, 'seatsCap', 300),
    };

    await db
      .insert(siteContent)
      .values({ key: 'registration', value })
      .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });

    return value.open ? 'Registration is open.' : 'Registration is closed.';
  });
}

export async function saveHomeContent(formData: FormData): Promise<ActionResult> {
  return edit('content.home', 'home', ['/'], async () => {
    const [existing] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.key, 'home'))
      .limit(1);

    const current = (existing?.value ?? {}) as Record<string, unknown>;

    const value = {
      ...current,
      eyebrow: str(formData, 'eyebrow'),
      titleLead: str(formData, 'titleLead'),
      titleAccent: str(formData, 'titleAccent'),
      tagline: str(formData, 'tagline'),
      lede: str(formData, 'lede'),
      stats: {
        ...((current.stats as object) ?? {}),
        dates: { value: str(formData, 'statDates'), note: str(formData, 'statDatesNote') },
        venue: { value: str(formData, 'statVenue'), note: str(formData, 'statVenueNote') },
        delegates: { value: num(formData, 'statDelegates'), note: str(formData, 'statDelegatesNote') },
        committees: { value: num(formData, 'statCommittees'), note: str(formData, 'statCommitteesNote') },
      },
    };

    await db
      .insert(siteContent)
      .values({ key: 'home', value })
      .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });

    return 'Homepage saved.';
  });
}

export async function saveContactSettings(formData: FormData): Promise<ActionResult> {
  return edit('content.contact', 'contact', ['/contact', '/press'], async () => {
    const socials = lines(formData, 'socials').map((line) => {
      const [label, url] = line.split('|').map((s) => s.trim());
      return { label: label ?? line, url: url ?? '' };
    });

    const value = {
      delegates: str(formData, 'delegates'),
      partners: str(formData, 'partners'),
      press: str(formData, 'press'),
      socials: socials.filter((s) => s.label && s.url),
    };

    await db
      .insert(siteContent)
      .values({ key: 'contact', value })
      .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });

    return 'Contact details saved.';
  });
}
