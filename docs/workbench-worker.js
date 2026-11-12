'use strict';
// Dedicated computation worker keeps large experimental runs away from the UI thread.
self.window=self;
importScripts('./engine-browser.js','./modal-syntax.js','./conditional-syntax.js','./conditional-solver.js','./conditional-checker.js','./integration-hash.js','./integration-timeline.js','./integration-evidence.js','./integration-governance.js','./integration-history.js','./integration-case-engine.js','./integration-checker.js','./workbench-schema.js','./workbench-chain.js','./workbench-checker.js','./workbench-governance.js','./workbench-annotations.js','./workbench-experiments.js','./workbench-workspace.js');
onmessage=e=>{try{const {state,type,payload,assets}=e.data;postMessage({ok:true,payload:LexChainWorkspace.prepare(state,type,payload,assets)});}catch(error){postMessage({ok:false,error:error.message});}};
