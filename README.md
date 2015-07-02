# huePi
Philips Hue light control application that is meant to be used with a local server (like a Raspberry Pi) and can also be used with a remote server (to allow access from the internet).

## The Hardware

In order to use this app, you need the following hardware setup:

 * A Philips Hue Bridge and at least one Hue bulb or lightstrip
 * A Raspberry Pi (or other debian based computer) in your home network that is always on
 * [Optional] A web server with a public IP address/domain

## The goal

The goal is to be able to control the ligths in your home using this OpenUI5 based app.

The second goal is to be able to do this remotely, from outside your LAN.

Additionally, mainly because I am forced to use a network provider that does not provide IPv4 adresses to their customers, I will provide a solution to achieve the second goal with the help of a public server.


## Setup

**Work in progress.** Currently you have to make all the setup steps manually; automating some of these is on my todo-list...





### Connecting to the Hue bridge

You can either run the following scripts directly on the local server or run them on your computer (in the same network) and later copy the ~/.huePi folder which contains the bridge configuration

The scripts are located in the tools directory. I tested them on a debian based machine. If you are not using Linux, you can create a user manually as described here: http://www.developers.meethue.com/documentation/getting-started

Log on to your local server with the user that will be used to run the application server.
You must be in the tools directory to run them on the command line:

```sh
. ./findBridge

. ./createUser
```

After running the second command you will be asked to press the button on the bridge. After you've done that the new user will be stored in the file `~/.huePi/bridgeUser`.

### Setting up the local server

The local server is used only to deliver static resources - you can also use apache, lighttp, ngix, gatling or whatever you like best for this task. Nothing special is needed for the server, as the app <a href="https://de.wikipedia.org/wiki/Cross-Origin_Resource_Sharing">accesses the bridge locally</a>.

The only thing that this server script does besides serving static resources is providing the app configuration (i.e. the bridge IP, port and username) under the special resource "/bridgeConfig.json". If you are using a different server, just provide this file with static content.

Install dependencies:

```sh
npm install node-static
```


To use the provided simple server, just start localServer.js:

```sh
node localServer.js
```
The default port for the server is 8888, you can change the default value at the top of the localServer.js file or provide it as a command line argument `--port=9000`.

The app should now be ready under http://[localServer]:[port]/

### [Optional] Remote Server (Web Access)

In order to enable web access, there are two ways:

 1. If your provider gives you an IPv4 address or you only use IPv6, you can simply configure your router to allow access to your local server. This is usually under the "Firewall" or "Port Forwarding" section in your router's configuration interface.
 2. If you do not have an IPv4 address but ssh access to a server, the following sections are for you.

#### Remote Port forwarding / Tunneling

Port forwarding to is done via SSH, which has a low response time and is encrypted.

Create a ssh key on your local server as described in Step 2 of  https://help.github.com/articles/generating-ssh-keys/

Then register that key with the remote server by using `ssh-copy-id [user@server]` so the tunnel can be created automatically on reboot.

Install autossh.

Add the following lines to your /etc/rc.local:
```sh
localUser="ha"
remoteUser="ha"
remoteServer="myserver.invalid"
remotePort="8887"

bridgeIp=$(cat /home/$localUser/.huePi/bridgeIp)
sudo -u "$localUser" autossh -f -N -R $remotePort:$bridgeIp:80 $remoteUser@$remoteServer
```

Set localUser to the username on the local server, remoteUser to the username on the remote server, the remoteServer to your server where you want to host your application online and the remotePort to something that is not used otherwise.

These lines start the SSH tunnel on boot and the connection is restarted whenever it breaks down. Autossh even pings the connection to check if it is still alive.

#### App on remote server

Now you need to make the web application available. There are two ways which I will describe:

 1. Using remoteServer.js standalone
 2. Using apache

##### 1 remoteServer.js standalone

If you use the remoteServer-standalone.js, you do not need to do much, as the nodejs bases server communicates with the tunneled bridge and servers the static resources.

 The only thing you need to do is configure the path to the resources (the app-folder) and the port on which the bridge is tunneled.
 Then you can start the remoteserver.js server from the backend directory using:

```sh
node remoteServer.js
```

The default port for the server is 8888, you can change the default value at the top of the remoteServer.js file or provide it as a command line argument e.g. `--port=9000` - the same goes for the bridgePort which is assumed to be port 8887, it can also be changed via the command line: `--bridgePort=8999`.

The bridge-port must of course be the same as set as "remotePort" in the ssh tunnel.

#### 2 Apache configuration

You can use Apache's <a href="http://httpd.apache.org/docs/current/mod/mod_proxy.html">mod_proxy</a> for this task. The configuration is straight forward, just like any other apache vhost:

Simply add the following lines to the vhost configuration:

```
ProxyPass "/" "http://localhost:8888/"
ProxyPassReverse "/" "http://localhost:8888/"
```

## Local UI5 version

UI5 is currently loaded from the cloud - which is generally a good thing because the cloud CDN is usually faster than your server - but for a local version inside the LAN that might not be true. In that case you can simply extract the runtime zip from http://openui5.org/download.html into a subdirectory of your app-folder on the local server and change the src-attribute of the "sap-ui-bootstrap" script element to the local path.

## TODOs / Known issues

 * Bridge IP is only set once - the IP must be corrected every time no connection t the bridge is available. This is not a problem if your local router always assigns the same IP to the hue bridge.
 * I am assuming that you are using a raspberry pi with the default os as your local server and thus the description is for a debian based machine (ubuntu systems for example work as well). For all other systems you might need to change some steps.
 * Bridge user should only be stored on the local server...
 * The scripts in the tools directory are bash scripts, it would be nice to use nodejs for all tasks
 * Navigation/Deep-Linking is currently not implemented
 * In order for the remote server to work the .huePi directory must be copied to the remote server and thus the bridge user name must be known to the web-application.
