/* Continuum outbound links, single source of truth. Plain vanilla JS, no build.
   bookingUrl is the Continuum access-request page at /book. Submitting that
   form emails the admin inbox via /api/marketing-lead (existing Resend path).
   It is a Continuum owned URL only, never a third party scheduling tool and
   never any other company's address. Update this one value to change every
   call to action that uses CONTINUUM_LINKS. index.html Talk to Our Team stays
   on its own ROUTES.contact value. No em-dashes anywhere. */
(function (global) {
  'use strict';
  global.CONTINUUM_LINKS = {
    bookingUrl: 'https://continuumrtw.com/book'
  };
})(typeof window !== 'undefined' ? window : this);
