import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImageType } from '../utils/imageSignature.js';

// The sanitizer needs the "sanitize-html" package (npm install). Without it only the
// signature tests run and the sanitizer ones are skipped.
let mod = null;
try {
  mod = await import('./guidesSanitize.js');
} catch {
  mod = null;
}
const skip = mod ? false : 'sanitize-html is not installed (run npm install)';
const clean = (html) => mod.sanitizeGuideHtml(html);

test('drops script tags, event handlers and javascript: URLs', { skip }, () => {
  const out = clean('<p onclick="x()">hi</p><script>alert(1)</script><img src="/uploads/a.png" onerror="alert(1)">');
  assert.ok(!/script|onclick|onerror|alert/i.test(out), out);
  assert.match(out, /<p>hi<\/p>/);
  const link = clean('<p><a href="javascript:alert(1)">x</a></p>');
  assert.ok(!/javascript/i.test(link), link);
  const link2 = clean('<p><a href="data:text/html;base64,AAAA">x</a></p>');
  assert.ok(!/data:/i.test(link2), link2);
});

test('keeps formatting, tables and text-align only', { skip }, () => {
  const out = clean('<h3>T</h3><p style="text-align: center; color: red">a <strong>b</strong> <em>c</em> <u>d</u> <s>e</s></p><ul><li>1</li></ul><table><thead><tr><th colspan="2">h</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>');
  assert.match(out, /<h3>T<\/h3>/);
  assert.match(out, /text-align:\s*center/);
  assert.ok(!/color/.test(out), out);
  assert.match(out, /<th colspan="2">h<\/th>/);
  assert.match(out, /<ul><li>1<\/li><\/ul>/);
});

test('links: only http/https/mailto, external ones get target and rel', { skip }, () => {
  const out = clean('<a href="https://example.com/x">a</a><a href="mailto:a@b.co">m</a><a href="/relative">r</a>');
  assert.match(out, /href="https:\/\/example\.com\/x" target="_blank" rel="noopener noreferrer"/);
  assert.match(out, /href="mailto:a@b\.co"/);
  assert.ok(!/href="\/relative"/.test(out), out);
});

test('images: only /uploads or https', { skip }, () => {
  assert.match(clean('<img src="/uploads/a1b2.png" alt="x">'), /<img src="\/uploads\/a1b2\.png" alt="x"/);
  assert.match(clean('<img src="https://cdn.example.com/a.png">'), /<img src="https:\/\/cdn\.example\.com\/a\.png"/);
  for (const bad of ['http://x.com/a.png', 'javascript:alert(1)', 'data:image/png;base64,AAA', '/etc/passwd', '/uploads/../secret.png', '//evil.com/a.png']) {
    assert.ok(!/<img/.test(clean(`<p>a</p><img src="${bad}">`)), bad);
  }
});

test('youtube: nocookie kept, youtube.com rewritten, other hosts rejected', { skip }, () => {
  const nocookie = clean('<div data-youtube-video><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" width="640" height="480" allowfullscreen></iframe></div>');
  assert.match(nocookie, /<div data-youtube-video(="")?>/);
  assert.match(nocookie, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ"/);
  const rewritten = clean('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>');
  assert.match(rewritten, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ"/);
  for (const bad of ['https://evil.com/embed/dQw4w9WgXcQ', 'https://www.youtube.com.evil.com/embed/dQw4w9WgXcQ', 'http://www.youtube.com/embed/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)']) {
    assert.ok(!/<iframe/.test(clean(`<iframe src="${bad}"></iframe>`)), bad);
  }
});

test('legacy markdown (not starting with "<") is returned untouched', { skip }, () => {
  const md = '**Hola**\n\n- uno\n- dos';
  assert.equal(clean(md), md);
  assert.equal(clean(null), '');
});

test('image signature detection ignores the declared type and rejects SVG', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const gif = Buffer.from('GIF89a......', 'latin1');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBP')]);
  assert.equal(detectImageType(png).ext, 'png');
  assert.equal(detectImageType(jpg).mime, 'image/jpeg');
  assert.equal(detectImageType(gif).ext, 'gif');
  assert.equal(detectImageType(webp).ext, 'webp');
  assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(detectImageType(Buffer.from('<?xml version="1.0"?><svg/>')), null);
  assert.equal(detectImageType(Buffer.alloc(4)), null);
});
