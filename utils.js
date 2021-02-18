
const getUtilities = (octokit, repo, process) => {
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

    const mergeBranches = (baseBranch, headBranch) =>
        octokit.repos.merge({
            owner: repo.owner,
            repo: repo.repo,
            base: baseBranch,
            head: headBranch,
            commit_message: `Merging ${headBranch}`
        });

    const createAndMergePR = async (baseBranch, headBranch) => {
        const pr = await octokit.pulls.create({
            owner: repo.owner,
            repo: repo.repo,
            head: headBranch,
            base: baseBranch,
            title: headBranch
          });
      
          const merge = await octokit.pulls.merge({
              owner: repo.owner,
              repo: repo.repo,
              pull_number: pr.data.number
          });

          return merge.data;
    };

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
            committer: {
                name: process.env.GITHUB_ACTOR,
                email: `${process.env.GITHUB_ACTOR}@users.noreply.github.com`,
            },
            author: {
                name: process.env.GITHUB_ACTOR,
                email: `${process.env.GITHUB_ACTOR}@users.noreply.github.com`,
            },
            branch: branch
        });

    return {
        createTag,
        getDefaultBranch,
        createNewBranch,
        mergeBranches,
        createAndMergePR,
        deleteBranch,
        getContent,
        commitContent
    };
};

exports.getUtilities = getUtilities;