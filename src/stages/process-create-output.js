
"use strict";

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   var directoryPermissions = 493, // rw-rw-r--
       fs = require('fs');

   if(options.createTargetDir) {
      [''].concat(options.createTargetDir).forEach(function(path) {
         taskRunner.push(function(next) {
            fs.mkdir(targetPath + path, directoryPermissions, function(err) {
               if(!err || err.code == 'EEXIST') {
                  if(err) {
                     console.log('  [INFO] Path ' + targetPath + path + ' already exists');
                  }
                  next();
               }
               else {
                  throw err;
               }
            });
         }, 'Path creator: ' + targetPath + path);
      });
   }
};
