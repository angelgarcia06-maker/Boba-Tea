import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicBackend,fetchFresh} from '../services/public-backend.js';

const config={supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'public-test-key',articleSlug:'boba-tea-piura'};

function createMemoryClient(){
  const rows=new Map();
  const client={
    rows,
    failWrites:false,
    from(table){
      assert.equal(table,'blog_articles');
      const query={};
      return {
        select(){return this;},
        eq(column,value){query[column]=value;return this;},
        maybeSingle:async()=>{
          const row=rows.get(query.slug);
          return {data:row?{content:structuredClone(row.content)}:null,error:null};
        },
        upsert(row,options){query.row=row;query.options=options;return this;},
        single:async()=>{
          if(client.failWrites)return {data:null,error:new Error('RLS rejected write')};
          rows.set(query.row.slug,structuredClone(query.row));
          return {data:{content:structuredClone(query.row.content)},error:null};
        }
      };
    }
  };
  return client;
}

test('El guardado confirmado en Supabase se lee tras crear otro cliente y recargar',async()=>{
  const client=createMemoryClient();
  const content={title:'Contenido actualizado',hero:{src:'https://images.example.test/boba.webp'},sections:[{heading:'Nuevo sabor',text:'Fresa y tapioca'}]};
  const adminBackend=await createPublicBackend(config,client);

  const persisted=await adminBackend.writeArticle(content);
  assert.deepEqual(persisted,content);
  assert.equal(client.rows.get(config.articleSlug).slug,config.articleSlug);
  assert.equal(client.rows.get(config.articleSlug).updated_at.length>0,true);

  const publicBackend=await createPublicBackend(config,client);
  assert.deepEqual(await publicBackend.readArticle(),content);
});

test('No existe una copia local que haga parecer exitoso un guardado rechazado',async()=>{
  const client=createMemoryClient();
  client.failWrites=true;
  const backend=await createPublicBackend(config,client);

  await assert.rejects(backend.writeArticle({title:'No debe guardarse'}),/RLS rejected write/);
  assert.equal(client.rows.has(config.articleSlug),false);
});

test('Las consultas de Supabase evitan reutilizar respuestas HTTP cacheadas',async()=>{
  const originalFetch=globalThis.fetch;
  let requestOptions;
  globalThis.fetch=async(_input,options)=>{requestOptions=options;return 'response';};
  try{
    assert.equal(await fetchFresh('https://example.supabase.co/rest/v1/blog_articles',{method:'GET'}),'response');
    assert.equal(requestOptions.method,'GET');
    assert.equal(requestOptions.cache,'no-store');
  }finally{
    globalThis.fetch=originalFetch;
  }
});
