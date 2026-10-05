import assert from 'node:assert/strict';
const repo='Cesar-C-C/kids-books';
const sha=process.env.GITHUB_SHA;
assert.match(sha||'',/^[a-f0-9]{40}$/,'Deployment must bind an exact commit');
assert.equal(process.env.GITHUB_REPOSITORY,repo,'Wrong repository');
assert.equal(process.env.GITHUB_REF,'refs/heads/main','Deployments are main-only');
assert.equal(process.env.GITHUB_EVENT_NAME,'workflow_dispatch','Deployment requires explicit dispatch after CI');
const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'kids-books-pages-gate',Authorization:`Bearer ${process.env.GITHUB_TOKEN}`};
async function api(suffix) {
  const r=await fetch(`https://api.github.com/repos/${repo}/${suffix}`,{headers,signal:AbortSignal.timeout(30000)});
  assert.ok(r.ok,`GitHub read HTTP ${r.status}`);return r.json();
}
const main=await api('git/ref/heads/main');
assert.equal(main.object.sha,sha,'Refusing stale/non-main deployment');
const runs=(await api(`actions/runs?head_sha=${sha}&event=push&per_page=100`)).workflow_runs;
const passed=[];
for(const workflow of ['.github/workflows/pwa.yml','.github/workflows/labs.yml']) {
  const latest=runs.filter(r=>r.path===workflow && r.head_sha===sha && r.head_branch==='main').sort((a,b)=>b.id-a.id)[0];
  assert.ok(latest,`Required main CI did not run: ${workflow}`);
  assert.equal(latest.status,'completed',`Required CI is still running: ${workflow}`);
  assert.equal(latest.conclusion,'success',`Required CI has not passed: ${workflow}`);
  passed.push({path:workflow,id:latest.id,attempt:latest.run_attempt,url:latest.html_url});
}
console.log(JSON.stringify({status:'PASS_EXACT_MAIN_CI_GATE',sha,passed},null,2));
