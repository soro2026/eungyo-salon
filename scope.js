/* scope.js — 스코프 체인을 실제로 타는 검사기 (0821S 에서 새로 짬 · 레포에 없어 다시 세움)
   ⚠ node --check 는 「어디엔가 var 가 있으면」 통과시킨다. 이 물건은 체인을 탄다. */
const fs=require('fs'),path=process.argv[2];
let acorn;try{acorn=require('acorn');}catch(e){console.log('acorn 없음 — npm i acorn');process.exit(2);}
const src=fs.readFileSync(path,'utf8');
const ast=acorn.parse(src,{ecmaVersion:2020,locations:true});
const GLOBALS=new Set(['window','document','console','Math','JSON','Date','Object','Array','String','Number','Boolean','RegExp','Error','Promise','Map','Set','WeakMap','parseInt','parseFloat','isFinite','isNaN','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame','fetch','Cesium','navigator','location','localStorage','sessionStorage','performance','undefined','NaN','Infinity','arguments','this','encodeURIComponent','decodeURIComponent','btoa','atob','Uint8Array','Float32Array','TextDecoder','AbortController','URL','Intl','Symbol','Function','globalThis','structuredClone','queueMicrotask','innerWidth','innerHeight','EGBookAdd','EGStamp','EGMapNE','EGSpoon','EGCred','CustomEvent','Event','Image','Audio','AudioContext','webkitAudioContext','ResizeObserver','IntersectionObserver','MutationObserver','crypto','alert','confirm','prompt','matchMedia','getComputedStyle','history','screen','top','self','parent','frames','process','require','module','exports','__dirname','__filename']);
const scopes=[];const problems=[];
function push(node,type){scopes.push({node,type,vars:new Set()});}
function pop(){scopes.pop();}
function declare(name){if(scopes.length)scopes[scopes.length-1].vars.add(name);}
function declareVar(name){for(let i=scopes.length-1;i>=0;i--){if(scopes[i].type!=='block'){scopes[i].vars.add(name);return;}}}
function known(name){if(GLOBALS.has(name))return true;for(let i=scopes.length-1;i>=0;i--)if(scopes[i].vars.has(name))return true;return false;}
function pat(n,fn){if(!n)return;if(n.type==='Identifier')fn(n.name);
 else if(n.type==='ObjectPattern')n.properties.forEach(p=>pat(p.value||p.argument,fn));
 else if(n.type==='ArrayPattern')n.elements.forEach(e=>pat(e,fn));
 else if(n.type==='AssignmentPattern')pat(n.left,fn);
 else if(n.type==='RestElement')pat(n.argument,fn);}
