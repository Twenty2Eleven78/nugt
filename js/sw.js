// Change this to your repository name
var nugtPATH = '';
 
// Choose a different app prefix name
var APP_PREFIX = 'nugt_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = 'version_212';
 
// The files to make available for offline use. make sure to add 
// others to this list
var URLS = [    
  `${nugtPATH}/`,
  `${nugtPATH}/index.html`,
  `${nugtPATH}/style.css`,
  `${nugtPATH}/script.js`,
  `${nugtPATH}/roster.js`,
  `${nugtPATH}/materialize.min.js`
]