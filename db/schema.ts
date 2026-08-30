/**
 * LUMEN MUN — database schema (Postgres via Supabase, managed with Drizzle).
 *
 * Three groups of tables:
 *   1. Content   — everything the site renders. Editable from the admin console,
 *                  so committees, secretariat, schedule and sponsors change
 *                  without a redeploy.
 *   2. Delegates — the registration lifecycle: application, payment proof,
 *                  verification, allocation, check-in.
 *   3. Operations— admin accounts, audit trail, and the on-site tooling.
 *
 * Reinterpreted from the VIVAMUN Edition III model, with three additions it did
 * not have: chair bios on committees, a day-by-day schedule, and fee tiers.
 */

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ==========================================================================
   1. Content
   ========================================================================== */

/** Committee levels drive the badge on the card and the ordering of the list. */
export type CommitteeLevel = 'BEGINNER FRIENDLY' | 'INTERMEDIATE' | 'ADVANCED';
export type AgendaStatus = 'classified' | 'released';

export const committees = pgTable(
  'committees',
  {
    id: serial('id').primaryKey(),
    /** URL slug, e.g. "un-security-council". */
    slug: text('slug').notNull(),
    /** Short code shown in the readout, e.g. "GA / 1ST". */
    code: text('code').notNull(),
    name: text('name').notNull(),
    level: text('level').$type<CommitteeLevel>().notNull().default('INTERMEDIATE'),
    /** One-paragraph card copy. */
    blurb: text('blurb').notNull(),
    /** Long-form copy for the committee's own page. */
    overview: text('overview'),

    /** Agenda stays "classified" until the conference announcement. */
    agendaStatus: text('agenda_status').$type<AgendaStatus>().notNull().default('classified'),
    agendaTitle: text('agenda_title'),
    /** Ordered agenda items, released with the announcement. */
    agendaItems: jsonb('agenda_items').$type<string[]>().notNull().default([]),

    /* Dais — VIVAMUN carried no chair data; this is new. */
    chairName: text('chair_name'),
    chairRole: text('chair_role').default('Chairperson'),
    chairBio: text('chair_bio'),
    chairPhoto: text('chair_photo'),
    viceChairName: text('vice_chair_name'),
    viceChairRole: text('vice_chair_role').default('Vice-Chair'),
    viceChairBio: text('vice_chair_bio'),
    viceChairPhoto: text('vice_chair_photo'),

    image: text('image'),
    seats: integer('seats').notNull().default(0),
    sort: integer('sort').notNull().default(0),
    published: boolean('published').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_committees_slug').on(t.slug),
    index('idx_committees_sort').on(t.sort),
  ]
);

/** Secretariat, grouped into departments on the team page. */
export const secretariat = pgTable(
  'secretariat',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().default('To be announced'),
    role: text('role').notNull(),
    /** Department grouping: "Executive Board", "Organising Committee", "Under-Secretaries General". */
    department: text('department').notNull().default('Under-Secretaries General'),
    bio: text('bio'),
    photo: text('photo'),
    email: text('email'),
    sort: integer('sort').notNull().default(0),
    published: boolean('published').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_secretariat_dept').on(t.department, t.sort)]
);

/** Day-by-day agenda. New — VIVAMUN had no public schedule. */
export const scheduleDays = pgTable('schedule_days', {
  id: serial('id').primaryKey(),
  /** "DAY 01" */
  label: text('label').notNull(),
  title: text('title').notNull(),
  note: text('note'),
  /** Null until calendar dates are announced. */
  date: date('date'),
  sort: integer('sort').notNull().default(0),
  published: boolean('published').notNull().default(true),
});

export const scheduleSessions = pgTable(
  'schedule_sessions',
  {
    id: serial('id').primaryKey(),
    dayId: integer('day_id')
      .notNull()
      .references(() => scheduleDays.id, { onDelete: 'cascade' }),
    /** Free text so "To be announced" is a valid time. */
    startsAt: text('starts_at'),
    endsAt: text('ends_at'),
    title: text('title').notNull(),
    detail: text('detail'),
    venue: text('venue'),
    /** "ceremony" | "committee" | "break" | "social" — drives the marker colour. */
    kind: text('kind').notNull().default('committee'),
    sort: integer('sort').notNull().default(0),
  },
  (t) => [index('idx_sessions_day').on(t.dayId, t.sort)]
);

export type SponsorTier = 'title' | 'gold' | 'silver' | 'community';

