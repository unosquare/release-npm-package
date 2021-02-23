const core = require("@actions/core");
const ops = require("./jsonOperations");
const ghUtilities = require("./utils");
const actions = require("./actions");

const actionType = core.getInput("action-type");
const token = core.getInput("github-token");
const sprint = core.getInput("sprint");
const releaseNotes = core.getInput("release-notes");
const prodBranch = core.getInput("prod-branch");
const repo = core.getInput("repo");

const gh = ghUtilities.getUtilities(repo, token);

const mergeBranch = async (choreBranchName) => {
  const defaultBranchName = await gh.getDefaultBranch();

  const sourceBranch =
    actionType == actions.types.Release ? prodBranch : defaultBranchName;
  const headBranch =
    actionType == actions.types.Release ? defaultBranchName : prodBranch;

  console.log(`Source brach ${sourceBranch} - New Branch ${choreBranchName}`);

  const files = await gh.getFilesThatChanged(sourceBranch, headBranch);
  console.log(`Files that changed ${files.length}`);

  if (files.length == 0) {
    throw new Error("No changes to be merged");
  }

  await gh.createNewBranch(sourceBranch, choreBranchName);
  await gh.mergeBranches(choreBranchName, headBranch);

  const packageJson = await gh.getContent(choreBranchName, "package.json");
  const newJson = ops.updateVersion(packageJson.content, actionType);
  console.log(`Bumping version`);

  await gh.commitContent(
    "package.json",
    `Updating Package Version to ${newJson.version}`,
    Buffer.from(JSON.stringify(newJson, undefined, 4)).toString("base64"),
    packageJson.sha,
    choreBranchName
  );

  console.log(`Creating PR`);
  const pr = await gh.createPR(sourceBranch, choreBranchName);
  const merge = await gh.mergePR(pr.number);
  
  return { merge, newJson };
};

const pushReleaseVersion = async () => {
  console.log("::group::Push Release Version");
  const choreBranchName = `Chore/Sprint${sprint}`;
  const { merge, newJson } = await mergeBranch(choreBranchName);

  await gh.createTag(merge.sha, sprint, releaseNotes);
  console.log("::endgroup::");

  return newJson.version;
};

const pushMergeBackVersion = async () => {
  console.log("::group::Merge Back Version");
  const choreBranchName = `Chore/MergeBackSprint${sprint}`;
  const { _, newJson } = await mergeBranch(choreBranchName);
  console.log("::endgroup::");

  return newJson.version;
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
    core.setFailed(err);
    core.setOutput("success", false);
  });
