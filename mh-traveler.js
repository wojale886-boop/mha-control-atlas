(() => {
'use strict';
const A = window.MH_ATLAS;
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS_KEY = 'mha_traveler_config_v3';
const PAD_PS = window.PAD_PS || {};
const isT = () => A.state.game === 'traveler';
const isPad = () => A.state.device === 'pad';

/* ================= 数据：本地缓存 > 内置默认 ================= */
function loadCache(){
  try{ const o = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); return o && Array.isArray(o.data) ? o : null; }catch(e){ return null; }
}
const cached = loadCache();
let DATA = cached ? cached.data : structuredClone(window.TRAVELER_DATA || []);
let sourceLabel = cached ? `本地缓存 · ${cached.label || ''} ${cached.at || ''}` : '内置默认配置';
function saveCache(label){
  const at = new Date().toLocaleString('zh-CN', { hour12:false });
  try{ localStorage.setItem(LS_KEY, JSON.stringify({ data:DATA, at, label })); }catch(e){}
  sourceLabel = `本地缓存 · ${label} ${at}`;
}
const scheme = { cur:'A' };
const padBrand = { cur:'xbox' };
const sel = { key:null, action:null };
const byId = id => DATA.find(d => d.id === id);
const kbField = () => scheme.cur === 'A' ? 'kba' : 'kbb';

/* ================= 键鼠写法解析：" / " 并列，"·" 或，"+" 组合，"按住/长按" 前缀，"（…）" 标签 ================= */
const KB_ALIAS = {'鼠标左键':'左键','鼠标右键':'右键','鼠标中键':'中键','鼠标侧键1':'侧键1','鼠标侧键2':'侧键2','Space':'空格','space':'空格','SPACE':'空格','ESC':'Esc','esc':'Esc','回车':'Enter','TAB':'Tab','tab':'Tab','SHIFT':'Shift','shift':'Shift','ALT':'Alt','alt':'Alt','CTRL':'Ctrl','ctrl':'Ctrl'};
const KB_LEGAL = /^([A-Z0-9]|F([1-9]|1[0-2])|左键|右键|中键|侧键1|侧键2|滚轮|鼠标移动|空格|Shift|Ctrl|Alt|Tab|Esc|Enter|Backspace|CapsLock|[↑↓←→`\-=\[\];',.\\])$/;
function parseKb(text){
  return String(text || '').split(/\s*\/\s*/).filter(s => s.trim()).map(group => group.split('·').map(raw => {
    let s = raw.trim(), tag = '', hold = '';
    s = s.replace(/[（(]([^）)]+)[）)]/g, (m, t) => { tag = t; return ''; }).trim();
    const m = s.match(/^(按住|长按)\s*/); if(m){ hold = m[1]; s = s.slice(m[0].length); }
    const keys = s.split('+').map(t => t.trim()).filter(Boolean).map(t => { const k = KB_ALIAS[t] || t; return /^[a-z]$/.test(k) ? k.toUpperCase() : k; });
    return { keys, hold, tag };
  }));
}
function validateKb(text){
  const groups = parseKb(text), errs = [];
  if(!groups.length) errs.push('内容为空');
  groups.flat().forEach(p => { if(!p.keys.length) errs.push('存在空的按键项'); p.keys.forEach(k => { if(!KB_LEGAL.test(k)) errs.push(`无法识别的按键「${k}」`); }); });
  return [...new Set(errs)];
}
function keysOfKb(text){
  const out = new Set();
  parseKb(text).flat().forEach(p => p.keys.forEach(k => { if(k === '滚轮'){ out.add('滚轮上'); out.add('滚轮下'); } else if(k !== '鼠标移动') out.add(k); }));
  return [...out];
}
function combosOfKb(text){ return parseKb(text).flat().filter(p => p.keys.length).map(p => (p.hold ? '按住 ' : '') + [...p.keys].sort().join('+')); }
function kbKeyHtml(k){ return (k === '滚轮' || k === '鼠标移动') ? `<kbd class="input-key">${A.mouseIcon()}${esc(k)}</kbd>` : A.keyBadge(k); }
function kbHtml(text){
  const groups = parseKb(text);
  if(!groups.length) return '<span class="missing-value">未设置</span>';
  return `<span class="input-set">${groups.map(alts => alts.map(p => {
    const chord = p.keys.length > 1 && !p.hold;
    return `<span class="input-alternative${chord ? ' chord' : ''}">${p.hold ? `<span class="input-hold">${p.hold}</span>` : ''}${p.keys.map(kbKeyHtml).join('<span class="input-join">+</span>')}${p.tag ? `<span class="input-hold">${esc(p.tag)}</span>` : ''}</span>`;
  }).join('<span class="input-or">或</span>')).join('<span class="input-or">/</span>')}</span>`;
}

/* ================= 手柄写法解析（Xbox 写法为准） ================= */
const PAD_TOK = {Y:'t',B:'c',A:'x',X:'s',RT:'r2',RB:'r1',LT:'l2',LB:'l1','≡':'options',MENU:'options',OPTIONS:'options','▣':'touch',VIEW:'touch','触控板':'touch','↑':'d_up','↓':'d_down','←':'d_left','→':'d_right'};
function parsePadPart(raw){
  let t = raw.trim(), pre = '', act = '', m;
  if((m = t.match(/^(长按|按住)/))){ pre = m[1]; t = t.slice(m[0].length).trim(); }
  if((m = t.match(/^(推满|推动|推|按下)/))){ act = m[1]; t = t.slice(m[0].length).trim(); }
  const U = t.toUpperCase(); let tokens;
  if(t === '←→') tokens = ['d_left','d_right'];
  else if(U === 'RS' || t === '右摇杆') tokens = [act === '按下' ? 'r3' : 'rs'];
  else if(U === 'LS' || t === '左摇杆') tokens = [act === '按下' ? 'l3' : 'ls'];
  else tokens = [PAD_TOK[U] || PAD_TOK[t] || null];
  return { pre, act, tokens, raw:t };
}
function parsePad(text){ return String(text || '').split(/\s*\/\s*/).filter(s => s.trim()).map(g => g.split('+').map(parsePadPart)); }
function validatePad(text){
  const g = parsePad(text), errs = [];
  if(!g.length) errs.push('内容为空');
  g.flat().forEach(p => { if(p.tokens.some(t => !t)) errs.push(`无法识别的手柄键「${p.raw}」`); });
  return [...new Set(errs)];
}
function padNodesOf(text){
  const ids = new Set();
  parsePad(text).flat().forEach(p => p.tokens.forEach(t => { if(!t) return; ids.add(t === 'rs' ? 'r3' : t === 'ls' ? 'l3' : t); }));
  return [...ids];
}
function padHtml(text, kind){
  const groups = parsePad(text);
  if(!groups.length) return '<span class="missing-value">未设置</span>';
  return `<span class="input-set">${groups.map(parts => {
    const inner = parts.map(p => `${p.pre ? `<span class="input-hold">${p.pre}</span>` : ''}${p.act ? `<span class="tv-act">${p.act}</span>` : ''}${p.tokens.map(t => t ? A.padBadge(t, kind) : `<span class="missing-value">${esc(p.raw)}</span>`).join('<span class="input-or">/</span>')}`).join('<span class="input-join">+</span>');
    return `<span class="input-alternative${parts.length > 1 ? ' chord' : ''}">${inner}</span>`;
  }).join('<span class="input-or">/</span>')}</span>`;
}
function psOf(pad){ return String(pad).replace(/(RT|RB|LT|LB|RS|LS|Y|A|B|X)/g, m => PAD_PS[m] || m); }

function currentKeys(d){ return isPad() ? padNodesOf(d.pad) : keysOfKb(d[kbField()]); }

/* ================= 冲突检测（仅键鼠；同场景才算冲突） ================= */
const SHARED = [['lockwheel','lockpart'],['interact','build_quick']];
function ctxOf(d){ if(d.id === 'confirm') return 'ui'; if(d.cat === '近战') return 'melee'; if(d.cat === '远程') return 'ranged'; return 'common'; }
function ctxOverlap(a, b){ if(a === 'ui' || b === 'ui') return a === b; if(a === 'common' || b === 'common') return true; return a === b; }
function isShared(a, b){ return SHARED.some(([x, y]) => (x === a && y === b) || (x === b && y === a)); }
function combosOfItem(d, sch){ return combosOfKb(d[sch === 'A' ? 'kba' : 'kbb']); }
function conflictsFor(item, sch, list = DATA){
  const mine = combosOfItem(item, sch);
  return list.filter(o => o.id !== item.id && !isShared(o.id, item.id) && ctxOverlap(ctxOf(o), ctxOf(item)))
    .map(o => ({ other:o, combo:mine.find(c => combosOfItem(o, sch).includes(c)) })).filter(x => x.combo);
}
function allConflicts(sch, list = DATA){
  const out = [];
  list.forEach((a, i) => list.slice(i + 1).forEach(b => {
    if(isShared(a.id, b.id) || !ctxOverlap(ctxOf(a), ctxOf(b))) return;
    const cb = combosOfItem(b, sch), hit = combosOfItem(a, sch).find(c => cb.includes(c));
    if(hit) out.push({ a, b, combo:hit });
  }));
  return out;
}

/* ================= 分区：战斗 / 系统（与荒野·世界一致） ================= */
const DOMAINS = {
  combat: { name:'战斗操作', cats:['移动','近战','远程','奥义','锁定'], side:{移动:'left',近战:'left',远程:'left',奥义:'right',锁定:'right'} },
  system: { name:'系统功能', cats:['道具交互','建造','系统'], side:{道具交互:'left',建造:'right',系统:'right'} }
};
function currentDomain(){ return DOMAINS[A.state.domain] || DOMAINS.combat; }
const TRIG_HINT = {'切换':'按一下切换跑动 / 行走','按住+滚轮':'按住触发键，滚动滚轮选择，松开确认','滚轮(交互提示时)':'交互提示出现时滚动滚轮切换，按 F 确认'};
let conflictIds = new Set();
function bindingHtml(d){
  if(isPad()) return padHtml(d.pad, padBrand.cur);
  return kbHtml(d[kbField()]);
}
function rowHtml(d){
  const hint = TRIG_HINT[d.trig] || '';
  const warn = !isPad() && conflictIds.has(d.id) ? '<span class="tv-warn" title="与同场景其他功能键位重复">冲突</span>' : '';
  return `<button class="function-row tv-row" data-action="${esc(d.id)}" aria-pressed="false"><span class="row-label"><span class="action-name">${esc(d.name)}${d.edit ? '<span class="tv-tag" title="玩家可在游戏内改键">可改</span>' : ''}${warn}</span>${hint ? `<span class="row-context">${esc(hint)}</span>` : ''}</span><span class="row-binding">${bindingHtml(d)}</span></button>`;
}
function renderFunctions(){
  const dom = currentDomain();
  const sides = { left:[], right:[] };
  dom.cats.forEach(cat => {
    const rows = DATA.filter(d => d.cat === cat); if(!rows.length) return;
    const side = dom.side[cat] || 'left';
    sides[side].push(`<section class="function-section"><h3>${esc(cat)}<span>${String(rows.length).padStart(2,'0')}</span></h3>${rows.map(rowHtml).join('')}</section>`);
  });
  $('left-functions').innerHTML = sides.left.join('') || '<p class="column-empty">此侧暂无</p>';
  $('right-functions').innerHTML = sides.right.join('') || '<p class="column-empty">此侧暂无</p>';
  const viewRows = dom.cats.flatMap(cat => DATA.filter(d => d.cat === cat));
  const inputs = new Set(viewRows.flatMap(currentKeys));
  $('binding-count').textContent = `${viewRows.length} 项功能 · ${inputs.size} 个输入`;
  document.querySelectorAll('.device-key').forEach(el => el.classList.toggle('bound', inputs.has(el.dataset.key)));
  document.querySelectorAll('[data-domain]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.domain === (A.state.domain || 'combat'))));
}

/* ================= 选中 / 悬停 / 连线 / 定位 ================= */
function selectionRows(){
  if(sel.action) return DATA.filter(d => d.id === sel.action);
  if(sel.key) return DATA.filter(d => currentKeys(d).includes(sel.key));
  return [];
}
function applySelection(){
  const rows = selectionRows(), ids = new Set(rows.map(r => r.id));
  const keys = sel.action ? new Set(rows.flatMap(currentKeys)) : new Set(sel.key ? [sel.key] : []);
  const active = !!(sel.key || sel.action);
  document.querySelectorAll('.device-key').forEach(el => { const on = keys.has(el.dataset.key); el.classList.toggle('selected', on); el.classList.toggle('dimmed', active && !on); el.setAttribute('aria-pressed', String(on)); });
  document.querySelectorAll('.tv-row').forEach(el => { const on = ids.has(el.dataset.action); el.classList.toggle('selected', on); el.classList.toggle('dimmed', active && !on); el.setAttribute('aria-pressed', String(on)); });
  document.querySelectorAll('#comparison-results tr[data-record]').forEach(tr => tr.classList.toggle('tv-selected', ids.has(tr.dataset.record)));
  const keyName = sel.key ? (document.querySelector(`.device-key[data-key="${CSS.escape(sel.key)}"] title`)?.textContent.split(' · ')[0] || sel.key) : '';
  $('selection-hint').textContent = sel.action ? `${byId(sel.action)?.name || ''} · 组合中的所有按键同步点亮` : sel.key ? `${keyName} · 共 ${rows.length} 项功能，已在两侧列表定位` : '点击按键或两侧功能，查看对应关系；下方对照表中点击旅人键位可打开选取器修改。';
  $('reset-selection').disabled = !active;
  const eb = $('edit-selection');
  if(eb){
    eb.hidden = !active;
    const ambiguous = !sel.action && rows.length !== 1;
    eb.disabled = ambiguous;
    eb.title = sel.action ? '打开选取器，修改当前功能的快捷键' : ambiguous ? '当前按键匹配多个功能，请在下方对照表中点选要修改的那一行后点击此按钮' : '打开选取器，修改该功能的快捷键';
  }
  drawLines();
}
function drawLines(){
  if(!isT()) return;
  const layer = $('connection-layer'), wrap = $('map-wrap'), bounds = wrap.getBoundingClientRect();
  layer.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  const paths = [];
  selectionRows().forEach(rec => {
    const rowEl = wrap.querySelector(`.tv-row[data-action="${CSS.escape(rec.id)}"]`); if(!rowEl) return;
    const tr = rowEl.getBoundingClientRect(), col = rowEl.closest('.function-column'), cr = col.getBoundingClientRect();
    if(tr.bottom <= cr.top || tr.top >= cr.bottom) return;
    const isLeft = col.id === 'left-functions';
    (sel.key ? [sel.key] : currentKeys(rec)).forEach(key => {
      const nodes = [...wrap.querySelectorAll('.device-key')].filter(el => el.dataset.key === key && el.closest('[role="tabpanel"]:not([hidden])'));
      const node = nodes.find(el => !(el.dataset.physical || '').endsWith('Right')) || nodes[0]; if(!node) return;
      const kr = node.getBoundingClientRect();
      const x1 = (isLeft ? kr.left : kr.right) - bounds.left, y1 = kr.top + kr.height / 2 - bounds.top;
      const x2 = (isLeft ? tr.right : tr.left) - bounds.left, y2 = Math.max(cr.top + 3, Math.min(tr.top + tr.height / 2, cr.bottom - 3)) - bounds.top;
      const bend = isLeft ? Math.min(x1 - 16, x2 + 14) : Math.max(x1 + 16, x2 - 14);
      paths.push(`<path class="connection-line" d="M${x1},${y1} L${bend},${y1} L${bend},${y2} L${x2},${y2}"/><circle class="connection-end" cx="${x1}" cy="${y1}" r="3"/><circle class="connection-end" cx="${x2}" cy="${y2}" r="3"/>`);
    });
  });
  layer.innerHTML = paths.join('');
}
const scrollAnims = new Map();
function animateScroll(container, to){
  const prev = scrollAnims.get(container); if(prev) cancelAnimationFrame(prev);
  const from = container.scrollTop, dist = to - from;
  if(Math.abs(dist) < 2) return;
  const dur = 280; let t0 = null;
  const step = now => {
    if(t0 === null) t0 = now;
    const k = Math.min(1, (now - t0) / dur);
    container.scrollTop = from + dist * (1 - Math.pow(1 - k, 2));
    if(k < 1) scrollAnims.set(container, requestAnimationFrame(step)); else scrollAnims.delete(container);
  };
  scrollAnims.set(container, requestAnimationFrame(step));
  setTimeout(() => { if(scrollAnims.has(container)){ scrollAnims.delete(container); container.scrollTop = to; } }, dur + 120);
}
function scrollWithin(container, el){
  const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  const bottom = top + el.offsetHeight;
  if(top >= container.scrollTop + 6 && bottom <= container.scrollTop + container.clientHeight - 6) return;
  animateScroll(container, Math.max(0, top - container.clientHeight / 2 + el.offsetHeight / 2));
}
function locate(ids){
  ['left-functions','right-functions'].forEach(cid => {
    const col = $(cid), first = [...col.querySelectorAll('.tv-row')].find(r => ids.has(r.dataset.action));
    if(first) scrollWithin(col, first);
  });
  const box = document.querySelector('#comparison-results .table-scroll');
  const tr = box && [...box.querySelectorAll('tr[data-record]')].find(r => ids.has(r.dataset.record));
  if(tr) scrollWithin(box, tr);
}
function selectKey(key){
  sel.action = null; sel.key = sel.key === key ? null : key;
  applySelection();
  if(sel.key) locate(new Set(selectionRows().map(r => r.id)));
}
function selectAction(id, fromTable){
  sel.key = null; sel.action = sel.action === id ? null : id;
  applySelection();
  if(sel.action && fromTable) locate(new Set([id]));
}
function clearSel(){ sel.key = null; sel.action = null; applySelection(); }
function markHover(keys, rows){
  document.querySelectorAll('.device-key').forEach(el => el.classList.toggle('hovered', keys.has(el.dataset.key)));
  document.querySelectorAll('.tv-row').forEach(el => el.classList.toggle('hovered', rows.has(el.dataset.action)));
}

/* ================= 对照表：每作「键鼠 + 手柄」并排，手柄品牌由下拉切换 ================= */
const REF = {move:'移动',sprint:'冲刺 / 收刀（切换）',dodge:'下蹲 / 回避',atk:'普通攻击',s1:'防御 / 武器特殊动作',s2:'特殊攻击',s3:'同时按下动作',sheath:'使用道具 / 收刀',
  ratk:'拔刀 / 射击',rs1:'装填 / 上瓶 · 卸瓶',rs2:'特殊攻击',rs3:'防御 / 武器特殊动作',reload:'装填 / 上瓶 · 卸瓶',lock:'锁定 / 切换至目标视角',
  interact:'互动 / 对话 / 采集 / 剥取',item:'使用道具 / 收刀',item_wheel:'道具选择 / 重置视角',confirm:'确定',menu:'打开开始菜单',map:'打开地图',quickchat:'贴图',chat:'聊天窗口',quest:'使命信息界面'};
const GENERIC = { camera:{ kb:'鼠标移动', pad:'右摇杆' } };
function findRef(name, game, ranged){
  const c = A.records.filter(r => r.versions[game] && r.action === name && r.category !== 'weapon');
  return c.find(r => ranged ? r.category === 'ranged' : r.category !== 'ranged') || c[0] || null;
}
function refCells(d, game){
  const name = REF[d.id], gen = GENERIC[d.id];
  if(gen) return `<td class="group-edge">${kbHtml(gen.kb)}</td><td>${padHtml(gen.pad, padBrand.cur)}</td>`;
  if(!name) return `<td class="group-edge" colspan="2"><span class="tv-only">旅人特有 · 无对应动作</span></td>`;
  const r = findRef(name, game, d.cat === '远程'), v = r && r.versions[game];
  if(!v) return `<td class="group-edge" colspan="2"><span class="missing-value">本作未收录</span></td>`;
  return `<td class="group-edge">${A.renderInput(v.keyboard.alternatives)}</td><td>${A.renderInput(v.pad[padBrand.cur], padBrand.cur)}</td>`;
}
function travelerCells(d){
  const pen = '<span class="tv-pen" aria-hidden="true">✎</span>';
  return `<td class="group-edge tv-cell" data-edit="${esc(d.id)}" data-mode="kb" title="点击打开选取器修改 键鼠 ${scheme.cur} 方案">${kbHtml(d[kbField()])}${pen}</td><td class="tv-cell" data-edit="${esc(d.id)}" data-mode="pad" title="点击打开选取器修改手柄键位（Xbox 写法）">${padHtml(d.pad, padBrand.cur)}${pen}</td>`;
}
function renderComparison(){
  const brandLbl = padBrand.cur === 'xbox' ? 'Xbox 手柄' : 'PlayStation 手柄';
  const sub = `<th class="group-edge" scope="col">键鼠 / 鼠标</th><th scope="col">${A.brand(padBrand.cur)} ${brandLbl}</th>`;
  const g = (label, cls = '') => `<th class="game-head ${cls}" colspan="2" scope="colgroup">${label}</th>`;
  const cols = '<col style="width:16%">' + '<col style="width:14%"><col style="width:14%">'.repeat(3);
  const body = DATA.map(d => {
    const ref = REF[d.id] ? `<span class="tv-ref">对照动作：${esc(REF[d.id])}</span>` : '';
    const selCls = sel.action === d.id || (sel.key && currentKeys(d).includes(sel.key)) ? ' tv-selected' : '';
    return `<tr data-record="${esc(d.id)}" class="${selCls.trim()}"><td><span class="table-context">${esc(d.cat)}${d.edit ? ' · 玩家可改' : ''}</span><span class="table-action">${esc(d.name)}</span>${ref}</td>${travelerCells(d)}${refCells(d, 'wilds')}${refCells(d, 'world')}</tr>`;
  }).join('');
  $('comparison-title').textContent = `旅人键位对照 · 键鼠 ${scheme.cur} 方案 + ${brandLbl}`;
  $('comparison-description').textContent = `每作同时陈列键鼠与手柄两列；手柄列显示${padBrand.cur === 'xbox' ? 'Xbox' : 'PlayStation'}写法（由 Xbox 写法自动换算），可用上方「手柄品牌」切换。点击旅人列可打开选取器修改。`;
  $('comparison-results').innerHTML = `<div class="table-scroll"><table class="compare-table tv-table"><colgroup>${cols}</colgroup><thead><tr><th rowspan="2" scope="col">功能 / 适用场景</th>${g(`怪物猎人 · 旅人 · ${scheme.cur} 方案`, 'tv-head')}${g('怪物猎人 · 荒野')}${g('怪物猎人 · 世界 / 冰原', 'world')}</tr><tr>${sub}${sub}${sub}</tr></thead><tbody>${body}</tbody></table></div>`;
  $('comparison-total').textContent = `共 ${DATA.length} 项 · 改动自动缓存在本机浏览器，点「保存到 Excel」同步到配置表`;
  $('load-more').hidden = true;
}

/* ================= 可视化选取器（点选，不打字） ================= */
const KB_GROUPS = [
  ['主键区','Q W E R T Y U I O P A S D F G H J K L Z X C V B N M'.split(' ')],
  ['数字与符号','` 1 2 3 4 5 6 7 8 9 0 - ='.split(' ')],
  ['功能键',['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12']],
  ['控制键',['Shift','Ctrl','Alt','Tab','Esc','Enter','空格']],
  ['鼠标',['左键','右键','中键','侧键1','侧键2','滚轮']],
  ['其他',['鼠标移动','↑','↓','←','→']],
];
const PAD_GROUPS = [
  ['面键',['Y','B','A','X']],
  ['肩键与扳机',['LB','RB','LT','RT']],
  ['摇杆',['LS','RS']],
  ['十字键',['↑','↓','←','→']],
  ['系统键',['≡','▣']],
];
const modal = { open:false, id:null, mode:'kb', parts:[], hold:'', act:'', tag:false, alts:[], raws:[] };

function comboText(){
  if(modal.mode === 'kb'){
    return (modal.hold ? modal.hold + ' ' : '') + modal.parts.join('+') + (modal.tag ? '（切换）' : '');
  }
  return (modal.hold || '') + modal.parts.map(t => (modal.act && ['RS','LS','↑','↓','←','→'].includes(t)) ? modal.act + t : t).join('+');
}
function chipHtml(v, on, extra = ''){ return `<button type="button" class="tv-chip${on ? ' on' : ''} ${extra}" data-v="${esc(v)}">${esc(v)}</button>`; }
function pickerHtml(){
  const groups = modal.mode === 'kb' ? KB_GROUPS : PAD_GROUPS;
  const grids = groups.map(([label, keys]) => `<div class="tv-sec">${esc(label)}</div><div class="tv-chips">${keys.map(k => chipHtml(k, modal.parts.includes(k))).join('')}</div>`).join('');
  const prefix = modal.mode === 'pad' ? `<div class="tv-sec">前缀（单选）</div><div class="tv-chips">${['','长按','按住'].map(v => chipHtml(v || '（无）', modal.hold === v, 'mod')).join('')}</div><div class="tv-sec">摇杆 / 十字键动作（单选）</div><div class="tv-chips">${['','推','推满','按下'].map(v => chipHtml(v || '（无）', modal.act === v, 'mod')).join('')}</div>` : '';
  const opts = modal.mode === 'kb' ? `<div class="tv-sec">选项</div><div class="tv-chips">${chipHtml('按住起手', modal.hold === '按住', 'mod')}${chipHtml('切换式（切换）', modal.tag, 'mod')}</div>` : '';
  const alts = [...modal.alts, ...modal.raws];
  return `<div class="tv-sec">${modal.mode === 'kb' ? '点击按键加入组合（再次点击移除）；修饰键 Shift/Ctrl/Alt 不会被判为冲突' : '点击手柄按键加入组合；先选前缀 / 动作，再点摇杆或十字键'}</div>${grids}${prefix}${opts}
  <div class="tv-comboline"><span class="lbl">当前组合</span><span class="input-set">${modal.parts.length ? `<span class="input-alternative${modal.parts.length > 1 && !(modal.mode === 'kb' && modal.hold) ? ' chord' : ''}">${modal.mode === 'kb' && modal.hold ? `<span class="input-hold">${modal.hold}</span>` : ''}${modal.parts.map(p => modal.mode === 'kb' ? kbKeyHtml(p) : A.padBadge(PAD_TOK[p] || p, padBrand.cur)).join('<span class="input-join">+</span>')}</span>` : '<span class="missing-value">尚未选择</span>'}</span><button type="button" class="tv-ghost" id="tv-combo-clear">清除</button></div>
  <div class="tv-sec">绑定值（可含多组，用「 / 」分隔）</div><div class="tv-comboline"><div class="tv-altlist" id="tv-altlist">${alts.length ? alts.map((a, i) => `<span class="tv-alt">${esc(a)}<button type="button" data-alt="${i}">×</button></span>`).join('') : '<span class="missing-value">空</span>'}</div><button type="button" class="tv-ghost" id="tv-alt-add">将当前组合加入</button></div>`;
}
function openEdit(id, mode){
  const d = byId(id); if(!d) return;
  modal.open = true; modal.id = id; modal.mode = mode || (isPad() ? 'pad' : 'kb');
  modal.parts = []; modal.hold = ''; modal.act = ''; modal.tag = false;
  const field = modal.mode === 'pad' ? 'pad' : kbField();
  const cur = d[field];
  modal.alts = modal.mode === 'kb' ? cur.split(/\s*\/\s*/).filter(s => s && !s.includes('·')) : [];
  modal.raws = modal.mode === 'kb' ? cur.split(/\s*\/\s*/).filter(s => s.includes('·')) : [cur];
  if(modal.mode === 'kb' && !modal.alts.length && !modal.raws.length){ modal.raws = [cur]; }
  const d2 = byId(id);
  const title = `${d2.cat} · ${d2.name} — ${modal.mode === 'pad' ? '手柄键位（Xbox 写法，PS 自动换算）' : `键鼠 ${scheme.cur} 方案`}`;
  let box = $('tv-modal');
  if(!box){
    box = document.createElement('div'); box.id = 'tv-modal'; box.className = 'tv-modal'; box.hidden = true;
    box.innerHTML = `<div class="tv-box"><div class="tv-modal-head"><h4 id="tv-modal-title"></h4><span class="tv-curline" id="tv-modal-cur"></span></div><div id="tv-picker-body"></div><div class="tv-foot"><span class="tv-err" id="tv-modal-err"></span><button type="button" class="tv-ghost" id="tv-modal-cancel">取消</button><button type="button" class="tv-primary" id="tv-modal-ok">确定</button></div></div>`;
    document.body.appendChild(box);
    box.addEventListener('click', e => {
      if(e.target === box){ closeModal(); return; }
      const chip = e.target.closest('.tv-chip[data-v]');
      if(chip && chip.dataset.v !== undefined && !chip.id){
        const v = chip.dataset.v;
        if(['（无）','（切换式（切换））'].includes(v)) return;
        if(modal.mode === 'pad' && ['（无）','长按','按住'].includes(v)){ modal.hold = v === '（无）' ? '' : v; refreshPicker(); return; }
        if(modal.mode === 'pad' && ['（无）','推','推满','按下'].includes(v)){ modal.act = v === '（无）' ? '' : v; refreshPicker(); return; }
        if(modal.mode === 'kb' && v === '按住起手'){ modal.hold = modal.hold === '按住' ? '' : '按住'; refreshPicker(); return; }
        if(modal.mode === 'kb' && v.startsWith('切换式')){ modal.tag = !modal.tag; refreshPicker(); return; }
        const i = modal.parts.indexOf(v); if(i >= 0) modal.parts.splice(i, 1); else modal.parts.push(v);
        refreshPicker(); return;
      }
      const rm = e.target.closest('[data-alt]'); if(rm){ modal.alts.splice(+rm.dataset.alt, 1); refreshPicker(); return; }
      if(e.target.id === 'tv-combo-clear'){ modal.parts = []; modal.hold = ''; modal.act = ''; modal.tag = false; refreshPicker(); return; }
      if(e.target.id === 'tv-alt-add'){ const t = comboText(); if(t && t.trim()){ if(!modal.alts.includes(t)) modal.alts.push(t); modal.parts = []; modal.hold = ''; modal.act = ''; refreshPicker(); } return; }
      if(e.target.id === 'tv-modal-cancel'){ closeModal(); return; }
      if(e.target.id === 'tv-modal-ok'){ commitModal(); return; }
    });
  }
  $('tv-modal-title').textContent = title;
  $('tv-modal-cur').textContent = '当前绑定：' + cur;
  refreshPicker();
  box.hidden = false;
}
function refreshPicker(){ $('tv-picker-body').innerHTML = pickerHtml(); paintAltErrors(''); }
function paintAltErrors(msg){ const el = $('tv-modal-err'); if(el) el.textContent = msg || ''; }
function closeModal(){ modal.open = false; const box = $('tv-modal'); if(box) box.hidden = true; }
function commitModal(){
  const d = byId(modal.id); if(!d) return;
  const cur = comboText();
  const alts = [...modal.alts];
  if(modal.parts.length && !alts.includes(cur)) alts.push(cur);
  const raws = modal.raws;
  const final = modal.mode === 'kb' ? [...alts, ...raws].join(' / ') : (alts[0] || cur || d.pad);
  if(modal.mode === 'kb'){
    if(!final.trim()){ paintAltErrors('请先点选按键，或保留原绑定'); return; }
    const errs = validateKb(final);
    if(errs.length){ paintAltErrors(errs.join('；')); return; }
    const probe = { ...d, [kbField()]: final };
    const hits = conflictsFor(probe, scheme.cur);
    if(hits.length && !confirm(`⚠ 键位重复\n${scheme.cur} 方案中「${final}」已被以下同场景功能使用：\n${hits.map(h => `· ${h.other.cat} · ${h.other.name}（${h.combo}）`).join('\n')}\n\n仍要设置吗？`)) return;
    d[kbField()] = final;
  }else{
    if(!final.trim()){ paintAltErrors('请先点选手柄按键'); return; }
    const errs = validatePad(final);
    if(errs.length){ paintAltErrors(errs.join('；')); return; }
    d.pad = final; d.ps = psOf(final);
  }
  closeModal();
  saveCache('页面修改'); render();
  status(`已修改「${d.name}」（尚未写入 Excel）`, 'warn');
}

/* ================= 导入 / 保存 / 恢复 ================= */
const HEAD = ['ID','分类','功能','手柄键位(Xbox)','手柄键位(PS)','键鼠·方案A','键鼠·方案B','触发方式','可改键','备注'];
function importFile(file){
  if(typeof XLSX === 'undefined'){ alert('未加载 SheetJS（需联网），暂时无法导入。'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
      const ws = wb.Sheets['旅人键位配置'] || wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
      const head = rows[0].map(h => String(h).trim()), at = name => head.indexOf(name);
      const missing = HEAD.filter((h, i) => i !== 4 && at(h) < 0);
      if(missing.length){ alert(`表头缺少列：${missing.join('、')}\n请使用《旅人键位配置.xlsx》的格式。`); return; }
      const out = [], errors = [], seen = new Set();
      rows.slice(1).forEach((r, i) => {
        const get = n => String(r[at(n)] ?? '').trim(), line = i + 2;
        const rec = { id:get('ID'), cat:get('分类'), name:get('功能'), pad:get('手柄键位(Xbox)'), kba:get('键鼠·方案A'), kbb:get('键鼠·方案B'), trig:get('触发方式') || '单击', edit:get('可改键') === '是', note:get('备注') };
        if(!rec.id && !rec.name) return;
        if(!rec.id || !rec.name){ errors.push(`第 ${line} 行：ID 或功能为空`); return; }
        if(seen.has(rec.id)) errors.push(`第 ${line} 行：ID「${rec.id}」重复`); seen.add(rec.id);
        validatePad(rec.pad).forEach(m => errors.push(`第 ${line} 行「${rec.name}」手柄：${m}`));
        validateKb(rec.kba).forEach(m => errors.push(`第 ${line} 行「${rec.name}」方案A：${m}`));
        validateKb(rec.kbb).forEach(m => errors.push(`第 ${line} 行「${rec.name}」方案B：${m}`));
        rec.ps = psOf(rec.pad);
        out.push(rec);
      });
      if(errors.length){ alert(`导入失败，请修正 Excel 后重新导入：\n\n${errors.slice(0, 30).join('\n')}${errors.length > 30 ? `\n… 共 ${errors.length} 处` : ''}`); return; }
      const dups = ['A','B'].flatMap(s => allConflicts(s, out).map(c => `· ${s} 方案：${c.a.name} ⇄ ${c.b.name}（${c.combo}）`));
      if(dups.length && !confirm(`⚠ 检测到 ${dups.length} 处键位重复：\n${dups.join('\n')}\n\n仍要导入吗？（冲突项会在列表中标红）`)) return;
      DATA = out; saveCache(`导入 ${file.name}`); clearSel(); render();
      status(`已导入 ${out.length} 项；下次打开页面自动加载本次导入`, 'ok');
    }catch(err){ alert('导入失败：' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}
function saveExcel(){
  if(typeof XLSX === 'undefined'){ alert('未加载 SheetJS（需联网），暂时无法导出。改动已保存在本机浏览器。'); return; }
  const aoa = [HEAD].concat(DATA.map(d => [d.id, d.cat, d.name, d.pad, psOf(d.pad), d.kba, d.kbb, d.trig, d.edit ? '是' : '否', d.note || '']));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [14,10,28,20,18,22,22,16,8,24].map(w => ({ wch:w }));
  ws['!autofilter'] = { ref:`A1:J${aoa.length}` };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '旅人键位配置');
  XLSX.writeFile(wb, '旅人键位配置.xlsx');
  status('已导出《旅人键位配置.xlsx》，覆盖保存到原目录即完成同步', 'ok');
}
function resetDefault(){
  if(!confirm('恢复为内置默认配置？本机缓存的修改与导入将被清除。')) return;
  try{ localStorage.removeItem(LS_KEY); }catch(e){}
  DATA = structuredClone(window.TRAVELER_DATA || []); sourceLabel = '内置默认配置';
  clearSel(); render(); status('已恢复默认配置', 'ok');
}

/* ================= 工具栏 ================= */
let statusText = '', statusKind = '';
function status(text, kind = ''){ statusText = text; statusKind = kind; paintStatus(); }
function paintStatus(){
  const el = $('tv-status'); if(!el) return;
  el.className = `tv-status ${statusKind}`;
  el.textContent = statusText || `数据来源：${sourceLabel}`;
}
function ensureToolbar(){
  if($('traveler-toolbar')) return;
  const box = document.createElement('div');
  box.id = 'traveler-toolbar'; box.className = 'tv-toolbar';
  box.innerHTML = `<label class="tv-scheme">键鼠方案<select id="tv-scheme-select"><option value="A">A · 还原怪猎习惯</option><option value="B">B · 匹配原神习惯</option></select></label>
    <label class="tv-scheme">手柄品牌<select id="tv-pad-brand"><option value="xbox">Xbox</option><option value="ps">PlayStation</option></select></label>
    <button class="subtle-button" id="tv-import" title="从《旅人键位配置.xlsx》导入">导入 Excel</button>
    <button class="subtle-button" id="tv-save" title="导出当前配置为 xlsx">保存到 Excel</button>
    <button class="subtle-button" id="tv-reset">恢复默认</button>
    <button class="subtle-button tv-conflict-btn" id="tv-conflicts" hidden></button>
    <span id="tv-status" class="tv-status"></span>
    <input type="file" id="tv-file" accept=".xlsx,.xls" hidden>`;
  document.querySelector('.controls-top').appendChild(box);
}
const HIDE_IN_TRAVELER = '.controls-bottom, .atlas-search, #tree-panel, #list-button, #review-button, .comparison-tools';
function showToolbar(on){
  document.querySelectorAll(HIDE_IN_TRAVELER).forEach(el => { el.style.display = on ? 'none' : ''; });
  ensureToolbar();
  $('traveler-toolbar').style.display = on ? 'flex' : 'none';
  $('tv-scheme-select').value = scheme.cur;
  $('tv-pad-brand').value = padBrand.cur;
}
function paintConflicts(){
  const list = allConflicts(scheme.cur);
  conflictIds = new Set(list.flatMap(c => [c.a.id, c.b.id]));
  const btn = $('tv-conflicts'); if(!btn) return;
  btn.hidden = isPad() || !list.length;
  btn.textContent = `⚠ ${scheme.cur} 方案键位冲突 ${list.length}`;
  btn.onclick = () => alert(`${scheme.cur} 方案中以下功能在同一场景使用了相同键位：\n\n${list.map(c => `· ${c.a.cat} · ${c.a.name} ⇄ ${c.b.cat} · ${c.b.name}（${c.combo}）`).join('\n')}`);
}

/* ================= 手柄图品牌适配 ================= */
const XB_FACE = {t:'Y', c:'B', x:'A', s:'X'};
const XB_SH = {l2:'LT', r2:'RT', l1:'LB', r1:'RB'};
function applyPadBrand(){
  const xb = padBrand.cur === 'xbox';
  Object.entries(XB_FACE).forEach(([tok, L]) => {
    const g = document.querySelector(`#pad-device .device-key[data-key="${tok}"]`); if(!g) return;
    let t = g.querySelector('text.xb-face'); const c = g.querySelector('circle.key-face'); if(!c) return;
    if(xb){
      if(!t){ t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('class', 'key-label xb-face'); t.setAttribute('text-anchor', 'middle'); g.appendChild(t); }
      t.setAttribute('x', c.getAttribute('cx')); t.setAttribute('y', +c.getAttribute('cy') + 5); t.textContent = L;
    } else if(t) t.remove();
  });
  Object.entries(XB_SH).forEach(([tok, L]) => {
    const g = document.querySelector(`#pad-device .device-key[data-key="${tok}"]`); if(!g) return;
    const t = g.querySelector('text.key-label'); if(t) t.textContent = xb ? L : tok.toUpperCase();
  });
  const cap = document.querySelector('.pad-caption');
  if(cap) cap.textContent = xb ? 'Xbox 布局示意（面键标注 Xbox 识别名）· 点击按键查看对应功能' : 'DualSense 无线控制器 · 点击按键查看对应功能';
}

/* ================= 主流程 ================= */
function render(){
  if(!isT()) return;
  paintConflicts();
  renderFunctions();
  renderComparison();
  applySelection();
  $('map-title').textContent = `旅人 · ${currentDomain().name}`;
  $('map-subtitle').textContent = isPad() ? `手柄（${padBrand.cur === 'xbox' ? 'Xbox' : 'PS'}）` : `键鼠 ${scheme.cur} 方案`;
  $('stage-version').textContent = 'TRAVELER';
  paintStatus();
}
function syncDeviceUI(){
  const d = A.state.device;
  document.querySelectorAll('.device-tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.device === d)));
  $('view-km').hidden = d !== 'km'; $('view-pad').hidden = d !== 'pad';
  $('stage-title').textContent = d === 'km' ? 'KEYBOARD + MOUSE' : `GAMEPAD · ${padBrand.cur === 'xbox' ? 'XBOX' : 'PS'}`;
}
function enter(){
  A.state.game = 'traveler'; $('game-select').value = 'traveler';
  sel.key = null; sel.action = null;
  showToolbar(true); syncDeviceUI(); applyPadBrand(); render();
}
function leave(){
  sel.key = null; sel.action = null; showToolbar(false);
  const eb = $('edit-selection'); if(eb) eb.hidden = true;
  $('stage-title').textContent = A.state.device === 'km' ? 'KEYBOARD + MOUSE' : 'DUALSENSE WIRELESS CONTROLLER';
  if(A.refresh) A.refresh();
}
function setDevice(d){ A.state.device = d; sel.key = null; sel.action = null; syncDeviceUI(); render(); }

function bind(){
  const mb = $('mapping-board');
  mb.addEventListener('click', e => {
    if(!isT()) return;
    const key = e.target.closest('.device-key'), row = e.target.closest('.tv-row');
    if(key) selectKey(key.dataset.key); else if(row) selectAction(row.dataset.action); else if(!e.target.closest('button')) clearSel();
  });
  mb.addEventListener('keydown', e => {
    if(!isT()) return;
    const key = e.target.closest('.device-key');
    if(key && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); selectKey(key.dataset.key); }
  });
  mb.addEventListener('pointerover', e => {
    if(!isT()) return;
    const row = e.target.closest('.tv-row'), key = e.target.closest('.device-key');
    if(row) markHover(new Set(currentKeys(byId(row.dataset.action))), new Set([row.dataset.action]));
    else if(key) markHover(new Set([key.dataset.key]), new Set(DATA.filter(d => currentKeys(d).includes(key.dataset.key)).map(d => d.id)));
  });
  mb.addEventListener('pointerout', e => {
    if(!isT()) return;
    const from = e.target.closest('.tv-row,.device-key'); if(from && from.contains(e.relatedTarget)) return;
    markHover(new Set(), new Set());
  });
  $('comparison-results').addEventListener('click', e => {
    if(!isT()) return;
    const cell = e.target.closest('[data-edit]'); if(cell){ openEdit(cell.dataset.edit, cell.dataset.mode); return; }
    const tr = e.target.closest('tr[data-record]'); if(tr) selectAction(tr.dataset.record, true);
  });
  $('reset-selection').addEventListener('click', () => { if(isT()) clearSel(); });
  $('edit-selection').addEventListener('click', () => {
    if(!isT()) return;
    if(sel.action){ openEdit(sel.action, isPad() ? 'pad' : 'kb'); return; }
    const rows = selectionRows();
    if(rows.length === 1) openEdit(rows[0].id, isPad() ? 'pad' : 'kb');
  });
  document.addEventListener('keydown', e => { if(isT() && !modal.open && e.key === 'Escape') clearSel(); });
  document.addEventListener('change', e => {
    if(e.target.id === 'tv-scheme-select'){ scheme.cur = e.target.value; sel.key = null; sel.action = null; render(); }
    if(e.target.id === 'tv-pad-brand'){ padBrand.cur = e.target.value; applyPadBrand(); render(); }
    if(e.target.id === 'tv-file'){ if(e.target.files[0]) importFile(e.target.files[0]); e.target.value = ''; }
  });
  document.addEventListener('click', e => {
    const id = e.target.closest('button')?.id;
    if(id === 'tv-import') $('tv-file').click();
    if(id === 'tv-save') saveExcel();
    if(id === 'tv-reset') resetDefault();
  });
  $('game-select').addEventListener('change', e => { if(e.target.value === 'traveler') enter(); else leave(); });
  document.querySelectorAll('.device-tabs button').forEach(b => b.addEventListener('click', () => { if(isT()) setDevice(b.dataset.device); }));
  document.querySelectorAll('[data-domain]').forEach(b => b.addEventListener('click', () => { if(isT()){ sel.key = null; sel.action = null; render(); } }));
}

bind();
window.MH_TRAVELER = { enter, render, drawLines, setDevice, importFile, saveExcel, data:() => DATA, conflicts:allConflicts };
enter();
})();
