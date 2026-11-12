'use strict';
importScripts('./modal-syntax.js','./modal-kd.js','./modal-checker.js');
self.onmessage=event=>{
 const {type,query,result}=event.data;
 try{
  if(type==='solve'){
   const answer=LexChainKD.solve(query);answer.verification=LexChainKDChecker.verify(query,answer);self.postMessage({type:'solved',result:answer});
  }else if(type==='check')self.postMessage({type:'checked',verification:LexChainKDChecker.verify(query,result)});
  else throw new Error('不支持的操作');
 }catch(error){self.postMessage({type:'error',error:error.message});}
};
