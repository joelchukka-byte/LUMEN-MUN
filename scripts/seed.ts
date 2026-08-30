/**
 * Seed the database with LUMEN MUN's launch content.
 *
 * This runs once to populate the tables the site reads from. After this, every
 * committee, secretariat member, schedule day, sponsor tier, FAQ and fee comes
 * out of Postgres and is edited in the admin console — nothing is baked into
 * the build.
 *
 *   npm run db:push     # create the tables
 *   npm run db:seed     # fill them
 *
 * Safe to re-run: rows are matched on their natural key and updated in place.
 */

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
  adminUsers,
} from '../db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/password';

const TBA = 'To be announced';

/* ------------------------------------------------------------- committees -- */

const COMMITTEES = [
  {
    slug: 'un-security-council',
    code: 'GA / 1ST',
    name: 'UN Security Council',
    level: 'ADVANCED' as const,
    blurb:
      'Fifteen-member crisis floor with veto powers, live updates and directive-driven debate.',
    overview:
      'The Security Council is responsible for maintaining international peace and security, and is the only UN body whose resolutions bind member states. With fifteen seats and the P5 veto, debate is fast and consequential: armed conflict, sanctions regimes, peacekeeping mandates and real-time crisis response. Directives are live from the first session: a delegate who has not read the guide will be found out inside an hour. Reserved for delegates who are confident on procedure and comfortable being outvoted.',
    seats: 15,
    chairRole: 'Chairperson',
    chairBio:
      'Chair announcements follow the committee release. The dais for this council is drawn from delegates with prior crisis experience and is briefed on directive handling before day one.',
    viceChairRole: 'Vice-Chair',
    viceChairBio:
      'The vice-chair runs the speakers list and crisis notes, and is the first point of contact for procedural questions during unmoderated caucus.',
    sort: 1,
  },
  {
    slug: 'human-rights-council',
    code: 'GA / 3RD',
    name: 'Human Rights Council',
    level: 'BEGINNER FRIENDLY' as const,
    blurb:
      'Rights, protection mandates and accountability: the right first committee, run with a patient dais.',
    overview:
      'A body of forty-seven member states that promotes and protects human rights worldwide. Delegates examine violations, debate mechanisms for accountability, and weigh protection mandates against sovereignty. This is the conference’s designated beginner-friendly floor: the dais explains procedure as it goes, points of order are teaching moments rather than traps, and every delegate gets feedback at the end of each session. Substantive without being punishing.',
    seats: 47,
    chairRole: 'Chairperson',
    chairBio:
      'This council is chaired by a member of the Academics department specifically briefed to run a teaching committee: procedure is corrected gently and explained rather than penalised.',
    viceChairRole: 'Vice-Chair',
    viceChairBio:
      'The vice-chair supports first-time delegates directly, including help structuring an opening speech and drafting a first working paper.',
    sort: 2,
  },
  {
    slug: 'aippm',
    code: 'AIPPM',
    name: 'All India Political Parties Meet',
    level: 'ADVANCED' as const,
    blurb:
      'Indian domestic politics, party lines and coalition arithmetic. Portfolio research is decisive.',
    overview:
      'Delegates represent named Indian politicians rather than countries, which changes the game entirely: you argue a party line, a constituency and a personal record, and the room knows when you have drifted from any of them. Coalition arithmetic decides outcomes more often than rhetoric. The most research-intensive committee at the conference: portfolio depth is rewarded heavily, and bluffing is visible immediately.',
    seats: 40,
    chairRole: 'Moderator',
    chairBio:
      'The AIPPM moderator is selected for command of Indian parliamentary practice and will hold delegates to their portfolio’s actual positions.',
    viceChairRole: 'Deputy Moderator',
    viceChairBio:
      'The deputy moderator tracks party-line consistency across sessions and manages the speakers list during high-pressure exchanges.',
    sort: 3,
  },
];

/* ------------------------------------------------------------ secretariat -- */

const SECRETARIAT: Array<[string, string]> = [
  ['SECRETARY-GENERAL', 'Executive Board'],
  ['DIRECTOR-GENERAL', 'Executive Board'],
  ["CHARGÉ D'AFFAIRES", 'Executive Board'],
  ['CHIEF ADVISOR', 'Executive Board'],
  ['USG · DELEGATE AFFAIRS', 'Under-Secretaries General'],
  ['USG · ACADEMICS', 'Under-Secretaries General'],
  ['USG · MARKETING & DESIGN', 'Under-Secretaries General'],
  ['USG · LOGISTICS', 'Organising Committee'],
  ['USG · FINANCE', 'Organising Committee'],
  ['USG · SPONSORSHIP', 'Organising Committee'],
  ['USG · PRESS & MEDIA', 'Under-Secretaries General'],
  ['USG · TECHNOLOGY', 'Under-Secretaries General'],
];