export const sponsors = pgTable(
  'sponsors',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    tier: text('tier').$type<SponsorTier>().notNull().default('community'),
    blurb: text('blurb'),
    logo: text('logo'),
    url: text('url'),
    /** Tier price/perks shown on the partner page. */
    price: text('price'),
    perks: jsonb('perks').$type<string[]>().notNull().default([]),
    /** Confirmed partners render in the logo wall; unconfirmed stay as slots. */
    confirmed: boolean('confirmed').notNull().default(false),
    sort: integer('sort').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_sponsors_tier').on(t.tier, t.sort)]
);

export const galleryEditions = pgTable('gallery_editions', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  sort: integer('sort').notNull().default(0),
});

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: serial('id').primaryKey(),
    editionId: integer('edition_id').references(() => galleryEditions.id, { onDelete: 'cascade' }),
    /** Null image = an unshot slot, rendered as a hatched placeholder. */
    image: text('image'),
    caption: text('caption').notNull(),
    /** Grid span, 1 or 2. */
    span: integer('span').notNull().default(1),
    sort: integer('sort').notNull().default(0),
  },
  (t) => [index('idx_gallery_edition').on(t.editionId, t.sort)]
);

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').notNull().default('General'),
  sort: integer('sort').notNull().default(0),
  published: boolean('published').notNull().default(true),
});

export type DocumentKind = 'background_guide' | 'form' | 'handbook' | 'other';

export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    kind: text('kind').$type<DocumentKind>().notNull().default('other'),
    /** Committee-tagged documents are private to that committee's delegates. */
    committeeId: integer('committee_id').references(() => committees.id, { onDelete: 'set null' }),
    file: text('file').notNull(),
    sizeBytes: integer('size_bytes'),
    description: text('description'),
    /** Mandatory forms are surfaced on /forms and gate registration. */
    mandatory: boolean('mandatory').notNull().default(false),
    slot: text('slot'),
    sort: integer('sort').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_documents_committee').on(t.committeeId)]
);

/** Fee tiers — new. Lets early-bird / regular / late pricing be data-driven. */
export const feeTiers = pgTable('fee_tiers', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  /** Amount in whole rupees. */
  amount: integer('amount').notNull(),
  description: text('description'),
  /** 'individual' | 'school' | 'both' */
  appliesTo: text('applies_to').notNull().default('both'),
  /** Add-ons (accommodation) are priced per delegate and chosen at registration. */
  isAddon: boolean('is_addon').notNull().default(false),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  sort: integer('sort').notNull().default(0),
});

