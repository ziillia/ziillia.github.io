/* Standalone experiment. No Drive DJ Finder writes or canonicalization.
 * Preprocessing/CTC contract verified against @paddleocr/paddleocr-js@0.4.2
 * dist/index.mjs (Apache-2.0, PaddlePaddle Authors). This is an independent
 * implementation; JS bilinear rounding can differ slightly from OpenCV.
 */
export const MODEL_URL='https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx_infer.tar';
const ORT_BASE='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
const textDecoder=new TextDecoder();

export function unpackModelTar(buffer){
  const bytes=new Uint8Array(buffer),entries={};
  for(let offset=0;offset+512<=bytes.length;){
    const field=(start,len)=>textDecoder.decode(bytes.subarray(offset+start,offset+start+len)).replace(/\0.*$/s,'').trim();
    const name=field(0,100);if(!name)break;
    const size=Number.parseInt(field(124,12),8);
    if(!Number.isSafeInteger(size)||size<0||offset+512+size>bytes.length)throw new Error('Invalid model TAR entry');
    const base=name.split('/').at(-1);
    if(base==='inference.onnx'||base==='inference.yml')entries[base]=bytes.slice(offset+512,offset+512+size);
    offset+=512+Math.ceil(size/512)*512;
  }
  if(!entries['inference.onnx']||!entries['inference.yml'])throw new Error('Model TAR is missing model/config');
  return entries;
}

export function prepareRecognitionTensor(imageData,imageShape){
  const [channels,height,baseWidth]=imageShape;
  if(channels!==3||height<1||baseWidth<1||!imageData.width||!imageData.height)throw new Error('Invalid recognition input shape');
  const sourceW=imageData.width,sourceH=imageData.height,ratio=sourceW/sourceH;
  const width=Math.max(1,Math.min(3200,Math.trunc(height*Math.max(baseWidth/height,ratio))));
  const resizedWidth=Math.min(width,Math.ceil(height*ratio));
  const values=new Float32Array(3*height*width),src=imageData.data,plane=height*width;
  // Match OpenCV INTER_LINEAR's half-pixel geometry. Interpolate BGR bytes,
  // then normalize (byte / 255 - .5) / .5, with zero-valued right padding.
  for(let y=0;y<height;y++){
    const sy=(y+.5)*sourceH/height-.5,fy=Math.floor(sy),wy=sy-fy;
    const y0=Math.max(0,Math.min(sourceH-1,fy)),y1=Math.max(0,Math.min(sourceH-1,fy+1));
    for(let x=0;x<resizedWidth;x++){
      const sx=(x+.5)*sourceW/resizedWidth-.5,fx=Math.floor(sx),wx=sx-fx;
      const x0=Math.max(0,Math.min(sourceW-1,fx)),x1=Math.max(0,Math.min(sourceW-1,fx+1));
      for(let c=0;c<3;c++){
        const cc=2-c;
        const top=src[(y0*sourceW+x0)*4+cc]*(1-wx)+src[(y0*sourceW+x1)*4+cc]*wx;
        const bottom=src[(y1*sourceW+x0)*4+cc]*(1-wx)+src[(y1*sourceW+x1)*4+cc]*wx;
        values[c*plane+y*width+x]=(Math.round(top*(1-wy)+bottom*wy)/255-.5)/.5;
      }
    }
  }
  return{values,dims:[1,3,height,width],resizedWidth};
}

export function decodeRecognition(output,characters){
  const [batch,steps,classes]=output.dims;
  if(output.dims.length!==3||batch!==1||classes!==characters.length+1)throw new Error('Recognition model dictionary/output mismatch');
  let previous=-1,text='',sum=0,count=0;
  for(let t=0;t<steps;t++){
    let index=0,value=-Infinity;
    for(let c=0;c<classes;c++){const candidate=output.data[t*classes+c];if(candidate>value){index=c;value=candidate;}}
    if(index>0&&index!==previous){text+=characters[index-1];sum+=value;count++;}
    previous=index;
  }
  return{text,score:count?sum/count:0};
}

export async function createRecognitionOnly(options={}){
  const started=performance.now();
  options.onProgress?.({stage:'runtime',message:'認識エンジンを準備しています'});
  const ort=options.ort||await import(ORT_BASE+'ort.wasm.min.mjs');
  ort.env.wasm.wasmPaths=options.wasmPaths||ORT_BASE;
  ort.env.wasm.numThreads=1;ort.env.wasm.simd=true;ort.env.wasm.proxy=false;
  const loadYaml=options.loadYaml||(await import('https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/+esm')).load;
  options.onProgress?.({stage:'download',message:'日本語認識モデルを読み込んでいます'});
  const response=await fetch(options.modelUrl||MODEL_URL,{signal:options.signal});if(!response.ok)throw new Error('Recognition model HTTP '+response.status);
  let archive=await response.arrayBuffer();const archiveBytes=archive.byteLength;
  let entries=unpackModelTar(archive);archive=null;
  const config=loadYaml(textDecoder.decode(entries['inference.yml']));
  if(config.Global?.model_name!=='PP-OCRv5_mobile_rec'&&config.model_name!=='PP-OCRv5_mobile_rec')throw new Error('Unexpected recognition model name');
  const resize=config.PreProcess?.transform_ops?.find(op=>op.RecResizeImg)?.RecResizeImg;
  const imageShape=resize?.image_shape,dict=config.PostProcess?.character_dict;
  if(!Array.isArray(imageShape)||imageShape.length!==3||!Array.isArray(dict)||!dict.length)throw new Error('Missing recognition config');
  const characters=[...dict,' '];
  options.onProgress?.({stage:'initialize',message:'認識モデルを起動しています'});
  let session=await ort.InferenceSession.create(entries['inference.onnx'],{executionProviders:['wasm'],graphOptimizationLevel:'all'});entries=null;
  const metrics={initMs:performance.now()-started,archiveBytes,imageShape,characters:characters.length,backend:'wasm',threads:1,detector:false,opencv:false};
  let busy=false;
  async function readPixels(imageData){
      if(!session)throw new Error('Recognition session disposed');if(busy)throw new Error('Recognition-only benchmark is sequential');
      if(!imageData||!Number.isSafeInteger(imageData.width)||!Number.isSafeInteger(imageData.height)||imageData.width<1||imageData.height<1||imageData.data?.length!==imageData.width*imageData.height*4)throw new Error('Invalid recognition pixels');
      busy=true;let tensor,outputs;
      try{
        const begin=performance.now();
        const prepared=prepareRecognitionTensor(imageData,imageShape),preparedAt=performance.now();
        tensor=new ort.Tensor('float32',prepared.values,prepared.dims);
        outputs=await session.run({[session.inputNames[0]]:tensor});const inferredAt=performance.now();
        const result=decodeRecognition(outputs[session.outputNames[0]],characters);
        return{...result,metrics:{preprocessMs:preparedAt-begin,inferenceMs:inferredAt-preparedAt,totalMs:performance.now()-begin,inputDims:prepared.dims}};
      }finally{tensor?.dispose();if(outputs)for(const value of Object.values(outputs))value.dispose();busy=false;}
  }
  return{
    metrics,
    readPixels,
    async read(canvas){const ctx=canvas.getContext('2d',{willReadFrequently:true});return readPixels(ctx.getImageData(0,0,canvas.width,canvas.height));},
    async dispose(){if(busy)throw new Error('Cannot dispose during recognition');const current=session;session=null;if(current)await current.release();}
  };
}