const DEPARTMENT_BIOS: Record<string, string> = {
  'Executive Board':
    'Sets the academic standard for the conference, appoints the dais, and holds final authority on procedure and awards.',
  'Under-Secretaries General':
    'Runs a department end to end: agendas and study guides, delegate communication, design, press, or the conference’s technology.',
  'Organising Committee':
    'Everything that makes three days happen on the ground: venue, catering, finance, sponsorship and delegate logistics.',
};

/* --------------------------------------------------------------- schedule -- */

const SCHEDULE = [
  {
    label: 'DAY 01',
    title: 'Opening & first sessions',
    note: 'Registration, opening ceremony, keynote and the first two committee sessions.',
    sessions: [
      ['08:30', '09:30', 'Delegate registration & kit collection', 'check', 'Main foyer'],
      ['09:30', '10:45', 'Opening ceremony and keynote address', 'ceremony', 'Auditorium'],
      ['11:00', '13:00', 'Committee session I: roll call, agenda setting', 'committee', 'Committee rooms'],
      ['13:00', '14:00', 'Lunch', 'break', 'Dining hall'],
      ['14:00', '16:30', 'Committee session II: general speakers list', 'committee', 'Committee rooms'],
      ['16:30', '17:00', 'Dais debrief & day one close', 'ceremony', 'Committee rooms'],
    ],
  },
  {
    label: 'DAY 02',
    title: 'Substantive debate',
    note: 'Full committee sessions, crisis updates, working papers and the delegate social.',
    sessions: [
      ['09:00', '11:30', 'Committee session III: moderated caucus', 'committee', 'Committee rooms'],
      ['11:45', '13:00', 'Committee session IV: working papers', 'committee', 'Committee rooms'],
      ['13:00', '14:00', 'Lunch', 'break', 'Dining hall'],
      ['14:00', '17:00', 'Committee session V: crisis updates & draft resolutions', 'committee', 'Committee rooms'],
      ['19:00', '22:00', 'Delegate social', 'social', 'To be announced'],
    ],
  },
  {
    label: 'DAY 03',
    title: 'Resolutions & close',
    note: 'Final session, voting procedure, press conference, closing ceremony and awards.',
    sessions: [
      ['09:00', '11:30', 'Committee session VI: amendments', 'committee', 'Committee rooms'],
      ['11:45', '13:00', 'Voting procedure', 'committee', 'Committee rooms'],
      ['13:00', '14:00', 'Lunch', 'break', 'Dining hall'],
      ['14:00', '15:00', 'International Press conference', 'ceremony', 'Auditorium'],
      ['15:30', '17:30', 'Closing ceremony & awards', 'ceremony', 'Auditorium'],
    ],
  },
];

/* --------------------------------------------------------------- sponsors -- */

const SPONSOR_TIERS = [
  {
    name: 'Presenting partner',
    tier: 'title' as const,
    price: '₹1,00,000',
    perks: [
      'Naming rights in all communication',
      'Logo on backdrop, kits and certificates',
      'Keynote or address slot',
      'Booth at venue',
      'Dedicated social campaign',
    ],
    blurb: 'The headline partnership: your name sits alongside the conference’s in every piece of communication.',
    sort: 1,
  },
  {
    name: 'Gold partner',
    tier: 'gold' as const,
    price: '₹50,000',
    perks: [
      'Logo on backdrop and delegate kits',
      'Booth at venue',
      'Social media features',
      'Mention in closing ceremony',
    ],
    blurb: 'High visibility across the venue and the delegate kit, with a presence on the floor.',
    sort: 2,
  },
  {
    name: 'Silver partner',
    tier: 'silver' as const,
    price: '₹25,000',
    perks: ['Logo on backdrop and website', 'Insert in delegate kit', 'Social media mention'],
    blurb: 'A straightforward presence at the conference and in delegates’ hands.',
    sort: 3,
  },
  {
    name: 'Community partner',
    tier: 'community' as const,
    price: 'In kind',
    perks: [
      'Logo on website',
      'Category exclusivity where relevant',
      'Mention in press releases',
    ],
    blurb: 'For partners contributing goods, services or venue support rather than cash.',
    sort: 4,
  },
];

/* ------------------------------------------------------------------- FAQs -- */

