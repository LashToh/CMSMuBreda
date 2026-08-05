import { useEffect, useState } from 'react';
import { ApiError, fetchRankings } from '../services/api';

const TABS = [
  { id: 'level', label: 'Level' },
  { id: 'pk', label: 'PK' },
  { id: 'guilds', label: 'Guilds' },
];

export default function RankingsPage() {
  const [type, setType] = useState('level');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchRankings(type, { page, pageSize: 20 });
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof ApiError ? err.message : 'Rankings temporarily unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, page]);

  const isGuild = type === 'guilds';
  const isLevel = type === 'level';

  return (
    <section className="cms-page">
      <p className="cms-page__label">Competition</p>
      <h1 className="cms-page__title">Rankings</h1>
      <p className="cms-page__subtitle">Top warriors of MU Breda Season 21.</p>

      <div className="cms-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={type === tab.id ? 'is-active' : ''}
            onClick={() => {
              setType(tab.id);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="cms-loading">Loading rankings…</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}

      {!loading && !error && (
        <div className="cms-panel" style={{ overflowX: 'auto' }}>
          {!data?.items?.length ? (
            <div className="cms-empty">No ranking data available.</div>
          ) : (
            <table className="cms-table">
              <thead>
                <tr>
                  <th>#</th>
                  {isGuild ? (
                    <>
                      <th>Guild</th>
                      <th>Master</th>
                      <th>Score</th>
                      <th>Members</th>
                    </>
                  ) : (
                    <>
                      <th>Name</th>
                      <th>Class</th>
                      {isLevel ? (
                        <>
                          <th>Level</th>
                          <th>ML</th>
                          <th>Total</th>
                        </>
                      ) : (
                        <th>Level</th>
                      )}
                      <th>PK</th>
                      <th>Guild</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row, i) => {
                  const total =
                    row.totalLevel ??
                    (Number(row.level || 0) + Number(row.masterLevel || 0));
                  return (
                    <tr key={row.name + i}>
                      <td>{(page - 1) * 20 + i + 1}</td>
                      {isGuild ? (
                        <>
                          <td>{row.name}</td>
                          <td>{row.master}</td>
                          <td>{row.score}</td>
                          <td>{row.members}</td>
                        </>
                      ) : (
                        <>
                          <td>{row.name}</td>
                          <td>{row.className || row.classShort}</td>
                          {isLevel ? (
                            <>
                              <td>{row.level}</td>
                              <td>{row.masterLevel ?? '—'}</td>
                              <td>{total}</td>
                            </>
                          ) : (
                            <td>{row.level}</td>
                          )}
                          <td>{row.pkCount ?? 0}</td>
                          <td>{row.guild || '—'}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {data?.pagination && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
