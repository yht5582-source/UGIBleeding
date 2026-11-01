// node tests.cjs — runs the engine block from index.html
const fs = require('fs'), assert = require('assert');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const src = html.slice(html.indexOf('/*ENGINE-START*/'), html.indexOf('/*ENGINE-END*/'));
const m = { exports: {} };
new Function('module', src)(m);
const E = m.exports;
let n = 0;
const t = (name, fn) => { fn(); n++; };
const base = { age: 50, sex: 'M', sbp: 130, hr: 80, hb: 14, bun: 15, bunUnit: 'mgdl' };
const G = o => E.gbs(Object.assign({}, base, o));
const R = o => E.rockall(Object.assign({}, base, o));

t('normal = 0', () => { assert.strictEqual(G({}).score, 0); assert.strictEqual(G({}).band, 'low'); });
t('blank Hb is not scored as 6', () => { const g = G({ hb: '' }); assert.strictEqual(g.score, null); assert.deepStrictEqual(g.missing, ['Hb']); });
t('blank SBP is missing, not 3', () => { assert.strictEqual(G({ sbp: '' }).score, null); assert.strictEqual(R({ sbp: '' }).score, null); });
t('no sex → incomplete', () => assert.strictEqual(G({ sex: '' }).complete, false));
t('BUN bands', () => {
  [[18.1, 0], [18.2, 2], [22.3, 2], [22.4, 3], [27.9, 3], [28, 4], [69.9, 4], [70, 6]].forEach(([b, s]) => assert.strictEqual(G({ bun: b }).score, s, 'BUN ' + b));
});
t('urea mmol/L converts', () => {
  [[6.4, 0], [6.5, 2], [8, 3], [10, 4], [25, 6]].forEach(([u, s]) => assert.strictEqual(G({ bun: u, bunUnit: 'mmol' }).score, s, 'urea ' + u));
});
t('Hb men', () => { [[13, 0], [12.9, 1], [12, 1], [11.9, 3], [10, 3], [9.9, 6]].forEach(([h, s]) => assert.strictEqual(G({ hb: h }).score, s, 'M ' + h)); });
t('Hb women', () => { [[12, 0], [11.9, 1], [10, 1], [9.9, 6]].forEach(([h, s]) => assert.strictEqual(G({ sex: 'F', hb: h }).score, s, 'F ' + h)); });
t('SBP bands', () => { [[110, 0], [109, 1], [100, 1], [99, 2], [90, 2], [89, 3]].forEach(([b, s]) => assert.strictEqual(G({ sbp: b }).score, s)); });
t('pulse', () => { assert.strictEqual(G({ hr: 99 }).score, 0); assert.strictEqual(G({ hr: 100 }).score, 1); });
t('history items', () => assert.strictEqual(G({ melena: true, syncope: true, hepatic: true, hf: true }).score, 7));
t('max GBS 23', () => assert.strictEqual(G({ bun: 80, hb: 8, sbp: 80, hr: 120, melena: true, syncope: true, hepatic: true, hf: true }).score, 23));
t('bands', () => { assert.strictEqual(E.gbsBand(1), 'low'); assert.strictEqual(E.gbsBand(2), 'mid'); assert.strictEqual(E.gbsBand(6), 'mid'); assert.strictEqual(E.gbsBand(7), 'high'); });
t('out-of-range value treated as missing', () => { assert.strictEqual(G({ hb: 140 }).complete, false); assert.ok(E.validate(Object.assign({}, base, { hb: 140 })).hb); });

