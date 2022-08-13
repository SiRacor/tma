import jasmineRequire from 'jasmine-core/lib/jasmine-core/jasmine.js';
declare global {
    interface Window { jasmineRequire: any; jasmineRef: any; ngRef: any; }
}
window.jasmineRequire = jasmineRequire;