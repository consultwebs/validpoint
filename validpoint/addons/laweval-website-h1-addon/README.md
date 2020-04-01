# Introduction 
This validpoint addon module checks a website for the existence of at least one H1 tag.

Use this as an example for creating validpoint addons.

# Getting Started
Copy the addon to a directory that is at the same level as  validpoint, then run:

```
npm install
npm install --save validpoint
```

To use validpoint and its addon, initialize a new app, then add validpoint and any addons:

```
mkdir newapp
cd newapp
npm init -y
npm install --save ../validpoint
npm install --save ../laweval-website-h1-addon
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


