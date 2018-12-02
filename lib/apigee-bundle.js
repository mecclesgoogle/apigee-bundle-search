const os = require('os');
const fs = require('fs');
const https = require('https');
const path = require('path');

const tmpDir = os.tmpdir();
const managementUrl = "api.enterprise.apigee.com";

/**
 * download an API proxy bundle for a given revision and save it to a file
 * @param {string} org      - Org name
 * @param {string} api      - API name
 * @param {string} rev      - Revision number
 * @param {string} auth     - Basic Authorization (Base64 encoded)
 * @param {string} filename - file to save to
 */
const downloadBundle = function(org, api, rev, auth, filename) {
  const file = fs.createWriteStream(filename);
  const options = {
    hostname: managementUrl,
    port: 443,
    path: `/v1/o/${org}/apis/${api}/revisions/${rev}?format=bundle`,
    method: 'GET',
    headers: {
      'Authorization': auth
    }
  };

  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let error;
      if (statusCode !== 200) {
        console.error(`Error downloading bundle. HTTP ${statusCode}`);
        res.resume();
        reject(statusCode);
      }
      res.pipe(file);
      file.on('finish', function() {
        file.close(); resolve();  // close() is async, call cb after close completes.
      });
      file.on('error', (error) => {
        console.error(`Error writing file: ${error}`);
        reject(error);
      }); 

    }).on('error', (error) => {
      console.error(`Error downloading file: ${error}`);
      reject(error);
    });
  });
  
}

/**
 * Download proxy bundles for a collection of deployed Proxies
 * @param {string} org          - Org name
 * @param {string} deployments  - a JSON Map structure. key = proxy, value = set of revisions 
 *                                [{"name" : "woof", "revisions" : ["name" : "1"]}]
 * @param {string} auth         - Basic Authorization (Base64 encoded)
 * @returns {Promise[]}         - For each file, the filepath to the ZIP
 */
var downloadBundles = function(org, deployments, auth) {

  var apiRevisions = new Map();
  for (let api of deployments) {
    var revs = new Set();
    for (let rev of api.revision) {
      revs.add(rev.name);
    }
    apiRevisions.set(api.name, revs);
  }

  var promises = [];
  apiRevisions.forEach((revisions, api) => {
    
    for (let rev of revisions) {
      let filename = path.join(tmpDir, org + '_' + api + '_' + rev + '.zip');
      
      var promise = new Promise((resolve, reject) => {
        downloadBundle(org, api, rev, auth, filename).
          then( () => {
            resolve(filename);
          }).catch( statusCode => {
            console.error('error downloading bundle: ' + statusCode);
            reject(statusCode);
          });
      });
      promises.push(promise);
    }

  });
  return Promise.all(promises); 
}

module.exports = { downloadBundles, downloadBundle };