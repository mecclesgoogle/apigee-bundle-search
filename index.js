const {downloadBundle, downloadBundles} = require("./lib/apigee-bundle.js");
const {getDeployments} = require("./lib/apigee-deployments.js");
const AdmZip = require('adm-zip');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const commandLineArgs = require('command-line-args');

const search = (org, env, auth, term) => {
  
  getDeployments(org, env, auth)
    .then(deployments => {
      return downloadBundles(org, deployments, auth); 
    })
    .then((bundle_archives) => {
      
      const basedir = `${org}_${env}_proxies`;

      for (let bundle_archive of bundle_archives) {
        const target_directory = path.basename(bundle_archive, '.zip');
        const bundle_zip = new AdmZip(bundle_archive);        
        const bundle_dir = path.join(os.tmpdir(), basedir, target_directory);
        bundle_zip.extractAllTo(/*target path*/bundle_dir, /*overwrite*/true);
      }
      const search = spawn('grep', ['-lnR', term, path.join(os.tmpdir(), basedir)]);

      search.stdout.on('data', (data) => {
      	console.log(`Matches for term '${term}' in following files:`);
      	const matches = data.toString().split(os.EOL);
      	for (let match of matches) {

      		console.log(match.replace(path.join(os.tmpdir(), basedir), ''));
      	}
      	//console.log(`${data}`);
      });
      search.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });
      search.on('close', (code) => {
        console.log(`search process exited with code ${code}`);
      });
      
    })
    .catch( (reason) => {
      console.log('caught error: ' + reason);
    });
};

const auth = 'Basic ' + new Buffer(`${process.env.USERID}:${process.env.USERPASSWORD}`).toString('base64');

//const token = 'Bearer ' + process.env.APIGEE_TOKEN;

const optionDefinitions = [
  { name: 'org', alias: 'o', type: String },
  { name: 'env', alias: 'e', type: String },
  { name: 'term', alias: 't', type: String }
];
const options = commandLineArgs(optionDefinitions);

search(options.org, options.env, auth, options.term);


