
"use strict";

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 * @param {TaskRunner} taskRunner
 * @param {Object} options
 */
module.exports = function(sourcePath, targetPath, taskRunner, options) {

   var outputFilePath = targetPath + (options.templateOutput || 'js/templates.js');

   // run the templates build
   if(options.processTemplates) {
      (function() {
         var Hogan = require('hogan'),
            fs = require('fs'),
            templatePath = sourcePath + (options.templatePath || 'templates').replace(/\/$/, '') + '/',
            includeFilters = ['*.html'],
            templates;

         taskRunner.push(function(next) {
            try {
               var includes = JSON.parse(fs.readFileSync(templatePath + 'list.json', 'utf-8')).client;
               includeFilters = [];
               for(var templateName in includes) {
                  includeFilters.push(templateName + '.html');
               };
            }
            catch (e) {
               console.warn(e.toString());
            }
            next();
         }, 'read template listing')

         taskRunner.push(function(next) {
            templates = require('readdir').readSync(templatePath, includeFilters);
            next();
         }, 'read templates');

         taskRunner.push(function(next) {
            var commentRegex = /<!\-\-([^--]+)-->/g,
                scriptRegex = /<\/script>/g,
                scriptReplacement = '" + decodeURIComponent("' + encodeURIComponent('</script>') + '") + "';

            templates.forEach(function(templateName, index) {

               var key = templateName.replace(/\..*$/, '');

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
         }, 'compile templates');

         taskRunner.push(function(next) {
            var outputTemplate = Hogan.compile("var templates = {}; {{#templates}} templates['{{name}}'] = new Hogan.Template({{{template}}}); {{/templates}}");
            fs.writeFile(
               outputFilePath,
               outputTemplate.render({templates: templates}), 'utf-8', next);
         }, 'Save compiled template to ' + outputFilePath);

      }());
   }

};