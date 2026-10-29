// Modo público con Supabase: RLS determina autorización, nunca el frontend.
// La clave publishable/anon es pública; service_role NO debe usarse aquí.
export function fetchFresh(input, init={}) {
  return fetch(input,{...init,cache:'no-store'});
}

export async function createPublicBackend(config, client) {
  let supabase=client;
  if(!supabase) {
    const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.57.0');
    supabase=createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:true},
      global: {fetch:fetchFresh}
    });
  }
  const slug = config.articleSlug;
  function unwrap(result) { if (result.error) throw result.error; return result.data; }
  return {
    async readArticle() {
      return unwrap(await supabase.from('blog_articles').select('content').eq('slug',slug).maybeSingle())?.content ?? null;
    },
    async writeArticle(content) {
      const saved=unwrap(await supabase.from('blog_articles')
        .upsert({slug, content, updated_at: new Date().toISOString()}, {onConflict:'slug'})
        .select('content')
        .single());
      if(!saved || !saved.content) throw new Error('Supabase no confirmó el contenido guardado.');
      return saved.content;
    },
    async readComments() {
      return unwrap(await supabase.from('blog_comments').select('id, author_name, body, created_at, status').eq('article_slug',slug).order('created_at',{ascending:false}).limit(100));
    },
    async writeComment(name, body) {
      unwrap(await supabase.from('blog_comments').insert({article_slug:slug, author_name:name, body}));
    },
    async moderateComment(id,status) {
      unwrap(await supabase.from('blog_comments').update({status}).eq('id',id));
    },
    async signIn(email,password) {
      unwrap(await supabase.auth.signInWithPassword({email,password}));
      return this.isAdmin();
    },
    async isAdmin() {
      const {data:{user},error} = await supabase.auth.getUser();
      if (error || !user) return false;
      return Boolean(unwrap(await supabase.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle()));
    },
    async signOut() { unwrap(await supabase.auth.signOut()); },
    async uploadImage(blob) {
      const path = `${slug}/${crypto.randomUUID()}.webp`;
      unwrap(await supabase.storage.from('blog-images').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'3600'}));
      return supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
    }
  };
}
