import { videos, formatDate } from '../lib/data.js';

/**
 * The hearing calendar, straight from the video record - no curation involved.
 *
 * Full sitting days are published as whole-day streams titled only by date, so
 * this panel can honestly say WHEN the forums sat and for how long, but not
 * what was said. That distinction is stated on the panel rather than left for
 * the reader to infer.
 */
const forumOf = (title) =>
  /ad hoc/i.test(title) ? 'Ad Hoc Committee' : 'Madlanga Commission';

const hhmm = (secs) => {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

export default function RecentSittings({ limit = 12 }) {
  const sittings = videos
    .filter((v) => v.kind === 'session' && !v.signLanguage && v.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  // Group consecutive entries by date so a day with two forums reads as one row.
  const byDate = [];
  for (const v of sittings) {
    const last = byDate[byDate.length - 1];
    if (last && last.date === v.date) last.items.push(v);
    else byDate.push({ date: v.date, items: [v] });
  }

  const totalHours = (
    sittings.reduce((n, v) => n + (v.seconds ?? 0), 0) / 3600
  ).toFixed(1);

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Recent sittings</h2>
        <span className="result-count">
          last {byDate.length} sitting days · {totalHours}h
        </span>
      </div>

      <p className="panel-note sittings-caveat">
        When the forums sat, and for how long — taken straight from the stream
        record. These are whole-day streams titled only by date, so this panel
        does not tell you what was said in them.
      </p>

      <ul className="sittings">
        {byDate.map((day) => (
          <li key={day.date}>
            <time>{formatDate(day.date)}</time>
            <div className="sitting-forums">
              {day.items.map((v) => (
                <a
                  key={v.videoId}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    forumOf(v.title) === 'Ad Hoc Committee'
                      ? 'chip chip-political'
                      : 'chip chip-commission'
                  }
                  title={v.title}
                >
                  {forumOf(v.title)}
                  {v.liveNow ? (
                    <span className="sitting-live">on air</span>
                  ) : (
                    hhmm(v.seconds) && (
                      <span className="sitting-dur">{hhmm(v.seconds)}</span>
                    )
                  )}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
