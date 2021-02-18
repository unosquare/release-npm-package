const core = require('@actions/core');
const github = require('@actions/github');
const ops = require('./jsonOperations');
const ghUtilities = require('./utils');
const actions = require('./actions');

const actionType = core.getInput('action-type');
const token = core.getInput('github_token');
const sprint = core.getInput('sprint');
const releaseNotes = core.getInput('release-notes');
const prodBranch = core.getInput('prod-branch');

const octokit = github.getOctokit(token);
const repo = github.context.repo;
const gh = ghUtilities.getUtilities(octokit, repo, process);

const pushReleaseVersion = async () => {
    const choreBranchName = `Chore/Sprint${sprint}`;
    
    const defaultBranchName = await gh.getDefaultBranch();
    await gh.createNewBranch(prodBranch, choreBranchName);
    await gh.mergeBranches(choreBranchName, defaultBranchName);
    
    const newJson = ops.updateVersion(actionType, process.cwd());
    const packageJson = await gh.getContent(choreBranchName, 'package.json');
    await gh.commitContent(
        'package.json',
        `Updating Package Version to ${newJson.version}`,
        Buffer.from(JSON.stringify(newJson, undefined, 4)).toString('base64'),
        packageJson.sha,
        choreBranchName);

    const merge = await gh.createAndMergePR(prodBranch, choreBranchName);
    await gh.deleteBranch(choreBranchName);

    await gh.createTag(merge.sha, sprint, releaseNotes);
    return newJson.version;
};

const pushMergeBackVersion = async () => {
    throw new Error('Not Implemented');
}

const action = actionType === actions.types.Release ? pushReleaseVersion : pushMergeBackVersion;

action()
.then((version) => {
    core.info(`Successfully Released Package Version: ${version}`);
})
.catch((err) => {
    core.error(err);
});