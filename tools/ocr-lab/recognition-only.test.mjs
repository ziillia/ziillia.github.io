import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareRecognitionTensor,decodeRecognition,unpackModelTar} from './recognition-only.mjs';

test('fixed line recognition preserves BGR ordering and neutral right padding',()=>{
  const result=prepareRecognitionTensor({width:1,height:1,data:new Uint8ClampedArray([255,0,0,255])},[3,2,4]);
  assert.deepEqual(result.dims,[1,3,2,4]);
  assert.equal(result.resizedWidth,2);
  assert.deepEqual([...result.values],[-1,-1,0,0,-1,-1,0,0,-1,-1,0,0,-1,-1,0,0,1,1,0,0,1,1,0,0]);
});
test('CTC merges repeated nonblank labels while preserving repeats after blank',()=>{
  const labels=[1,1,0,1,2,2],data=new Float32Array(labels.length*3);
  labels.forEach((label,i)=>data[i*3+label]=1);
  assert.deepEqual(decodeRecognition({dims:[1,labels.length,3],data},['あ','A']),{text:'ああA',score:1});
  assert.throws(()=>decodeRecognition({dims:[1,1,4],data},['あ','A']),/mismatch/);
});
test('recognition width is capped without allocating panorama-sized tensors',()=>{
  const result=prepareRecognitionTensor({width:400,height:1,data:new Uint8ClampedArray(400*4)},[3,48,320]);
  assert.deepEqual(result.dims,[1,3,48,3200]);assert.equal(result.values.length,460800);
});
test('TAR rejects missing model assets and truncated entries',()=>{
  assert.throws(()=>unpackModelTar(new Uint8Array(1024).buffer),/missing/);
  const bytes=new Uint8Array(512);bytes.set(new TextEncoder().encode('inference.onnx'));bytes.set(new TextEncoder().encode('00000002000'),124);
  assert.throws(()=>unpackModelTar(bytes.buffer),/Invalid/);
});
