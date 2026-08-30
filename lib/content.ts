/**
 * Content queries.
 *
 * Every public page reads through here, so the site's content lives in Postgres
 * and changes the moment it is edited in the admin console — no rebuild, no
 * redeploy. Each query is wrapped in React's `cache` so a page that needs the
 * committee list in three places still issues one query per request.
 */

import 'server-only';
import { cache } from 'react';
import { eq, asc, and, isNull, or, desc } from 'drizzle-orm';
import {
  db,
  committees,
  secretariat,
  scheduleDays,
  scheduleSessions,
  sponsors,
  galleryEditions,
  galleryItems,
  faqs,
  documents,
  feeTiers,
  siteContent,
  announcements,
  type Committee,
  type ScheduleSession,
} from '@/db';

/* ------------------------------------------------------------- committees -- */

export const getCommittees = cache(async (): Promise<Committee[]> => {
  return db
    .select()
    .from(committees)
    .where(eq(committees.published, true))
    .orderBy(asc(committees.sort), asc(committees.id));
});

export const getCommittee = cache(async (slug: string): Promise<Committee | null> => {
  const [row] = await db
    .select()
    .from(committees)
    .where(and(eq(committees.slug, slug), eq(committees.published, true)))
    .limit(1);
  return row ?? null;
});

/** Public documents plus the guides attached to one committee. */
export const getCommitteeDocuments = cache(async (committeeId: number) => {
  return db
    .select()
    .from(documents)
    .where(eq(documents.committeeId, committeeId))
    .orderBy(asc(documents.sort));
});

/* ------------------------------------------------------------ secretariat -- */

export type Department = {
  name: string;
  blurb: string | null;
  members: Awaited<ReturnType<typeof getSecretariat>>;
};

export const getSecretariat = cache(async () => {
  return db
    .select()
    .from(secretariat)
    .where(eq(secretariat.published, true))
    .orderBy(asc(secretariat.sort), asc(secretariat.id));
});

/** Grouped for the team page, in the department order the roster defines. */
export const getSecretariatByDepartment = cache(async (): Promise<Department[]> => {
  const rows = await getSecretariat();
  const order: string[] = [];
  const groups = new Map<string, typeof rows>();

  for (const row of rows) {
    if (!groups.has(row.department)) {
      groups.set(row.department, []);
      order.push(row.department);
    }
    groups.get(row.department)!.push(row);
  }

  return order.map((name) => ({
    name,
    blurb: groups.get(name)![0]?.bio ?? null,
    members: groups.get(name)!,
  }));
});

/* --------------------------------------------------------------- schedule -- */

export type DayWithSessions = Awaited<ReturnType<typeof getScheduleDays>>[number];

export const getScheduleDays = cache(async () => {
  const days = await db
    .select()
    .from(scheduleDays)
    .where(eq(scheduleDays.published, true))
    .orderBy(asc(scheduleDays.sort));

  if (!days.length) return [];

  const allSessions = await db
    .select()
    .from(scheduleSessions)
    .orderBy(asc(scheduleSessions.sort));

  const byDay = new Map<number, ScheduleSession[]>();
  for (const s of allSessions) {
    if (!byDay.has(s.dayId)) byDay.set(s.dayId, []);
    byDay.get(s.dayId)!.push(s);
  }

  return days.map((day) => ({ ...day, sessions: byDay.get(day.id) ?? [] }));
});

/* --------------------------------------------------------------- sponsors -- */

export const getSponsors = cache(async () => {
  return db.select().from(sponsors).orderBy(asc(sponsors.sort), asc(sponsors.id));
});

/* ---------------------------------------------------------------- gallery -- */

export const getGallery = cache(async () => {
  const editions = await db.select().from(galleryEditions).orderBy(asc(galleryEditions.sort));
  const items = await db.select().from(galleryItems).orderBy(asc(galleryItems.sort));

  return editions.map((edition) => ({
    ...edition,
    items: items.filter((i) => i.editionId === edition.id),
  }));
});

/* ------------------------------------------------------------------- FAQs -- */

export const getFaqs = cache(async () => {
  return db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sort));
});

/* -------------------------------------------------------------- documents -- */

