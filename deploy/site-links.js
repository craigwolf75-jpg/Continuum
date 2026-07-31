/* Continuum outbound links, single source of truth. Plain vanilla JS, no build.
   bookingUrl is the Continuum booking page (30, 45, and 60 minute calls; there
   is no 15 minute call). It is a Continuum owned URL only, never a third
   party scheduling tool and never any other company's address. Update this
   one value to change every call to action. index.html carries this same
   literal in every Book a demo and Start a Pilot anchor href (see the
   comment above the CTA band); update both together. No em-dashes anywhere. */
(function (global) {
  'use strict';
  global.CONTINUUM_LINKS = {
    bookingUrl: 'https://continuumrtw.com/book' // BLOCKER: confirm the exact Continuum booking page URL before merge
  };
})(typeof window !== 'undefined' ? window : this);
