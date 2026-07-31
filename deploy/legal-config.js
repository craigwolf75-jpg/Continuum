/* Continuum legal constants, single source of truth. Plain vanilla JS, no build.
   Update these three values in one place. No em-dashes anywhere. */
(function (global) {
  'use strict';
  var L = {
    entity: 'ContinuumRTW Inc.',
    supportEmail: 'craig@continuumrtw.com',
    privacyOfficer: 'Privacy Officer, ContinuumRTW Inc.'
  };
  global.CONTINUUM_LEGAL = L;
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('[data-legal]').forEach(function (el) {
        var k = el.getAttribute('data-legal');
        if (k === 'support-email') { el.textContent = L.supportEmail; }
        else if (k === 'privacy-officer') { el.textContent = L.privacyOfficer; }
        else if (k === 'entity') { el.textContent = L.entity; }
      });
    });
  }
})(typeof window !== 'undefined' ? window : this);
