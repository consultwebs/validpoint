# Introduction 
This sample validpoint addon module checks a website for the existence of at least one H1 tag.

Use this as an example for creating validpoint addons.

# Getting Started
Copy the addon to a directory that is at the same level as  validpoint, then run:

```
npm install
npm install --save ../validpoint
```

To use validpoint and this addon, initialize a new app, then add validpoint and any addons:

```
mkdir newapp
cd newapp
npm init -y
npm install --save ../validpoint
npm install --save ../website-h1-addon
```

Next, add a `validpoint` entry to your newapp's `package.json`:

```
  "validpoint": {
    "addons": [
	  "website-h1-addon"
    ]
  },
```

Then run your command:

```
./node_modules/.bin/validpoint website-h1 -d consultwebs.com
```

# Making your own validpoint addon
Use this code as a simple example of creating a validpoint addon.

- Create a new node module and include validpoint:
```
npm init -y
npm install --save ../validpoint
```
- Using this addon as an example, create a `validpoint.registry.js` file in the root directory of your new module.
- Create your worker class and function, as identified in the registry to:
	- Perform the test
	- Feed the response into validpoint's Advice mechanism
	- Return an Advice response

# License

`validpoint` is covered under the MIT license.

(MIT License)

Copyright 2020 Consultwebs

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


