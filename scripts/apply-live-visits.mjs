import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = process.env.VISIT_ROOT || '/var/www/CMSMuBreda';
const COMMIT = '0821d55fdff2379d35b36993d6d4b901939fcb7b';
const NEW_FILES = [
  'server/controllers/visitController.js',
  'server/services/visitService.js',
  'server/services/visitService.test.js',
];

function die(message) {
  console.error(message);
  process.exit(1);
}

function read(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) die(`missing ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function once(text, re, label) {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const all = [...text.matchAll(new RegExp(re.source, flags))];
  if (all.length !== 1) die(`${label}: expected 1 match, found ${all.length}`);
  return all[0];
}

function insertAfter(text, re, addition, label) {
  const match = once(text, re, label);
  return text.slice(0, match.index + match[0].length) + addition + text.slice(match.index + match[0].length);
}

function ensureNamedImport(text, moduleName, name) {
  const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`import\\s+([^;]+?)\\s+from\\s+(['"])${escaped}\\2\\s*;`);
  const match = text.match(re);
  if (!match) return null;
  if (new RegExp(`\\b${name}\\b`).test(match[1])) return text;
  const brace = match[1].match(/\{([^}]*)\}/);
  let clause;
  if (brace) {
    const inner = brace[1];
    const body = inner.replace(/\s*$/, '');
    const tail = inner.slice(body.length);
    const nextBody = body.length === 0 || body.endsWith(',') ? `${body} ${name}` : `${body}, ${name}`;
    clause = `${match[1].slice(0, brace.index)}{${nextBody}${tail}}${match[1].slice(brace.index + brace[0].length)}`;
  } else {
    clause = `${match[1].trim()}, { ${name} }`;
  }
  return `${text.slice(0, match.index)}import ${clause} from ${match[2]}${moduleName}${match[2]};${text.slice(match.index + match[0].length)}`;
}

function endOfFunction(text, start) {
  const open = text.indexOf('{', start);
  if (open < 0) return -1;
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`${url} -> ${res.statusCode}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

const admin = read('src/pages/AdminPage.jsx');
for (const label of ['Dashboard', 'Accounts', 'News', 'Downloads', 'Donate', 'Server Info', 'Integrations', 'Gift Codes', 'CMS Settings', 'Audit Log']) {
  if (!admin.includes(`label: '${label}'`) && !admin.includes(`label: "${label}"`)) {
    die(`AdminPage is not the live tab bar (missing ${label})`);
  }
}

let routes = read('server/routes/index.js');
let app = read('src/App.jsx');
let api = read('src/services/api.js');
let ignore = read('.gitignore');
let page = admin;

if (!routes.includes('visitController')) {
  const imports = [...routes.matchAll(/^import .+$/gm)];
  if (!imports.length) die('routes: no import lines');
  const last = imports[imports.length - 1];
  routes = `${routes.slice(0, last.index + last[0].length)}\nimport * as visitController from '../controllers/visitController.js';${routes.slice(last.index + last[0].length)}`;
}
if (!routes.includes('visitController.track')) {
  routes = insertAfter(routes, /router\.get\(\s*['"]\/health['"][^;]*;/, "\nrouter.post('/visits', visitController.track);", 'health route');
}
if (!routes.includes('visitController.report')) {
  routes = insertAfter(routes, /admin\.get\(\s*['"]\/dashboard['"][^;]*;/, "\nadmin.get('/visits', visitController.report);", 'admin dashboard route');
}

if (!api.includes('fetchAdminVisits')) {
  const start = api.search(/function fetchAdminDashboard\s*\(/);
  if (start < 0) die('api.js: missing fetchAdminDashboard');
  const end = endOfFunction(api, start);
  if (end < 0) die('api.js: could not close fetchAdminDashboard');
  const snippet = `

export async function fetchAdminVisits() {
  return request('/api/admin/visits', { auth: true });
}

const VISITOR_KEY = 'mubreda_vid';
const VISITOR_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let lastTracked = { path: '', at: 0 };

function visitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (VISITOR_RE.test(existing || '')) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return undefined;
  }
}