const FAQS: Array<[string, string, string]> = [
  [
    'Delegates',
    'Do I need prior MUN experience?',
    'No. The Human Rights Council is run as a beginner-friendly committee, and every registered delegate gets a handbook plus an online training session on procedure, speech structure and resolution writing before day one.',
  ],
  [
    'Conference',
    'When are the dates and agendas released?',
    'Both publish together in the conference announcement. Registering interest now means you hear first, and interest registrations are processed ahead of the general queue.',
  ],
  [
    'Delegates',
    'How are committees and portfolios allocated?',
    'You submit your committee preferences in order and a short statement of interest. The Academics department allocates on experience and preference balance; allocations are emailed within a week of registration close.',
  ],
  [
    'Schools',
    'Can my school send a delegation?',
    'Yes. Five or more delegates registered by a faculty coordinator counts as a school delegation: one invoice, one point of contact and priority allocation across committees.',
  ],
  [
    'Fees',
    'What is included in the fee?',
    'Three days of committee sessions, delegate kit, lunch and refreshments, certificates, and access to socials and the closing ceremony. Accommodation and travel are separate.',
  ],
  [
    'Fees',
    'Is accommodation available?',
    'A limited two-night twin-sharing package with breakfast and venue shuttle is offered as an add-on at registration, prioritised for out-of-city delegations.',
  ],
  [
    'Conference',
    'Is there a dress code?',
    'Western business formal for all committee sessions. Cultural formals are welcome for the closing ceremony and socials.',
  ],
  [
    'Conference',
    'What awards are given?',
    'Best Delegate, High Commendation and Special Mention per committee, plus a Best Delegation trophy across the conference.',
  ],
  [
    'Payment',
    'How do I pay, and when is my seat confirmed?',
    'Pay by UPI to the ID shown after you submit the form, then upload either the transaction reference or a screenshot. Your seat is confirmed once Finance verifies the payment: usually within 48 hours, and you get an email either way.',
  ],
  [
    'Delegates',
    'What if I need to change committee after allocating?',
    'Raise a committee change request from your dashboard. Changes depend on space and are decided by the Academics department; allocations locked ahead of the conference cannot be moved.',
  ],
];

/* -------------------------------------------------------------- documents -- */

const FORMS = [
  {
    slot: 'coc',
    title: 'Code of Conduct',
    description:
      'The standards of professionalism, respect and integrity expected of every participant throughout the conference.',
  },
  {
    slot: 'liability',
    title: 'Liability Release',
    description:
      'Confirms you take part at your own risk and releases LUMEN MUN from liability. Requires a parent or guardian signature for delegates who are minors.',
  },
  {
    slot: 'technology',
    title: 'Technology Release',
    description:
      'Your responsibility for personal devices and the responsible use of technology during the conference.',
  },
];

/* ------------------------------------------------------------------- main -- */

