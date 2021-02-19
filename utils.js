const github = require('@actions/github');

const getUtilities = (token) => {
    const octokit = github.getOctokit(token);
    const repo = github.context.repo;

    const createTag = async (objectSha, sprint, releaseNotes) => {
        const tag = await octokit.git.createTag({
            owner: repo.owner,
            repo: repo.repo,
            object: objectSha,
            message: releaseNotes,
            tag: `${sprint}`,
            type: 'commit',
        });

        await octokit.git.createRef({
            owner: repo.owner,
            repo: repo.repo,
            sha: tag.data.object.sha,
            ref: `refs/tags/${sprint}`
        });

        await octokit.repos.createRelease({
            owner: repo.owner,
            repo: repo.repo,
            tag_name: sprint,
            name: `Release ${sprint}`,
            body: releaseNotes
        });
    };

    const getDefaultBranch = async () => {
        const repository = await octokit.repos.get({
            owner: repo.owner,
            repo: repo.repo
        });
    
        return repository.data.default_branch;
    };

    const createNewBranch = async (baseBranch, newBranchName) => {
        const newRef = `refs/heads/${newBranchName}`;

        const masterBranch = await octokit.git.getRef({
            owner: repo.owner,
            repo: repo.repo,
            ref: `heads/${baseBranch}`
        });
        
        await octokit.git.createRef({
            owner: repo.owner,
            repo: repo.repo,
            ref: newRef,
            sha: masterBranch.data.object.sha
        });
    };

    const mergeBranches = async (baseBranch, headBranch) => {
        const merge = await octokit.repos.merge({
            owner: repo.owner,
            repo: repo.repo,
            base: baseBranch,
            head: headBranch,
            commit_message: `Merging ${headBranch}`
        });

        return merge.data;
    }

    const getFilesThatChanged = async (baseBranc, headBranch) => {
        const result = await octokit.repos.compareCommits({
            owner: repo.owner,
            repo: repo.repo,
            base: baseBranc,
            head: headBranch
        });

        return result.data.files;
    }

    const createPR = async (baseBranch, headBranch) => {
        const pr = await octokit.pulls.create({
            owner: repo.owner,
            repo: repo.repo,
            head: headBranch,
            base: baseBranch,
            title: headBranch
          });

          return pr.data;
    };

    const mergePR = async (prNumber) => {
        const merge = await octokit.pulls.merge({
            owner: repo.owner,
            repo: repo.repo,
            pull_number: prNumber
        });

        return merge.data;
    }

    const closePR = (prNumber) =>
        octokit.pulls.update({
            owner: repo.owner,
            repo: repo.repo,
            pull_number: prNumber,
            state: 'closed'
        });

    const deleteBranch = (branchName) =>
        octokit.git.deleteRef({
            owner: repo.owner,
            repo: repo.repo,
            ref: `heads/${branchName}`
        });

    const getContent = async (branch, path) => {
        const ref = `refs/heads/${branch}`;
        const packageJson = await octokit.repos.getContent({ 
            owner: repo.owner,
            repo: repo.repo,
            path: path,
            ref: ref
        });

        return packageJson.data;
    };

    const commitContent = (path, message, content, sha, branch) =>
        octokit.repos.createOrUpdateFileContents({
            owner: repo.owner,
            repo: repo.repo,
            path: path,
            message: message,
            content: content,
            sha: sha,
            branch: branch
        });

    return {
        createTag,
        getDefaultBranch,
        createNewBranch,
        mergeBranches,
        createPR,
        deleteBranch,
        getContent,
        commitContent,
        mergePR,
        closePR,
        getFilesThatChanged
    };
};

exports.getUtilities = getUtilities;