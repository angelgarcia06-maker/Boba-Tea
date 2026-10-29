import test from 'node:test';
import assert from 'node:assert/strict';
import {validHttpUrl, validSocialUrl,validCtaUrl,validateComment,publicPageUrl} from '../utils.js';

test('Solo se aceptan protocolos HTTP(S)',()=>{
  assert.equal(validHttpUrl('https://www.instagram.com/'),true);
  assert.equal(validHttpUrl('javascript:alert(1)'),false);
  assert.equal(validHttpUrl('ftp://ejemplo.test'),false);
});
test('Los enlaces sociales se comprueban por dominio real',()=>{
  assert.equal(validSocialUrl('instagram','https://www.instagram.com/perfil/'),true);
  assert.equal(validSocialUrl('instagram','https://instagram.com.ejemplo.com/'),false);
  assert.equal(validSocialUrl('tiktok','https://www.tiktok.com/@cuenta'),true);
  assert.equal(validSocialUrl('maps','https://maps.app.goo.gl/Ab123'),true);
  assert.equal(validSocialUrl('maps','https://www.google.com/maps/place/Piura'),true);
  assert.equal(validSocialUrl('maps','https://fake-maps.test'),false);
});
test('Los enlaces CTA permiten https y anclas y rechazan scripts',()=>{
  assert.equal(validCtaUrl('#comentarios'),true);
  assert.equal(validCtaUrl('https://wa.me/123'),true);
  assert.equal(validCtaUrl('javascript:alert(1)'),false);
});
test('El formulario de comentarios valida longitudes',()=>{
  assert.equal(validateComment('Luz','Un comentario válido'),'');
  assert.match(validateComment('A','Hola mundo'),/nombre/i);
  assert.match(validateComment('Luz','A'),/comentario/i);
  assert.match(validateComment('Luz','a'.repeat(1001)),/comentario/i);
});
test('El enlace compartido no incluye parámetros administrativos',()=>{
  assert.equal(publicPageUrl({href:'https://ejemplo.test/blog/?admin=1#editor'}),'https://ejemplo.test/blog/');
});