/** Mandatory forms shown on /forms and gating registration. */
export const getMandatoryForms = cache(async () => {
  return db
    .select()
    .from(documents)
    .where(eq(documents.mandatory, true))
    .orderBy(asc(documents.sort));
});

/** Documents anyone may download — untagged, and not a mandatory form. */
export const getPublicDocuments = cache(async () => {
  return db
    .select()
    .from(documents)
    .where(and(isNull(documents.committeeId), eq(documents.mandatory, false)))
    .orderBy(asc(documents.sort));
});

/* ------------------------------------------------------------- fee tiers -- */

export const getFeeTiers = cache(async () => {
  return db.select().from(feeTiers).where(eq(feeTiers.active, true)).orderBy(asc(feeTiers.sort));
});

/** The delegate rate and the accommodation add-on, resolved for today. */
export const getPricing = cache(async () => {
  const tiers = await getFeeTiers();
  const now = Date.now();

  const inWindow = (t: (typeof tiers)[number]) =>
    (!t.startsAt || t.startsAt.getTime() <= now) && (!t.endsAt || t.endsAt.getTime() >= now);

  const base = tiers.find((t) => !t.isAddon && inWindow(t)) ?? tiers.find((t) => !t.isAddon);
  const addon = tiers.find((t) => t.isAddon && inWindow(t)) ?? tiers.find((t) => t.isAddon);

  return {
    base: base ?? null,
    accommodation: addon ?? null,
    baseAmount: base?.amount ?? 0,
    accommodationAmount: addon?.amount ?? 0,
    all: tiers,
  };
});

/* --------------------------------------------------------- site settings -- */

type HomeContent = {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  tagline: string;
  lede: string;
  stats: Record<string, { value: string | number; note: string }>;
  pillars: Array<{ num: string; title: string; body: string }>;
};

type RegistrationSettings = {
  open: boolean;
  opensAt: string | null;
  closesAt: string | null;
  message: string;
  seatsCap: number;
};

type ContactSettings = {
  delegates: string;
  partners: string;
  press: string;
  socials: Array<{ label: string; url: string }>;
};

export const getSetting = cache(async <T>(key: string, fallback: T): Promise<T> => {
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
  return (row?.value as T) ?? fallback;
});

export const getHomeContent = () =>
  getSetting<HomeContent>('home', {
    eyebrow: 'EDITION I · GUNTUR, ANDHRA PRADESH',
    titleLead: 'Lumen',
    titleAccent: 'MUN',
    tagline: 'LUMINATE . DEBATE . INSPIRE',
    lede: '',
    stats: {},
    pillars: [],
  });

export const getRegistrationSettings = () =>
  getSetting<RegistrationSettings>('registration', {
    open: true,
    opensAt: null,
    closesAt: null,
    message: 'Registration is open',
    seatsCap: 300,
  });

export const getContactSettings = () =>
  getSetting<ContactSettings>('contact', {
    delegates: 'delegates@lumenmun.org',
    partners: 'partners@lumenmun.org',
    press: 'press@lumenmun.org',
    socials: [],
  });

/**
 * Whether the registration form should accept submissions right now — the
 * explicit flag, narrowed by the open/close window if one is set.
 */
export async function registrationState() {
  const s = await getRegistrationSettings();
  const now = Date.now();
  const opens = s.opensAt ? new Date(s.opensAt).getTime() : null;
  const closes = s.closesAt ? new Date(s.closesAt).getTime() : null;

  if (!s.open) return { open: false, reason: 'closed' as const, message: s.message, opens, closes };
  if (opens && now < opens)
    return { open: false, reason: 'before' as const, message: s.message, opens, closes };
  if (closes && now > closes)
    return { open: false, reason: 'after' as const, message: s.message, opens, closes };

  return { open: true, reason: 'open' as const, message: s.message, opens, closes };
}

/* ---------------------------------------------------------- announcements -- */

export const getAnnouncements = cache(async (audience = 'all') => {
  return db
    .select()
    .from(announcements)
    .where(or(eq(announcements.audience, 'all'), eq(announcements.audience, audience)))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
    .limit(20);
});
