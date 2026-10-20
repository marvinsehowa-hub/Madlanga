/**
 * Register of people appearing in, or named by, the Madlanga Commission of
 * Inquiry and Parliament's parallel Ad Hoc Committee.
 *
 * EDITORIAL RULES for this file - please keep to them when adding entries:
 *  1. Nothing here is a finding of guilt. The commission has not reported.
 *     Every entry under `allegations` is an ALLEGATION, phrased as such.
 *  2. Every allegation carries a `basis`:
 *       'video'         - directly evidenced by a hearing clip in videos.json
 *       'public-record' - widely reported / on the public record, not yet
 *                         re-verified against a primary document here
 *  3. Where a person has denied something on the record, record the denial in
 *     `response`. Never leave an allegation standing alone if a denial exists.
 *  4. `matchers` are lowercase substrings used to link a person to hearing
 *     footage. Keep them specific enough not to collide (e.g. 'cat matlala'
 *     rather than 'cat').
 */

export const CATEGORY = {
  accused: {
    key: 'accused',
    label: 'Implicated / accused',
    blurb:
      'Named in allegations of wrongdoing before the commission, the Ad Hoc Committee or the courts. No adverse finding has been made against anyone in this list.',
    tone: 'red',
  },
  witness: {
    key: 'witness',
    label: 'Witnesses & complainants',
    blurb:
      'People who gave evidence. Appearing here is not an accusation - several are whistleblowers or investigators.',
    tone: 'blue',
  },
  commission: {
    key: 'commission',
    label: 'The commission',
    blurb: 'Commissioners and evidence leaders running the inquiry.',
    tone: 'green',
  },
  legal: {
    key: 'legal',
    label: 'Legal representatives',
    blurb:
      'Counsel appearing for parties and witnesses. Appearing here is not an accusation - they are doing their job.',
    tone: 'violet',
  },
  political: {
    key: 'political',
    label: 'Political & oversight',
    blurb:
      'Executive, parliamentary and party actors shaping or contesting the inquiry.',
    tone: 'amber',
  },
};

/**
 * Whether someone the commission expected to hear from has actually been heard.
 *
 * The register would otherwise only show people who DID appear, which quietly
 * hides the ones who were summoned and did not - often the most telling fact
 * on the record.
 */
export const APPEARANCE = {
  appeared: { label: 'Gave evidence', outstanding: false, tone: 'green' },
  ordered: { label: 'Ordered to attend', outstanding: true, tone: 'amber' },
  postponed: { label: 'Testimony postponed', outstanding: true, tone: 'amber' },
  'stood-down': {
    label: 'Stood down before questioning',
    outstanding: true,
    tone: 'amber',
  },
  // Distinct from 'in-custody', which covers someone held on a matter that has
  // nothing to do with the inquiry. This is custody arising from the inquiry
  // itself - the commission's process reaching a person who would not come.
  arrested: {
    label: 'Arrested over non-appearance',
    outstanding: true,
    tone: 'red',
  },
  'subpoena-ignored': {
    label: 'Subpoena ignored',
    outstanding: true,
    tone: 'red',
  },
  // Detained in a different forum's proceedings. Outstanding as far as this
  // inquiry is concerned, but for a reason that is not refusal - a distinction
  // worth keeping, since the panel is read as a list of people avoiding it.
  'in-custody': {
    label: 'In custody elsewhere',
    outstanding: true,
    tone: 'red',
  },
};

/** How central a named person is to the core allegations. */
export const SEVERITY = {
  central: { label: 'Central figure', rank: 3 },
  implicated: { label: 'Implicated', rank: 2 },
  named: { label: 'Named / questioned', rank: 1 },
};

