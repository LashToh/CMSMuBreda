import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRankings } from '../../services/api';
import { useTranslation } from '../../context/LanguageContext';
import './RankingsPreview.scss';

// The top 5 of the main boards, live from the server; the full table is on /rankings.
const TABS = ['level', 'resets', 'guilds'];

export default function RankingsPreview() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('level');
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    fetchRankings(tab, { page: 1, pageSize: 5 })
      .then((res) => !cancelled && setRows(res.data?.items || []))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const isGuild = tab === 'guilds';
  const rank = (i) => (i < 3 ? <span className={`rp__medal rp__medal--${i + 1}`}>{i + 1}</span> : i + 1);

  return (
    <section id="rankings" className="rp">
      <div className="rp__head">
        <h2 className="rp__title">{t('rankingsPreview.title')}</h2>
        <p className="rp__subtitle">{t('rankingsPreview.subtitle')}</p>
      </div>
      <div className="rp__panel">
        <div className="rp__tabs" role="tablist">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`rp__tab ${tab === id ? 'is-on' : ''}`}
              onClick={() => setTab(id)}
            >
              {t(`rankingsPreview.tabs.${id}`)}
            </button>
          ))}
        </div>
        <table className="rp__table">
          <thead>
            <tr>
              <th>#</th>
              <th>{isGuild ? t('rankingsPreview.colGuild') : t('rankingsPreview.colCharacter')}</th>
              <th className="rp__hide-sm">{isGuild ? t('rankingsPreview.colMaster') : t('rankingsPreview.colGuild')}</th>
              <th>
                {isGuild
                  ? t('rankingsPreview.colScore')
                  : tab === 'resets'
                    ? t('rankingsPreview.colResets')
                    : t('rankingsPreview.colLevel')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr>
                <td colSpan={4} className="rp__empty">{t('rankingsPreview.loading')}</td>
              </tr>
            )}
            {rows?.length === 0 && (
              <tr>
                <td colSpan={4} className="rp__empty">{t('rankingsPreview.empty')}</td>
              </tr>
            )}
            {rows?.map((r, i) =>
              isGuild ? (
                <tr key={r.name}>
                  <td className="rp__rank">{rank(i)}</td>
                  <td className="rp__name">{r.name}</td>
                  <td className="rp__muted rp__hide-sm">{r.master || '—'}</td>
                  <td className="rp__num">{r.score}</td>
                </tr>
              ) : (
                <tr key={r.name}>
                  <td className="rp__rank">{rank(i)}</td>
                  <td>
                    <span className="rp__cls">{r.classShort}</span>
                    <span className="rp__name">{r.name}</span>
                  </td>
                  <td className="rp__muted rp__hide-sm">{r.guild || '—'}</td>
                  <td className="rp__num">
                    {tab === 'resets' ? (
                      <b>{r.resets}</b>
                    ) : (
                      <>
                        <b>{r.level}</b>
                        {r.masterLevel > 0 && <span className="rp__ml"> +{r.masterLevel}</span>}
                      </>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        <Link to="/rankings" className="rp__more">{t('rankingsPreview.more')}</Link>
      </div>
    </section>
  );
}
