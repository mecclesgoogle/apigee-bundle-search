const https = require('https');
const managementUrl = "api.enterprise.apigee.com";

/**
 * Download proxy bundles for a collection of deployed Proxies
 * @param {string} org          - Org name
 * @param {string} env          - Env name
 * @param {string} auth         - Basic Authorization (Base64 encoded)
 * @returns {Promise}           - A JSON Map of deployments
 */
const getDeployments = (org, env, auth, api, includeServerStatus, includeApiConfig) => {
  let path = "";
  if (typeof api === "undefined") { //all proxy in env deployments
    path = '/v1/o/' + org + '/e/' + env + '/deployments';
  } else {                          //proxy deployments for env
    path = '/v1/o/' + org + '/e/' + env + '/apis/' + api + '/deployments';
  }
  //includeServerStatus=false&includeApiConfig=false will speed this up considerably
  path += `?includeServerStatus=${includeServerStatus ? "true" : "false"}&includeApiConfig=${includeApiConfig ? "true" : "false"}`

  const options = {
    hostname: managementUrl,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': auth
    }
  };
  return new Promise((resolve, reject) => {
    https.get(options, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        console.error(error.message);
        // consume response data to free up memory
        res.resume();
        reject(error);
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const deployments = JSON.parse(rawData);
          if (typeof deployments.aPIProxy !== "undefined" ) {
            resolve(deployments.aPIProxy);
          } else {
            resolve([deployments]);
          }
        } catch (e) {
          reject(e.message);
        }
      });

    }).on('error', (e) => {
      reject(e.message);
    });

  });
}

module.exports = { getDeployments };