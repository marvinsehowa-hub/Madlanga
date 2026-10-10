import {
  videos,
  playlists,
  allegations,
  people,
  scrapedAt,
  channelUrl,
  formatDate,
} from '../lib/data.js';
import {
  transcriptStats,
  hasTranscripts,
  transcriptSource,
} from '../lib/transcripts.js';
import { OFFICIAL_HEARING_DAYS } from '../lib/data.js';

const fmtHours = (secs) => Math.round(secs / 3600);

/**
 * Says plainly what this index does and does not cover. The gaps are the point
 * — a research tool that hides its own limits is worse than useless.
 */
export default function Coverage() {
  const pinned = allegations.filter((a) => a.clip).length;
  const exact = videos.filter((v) => !v.dateApprox).length;
  const hours = fmtHours(videos.reduce((n, v) => n + (v.seconds ?? 0), 0));
  const sessions = videos.filter(
    (v) => v.kind === 'session' && !v.signLanguage
  ).length;

  return (
    <section className="panel coverage">
      <h2>Data coverage notice</h2>

      <p>
        <strong>Fully indexed:</strong> {videos.length} videos from{' '}
        <a href={channelUrl} target="_blank" rel="noreferrer">
          Newslive SA
        </a>{' '}
        — the channel&apos;s three commission playlists plus every relevant
        broadcast on its Streams tab, which carries the complete sitting days.
        That is {sessions} full sittings of the commission and Parliament&apos;s
        ad hoc committee, roughly {hours} hours of footage, alongside a
        hand-curated register of {people.length} people and {allegations.length}{' '}
        allegations, of which {pinned} are pinned to the specific session where
        they were put on the record.
      </p>

      <p>
        <strong>Transcribed, in part.</strong> The commission&apos;s own daily
        records cover{' '}
        <strong>
          {transcriptStats.days} of {OFFICIAL_HEARING_DAYS.count} sitting days
        </strong>{' '}
        — {transcriptStats.words.toLocaleString()} words of verbatim testimony,
        searchable under <em>Transcripts</em>, sourced from{' '}
        <a href={transcriptSource} target="_blank" rel="noreferrer">
          the commission
        </a>
        . For those days you can search what was actually said. For the rest,
        this index still only sees how a broadcaster captioned a clip — so a
        claim made in an untranscribed sitting that nobody captioned is still
        not findable here.
      </p>

      <p>
        <strong>Not indexed:</strong> the commission&apos;s rulings, exhibits
        and annexure bundles. The large exhibit bundles are scanned images with
        no text layer and would need OCR. YouTube&apos;s own auto-captions
        remain closed to anything but its player, so untranscribed sittings
        cannot be filled in from the footage.
      </p>

      <p>
        <strong>Dates:</strong> only {exact} of {videos.length} clips carry an
        exact date stated on the record. YouTube exposes only a fuzzy age
        (&ldquo;3 weeks ago&rdquo;) for the rest, so those dates are derived and
        marked <span className="approx">approx</span> — accurate to roughly a
        fortnight, which is enough to order events but not to cite.
      </p>

      <p>
        <strong>Relationships</strong> in the graph are never inferred from
        speculation. An edge exists only where one person put an allegation
        against another, or where two people are named in the same timeline
        event or the same clip title.
      </p>

      <p className="coverage-warn">
        Treat this as a finding aid for the footage, not as a legal record. The
        commission has made no findings, and everyone named is presumed
        innocent. Verify against primary sources before relying on anything
        here.
      </p>

      <table className="sources">
        <thead>
          <tr>
            <th>Source playlist</th>
            <th>Clips</th>
            <th>Hours</th>
            <th>Span</th>
          </tr>
        </thead>
        <tbody>
          {playlists.map((p) => {
            const list = videos.filter((v) => v.playlists.includes(p.key));
            const dates = list.map((v) => v.date).filter(Boolean).sort();
            return (
              <tr key={p.key}>
                <td>
                  <strong>{p.label}</strong>
                  <span className="src-blurb">{p.blurb}</span>
                </td>
                <td>{list.length}</td>
                <td>{fmtHours(list.reduce((n, v) => n + (v.seconds ?? 0), 0))}</td>
                <td>
                  {dates.length
                    ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="coverage-updated">
        Data last updated {formatDate(scrapedAt.slice(0, 10))} · rebuild with{' '}
        <code>npm run refresh</code>
      </p>
    </section>
  );
}
