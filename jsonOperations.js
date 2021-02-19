const actions = require('./actions');
const semver = require('semver');

const updateVersion = (content, actionType) => {
    var decodedContent = Buffer.from(content, 'base64'); 
    const packageJson = JSON.parse(decodedContent);

    const level = actionType == actions.types.Release ? 'minor' : 'patch';
    packageJson.version = semver.inc(packageJson.version, level);

    return packageJson;
}

exports.updateVersion = updateVersion;