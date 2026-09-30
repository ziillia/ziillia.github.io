// Crop pixels stay on the device. Termination also releases the worker's WASM heap.
export async function createWorkerReader(onProgress=()=>{},options={}){
  const worker=new Worker(new URL('./recognizer-worker.mjs',import.meta.url),{type:'module'});
  let closed=false,pending=null,sequence=0;
  const abortError=()=>new DOMException('読み取りを中止しました','AbortError');
  function stop(error=abortError()){
    if(closed)return;closed=true;worker.terminate();options.signal?.removeEventListener('abort',abort);
    if(pending){const job=pending;pending=null;clearTimeout(job.timer);job.reject(error);}
  }
  const abort=()=>stop(abortError());
  options.signal?.addEventListener('abort',abort,{once:true});
  if(options.signal?.aborted){stop();throw abortError();}
  worker.onerror=event=>{event.preventDefault();stop(new Error(event.message||'認識エンジンでエラーが発生しました'));};
  worker.onmessageerror=()=>stop(new Error('認識エンジンから結果を受信できませんでした'));
  worker.onmessage=({data})=>{
    if(!pending||data.id!==pending.id)return;
    if(data.type==='progress'){try{onProgress(data.progress);}catch(error){stop(error);}return;}
    if(data.type==='error'){stop(new Error(data.message));return;}
    if(data.type!=='ready'&&data.type!=='result')return;
    const job=pending;pending=null;clearTimeout(job.timer);job.resolve(data);
  };
  function request(type,payload={},transfer=[],timeout=45000){
    if(closed)return Promise.reject(new Error('認識エンジンは終了しました'));
    if(pending)return Promise.reject(new Error('1行ずつ順番に読み取ってください'));
    return new Promise((resolve,reject)=>{
      const id=++sequence;
      pending={id,resolve,reject,timer:setTimeout(()=>stop(new Error(type==='init'?'モデルの準備がタイムアウトしました':'行の読み取りがタイムアウトしました')),timeout)};
      try{worker.postMessage({id,type,...payload},transfer);}catch(error){stop(error);}
    });
  }
  try{
    const ready=await request('init',{},[],120000);
    return{
      metrics:ready.metrics,
      async read(canvas){
        if(closed)throw new Error('認識エンジンは終了しました');
        if(pending)throw new Error('1行ずつ順番に読み取ってください');
        const pixels=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height);
        const reply=await request('read',{width:pixels.width,height:pixels.height,buffer:pixels.data.buffer},[pixels.data.buffer]);
        return reply.result;
      },
      close:()=>stop(),
      dispose:()=>stop()
    };
  }catch(error){stop(error);throw error;}
}
