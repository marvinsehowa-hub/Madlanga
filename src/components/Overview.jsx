import Thumb from './Thumb.jsx';
import Coverage from './Coverage.jsx';
import RecentSittings from './RecentSittings.jsx';
import Appearances from './Appearances.jsx';
import {
  stats,
  accused,
  timelineSorted,
  videos,
  videosFor,
  formatDate,
  SEVERITY,
} from '../lib/data.js';

const latest = timelineSorted.slice(0, 4);
const topAccused = accused.slice(0, 6);
const latestClips = videos.slice(0, 5);

function Stat({ value, label, hint }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export default function Overview({ onPerson, onTab }) {
  return (
    <div className="stack">
      <section className="panel hero">
        <h2>What this inquiry is about</h2>
        <p>
          In July 2025 the KwaZulu-Natal police commissioner, Lt-Gen Nhlanhla
          Mkhwanazi, alleged in a press briefing that a criminal syndicate had
          infiltrated the police, the intelligence services and parts of the
          criminal justice system — and that the province&apos;s Political
          Killings Task Team had been shut down to protect it. He named the
          Minister of Police, a businessman holding a large police contract, and
          the businessman&apos;s political intermediary.
        </p>
        <p>
          President Ramaphosa responded by appointing a judicial commission of
          inquiry under Acting Deputy Chief Justice Mbuyiseli Madlanga.
          Parliament ran its own ad hoc committee in parallel. Hearings have run
          past their 100th day, and the contradictions between what witnesses
          told each forum have become a subject of the inquiry in their own
          right.
        </p>
      </section>

      <Coverage />

      <section className="stats">
        <Stat
          value={stats.accused}
          label="People implicated"
          hint="named in allegations"
        />
        <Stat
          value={stats.allegations}
          label="Allegations tracked"
          hint="none yet adjudicated"
        />
        <Stat value={stats.witnesses} label="Witnesses indexed" />
        <Stat
          value={`${stats.hoursOfFootage}h`}
          label="Hearing footage"
          hint={`${stats.videos} clips & streams`}
        />
        <Stat
          value={`${stats.hearingDays}+`}
          label="Days of hearings"
          hint="as marked on the record"
        />
      </section>

      <Appearances onPerson={onPerson} />

      <RecentSittings />

      <div className="cols">
        <section className="panel">
          <div className="panel-head">
            <h2>Most central figures</h2>
            <button className="link" onClick={() => onTab('people')}>
              All people →
            </button>
          </div>
          <ul className="rank-list">
            {topAccused.map((p) => (
              <li key={p.id}>
                <button className="rank-row" onClick={() => onPerson(p.id)}>
                  <span className={`sev sev-${p.severity}`}>
                    {SEVERITY[p.severity].label}
                  </span>
                  <span className="rank-name">{p.name}</span>
                  <span className="rank-role">{p.role}</span>
                  <span className="rank-count">
                    {p.allegations.length} allegation
                    {p.allegations.length === 1 ? '' : 's'} ·{' '}
                    {videosFor(p.id).length} clip
                    {videosFor(p.id).length === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Latest developments</h2>
            <button className="link" onClick={() => onTab('timeline')}>
              Full timeline →
            </button>
          </div>
          <ul className="mini-timeline">
            {latest.map((e) => (
              <li key={e.date + e.title}>
                <time>{formatDate(e.date)}</time>
                <div>
                  <h3>{e.title}</h3>
                  <p>{e.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Newest footage</h2>
          <button className="link" onClick={() => onTab('hearings')}>
            All hearings →
          </button>
        </div>
        <ul className="clip-strip">
          {latestClips.map((v) => (
            <li key={v.videoId}>
              <a href={v.url} target="_blank" rel="noreferrer">
                <Thumb videoId={v.videoId} />
                <span className="clip-date">
                  {formatDate(v.date)}
                  {v.dateApprox && <span className="approx">approx</span>}
                </span>
                <span className="clip-title">{v.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