/** Fire-and-forget page view. Never throws into the UI. */
export function recordPageVisit(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return;
  const lower = pathname.toLowerCase();
  if (
    lower.startsWith('/admin') ||
    lower.startsWith('/install') ||
    lower.startsWith('/api') ||
    lower.startsWith('/patches') ||
    lower.startsWith('/assets')
  ) {
    return;
  }
  const now = Date.now();
  if (lastTracked.path === pathname && now - lastTracked.at < 800) return;
  lastTracked = { path: pathname, at: now };
  const base = typeof API_URL === 'string' ? API_URL : '';
  fetch(\`\${base}/api/visits\`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: pathname, visitorId: visitorId() }),
  }).catch(() => {});
}
`;
  api = api.slice(0, end) + snippet + api.slice(end);
}

if (!app.includes('function VisitTracker')) {
  const withEffect = ensureNamedImport(app, 'react', 'useEffect');
  app = withEffect || `import { useEffect } from 'react';\n${app}`;
  const withLocation = ensureNamedImport(app, 'react-router-dom', 'useLocation');
  if (!withLocation) die('App.jsx: missing react-router-dom import');
  app = withLocation;
  if (!app.includes('recordPageVisit')) {
    app = insertAfter(
      app,
      /import\s+[^;]+from\s+['"]react-router-dom['"]\s*;/,
      "\nimport { recordPageVisit } from './services/api';",
      'router import',
    );
  }
  const tracker = `
function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    recordPageVisit(pathname);
  }, [pathname]);
  return null;
}
`;
  const hook = app.includes('\nfunction LandingLayout')
    ? once(app, /\nfunction LandingLayout\b/, 'LandingLayout')
    : once(app, /\nexport default function App\b/, 'App component');
  app = app.slice(0, hook.index) + `\n${tracker}` + app.slice(hook.index);
  app = insertAfter(app, /<BrowserRouter\b[^>]*>/, '\n              <VisitTracker />', 'BrowserRouter');
}

if (!page.includes("id: 'visits'") && !page.includes('id: "visits"')) {
  page = insertAfter(
    page,
    /\{\s*id:\s*['"]dashboard['"]\s*,\s*label:\s*['"]Dashboard['"]\s*\},/,
    "\n  { id: 'visits', label: 'Visits' },",
    'dashboard tab',
  );
}
if (!page.includes('fetchAdminVisits')) {
  const imported = ensureNamedImport(page, '../services/api', 'fetchAdminVisits');
  if (!imported) die('AdminPage: missing ../services/api import');
  page = imported;
}
if (!page.includes('setVisits')) {
  page = insertAfter(page, /useState\(\s*['"]dashboard['"]\s*\);/, '\n  const [visits, setVisits] = useState(null);', 'tab state');
}
if (!page.includes("tab === 'visits'") && !page.includes('tab === "visits"')) {
  const withEffect = ensureNamedImport(page, 'react', 'useEffect');
  if (!withEffect) die('AdminPage: missing react import');
  page = withEffect;
  const effect = `
  useEffect(() => {
    if (!isAdmin || tab !== 'visits') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAdminVisits();
        if (!cancelled) setVisits(res.data);
      } catch (err) {
        if (!cancelled) setError(err && err.message ? err.message : 'Failed to load visits.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, isAdmin]);
`;
  const render = once(page, /\n[ \t]*return \(\s*\n[ \t]*<section className=["']cms-page admincp["']/, 'AdminCP return');
  page = page.slice(0, render.index) + `\n${effect}` + page.slice(render.index);
  const panel = [
    "      {tab === 'visits' && !visits && !error && <div className=\"cms-loading\">Loading visits…</div>}",
    '',
    "      {tab === 'visits' && visits && (",
    '        <>',
    '          <div className="cms-grid cms-grid--3">',
    '            <div className="cms-stat">',
    '              <div className="cms-stat__label">Page views ({visits.rangeDays} days)</div>',
    '              <div className="cms-stat__value">{visits.totalVisits ?? 0}</div>',
    '            </div>',
    '            <div className="cms-stat">',
    '              <div className="cms-stat__label">Unique visitors</div>',
    '              <div className="cms-stat__value">{visits.uniqueVisitors ?? 0}</div>',
    '            </div>',
    '            <div className="cms-stat">',
    '              <div className="cms-stat__label">Today</div>',
    '              <div className="cms-stat__value">{visits.today?.visits ?? 0}</div>',
    '            </div>',
    '          </div>',
    '          <p className="admincp__note">',
    '            Last {visits.rangeDays} days, UTC. Each load of a public page (home, news, info,',
    '            rankings, donate, downloads, login, account) counts as one visit. Unique visitors',
    '            counts a browser once for the whole range. The table shows uniques per day.',
    '          </p>',
    '          <div className="cms-grid cms-grid--2">',
    '            <div className="cms-panel">',
    '              <h2 className="admincp__h2">Visits per day</h2>',
    '              <div style={{ overflowX: \'auto\' }}>',
    '                <table className="cms-table">',
    '                  <thead>',
    '                    <tr>',
    '                      <th>Date</th>',
    '                      <th>Visits</th>',
    '                      <th>Unique</th>',
    '                    </tr>',
    '                  </thead>',
    '                  <tbody>',
    '                    {(visits.days || []).map((row) => (',
    '                      <tr key={row.date}>',
    '                        <td>{row.date}</td>',
    '                        <td>{row.visits}</td>',
    '                        <td>{row.uniques}</td>',
    '                      </tr>',
    '                    ))}',
    '                  </tbody>',
    '                </table>',
    '              </div>',
    '            </div>',
    '            <div className="cms-panel">',
    '              <h2 className="admincp__h2">Top pages</h2>',
    '              {!visits.topPages?.length ? (',
    '                <div className="cms-empty">No page views in this range yet.</div>',
    '              ) : (',
    '                <div style={{ overflowX: \'auto\' }}>',
    '                  <table className="cms-table">',
    '                    <thead>',
    '                      <tr>',
    '                        <th>Page</th>',
    '                        <th>Visits</th>',
    '                      </tr>',
    '                    </thead>',
    '                    <tbody>',
    '                      {visits.topPages.map((row) => (',
    '                        <tr key={row.path}>',
    '                          <td>{row.path}</td>',
    '                          <td>{row.visits}</td>',
    '                        </tr>',
    '                      ))}',
    '                    </tbody>',
    '                  </table>',
    '                </div>',
    '              )}',
    '            </div>',
    '          </div>',
    '        </>',
    '      )}',
    '',
    '',
  ].join('\n');
  const accounts = once(page, /\n[ \t]*\{tab === ['"]accounts['"]/, 'accounts tab');
  page = `${page.slice(0, accounts.index)}\n${panel.trimEnd()}\n${page.slice(accounts.index + 1)}`;
}

if (!ignore.includes('server/data/visits.json')) {
  ignore = ignore.endsWith('\n') ? ignore : `${ignore}\n`;
  ignore += 'server/data/visits.json\nserver/data/visits.json.tmp\n';
}

const blobs = process.env.VISIT_SRC
  ? NEW_FILES.map((rel) => fs.readFileSync(path.join(process.env.VISIT_SRC, rel)))
  : await Promise.all(
      NEW_FILES.map((rel) => download(`https://raw.githubusercontent.com/LashToh/CMSMuBreda/${COMMIT}/${rel}`)),
    );

const planned = {
  'server/routes/index.js': routes,
  'src/App.jsx': app,
  'src/services/api.js': api,
  'src/pages/AdminPage.jsx': page,
  '.gitignore': ignore,
};

fs.writeFileSync(path.join(ROOT, 'server/routes/index.js'), planned['server/routes/index.js']);
fs.writeFileSync(path.join(ROOT, 'src/App.jsx'), planned['src/App.jsx']);
fs.writeFileSync(path.join(ROOT, 'src/services/api.js'), planned['src/services/api.js']);
fs.writeFileSync(path.join(ROOT, 'src/pages/AdminPage.jsx'), planned['src/pages/AdminPage.jsx']);
fs.writeFileSync(path.join(ROOT, '.gitignore'), planned['.gitignore']);
NEW_FILES.forEach((rel, i) => {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, blobs[i]);
});
console.log('visits tab inserted');
