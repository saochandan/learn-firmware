import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const content=fs.readFileSync('content.js','utf8');
const context=vm.createContext({});
vm.runInContext(content+'\nthis.data={modules,lessons,projects,posts,references};',context);
const {modules,lessons,projects,posts,references}=context.data;
assert.equal(modules.length,5);
assert.equal(lessons.length,24);
assert.deepEqual(Array.from(modules,(_,i)=>lessons.filter(l=>l.module===i).length),[4,5,6,5,4]);
for(const [i,l] of lessons.entries()){
 assert.equal(l.id,i+1);
 for(const field of ['title','concept','example','code','expected','exercise','question','answer','h7'])assert.ok(l[field]?.length>15,`Lesson ${l.id}: missing ${field}`);
 assert.ok(l.steps.length>=4);
}
for(const collection of [projects,posts])assert.equal(new Set(collection.map(p=>p.id)).size,collection.length);
assert.equal(projects.length,3);assert.equal(posts.length,3);
for(const [,url] of references)assert.equal(new URL(url).protocol,'https:');
new vm.Script(fs.readFileSync('app.js','utf8'));
const html=fs.readFileSync('index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!match[1].startsWith('http'))assert.ok(fs.existsSync(match[1]),`Missing asset ${match[1]}`);
console.log('PASS: 24 complete lessons, module counts, unique projects/articles, references, JS syntax and local assets.');
// Render every route using a small DOM adapter to catch runtime and content errors.
const elements=new Map();
function element(selector){
 if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',value:selector.includes('module')?'all':'',dataset:{},setAttribute(){},addEventListener(type,fn){this[type]=fn;},focus(){},click(){}});
 return elements.get(selector);
}
const memory=new Map();
const browser=vm.createContext({
 document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>element('download'),title:''},
 localStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)},
 location:{hash:'#home'},window:{scrollTo(){},scrollY:0,addEventListener(){},print(){}},
 navigator:{clipboard:{writeText:async()=>{}}},URL,Blob,setTimeout
});
vm.runInContext(content+'\n'+fs.readFileSync('app.js','utf8'),browser);
for(const route of ['home','course','projects','journal','interview','resources',...lessons.map(l=>'lesson/'+l.id),...projects.map(p=>'project/'+p.id),...posts.map(p=>'post/'+p.id)]){
 browser.location.hash='#'+route;
 vm.runInContext('route()',browser);
 assert.ok(element('main').innerHTML.includes('<h1>'),`Missing heading: ${route}`);
 assert.ok(!/>undefined</.test(element('main').innerHTML),`Undefined content: ${route}`);
}
browser.location.hash='#course';vm.runInContext('route()',browser);
element('#search').value='no-such-term-xyz';element('#search').input();
assert.ok(element('#curriculum').innerHTML.includes('No lessons match'));
browser.location.hash='#lesson/1';vm.runInContext('route()',browser);
element('#complete').onclick();assert.ok(memory.get('lf:completed').includes('1'));
element('#lab-note').value='Reproduced 10/10';element('#lab-note').input();
assert.equal(JSON.parse(memory.get('lf:note:1')),'Reproduced 10/10');
vm.runInContext('renderLesson(1)',browser);assert.equal(element('#lab-note').value,'Reproduced 10/10');
console.log('PASS: 36 route renders, empty search, progress updates and lab-note persistence. Browser layout and physical hardware remain unverified.');
