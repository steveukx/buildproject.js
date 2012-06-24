
"use strict";

var TaskRunner = require('task-runner').TaskRunner;
var XHR = require('xhrequest');
var fs = require('fs');

var remoteLoader = require('../remote-loader');
var less = require('less');

function process(sourceDir, targetDir, taskRunner, processOptions) {

   var sourceFiles,
       outputFile = targetDir + (processOptions.filename || 'style.css'),
       includeFilter = processOptions.include || ['**.less'],
       remoteUrls = processOptions.remote || [],
       concatenatedOutput = '',
       lessParser = new less.Parser({}),
       lessTree;

   // task #1 read the directory contents with the supplied filters
   taskRunner.push(function(next) {
      sourceFiles = require('readdir').readSync(sourceDir, includeFilter);
      next();
   }, 'Scan for all LESS files');

   // task #2 when the package should include remote scripts, download them (or read them from the cache)
   remoteLoader(taskRunner, remoteUrls, targetDir);

   // task #3 when the package should include remote scripts, push them to the top of the output
   taskRunner.push(function(next) {
      next(remoteUrls.forEach(function(url) {
         concatenatedOutput += remoteLoader.getContent(url) + '\n\n';
      }));
   }, 'Concatenate remote files');


   // task #4 concatenate all of the files contents
   taskRunner.push(function(next) {
      concatenatedOutput = [concatenatedOutput];
      sourceFiles.forEach(function(sourceFile) {
         console.log('    [CONCAT] ' + sourceFile);
         concatenatedOutput.push(fs.readFileSync(sourceDir + sourceFile, 'utf-8'));
      });
      concatenatedOutput = concatenatedOutput.join('\n');
      next();
   }, 'Concatenate LESS files');

   // task #5 parse the content as a whole block
   taskRunner.push(function(next) {
      lessParser.parse(concatenatedOutput, function(e, tree) {
         if(e) throw e;
         lessTree = tree;
         next();
      });
   }, 'Parse LESS content');

   // task #6 save the regular css
   taskRunner.push(function(next) {
      fs.writeFile(outputFile, lessTree.toCSS(), 'utf-8', next);
   }, 'Persist LESS as CSS');

   // task #6 save the minified css
   taskRunner.push(function(next) {
      fs.writeFile(outputFile.replace(/\.css$/, '.min.css'), lessTree.toCSS({compress: true}).replace(/\s+/g, ' '), 'utf-8', next);
   }, 'Persist LESS as minified CSS');
}

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   var sourceDir = sourcePath + (options.lessSource || 'css').replace(/\/$/, '') + '/';
   var targetDir = targetPath + (options.lessOutput || 'css').replace(/\/$/, '') + '/';

   if(options.processLess) {
      taskRunner.push(function(next) {
         var builds = options.configuration.less;
         try {
            builds = builds || JSON.parse(fs.readFileSync(sourceDir + 'list.json', 'utf-8'));
            if(!Array.isArray(builds)) {
               throw new TypeError('LESS list.json must contain an array of configuration objects.');
            }
         }
         catch (e) {
            console.error('[ERROR] Can not parse list.json for LESS', e);
            process.exit();
         }

         next(builds.forEach(function(build) {
            process(sourceDir, targetDir, taskRunner, build);
         }));
      }, 'Parsing LESS filters file');
   }

};