/** Free-form key/value content: homepage copy, registration window, flags. */
export const siteContent = pgTable('site_content', {
  key: text('key').primaryKey(),
  value: jsonb('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  /** 'all' | 'delegates' | committee slug */
  audience: text('audience').notNull().default('all'),
  pinned: boolean('pinned').notNull().default(false),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ==========================================================================
   2. Delegates
   ========================================================================== */

export type RegistrationStatus =
  | 'submitted'      // form in, no payment yet
  | 'pending_review' // payment proof supplied
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'cancelled';

export type PayMethod = 'reference' | 'screenshot' | 'exempt' | 'invoice';

/** School delegations: one coordinator, one invoice, many delegates. */
export const schoolDelegations = pgTable(
  'school_delegations',
  {
    id: serial('id').primaryKey(),
    ref: text('ref').notNull(),
    institution: text('institution').notNull(),
    coordinatorName: text('coordinator_name').notNull(),
    designation: text('designation'),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    /** Declared size band, e.g. "11-20". */
    sizeBand: text('size_band').notNull(),
    delegateCount: integer('delegate_count').notNull().default(0),
    facultyCount: text('faculty_count'),
    accommodation: text('accommodation').notNull().default('none'),
    committeeSpread: text('committee_spread'),
    invoicingNotes: text('invoicing_notes'),
    status: text('status').$type<RegistrationStatus>().notNull().default('submitted'),
    feeQuoted: integer('fee_quoted').notNull().default(0),
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_school_ref').on(t.ref),
    index('idx_school_status').on(t.status),
  ]
);

export const registrations = pgTable(
  'registrations',
  {
    id: serial('id').primaryKey(),
    /** Human-facing reference, e.g. LM1-7QK4D. */
    ref: text('ref').notNull(),

    /* Identity */
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    school: text('school').notNull(),
    grade: text('grade').notNull(),
    city: text('city'),
    gender: text('gender'),
    emergencyContact: text('emergency_contact'),

    /* Track */
    track: text('track').$type<'individual' | 'school'>().notNull().default('individual'),
    delegationId: integer('delegation_id').references(() => schoolDelegations.id, {
      onDelete: 'set null',
    }),

    /* Preferences */
    committee1: text('committee1').notNull(),
    committee2: text('committee2'),
    committee3: text('committee3'),
    countryPref1: text('country_pref1'),
    countryPref2: text('country_pref2'),
    experience: text('experience'),
    portfolioNote: text('portfolio_note'),
    notes: text('notes'),

    /* Account */
    passwordHash: text('password_hash'),
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: text('verification_token'),
    resetToken: text('reset_token'),
    resetTokenExpires: timestamp('reset_token_expires', { withTimezone: true }),

    /* Money */
    feeTierCode: text('fee_tier_code'),
    fee: integer('fee').notNull().default(0),
    accommodation: boolean('accommodation').notNull().default(false),
    payMethod: text('pay_method').$type<PayMethod>(),
    upiTxnId: text('upi_txn_id'),
    proofFile: text('proof_file'),

    /* Review + allocation */
    status: text('status').$type<RegistrationStatus>().notNull().default('submitted'),
    reviewNote: text('review_note'),
    adminNotes: text('admin_notes'),
    assignedCommittee: text('assigned_committee'),
    assignedCountry: text('assigned_country'),
    allocatedAt: timestamp('allocated_at', { withTimezone: true }),
    allocatedBy: text('allocated_by'),
    allocationLocked: boolean('allocation_locked').notNull().default(false),

    /* On-site */
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    checkedInBy: text('checked_in_by'),
    kitGivenAt: timestamp('kit_given_at', { withTimezone: true }),
    kitGivenBy: text('kit_given_by'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idx_registrations_ref').on(t.ref),
    index('idx_registrations_status').on(t.status),
    index('idx_registrations_committee').on(t.committee1),
    index('idx_registrations_created').on(t.createdAt),
    index('idx_registrations_delegation').on(t.delegationId),
  ]
);

/** Server-side session records so a superadmin can revoke a login. */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    /** 'delegate' | 'admin' */
    kind: text('kind').notNull(),
    /** Registration ref for delegates, username for admins. */
    subject: text('subject').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [index('idx_sessions_subject').on(t.kind, t.subject)]
);

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    topic: text('topic').notNull().default('Something else'),
    message: text('message').notNull(),
    handled: boolean('handled').notNull().default(false),
    handledBy: text('handled_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_contact_created').on(t.createdAt)]
);

/* ==========================================================================
   3. Operations
   ========================================================================== */

export type AdminRole = 'oc' | 'admin' | 'superadmin';

export const adminUsers = pgTable(
  'admin_users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<AdminRole>().notNull().default('oc'),
    permissions: jsonb('permissions').$type<Record<string, boolean>>().notNull().default({}),
    active: boolean('active').notNull().default(true),
    createdBy: text('created_by'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('idx_admin_username').on(t.username)]
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    actor: text('actor').notNull(),
    role: text('role'),
    action: text('action').notNull(),
    target: text('target'),
    detail: text('detail'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_audit_created').on(t.createdAt)]
);

export const allocationHistory = pgTable(
  'allocation_history',
  {
    id: serial('id').primaryKey(),
    ref: text('ref').notNull(),
    actor: text('actor').notNull(),
    /** 'allocate' | 'deallocate' | 'lock' | 'unlock' */
    action: text('action').notNull(),
    oldCommittee: text('old_committee'),
    newCommittee: text('new_committee'),
    oldCountry: text('old_country'),
    newCountry: text('new_country'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_alloc_hist_ref').on(t.ref)]
);

export const checkinLog = pgTable(
  'checkin_log',
  {
    id: serial('id').primaryKey(),
    ref: text('ref').notNull(),
    /** 'checked_in' | 'kit_given' | 'undo' */
    action: text('action').notNull(),
    actor: text('actor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_checkin_log_ref').on(t.ref)]
);

export const dailyCheckins = pgTable(
  'daily_checkins',
  {
    id: serial('id').primaryKey(),
    ref: text('ref').notNull(),
    day: date('day').notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }).notNull().defaultNow(),
    checkedInBy: text('checked_in_by'),
  },
  (t) => [uniqueIndex('idx_daily_ref_day').on(t.ref, t.day)]
);

/* ==========================================================================
   Inferred types
   ========================================================================== */

export type Committee = typeof committees.$inferSelect;
export type SecretariatMember = typeof secretariat.$inferSelect;
export type ScheduleDay = typeof scheduleDays.$inferSelect;
export type ScheduleSession = typeof scheduleSessions.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type GalleryEdition = typeof galleryEditions.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type FeeTier = typeof feeTiers.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type SchoolDelegation = typeof schoolDelegations.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
