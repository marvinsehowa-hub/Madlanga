import { useState, useCallback } from 'react';
import Overview from './components/Overview.jsx';
import PeopleGrid from './components/PeopleGrid.jsx';
import Allegations from './components/Allegations.jsx';
import SearchView from './components/SearchView.jsx';
import GraphView from './components/GraphView.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import CompareView from './components/CompareView.jsx';
import Transcripts from './components/Transcripts.jsx';
import TimelineView from './components/TimelineView.jsx';
import Hearings from './components/Hearings.jsx';
import PersonPanel from './components/PersonPanel.jsx';
import { scrapedAt, formatDate } from './lib/data.js';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'search', label: 'Search' },
  { key: 'people', label: 'People' },
  { key: 'allegations', label: 'Allegations' },
  { key: 'timeline', label: 'Case timeline' },
  { key: 'graph', label: 'Graph' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'compare', label: 'Compare' },
  { key: 'transcripts', label: 'Transcripts' },
  { key: 'hearings', label: 'Hearings' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [personId, setPersonId] = useState(null);

  const openPerson = useCallback((id) => setPersonId(id), []);
  const goTo = useCallback((next) => {
    setPersonId(null);
    setTab(next);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>Madlanga Commission Tracker</h1>
              <p className="brand-sub">
                Who is implicated, what is alleged, and how it unfolded
              </p>
            </div>
          </div>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab ${tab === t.key ? 'is-active' : ''}`}
                onClick={() => goTo(t.key)}
                aria-current={tab === t.key ? 'page' : undefined}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="notice" role="note">
        <strong>No findings have been made.</strong> The commission has not
        reported. Everything recorded here is an <em>allegation</em>, a question
        put to a witness, or a scheduled event — not a conclusion of
        wrongdoing. Every person named is presumed innocent.
      </div>

      <main className="main">
        {tab === 'overview' && <Overview onPerson={openPerson} onTab={goTo} />}
        {tab === 'people' && <PeopleGrid onPerson={openPerson} />}
        {tab === 'search' && <SearchView onPerson={openPerson} />}
        {tab === 'allegations' && <Allegations onPerson={openPerson} />}
        {tab === 'graph' && <GraphView onPerson={openPerson} />}
        {tab === 'analytics' && <AnalyticsView onPerson={openPerson} />}
        {tab === 'compare' && <CompareView onPerson={openPerson} />}
        {tab === 'timeline' && <TimelineView onPerson={openPerson} />}
        {tab === 'transcripts' && <Transcripts onPerson={openPerson} />}
        {tab === 'hearings' && <Hearings onPerson={openPerson} />}
      </main>

      <footer className="footer">
        <p>
          Hearing footage indexed from the{' '}
          <a
            href="https://www.youtube.com/@newslivesa/playlists"
            target="_blank"
            rel="noreferrer"
          >
            Newslive SA
          </a>{' '}
          playlists · last refreshed {formatDate(scrapedAt.slice(0, 10))} ·
          rebuild with <code>npm run refresh</code>
        </p>
        <p className="footer-fine">
          Dates marked <span className="approx">approx</span> are derived from
          the publication age of the source clip and are accurate to within
          about two weeks. Treat this as a research index, not a legal record —
          verify against the commission&apos;s own transcripts before relying on
          anything here.
        </p>
      </footer>

      {personId && (
        <PersonPanel
          personId={personId}
          onClose={() => setPersonId(null)}
          onPerson={openPerson}
        />
      )}
    </div>
  );
}
