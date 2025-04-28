# Overview
`actual-proxy` is a proxy service which exposes a filesocket-based communication channel to other systems (Ex/ [MMM-Actual](https://github.com/trumpetx/MMM-Actual)).  This same concept/strategy could be used to build a REST API, but that is **not** the goal of this proxy server.

# Install
```bash
git clone https://github.com/trumpetx/actual-proxy.git
cd actual-proxy
nano package.json # Update the @actual-app/api version to match the version of your server
npm i && npm rebuild
```

# Run
## Option 1: Pass Paramerers Via Socket, use default values
```bash
node ./proxy.js &
```
Launch a simple socket client and pass in a JSON request as a string (requires `nc`):
```bash
echo '{
  "dataDir": "/home/<USERID>/.budget/",
  "serverURL": "https://192.168.10.207:5006",
  "password": "<YOUR PASSWORD>",
  "budgetSyncId": "a6d25fdb-4014-494d-b6ee-7fcb33016a64",
  "categories": [ "Food", "General", "Bills", "Savings" ]
}' | nc -U /tmp/actual-proxy.sock
```
If things go well, the output will be something like:
```json
{"categories":[{"name":"Travel","display":-106.72},{"name":"Kids","display":-153.98},{"name":"Entertainment","display":-292.13},{"name":"Healthcare","display":-190.43},{"name":"Food","display":-233.9},{"name":"General","display":-291.34},{"name":"Bills","display":-2382.23}]}
```
If things did not go well, see the FAQ!

## Option 2: Use Environment Variables
```bash
# Set Environment Variables
# NODE_TLS_REJECT_UNAUTHORIZED=0 \ # If you're using self-signed SSL and want the easy way
# NODE_EXTRA_CA_CERTS=/path/to/public/key.pem \ # If you're using self-signed SSL and want the correct way
ACTUAL_SOCK_FILE=/tmp/acutal-proxy.sock \
ACTUAL_SERVER_URL=https://192.168.10.207:5006 \
ACTUAL_BUDGET_DATA_DIR=~/.budget \
ACTUAL_BUDGET_PASSWORD=<YOUR PASSWORD> \
ACTUAL_BUDGET_SYNC_ID=a6d25fdb-4014-494d-b6ee-7fcb33016a64 \
ACTUAL_BUDGET_CATEGORIES=Food,General,Bills,Savings \
node ./proxy.js
```
Launch a simple socket client and send the smallest valid JSON object as input (the environment variables will handle everything) (requires `nc`):
```bash
echo '{}' | nc -U /tmp/actual-proxy.sock
```
If things go well, the output will be something like:
```json
{"categories":[{"name":"Travel","display":-106.72},{"name":"Kids","display":-153.98},{"name":"Entertainment","display":-292.13},{"name":"Healthcare","display":-190.43},{"name":"Food","display":-233.9},{"name":"General","display":-291.34},{"name":"Bills","display":-2382.23}]}
```
If things did not go well, see the FAQ!


# FAQ
## Error updating Error: out-of-sync-migrations
Your version of Actual does not match the version in `package.json`.  This is an unfortunate side effect of how the Actual API is architected: https://actualbudget.org/docs/api/

### Stable Releases
Simply match the version of your Actual Budet installation to the version used by `acutal-proxy` and run `npm i && npm rebuild` again.

Your `package.json` file dependencies section:
```
    "dependencies": {
        "@actual-app/api": "^25.3.1"
    }
```

### Edge Releases
If you're using an EDGE release, be forewarned, this means checking out and building the Actual API yourself.  See https://actualbudget.org/docs/contributing/releasing for more information about how to do that.  You need to know what you're doing to go down this road.  You'll need to expand the explicit dependency to include `crdt` as well as the `api` package.

Once you've built it, change your package.json dependencies to something like this:
```
    "dependencies": {
        "@actual-app/api": "/home/pi/actual/packages/api/",
        "@actual-app/crdt": "/home/pi/actual/packages/crdt/"
    }
```
(this assumes you checked out the Actual Budget project to ~/actual and ran `yarn && yarn build` inside of the api and crdt packages)

## PostError: PostError: network-failure
Your SSL certificate is not valid, in order to overcome this, use `NODE_TLS_REJECT_UNAUTHORIZED=0` or `NODE_EXTRA_CA_CERTS=/path/to/public/key.pem` as environment variables when you launch node.  See the [Actual Budget documentation](https://actualbudget.org/docs/api/#self-signed-https-certificates) for more information.
