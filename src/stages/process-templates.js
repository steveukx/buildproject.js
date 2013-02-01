
/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   "use strict";

   var outputFilePath = targetPath + (options.templateOutput || 'js/templates.js');

   // run the templates build
   if(options.processTemplates) {
      (function() {
         var Hogan = require('hogan.js'),
            fs = require('fs'),
            templatePath = sourcePath + (options.templatePath || 'templates').replace(/\/$/, '') + '/',
            includeFilters = ['*.html'],
            templates,
            templateRuns = null;

         var processTemplateBatch = function(next) {
            this.templateFiles = require('readdir').readSync(templatePath, this.source);
            next();
         };

         var concatenateTemplateBatch = function(next) {
            var commentRegex = /<!\-\-([^--]+)-->/g,
                scriptRegex = /<\/script>/g,
                scriptReplacement = '" + decodeURIComponent("' + encodeURIComponent('</script>') + '") + "',
                templates = this.templateFiles,
                flattenPaths = !!this.flattenPaths;

            templates.forEach(function(templateName, index) {

               var key = (flattenPaths ? require('path').basename(templateName) : templateName).replace(/\..*$/, '');

               console.log('    [TEMPLATE] ', templatePath + templateName, key);

               templates[index] = {
                  name: key,
                  template: Hogan.compile(
                     fs.readFileSync(templatePath + templateName, 'utf-8').replace(/\s+/g, ' '),
                     { asString: 1 }
                  ).replace(scriptRegex, scriptReplacement)
                   .replace(commentRegex, '')
               };
            });
            next();
         };

         var compileTemplateBatch = function(next) {
            console.log('    [TEMPLATE-OUTPUT] Saving template batch to ' + targetPath + this.filename);
            var variable = this.variable || 'templates',
                variablePrefix = (variable.indexOf('.') < 0) ? 'var ' : '';

            var outputTemplate = Hogan.compile("{{variablePrefix}}{{variable}} = {}; {{#templates}} {{variable}}['{{name}}'] = new Hogan.Template({{{template}}}); {{/templates}}");
            fs.writeFile(
               targetPath + this.filename,
               outputTemplate.render({templates: this.templateFiles, variable: this.variable, variablePrefix: variablePrefix}), 'utf-8', next);
         };

         taskRunner.push(function(next) {
            try {
               templateRuns = JSON.parse(fs.readFileSync(templatePath + 'list.json', 'utf-8'));
               if(!Array.isArray(templateRuns)) {
                  throw new TypeError('Templates list.json must contain an array of configuration objects.');
               }
            }
            catch (e) {
               console.error('[ERROR] Can not parse list.json for templates', e);
               process.exit();
            }

            templateRuns.forEach(function(templateBatch, index) {
               if(!templateBatch.filename) {
                  throw new SyntaxError('Templates list.json must contain a filename attribute for each entry');
               }

               if(!templateBatch.variable) {
                  console.warn('  [WARN] TemplateBatch ' + index + ' does not specify a variable name, using default of "templates"');
                  templateBatch.variable = 'templates';
               }

               taskRunner.push( processTemplateBatch.bind(templateBatch), 'Processing template batch ' + index );
               taskRunner.push( concatenateTemplateBatch.bind(templateBatch), 'Read individual template in batch ' + index );
               taskRunner.push( compileTemplateBatch.bind(templateBatch), 'Compile template in batch ' + index );
            });

            next();
         }, 'read template listing');

      }());
   }
};