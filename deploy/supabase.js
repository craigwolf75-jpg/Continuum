/* Continuum Supabase client bootstrap. Plain vanilla JS, no build step.
   Loads supabase-js from CDN if it is not already present, then creates a
   single client from window.CONTINUUM_SUPABASE (see config.js) using the
   client-safe publishable key.

   Exposes:
     window.ContinuumSupabase       the client (available once ready)
     window.ContinuumSupabaseReady  a Promise that resolves to the client

   Usage:
     window.ContinuumSupabaseReady.then(function (sb) {
       sb.auth.getSession().then(function (r) { ... });
     });

   RLS note: this client uses the publishable key, so every request is
   subject to Row Level Security. It can only read or write what the
   caller's policies allow. Do not rely on the client to hide PHI; the
   database policies are the boundary.
*/
(function (global) {
  'use strict';

  var CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

  function makeClient() {
    var cfg = global.CONTINUUM_SUPABASE;
    if (!cfg || !cfg.url || !cfg.publishableKey) {
      throw new Error('CONTINUUM_SUPABASE config missing. Load config.js before supabase.js.');
    }
    if (!global.supabase || !global.supabase.createClient) {
      throw new Error('supabase-js failed to load from CDN.');
    }
    return global.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }

  function loadLib() {
    return new Promise(function (resolve, reject) {
      if (global.supabase && global.supabase.createClient) { resolve(); return; }
      var s = document.createElement('script');
      s.src = CDN;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Could not load supabase-js from ' + CDN)); };
      document.head.appendChild(s);
    });
  }

  global.ContinuumSupabaseReady = loadLib().then(function () {
    var client = makeClient();
    global.ContinuumSupabase = client;
    return client;
  });
})(typeof window !== 'undefined' ? window : this);