export const people = [
  /* ------------------------------------------------------------------ */
  /* Central allegations                                                 */
  /* ------------------------------------------------------------------ */
  {
    id: 'mchunu',
    name: 'Senzo Mchunu',
    role: 'Minister of Police (placed on special leave)',
    org: 'SAPS / Cabinet',
    category: 'accused',
    severity: 'central',
    status: 'On special leave since July 2025; has testified',
    summary:
      'The most senior figure named. Lt-Gen Mkhwanazi alleged that Mchunu shut down the Political Killings Task Team to protect a criminal syndicate, and that he had undisclosed links to people implicated in it. Mchunu has consistently denied wrongdoing and appeared before the commission to explain the disbandment.',
    allegations: [
      {
        what: 'Ordered the disbandment of the KwaZulu-Natal Political Killings Task Team (PKTT) in December 2024, allegedly to frustrate investigations touching a criminal syndicate.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response:
          'Mchunu told the commission the unit was closed for legitimate operational reasons.',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'smJr7BQeYpk',
        responseClip: 'eyeg6DwCKho',
      },
      {
        what: 'Alleged association with Brown Mogotsi, said to be a conduit to businessman Vusimuzi "Cat" Matlala.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi (messages presented on Day 3)',
        forum: 'Madlanga Commission',
        response: 'Mchunu has denied any improper relationship.',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'kR4CtbvGy70',
      },
      {
        what: 'National Commissioner Masemola described Mchunu becoming "visibly angry" in an exchange over the task team.',
        by: 'Gen Fannie Masemola',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2025-10-21',
        clip: 'TTvM62EcoCo',
      },
      {
        what: 'The commission asked a witness whether she had been "fearful of the Minister", indicating an inquiry into pressure on officials.',
        by: 'Justice Mbuyiseli Madlanga (to Adv Andrea Johnson)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-07-24',
        clip: 'Fsf8JQyCM6o',
      },
    ],
    matchers: ['senzo mchunu', 'mchunu'],
  },
  {
    id: 'matlala',
    name: 'Vusimuzi Matlala',
    aka: '"Cat" Matlala',
    role: 'Businessman; Medicare24 / SAPS health-services contractor',
    org: 'Private sector',
    category: 'accused',
    severity: 'central',
    status:
      'In custody (Kgosi Mampuru); appeared before the commission 24 Aug 2026, questioning stood down',
    appearance: {
      status: 'stood-down',
      date: '2026-08-24',
      clip: '3RS_exbNsU4',
      detail:
        'Brought before the commission but not questioned. His counsel obtained a stand-down because his lead counsel was absent. No substantive evidence by him to the commission is on the published record.',
    },
    summary:
      "The businessman at the centre of the syndicate allegations. Holder of a large SAPS health-services contract later cancelled, arrested in 2025 on attempted-murder charges, and alleged to have cultivated relationships with senior police officers and politicians. He gave evidence to Parliament's Ad Hoc Committee from prison in December 2025. He came before the Madlanga Commission itself on 24 August 2026, but was not questioned that day: his counsel asked for a stand-down because his lead counsel was absent. No substantive testimony by him to the commission appears in the published record yet.",
    allegations: [
      {
        what: 'Alleged to have bought influence over police officials and politicians, including through gifts, payments and personal relationships.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi and multiple witnesses',
        forum: 'Madlanga Commission / Ad Hoc Committee',
        response:
          'Matlala has denied wrongdoing and disputed characterisations of his conduct in heated committee exchanges.',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'BjHHCm34Urc',
      },
      {
        what: 'Mkhwanazi alleged a planned raid on Matlala\'s prison cell was exposed, and that he enjoyed "privilege above the law".',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'W2DonPlf3Fw',
      },
      {
        what: 'A SAPS brigadier testified to having had a romantic relationship with him; a general was questioned over cosmetic surgery allegedly paid for by him.',
        by: 'Brig Rachel Matjeng; questioning of Gen Hilda Senthumule',
        forum: 'Madlanga Commission / Ad Hoc Committee',
        response:
          'Gen Senthumule confirmed the surgery but said she paid for it herself, not Matlala.',
        basis: 'video',
        presented: '2026-02-21',
        clip: '_ZuSmho0JhI',
        responseClip: 'zGQ2hQ8FUKA',
      },
      {
        what: 'Told the Ad Hoc Committee police raided his house for seven hours.',
        by: 'Self (evidence)',
        forum: 'Ad Hoc Committee',
        response: '—',
        basis: 'video',
        presented: '2025-12-21',
        clip: '4Xmyu84qF7A',
      },
    ],
    notes: [
      '24 Aug 2026 - brought before the Madlanga Commission. Adv Fatima Missi, his counsel, requested a stand-down, arguing it would be unfair to question him without his lead legal representative present.',
      '24 Aug 2026 - Missi confirmed to the commission that the team "will continue to represent" him, settling a question over whether his representation would fall away.',
      'His evidence to date is to the Ad Hoc Committee (Dec 2025), not to the commission. Take care not to read the two forums as one.',
    ],
    matchers: ['matlala', 'cat matlala', 'vusimuzi'],
  },
  {
    id: 'mogotsi',
    name: 'Brown Mogotsi',
    role: 'North West businessman; associate of the Police Minister',
    org: 'Private sector',
    category: 'accused',
    severity: 'central',
    status: 'Testified; declined to answer key questions',
    summary:
      'Alleged intermediary between Matlala and political principals. When called before the commission he repeatedly refused to answer, invoking self-incrimination, and his legal team clashed with the chair.',
    allegations: [
      {
        what: 'Alleged conduit between businessman Matlala and Minister Mchunu; messages placed before the commission were said to link the two.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response:
          'Mkhwanazi separately told the Ad Hoc Committee that Mogotsi is "just an information peddler".',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'kR4CtbvGy70',
        responseClip: 'iJGrvg0ZXFY',
      },
      {
        what: 'Refused to answer questions from evidence leader Adv Mathew Chaskalson, stating he did not want to incriminate himself.',
        by: 'On the record at the hearing',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-05-21',
        clip: '7HzsCrUPmDM',
      },
      {
        what: 'A witness said he had been "played" by Matlala and Mogotsi.',
        by: 'Suliman Carrim',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'zOPgFK2z37Q',
      },
    ],
    matchers: ['brown mogotsi', 'mogotsi'],
  },
  {
    id: 'sibiya',
    name: 'Lt-Gen Shadrack Sibiya',
    role: 'Former Deputy National Commissioner: Crime Detection',
    org: 'SAPS (resigned 12 Oct 2026)',
    category: 'accused',
    severity: 'central',
    status:
      'Resigned from SAPS 12 Oct 2026, which SAPS treats as a dishonourable discharge; refused bail 20 Oct, back in court 24 Nov',
    appearance: {
      status: 'in-custody',
      date: '2026-10-20',
      clip: 'kG83ijPxKSU',
      detail:
        'Now a criminal defendant in his own right rather than only a commission witness. The criminal case is separate from the commission and is not about the PKTT: he was arrested on 21 September 2026 and faces charges in the Randburg Magistrate\'s Court reported as rape, sexual grooming, human trafficking and negligent possession of a firearm. He denies them — he disputes the grooming allegations and says the encounter with the 18-year-old was consensual — and none has been tested at trial. On 20 October Magistrate Hleziphi Mkhasibe refused him bail, finding he had not shown the exceptional circumstances that would justify release, and citing a likelihood that he would interfere with witnesses or evidence: "He destroyed evidence, threatened the witnesses." He stays in custody and returns to court on 24 November for further investigation. It is recorded here only to explain that custody: the commission has heard nothing about these charges.',
    },
    summary:
      'Accused of carrying out the instruction to close the PKTT and of taking possession of its case dockets, and placed at the centre of questions about interference in a live murder investigation. By late September 2026 the suspended deputy national commissioner was himself in custody on unrelated criminal charges. On 12 October 2026 he resigned from the police shortly after his disciplinary hearing opened, ending those proceedings before any of the seven charges against him were tested; SAPS regards the departure as a dishonourable discharge.',
    allegations: [
      {
        what: 'Alleged to have implemented the disbandment of the PKTT and to have had its dockets removed to his office.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response: 'Sibiya has denied acting improperly.',
        basis: 'public-record',
        presented: '2025-09-21',
        clip: null,
        presentedNote:
          'Put to the commission during Mkhwanazi’s opening testimony; not isolated in a single published clip.',
      },
      {
        what: 'A general testified he was tasked by Sibiya to find out what charges Katiso Molefe had been arrested on.',
        by: 'Gen Richard Shibiri',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'PflNFLpPeRk',
      },
      {
        what: 'His conduct was put to Sgt Fannie Nkosi during questioning about Mkhwanazi and Sibiya.',
        by: 'Evidence leaders',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'yqqLJFsqzLk',
      },
    ],
    matchers: ['shadrack sibiya', 'gen sibiya', 'general sibiya'],
  },
  {
    id: 'molefe',
    name: 'Katiso Molefe',
    aka: '"KT" Molefe',
    role: 'Businessman',
    org: 'Private sector',
    category: 'accused',
    severity: 'implicated',
    status: 'Criminal proceedings; arrest a subject of commission evidence',
    summary:
      'Businessman whose arrest and the police response to it became a thread of the inquiry, including allegations that senior officers sought information about the charges against him.',
    allegations: [
      {
        what: 'Mkhwanazi named a JMPD officer with alleged ties to Molefe.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2025-09-21',
        clip: '4oOY9iePMsQ',
      },
      {
        what: 'Senior officers allegedly sought to establish what charges he faced after arrest.',
        by: 'Gen Richard Shibiri (describing an instruction from Gen Sibiya)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'PflNFLpPeRk',
      },
    ],
    matchers: ['katiso molefe', 'kt molefe', 'molefe'],
  },
  {
    id: 'fadiel-adams',
    name: 'Fadiel Adams',
    role: 'Member of Parliament; National Coloured Congress leader',
    org: 'Parliament / NCC',
    category: 'accused',
    severity: 'implicated',
    status: 'Questioned by both forums; has appeared at the commission',
    summary:
      'Alleged by Mkhwanazi to have had unauthorised access to classified information. His name resurfaced in 2026 during other witnesses\' testimony, and he has since appeared before the commission himself.',
    allegations: [
      {
        what: 'Alleged unauthorised access to classified police information.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response:
          'Adams has contested the allegations and appeared before both the Ad Hoc Committee and the commission.',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'M0kuu7lzE_g',
        responseClip: 'TswlDaniozk',
      },
      {
        what: 'His name arose again during the questioning of witness Brian Padayachee.',
        by: 'Evidence leaders',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-07-21',
        clip: 'w0lJIqVHek8',
      },
    ],
    matchers: ['fadiel adams', 'fedial adams', 'ncc president'],
  },
  {
    id: 'feroz-khan',
    name: 'Feroz Khan',
    aka: 'former Maj-Gen',
    role: 'Former Major-General, SAPS',
    org: 'SAPS (former)',
    category: 'accused',
    severity: 'implicated',
    status:
      'Appeared 6 Oct 2026 but did not testify; postponed to a date yet to be determined. Subpoena finding of 28 Sep 2026 stands',
    appearance: {
      status: 'postponed',
      date: '2026-10-06',
      clip: 'cYtnoSGmGO8',
      detail:
        "On 28 September 2026 the chair found the subpoena had been lawfully issued and that Khan had failed to comply with it, directing the commission's secretary to pursue charges. He then appeared remotely and in camera on 6 October to be questioned about evidence led in his absence, but did not testify: an uncle-in-law of his had been shot dead on the R21 the night before, and the commission said only that he was \"not in a position to testify today\". His evidence is postponed to a date yet to be determined. He has still never given evidence, more than a year after first being named.",
    },
    summary:
      'Named on Day 3 of the hearings in relation to a police drug operation that was allegedly foiled, and again in 2026 when a witness was ordered to clarify a remark about him.',
    allegations: [
      {
        what: 'Alleged role in foiling a police drug operation.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'XkqO3zknzzY',
      },
      {
        what: 'A witness was required by the commission to clarify a remark she made about him.',
        by: 'Commission (to Takalani Maphosho)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-06-21',
        clip: 'g3qDK26wO7Y',
      },
      {
        what: "Failed to appear before the commission despite a subpoena, his legal team not attending virtually either. The chair rejected counsel's position as 'absolutely nonsensical' on the question of whether Khan would be ready to testify.",
        by: 'Justice Mbuyiseli Madlanga',
        forum: 'Madlanga Commission',
        response:
          'Khan is represented by Adv Valley, whose position that day the chair rejected. Nothing further is on the published record.',
        basis: 'video',
        presented: '2026-09-28',
        clip: '1SoLR9-A_sA',
      },
      {
        what: 'The commission said it will lay criminal charges against him over his failure to comply with the subpoena to appear.',
        by: 'Madlanga Commission',
        forum: 'Madlanga Commission',
        response: 'Nothing from Khan or his team is on the published record.',
        basis: 'video',
        presented: '2026-09-28',
        clip: 'cYtnoSGmGO8',
      },
    ],
    matchers: ['feroz khan', 'general khan', "gen khan"],
  },
  {
    id: 'andrea-johnson',
    name: 'Adv Andrea Johnson',
    role: 'Head of the Investigating Directorate Against Corruption (IDAC)',
    org: 'NPA / IDAC',
    category: 'accused',
    severity: 'implicated',
    status: 'Resigned; returned to face further questioning (July-Aug 2026)',
    summary:
      'The most sustained line of cross-examination in the 2026 hearings. Put under pressure over IDAC\'s handling of matters raised by Mkhwanazi and over evidence she previously gave to Parliament. She resigned and then returned to the witness box.',
    allegations: [
      {
        what: 'Put to her by evidence leader Adv Sello that she "lied to the Ad Hoc Committee".',
        by: 'Adv Sello (evidence leader)',
        forum: 'Madlanga Commission',
        response:
          'Johnson contested the characterisation; the exchange ran over several sessions.',
        basis: 'video',
        presented: '2026-07-24',
        clip: 'OcAUIA8YOd0',
      },
      {
        what: 'Questioned over PKTT allegations contained in a section 27 affidavit.',
        by: 'Adv Sello',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-07-31',
        clip: 'mB-o5Wq2GwU',
      },
      {
        what: 'Required to apologise to Brigadier Mokwele during proceedings.',
        by: 'Commission',
        forum: 'Madlanga Commission',
        response: 'She made the apology.',
        basis: 'video',
        presented: '2026-07-24',
        clip: 'i2CVmovBolc',
      },
    ],
    matchers: ['andrea johnson', 'andreajohnson', 'idac'],
  },
  {
    id: 'julius-mkhwanazi',
    name: 'Julius Mkhwanazi',
    role: 'Suspended Tshwane Metro Police chief; former EMPD deputy chief',
    org: 'TMPD / EMPD',
    category: 'accused',
    severity: 'implicated',
    status: 'Suspended; testified over several sessions',
    summary:
      'Metro police executive (no relation to Lt-Gen Nhlanhla Mkhwanazi) whose appointment, finances and family history were probed over multiple appearances, including claims about donations.',
    allegations: [
      {
        what: 'Claims about donations linked to him were put to a witness, who told the commission there was "no donation".',
        by: 'Evidence leaders (via witness Kemi Behari)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-02-21',
        clip: '7qmR1FbFGDI',
      },
      {
        what: 'Extended questioning about his personal and family history, which he said he was uncomfortable discussing in public.',
        by: 'Commission',
        forum: 'Madlanga Commission',
        response:
          'He clarified a disputed point about a funeral, and told the commission "I am not a cry baby".',
        basis: 'video',
        presented: '2026-04-21',
        clip: 'pSEmcR9KOUc',
        responseClip: 'mU96iNvQ9PY',
      },
    ],
    matchers: ['julius mkhwanazi', 'tshwane metro police', 'empd deputy chief'],
  },
  {
    id: 'gareth-mnisi',
    name: 'Gareth Mnisi',
    role: 'Suspended Chief Financial Officer, City of Tshwane',
    org: 'City of Tshwane',
    category: 'accused',
    severity: 'implicated',
    status: 'Suspended; cross-examined over several days (April-May 2026)',
    summary:
      'Suspended municipal CFO whose cross-examination by evidence leader Adv Mathew Chaskalson and the commissioners became one of the most-watched stretches of the 2026 hearings.',
    allegations: [
      {
        what: 'Sustained cross-examination over municipal financial decisions; the chair had to instruct him to answer the question.',
        by: 'Adv Mathew Chaskalson and the commissioners',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-04-21',
        clip: 'Gywv-AGzGEc',
      },
    ],
    matchers: ['gareth mnisi', 'mnisi', 'tshwane cfo'],
  },
  {
    id: 'shibiri',
    name: 'Gen Richard Shibiri',
    role: 'SAPS general',
    org: 'SAPS',
    category: 'accused',
    severity: 'implicated',
    status: 'Testified; testimony described as inconsistent',
    summary:
      'Gave evidence about being tasked to establish the charges against Katiso Molefe. His shifting account drew questions from the chair and he accused an evidence leader of tricking him.',
    allegations: [
      {
        what: 'Changed his account under questioning ("the great flip-flop"), prompting questions from the chair.',
        by: 'Commission',
        forum: 'Madlanga Commission',
        response:
          'Shibiri accused evidence leader Adv Lee Segeels-Ncube of "tricking" him.',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'gfpYq9l1zp0',
        responseClip: 'tWPHgIu2jpI',
      },
    ],
    matchers: ['shibiri', 'richard shibiri'],
  },
  {
    id: 'magane',
    name: 'W/O Marumo Magane',
    role: 'Warrant Officer, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'implicated',
    status: 'Testified on the Aeroton drug bust',
    summary:
      'Questioned over the Aeroton drug bust. Commissioner Baloyi put to him directly that he had planned to steal drugs, and that he had contaminated the crime scene.',
    allegations: [
      {
        what: 'Accused of planning to steal drugs recovered in the Aeroton bust.',
        by: 'Commissioner Adv Sesi Baloyi',
        forum: 'Madlanga Commission',
        response: 'Magane admitted he had "stuffed up".',
        basis: 'video',
        presented: '2026-05-21',
        clip: 'ngPpbnvk4ZM',
        responseClip: 'dJcYzFNlju4',
      },
      {
        what: 'Told by the commissioner: "you are ignorant and you contaminated the crime scene".',
        by: 'Commissioner Adv Sesi Baloyi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-05-21',
        clip: 'TEK7McjITWM',
      },
    ],
    matchers: ['magane', 'marumo magane'],
  },
  {
    id: 'maphosho',
    name: 'Takalani Zelda Maphosho',
    role: 'Witness in the Aeroton matter',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Testified',
    summary:
      'Questioned by Commissioner Khumalo on the Aeroton drug bust and required to clarify a remark she had made about Maj-Gen Feroz Khan.',
    allegations: [
      {
        what: 'Questioned on her role and account in the Aeroton drug bust.',
        by: 'Commissioner Adv Sandile Khumalo',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-06-21',
        clip: '9G1Y6BtQPQ8',
      },
    ],
    matchers: ['maphosho', 'takalani'],
  },
  {
    id: 'kwazikwakhe-sibiya',
    name: 'Lt-Col Kwazikwakhe Sibiya',
    role: 'Lieutenant-Colonel, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Testimony concluded',
    summary:
      'Accused by Commissioner Baloyi of having copied his statement from that of a colleague, Col Gavin Jacob. No relation established to Lt-Gen Shadrack Sibiya.',
    allegations: [
      {
        what: 'Accused of copying his witness statement from Col Gavin Jacob\'s statement.',
        by: 'Commissioner Adv Sesi Baloyi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-06-21',
        clip: 'Jj8SfTclEYQ',
      },
    ],
    matchers: ['kwazikwakhe'],
  },
  {
    id: 'senona',
    name: 'Gen Senona',
    role: 'SAPS general',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Ordered to attend hearings (June 2026)',
    appearance: {
      status: 'ordered',
      date: '2026-06-05',
      clip: 'ALiYcUzePD4',
      detail:
        'Justice Madlanga ordered him to be in attendance at 09:30 on Friday 5 June 2026. Whether he then gave evidence is not established by the published clip record.',
    },
    summary:
      'Named by a warrant officer who said Senona subjected him to a polygraph test over a stolen coffee machine. The chair ordered Senona to attend the hearings in person.',
    allegations: [
      {
        what: 'Alleged to have put a subordinate through a polygraph test over a stolen coffee machine, in a workplace-intimidation context.',
        by: 'W/O Karl Sander',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-06-04',
        clip: 'SRWD_tQhgHI',
        presentedNote:
          'Clip published ~21 Jun 2026, but the chair’s resulting order is dated 5 Jun 2026, so this testimony was given before that date.',
      },
      {
        what: 'Ordered by Justice Madlanga to be in attendance at 09:30 on Friday 5 June 2026.',
        by: 'Justice Mbuyiseli Madlanga',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-06-05',
        clip: 'ALiYcUzePD4',
      },
    ],
    matchers: ['senona'],
  },
  {
    id: 'lebogang-phiri',
    name: 'Maj Lebogang Phiri',
    role: 'Major, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Testified',
    summary:
      'Questioned about personal finances, telling the commission he had paid his R1 million bond in full.',
    allegations: [
      {
        what: 'Questioned over the source of funds used to settle a R1 million home loan.',
        by: 'Evidence leaders',
        forum: 'Madlanga Commission',
        response: 'Phiri said he paid the bond in full from his own means.',
        basis: 'video',
        presented: '2026-05-21',
        clip: 'lJZ5XkM3Pxc',
      },
    ],
    matchers: ['lebogang phiri'],
  },
  {
    id: 'padayachee',
    name: 'Brian Padayachee',
    role: 'Witness',
    org: '—',
    category: 'accused',
    severity: 'named',
    status: 'Testified (July 2026)',
    summary:
      'Faced intense questioning across two sessions; the name of MP Fadiel Adams surfaced during his evidence.',
    allegations: [
      {
        what: 'Subjected to sustained questioning; his evidence brought MP Fadiel Adams back into the frame.',
        by: 'Evidence leaders',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-07-21',
        clip: 'eph8hpww7Eo',
      },
    ],
    matchers: ['padayachee'],
  },
  {
    id: 'mpangase',
    name: 'W/O Mbongeleni Mpangase',
    role: 'Warrant Officer, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Testified (July 2026)',
    summary:
      'Questioned by Commissioner Baloyi on the Port Shepstone drug bust. He denied making an entry in his own investigation diary.',
    allegations: [
      {
        what: 'Denied making an entry in his investigation diary, raising questions about the docket record.',
        by: 'Commission',
        forum: 'Madlanga Commission',
        response: 'Mpangase denied the entry was his.',
        basis: 'video',
        presented: '2026-07-21',
        clip: 'hVFNkwYYktk',
      },
      {
        what: 'Questioned on his role in the Port Shepstone drug bust.',
        by: 'Commissioner Adv Sesi Baloyi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-07-21',
        clip: 'kdQzIAKmGhY',
      },
    ],
    matchers: ['mpangase'],
  },
  {
    id: 'nku',
    name: 'Mr Nku',
    role: 'Witness',
    org: '—',
    category: 'accused',
    severity: 'named',
    status: 'Testimony postponed, then resumed',
    summary:
      'Refused to disclose how he obtained certain information, saying it would be self-incriminating. His testimony was postponed and later resumed.',
    allegations: [
      {
        what: 'Declined to explain how he acquired information, invoking self-incrimination.',
        by: 'On the record at the hearing',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-07-21',
        clip: 'Qz1BLyIEP6M',
      },
    ],
    matchers: ['mr. nku', 'nku refuses', "nku's"],
  },
  {
    id: 'matjeng',
    name: 'Brig Rachel Matjeng',
    role: 'Brigadier, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Testified (Feb 2026)',
    summary:
      'Testified that she had been in a romantic relationship with Vusimuzi "Cat" Matlala - part of the commission\'s inquiry into personal ties between the businessman and serving officers.',
    allegations: [
      {
        what: 'Personal relationship with a businessman at the centre of the syndicate allegations.',
        by: 'Self (evidence)',
        forum: 'Madlanga Commission',
        response: 'Disclosed voluntarily under questioning.',
        basis: 'video',
        presented: '2026-02-21',
        clip: '_ZuSmho0JhI',
      },
    ],
    matchers: ['matjeng'],
  },
  {
    id: 'senthumule',
    name: 'Gen Hilda Senthumule',
    role: 'General, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Answered questions at the Ad Hoc Committee',
    summary:
      'Questioned about whether Matlala funded cosmetic surgery for her. She confirmed the procedure but said she paid for it herself.',
    allegations: [
      {
        what: 'Alleged that a cosmetic procedure was paid for by Vusimuzi "Cat" Matlala.',
        by: 'Ad Hoc Committee members',
        forum: 'Ad Hoc Committee',
        response:
          '"Yes I had a BBL surgery done but I paid for it myself, not Matlala."',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'DJY6bhjtJ7k',
        responseClip: 'zGQ2hQ8FUKA',
      },
    ],
    matchers: ['senthumule'],
  },
  {
    id: 'carrim',
    name: 'Suliman Carrim',
    aka: 'former ANC North West regional treasurer',
    role: 'Businessman; witness',
    org: '—',
    category: 'accused',
    severity: 'named',
    status:
      'Gave evidence March 2026; did not return for further questioning. Charged under the Commissions Act; bail judgment due 28 Oct',
    appearance: {
      status: 'arrested',
      date: '2026-10-15',
      detail:
        'He gave evidence in March 2026, then did not come back for further questioning. After a run of postponement requests on medical grounds, the chair refused an indefinite postponement on 29 July and ordered him to appear in person on 14 August, with any further delay conditional on his agreeing to be examined by a jointly chosen specialist. He did not appear on 14 August and declined the independent examination, filing a further report from his own doctor instead; the commission said it was minded to refer him for prosecution. He was arrested on the evening of 15 October at OR Tambo, with his wife, about to board a flight to Dubai, and appeared in the Pretoria Magistrate\'s Court the next day charged with contravening the Commissions Act over the repeated non-appearance. Bail has twice gone undecided: on 16 October the state asked for time to check a return ticket he produced, and on 19 October Magistrate John Curlewis put judgment off again to 28 October, wanting a transcript of his commission evidence after the state argued he had tailored his account of his health, the trip and his failure to tell anyone he was leaving. Investigators say they found a return ticket booked for 28 October; the defence says his wife held it. His counsel Hendrik Potgieter has put up R50,000, citing no previous convictions and settled business ties here. He is held at Kgosi Mampuru. Nothing against him has been tested, and the charge is about not attending — not about the subject matter of his evidence.',
    },
    summary:
      'Told the commission that Matlala and Mogotsi had "played" him, and described a loan of around R10 million to Matlala, whose company held the disputed SAPS health-services contract. His legal team had a heated exchange with the chair. He never returned for further questioning, and by October 2026 his non-appearance had become the subject of a criminal arrest.',
    allegations: [
      {
        what: 'Dealings with Matlala and Mogotsi, which he characterised as having been manipulated.',
        by: 'Self (evidence)',
        forum: 'Madlanga Commission',
        response: '"Vusimuzi Cat Matlala and Brown Mogotsi played me."',
        basis: 'video',
        presented: '2026-03-21',
        clip: 'zOPgFK2z37Q',
      },
    ],
    matchers: ['carrim'],
  },
  {
    id: 'kemi-behari',
    name: 'Kemi Behari',
    role: 'Witness',
    org: '—',
    category: 'accused',
    severity: 'named',
    status: 'Testified (Feb 2026)',
    summary:
      'Questioned by Justice Madlanga over claims of a donation connected to Julius Mkhwanazi; admitted there had been no donation.',
    allegations: [
      {
        what: 'Claims of a donation connected to metro police chief Julius Mkhwanazi.',
        by: 'Commission',
        forum: 'Madlanga Commission',
        response: 'Behari admitted no donation was made.',
        basis: 'video',
        presented: '2026-02-21',
        clip: '7qmR1FbFGDI',
      },
    ],
    matchers: ['behari'],
  },
  {
    id: 'suleiman-kareem',
    name: 'Suleiman Kareem',
    role: 'North West businessman',
    org: 'Private sector',
    category: 'accused',
    severity: 'named',
    status: 'Named in evidence (Sept 2025)',
    summary:
      'Named by Lt-Gen Mkhwanazi during his opening testimony as a North West businessman of interest to the allegations.',
    allegations: [
      {
        what: 'Named by the complainant general during opening testimony.',
        by: 'Lt-Gen Nhlanhla Mkhwanazi',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2025-09-21',
        clip: 'ShWcRu2lGNY',
      },
    ],
    matchers: ['suleiman kareem', 'kareem'],
  },
  {
    id: 'sindane',
    name: 'Oupa Bafana Sindane',
    aka: '"King of the Sky" — taxi boss',
    role: 'Taxi industry figure; subpoenaed witness',
    org: '—',
    category: 'accused',
    severity: 'implicated',
    status:
      'Subpoenaed but never appeared; his WhatsApp messages were read in his absence (28 Sep 2026)',
    appearance: {
      status: 'subpoena-ignored',
      date: '2026-09-28',
      detail:
        'Subpoenaed by the commission, he did not appear. The chair dismissed his challenge to the subpoena, finding he had left it until late in the process, and his messages were put before the commission while he was absent — evidence he was not there to answer. A second attempt to interdict the commission was struck from the court roll in early October, no papers having been filed.',
    },
    // Surfaced inside the evidence described in a clip, never in a clip title.
    evidenceOnly: true,
    summary:
      'A Mpumalanga taxi boss, central to the WhatsApp material evidence leader Adv Mathew Chaskalson put before the commission on 28 September 2026, concerning who was communicating with whom and under what contact names. He was subpoenaed and never came. Separately, he and Sibanyoni are among four men facing extortion and money-laundering charges in the Delmas Magistrate\'s Court; all four are out on R70,000 bail each and the trial now sits in April 2027.',
    allegations: [
      {
        what: 'Forwarded a press statement regarding "Kwagga 20" to a Sgt Mthumunye, having saved that number under the name of Major-General Botsotso Moukangwe. Chaskalson told the commission that when the number was traced it was Moukangwe.',
        by: 'Adv Mathew Chaskalson (evidence leader)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-09-28',
        clip: 'ugFYG1OgWtI',
      },
      {
        what: 'Chaskalson told the commission there are "other suggestions" that Sindane and Sibanyoni employ izinkabi — hired killers. This was put as a suggestion arising from the evidence, not as a finding.',
        by: 'Adv Mathew Chaskalson (evidence leader)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-09-28',
        clip: 'ugFYG1OgWtI',
      },
    ],
    matchers: ['sindane'],
  },
  {
    id: 'sibanyoni',
    name: 'Joe Sibanyoni',
    aka: '"Ferrari" — taxi boss',
    role: 'Taxi industry figure; witness before the commission',
    org: '—',
    category: 'accused',
    severity: 'implicated',
    status:
      'Gave evidence 29–30 Sep 2026. Separately on trial for extortion with three others; case postponed to 20 Apr 2027, on R70,000 bail',
    appearance: {
      status: 'appeared',
      date: '2026-09-30',
      clip: 'ikv64myh5qE',
      detail:
        'Heard across two consecutive days, 29 and 30 September 2026 — roughly 16 hours — starting the day after the WhatsApp material naming him was led. He was excused at the close of 30 September and asked to make a statement before leaving.',
    },
    summary:
      'Named alongside Sindane in the WhatsApp evidence led on 28 September 2026, and heard by the commission over the two days that followed. The published record names both sittings after him but carries no clip breaking out what he said, so his answers are not indexed here.',
    allegations: [
      {
        what: 'Chaskalson told the commission there are "other suggestions" that Sindane and Sibanyoni employ izinkabi — hired killers. This was put as a suggestion arising from the evidence, not as a finding.',
        by: 'Adv Mathew Chaskalson (evidence leader)',
        forum: 'Madlanga Commission',
        response:
          'He told the commission that izinkabi means the men who protect taxi bosses and ranks, not contract killers, and denied supporting taxi violence. He also challenged the use of the phone material itself, calling it an "absolute abuse and open-ended violation" of his privacy, and said Sindane was acting on his own in sending a threatening message.',
        basis: 'video',
        presented: '2026-09-28',
        clip: 'ugFYG1OgWtI',
      },
    ],
    notes: [
      "He faces a separate criminal matter before a magistrate, and told the commission that Chaskalson 'cannot be the magistrate of that court'. He said that if he were found guilty he would blame Chaskalson, because the court is listening to the commission while he is there 'just to assist' (29 Sep 2026).",
      'Chaskalson questioned him about a photograph of him with President Ramaphosa and Minister Mantashe taken during elections, which had been sent by Sgt Nkosi (30 Sep 2026).',
      'On being excused he asked to speak, thanking the commission for the chance to "explain myself… to the public" and to clear narratives he said were not positive to him as a president, father and grandfather. He accused the evidence leader of at times "becoming personal", and quoted Matthew 5:11-12 on being reviled and persecuted. Source: a screen recording supplied by the user and transcribed locally; it is not in the indexed clip record.',
    ],
    matchers: ['sibanyoni', 'ferrari'],
  },
  {
    id: 'moukangwe',
    name: 'Maj-Gen Botsotso Moukangwe',
    role: 'Major-General, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Named in WhatsApp evidence (28 Sep 2026)',
    evidenceOnly: true,
    summary:
      'Named in the contact-tracing evidence led on 28 September 2026. Nothing beyond the tracing of a phone number has been put against him on the published record.',
    allegations: [
      {
        what: 'A number saved in Sindane’s phone under Moukangwe’s name was, Chaskalson told the commission, traced back to Moukangwe.',
        by: 'Adv Mathew Chaskalson (evidence leader)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-09-28',
        clip: 'ugFYG1OgWtI',
      },
    ],
    matchers: ['moukangwe'],
  },
  {
    id: 'mthumunye',
    name: 'Sgt Mthumunye',
    role: 'Sergeant, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    status: 'Named in WhatsApp evidence (28 Sep 2026)',
    evidenceOnly: true,
    summary:
      'Named only as the recipient of a forwarded message in the material led on 28 September 2026. No allegation of wrongdoing by him appears on the published record.',
    allegations: [
      {
        what: 'Received a press statement regarding "Kwagga 20" forwarded by Sindane. His number had been saved under another officer’s name.',
        by: 'Adv Mathew Chaskalson (evidence leader)',
        forum: 'Madlanga Commission',
        response: '—',
        basis: 'video',
        presented: '2026-09-28',
        clip: 'ugFYG1OgWtI',
      },
    ],
    matchers: ['mthumunye'],
  },

  {
    id: 'kekana',
    name: 'Musa Kekana',
    role: 'Accused number one in the criminal case against Matlala and four others',
    org: '—',
    category: 'accused',
    severity: 'named',
    status: 'On trial, Johannesburg High Court (Sep 2026)',
    summary:
      'A co-accused in the criminal prosecution running alongside the inquiry, not a commission witness. His significance to this record is that he has alleged serious police misconduct against himself — the same police conduct the commission exists to examine.',
    allegations: [
      {
        what: 'Charged as accused number one in the Johannesburg High Court case against Vusimuzi "Cat" Matlala and four others.',
        by: 'The State',
        forum: 'Criminal courts',
        response:
          'He alleges he was tortured by police after his arrest, assaulted until he coughed up blood.',
        basis: 'video',
        presented: '2026-09-15',
        clip: 'ht5FioprMqw',
      },
    ],
    matchers: ['kekana'],
  },

  /* ------------------------------------------------------------------ */
  /* Surfaced by the written record (newslivesa.co.za), not by footage.   */
  /* These carry basis: 'article' so their provenance stays visible.      */
  /* ------------------------------------------------------------------ */
  {
    id: 'nkabinde',
    name: 'Cedrick Nkabinde',
    role: 'Witness before the Ad Hoc Committee',
    org: '—',
    category: 'accused',
    severity: 'named',
    sourcedFrom: 'article',
    status: 'Testified repeatedly; perjury case opened against him (Nov 2025)',
    appearance: {
      status: 'appeared',
      date: '2025-11-27',
      clip: null,
      detail:
        'Appeared before the Ad Hoc Committee and was questioned over several sittings by MPs from the ANC, ActionSA and others.',
    },
    summary:
      'A repeat witness before Parliament’s Ad Hoc Committee, questioned over several sittings. He told it that Paul O’Sullivan had plotted his downfall and described Lt-Gen Mkhwanazi as a close friend. The EFF then opened a perjury case over what he had said.',
    allegations: [
      {
        what: 'The EFF laid a perjury case against him over his testimony to the Ad Hoc Committee.',
        by: 'Economic Freedom Fighters',
        forum: 'Criminal courts',
        response: 'Not recorded in the indexed reporting.',
        basis: 'article',
        presented: '2025-11-13',
        clip: null,
        article: 837,
      },
    ],
    matchers: ['nkabinde'],
  },
  {
    id: 'kruger',
    name: 'Captain Kruger',
    role: 'Captain, SAPS',
    org: 'SAPS',
    category: 'accused',
    severity: 'named',
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'Criticised in evidence (Nov 2025)',
    summary:
      'Named only in another officer’s criticism of how he handled a matter. No allegation of wrongdoing beyond that appears in the indexed record.',
    allegations: [
      {
        what: 'Criticised by W/O Sabelo Nkosi in blunt terms over his conduct in a matter before the commission.',
        by: 'W/O Sabelo Nkosi',
        forum: 'Madlanga Commission',
        response: 'Not recorded in the indexed reporting.',
        basis: 'article',
        presented: '2025-11-03',
        clip: null,
        article: 732,
      },
    ],
    matchers: ['kruger'],
  },

  /* ------------------------------------------------------------------ */
  /* Witnesses & complainants                                            */
  /* ------------------------------------------------------------------ */
  {
    id: 'govender',
    name: 'Lt Col Deenadayalan Govender',
    role: 'Lieutenant-Colonel, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'Directed to testify in open hearing (Aug 2026)',
    summary:
      'The chair refused an application for his evidence to be heard in camera, directing that he testify in open hearing instead — one of the few published rulings on how evidence is to be taken.',
    allegations: [],
    notes: [
      'Justice Madlanga denied the in-camera bid and ruled he would testify in open hearing (30 Aug 2026).',
    ],
    matchers: ['govender'],
  },
  {
    id: 'nhlanhla-khumalo',
    name: 'Gen Nhlanhla Khumalo',
    role: 'General, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'Resumed testimony (Nov 2025)',
    summary:
      'Returned to the witness box to continue evidence begun earlier. Not to be confused with Commissioner Adv Sandile Khumalo.',
    allegations: [],
    notes: [],
    matchers: ['nhlanhla khumalo'],
  },
  {
    id: 'sabelo-nkosi',
    name: 'W/O Sabelo Nkosi',
    role: 'Warrant Officer, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'Gave evidence (Nov 2025)',
    summary:
      'Gave evidence criticising a fellow officer’s handling of a matter. A different person from Sgt Fannie Nkosi, who also testified.',
    allegations: [],
    notes: [],
    matchers: ['sabelo nkosi'],
  },
  {
    id: 'thobejane',
    name: 'Tebogo Thobejane',
    role: 'Complainant in the attempted-murder case against Matlala',
    org: '—',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    status: 'Target of the alleged hit; complainant in the criminal case',
    summary:
      'Matlala’s former partner and the intended target of the failed contract killing that underpins the criminal case against him.',
    allegations: [],
    notes: [
      'Reporting places the sum paid for the failed hit on her at R150,000 (31 Oct 2025).',
    ],
    matchers: ['thobejane'],
  },
  {
    id: 'bushiri',
    name: 'Shepherd Bushiri',
    role: 'Preacher; accuser of a senior police officer',
    org: '—',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'Made a public accusation (Nov 2025)',
    summary:
      'Publicly accused Lt-Gen Shadrack Sibiya of involvement in a bribery scandal. The accusation was made outside the commission, not in evidence before it.',
    allegations: [],
    notes: [],
    matchers: ['bushiri'],
  },
  {
    id: 'mathale',
    name: 'Cassel Mathale',
    role: 'Former Deputy Minister of Police',
    org: '—',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'Due before the Ad Hoc Committee (Oct 2025)',
    summary:
      'Scheduled to appear before Parliament’s Ad Hoc Committee. Whether he did is not established by the indexed record.',
    allegations: [],
    notes: [],
    matchers: ['mathale'],
  },
  {
    id: 'lebeya',
    name: 'Dr Godfrey Lebeya',
    role: 'Retired National Head, Directorate for Priority Crime Investigation (Hawks)',
    org: 'DPCI (former)',
    category: 'witness',
    severity: null,
    sourcedFrom: 'article',
    status: 'Gave evidence; questioned closely by the chair (Sep 2026)',
    appearance: {
      status: 'appeared',
      date: '2026-09-07',
      clip: null,
      detail:
        'The retired head of the Hawks was questioned closely by Justice Madlanga from the bench.',
    },
    summary:
      'The retired head of the Hawks, questioned closely by the chair in September 2026. Separately, Justice Madlanga publicly denied a rumour that a remark from the bench had been aimed at him.',
    allegations: [],
    notes: [
      'The chair denied rumours that a joke from the bench had targeted him (18 Sep 2026).',
    ],
    matchers: ['lebeya'],
  },
  {
    id: 'gigaba',
    name: 'Malusi Gigaba',
    role: 'Politician; subject of an IDAC engagement',
    org: '—',
    category: 'political',
    severity: null,
    sourcedFrom: 'article',
    evidenceOnly: true,
    status: 'No court appearance; IDAC engagement ongoing (Nov 2025)',
    summary:
      'IDAC confirmed an ongoing engagement involving him while correcting expectations of a court appearance. Nothing further about him appears in the indexed record.',
    allegations: [],
    notes: [],
    matchers: ['gigaba'],
  },
  {
    id: 'thobakgale',
    name: 'Makgothi Thobakgale',
    role: 'National Commissioner, Department of Correctional Services',
    org: 'DCS',
    category: 'witness',
    severity: null,
    status: 'Gave evidence 17 Sep 2026',
    appearance: {
      status: 'appeared',
      date: '2026-09-17',
      clip: 'kuhh3gbE4uI',
      detail: 'Testified on prison gangs and inmate conduct.',
    },
    summary:
      'The head of Correctional Services, who gave evidence on 17 September 2026 about gangs operating inside South African prisons, naming groups he called the "Varados" and the "Fast Guns". His evidence went to how organised crime operates from inside custody.',
    allegations: [],
    notes: [
      'Told the commission that gangs including the "Varados" and "Fast Guns" operate inside prisons.',
      'Gave the example of an inmate, Thabo Bester, who he said had tried a number of times to get his attention alone. Bester is not otherwise a subject of this inquiry.',
    ],
    matchers: ['thobakgale'],
  },
  {
    id: 'the-eff',
    name: 'Economic Freedom Fighters',
    role: 'Political party, acting institutionally',
    org: 'EFF',
    category: 'political',
    severity: null,
    institutional: true,
    status: 'Party actor in and around both forums',
    summary:
      'A node for the party acting as a body — laying cases, calling for witnesses to be summoned — so those acts attach to something in the graph instead of being dropped. Its individual members are listed separately.',
    allegations: [],
    notes: [],
    matchers: [],
  },
  {
    id: 'the-state',
    name: 'The State',
    role: 'The prosecution, acting institutionally',
    org: 'NPA',
    category: 'legal',
    severity: null,
    institutional: true,
    status: 'Prosecuting the criminal matters running alongside the inquiry',
    summary:
      'A node for the prosecution as a body, so charges brought in the criminal courts attach to something in the graph instead of being dropped. It is not a person and carries no imputation against anyone.',
    allegations: [],
    notes: [],
    matchers: [],
  },
  {
    id: 'van-den-heever',
    name: 'Annelene Van den Heever',
    role: 'Defence counsel for Vusimuzi "Cat" Matlala',
    org: 'Private bar',
    category: 'legal',
    severity: null,
    status: 'Appearing for Matlala in the criminal trial',
    summary:
      'Defends Matlala in the Johannesburg High Court prosecution running in parallel with the commission — a different forum from the inquiry, and a distinction worth keeping straight.',
    allegations: [],
    notes: [],
    matchers: ['van den heever'],
  },
  {
    id: 'valley',
    name: 'Adv Valley',
    role: 'Counsel for former Maj-Gen Feroz Khan',
    org: 'Private bar',
    category: 'legal',
    severity: null,
    status: 'Appearing for Khan; rebuked by the chair 28 Sep 2026',
    summary:
      'Counsel for Feroz Khan. On 28 September 2026 the chair rejected his position on whether Khan would be ready to testify, and the commission recorded that Khan’s team had not appeared virtually and had ignored a subpoena.',
    allegations: [],
    notes: [
      'The chair to him, 28 Sep 2026: that his point was "absolutely nonsensical" as to whether Khan would be ready to testify.',
    ],
    matchers: ['valley'],
  },
  {
    id: 'nhlanhla-mkhwanazi',
    name: 'Lt-Gen Nhlanhla Mkhwanazi',
    role: 'KwaZulu-Natal Provincial Commissioner',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status: 'Complainant; first witness; has endorsed the commission\'s work',
    summary:
      'The officer whose July 2025 press briefing triggered the entire inquiry. He alleged that a criminal syndicate had captured parts of the police, intelligence services and the criminal justice system, and that the PKTT was disbanded to protect it. He was the commission\'s opening witness.',
    allegations: [],
    notes: [
      'Told the Ad Hoc Committee that Brown Mogotsi is "just an information peddler".',
      'Said in 2026 he was "happy with their work", endorsing the commission.',
      'Himself the subject of a counter-allegation: a witness named Mlotshwa implicated him in torture before the Ad Hoc Committee - an allegation he rejects.',
    ],
    matchers: [
      'nhlanhla mkhwanazi',
      'general mkhwanazi',
      'gen mkhwanazi',
      'mkwanazi',
    ],
  },
  {
    id: 'masemola',
    name: 'Gen Fannie Masemola',
    role: 'National Commissioner of Police',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status:
      'Testified (Oct 2025). Suspended Apr 2026 over charges since withdrawn; reinstated 16 Oct 2026',
    summary:
      'The national police commissioner, who gave evidence on the instruction to close the task team and on his interactions with the minister. He spent six months on precautionary suspension over a criminal case that was then dropped, and was reinstated in October 2026.',
    allegations: [],
    notes: [
      'Described Minister Mchunu becoming "visibly angry" - "it was my first time seeing a Minister angry".',
      'Charged by IDAC on 4 May 2026 with four counts under the Public Finance Management Act, over the police health-services tender held by Matlala, and suspended in April after his first court appearance. The national director of public prosecutions instructed on 15 September that the charges be withdrawn following a review of IDAC\'s case, and the Pretoria Magistrate\'s Court withdrew them on 22 September. A withdrawal is not an acquittal - the allegations were never tested - but the prosecution is over.',
      'Reinstated by President Ramaphosa on 16 October 2026 and back to full duties on 19 October, saying on his return that it was about putting the police back to work. Lt-Gen Puleng Dimpane acted as national commissioner in the interim.',
    ],
    matchers: ['masemola'],
  },
  {
    id: 'karl-sander',
    name: 'W/O Karl Sander',
    role: 'Warrant Officer, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status: 'Testified (June 2026)',
    summary:
      'Became emotional in the witness box and asked the commissioners directly whether witnesses were safe. Described being polygraphed by a general over a stolen coffee machine.',
    allegations: [],
    notes: [
      '"Commissioner, are we safe here?" - asked of Commissioner Adv Sesi Baloyi.',
      'His evidence prompted the chair to order Gen Senona to attend.',
    ],
    matchers: ['karl sander', 'sanders'],
  },
  {
    id: 'fannie-nkosi',
    name: 'Sgt Fannie Nkosi',
    role: 'Sergeant, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status: 'Testified; says he was arrested afterwards',
    summary:
      'Gave evidence touching both Mkhwanazi and Sibiya, and later told the commission he was arrested because of his testimony - one of the clearest witness-protection flashpoints of the inquiry.',
    allegations: [],
    notes: [
      'Said he was arrested because of his testimony at the commission.',
      'His counsel, Hartley Ngoato, clashed with evidence leader Adv Mathew Chaskalson.',
    ],
    matchers: ['fannie nkosi', 'sgt nkosi', "nkosi's"],
  },
  {
    id: 'witness-g',
    name: 'Witness G',
    role: 'Protected witness',
    org: '—',
    category: 'witness',
    severity: null,
    status: 'Testimony closed to the public',
    summary:
      'A protected witness whose evidence the commission closed to the public on the 100th day of hearings.',
    allegations: [],
    notes: [
      '"I don\'t want to lie" - to evidence leader Adv Mathew Chaskalson.',
      'Public access to the testimony was withdrawn on hearing day 100.',
    ],
    matchers: ['witness g'],
  },
  {
    id: 'gavin-jacob',
    name: 'Col Gavin Jacob',
    role: 'Colonel, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status: 'Testified (June 2026)',
    summary:
      'Gave evidence in the same cluster as Lt-Col Kwazikwakhe Sibiya; the commission found the two statements suspiciously similar.',
    allegations: [],
    notes: [],
    matchers: ['gavin jacob'],
  },
  {
    id: 'henrik-flynn',
    name: 'Gen Henrik Flynn',
    role: 'General, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status: 'Testified (May 2026)',
    summary:
      'Testified on drug trafficking through South Africa\'s ports of entry, saying border officials at multiple ports are complicit.',
    allegations: [],
    notes: [
      'Said many border officials at different ports of entry are complicit in the movement of drugs.',
    ],
    matchers: ['flynn'],
  },
  {
    id: 'gxasheka',
    name: 'Linda Gxasheka',
    role: 'Witness',
    org: '—',
    category: 'witness',
    severity: null,
    status: 'Testified (March 2026)',
    summary:
      'Became emotional under questioning from Commissioner Adv Sesi Baloyi.',
    allegations: [],
    notes: [],
    matchers: ['gxasheka'],
  },
  {
    id: 'thepa',
    name: 'Kelebogile Thepa',
    role: 'Spokesperson, Ekurhuleni Metro Police Department',
    org: 'EMPD',
    category: 'witness',
    severity: null,
    status: 'Testified (Nov 2025)',
    summary:
      'Detailed a second violent attack on her - evidence going to the safety of people connected to the inquiry.',
    allegations: [],
    notes: [],
    matchers: ['thepa'],
  },
  {
    id: 'dlamini',
    name: 'Umashi Samson Dlamini',
    role: 'Witness',
    org: '—',
    category: 'witness',
    severity: null,
    status: 'Testified (April 2026)',
    summary:
      'Denied involvement in any recruitment process with Sgt Nkosi and denied ever meeting Matlala.',
    allegations: [],
    notes: ['"I have never met with Vusimuzi Cat Matlala."'],
    // NOT bare 'dlamini' - one of the commonest surnames in South Africa, and
    // in 600k words of transcript it matches unrelated people and account
    // names. Clip titles always carry "Umashi", so nothing is lost.
    matchers: ['umashi', 'samson dlamini', 'umashi dhlamini'],
  },
  {
    id: 'yolande-faro',
    name: 'Yolande Faro',
    role: 'Witness',
    org: '—',
    category: 'witness',
    severity: null,
    status: 'Testified (April 2026)',
    summary:
      'Told the commission she did not know Sgt Nkosi and had first seen him at the commission itself.',
    allegations: [],
    notes: [],
    matchers: ['yolande faro', 'faro'],
  },
  {
    id: 'serunye',
    name: 'Adv Peter Serunye',
    role: 'Advocate; IDAC witness',
    org: 'IDAC',
    category: 'witness',
    severity: null,
    status: 'Testified (Aug 2026)',
    summary:
      'Gave evidence that IDAC\'s operations manual is in fact in use - a point that went to the credibility of earlier IDAC evidence.',
    allegations: [],
    notes: [],
    matchers: ['serunye'],
  },
  {
    id: 'trent',
    name: 'Sarah-Jane Trent',
    role: 'Witness',
    org: '—',
    category: 'witness',
    severity: null,
    status: 'Testified at the Ad Hoc Committee',
    summary:
      'Broke down while being questioned by MPs; one member appealed to her to "speak the truth".',
    allegations: [],
    notes: [],
    matchers: ['sarah-jane trent', 'trent'],
  },
  {
    id: 'osullivan',
    name: "Paul O'Sullivan",
    role: 'Forensic investigator',
    org: 'Forensics for Justice',
    category: 'witness',
    severity: null,
    status: 'Appeared before the Ad Hoc Committee',
    summary:
      'Private forensic investigator who gave evidence to the parliamentary committee and was grilled by MPs.',
    allegations: [],
    notes: [],
    matchers: ["o'sullivan", 'osullivan', 'o’sullivan'],
  },
  {
    id: 'mokwele',
    name: 'Brig Mokwele',
    role: 'Brigadier, SAPS',
    org: 'SAPS',
    category: 'witness',
    severity: null,
    status: 'Received an apology on the record',
    summary:
      'IDAC head Adv Andrea Johnson was made to apologise to her during the 2026 hearings.',
    allegations: [],
    notes: [],
    matchers: ['mokwele'],
  },

  /* ------------------------------------------------------------------ */
  /* The commission                                                      */
  /* ------------------------------------------------------------------ */
  {
    id: 'the-commission',
    name: 'The commission itself',
    role: 'The bench and its evidence leaders, acting institutionally',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    institutional: true,
    status: 'Sitting',
    summary:
      'A node for the commission acting as a body — the allegations put to witnesses by "the commission" or "evidence leaders" generally, where the record does not attribute the question to one named individual. It exists so those allegations still appear in the relationship graph instead of being silently dropped.',
    allegations: [],
    notes: [],
    matchers: [],
  },
  {
    id: 'madlanga',
    name: 'Justice Mbuyiseli Madlanga',
    role: 'Chairperson; Acting Deputy Chief Justice',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    status: 'Chairing',
    summary:
      'Retired Constitutional Court justice appointed by President Ramaphosa to chair the inquiry into Mkhwanazi\'s allegations.',
    allegations: [],
    notes: [],
    matchers: [
      'justice madlanga',
      'justice mbuyiseli',
      'mbuyiseli madlanga',
      'madlanga concludes',
      'madlanga orders',
      'madlanga probes',
      'madlanga and ',
      'from madlanga',
      'madlanga that',
    ],
  },
  {
    id: 'baloyi',
    name: 'Adv Sesi Baloyi SC',
    role: 'Commissioner',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    status: 'Sitting',
    summary:
      'Co-commissioner, and the most frequently seen questioner in the clip record - notably in the Aeroton drug-bust evidence.',
    allegations: [],
    notes: [],
    matchers: ['sesi baloyi', 'baloyi'],
  },
  {
    id: 'khumalo',
    name: 'Adv Sandile Khumalo SC',
    role: 'Commissioner',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    status: 'Sitting',
    summary: 'Co-commissioner.',
    allegations: [],
    notes: [],
    matchers: ['sandile khumalo'],
  },
  {
    id: 'chaskalson',
    name: 'Adv Mathew Chaskalson SC',
    role: 'Evidence leader',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    status: 'Leading evidence',
    summary:
      'Lead evidence leader; conducted the cross-examination of Mogotsi, Mnisi and Witness G among others.',
    allegations: [],
    notes: [],
    matchers: ['chaskalson'],
  },
  {
    id: 'sello',
    name: 'Adv Sello',
    role: 'Evidence leader',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    status: 'Leading evidence',
    summary:
      'Evidence leader who ran the 2026 cross-examination of IDAC head Adv Andrea Johnson.',
    allegations: [],
    notes: [],
    matchers: ['adv sello'],
  },
  {
    id: 'segeels-ncube',
    name: 'Adv Lee Segeels-Ncube',
    role: 'Evidence leader',
    org: 'Madlanga Commission',
    category: 'commission',
    severity: null,
    status: 'Leading evidence',
    summary: 'Evidence leader; led the questioning of Gen Richard Shibiri.',
    allegations: [],
    notes: [],
    matchers: ['segeels-ncube', 'segeels'],
  },

  /* ------------------------------------------------------------------ */
  /* Political & oversight                                               */
  /* ------------------------------------------------------------------ */
  {
    id: 'ramaphosa',
    name: 'President Cyril Ramaphosa',
    role: 'President of South Africa',
    org: 'The Presidency',
    category: 'political',
    severity: null,
    status: 'Established the commission',
    summary:
      'Announced the judicial commission of inquiry in July 2025, placed Minister Mchunu on special leave and appointed an acting police minister. His written response to the allegations was read into the Ad Hoc Committee record.',
    allegations: [],
    notes: [
      'His full response to the Mkhwanazi allegations was read to the Ad Hoc Committee by MP David Skosana.',
    ],
    matchers: ['ramaphosa'],
  },
  {
    id: 'malema',
    name: 'Julius Malema',
    role: 'President, Economic Freedom Fighters',
    org: 'EFF',
    category: 'political',
    severity: null,
    status: 'Critic; Ad Hoc Committee participant',
    summary:
      'Questioned Brown Mogotsi at the Ad Hoc Committee and has publicly dismissed the commission, calling it "just excitement".',
    allegations: [],
    notes: [],
    matchers: ['malema'],
  },
  {
    id: 'missi',
    name: 'Adv Fatima Missi',
    role: 'Counsel for Vusimuzi "Cat" Matlala',
    org: 'Private bar',
    category: 'legal',
    severity: null,
    status: 'Appearing for Matlala at the commission',
    summary:
      'Counsel who appeared for Vusimuzi "Cat" Matlala when he was brought before the commission on 24 August 2026. She asked for the matter to stand down rather than let her client be questioned without his lead counsel, and confirmed her team would continue to represent him.',
    allegations: [],
    notes: [
      '"Unfair to question client without lead counsel" - her stand-down application, 24 Aug 2026.',
      '"We will continue to represent Vusimuzi \'Cat\' Matlala" - to the commission, 24 Aug 2026.',
    ],
    // NB: never match on 'missi' alone - it is a substring of "commission".
    matchers: ['fatima missi'],
  },
  {
    id: 'ngoato',
    name: 'Hartley Ngoato',
    role: 'Counsel for Sgt Fannie Nkosi',
    org: 'Private bar',
    category: 'legal',
    severity: null,
    status: 'Appeared for a witness',
    summary:
      "Represented Sgt Fannie Nkosi, and clashed with evidence leader Adv Mathew Chaskalson during his client's testimony.",
    allegations: [],
    notes: [],
    matchers: ['ngoato'],
  },
  {
    id: 'mpofu',
    name: 'Adv Dali Mpofu SC',
    role: 'Counsel for the MK Party',
    org: 'MK Party',
    category: 'legal',
    severity: null,
    status: 'Litigated to halt the commission',
    summary:
      'Argued the MK Party\'s urgent bid to stop the commission, saying the 121 missing dockets made the application urgent.',
    allegations: [],
    notes: [],
    matchers: ['mpofu'],
  },
  {
    id: 'adhoc-mps',
    name: 'Ad Hoc Committee members',
    role: 'Members of Parliament',
    org: 'National Assembly',
    category: 'political',
    severity: null,
    status: 'Parallel parliamentary inquiry',
    summary:
      'MPs who questioned witnesses in Parliament\'s ad hoc committee, including David Skosana (MK), Khusela Diko and Xola Nqola (ANC), Glynnis Breytenbach (DA), Dereleen James (ActionSA), Leigh-Ann Mathys (EFF), Sibonelo Nomvalo (MK) and Ashley Sauls.',
    allegations: [],
    notes: [
      'The committee questioned Matlala at the Kgosi Mampuru Correctional Centre.',
    ],
    matchers: [
      'skosana',
      'khusela diko',
      'xola nqola',
      'breytenbach',
      'dereleen james',
      'leigh-ann mathys',
      'nomvalo',
      'ashley sauls',
    ],
  },
];

export const peopleById = Object.fromEntries(people.map((p) => [p.id, p]));
