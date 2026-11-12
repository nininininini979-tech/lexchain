'use strict';
importScripts('./modal-syntax.js','./conditional-syntax.js','./conditional-solver.js','./conditional-checker.js');
self.onmessage=e=>{try{const m=e.data;if(m.type==='solve'){const result=LexChainConditional.solve(m.query);result.verification=LexChainConditionalChecker.verify(m.query,result);self.postMessage({type:'result',result});}else if(m.type==='check')self.postMessage({type:'checked',verification:LexChainConditionalChecker.verify(m.query,m.result)});else throw new Error('未知任务');}catch(e){self.postMessage({type:'error',error:e.message});}};
