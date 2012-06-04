buildproject.js
===============

Series of tools to build source content into a web app.

Installation
============

Install using npm: `npm install buildproject` or check out the latest version from Git.

Usage
=====

Once installed, run using the binary: `buildproject` optional commands can be used to add features. The most useful are:

`-profile profilename` used to run a specific profile, by default will run the profile called "full" or when that isn't found, runs the first profile found.

`-config fullpath` used to set the path to the configuration JSON file, either to the JSON file itself or to the container directory so long as the file is called `buildproject.json`

Additional configuration can be either set in the command line or in the JSON file as part of a profile / settings:

`-sourcePath fullpath` sets the path of the source files, will be prepended to all source content paths in the configuration JSON. If omitted the default is the 'src' directory at the same level as the `buildproject.json` file

`-targetPath fullpath` sets the path of the output files, will be prepended to all output content paths in the configuration JSON. If omitted the default is the 'web' directory at the same level as the `buildproject.json` file

`--verbose` prints a lot of information to the console as the build is running



