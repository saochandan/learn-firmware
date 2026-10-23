import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const content=['content.js','lesson-details.js','course-path.js','chapter-content.js','chapter-examples.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const context=vm.createContext({});
vm.runInContext(content+'\nthis.data={modules,lessons,projects,posts,references,chapterGuides};',context);
const {modules,lessons,projects,posts,references,chapterGuides}=context.data;
assert.equal(modules.length,8);
assert.equal(lessons.length,43);
assert.deepEqual(Array.from(modules,(_,i)=>lessons.filter(l=>l.module===i).length),[5,7,6,5,6,4,6,4]);
assert.equal(new Set(lessons.map(l=>l.id)).size,43);
assert.equal(lessons[0].id,25); // Original IDs remain stable, learning order changes.
for(const [i,l] of lessons.entries()){
 assert.equal(l.position,i+1);
 for(const field of ['title','concept','example','code','expected','exercise','question','answer','h7'])assert.ok(l[field]?.length>15,`Lesson ${l.id}: missing ${field}`);
 assert.ok(l.steps.length>=4);
 assert.ok(l.solution?.length>80,`Lesson ${l.id}: missing exercise solution`);
 assert.equal(l.detail.questions.length,2,`Lesson ${l.id}: needs two advanced interview answers`);
 assert.ok(l.detail,`Lesson ${l.id}: missing detailed material`);
 assert.ok(l.detail.explanation.length>=2);
 for(const board of ['f401','h7'])assert.ok(l.detail.boards[board].length>=3,`Lesson ${l.id}: missing ${board} lab`);
 for(const key of ['worked','expected','troubleshoot'])assert.ok(l.detail[key].length>60,`Lesson ${l.id}: missing ${key}`);
 assert.ok(!/placeholder|coming soon|TODO/i.test(JSON.stringify(l)),`Lesson ${l.id}: unfinished content`);
}
for(const collection of [projects,posts])assert.equal(new Set(collection.map(p=>p.id)).size,collection.length);
assert.equal(projects.length,3);assert.equal(posts.length,3);
for(const [,url] of references)assert.equal(new URL(url).protocol,'https:');
new vm.Script(fs.readFileSync('app.js','utf8'));
new vm.Script(fs.readFileSync('chapter-ui.js','utf8'));
assert.equal(chapterGuides.length,8);
for(const [index,g] of chapterGuides.entries()){
 assert.equal(g.module,index);
 assert.equal(g.walkthrough.length,4);
 assert.ok(g.architecture.length>=3);
 assert.ok(g.acceptance.length>=4);
 assert.ok(g.solution.length>100);
 assert.ok(g.example.code.length>250);
 assert.ok(g.example.trace.length>100);
 for(const board of ['f401','h7'])assert.ok(g.boards[board].length>100);
}
const html=fs.readFileSync('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!match[1].startsWith('http')){
 assert.ok(fs.existsSync(match[1]),`Missing asset ${match[1]}`);
 assert.ok(fs.readFileSync('.github/workflows/pages.yml','utf8').includes(match[1]),`Asset not packaged for Pages: ${match[1]}`);
 assert.ok(fs.readFileSync('scripts/serve.mjs','utf8').includes(`'${match[1]}'`),`Asset not served locally: ${match[1]}`);
}
console.log('PASS: 43 lessons in 8 modules; detailed explanations, worked cases, 86 board procedures and expected/troubleshooting evidence.');
// Render every route using a small DOM adapter to catch runtime and content errors.
const elements=new Map();
const boardButtons=['f401','h7'].map(board=>({dataset:{board},setAttribute(key,value){this[key]=value;},addEventListener(type,fn){this[type]=fn;}}));
function element(selector){
 if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',value:selector.includes('module')?'all':'',dataset:{},setAttribute(){},addEventListener(type,fn){this[type]=fn;},focus(){},click(){}});
 return elements.get(selector);
}
const memory=new Map();
const browser=vm.createContext({
 document:{querySelector:element,querySelectorAll:selector=>selector==='[data-board]'?boardButtons:[],createElement:()=>element('download'),title:''},
 localStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)},
 location:{hash:'#home'},window:{scrollTo(){},scrollY:0,addEventListener(){},print(){}},
 navigator:{clipboard:{writeText:async()=>{}}},URL,Blob,setTimeout
});
vm.runInContext(content+'\n'+fs.readFileSync('chapter-ui.js','utf8')+'\n'+fs.readFileSync('app.js','utf8'),browser);
for(const route of ['home','course','projects','journal','interview','resources',...lessons.map(l=>'lesson/'+l.id),...chapterGuides.map(g=>'chapter/'+g.module),...projects.map(p=>'project/'+p.id),...posts.map(p=>'post/'+p.id)]){
 browser.location.hash='#'+route;
 vm.runInContext('route()',browser);
 assert.ok(element('main').innerHTML.includes('<h1>'),`Missing heading: ${route}`);
 assert.ok(!/>undefined</.test(element('main').innerHTML),`Undefined content: ${route}`);
 for(const match of element('main').innerHTML.matchAll(/href="#lesson\/(\d+)"/g))assert.ok(lessons.some(l=>l.id===Number(match[1])),`Broken lesson link: ${route}`);
 if(route.startsWith('lesson/')){
  const l=lessons.find(l=>l.id===Number(route.split('/')[1]));
  assert.ok(element('main').innerHTML.includes(l.solution));
  assert.ok(element('main').innerHTML.includes(`href="#chapter/${l.module}"`));
  assert.ok(element('#board-note').innerHTML.includes(l.detail.boards.f401[0]));
  boardButtons[1].click();
  assert.ok(element('#board-note').innerHTML.includes(l.detail.boards.h7[0]));
  boardButtons[0].click();
 }
 if(route.startsWith('chapter/')){
  const index=Number(route.split('/')[1]);
  const g=chapterGuides[index];
  assert.ok(element('main').innerHTML.includes(g.example.trace));
  assert.ok(element('main').innerHTML.includes(g.solution));
  assert.ok(element('main').innerHTML.includes(g.boards.f401));
  assert.ok(element('main').innerHTML.includes(g.boards.h7));
  for(const l of lessons.filter(l=>l.module===index))assert.ok(element('main').innerHTML.includes(`href="#lesson/${l.id}"`));
 }
}
browser.location.hash='#course';vm.runInContext('route()',browser);
element('#search').value='no-such-term-xyz';element('#search').input();
assert.ok(element('#curriculum').innerHTML.includes('No lessons match'));
browser.location.hash='#lesson/1';vm.runInContext('route()',browser);
element('#complete').onclick();assert.ok(memory.get('lf:completed').includes('1'));
element('#lab-note').value='Reproduced 10/10';element('#lab-note').input();
assert.equal(JSON.parse(memory.get('lf:note:1')),'Reproduced 10/10');
vm.runInContext('renderLesson(1)',browser);assert.equal(element('#lab-note').value,'Reproduced 10/10');
browser.location.hash='#interview';vm.runInContext('route()',browser);
assert.equal(vm.runInContext('interviewItems().length',browser),129);
element('#question-search').value='cache';element('#question-search').oninput();
assert.ok(element('#questions').innerHTML.includes('cache'));
element('#question-search').value='';element('#question-module').value='0';element('#question-module').onchange();
assert.equal((element('#questions').innerHTML.match(/<details/g)||[]).length,15);
browser.location.hash='#lesson/25';vm.runInContext('route()',browser);
const firstNavigation=element('main').innerHTML.split('<div class="lesson-bottom">')[1].split('<h2>Primary references')[0];
assert.ok(firstNavigation.includes('href="#course"'));
assert.ok(firstNavigation.includes('#lesson/26'));
browser.location.hash='#lesson/24';vm.runInContext('route()',browser);
assert.ok(element('main').innerHTML.includes('#lesson/41'));
const lastNavigation=element('main').innerHTML.split('<div class="lesson-bottom">')[1].split('<h2>Primary references')[0];
assert.ok(lastNavigation.includes('href="#projects"'));
assert.ok(!lastNavigation.includes('Next lesson'));
const existingPage=element('main').innerHTML;
browser.location.hash='#main';vm.runInContext('route()',browser);
assert.equal(element('main').innerHTML,existingPage,'Skip link must not navigate to a missing route');
browser.location.hash='#chapter/invalid';vm.runInContext('route()',browser);
assert.ok(element('main').innerHTML.includes('Page not found'));
console.log('PASS: 63 content route renders, 8 chapter integrations, 43 exercise solutions, 129 lesson interview answers, board tabs, search/filter, navigation and persistence.');
console.log('LIMIT: DOM-adapter checks do not verify browser layout or physical board behavior.');
