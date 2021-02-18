const actions = require('./actions');

const updateVersion = (action, cwd) => {
    const fs = require('fs');

    const packageJsonPath = `${cwd}/package.json`;
    const packageJson = require(packageJsonPath);

    const currentVersion = packageJson.version.split('.');

    let major = parseInt(currentVersion[0]);
    let minor = parseInt(currentVersion[1]);
    let patch = parseInt(currentVersion[2]);

    if (action == actions.types.Release) {
        minor = minor + 1;
        patch = 0;
    } else if(action == actions.types.MergeBack) {
        patch = patch + 1;
    }

    packageJson.version = `${major}.${minor}.${patch}`;
    return packageJson;
}

exports.updateVersion = updateVersion;