async function seed() {
  console.log('→ seeding LUMEN MUN content\n');

  /* Committees */
  for (const c of COMMITTEES) {
    const [existing] = await db.select().from(committees).where(eq(committees.slug, c.slug)).limit(1);
    const row = {
      ...c,
      chairName: TBA,
      viceChairName: TBA,
      agendaStatus: 'classified' as const,
      agendaItems: [],
      updatedAt: new Date(),
    };
    if (existing) await db.update(committees).set(row).where(eq(committees.id, existing.id));
    else await db.insert(committees).values(row);
  }
  console.log(`  committees        ${COMMITTEES.length}`);

  /* Secretariat */
  await db.delete(secretariat);
  await db.insert(secretariat).values(
    SECRETARIAT.map(([role, department], i) => ({
      name: TBA,
      role,
      department,
      bio: DEPARTMENT_BIOS[department],
      sort: i,
    }))
  );
  console.log(`  secretariat       ${SECRETARIAT.length}`);

  /* Schedule */
  await db.delete(scheduleSessions);
  await db.delete(scheduleDays);
  for (const [i, day] of SCHEDULE.entries()) {
    const [inserted] = await db
      .insert(scheduleDays)
      .values({ label: day.label, title: day.title, note: day.note, sort: i })
      .returning();

    await db.insert(scheduleSessions).values(
      day.sessions.map(([startsAt, endsAt, title, kind, venue], j) => ({
        dayId: inserted.id,
        startsAt,
        endsAt,
        title,
        kind,
        venue,
        sort: j,
      }))
    );
  }
  console.log(`  schedule days     ${SCHEDULE.length}`);

  /* Sponsors */
  await db.delete(sponsors);
  await db.insert(sponsors).values(SPONSOR_TIERS.map((s) => ({ ...s, confirmed: false })));
  console.log(`  sponsor tiers     ${SPONSOR_TIERS.length}`);

  /* Gallery */
  await db.delete(galleryItems);
  await db.delete(galleryEditions);
  const [edition] = await db
    .insert(galleryEditions)
    .values({ label: 'Edition I', sort: 1 })
    .returning();

  const TILES: Array<[string, number]> = [
    ['[ GENERAL ASSEMBLY: WIDE ]', 2],
    ['[ DELEGATE SPEAKING ]', 1],
    ['[ PLACARD RAISED ]', 1],
    ['[ DAIS ]', 1],
    ['[ UNMODERATED CAUCUS ]', 1],
    ['[ OPENING CEREMONY ]', 2],
    ['[ AWARDS ]', 1],
    ['[ PRESS CORPS AT WORK ]', 1],
    ['[ SECRETARIAT GROUP PHOTO ]', 2],
  ];
  await db.insert(galleryItems).values(
    TILES.map(([caption, span], i) => ({ editionId: edition.id, caption, span, sort: i }))
  );
  console.log(`  gallery slots     ${TILES.length}`);

  /* FAQs */
  await db.delete(faqs);
  await db.insert(faqs).values(
    FAQS.map(([category, question, answer], i) => ({ category, question, answer, sort: i }))
  );
  console.log(`  faqs              ${FAQS.length}`);

  /* Fee tiers */
  await db.delete(feeTiers);
  await db.insert(feeTiers).values([
    {
      code: 'regular',
      name: 'Regular registration',
      amount: 1500,
      description: 'One rate for individual delegates and school delegations alike. Applies until seats fill.',
      appliesTo: 'both',
      sort: 1,
    },
    {
      code: 'accommodation',
      name: 'Accommodation package',
      amount: 2400,
      description: 'Two nights, twin sharing, breakfast and shuttle to venue. Limited allocation for out-of-city delegations.',
      appliesTo: 'both',
      isAddon: true,
      sort: 2,
    },
  ]);
  console.log('  fee tiers         2');

  /* Mandatory forms + background guide placeholders */
  await db.delete(documents);
  await db.insert(documents).values(
    FORMS.map((f, i) => ({
      title: f.title,
      kind: 'form' as const,
      file: `/docs/${f.slot}.pdf`,
      description: f.description,
      mandatory: true,
      slot: f.slot,
      sort: i,
    }))
  );
  console.log(`  documents         ${FORMS.length}`);

  /* Homepage & site settings */
  const content: Array<[string, unknown]> = [
    [
      'home',
      {
        eyebrow: 'EDITION I · GUNTUR, ANDHRA PRADESH',
        titleLead: 'Lumen',
        titleAccent: 'MUN',
        tagline: 'LUMINATE . DEBATE . INSPIRE',
        lede: 'Three hundred delegates. Three committees. One inaugural conference built for the standard of debate Guntur has been waiting for: rigorous procedure, substantive agendas, and a dais that expects your best.',
        stats: {
          dates: { value: TBA, note: 'RELEASING SHORTLY' },
          venue: { value: 'Guntur', note: 'ANDHRA PRADESH, IN' },
          delegates: { value: 300, note: 'SEATS PLANNED' },
          committees: { value: 3, note: 'AGENDAS PENDING' },
        },
        pillars: [
          {
            num: '01',
            title: 'Rigorous procedure',
            body: 'UNA-USA rules of procedure, trained chairs, and executive board briefings before day one.',
          },
          {
            num: '02',
            title: 'Substantive agendas',
            body: 'Every agenda is researched with a study guide, not lifted from a template. Released with committee announcements.',
          },
          {
            num: '03',
            title: 'First-timers welcome',
            body: 'A beginner committee, pre-conference training sessions, and delegate handbooks for every school.',
          },
        ],
      },
    ],
    [
      'registration',
      {
        open: true,
        opensAt: null,
        closesAt: null,
        message: 'Registration is open',
        seatsCap: 300,
      },
    ],
    [
      'contact',
      {
        delegates: 'delegates@lumenmun.org',
        partners: 'partners@lumenmun.org',
        press: 'press@lumenmun.org',
        socials: [],
      },
    ],
  ];

  for (const [key, value] of content) {
    const [existing] = await db.select().from(siteContent).where(eq(siteContent.key, key)).limit(1);
    if (existing) {
      await db.update(siteContent).set({ value, updatedAt: new Date() }).where(eq(siteContent.key, key));
    } else {
      await db.insert(siteContent).values({ key, value });
    }
  }
  console.log(`  site content      ${content.length} keys`);

  /* A named staff account so the console is usable without the env owner login. */
  const [existingAdmin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, 'academics'))
    .limit(1);

  if (!existingAdmin) {
    await db.insert(adminUsers).values({
      username: 'academics',
      displayName: 'Academics desk',
      passwordHash: await hashPassword('change-me-now'),
      role: 'admin',
      createdBy: 'seed',
    });
    console.log('  staff account     academics / change-me-now  ← CHANGE THIS');
  }

  console.log('\n✓ seed complete');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n✗ seed failed:', error);
    process.exit(1);
  });
