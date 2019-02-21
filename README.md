# apigee-bundle-search

A tool to help find references and inter-dependencies between environment configuration and API proxies.

## Getting Started

Requires 'grep' command so only works on linux based machine.
git clone https://github.com/mecclesgoogle/apigee-bundle-search.git
npm install

## Authentication
The tool requires either Basic Auth credentials or JWT token to be supplied.

1. Basic Auth

Set the following environment variables
* USERID
* USERPASSWORD

2. JWT

Set the following environment variable
* APIGEE_TOKEN 
Use the get_token tool https://docs.apigee.com/api-platform/system-administration/auth-tools

## Run
node index.js -o org -e env -t search_term -u $USERID -p $USERPASSWORD

node index.js -o org -e env -t search_term -j $APIGEE_TOKEN

## Cmd line args:

| Arg    | Value   | Mandatory |
| --------|---------|-----------|
| -o  | Organization name | Y |
| -e | Environment name | Y |
| -t | Search term | Y |
| -u | Apigee Username | N |
| -p | Apigee password | N |
| -j | Apigee JWT token | N |
