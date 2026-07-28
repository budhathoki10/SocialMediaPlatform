#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import process from 'node:process';

function printHelp() {
  console.log(`Usage:
  node scripts/git-feature-workflow.js --feature "Add a new dashboard widget" [options]

Options:
  --feature, --message, --description   Feature description used to build the commit message
  --branch <name>                       Branch name to create from master
  --base-branch <name>                  Base branch to branch from (default: master)
  --remote <name>                       Remote name to use for pull/push (default: origin)
  --merge-to-master                     Merge the feature branch into master after committing
  --push                                Push the feature branch and master after the workflow
  --execute                             Run the git commands instead of only showing the plan
  --help                                Show this help message

Examples:
  node scripts/git-feature-workflow.js --feature "add an analytics dashboard" --execute
  node scripts/git-feature-workflow.js --feature "add an analytics dashboard" --branch feature/analytics-dashboard --merge-to-master --push --execute
`);
}

function parseArgs(argv) {
  const options = {
    execute: false,
    mergeToMaster: false,
    push: false,
    baseBranch: 'master',
    remote: 'origin',
    feature: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--feature':
      case '--message':
      case '--description':
        options.feature = argv[index + 1] || '';
        index += 1;
        break;
      case '--branch':
        options.branch = argv[index + 1] || '';
        index += 1;
        break;
      case '--base-branch':
        options.baseBranch = argv[index + 1] || options.baseBranch;
        index += 1;
        break;
      case '--remote':
        options.remote = argv[index + 1] || options.remote;
        index += 1;
        break;
      case '--merge-to-master':
        options.mergeToMaster = true;
        break;
      case '--push':
        options.push = true;
        break;
      case '--execute':
        options.execute = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (!options.feature) {
          options.feature = arg;
        }
        break;
    }
  }

  return options;
}

function sanitizeBranchName(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildCommitMessage(feature) {
  const trimmed = feature.replace(/\s+/g, ' ').trim();
  const title = trimmed.length > 0 ? trimmed : 'update project workflow';
  return `feat: ${title}\n\nImplement the requested feature work with a clear, descriptive commit message and keep the change focused on the described behavior.`;
}

function runGit(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function runGitSilently(repoRoot, args) {
  try {
    return runGit(repoRoot, args);
  } catch {
    return '';
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help || !options.feature) {
    printHelp();
    process.exit(options.help ? 0 : 1);
  }

  const repoRoot = runGit(process.cwd(), ['rev-parse', '--show-toplevel']);
  const currentBranch = runGitSilently(repoRoot, ['branch', '--show-current']);
  const baseBranch = options.baseBranch || 'master';
  const branchName = options.branch || `feature/${sanitizeBranchName(options.feature)}`;
  const commitMessage = buildCommitMessage(options.feature);

  const plan = [];
  plan.push(`Repository: ${repoRoot}`);
  plan.push(`Current branch: ${currentBranch || '(detached)'}`);
  plan.push(`Feature: ${options.feature}`);
  plan.push(`Branch: ${branchName}`);
  plan.push(`Base branch: ${baseBranch}`);
  plan.push(`Commit message: ${commitMessage.replace(/\n/g, ' | ')}`);
  plan.push('');
  plan.push(`git checkout ${baseBranch}`);
  plan.push(`git pull ${options.remote} ${baseBranch}`);
  plan.push(`git checkout -B ${branchName}`);
  plan.push('git add -A');
  plan.push(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

  if (options.mergeToMaster) {
    plan.push(`git checkout ${baseBranch}`);
    plan.push(`git merge --no-ff ${branchName} -m "Merge branch '${branchName}' into ${baseBranch}"`);
  }

  if (options.push) {
    plan.push(`git push -u ${options.remote} ${branchName}`);
    if (options.mergeToMaster) {
      plan.push(`git push ${options.remote} ${baseBranch}`);
    }
  }

  console.log('Planned workflow:');
  console.log(plan.join('\n'));

  if (!options.execute) {
    console.log('\nDry run only. Re-run with --execute to perform the workflow.');
    return;
  }

  const status = runGitSilently(repoRoot, ['status', '--porcelain']);
  if (!status) {
    console.log('There are no local changes to commit.');
    return;
  }

  console.log('\nExecuting workflow...');
  runGit(repoRoot, ['checkout', baseBranch]);
  runGit(repoRoot, ['pull', options.remote, baseBranch]);
  runGit(repoRoot, ['checkout', '-B', branchName]);
  runGit(repoRoot, ['add', '-A']);
  runGit(repoRoot, ['commit', '-m', commitMessage]);

  if (options.mergeToMaster) {
    runGit(repoRoot, ['checkout', baseBranch]);
    runGit(repoRoot, ['merge', '--no-ff', branchName, '-m', `Merge branch '${branchName}' into ${baseBranch}`]);
  }

  if (options.push) {
    runGit(repoRoot, ['push', '-u', options.remote, branchName]);
    if (options.mergeToMaster) {
      runGit(repoRoot, ['push', options.remote, baseBranch]);
    }
  }

  console.log('Workflow completed.');
}

main();
