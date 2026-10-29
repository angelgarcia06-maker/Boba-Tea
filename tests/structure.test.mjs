import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');

test('Los siete bloques aparecen en el orden académico obligatorio',()=>{
  const ids=['titulo','introduccion','contenido','llamada-accion','enlaces','compartir','comentarios'];
  const indices=ids.map(id=>html.indexOf(`id="${id}"`));
  assert.ok(indices.every(index=>index>=0));
  assert.deepEqual(indices,[...indices].sort((a,b)=>a-b));
});
test('Solo se define un H1 y los siete consejos tienen un H3 estático',()=>{
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/<section class="tip-item"><h3>/g)||[]).length,7);
});
test('Las estrategias SEO 01 a 07 están comentadas en el código',()=>{
  const all=html+'\n'+css+'\n'+app;
  for(let i=1;i<=7;i++)assert.match(all,new RegExp(`ESTRATEGIA SEO ${String(i).padStart(2,'0')}`));
});
test('Todas las referencias de app.js a IDs están en index.html',()=>{
  const ids=[...app.matchAll(/byId\('([^']+)'\)/g)].map(m=>m[1]);
  for(const id of ids)assert.ok(html.includes(`id="${id}"`),`Falta ${id}`);
});
test('Los comentarios se insertan como texto y no como HTML',()=>{
  assert.match(app,/body\.textContent=item\.body/);
  assert.doesNotMatch(app,/innerHTML\s*=/);
});