function hoist(body){(body||[]).forEach(st=>{
 if(st.type==='FunctionDeclaration'&&st.id)declareVar(st.id.name);
 if(st.type==='VariableDeclaration'&&st.kind==='var')st.declarations.forEach(d=>pat(d.id,declareVar));
 if(st.type==='VariableDeclaration'&&st.kind!=='var')st.declarations.forEach(d=>pat(d.id,declare));
 if(st.type==='ClassDeclaration'&&st.id)declare(st.id.name);
 ['body','consequent','alternate'].forEach(k=>{const c=st[k];if(c&&c.type==='BlockStatement')hoistDeep(c.body);else if(Array.isArray(c))hoistDeep(c);});
 if(st.type==='TryStatement'){if(st.block)hoistDeep(st.block.body);if(st.handler)hoistDeep(st.handler.body.body);if(st.finalizer)hoistDeep(st.finalizer.body);}
 if(st.type==='SwitchStatement')st.cases.forEach(c=>hoistDeep(c.consequent));
 if(st.type==='ForStatement'&&st.init&&st.init.type==='VariableDeclaration'&&st.init.kind==='var')st.init.declarations.forEach(d=>pat(d.id,declareVar));
 if((st.type==='ForInStatement'||st.type==='ForOfStatement')&&st.left&&st.left.type==='VariableDeclaration'&&st.left.kind==='var')st.left.declarations.forEach(d=>pat(d.id,declareVar));
});}
function hoistDeep(body){(body||[]).forEach(st=>{
 if(st.type==='VariableDeclaration'&&st.kind==='var')st.declarations.forEach(d=>pat(d.id,declareVar));
 if(st.type==='FunctionDeclaration'&&st.id)declareVar(st.id.name);
 ['body','consequent','alternate'].forEach(k=>{const c=st[k];if(c&&c.type==='BlockStatement')hoistDeep(c.body);else if(Array.isArray(c))hoistDeep(c);});
 if(st.type==='TryStatement'){if(st.block)hoistDeep(st.block.body);if(st.handler)hoistDeep(st.handler.body.body);if(st.finalizer)hoistDeep(st.finalizer.body);}
 if(st.type==='SwitchStatement')st.cases.forEach(c=>hoistDeep(c.consequent));
 if(st.type==='ForStatement'&&st.init&&st.init.type==='VariableDeclaration'&&st.init.kind==='var')st.init.declarations.forEach(d=>pat(d.id,declareVar));
 if((st.type==='ForInStatement'||st.type==='ForOfStatement')&&st.left&&st.left.type==='VariableDeclaration'&&st.left.kind==='var')st.left.declarations.forEach(d=>pat(d.id,declareVar));
});}
function walk(n,parent){
 if(!n||typeof n.type!=='string')return;
 const fnLike=n.type==='FunctionDeclaration'||n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression';
 if(n.type==='Program'){push(n,'fn');hoist(n.body);n.body.forEach(c=>walk(c,n));pop();return;}
 if(fnLike){push(n,'fn');if(n.id)declare(n.id.name);n.params.forEach(p=>pat(p,declare));
  if(n.body.type==='BlockStatement'){hoist(n.body.body);n.body.body.forEach(c=>walk(c,n));}else walk(n.body,n);pop();return;}
 if(n.type==='BlockStatement'){push(n,'block');hoist(n.body);n.body.forEach(c=>walk(c,n));pop();return;}
 if(n.type==='CatchClause'){push(n,'block');if(n.param)pat(n.param,declare);hoist(n.body.body);n.body.body.forEach(c=>walk(c,n));pop();return;}
 if(n.type==='ForStatement'||n.type==='ForInStatement'||n.type==='ForOfStatement'){
  push(n,'block');
  if(n.init&&n.init.type==='VariableDeclaration')n.init.declarations.forEach(d=>pat(d.id,declare));
  if(n.left&&n.left.type==='VariableDeclaration')n.left.declarations.forEach(d=>pat(d.id,declare));
  for(const k in n){const c=n[k];if(Array.isArray(c))c.forEach(x=>walk(x,n));else if(c&&typeof c.type==='string')walk(c,n);}
  pop();return;}
 if(n.type==='Identifier'){
  if(parent&&(parent.type==='MemberExpression'&&parent.property===n&&!parent.computed))return;
  if(parent&&(parent.type==='Property'&&parent.key===n&&!parent.computed))return;
  if(parent&&parent.type==='LabeledStatement')return;
  if(!known(n.name))problems.push({name:n.name,line:n.loc.start.line});
  return;}
 for(const k in n){if(k==='loc'||k==='start'||k==='end')continue;const c=n[k];
  if(Array.isArray(c))c.forEach(x=>walk(x,n));else if(c&&typeof c.type==='string')walk(c,n);}
}
walk(ast,null);
const seen=new Map();
problems.forEach(p=>{if(!seen.has(p.name))seen.set(p.name,p.line);});
if(!seen.size)console.log('⭐ 스코프 이상 없음 —',path);
else{console.log('⚠⚠ 스코프 체인에서 못 찾은 이름 '+seen.size+'개');
 [...seen].slice(0,40).forEach(([n,l])=>console.log('   '+n+' — '+l+'행'));process.exitCode=1;}
