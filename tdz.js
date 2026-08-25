/* tdz.js — ⭐⭐ 「선언은 있는데 아직 값이 없다」를 잡는 자 (0825j 에서 새로 짬)
   ⚠⚠ 왜 지었나 — 0825 에 이 병으로 하루를 태울 뻔했다:

       var TAKEOFF = (... && dist < 0.05);   // 1299행
       var dist    = ...;                     // 1301행  ⚠ 두 줄 아래

     var 는 이름만 끌어올려지고 값은 undefined 다. `undefined < 0.05` 는 false 라
     TAKEOFF 가 **언제나 false** 였다. 첫 비행에서 활주로가 안 섰다.

   ⚠ node --check 는 문법만 본다. node scope.js 는 「선언이 있나」를 본다.
     ⭐ 이 자는 **차례**를 본다 — 같은 함수 안에서 선언보다 먼저 읽는 var.

   ⚠ 못 잡는 것: 함수를 건너뛴 읽기(콜백 안에서 읽으면 그때는 이미 값이 있다).
     그래서 **같은 함수 몸통 안, 같은 실행 흐름**에서만 잡는다. 헛경보를 안 내려는 값이다.

   쓰기: node tdz.js reading_room.js
*/
const fs = require('fs');
const path = process.argv[2];
if (!path) { console.log('쓰기: node tdz.js <파일>'); process.exit(2); }
let acorn; try { acorn = require('acorn'); }
catch (e) { console.log('acorn 없음 — npm i acorn'); process.exit(2); }

const src = fs.readFileSync(path, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 2020, locations: true, ranges: true });
const problems = [];

function line(n) { return n.loc.start.line; }

/* 함수 몸통 하나를 훑는다 — 그 안의 var 선언 위치와, 그 이름을 읽는 위치를 견준다 */
function scanBody(body, fnName, params) {
  const declAt = new Map();      /* 이름 → 선언된 줄 */
  const readAt = new Map();      /* 이름 → 처음 읽은 줄 (같은 흐름에서만) */
  /* ⚠ 0825j 헛경보 — catch(x) 의 x 와 함수 인자는 **이미 값이 있는 이름**이다.
     같은 몸통에 var x 가 따로 있어도 다른 물건이므로 셈에서 뺀다. */
  const skip = new Set(params || []);

  /* ① 이 몸통의 **곧바른** 문장들만 본다. 중첩 함수는 따로 돈다 */
  function walkStmt(node, depth) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
        || node.type === 'ArrowFunctionExpression') return;   /* ⚠ 나중에 도는 곳이다 */

    if (node.type === 'VariableDeclaration' && node.kind === 'var') {
      node.declarations.forEach(d => {
        if (d.id.type === 'Identifier' && !declAt.has(d.id.name)) {
          /* ⭐ 초기값 안에서 저를 읽는 것은 셈에 안 넣는다 (var a = a || 1 꼴) */
          declAt.set(d.id.name, line(d.id));
        }
        if (d.init) walkStmt(d.init, depth);
      });
      return;
    }
    if (node.type === 'CatchClause') {          /* ⚠ catch(x) — x 는 그 블록만의 이름이다 */
      if (node.param && node.param.type === 'Identifier') skip.add(node.param.name);
      walkStmt(node.body, depth);
      return;
    }
    if (node.type === 'Identifier') {
      if (!skip.has(node.name) && !readAt.has(node.name)) readAt.set(node.name, line(node));
      return;
    }
    if (node.type === 'MemberExpression') {   /* a.b 의 b 는 이름이 아니다 */
      walkStmt(node.object, depth);
      if (node.computed) walkStmt(node.property, depth);
      return;
    }
    if (node.type === 'Property') {           /* {a: b} 의 a 는 이름이 아니다 */
      if (node.computed) walkStmt(node.key, depth);
      walkStmt(node.value, depth);
      return;
    }
    for (const k in node) {
      if (k === 'loc' || k === 'range' || k === 'start' || k === 'end') continue;
      const c = node[k];
      if (Array.isArray(c)) c.forEach(x => walkStmt(x, depth));
      else if (c && typeof c.type === 'string') walkStmt(c, depth);
    }
  }

  (body || []).forEach(st => walkStmt(st, 0));

  /* ② 선언보다 먼저 읽은 것 */
  for (const [name, dl] of declAt) {
    const rl = readAt.get(name);
    if (rl != null && rl < dl && !skip.has(name)) {
      problems.push({ name, read: rl, decl: dl, fn: fnName });
    }
  }
}

/* 모든 함수 몸통을 찾아 하나씩 돌린다 */
function walkFns(node, name) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
      || node.type === 'ArrowFunctionExpression') {
    const nm = (node.id && node.id.name) || name || '(이름 없음)';
    const ps = (node.params || []).filter(p => p.type === 'Identifier').map(p => p.name);
    if (node.body && node.body.type === 'BlockStatement') scanBody(node.body.body, nm, ps);
  }
  for (const k in node) {
    if (k === 'loc' || k === 'range' || k === 'start' || k === 'end') continue;
    const c = node[k];
    let nm = name;
    if (node.type === 'VariableDeclarator' && node.id && node.id.name) nm = node.id.name;
    if (node.type === 'Property' && node.key && node.key.name) nm = node.key.name;
    if (Array.isArray(c)) c.forEach(x => walkFns(x, nm));
    else if (c && typeof c.type === 'string') walkFns(c, nm);
  }
}
scanBody(ast.body, '(맨 바깥)', []);
walkFns(ast, null);

if (!problems.length) {
  console.log('⭐ 차례 이상 없음 — ' + path);
  process.exit(0);
}
console.log('⚠⚠ 선언보다 먼저 읽는 var ' + problems.length + '개');
problems.sort((a, b) => a.read - b.read).forEach(p => {
  console.log('   ' + p.name + ' — ' + p.read + '행에서 읽는데 선언은 ' + p.decl
    + '행  (' + p.fn + ')');
});
process.exit(1);
