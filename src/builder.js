(function() {

   "use strict";

   function buildProject(sourcePath, targetPath, commands, callback) {

      var taskRunner = new (require('task-runner').TaskRunner);

      console.log('');
      console.log('Source Directory', sourcePath);
      console.log('Target Directory', targetPath);
      console.log('');

      (require('./stages/process-clean.js'))(sourcePath, targetPath, taskRunner, commands);
      (require('./stages/process-create-output.js'))(sourcePath, targetPath, taskRunner, commands);
      (require('./stages/process-templates.js'))(sourcePath, targetPath, taskRunner, commands);
      (require('./stages/process-javascript.js'))(sourcePath, targetPath, taskRunner, commands);
      (require('./stages/process-css.js'))(sourcePath, targetPath, taskRunner, commands);
      (require('./stages/process-less.js'))(sourcePath, targetPath, taskRunner, commands);
      (require('./stages/process-links.js'))(sourcePath, targetPath, taskRunner, commands);

      taskRunner.start(typeof callback == 'function' ? callback : function() {
         console.log('[STATUS] Complete')
      });
   };

   module.exports = function(sourcePath, targetPath, commands, callback) {
      buildProject(sourcePath.replace('\/$', '') + '/', targetPath.replace('\/$', '') + '/', commands, callback);
   };

}());