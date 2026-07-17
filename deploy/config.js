/* Continuum Supabase client config. Plain vanilla JS, no build step.
   These are CLIENT-SAFE values only:
     - url is public.
     - the publishable key is designed to be shipped to browsers and is
       protected by Row Level Security. It is NOT a secret.
   NEVER put the service_role key, the secret key, or the management
   (sbp_) token in this file or anywhere the browser can read. Those are
   admin credentials and live only in Supabase project secrets or a
   server-side environment.

   Project: craigwolf75-jpg's Project  (ref agzhnmunodrhsjbogzae, ca-central-1)
*/
(function (global) {
  'use strict';
  global.CONTINUUM_SUPABASE = {
    url: 'https://agzhnmunodrhsjbogzae.supabase.co',
    publishableKey: 'sb_publishable_dEYjpgPSaLiMow0xe2a6sQ_4wBnt_Yp'
  };
})(typeof window !== 'undefined' ? window : this);
