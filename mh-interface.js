(() => {
'use strict';
const source = window.MH_SOURCE;
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const games = {wilds:'荒野',world:'世界 / 冰原'};
const systemGroups = {all:'全部系统',menu:'界面与菜单',items:'道具与快捷栏',map:'地图与导航',mount:'移动与坐骑',social:'联机与记录'};
const state = {game:'wilds',domain:'combat',weapon:'common',combat:'melee',system:'all',device:'km',query:'',selectedKey:null,selectedAction:null,scope:'selection',tableQuery:'',limit:40};
const SOURCES = {
  wilds:'https://gl.ali213.net/html/2025-2/1616997.html',
  world:'https://www.shacknews.com/article/106612/pc-keyboard-controls-and-key-bindings-monster-hunter-world',
  weapons:'https://www.3dmgame.com/gl/3745289.html',
  gunlance:'https://www.gamersky.com/handbook/202504/1910985_2.shtml'
};
const brandPaths = {
  ps:'M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z',
  xbox:'M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z'
};
function brand(kind){return `<svg class="platform-icon" viewBox="0 0 24 24" role="img" aria-label="${kind==='ps'?'PlayStation':'Xbox'}"><title>${kind==='ps'?'PlayStation':'Xbox'}</title><path d="${brandPaths[kind]}"/></svg>`;}
function mouseIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="6"/><path d="M6 10h12M12 2v5"/></svg>';}
function keyboardIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 13h2m2 0h2m2 0h2m2 0h2M7 16h10"/></svg>';}
const one = (key,hold=false) => ({steps:[[key]],hold});
const keyboardNames = {'空格':'Space','左键':'左键','右键':'右键','中键':'中键','侧键1':'侧键 1','侧键2':'侧键 2','滚轮上':'滚轮 ↑','滚轮下':'滚轮 ↓','PageUp':'PgUp','PageDown':'PgDn','后':'S','前':'W'};
const normalKey = key => ({ESC:'Esc',shift:'Shift',CTRL:'Ctrl',control:'Ctrl',alt:'Alt','Page Up':'PageUp','Page Down':'PageDown'}[key] || key);
const mouseKeys = new Set(['左键','右键','中键','侧键1','侧键2','滚轮上','滚轮下']);
const tokenKeys = {
  wilds:{melee:{t:'左键',c:'右键',r2:'R',r1:'Shift',l1:'Ctrl',x:'空格',s:'E',r3:'B'},ranged:{t:'R',c:'侧键1',r2:'左键',r1:'Shift',l1:'Ctrl',x:'空格',s:'E',r3:'B'}},
  world:{melee:{t:'左键',c:'右键',r2:'侧键2',r1:'Shift',l1:'Ctrl',x:'空格',s:'E',r3:'Q'},ranged:{t:'侧键1',c:'侧键2',r2:'左键',r1:'Shift',l1:'Ctrl',x:'空格',s:'E',r3:'Q'}}
};
function tokenAlternatives(token,game,cls){
  if(token==='tc') return [one(game==='wilds'||cls==='melee'?'侧键1':'C')];
  if(token==='l2') return game==='wilds'?[{...one('Alt'),toggle:true},one('侧键2',true)]:cls==='melee'?[one('C',true),{...one('中键'),toggle:true}]:[one('右键',true)];
  if(token==='ls') return ['W','A','S','D'].map(k=>one(k));
  if(token==='dp') return ['↑','↓'].map(k=>one(k));
  return [one(tokenKeys[game][cls][token]||token)];
}
function legacyPad(text){
  if(!text||text==='—') return {ps:[],xbox:[],note:'来源未提供手柄绑定'};
  if(/L1 \/ LB \+ 方向键/.test(text)) return {ps:[],xbox:[],note:'快捷盘需结合方向键选择；具体方向待核对'};
  const symbols={'△':'t','○':'c','✕':'x','□':'s','R2':'r2','R1':'r1','L2':'l2','L1':'l1','R3':'r3','左摇杆':'ls','右摇杆':'rs','选项键':'options','触摸板':'touch'};
  const match=text.match(/^(△\+○|△|○|✕|□|R2|R1|L2|L1|R3|左摇杆|右摇杆|方向键|选项键|触摸板)/);
  if(!match) return {ps:[],xbox:[],note:`原记录：${text}`};
  const head=match[1],direction=(text.match(/[↑↓←→]/)||[])[0];
  const dirMap={'↑':'up','↓':'down','←':'left','→':'right'};
  let alternatives;
  if(head==='△+○') alternatives=[{steps:[['t','c']]}];
  else if(head==='方向键') alternatives=[one(direction?`d_${dirMap[direction]}`:'dp')];
  else if(head==='左摇杆'&&direction) alternatives=[one(`ls_${dirMap[direction]}`),one(`d_${dirMap[direction]}`)];
  else alternatives=[one(symbols[head],/长按/.test(text))];
  return {ps:structuredClone(alternatives),xbox:structuredClone(alternatives),note:''};
}
function keyboardFromLegacy(row){
  if(row.k==='鼠标滚轮') return {alternatives:[],note:'原记录未区分滚动与按压，待核对'};
  const keys=[...new Set((row.kb||[]).map(normalKey))];
  const alternatives=keys.map(key=>one(key,/长按/.test(row.k)||/（长按）/.test(row.a)));
  if(row.a==='移动') alternatives.forEach(a=>a.direction=true);
  if(/（近战）/.test(row.k)&&keys.length===2){alternatives[0].label='近战';alternatives[1].label='远程';}
  return {alternatives,note:row.s?`备用输入：${row.s}`:''};
}
const canonicalPairs = [
  ['选择菜单项目 / 变更数值：上','菜单选择 / 数值增加'],['选择菜单项目 / 增加数值','菜单选择 / 数值增加'],
  ['选择菜单项目 / 变更数值：下','菜单选择 / 数值减少'],['选择菜单项目 / 减少数值','菜单选择 / 数值减少'],
  ['选择菜单项目：左','菜单选择：左'],['选择菜单项目（左）','菜单选择：左'],['选择菜单项目：右','菜单选择：右'],['选择菜单项目（右）','菜单选择：右'],
  ['返回（取消）','返回 / 取消'],['切换页面 / 页签：左','切换页面：左'],['切换页面（左）','切换页面：左'],['切换页面 / 页签：右','切换页面：右'],['切换页面（右）','切换页面：右'],
  ['切换状态 / 类别：左','切换类别：左'],['切换分页 / 状态（左）','切换类别：左'],['切换状态 / 类别：右','切换类别：右'],['切换分页 / 状态（右）','切换类别：右'],
  ['旋转模型 / 切换页面：左','旋转模型：左'],['向左旋转模型','旋转模型：左'],['旋转模型 / 切换页面：右','旋转模型：右'],['向右旋转模型','旋转模型：右'],
  ['放大模型','模型放大'],['放大','模型放大'],['缩小模型','模型缩小'],['缩小','模型缩小'],
  ['冲刺（按一次）/ 纳刀','冲刺 / 收刀（切换）'],['冲刺（按一次）/ 收刀','冲刺 / 收刀（切换）'],['冲刺（长按）/ 纳刀','冲刺 / 收刀（长按）'],['冲刺（长按）/ 收刀','冲刺 / 收刀（长按）'],
  ['下蹲 / 回避','下蹲 / 回避'],['蹲下 / 闪避','下蹲 / 回避'],['调查 / 对话 / 采集 / 剥取','互动 / 对话 / 采集 / 剥取'],
  ['使用道具 / 纳刀','使用道具 / 收刀'],['拔刀 / 普通攻击','普通攻击'],['特殊攻击（拔刀后）','特殊攻击'],['特殊攻击（拔刀时）/ 发射钩爪','特殊攻击'],
  ['防御 / 武器特殊动作 / 发射钩爪','防御 / 武器特殊动作'],['同时按下动作（△+○）','同时按下动作'],['拔刀 / 普通射击','拔刀 / 射击'],
  ['装填弹药 / 装填或解除瓶','装填 / 上瓶 · 卸瓶'],['显示武器或投射器准星（长按）','武器 / 投射器瞄准（长按）'],['显示武器或投射器准星（按一次）','武器 / 投射器瞄准（按一次）'],
  ['聚焦镜头 / 选择目标 / 切换投射器瞄准','锁定 / 切换至目标视角'],['聚焦镜头 / 选择目标','锁定 / 切换至目标视角'],
  ['道具选择模式（长按）/ 重置视角','道具选择 / 重置视角'],['显示道具（长按）/ 重置镜头','道具选择 / 重置视角'],
  ['切换至下一个快捷盘','切换快捷盘'],['切换轮盘','切换快捷盘'],['聊天发言','聊天窗口'],['显示聊天窗口','聊天窗口'],['生态地图','打开地图']
];
const canonicalNames=new Map(canonicalPairs);
function canonical(action){
  if(/^调用快捷盘 \d+$/.test(action)) return action.replace('调用快捷盘','快捷盘');
  if(/^快捷轮盘 \d+$/.test(action)) return action.replace('快捷轮盘','快捷盘');
  return canonicalNames.get(action)||action.replace('切换道具 左','切换道具：左').replace('切换道具 右','切换道具：右').replace('切换弹药 / 瓶 上','选择弹药 / 瓶：上').replace('切换弹药 / 瓶 下','选择弹药 / 瓶：下');
}
function classify(grp,row){
  const a=row.a;
  if(/骑乘怪物/.test(grp.name)) return {domain:'combat',category:'mounted',section:'骑乘怪物',context:'骑乘怪物'};
  if(/鹭鹰龙/.test(grp.name)) return {domain:'system',category:'mount',section:'鹭鹰龙',context:'骑乘鹭鹰龙'};
  if(grp.cat==='menu') return {domain:'system',category:'menu',section:/道具箱/.test(grp.name)?'道具箱':/装备/.test(grp.name)?'更换装备':'菜单导航',context:/道具箱/.test(grp.name)?'道具箱':/装备/.test(grp.name)?'装备菜单':'菜单'};
  if(/即按即说|聊天|贴图|肢体|姿势|成员|资料|使命|救难|调查组|拍照|望远镜/.test(a)&&!a.startsWith('打开地图')) return {domain:'system',category:'social',section:/拍照|望远镜|调查组/.test(a)?'观察与记录':'联机与交流',context:/拍照|望远镜/.test(a)?'拍照 / 望远镜':'系统'};
  if(/地图|导虫/.test(a)||grp.cat==='map') return {domain:'system',category:'map',section:/导虫/.test(a)?'导虫导航':'地图',context:grp.cat==='map'?'地图界面':'探索'};
  if(/打开开始|目标 NPC|暂停|选项/.test(a)) return {domain:'system',category:'menu',section:'界面入口',context:'界面'};
  if(grp.cat==='item'||/道具选择|显示道具|切换道具|选择弹药|切换弹药|切换瓶|穿脱衣装|查看道具袋/.test(a)) return {domain:'system',category:'items',section:/快捷|栏位|轮盘/.test(a)?'快捷盘与栏位':'道具与弹药',context:/远程/.test(grp.name)?'远程':/近战/.test(grp.name)?'近战':'通用'};
  if(/移动$|冲刺|蹲下|下蹲|互动|调查 \/ 对话|使用道具|锁定|聚焦|镜头[上下左右]移/.test(a)) return {domain:'combat',category:'base',section:/镜头|锁定|聚焦/.test(a)?'视角与目标':'移动与交互',context:'通用'};
  const category=/钩爪（/.test(grp.name)?'claw':/远程/.test(grp.name)?'ranged':'melee';
  return {domain:'combat',category,section:category==='claw'?'飞翔爪':/集中|瞄准|投射器|钩锁/.test(a)?'瞄准与投射器':'攻击与特殊动作',context:category==='ranged'?'远程':category==='claw'?'飞翔爪':'近战'};
}
const records=[];
const recordMap=new Map();
function addRecord(descriptor,game,version){
  const identity=descriptor.identity||[descriptor.domain,descriptor.category,descriptor.context,descriptor.weapon||'',descriptor.action].join('|');
  let rec=recordMap.get(identity);
  if(!rec){rec={...descriptor,id:`action-${records.length}`,versions:{}};records.push(rec);recordMap.set(identity,rec);}
  if(!rec.versions[game]) rec.versions[game]=version;
  else {
    const existing=rec.versions[game];
    const unique=new Set(existing.keyboard.alternatives.map(a=>JSON.stringify(a)));
    version.keyboard.alternatives.forEach(a=>{if(!unique.has(JSON.stringify(a)))existing.keyboard.alternatives.push(a);});
    existing.uncertain ||= version.uncertain;
  }
  return rec;
}
for(const game of Object.keys(games)){
  source.general[game].forEach(grp=>grp.rows.forEach(original=>{
    const r={...original};
    if(game==='world'&&r.a==='随从 / 调查组指令') r.a='观察用具（Surveyor Set）';
    if(game==='wilds'&&r.a==='发出救难信号') r.n='游戏内键鼠设置未为该动作分配默认键位；需在联机菜单中操作。';
    if(game==='wilds'&&/未分配/.test(r.k)) r.n=(r.n||'')+' 游戏内键鼠设置该项主要键与次要键均为空。';
    if(/钩爪上身后：钩爪攻击/.test(r.a)) r.a='飞翔爪附着：武器攻击（软化）';
    const location=classify(grp,r);
    if(/观察用具/.test(r.a)) Object.assign(location,{domain:'system',category:'social',section:'观察与记录',context:'观察用具'});
    const keyboard=keyboardFromLegacy(r);
    const pad=legacyPad(r.g);
    if(game==='world'&&canonical(r.a)==='锁定 / 切换至目标视角') {pad.ps=[one('r3')];pad.xbox=[one('r3')];r.u=1;}
    if(canonical(r.a)==='道具选择 / 重置视角'){pad.ps=[one('l1',true)];pad.xbox=[one('l1',true)];}
    if(game==='wilds'&&r.a==='减速（按 1 次）/ 急停（长按）') {pad.ps=[];pad.xbox=[];pad.note='旧资料 L2 与瞄准复用情况未核实';r.u=1;}
    addRecord({...location,action:canonical(r.a),original:r.a},game,{keyboard,pad,note:r.n||'',uncertain:!!r.u||keyboard.alternatives.length===0,source:SOURCES[game],sourceName:game==='wilds'?'荒野按键资料':'冰原 Type 1 资料'});
  }));
}
const fixes = {
  gs:{'○ / B — 蓄力系起手（长按蓄力）':{action:'蓄力斩',input:'t',hold:true},'蓄力斩（长按蓄力，松开释放）':{action:'蓄力斩',input:'t',hold:true},'纵斩 → 横斩（连段）':{input:'t+c',sequence:true},'肩撞（蓄力中派生，可衔接）':{action:'肩撞',input:'c',hold:false,condition:'蓄力中'}},
  sns:{'□ / X — 持刀使用道具（无需收刀）':{action:'持刀使用道具',input:'r2+s',hold:false},'持刀使用道具（片手剑独有优势）':{action:'持刀使用道具',input:'r2+s',hold:false}},
  hm:{'△ / Y — 纵挥 / 五连敲':{action:'纵挥',input:'t'},'○ / B — 纵挥三连击':{action:'敲打',input:'c'},'纵挥三连击':{input:'t+t+t',sequence:true},'五连敲':{input:'c+c+c+c+c',sequence:true},'本垒打（连招收尾高威力）':{input:'t',condition:'纵挥连段末尾'}},
  ln:{'△ / Y — 上段突刺':{action:'中段突刺',input:'t'},'○ / B — 中段突刺':{action:'上段突刺',input:'c'}},
  bw:{'龙之箭（龙之矢，瞄准中 R2 + ○）':{action:'龙之矢',input:'t+c'}},
  gl:{'龙击炮（△+○ 长按 / 全套派生）':{action:'龙击炮',input:'r2+t+c'}},
  ls:{'特殊纳刀 → 居合拔刀斩':{action:'特殊纳刀',input:'r2+x',condition:'攻击后；再按普通攻击键衍生居合拔刀斩'}}
};
function weaponInput(tokens,game,cls,sequence,hold){
  let alternatives=[{steps:[],hold:!!hold}];
  for(const token of tokens){
    const choices=tokenAlternatives(token,game,cls);
    alternatives=alternatives.flatMap(previous=>choices.map(choice=>{
      const steps=previous.steps.map(step=>[...step]);
      if(sequence||previous.toggle||!steps.length)steps.push([...choice.steps[0]]);
      else steps[steps.length-1].push(...choice.steps[0]);
      return {steps,hold:previous.hold||choice.hold,toggle:!!choice.toggle};
    }));
  }
  return {alternatives,note:''};
}
function weaponPad(tokens,sequence,hold){
  const expand=token=>token==='tc'?['t','c']:[token];
  const steps=sequence?tokens.map(expand):[tokens.flatMap(expand)];
  return {ps:[{steps,hold:!!hold}],xbox:[{steps,hold:!!hold}],note:''};
}
for(const weapon of source.weapons){
  weapon.groups.filter(g=>g.title!=='键鼠要点').forEach(group=>group.rows.forEach(row=>{
    const fix=fixes[weapon.id]?.[row.a]||{};
    const action=fix.action||row.a.replace(/^[^—]+ — /,'').replace(/（[^）]*）/g,'').trim();
    let input=fix.input||row.in;
    if(input==='r1'&&row.only==='wilds') input='l2+r1';
    const tokens=input.split('+');
    const sequence=fix.sequence ?? (tokens.length>1&&(tokens.every(t=>t===tokens[0])||(tokens.every(t=>['t','c'].includes(t))&&/→/.test(row.a))));
    const hold=fix.hold ?? !!row.hold;
    const condition=fix.condition||((row.a.match(/（([^）]*)）/)||[])[1]||'');
    const descriptor={domain:'combat',category:'weapon',weapon:weapon.id,action,original:row.a,context:weapon.name,section:group.title==='按键语义'?'基础动作':'核心招式',condition,identity:`weapon|${weapon.id}|${action}|${input}|${sequence}|${hold}`};
    for(const game of Object.keys(games)){
      if(row.only&&row.only!==game) continue;
      const version={keyboard:weaponInput(tokens,game,weapon.cls,sequence,hold),pad:weaponPad(tokens,sequence,hold),note:[condition,row.n,'由既有武器资料与对应版本键位映射整理，招式条件仍需游戏内核对。'].filter(Boolean).join('；'),uncertain:true,inferred:true,source:weapon.id==='gl'?SOURCES.gunlance:SOURCES.weapons,sourceName:'武器资料 / 映射推导'};
      if(weapon.id==='ig'&&game==='wilds'&&/猎虫|螺旋|急袭/.test(action)) version.note+=' 荒野与世界的猎虫操作可能不同，不视作已验证输入。';
      addRecord(descriptor,game,version);
    }
  }));
}
const byId=new Map(records.map(r=>[r.id,r]));
function keySet(version){return new Set((version?.keyboard.alternatives||[]).flatMap(a=>a.steps.flat()));}
function inputSearch(version){
  if(!version)return '';
  const aliases={t:'△ Y',c:'○ B',x:'✕ A',s:'□ X',r1:'R1 RB',r2:'R2 RT',l1:'L1 LB',l2:'L2 LT',r3:'R3 RS 右摇杆按下',ls:'左摇杆 LS',rs:'右摇杆 RS',options:'Options Menu',touch:'触摸板 View','侧键1':'鼠标侧键1 MB4 Mouse4','侧键2':'鼠标侧键2 MB5 Mouse5','左键':'鼠标左键 LMB','右键':'鼠标右键 RMB','中键':'鼠标中键 MMB','空格':'Space 空格'};
  const keys=[...keySet(version),...version.pad.ps.flatMap(a=>a.steps.flat()),...version.pad.xbox.flatMap(a=>a.steps.flat())];
  return keys.map(k=>`${k} ${aliases[k]||keyboardNames[k]||''}`).join(' ')+' '+version.note;
}
function matches(record,q){return !q||[record.action,record.original,record.context,record.section,...Object.values(record.versions).map(inputSearch)].join(' ').toLowerCase().includes(q.trim().toLowerCase());}
function inContext(record,game=state.game){
  if(!record.versions[game]||record.domain!==state.domain) return false;
  if(state.domain==='system') return state.system==='all'||record.category===state.system;
  if(state.weapon!=='common') return record.weapon===state.weapon||record.category==='base';
  if(state.combat==='mounted') return record.category==='mounted';
  return record.category==='base'||record.category===state.combat||record.category==='claw';
}
function visibleRecords(){return records.filter(r=>inContext(r)&&matches(r,state.query));}
function highlight(text,q=state.query){
  const value=String(text||''); const at=value.toLowerCase().indexOf(q.toLowerCase().trim());
  if(!q.trim()||at<0) return escape(value);
  return escape(value.slice(0,at))+'<mark>'+escape(value.slice(at,at+q.trim().length))+'</mark>'+escape(value.slice(at+q.trim().length));
}
function keyBadge(key){return `<kbd class="input-key">${mouseKeys.has(key)?mouseIcon():''}${escape(keyboardNames[key]||key)}</kbd>`;}
function padBadge(token,kind){
  const labels={t:['△','Y'],c:['○','B'],x:['✕','A'],s:['□','X'],r2:['R2','RT'],r1:['R1','RB'],l2:['L2','LT'],l1:['L1','LB'],r3:['R3','RS'],ls:['左摇杆','左摇杆'],rs:['右摇杆','右摇杆'],options:['Options','Menu'],touch:['触摸板','View'],dp:['方向键','方向键']};
  const side=kind==='ps'?0:1;let face;
  if(kind==='ps'&&['t','c','x','s'].includes(token)){
    const shapes={t:'<path d="m12 3 9 17H3Z"/>',c:'<circle cx="12" cy="12" r="9"/>',x:'<path d="m4 4 16 16M20 4 4 20"/>',s:'<rect x="4" y="4" width="16" height="16"/>'};
    face=`<svg class="pad-symbol" viewBox="0 0 24 24" aria-label="${labels[token][0]}">${shapes[token]}</svg>`;
  }else if(token.startsWith('d_')||token.startsWith('ls_')){
    const arrow={up:'↑',down:'↓',left:'←',right:'→'}[token.split('_')[1]];
    face=`${token.startsWith('ls')?'摇杆':'十字键'} ${arrow}`;
  }else face=escape(labels[token]?.[side]||token);
  const title=`${kind==='ps'?'PlayStation':'Xbox'} ${labels[token]?.[side]||token}`;
  return `<span class="pad-key ${kind} ${/[rl][12]/.test(token)?'shoulder':''}" title="${title}">${brand(kind)}<span class="button-face face-${token}">${face}</span></span>`;
}
function renderInput(alternatives,kind='keyboard'){
  if(!alternatives?.length) return '<span class="missing-value">待核对</span>';
  const separator=alternatives.every(alt=>alt.direction)?' / ':'或';
  return `<span class="input-set">${alternatives.map(alt=>{
    const chord=alt.steps.some(step=>step.length>1),sequence=alt.steps.length>1;
    const steps=alt.steps.map(step=>step.map(key=>kind==='keyboard'?keyBadge(key):padBadge(key,kind)).join('<span class="input-join">+</span>')).join('<span class="input-join">→</span>');
    return `<span class="input-alternative ${chord?'chord':''} ${sequence?'sequence':''}">${alt.label?`<span class="input-or">${escape(alt.label)}</span>`:''}${steps}${alt.hold?'<span class="input-hold">长按</span>':''}</span>`;
  }).join(`<span class="input-or">${separator}</span>`)}</span>`;
}
const keyGeometry=[];
function geometry(){
  const row=(items,y)=>{let x=15;items.forEach(item=>{const [id,width=1,label=id]=Array.isArray(item)?item:[item];keyGeometry.push({id,x,y,w:width*38-3,h:32,label});x+=width*38;});};
  row([['Esc',1],['gap',.4],...['F1','F2','F3','F4'],['gap',.3],...['F5','F6','F7','F8'],['gap',.3],...['F9','F10','F11','F12']],15);
  row(['`','1','2','3','4','5','6','7','8','9','0','-','=', ['Backspace',2,'Back']],61);
  row([['Tab',1.5],...'QWERTYUIOP','[',']',['\\',1.5]],99);
  row([['CapsLock',1.75,'Caps'],...'ASDFGHJKL',';',"'",['Enter',2.25]],137);
  row([['Shift',2.25],...'ZXCVBNM',',','.','/',['ShiftRight',2.75,'Shift']],175);
  row([['Ctrl',1.25],['Win',1.25],['Alt',1.25],['空格',6.25,'Space'],['AltRight',1.25,'Alt'],['WinRight',1.25,'Win'],['Menu',1.25],['CtrlRight',1.25,'Ctrl']],213);
  [['Print','Scroll','Pause'],['Insert','Home','PageUp'],['Delete','End','PageDown']].forEach((keys,r)=>keys.forEach((id,c)=>keyGeometry.push({id,x:602+c*38,y:r===0?15:r===1?61:99,w:35,h:32,label:{Print:'PrtSc',Scroll:'ScrLk',Pause:'Pause',PageUp:'PgUp',PageDown:'PgDn'}[id]||id})));
  [['↑',640,175],['←',602,213],['↓',640,213],['→',678,213]].forEach(([id,x,y])=>keyGeometry.push({id,x,y,w:35,h:32,label:id}));
}
geometry();
const keyAlias={ShiftRight:'Shift',AltRight:'Alt',CtrlRight:'Ctrl',WinRight:'Win'};
const physicalSide=new Map(keyGeometry.filter(k=>k.id!=='gap').map(k=>[keyAlias[k.id]||k.id,k.x<300?'left':'right']));
['Shift','Ctrl','Alt','W','A','S','D'].forEach(k=>physicalSide.set(k,'left'));
physicalSide.set('空格','neutral');mouseKeys.forEach(k=>physicalSide.set(k,'right'));
function keyMarkup(k,tag='rect'){
  const id=keyAlias[k.id]||k.id;
  const shape=tag==='path'?`<path class="key-face" d="${k.path}"/>`:`<rect class="key-face" x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="4"/>`;
  return `<g class="device-key ${mouseKeys.has(id)?'mouse-key':''}" data-key="${escape(id)}" data-physical="${escape(k.id)}" role="button" tabindex="0" aria-label="${escape(mouseKeys.has(id)?'鼠标':'按键')} ${escape(keyboardNames[id]||id)}" aria-pressed="false"><title>${escape(keyboardNames[id]||id)} · 点击查看绑定</title>${shape}<text class="key-label" x="${k.x+k.w/2}" y="${k.y+k.h/2+4}" text-anchor="middle"${k.label?.length>4?' style="font-size:10px"':''}>${escape(k.label)}</text></g>`;
}
function renderDevices(){
  $('keyboard-device').innerHTML=`<svg viewBox="0 0 728 264" width="728" height="264" aria-label="87 键键盘映射"><rect class="kb-case" x="2" y="2" width="724" height="260" rx="12"/><path d="M17 254h690" stroke="#0b0d10" stroke-width="3"/>${keyGeometry.filter(k=>k.id!=='gap').map(k=>keyMarkup(k)).join('')}</svg>`;
  const mouse=[{id:'左键',label:'L',x:35,y:17,w:45,h:61},{id:'右键',label:'R',x:96,y:17,w:45,h:61},{id:'滚轮上',label:'↑',x:78,y:17,w:20,h:24},{id:'中键',label:'●',x:78,y:44,w:20,h:24},{id:'滚轮下',label:'↓',x:78,y:71,w:20,h:24},{id:'侧键1',label:'4',x:12,y:90,w:24,h:33},{id:'侧键2',label:'5',x:12,y:128,w:24,h:33}];
  $('mouse-device').innerHTML=`<svg viewBox="0 0 178 232" width="178" height="232" aria-label="鼠标七个可点击输入"><path class="mouse-body" d="M89 4C35 4 24 31 24 91v65c0 52 31 69 65 69s65-17 65-69V91C154 31 144 4 89 4Z"/><path class="mouse-decoration" d="M46 177c12 30 74 30 86 0M75 198h28"/>${mouse.map(k=>keyMarkup(k)).join('')}</svg>`;
  renderPad();
}
const padNodes=[
  {id:'l2',label:'L2',type:'rect',x:78,y:16,w:118,h:26,rx:10},
  {id:'r2',label:'R2',type:'rect',x:364,y:16,w:118,h:26,rx:10},
  {id:'l1',label:'L1',type:'rect',x:92,y:50,w:104,h:24,rx:9},
  {id:'r1',label:'R1',type:'rect',x:364,y:50,w:104,h:24,rx:9},
  {id:'touch',label:'',type:'rect',x:222,y:88,w:116,h:66,rx:11},
  {id:'create',label:'',type:'rect',x:196,y:96,w:14,h:20,rx:6},
  {id:'options',label:'',type:'rect',x:350,y:96,w:14,h:20,rx:6},
  {id:'d_up',label:'▲',type:'rect',x:150,y:158,w:30,h:30,rx:7},
  {id:'d_down',label:'▼',type:'rect',x:150,y:226,w:30,h:30,rx:7},
  {id:'d_left',label:'◀',type:'rect',x:116,y:192,w:30,h:30,rx:7},
  {id:'d_right',label:'▶',type:'rect',x:184,y:192,w:30,h:30,rx:7},
  {id:'t',label:'△',type:'circle',cx:395,cy:162,r:19},
  {id:'c',label:'○',type:'circle',cx:431,cy:198,r:19},
  {id:'x',label:'✕',type:'circle',cx:395,cy:234,r:19},
  {id:'s',label:'□',type:'circle',cx:359,cy:198,r:19},
  {id:'l3',label:'L3',type:'stick',cx:196,cy:268,r:30},
  {id:'r3',label:'R3',type:'stick',cx:364,cy:268,r:30},
  {id:'ps',label:'PS',type:'rect',x:266,y:300,w:28,h:15,rx:7}
];
function padNodeBounds(node){
  if(node.type==='circle')return {x:node.cx-node.r,y:node.cy-node.r,w:node.r*2,h:node.r*2};
  if(node.type==='stick')return {x:node.cx-node.r,y:node.cy-node.r,w:node.r*2,h:node.r*2};
  return {x:node.x,y:node.y,w:node.w,h:node.h};
}
function renderPad(){
  const glyph={
    t:'<circle cx="12" cy="12" r="8.5"/><path d="m12 7 5.5 9h-11Z"/>',
    c:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>',
    x:'<circle cx="12" cy="12" r="8.5"/><path d="m8 8 8 8M16 8l-8 8"/>',
    s:'<circle cx="12" cy="12" r="8.5"/><rect x="8" y="8" width="8" height="8"/>'
  };
  const body=`<path class="pad-shell" d="M150 84C190 62 230 54 280 54s90 8 130 30c30 16 62 46 88 96 26 50 50 100 50 132 0 38-30 54-64 41-28-10-56-48-82-54-34-8-66-11-122-11s-88 3-122 11c-26 6-54 44-82 54-34 13-64-3-64-41 0-32 24-82 50-132 26-50 58-80 88-96Z"/>`;
  const nodes=padNodes.map(node=>{
    const b=padNodeBounds(node);
    let markup=`<g class="device-key pad-node ${mouseKeys.has(node.id)?'':''}" data-key="${node.id}" role="button" tabindex="0" aria-pressed="false"><title>DualSense ${node.label||node.id} · 点击查看绑定</title>`;
    if(node.type==='stick'){
      markup+=`<circle class="key-face" cx="${node.cx}" cy="${node.cy}" r="${node.r}"/><circle class="stick-ring" cx="${node.cx}" cy="${node.cy}" r="${node.r-9}"/><text class="key-label" x="${node.cx}" y="${node.cy+4}" text-anchor="middle">${node.label}</text>`;
    }else if(['t','c','x','s'].includes(node.id)){
      markup+=`<circle class="key-face" cx="${node.cx}" cy="${node.cy}" r="${node.r}"/><svg class="pad-symbol glyph-ps-${node.id}" x="${node.cx-11}" y="${node.cy-11}" width="22" height="22" viewBox="0 0 24 24">${glyph[node.id]}</svg>`;
    }else{
      markup+=`<rect class="key-face" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${node.rx||8}"/>`;
      if(node.label)markup+=`<text class="key-label" x="${b.x+b.w/2}" y="${b.y+b.h/2+4}" text-anchor="middle">${node.label}</text>`;
    }
    return markup+`</g>`;
  }).join('');
  $('pad-device').innerHTML=`<svg viewBox="0 0 560 380" width="560" height="380" aria-label="DualSense 手柄按键映射">${body}<rect class="pad-shell-inner" x="232" y="96" width="96" height="50" rx="8"/><rect class="pad-deco" x="272" y="322" width="16" height="10" rx="4"/>${nodes}</svg>`;
}
const padAliases={dp:['d_up','d_down','d_left','d_right'],ls:['l3'],rs:['r3'],options:['options'],touch:['touch']};
function padNodeIds(token){
  if(padAliases[token])return padAliases[token];
  const t=String(token||'');
  if(t==='ls'||t.startsWith('ls_'))return ['l3'];
  if(t==='rs'||t.startsWith('rs_'))return ['r3'];
  if(t==='dp')return ['d_up','d_down','d_left','d_right'];
  return padNodes.some(n=>n.id===t)?[t]:[];
}
function padNodeSet(record,game){
  const version=record.versions[game];
  const tokens=new Set([...(version?.pad.ps||[]),...(version?.pad.xbox||[])].flatMap(alt=>alt.steps.flat()));
  const ids=new Set();tokens.forEach(t=>padNodeIds(t).forEach(id=>{if(id)ids.add(id);}));
  return ids;
}
let current=[];
function splitGroups(rows){
  const groups=new Map();
  rows.forEach(r=>{
    const keys=[...keySet(r.versions[state.game])];
    const left=keys.filter(k=>physicalSide.get(k)==='left').length;
    const right=keys.filter(k=>physicalSide.get(k)==='right').length;
    const bias=left===right?'neutral':left>right?'left':'right';
    const groupKey=r.section+'|'+bias;
    if(!groups.has(groupKey))groups.set(groupKey,{title:r.section,bias,rows:[]});
    groups.get(groupKey).rows.push(r);
  });
  const sides={left:[],right:[]},length={left:0,right:0};
  const list=[...groups.values()].sort((a,b)=>(a.bias==='neutral')-(b.bias==='neutral'));
  list.forEach(g=>{const side=g.bias==='neutral'?(length.left<=length.right?'left':'right'):g.bias;sides[side].push(g);length[side]+=g.rows.length;});
  for(let pass=0;pass<list.length;pass++){
    const difference=Math.abs(length.left-length.right);
    if(difference<=6)break;
    const from=length.left>length.right?'left':'right',to=from==='left'?'right':'left';
    const candidates=sides[from].filter(g=>Math.abs(difference-2*g.rows.length)<difference);
    candidates.sort((a,b)=>(a.bias==='neutral'?0:10)-(b.bias==='neutral'?0:10)||Math.abs(difference-2*a.rows.length)-Math.abs(difference-2*b.rows.length));
    const group=candidates[0];if(!group)break;
    sides[from]=sides[from].filter(g=>g!==group);sides[to].push(group);
    length[from]-=group.rows.length;length[to]+=group.rows.length;
  }
  return sides;
}
function rowBinding(record){
  const version=record.versions[state.game];
  if(state.device==='pad'){
    const sets=[];
    if(version.pad.ps.length)sets.push(`<span class="pad-set">${renderInput(version.pad.ps,'ps')}</span>`);
    if(version.pad.xbox.length)sets.push(`<span class="pad-set">${renderInput(version.pad.xbox,'xbox')}</span>`);
    return sets.length?`<span class="pad-pair">${sets.join('')}</span>`:'<span class="missing-value">待核对</span>';
  }
  return renderInput(version.keyboard.alternatives);
}
function renderFunctions(){
  current=visibleRecords();
  const sides=splitGroups(current);
  ['left','right'].forEach(side=>{
    $(side+'-functions').innerHTML=sides[side].map(group=>`<section class="function-section"><h3>${escape(group.title)}<span>${String(group.rows.length).padStart(2,'0')}</span></h3>${group.rows.map(r=>{
      const v=r.versions[state.game];
      return `<button class="function-row" data-action="${r.id}" aria-pressed="false"><span class="row-label"><span class="action-name">${highlight(r.action)}${v.uncertain?'<span class="review-dot" title="含待核对输入，详见下方"></span>':''}</span>${r.condition?`<span class="row-context">${escape(r.condition)}</span>`:''}</span><span class="row-binding">${rowBinding(r)}</span></button>`;
    }).join('')}</section>`).join('')||'<p class="column-empty">此侧暂无匹配功能</p>';
  });
  const keys=state.device==='pad'?new Set(current.flatMap(r=>[...padNodeSet(r,state.game)])):new Set(current.flatMap(r=>[...keySet(r.versions[state.game])]));
  $('binding-count').textContent=`${current.length} 项功能 · ${keys.size} 个输入`;
  document.querySelectorAll('.device-key').forEach(el=>el.classList.toggle('bound',keys.has(el.dataset.key)));
}
function contextTitle(){return state.domain==='system'?systemGroups[state.system]:state.weapon==='common'?(state.combat==='mounted'?'骑乘怪物':'通用动作'):source.weapons.find(w=>w.id===state.weapon).name;}
function renderContext(){
  const system=state.domain==='system';
  document.querySelectorAll('[data-domain]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.domain===state.domain)));
  if(system){
    $('context-controls').innerHTML=Object.entries(systemGroups).map(([id,name])=>`<button class="context-chip" data-system="${id}" aria-pressed="${state.system===id}">${name}</button>`).join('');
    $('context-description').textContent='系统功能按使用场景分组，不与武器招式混排。';
  }else{
    const modes = [['melee','近战基础'],['ranged','远程基础'],['mounted','骑乘怪物']].map(([id,name])=>`<button class="context-chip" data-combat="${id}" aria-pressed="${state.combat===id}">${name}</button>`).join('');
    const weapons = source.weapons.map(w=>`<button class="context-chip weapon-chip" data-weapon="${w.id}" aria-pressed="${state.weapon===w.id}">${w.name}</button>`).join('');
    const scene = state.weapon==='common' ? `<span class="context-separator"></span>${modes}` : '<span class="context-caption">通用移动 + 当前武器招式</span>';
    $('context-controls').innerHTML=`<button class="context-chip" id="common-button" aria-pressed="${state.weapon==='common'}">通用动作</button><span class="context-separator"></span><span class="context-caption">14 武器</span>${weapons}${scene}`;
    $('context-description').textContent=state.weapon==='common'?'先选择操作场景，再点击按键查看映射。':'招式资料含映射推导，具体派生以游戏内出招表为准。';
  }
  $('map-title').textContent=contextTitle();
  $('map-subtitle').textContent=games[state.game]+' / '+(system?'系统':'战斗');
  $('stage-version').textContent=state.game==='wilds'?'WILDS':'WORLD / ICEBORNE';
}
function selectionRows(){
  if(state.selectedAction)return current.filter(r=>r.id===state.selectedAction);
  if(state.selectedKey)return current.filter(r=>(state.device==='pad'?padNodeSet(r,state.game):keySet(r.versions[state.game])).has(state.selectedKey));
  return [];
}
function applySelection(){
  const selected=selectionRows();
  const selectedIds=new Set(selected.map(r=>r.id));
  const sourceKeys=record=>state.device==='pad'?padNodeSet(record,state.game):keySet(record.versions[state.game]);
  const keys=state.selectedAction?new Set(selected.flatMap(r=>[...sourceKeys(r)])):new Set(state.selectedKey?[state.selectedKey]:[]);
  const active=!!state.selectedKey||!!state.selectedAction;
  document.querySelectorAll('.device-key').forEach(el=>{
    const chosen=keys.has(el.dataset.key);el.classList.toggle('selected',chosen);el.classList.toggle('dimmed',active&&!chosen);el.setAttribute('aria-pressed',String(chosen));
  });
  document.querySelectorAll('.function-row').forEach(el=>{const chosen=selectedIds.has(el.dataset.action);el.classList.toggle('selected',chosen);el.classList.toggle('dimmed',active&&!chosen);el.setAttribute('aria-pressed',String(chosen));});
  const chosenName=state.selectedKey?(state.device==='pad'?padNodes.find(n=>n.id===state.selectedKey)?.label:keyboardNames[state.selectedKey]||state.selectedKey):null;
  $('selection-hint').textContent=state.selectedAction?`${selected[0]?.action||'当前功能'} · 组合键中的所有按键同步点亮`:state.selectedKey?`${chosenName} · 当前视图 ${selected.length} 项功能；下方可查看两作全部关联`:'点击按键或两侧功能，查看它们的对应关系。';
  $('reset-selection').disabled=!active;
  scheduleLines();
}
let lineFrame=0;
function scheduleLines(){cancelAnimationFrame(lineFrame);lineFrame=requestAnimationFrame(drawConnections);}
function drawConnections(){
  const layer=$('connection-layer'),board=$('mapping-board'),bounds=board.getBoundingClientRect();
  layer.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  const paths=[];
  const selected=selectionRows();
  selected.forEach(record=>{
    const target=board.querySelector(`[data-action="${record.id}"]`);if(!target)return;
    const tr=target.getBoundingClientRect(),column=target.closest('.function-column'),cr=column.getBoundingClientRect();
    if(tr.bottom<=cr.top||tr.top>=cr.bottom)return;
    const isLeft=column.id==='left-functions';
    const keyIds=state.selectedKey?[state.selectedKey]:[...(state.device==='pad'?padNodeSet(record,state.game):keySet(record.versions[state.game]))];
    keyIds.forEach(key=>{
      const nodes=[...board.querySelectorAll('.device-key')].filter(el=>el.dataset.key===key);
      const node=nodes.find(el=>!el.dataset.physical?.endsWith('Right'))||nodes[0];if(!node)return;
      const kr=node.getBoundingClientRect();
      const x1=(isLeft?kr.left:kr.right)-bounds.left,y1=kr.top+kr.height/2-bounds.top;
      const x2=(isLeft?tr.right:tr.left)-bounds.left,y2=Math.max(cr.top+3,Math.min(tr.top+tr.height/2,cr.bottom-3))-bounds.top;
      const bend=isLeft?Math.min(x1-16,x2+14):Math.max(x1+16,x2-14);
      paths.push(`<path class="connection-line" d="M${x1},${y1} L${bend},${y1} L${bend},${y2} L${x2},${y2}"/><circle class="connection-end" cx="${x1}" cy="${y1}" r="3"/><circle class="connection-end" cx="${x2}" cy="${y2}" r="3"/>`);
    });
  });
  layer.innerHTML=paths.join('');
}
function hoverKeys(keys,action=null){
  document.querySelectorAll('.device-key').forEach(el=>el.classList.toggle('hovered',keys.has(el.dataset.key)));
  document.querySelectorAll('.function-row').forEach(el=>{const record=byId.get(el.dataset.action);const version=record.versions[state.game];const hit=state.device==='pad'?padNodeSet(record,state.game):keySet(version);el.classList.toggle('hovered',action?el.dataset.action===action:[...hit].some(k=>keys.has(k)));});
}
function selectKey(key){
  state.selectedAction=null;state.selectedKey=state.selectedKey===key?null:key;state.scope='selection';state.limit=40;state.tableQuery='';$('comparison-search').value='';
  if(state.selectedKey){
    for(const side of ['left','right']){
      const column=$(side+'-functions');
      const first=[...column.querySelectorAll('.function-row')].find(el=>{
        const record=byId.get(el.dataset.action);
        return (state.device==='pad'?padNodeSet(record,state.game):keySet(record.versions[state.game])).has(key);
      });
      if(first)column.scrollTop=first.offsetTop-18;
    }
  }
  applySelection();renderComparison();
}
function selectAction(id){state.selectedKey=null;state.selectedAction=state.selectedAction===id?null:id;state.scope='selection';state.limit=40;state.tableQuery='';$('comparison-search').value='';applySelection();renderComparison();}
function resetSelection(){state.selectedKey=null;state.selectedAction=null;applySelection();renderComparison();}
function renderVersionCells(record,game){
  const v=record.versions[game];
  if(!v){const label=record.versions[game==='wilds'?'world':'wilds']&&(/鹭鹰龙|集中/.test(record.action)||record.category==='claw')?'本作不适用':'未收录 / 待核对';return `<td class="group-edge"><span class="missing-value">${label}</span></td><td><span class="missing-value">—</span></td><td><span class="missing-value">—</span></td>`;}
  const warning=v.inferred?'映射推导 · 待核对':v.uncertain?'待核对 · 见来源说明':'';
  return `<td class="group-edge">${renderInput(v.keyboard.alternatives)}${v.keyboard.note?`<small class="input-note">${escape(v.keyboard.note)}</small>`:''}${warning?`<span class="data-warning">${warning}</span>`:''}</td><td>${renderInput(v.pad.ps,'ps')}</td><td>${renderInput(v.pad.xbox,'xbox')}</td>`;
}
function comparisonRows(){
  let rows;
  if(state.scope==='all')rows=records;
  else if(state.scope==='review')rows=records.filter(r=>Object.values(r.versions).some(v=>v.uncertain||!v.pad.ps.length||!v.pad.xbox.length));
  else if(state.selectedAction)rows=records.filter(r=>r.id===state.selectedAction);
  else if(state.selectedKey)rows=records.filter(r=>Object.values(r.versions).some(v=>keySet(v).has(state.selectedKey)));
  else rows=records.filter(r=>(inContext(r,'wilds')||inContext(r,'world'))&&matches(r,state.query));
  return rows.filter(r=>matches(r,state.tableQuery));
}
function renderComparison(){
  const rows=comparisonRows();
  $('comparison-scope').value=state.scope;
  $('comparison-title').textContent=state.scope==='review'?'存疑与资料缺口':state.scope==='all'?'两作全量对照':state.selectedKey?`${keyboardNames[state.selectedKey]||state.selectedKey} · 全部关联对照`:state.selectedAction?`${byId.get(state.selectedAction).action} · 两作对照`:'两作键位对照';
  $('comparison-description').textContent=state.scope==='review'?'保留原始来源及适用条件；未核实项不会被标为已确认。':'键鼠、两类手柄分别成列。两作输入独立记录，不以同名动作推定相同键位。';
  const shown=rows.slice(0,state.limit);
  $('comparison-results').innerHTML=shown.length?`<div class="table-scroll"><table class="compare-table"><colgroup><col style="width:25%"><col style="width:17%"><col style="width:10%"><col style="width:10%"><col style="width:17%"><col style="width:10%"><col style="width:11%"></colgroup><thead><tr><th rowspan="2" scope="col">功能 / 适用场景</th><th class="game-head" colspan="3" scope="colgroup">怪物猎人 · 荒野</th><th class="game-head world" colspan="3" scope="colgroup">怪物猎人 · 世界 / 冰原</th></tr><tr>${['wilds','world'].map(()=>`<th class="group-edge" scope="col">键盘 / 鼠标</th><th scope="col">${brand('ps')} 手柄</th><th scope="col">${brand('xbox')} 手柄</th>`).join('')}</tr></thead><tbody>${shown.map(r=>`<tr data-record="${r.id}"><td><span class="table-context">${r.domain==='combat'?'战斗':'系统'} / ${escape(r.context)} / ${escape(r.section)}</span><span class="table-action">${highlight(r.action,state.tableQuery||state.query)}</span><details><summary class="input-note">来源与使用条件</summary>${Object.entries(r.versions).map(([g,v])=>`<p class="input-note">${games[g]}：${escape(v.note||'按所列来源记录；不同设置预设可能改变输入。')}${v.pad.note?'；'+escape(v.pad.note):''}</p><a class="source-link" href="${v.source}" target="_blank" rel="noopener">${games[g]} · ${escape(v.sourceName)}</a>`).join('')}</details></td>${renderVersionCells(r,'wilds')}${renderVersionCells(r,'world')}</tr>`).join('')}</tbody></table></div>`:'<div class="compare-empty">当前范围没有匹配记录。未收录不等于游戏中没有绑定；可切换「全部系统与 14 武器」继续查找。</div>';
  $('comparison-total').textContent=`已显示 ${shown.length} / ${rows.length} 项 · 当前页面仅做键位查询，不会修改游戏设置`;
  $('load-more').hidden=rows.length<=shown.length;
}
function renderFooter(){
  const footer=document.querySelector('footer');footer.id='atlas-footer';
  footer.innerHTML=`<details><summary>资料来源、图标许可与版本说明</summary><div class="source-grid"><a href="${SOURCES.wilds}" target="_blank" rel="noopener">游侠网 · 荒野按键表（2025-02）</a><a href="${SOURCES.world}" target="_blank" rel="noopener">Shacknews · 冰原 Type 1（2020-01）</a><a href="${SOURCES.weapons}" target="_blank" rel="noopener">3DM · 世界映射与武器操作（2018-09）</a><a href="${SOURCES.gunlance}" target="_blank" rel="noopener">游民星空 · 荒野铳枪（2025-04）</a><a href="https://simpleicons.org/" target="_blank" rel="noopener">Simple Icons · CC0 图标来源</a></div><p>PlayStation 标识取自 Simple Icons 13.21.0，Xbox 标识取自 11.15.0；SVG 已内联，可离线使用。品牌商标归各自权利人所有，本站为非官方操作参考。</p><p>世界键鼠采用已收集的冰原 Type 1 / 多键鼠标资料，不等同于 2018 首发预设。当前版本、无侧键鼠标和自定义设置可能不同。武器栏保留既有招式资料并明确标记映射推导，未完成游戏内逐招验证；未收录内容不代表没有按键。</p><p>同时按下用「组合」外框，依次输入用箭头，备用输入用「或」。左右修饰键在图中共用参考绑定，不保证游戏接受右侧修饰键；请以游戏内键鼠设置为准。</p></details>`;
}
function refresh(){state.selectedKey=null;state.selectedAction=null;state.limit=40;renderContext();renderFunctions();applySelection();renderComparison();}
$('game-select').addEventListener('change',e=>{state.game=e.target.value;refresh();});
document.querySelectorAll('[data-domain]').forEach(button=>button.addEventListener('click',()=>{state.domain=button.dataset.domain;refresh();}));
$('context-controls').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.system)state.system=button.dataset.system;
  if(button.dataset.combat)state.combat=button.dataset.combat;
  if(button.dataset.weapon)state.weapon=button.dataset.weapon;
  if(button.id==='common-button')state.weapon='common';refresh();
});
let searchTimer;
$('atlas-search').addEventListener('input',event=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=event.target.value.trim();refresh();},140);});
$('clear-search').addEventListener('click',()=>{clearTimeout(searchTimer);$('atlas-search').value='';state.query='';refresh();$('atlas-search').focus();});
$('mapping-board').addEventListener('click',event=>{
  const key=event.target.closest('.device-key');const row=event.target.closest('.function-row');
  if(key)selectKey(key.dataset.key);else if(row)selectAction(row.dataset.action);else if(!event.target.closest('button'))resetSelection();
});
$('mapping-board').addEventListener('keydown',event=>{
  const key=event.target.closest('.device-key');
  if(key&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectKey(key.dataset.key);}
  if(event.key==='Escape')resetSelection();
});
$('mapping-board').addEventListener('pointerover',event=>{
  const row=event.target.closest('.function-row'),key=event.target.closest('.device-key');
  if(row)hoverKeys(state.device==='pad'?padNodeSet(byId.get(row.dataset.action),state.game):keySet(byId.get(row.dataset.action).versions[state.game]),row.dataset.action);
  else if(key)hoverKeys(new Set([key.dataset.key]));
});
$('mapping-board').addEventListener('pointerout',event=>{if(!event.target.closest('.function-row,.device-key')?.contains(event.relatedTarget))hoverKeys(new Set());});
$('reset-selection').addEventListener('click',resetSelection);
$('comparison-scope').addEventListener('change',e=>{state.scope=e.target.value;state.limit=40;renderComparison();});
$('comparison-search').addEventListener('input',e=>{state.tableQuery=e.target.value;state.limit=40;renderComparison();});
$('load-more').addEventListener('click',()=>{state.limit+=60;renderComparison();});
function openComparison(scope){state.scope=scope;state.tableQuery='';$('comparison-search').value='';state.limit=40;renderComparison();$('comparison').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
$('list-button').addEventListener('click',()=>openComparison('all'));
$('review-button').addEventListener('click',()=>openComparison('review'));
$('review-count').textContent=records.filter(r=>Object.values(r.versions).some(v=>v.uncertain||!v.pad.ps.length)).length;
['left-functions','right-functions'].forEach(id=>$(id).addEventListener('scroll',scheduleLines,{passive:true}));
window.addEventListener('resize',scheduleLines);
const observer=new ResizeObserver(scheduleLines);observer.observe($('mapping-board'));
document.querySelectorAll('.device-tabs button').forEach(button=>button.addEventListener('click',()=>{
  state.device=button.dataset.device;state.selectedKey=null;state.selectedAction=null;state.limit=40;
  document.querySelectorAll('.device-tabs button').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  $('view-km').hidden=state.device!=='km';
  $('view-pad').hidden=state.device!=='pad';
  $('stage-title').textContent=state.device==='km'?'KEYBOARD + MOUSE':'DUALSENSE WIRELESS CONTROLLER';
  renderFunctions();applySelection();renderComparison();
}));
renderDevices();renderFooter();refresh();
window.MH_ATLAS={records,state,visibleRecords,refresh,padNodeIds,padNodeSet,keySet};
})();
