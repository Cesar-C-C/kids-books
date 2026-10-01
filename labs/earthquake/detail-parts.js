(function (root) {
  'use strict';
  root.EARTHQUAKE_DETAILS = [
    { id: 'fault-locked', region: 'fault-plane', conceptId: 'elastic-strain' },
    { id: 'fault-dip', region: 'fault-plane', conceptId: 'fault' },
    { id: 'strata-bend', region: 'marker-line', conceptId: 'elastic-strain' },
    { id: 'focus-depth', region: 'focus', conceptId: 'focus' },
    { id: 'epicenter-projection', region: 'epicenter', conceptId: 'epicenter' },
    { id: 'flag-distance', region: 'far-flag', conceptId: 'wavefront' },
    { id: 'p-front', region: 'wavefront', conceptId: 'p-wave' },
    { id: 'particle-origin', region: 'particle', conceptId: 'particle-motion' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
