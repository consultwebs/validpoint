# validpoint
A multipoint validation tool for your web and digital assets.

With `validpoint`'s built-in commands, you can test many common health metrics of your website, such as SSL certificate validity and pending domain name registration expiration. See the **Usage** section below for a list of all built-in commands and configuration options.

`validpoint` was built with a plugin/addon architecture so that new and custom commands can be added to it easily. See the **Addons** section below for more information.

# Installation

For local installation
```
npm install --save @laweval/validpoint
```

For global installation:
```
sudo npm install -g @laweval/validpoint
```

# Usage

The simplest way to use `validpoint` is to run the default commands against your domain:

```
validpoint -d mydomain.com
```

A list of built-in commands:
```
% validpoint --help
USAGE: validpoint <command> -d [domain1,[domain2,...]] [-f file] [-r] [-q] [-h]

Commands:
  validpoint local-network    Test local network connectivity
  validpoint local-dns        Test local DNS resolution
  validpoint http-port        Test response time of web server port 80
  validpoint https-port       Test response time of web server port 443
  validpoint domain           Test domain registrar configuration
  validpoint http-response    Test response code and redirection for http
  validpoint https-response   Test response code and redirection for https
  validpoint website          Combined test of http-port and http-response
  validpoint secure-website   Combined test of https-port and https-response
  validpoint website-content  Test website content for essential content
  validpoint ssl              Test website SSL certificate

Options:
  --version     Show version number                                    [boolean]
  -d, --domain  The domain name or a comma-delimited list of domain names
                                                                        [string]
  -f, --file    Use a JSON file for input configuration                 [string]
  -h, --help    Show this help screen                                  [boolean]
  -r, --raw     Include raw test results
  -q, --quiet   Suppress in-progress output and only show the result
  -i, --input   Input to send to the test
```

To run a specific command (for example):
```
validpoint https-port -d mydomain.com
```

# Optional Configuration

To run `validpoint` automatically or for multiple domains and commands, you may supply configuration files. For global configuration of multiple domains, provide a file called `validpoint.json` and put it in the root directory from which you are running `validpoint`

Example `validpoint.json`:
```
{
	"preflight_commands":
	{
		"local-network": {}, 
		"local-dns": {}
	},
	"commands":
	{
		"http-port": {}, 
		"https-port": {}, 
		"domain": {},
		"http-response": {}, 
		"https-response": {}, 
		"website": {}, 
		"secure-website": {},
		"website-content": {}
	},
	"domains": 
	{
		"mydomain.com": {
			"domain": "mydomain.com",
			"name": "MY Domain",
			"commands": 
			{
				"local-network": {},
				"local-dns": {},
				"domain": {}
			}
		},
		"myotherdomain.com": {
			"domain": "myotherdomain.com",
			"url": "blog.myotherdomain.com",
			"name": "My other domain blog",
			"commands":
			{
				"https-response": {},
				"domain": {},
				"https-port": {}
			}
		}
	}
}
```

`preflight_commands` and `commands` are the default tests that will run if you execute `validpoint` with a domain name and without a command. For example:

```
validpoint -d mydomain.com
```

The contents of the `domains` object defines specific commands to run for multiple domains when no arguments are supplied to `validpoint`. Like this:

```
validpoint
```

The `domains` object accepts the configuration parameters `name`, `domain`, and `url`. Only `domain` is required.

*Note:* Running `validpoint` with no arguments and no `validpoint.json` file displays the help screen.

If you want to have multiple configurations, create a separate JSON file for each configuration and run them using the `-f` flag. For example:

```
validpoint -f myconfig.json
validpoint -f myotherconfig.json
```

Running `validpoint` with no arguments is synonymous with:

```
validpoint -f validpoint.json
```

Note that some commands may accept and/or require input parameters. When they do not, you may use an empty object (`{}`) as the input. An example of a command that accepts input:

```
	"commands":
	{
		"phone-number": 
		{
			"find": "(800) 872-6590",
			"referer": "https://googletagmanager.com",
		}
	}
```

If you are running commands for a single domain or wish to override the commands for a particular domain, provide a JSON file with the domain name as the file name. For example:

`mydomain.com.json`:
```
{
    "name": "My Domain",
	"domain": "mydomain.com",
	"url": "www.mydomain.com",
	"preflight_commands": 
	{
		"local-network": {},
		"local-dns": {}
	},
	"commands":
	{
		"https-port": {},
		"ssl": {},
		"website-content": {}
		"phone-number": 
		{
			"find": "(800) 872-6590",
		}
	}
}
```

Now you can run these tests for `mydomain.com` with:

```
validpoint -d mydomain.com
```

*Note*: If a `mydomain.com.json` file exists, it will override all settings and commands any time you run any command against `mydomain.com`


# Addons

`validpoint`'s addon architecture makes extending functionality simple. 

For an example addon, look at the repository's `addons` directory. It contains a fully-working example, and the README file explains the steps required for using and making addons.

