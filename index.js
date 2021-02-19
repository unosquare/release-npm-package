const core = require("@actions/core");
const ops = require("./jsonOperations");
const ghUtilities = require("./utils");
const actions = require("./actions");

const actionType = core.getInput("action-type");
const token = core.getInput("github_token");
const sprint = core.getInput("sprint");
const releaseNotes = core.getInput("release-notes");
const prodBranch = core.getInput("prod-branch");

const gh = ghUtilities.getUtilities(token);

const pushReleaseVersion = async () => {
  const choreBranchName = `Chore/Sprint${sprint}`;
  const defaultBranchName = await gh.getDefaultBranch();

  const files = await gh.getFilesThatChanged(prodBranch, defaultBranchName);

  if (files.length == 0) {
    throw new Error("No changes to be merged");
  }

  await gh.createNewBranch(prodBranch, choreBranchName);
  await gh.mergeBranches(choreBranchName, defaultBranchName);

  const packageJson = await gh.getContent(choreBranchName, "package.json");
  const newJson = ops.updateVersion(packageJson.content, actionType);
  await gh.commitContent(
    "package.json",
    `Updating Package Version to ${newJson.version}`,
    Buffer.from(JSON.stringify(newJson, undefined, 4)).toString("base64"),
    packageJson.sha,
    choreBranchName
  );

  const pr = await gh.createPR(prodBranch, choreBranchName);
  const merge = await gh.mergePR(pr.number);
  await gh.deleteBranch(choreBranchName);

  await gh.createTag(merge.sha, sprint, releaseNotes);
  return newJson.version;
};

const pushMergeBackVersion = async () => {
  throw new Error("Not Implemented");
};

const action =
  actionType === actions.types.Release
    ? pushReleaseVersion
    : pushMergeBackVersion;

action()
  .then((version) => {
    core.info(`Successfully Released Package Version: ${version}`);
    core.setOutput("success", true);
  })
  .catch((err) => {
    core.error(err);
    core.setOutput("success", false);
  });
