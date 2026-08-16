import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const CRS = require('./assessment/config/crs-1.0.js');
let failures = 0;
function check(name, cond) { if (!cond) { failures++; console.error('FAIL', name); } }

check('version is CRS_1.0', CRS.version === 'CRS_1.0');
check('weights sum to 100',
  Object.values(CRS.dimensions).reduce((s, d) => s + d.weight, 0) === 100);
check('six dimensions', Object.keys(CRS.dimensions).length === 6);
check('scale values correct',
  CRS.scale.STRUCTURED === 100 && CRS.scale.ESTABLISHED === 75 &&
  CRS.scale.PARTIAL === 50 && CRS.scale.MANUAL === 25 &&
  CRS.scale.ABSENT === 0 && CRS.scale.NOT_SURE === null);
check('bands cover 0 to 100 with no gap',
  CRS.bands[0].min === 0 && CRS.bands[CRS.bands.length - 1].max === 100 &&
  CRS.bands.every((b, i) => i === 0 || b.min === CRS.bands[i - 1].max + 1));
check('every question maps to a known dimension',
  CRS.questions.every(q => CRS.dimensions[q.dimension]));
check('every maturity option value is in scale or null',
  CRS.questions.every(q => q.options.every(o =>
    o.value === null || Object.values(CRS.scale).includes(o.value))));
check('every question has exactly one NOT_SURE option',
  CRS.questions.every(q => q.options.filter(o => o.key === 'NOT_SURE').length === 1));
check('stage 1 has one question per dimension (six total)',
  CRS.questions.filter(q => q.stage === 1).length === 6);
check('no em or en dashes in config strings',
  ![...JSON.stringify(CRS)].some(function (c) { return c.charCodeAt(0) === 0x2013 || c.charCodeAt(0) === 0x2014; }));

if (failures) { console.error(failures + ' config checks failed'); process.exit(1); }
console.log('assessment-config: PASS');
