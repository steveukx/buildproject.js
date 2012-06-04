
"use strict";

/**
 * Add task for removing the target directory
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   // run the templates build
   if(options.clean) {
      taskRunner.push(function(next) {
         var failPathNotFound = false;
         var rm = require('child_process').spawn('rm', ['-r', targetPath]);
         rm.on('exit', function(code) {
                  if(code && !failPathNotFound) {
                     throw new Error("Could not complete operation.");
                  }
                  next();
               });
         rm.stderr.on('data', function(dataBuffer) {
            if(dataBuffer.toString('utf-8').indexOf('No such file') > 0) {
               failPathNotFound = true;
            }
         });
      }, 'Remove all content in ' + targetPath);
   }

};