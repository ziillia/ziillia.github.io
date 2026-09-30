import {createRecognitionOnly} from '../tools/ocr-lab/recognition-only.mjs';

let reader=null,busy=false,initializing=false;
self.onmessage=async({data})=>{
  const {id,type}=data||{};
  try{
    if(type==='init'){
      if(reader||initializing)throw new Error('Recognizer is already initialized');
      initializing=true;
      try{reader=await createRecognitionOnly({onProgress:progress=>self.postMessage({id,type:'progress',progress})});}
      finally{initializing=false;}
      self.postMessage({id,type:'ready',metrics:reader.metrics});return;
    }
    if(type!=='read')throw new Error('Unknown worker request');
    if(!reader)throw new Error('Recognizer is not ready');
    if(busy)throw new Error('Recognizer accepts one image at a time');
    busy=true;
    try{
      const result=await reader.readPixels({width:data.width,height:data.height,data:new Uint8ClampedArray(data.buffer)});
      self.postMessage({id,type:'result',result});
    }finally{busy=false;}
  }catch(error){self.postMessage({id,type:'error',message:String(error?.message||error)});}
};
