'use strict';
const {execFile}=require('node:child_process');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
let active=0;
const run=(command,args)=>new Promise((resolve,reject)=>execFile(command,args,{windowsHide:true,timeout:90000,maxBuffer:8*1024*1024,encoding:'utf8'},(error,out,err)=>error?reject(Object.assign(new Error(`服务器文字识别失败：${String(err||error.message).slice(0,300)}`),{status:422})):resolve(out)));
async function recognizeImage(data){
  if(data.length>12*1024*1024)throw Object.assign(new Error('识别图片超过12MB，请上传分月清晰图片'),{status:413});
  if(active>=2)throw Object.assign(new Error('服务器正在识别其他文件，请稍后重试'),{status:429});
  active++;
  let directory,file;
  try{
    directory=await fs.mkdtemp(path.join(os.tmpdir(),'zhuxu-schedule-ocr-'));
    file=path.join(directory,'input.png');
    await fs.writeFile(file,data);
    if(process.platform==='win32')return JSON.parse(await run('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'scripts','schedule-ocr.ps1'),'-ImagePath',file]));
    const tsv=await run('tesseract',[file,'stdout','-l',process.env.ZHUXU_OCR_LANG||'chi_sim+eng','tsv']);
    const words=tsv.split(/\r?\n/).slice(1).map(line=>line.split('\t')).filter(c=>c[0]==='5'&&c[11]?.trim()).map(c=>({text:c.slice(11).join('\t'),x:Number(c[6]),y:Number(c[7]),width:Number(c[8]),height:Number(c[9])}));
    return {words,engine:'Tesseract服务器OCR'};
  }finally{
    // Exact internally-created temporary file only, no application attachments are removed.
    if(file)await fs.unlink(file).catch(()=>{});if(directory)await fs.rmdir(directory).catch(()=>{});active--;
  }
}
module.exports={recognizeImage};
