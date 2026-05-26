console.log('='.repeat(60));
console.log('Simple Worktree Lifecycle Demo');
console.log('='.repeat(60));
console.log();

import readline from 'readline';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { worktrunk } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function expandPath(inputPath) {
  if (!inputPath.startsWith('~')) {
    return inputPath;
  }
  return inputPath.replace('~', os.homedir());
}

function pause(message) {
  if (process.env.SIMPLE_WORKTRUNK_DEMO_AUTO === '1') {
    console.log(message);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`${message}\nPress Enter to continue... `, () => {
      rl.close();
      resolve();
    });
  });
}

function runCommand(cmd, description, cwd) {
  console.log(`\n🔧 ${description}`);
  console.log(`$ ${cmd}`);
  try {
    const output = execSync(cmd, { 
      encoding: 'utf8', 
      cwd: cwd || process.cwd(),
      shell: true,
      stdio: 'pipe'
    });
    if (output && output.trim()) {
      console.log(output);
    }
    return { success: true, output };
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return { success: false, error };
  }
}

function describeWorktree(worktree) {
  const label = worktree.kind === 'worktree' ? worktree.branch : `${worktree.branch} [${worktree.kind}]`;
  console.log(`  - ${label}${worktree.isMain ? ' [MAIN]' : ''}`);
  console.log(`    Path: ${worktree.path || '(no worktree path)'}`);
}

function describeSwitchResult(result) {
  console.log(`   Branch: ${result.branch}`);
  console.log(`   Path: ${expandPath(result.path)}`);
  console.log(`   Action: ${result.action}`);
}

function describeRemoveResult(result) {
  for (const removed of result.removed) {
    console.log(`   Removed: ${removed.branch || '(unknown branch)'}`);
    if (removed.path) {
      console.log(`   Path: ${expandPath(removed.path)}`);
    }
  }
}

