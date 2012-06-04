
"use strict";

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   if(options.processCss) {
      (function() {
         var fs = require('fs'),
            sourceDir = sourcePath + (options.cssSource || 'css').replace(/\/$/, '') + '/',
            outputFile = targetPath + (options.cssOutput || 'css/style.css'),
            sourceFiles,
            allCssContent;

         taskRunner.push(function(next) {
            var readdir = require('readdir');
            sourceFiles = readdir.readSync(sourceDir, ['**.css'], readdir.ABSOLUTE_PATHS);
            next();
         }, 'Find all css files');

         taskRunner.push(function(next) {
            var concatenationTaskRunner = new (require('task-runner').TaskRunner);
            sourceFiles.forEach(function(sourceFile, index) {
               concatenationTaskRunner.push(function(next) {
                  fs.readFile(sourceFile, 'utf-8', function(err, data) {
                     sourceFiles[index] = data;
                     next();
                  });
               }, 'Read CSS file ' + sourceFile);
            });
            concatenationTaskRunner.start(next);
         }, 'Read all CSS files');

         taskRunner.push(function() {
            allCssContent = sourceFiles.join('\n\n');
         }, 'Concatenate CSS', false);

         if(options.styleTokens) {
            taskRunner.push(function(next) {
               var tokenisingTaskRunner = new (require('task-runner').TaskRunner),
                   tokenContent = {};

               var readdir = require('readdir'),
                   sourceFiles = readdir.readSync(sourceDir, ['**tokens.json'], readdir.ABSOLUTE_PATHS);

               sourceFiles.forEach(function(sourceFile) {
                  tokenisingTaskRunner.push(function(next) {
                     fs.readFile(sourceFile, 'utf-8', function(err, data) {
                        var file = JSON.parse(data);
                        for(var el in file) {
                           tokenContent[el] = file[el];
                        }
                        next();
                     });
                  }, 'Read CSS Tokens from ' + sourceFile);
               });

               tokenisingTaskRunner.push(function(next) {
                  var tokenWrappers = (options.cssTokenWrappers || "{{ }}").split(' ');
                  var regExp = new RegExp(tokenWrappers[0] + '([^' + tokenWrappers[1] + ']*)' + tokenWrappers[1], 'g');
                  var usageStats = {};

                  allCssContent = allCssContent.replace(regExp,
                        function(allString, tokenName, startPosition, fullString) {
                           if(tokenContent[tokenName] === undefined) {
                              throw new Error('Token not valid: ' + tokenName, allString, startPosition);
                           }
                           usageStats[tokenName] = usageStats[tokenName] ? usageStats[tokenName] + 1 : (usageStats[tokenName] = 1);
                           return tokenContent[tokenName];
                        });

                  for(var token in usageStats) {
                     console.log('    [TOKEN] ', token, usageStats[token]);
                  }
                  next();
               }, 'Run token replacement in CSS content');

               tokenisingTaskRunner.start(next);

            }, 'Tokenising CSS');
         }

         taskRunner.push(function(next) {
            fs.writeFile(outputFile.replace('.css', '.debug.css'), allCssContent, 'utf-8', next);
         }, 'Write debug CSS');

         taskRunner.push(function() {
            allCssContent = allCssContent.replace(/\s+/g, ' ')
               .replace(/\/\*[^\*\/]*\*\//g, ' ');
         }, 'Minify CSS', false);

         taskRunner.push(function(next) {
            fs.writeFile(outputFile, allCssContent, 'utf-8', next);
         }, 'Write CSS to' + outputFile);
      }());
   }

};