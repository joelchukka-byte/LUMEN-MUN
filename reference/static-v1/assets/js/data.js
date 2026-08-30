/**
 * Lumen MUN — site content.
 *
 * Everything the conference will update between now and Edition I lives here:
 * committees, secretariat, schedule, sponsor tiers, FAQs and the design tokens.
 * Editing this file is the whole workflow — no markup changes required.
 */
window.LUMEN = (function () {
  'use strict';

  var TBA = 'To be announced';

  var committees = [
    {
      code: 'GA / 1ST',
      name: 'UN Security Council',
      level: 'ADVANCED',
      blurb: 'Fifteen-member crisis floor with veto powers, live updates and directive-driven debate.'
    },
    {
      code: 'GA / 3RD',
      name: 'Human Rights Council',
      level: 'BEGINNER FRIENDLY',
      blurb: 'Rights, protection mandates and accountability — the right first committee, run with a patient dais.'
    },
    {
      code: 'AIPPM',
      name: 'All India Political Parties Meet',
      level: 'ADVANCED',
      blurb: 'Indian domestic politics, party lines and coalition arithmetic. Portfolio research is decisive.'
    }
  ];

  var team = [
    'SECRETARY-GENERAL',
    'DIRECTOR-GENERAL',
    "CHARGÉ D'AFFAIRES",
    'CHIEF ADVISOR',
    'USG · DELEGATE AFFAIRS',
    'USG · ACADEMICS',
    'USG · MARKETING & DESIGN',
    'USG · LOGISTICS',
    'USG · FINANCE',
    'USG · SPONSORSHIP',
    'USG · PRESS & MEDIA',
    'USG · TECHNOLOGY'
  ].map(function (role) {
    return { name: TBA, role: role };
  });

  var days = [
    {
      label: 'DAY 01',
      title: 'Opening & first sessions',
      note: 'Registration, opening ceremony, keynote and the first two committee sessions.'
    },
    {
      label: 'DAY 02',
      title: 'Substantive debate',
      note: 'Full committee sessions, crisis updates, working papers and the delegate social.'
    },
    {
      label: 'DAY 03',
      title: 'Resolutions & close',
      note: 'Final session, voting procedure, press conference, closing ceremony and awards.'
    }
  ];

  var sponsorTiers = [
    {
      tag: 'TIER 01',
      name: 'Presenting partner',
      price: '₹1,00,000',
      perks: [
        'Naming rights in all communication',
        'Logo on backdrop, kits and certificates',
        'Keynote or address slot',
        'Booth at venue',
        'Dedicated social campaign'
      ]
    },
    {
      tag: 'TIER 02',
      name: 'Gold partner',
      price: '₹50,000',
      perks: [
        'Logo on backdrop and delegate kits',
        'Booth at venue',
        'Social media features',
        'Mention in closing ceremony'
      ]
    },
    {
      tag: 'TIER 03',
      name: 'Silver partner',
      price: '₹25,000',
      perks: [
        'Logo on backdrop and website',
        'Insert in delegate kit',
        'Social media mention'
      ]
    },
    {
      tag: 'TIER 04',
      name: 'Community partner',
      price: 'In kind',
      perks: [
        'Logo on website',
        'Category exclusivity where relevant',
        'Mention in press releases'
      ]
    }
  ];

  var logoSlots = Array.from({ length: 12 }, function (_, i) {
    return '[ PARTNER ' + String(i + 1).padStart(2, '0') + ' ]';
  });

  var gallery = [
    { span: 2, label: '[ GENERAL ASSEMBLY — WIDE ]' },
    { span: 1, label: '[ DELEGATE SPEAKING ]' },
    { span: 1, label: '[ PLACARD RAISED ]' },
    { span: 1, label: '[ DAIS ]' },
    { span: 1, label: '[ UNMODERATED CAUCUS ]' },
    { span: 2, label: '[ OPENING CEREMONY ]' },
    { span: 1, label: '[ AWARDS ]' },
    { span: 1, label: '[ PRESS CORPS AT WORK ]' },
    { span: 2, label: '[ SECRETARIAT GROUP PHOTO ]' }
  ];

  var faqs = [
    {
      q: 'Do I need prior MUN experience?',
      a: 'No. the Human Rights Council is run as a beginner-friendly committee, and every registered delegate gets a handbook plus an online training session on procedure, speech structure and resolution writing before day one.'
    },
    {
      q: 'When are the dates and agendas released?',
      a: 'Both publish together in the conference announcement. Registering interest now means you hear first — and interest registrations are processed ahead of the general queue.'
    },
    {
      q: 'How are committees and portfolios allocated?',
      a: 'You submit your committee preferences in order and a short statement of interest. The Academics department allocates on experience and preference balance; allocations are emailed within a week of registration close.'
    },
    {
      q: 'Can my school send a delegation?',
      a: 'Yes. Five or more delegates registered by a faculty coordinator counts as a school delegation: one invoice, one point of contact and priority allocation across committees.'
    },
    {
      q: 'What is included in the fee?',
      a: 'Three days of committee sessions, delegate kit, lunch and refreshments, certificates, and access to socials and the closing ceremony. Accommodation and travel are separate.'
    },
    {
      q: 'Is accommodation available?',
      a: 'A limited two-night twin-sharing package with breakfast and venue shuttle is offered as an add-on at registration, prioritised for out-of-city delegations.'
    },
    {
      q: 'Is there a dress code?',
      a: 'Western business formal for all committee sessions. Cultural formals are welcome for the closing ceremony and socials.'
    },
    {
      q: 'What awards are given?',
      a: 'Best Delegate, High Commendation and Special Mention per committee, plus a Best Delegation trophy across the conference.'
    }
  ].map(function (item, i) {
    return {
      num: String(i + 1).padStart(2, '0'),
      q: item.q,
      a: item.a
    };
  });

  var tokens = [
    { name: 'Crest maroon', hex: '#520823', use: 'PAGE BASE' },
    { name: 'Panel black', hex: '#1A0009', use: 'SURFACE / CARD' },
    { name: 'Field', hex: '#3A0618', use: 'SECTION FIELD' },
    { name: 'Deep maroon', hex: '#2A0210', use: 'GRADIENT ANCHOR' },
    { name: 'Hot-rod red', hex: '#C8102E', use: 'PRIMARY ACCENT' },
    { name: 'Repulsor red', hex: '#E8203A', use: 'HOVER / GRADIENT' },
    { name: 'Arc gold', hex: '#F9A61A', use: 'LINES / READOUTS' },
    { name: 'Signal', hex: '#EDE6E2', use: 'TEXT PRIMARY' }
  ];

  var spacing = [
    { label: '4 / xs', w: '16px' },
    { label: '8 / sm', w: '32px' },
    { label: '16 / md', w: '64px' },
    { label: '24 / lg', w: '96px' },
    { label: '40 / xl', w: '160px' },
    { label: '88 / 2xl', w: '260px' }
  ];

  return {
    tba: TBA,
    stats: { delegates: 300, committees: 3 },
    fee: { regular: 1500, accommodation: 2400 },
    committees: committees,
    team: team,
    days: days,
    sponsorTiers: sponsorTiers,
    logoSlots: logoSlots,
    gallery: gallery,
    faqs: faqs,
    tokens: tokens,
    spacing: spacing
  };
})();