async function main() {
  const repoDir = process.env.SIMPLE_WORKTRUNK_DEMO_REPO
    ? path.resolve(process.env.SIMPLE_WORKTRUNK_DEMO_REPO)
    : path.join(__dirname, 'repo');
  
  console.log('📋 This demo will showcase the complete worktree lifecycle using simple-worktrunk.');
  console.log('   Make sure you have the worktrunk CLI (wt) installed!');
  console.log();
  console.log(`📁 Demo will create a git repository at: ${repoDir}`);
  console.log();

  await pause('Step 1: Initialize a git repository');

  if (!fs.existsSync(repoDir)) {
    fs.mkdirSync(repoDir, { recursive: true });
  }
  runCommand('git init', 'Initialize git repository', repoDir);
  runCommand('git config user.email "demo@example.com"', 'Set git email', repoDir);
  runCommand('git config user.name "Demo User"', 'Set git name', repoDir);
  
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Demo Repository\n\nThis is a demo repo for worktree testing.\n');
  fs.writeFileSync(path.join(repoDir, '.gitignore'), 'node_modules/\n*.log\n');
  
  runCommand('git add .', 'Stage files', repoDir);
  runCommand('git commit -m "Initial commit"', 'Create initial commit', repoDir);
  runCommand('git branch -M main', 'Rename branch to main', repoDir);

  await pause('Step 2: Import simple-worktrunk');

  const wt = worktrunk({ baseDir: repoDir });
  console.log('\n✅ simple-worktrunk loaded successfully!');
  console.log();

  await pause('Step 3: List current worktrees');

  console.log('\n📋 Listing all worktrees...');
  const listResult = await wt.list();
  console.log(`Current worktree: ${listResult.current}`);
  console.log('All worktrees:');
  listResult.worktrees.forEach(describeWorktree);

  await pause('Step 4: Create a new worktree');

  console.log('\n🌱 Creating a new worktree named "feature-add-demo"...');
  const createResult = await wt.create('feature-add-demo');
  console.log(`✅ Worktree created!`);
  describeSwitchResult(createResult);

  await pause('Step 5: Make changes in the new worktree');

  console.log('\n📝 Creating new files in the worktree...');
  const worktreePath = expandPath(createResult.path);
  
  console.log(`   Writing to: ${worktreePath}`);
  fs.writeFileSync(path.join(worktreePath, 'demo.js'), 'console.log("Hello from feature branch!");');
  fs.writeFileSync(path.join(worktreePath, 'feature.md'), '# Feature Documentation\n\nThis feature adds demo functionality.\n');
  
  runCommand('git add .', 'Stage new files', worktreePath);
  runCommand('git commit -m "Add demo files"', 'Commit changes', worktreePath);

  await pause('Step 6: List worktrees again');

  console.log('\n📋 Listing all worktrees...');
  const listResult2 = await wt.list();
  console.log(`Current worktree: ${listResult2.current}`);
  console.log('All worktrees:');
  listResult2.worktrees.forEach(describeWorktree);

  await pause('Step 7: Switch to the main worktree');

  console.log('\n🔄 Switching back to main worktree...');
  const switchResult = await wt.switch('main');
  console.log(`✅ Switched to: ${switchResult.branch}`);
  describeSwitchResult(switchResult);

  await pause('Step 8: Switch back to feature worktree');

  console.log('\n🔄 Switching back to feature worktree...');
  const switchResult2 = await wt.switch('feature-add-demo');
  console.log(`✅ Switched to: ${switchResult2.branch}`);
  describeSwitchResult(switchResult2);

  await pause('Step 9: Create another worktree from feature branch');

  console.log('\n🌱 Creating another worktree "feature-hotfix" from the feature branch...');
  const createResult2 = await wt.create({ branch: 'feature-hotfix', base: 'feature-add-demo' });
  console.log(`✅ Worktree created!`);
  describeSwitchResult(createResult2);

  await pause('Step 10: List all worktrees');

  console.log('\n📋 Listing all worktrees...');
  const listResult3 = await wt.list();
  console.log(`Current worktree: ${listResult3.current}`);
  console.log('All worktrees:');
  listResult3.worktrees.forEach(describeWorktree);

  await pause('Step 11: Remove the hotfix worktree');

  console.log('\n🗑️  Removing the hotfix worktree...');
  const removeResult = await wt.remove('feature-hotfix');
  console.log('✅ Worktree removed');
  describeRemoveResult(removeResult);

  await pause('Step 12: Show the main worktree');

  console.log('\n🔄 Locating main worktree...');
  const mainResult = await wt.switch('main');
  console.log(`✅ Main worktree: ${expandPath(mainResult.path)}`);

  await pause('Step 13: Merge feature branch to main');

  console.log('\n🔀 Merging feature-add-demo branch into main...');
  const featureWt = worktrunk({ baseDir: worktreePath });
  const mergeResult = await featureWt.merge({ target: 'main' });
  console.log('✅ Merge finished');
  console.log(`   Target: ${mergeResult.target || 'main'}`);
  console.log(`   Source: ${mergeResult.source || mergeResult.branch || 'feature-add-demo'}`);

  await pause('Step 14: List worktrees after merge');

  console.log('\n📋 Listing all worktrees...');
  const listResult4 = await wt.list();
  console.log(`Current worktree: ${listResult4.current}`);
  console.log('All worktrees:');
  listResult4.worktrees.forEach(describeWorktree);

  await pause('Step 16: Create worktree with base from main');

  console.log('\n🌱 Creating worktree "bugfix" from main branch...');
  const createResult3 = await wt.create({ branch: 'bugfix', base: 'main' });
  console.log(`✅ Worktree created!`);
  describeSwitchResult(createResult3);

  await pause('Step 17: Remove worktree keeping branch');

  console.log('\n🗑️  Removing worktree but keeping the branch...');
  const removeResult2 = await wt.remove({ branches: ['bugfix'], keepBranch: true });
  console.log('✅ Worktree removed, branch kept');
  describeRemoveResult(removeResult2);

  await pause('Step 18: Final worktree listing');

  console.log('\n📋 Final listing of all worktrees...');
  const listResult6 = await wt.list();
  console.log(`Current worktree: ${listResult6.current}`);
  console.log('All worktrees:');
  listResult6.worktrees.forEach(describeWorktree);

  console.log();
  console.log('='.repeat(60));
  console.log('✅ Demo completed!');
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
