
"use strict";

var TaskRunner = require('task-runner').TaskRunner;
var fs = require('fs');
var uglifyParser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;
var remoteLoader = require('../remote-loader');

var debugFileTemplate = '{{#scripts}}document.write(decodeURIComponent("%3Cscript%20src%3D%22/js/{{source}}?' + Date.now() + '%22%3E%3C%2Fscript%3E"));\n{{/scripts}}';

function execute(sourceDir, targetDir, taskRunner, processOptions) {

   var sourceFiles,
       jsOutputFile = targetDir + (processOptions.filename || 'scripts.js'),
       jsIncludeFilter = processOptions.include || ['**.js'],
       remoteUrls = processOptions.remote || [],
       concatenatedOutput = '',
       debugFileList = [];

   // task #1 read the directory contents with the supplied filters
   taskRunner.push(function(next) {
      sourceFiles = require('readdir').readSync(sourceDir, jsIncludeFilter);
      next();
   }, 'Scan for all JS files');

   // task #2 when the package should include remote scripts, download them (or read them from the cache)
   remoteLoader(taskRunner, remoteUrls, targetDir);

   // task #3 when the package should include remote scripts, push them to the top of the output
   taskRunner.push(function(next) {
      next(remoteUrls.forEach(function(url) {
         concatenatedOutput += remoteLoader.getContent(url) + '\n\n';
         debugFileList.push(remoteLoader.getName(url));
      }));
   }, 'Concatenate remote scripts');

   // task #4 read all the local file content into the output file
   taskRunner.push(function(next) {
      concatenatedOutput = [concatenatedOutput];
      sourceFiles.forEach(function(sourceFile) {
         console.log('    [CONCAT] ' + sourceFile);
         concatenatedOutput.push(fs.readFileSync(sourceDir + sourceFile, 'utf-8'));
         debugFileList.push(require('path').basename(sourceFile));
      });
      concatenatedOutput = concatenatedOutput.join('\n');
      fs.writeFile(jsOutputFile, concatenatedOutput, 'utf-8', next);
   }, 'Concatenate JS files');

   // task #5 write out a debug file list
   taskRunner.push(function(next) {
      var scripts = {scripts: []};
      debugFileList.forEach(function(fileName) {scripts.scripts.push({source: fileName})});

      fs.writeFile(jsOutputFile.replace(/\.js$/, '.debug.js'), require('hogan').compile(debugFileTemplate).render(scripts), 'utf-8', next);
   }, 'Save debug JS file list to ' + jsOutputFile.replace('.js', '.debug.js'));

   // task #6 minify the output content
   taskRunner.push(function(next) {
      var ast;

      ast = uglifyParser.parse(concatenatedOutput);    // parse code and get the initial AST
      ast = uglify.ast_mangle(ast);          // get a new AST with mangled names
      ast = uglify.ast_squeeze(ast);         // get an AST with compression optimizations

      fs.writeFile(jsOutputFile.replace(/\.js$/, '.min.js'), uglify.gen_code(ast), 'utf-8', next);
   }, 'Save minified JS file');
}

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   var sourceDir = sourcePath + (options.jsSource || 'js').replace(/\/$/, '') + '/';
   var targetDir = targetPath + (options.jsOutput || 'js').replace(/\/$/, '') + '/';

   if(options.processJavascript) {
      taskRunner.push(function(next) {
         var builds = options.configuration.javascript;
         try {
            builds = builds || JSON.parse(fs.readFileSync(sourceDir + 'list.json', 'utf-8'));
            if(!Array.isArray(builds)) {
               throw new TypeError('JavaScript list.json must contain an array of configuration objects.');
            }
         }
         catch (e) {
            console.error('[ERROR] Can not parse list.json for javascript', e);
            process.exit();
         }

         next(builds.forEach(function(build) {
            execute(sourceDir, targetDir, taskRunner, build);
         }));
      }, 'Parsing JS filters file');
   }

};