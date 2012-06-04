
"use strict";

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   var path = require('path'),
       fs = require('fs');

   if(options.link) {

      var linkRequests = [].concat(options.link);
      var linkTaskRunner = new (require('task-runner')).TaskRunner();

      var file_linker = function(source, destination) {
         linkTaskRunner.push(function(next) {
            var readdir = require('readdir');
            readdir.readSync(sourcePath, source.split('|'), readdir.ABSOLUTE_PATHS).forEach(function(sourceFile) {
               linkTaskRunner.push(function(next) {
                  fs.symlink(sourceFile, destination + path.basename(sourceFile), 'file', function(err) {
                     if(err && err.code == 'EEXIST') {
                        console.error('File already exists: ' + destination + path.basename(sourceFile) + ' try running clean first.');
                        process.exit(1);
                     }
                     else if(err) {
                        throw err;
                     }

                     next();
                  });
               }, 'Linking ' + sourceFile + ' into ' + destination);
            });
            next();
         }, 'Link sources from ' + source);
      };

      var folder_linker = function(source, destination) {
         linkTaskRunner.push(function(next) {
            fs.symlink(source, destination, 'dir', function(err) {
               if(err && err.code == 'EEXIST') {
                  console.error('Folder already exists: ' + destination + ' try running clean first.');
                  process.exit(1);
               }
               else if(err) {
                  throw err;
               }

               next();
            });
         }, 'Linking ' + source + ' into ' + destination);
      };

      linkRequests.forEach(function(link) {
         var paths = link.split(',', 2),
             source = paths[0],
             destination = targetPath + paths[1];

         if(source.charAt(source.length - 1) == '/' && source.indexOf('|') < 0) {
            folder_linker(sourcePath + source, destination);
         }
         else {
            file_linker(source, destination);
         }
      });

      taskRunner.push(function(next) {
         linkTaskRunner.start(next);
      }, 'Scan for links');
   }

};