t('Rockall age', () => { assert.strictEqual(R({ age: 59 }).score, 0); assert.strictEqual(R({ age: 60 }).score, 1); assert.strictEqual(R({ age: 80 }).score, 2); });
t('Rockall shock', () => {
  assert.strictEqual(R({ hr: 100 }).score, 1);
  assert.strictEqual(R({ sbp: 99, hr: 80 }).score, 2);
  assert.strictEqual(R({ sbp: 99, hr: '' }).score, 2); // hypotension scores without HR
  assert.strictEqual(R({ hr: '' }).score, null);
});
t('Rockall hepatic disease alone is not 3', () => assert.strictEqual(R({ hepatic: true }).score, 0));
t('Rockall comorbidity', () => {
  assert.strictEqual(R({ ihd: true }).score, 2); assert.strictEqual(R({ hf: true }).score, 2); assert.strictEqual(R({ major: true }).score, 2);
  assert.strictEqual(R({ severe: true, ihd: true }).score, 3);
});
t('Rockall max 7 + mortality', () => { const r = R({ age: 85, sbp: 80, severe: true }); assert.strictEqual(r.score, 7); assert.strictEqual(r.mortality, 50); assert.strictEqual(R({}).mortality, 0.2); });

t('transfusion thresholds', () => {
  assert.strictEqual(E.transfusion({ hb: 6.9 }).below, true);
  assert.strictEqual(E.transfusion({ hb: 7 }).below, false);
  assert.strictEqual(E.transfusion({ hb: 7.5, cvd: true }).below, true);
  assert.strictEqual(E.transfusion({ hb: '' }).below, false);
  assert.strictEqual(E.transfusion({ hb: 9, sbp: 80 }).notes.length, 1);
});
// teaching tabs: every number on a case or calc item comes from the engine
const block = (a, b, v) => new Function(html.slice(html.indexOf(a), html.indexOf(b)) + '; return ' + v)();
const CASES = block('/*CASES-START*/', '/*CASES-END*/', 'UGIB_CASES');
const QUIZ = block('/*QUIZ-START*/', '/*QUIZ-END*/', 'UGIB_QUIZ');
const MAP = block('/*MAP-START*/', '/*MAP-END*/', 'UGIB_MAP');
t('6 cases', () => assert.strictEqual(CASES.length, 6));
CASES.forEach(c => t('case ' + c.id + ' matches engine', () => {
  const r = E.assess(c.input), x = c.expect;
  assert.deepStrictEqual(r.errors, {});
  assert.strictEqual(r.gbs.score, x.gbs);
  assert.strictEqual(r.gbs.band, x.band);
  assert.strictEqual(r.rockall.score, x.rockall);
  if (x.mortality !== undefined) assert.strictEqual(r.rockall.mortality, x.mortality);
  assert.strictEqual(r.transfusion.threshold, x.threshold);
  assert.strictEqual(r.transfusion.below, x.below);
  assert.ok(c.q.length >= 3 && c.pit && c.src && c.stem);
}));
t('case ids unique, Forrest valid', () => {
  assert.strictEqual(new Set(CASES.map(c => c.id)).size, 6);
  CASES.forEach(c => { if (c.forrest) assert.ok(['Ia', 'Ib', 'IIa', 'IIb', 'IIc', 'III'].includes(c.forrest)); });
});
t('quiz 10 basic + 10 advanced', () => {
  assert.strictEqual(QUIZ.length, 20);
  assert.strictEqual(QUIZ.filter(q => q.l === 'basic').length, 10);
  assert.strictEqual(QUIZ.filter(q => q.l === 'adv').length, 10);
});
t('quiz items well formed, answers A–D five each', () => {
  const n = [0, 0, 0, 0];
  QUIZ.forEach(q => {
    assert.strictEqual(q.o.length, 4);
    assert.strictEqual(new Set(q.o).size, 4);
    assert.ok(q.x && q.s);
    n[q.a]++;
  });
  assert.deepStrictEqual(n, [5, 5, 5, 5]);
});
t('calc quiz item agrees with engine', () => {
  const q = QUIZ.find(q => q.calc);
  assert.strictEqual(q.o[q.a], E.gbs(q.calc).score + ' 分');
});
t('map has both sides, every leaf labelled', () => {
  assert.ok(MAP.dx.length >= 4 && MAP.tx.length >= 4);
  MAP.dx.concat(MAP.tx).forEach(b => { assert.ok(b.t && b.l.length); b.l.forEach(l => assert.ok(l[0] && l[1])); });
});
console.log('ok ' + n + ' tests');
