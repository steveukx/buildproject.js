
"use strict";

var fs = require('fs');
var path = require('path');
var XHR = require('xhrequest');

/**
 * Downloads the supplied URLs
 *
 * @constructor
 * @name
 *
 * @param {TaskRunner} taskRunner
 * @param {String[]} remoteFiles Array of URLs
 * @param {String} targetDir The path to save downloaded files
 */
function RemoteLoader(taskRunner, remoteFiles, targetDir) {
   if(!Array.isArray(remoteFiles)) throw new Error('RemoteLoader cannot execute without an array of files to load.');

   taskRunner.push(function(next) {
      var remoteTaskRunner = new (require('task-runner').TaskRunner);
      remoteFiles.forEach(function(url) {
         if(RemoteLoader.cache[url]) return;

         remoteTaskRunner.push(function(next) {
            XHR(url, {
               success: function(data) {
                  RemoteLoader.cache[url] = {
                     content: data,
                     baseName: path.basename(url)
                  };
                  if(targetDir) {
                     require('fs').writeFile(targetDir + RemoteLoader.cache[url].baseName, data, 'utf-8', next);
                  }
                  else {
                     next();
                  }
               },
               error: function(e) { throw new Error(e) }
            });
         }, 'Fetching ' + url);
      });
      remoteTaskRunner.start(next);
   }, 'Fetch remote content');
}

RemoteLoader.getContent = function(url) {
   return RemoteLoader.cache[url] ? RemoteLoader.cache[url].content : '';
};

RemoteLoader.getName = function(url) {
   return RemoteLoader.cache[url] ? RemoteLoader.cache[url].baseName : '';
};

RemoteLoader.cache = {};


module.exports = RemoteLoader;
