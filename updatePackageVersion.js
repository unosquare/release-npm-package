var fs = require('fs');

const packageJsonPath = './package.json';
const packageJson = require(packageJsonPath);
packageJson.version = process.argv[2];

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 4));