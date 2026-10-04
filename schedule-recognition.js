(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ZhuxuScheduleRecognition=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clean=s=>String(s||'').replace(/\s+/g,'').replace(/[～〜]/g,'~');
  const endOfMonth=(year,month)=>new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
  function wordsOnce(words){const out=[];for(const w of words||[]){if(!w.text||!Number.isFinite(w.x)||!Number.isFinite(w.y))continue;if(out.some(v=>v.text===w.text&&Math.abs(v.x-w.x)<8&&Math.abs(v.y-w.y)<8))continue;out.push(w);}return out;}
  function lines(words){
    const rows=[];
    for(const w of wordsOnce(words).sort((a,b)=>a.y+a.height/2-b.y-b.height/2||a.x-b.x)){
      const cy=w.y+w.height/2;
      let row=rows.find(r=>Math.abs(r.cy-cy)<Math.max(5,Math.min(r.height,w.height)*0.55));
      if(!row){row={cy,height:w.height,words:[]};rows.push(row);}row.words.push(w);
    }
    return rows.map(r=>{const ws=r.words.sort((a,b)=>a.x-b.x);return {...r,x:ws[0].x,y:Math.min(...ws.map(w=>w.y)),text:ws.map(w=>w.text).join(' '),right:Math.max(...ws.map(w=>w.x+w.width))};});
  }
  // Extract solid red/blue bars. White labels inside bars do not split a work item.
  function barsFromPixels(data,width,height){
    const bars=[],open=[];
    const color=(i)=>{const r=data[i],g=data[i+1],b=data[i+2];return r>140&&r>g*1.6&&r>b*1.5?'critical':b>100&&b>r*1.25&&b>g*1.08?'normal':null;};
    for(let y=0;y<height;y++){
      const runs=[];let start=-1,kind=null,last=-1;
      for(let x=0;x<width;x++){
        const c=color((y*width+x)*4);
        if(c&&(!kind||c===kind)){if(start<0){start=x;kind=c;}last=x;}
        if(start>=0&&((c&&c!==kind)||x-last>20||x===width-1)){
          if(last-start>=24)runs.push({x:start,right:last+1,kind});start=c?x:-1;last=c?x:-1;kind=c||null;
        }
      }
      for(const r of runs){let b=open.find(b=>b.kind===r.kind&&b.bottom===y&&Math.abs(b.x-r.x)<12&&Math.abs(b.right-r.right)<12);if(b){b.bottom=y+1;b.x=Math.min(b.x,r.x);b.right=Math.max(b.right,r.right);}else{b={...r,y,bottom:y+1};open.push(b);}}
      for(let i=open.length-1;i>=0;i--){if(open[i].bottom<y){const b=open.splice(i,1)[0];if(b.bottom-b.y>=5)bars.push({...b,width:b.right-b.x,height:b.bottom-b.y});}}
    }
    return bars.concat(open.filter(b=>b.bottom-b.y>=5).map(b=>({...b,width:b.right-b.x,height:b.bottom-b.y})));
  }
  function readMonthChart(ocr,bars,year){
    if(!Number.isInteger(Number(year))||year<2000||year>2100)throw new Error('请先确认计划年份');
    const words=wordsOnce(ocr.words),headerLines=lines(words).filter(l=>/月.*第/.test(clean(l.text)));
    // Two or more columns are kept separate before reconstructing rows.
    const headers=[];
    for(const l of headerLines){
      const segments=[];
      for(const w of l.words){let segment=segments.at(-1);if(!segment||w.x-segment.at(-1).x-segment.at(-1).width>150){segment=[];segments.push(segment);}segment.push(w);}
      for(const ws of segments){
        const text=clean(ws.map(w=>w.text).join(''));
        const m=text.match(/(?:[〖\[（(])?(\d{1,2})月[^月]*第/);
        const ordinal=text.match(/月[^月]*第(\d{1,3})[一_—-](\d{1,3})天/);
        const ordinalMonth=ordinal?new Date(Date.UTC(Number(year),0,Number(ordinal[1]))).getUTCMonth()+1:null;
        const month=m?Number(m[1]):ordinalMonth;
        if(month>=1&&month<=12&&!headers.some(h=>h.month===month&&Math.abs(h.y-l.y)<20)){headers.push({month,x:ws[0].x,y:l.y});}
      }
    }
    if(!headers.length)throw new Error('未识别到按月份分区的横道图。请使用清晰原图，或上传带工作名称、开始日期和结束日期的表格');
    const columns=[];for(const h of headers.sort((a,b)=>a.x-b.x)){let col=columns.find(c=>Math.abs(c.anchor-h.x)<ocr.width*0.18);if(!col){col={anchor:h.x,headers:[]};columns.push(col);}col.headers.push(h);}
    columns.sort((a,b)=>a.anchor-b.anchor);
    // Headers are centered above the day axes, not above the whole panel including labels.
    const columnWidth=ocr.width/columns.length;
    const tasks=[],warnings=[];
    for(let ci=0;ci<columns.length;ci++){
      const col=columns[ci],left=ci===0?0:ci*columnWidth,right=ci===columns.length-1?ocr.width:(ci+1)*columnWidth;
      const hs=col.headers.sort((a,b)=>a.y-b.y);
      for(let hi=0;hi<hs.length;hi++){
        const h=hs[hi],bottom=hs[hi+1]?.y||ocr.height,monthKey=`${year}-${String(h.month).padStart(2,'0')}`,last=Number(endOfMonth(year,h.month).slice(-2));
        const panelWords=words.filter(w=>w.x>=left&&w.x<right&&w.y>h.y+20&&w.y<bottom-10);
        const panelBars=bars.filter(b=>b.x>=left&&b.right<=right&&b.y>h.y+25&&b.bottom<bottom-20&&b.width>=24);
        if(!panelBars.length){warnings.push(`${h.month}月未找到施工横条`);continue;}
        const lastBarY=Math.max(...panelBars.map(b=>b.bottom));
        const axes=lines(panelWords.filter(w=>w.y>=lastBarY&&/^\d{1,2}$/.test(clean(w.text)))).sort((a,b)=>a.y-b.y);
        const axis=axes.find(l=>l.words.filter(w=>/^\d{1,2}$/.test(clean(w.text))).length>=5);
        if(!axis){warnings.push(`${h.month}月日期刻度不清晰，未自动生成该月安排`);continue;}
        const ticks=axis.words.map(w=>({day:Number(clean(w.text)),x:w.x+w.width/2})).filter(w=>w.day>=1&&w.day<=last).sort((a,b)=>a.x-b.x);
        const slopes=[];for(let i=1;i<ticks.length;i++){if(ticks[i].day>ticks[i-1].day)slopes.push((ticks[i].x-ticks[i-1].x)/(ticks[i].day-ticks[i-1].day));}
        const step=slopes.sort((a,b)=>a-b)[Math.floor(slopes.length/2)];if(!step||step<2){warnings.push(`${h.month}月日期刻度异常`);continue;}
        const origin=ticks.map(t=>t.x-(t.day-1)*step).sort((a,b)=>a-b)[Math.floor(ticks.length/2)];
        const notes=lines(panelWords.filter(w=>w.y>axis.y+axis.height)).map(l=>clean(l.text)).filter(t=>/本月完成|月.*目标|施工至/.test(t)).join('；');
        for(const bar of panelBars){
          const rowWords=panelWords.filter(w=>w.x+w.width<origin-3&&Math.abs(w.y+w.height/2-(bar.y+bar.height/2))<Math.max(bar.height,w.height)*0.8);
          const label=clean(rowWords.sort((a,b)=>a.x-b.x).map(w=>w.text).join(''));
          const match=label.match(/^(\d{1,3})[.、]?(.{3,})$/);
          if(!match){warnings.push(`${h.month}月有一条施工名称识别不清，未生成`);continue;}
          const startDay=Math.max(1,Math.min(last,Math.round((bar.x-origin)/step)+1));
          const endDay=Math.max(1,Math.min(last,Math.round((bar.right-origin)/step)));
          if(endDay<startDay)continue;
          const date=d=>`${monthKey}-${String(d).padStart(2,'0')}`;
          const item={month:h.month,code:match[1],title:match[2],start:date(startDay),end:date(endDay),critical:bar.kind==='critical',monthRequirement:notes,evidence:{label,bar:{x:bar.x,y:bar.y,right:bar.right,bottom:bar.bottom}},dateSource:'横条与日刻度推算，请核对'};
          if(!tasks.some(t=>t.month===item.month&&t.code===item.code))tasks.push(item);
        }
      }
    }
    if(!tasks.length)throw new Error('未能可靠提取施工名称和日期，原文件已保留，请换清晰原图或日期表格');
    return {tasks:tasks.sort((a,b)=>a.month-b.month||Number(a.code)-Number(b.code)),warnings:[...new Set(warnings)],engine:ocr.engine};
  }
  function fromText(text,year,month){
    const tasks=[],warnings=[];
    for(const line of String(text||'').split(/\r?\n/)){
      const matches=[...line.matchAll(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/g)];
      if(matches.length<2)continue;
      const date=m=>`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
      const start=date(matches[0]),end=date(matches[1]);
      const prefix=line.slice(0,matches[0].index).replace(/[\t,，;；|]+$/,'').trim();
      const codeMatch=prefix.match(/^\s*(\d{1,3})[\t,，;；| .、]+(.+)/);
      const title=(codeMatch?codeMatch[2]:prefix).replace(/[\t,，]+\s*\d+\s*$/,'').trim();
      if(title.length<3||start>end)continue;
      tasks.push({code:codeMatch?.[1]||String(tasks.length+1),title,start,end,month:Number(start.slice(5,7)),critical:null,monthRequirement:'',dateSource:'原表起止日期'});
    }
    if(!tasks.length)throw new Error('未读取到带完整起止日期的工作行，请上传清晰图片或包含工作名称、开始日期、结束日期的CSV/Excel表');
    return {tasks,warnings,engine:'表格日期提取'};
  }
  function makePlans(result,source,existing,rules){
    const additions=[];let id=existing.reduce((n,p)=>Math.max(n,Number(p.id)||0),Date.now());
    for(const row of result.tasks){
      const validDate=d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
      if(!validDate(row.start)||!validDate(row.end)||row.start>row.end||!row.title?.trim()||Number(row.end.slice(0,4))-Number(row.start.slice(0,4))>1)throw new Error('识别结果的名称或日期无效（单次最多跨两个年份）');
      const y=Number(row.start.slice(0,4));
      const cursor=new Date(row.start+'T12:00:00Z');cursor.setUTCDate(1);
      for(;cursor.toISOString().slice(0,10)<=row.end;cursor.setUTCMonth(cursor.getUTCMonth()+1)){
        const monthKey=cursor.toISOString().slice(0,7),month=Number(monthKey.slice(5)),year=Number(monthKey.slice(0,4));
        const start=row.start>monthKey+'-01'?row.start:monthKey+'-01',end=row.end<endOfMonth(year,month)?row.end:endOfMonth(year,month);
        const key=`${source.fingerprint||source.fileKey}|${monthKey}|${row.code}`;
        if([...existing,...additions].some(p=>p.recognitionKey===key))continue;
        const master=existing.find(p=>p.level==='master'&&p.recognizedTasks?.some(t=>String(t.code)===String(row.code)&&clean(t.title)===clean(row.title)));
        const g={mode:'activity',building:row.building||source.building||'原计划适用范围',stage:row.title,baseline:0,target:1,unit:'项',node:'',text:row.monthRequirement||`${start}—${end}开展${row.title}`};
        const m={id:++id,level:'month',title:row.title,start,end,parentId:master?.id||null,owners:[],team:'',goal:g,source:'月计划自动识别',sourcePlanId:source.planId,sourceFileKey:source.fileKey,recognitionKey:key,workCode:row.code,critical:row.critical,recognitionEvidence:row.evidence||null,requiresQuantification:true};additions.push(m);
        for(const range of rules.weeks(year,month)){
          const ws=range.start>start?range.start:start,we=range.end<end?range.end:end;if(ws>we)continue;
          const days=Math.round((new Date(we+'T12:00:00Z')-new Date(ws+'T12:00:00Z'))/86400000)+1;
          additions.push({...m,id:++id,level:'week',title:row.title,start:ws,end:we,parentId:m.id,recognitionKey:key+'|'+range.start,plannedWorkDays:days,goal:{...g,text:`${ws}—${we}安排${days}天；${row.title}。${row.monthRequirement||''}`},source:'月计划自动分周'});
        }
      }
    }
    rules.validatePlans(existing,existing.concat(additions),[]);return additions;
  }
  return {lines,barsFromPixels,readMonthChart,fromText,makePlans};
});
