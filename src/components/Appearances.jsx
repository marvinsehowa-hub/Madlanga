import {
  outstandingAppearances,
  APPEARANCE,
  videoById,
  formatDate,
} from '../lib/data.js';

/**
 * Who the commission expected to hear from and has not.
 *
 * A register built only from people who testified quietly omits the ones who
 * were summoned and did not turn up — often the sharper fact. This panel keeps
 * them visible until their appearance is resolved.
 */
export default function Appearances({ onPerson }) {
  if (outstandingAppearances.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Meant to appear — still outstanding</h2>
        <span className="result-count">
          {outstandingAppearances.length} unresolved
        </span>
      </div>

      <p className="panel-note sittings-caveat">
        People the commission summoned, ordered or brought in but has not heard
        from. Being listed here is a statement about attendance, not about
        conduct.
      </p>

      <ul className="appearances">
        {outstandingAppearances.map((p) => {
          const meta = APPEARANCE[p.appearance.status];
          const clip = p.appearance.clip ? videoById[p.appearance.clip] : null;
          return (
            <li key={p.id}>
              <div className="appearance-head">
                <button className="chip chip-accused" onClick={() => onPerson(p.id)}>
                  {p.name}
                </button>
                <span className={`appearance-status tone-${meta.tone}`}>
                  {meta.label}
                </span>
                <time>{formatDate(p.appearance.date)}</time>
              </div>
              <p className="appearance-detail">{p.appearance.detail}</p>
              {clip && (
                <a
                  className="appearance-link"
                  href={clip.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  ▶ Watch the commission deal with it
                  {clip.duration ? ` (${clip.duration})` : ''}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
