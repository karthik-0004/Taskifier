import simpleGit from 'simple-git';

export async function getRecentCommits() {
  try {
    const git = simpleGit(process.cwd());
    const isRepo = await git.checkIsRepo();
    
    if (!isRepo) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await git.log({
      '--since': today.toISOString()
    });

    return Promise.all(log.all.map(async (commit) => {
      let filesChanged = 0;
      try {
        const diff = await git.show(['--stat', '--format=', commit.hash]);
        const match = diff.match(/(\d+)\s+file[s]?\s+changed/);
        if (match && match[1]) {
          filesChanged = parseInt(match[1], 10);
        }
      } catch (e) {
        // ignore
      }

      return {
        hash: commit.hash,
        message: commit.message,
        authorName: commit.author_name,
        authorEmail: commit.author_email,
        date: commit.date,
        filesChanged
      };
    }));
  } catch (error) {
    return [];
  }
}
