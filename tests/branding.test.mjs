import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_CONTENT, ARTICLE_SLUG} from '../content.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('El artículo presenta el título, subtítulo y SEO de Boba Tea Piura',()=>{
  assert.equal(ARTICLE_SLUG,'boba-tea-piura');
  assert.equal(DEFAULT_CONTENT.title,'¡Un mundo de sabores en cada sorbo!');
  assert.equal(DEFAULT_CONTENT.subtitle,'Descubre Boba Tea Piura y déjate sorprender.');
  assert.equal(DEFAULT_CONTENT.seo.keyword,'Boba Tea Piura');
  assert.match(DEFAULT_CONTENT.seo.secondaryKeywords,/bubble tea en Piura/);
  assert.match(DEFAULT_CONTENT.seo.secondaryKeywords,/té con tapioca en Piura/);
  assert.match(html,/<h1 id="article-title">¡Un mundo de sabores en cada sorbo!<\/h1>/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
});

test('La imagen destacada y los enlaces sociales no sugieren destinos no configurados',()=>{
  assert.match(DEFAULT_CONTENT.hero.src,/boba-tea-hero\.svg$/);
  assert.match(DEFAULT_CONTENT.hero.alt,/Boba Tea Piura.*perlas de tapioca/);
  assert.deepEqual(DEFAULT_CONTENT.social,{instagram:'',tiktok:'',maps:''});
  for(const platform of ['instagram','tiktok','maps']){
    assert.match(html,new RegExp(`id="social-${platform}" class="social-card is-disabled" href="#enlaces"`));
  }
});
