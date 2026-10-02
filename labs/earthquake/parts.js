(function (root) {
  'use strict';
  root.EARTHQUAKE_PARTS = [
    { id: 'surface', region: 'land', conceptId: 'fault' },
    { id: 'footwall', region: 'rock', conceptId: 'fault' },
    { id: 'hanging-wall', region: 'rock', conceptId: 'fault-reverse' },
    { id: 'fault-plane', region: 'fault', conceptId: 'fault' },
    { id: 'marker-line', region: 'evidence', conceptId: 'slip' },
    { id: 'focus', region: 'origin', conceptId: 'focus' },
    { id: 'epicenter', region: 'origin', conceptId: 'epicenter' },
    { id: 'near-flag', region: 'arrival', conceptId: 'wavefront' },
    { id: 'far-flag', region: 'arrival', conceptId: 'wavefront' },
    { id: 'wavefront', region: 'wave', conceptId: 'wavefront' },
    { id: 'particle', region: 'wave', conceptId: 'particle-motion' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
