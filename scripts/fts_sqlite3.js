function searchSubmit(form,db){
  var type_options = ["journal","travel notes","AW's journal","journal index","travel accounts","itinerary"];
  let formData = new FormData(form);
  let query = Object.create(null);
  query.keyword = formData.get('keyword');
  query.entry_type = formData.getAll('entry_type').map(x=>type_options[x]);
  query.source = formData.getAll('source');
  query.search_mode = formData.get('search-mode');
  var result_wyas = [];  var result_alcb =[];
  var date_list_wyas = []; var date_list_alcb = [];
  wyas_msg = document.querySelector('label[for=source_1]')
  alcb_msg = document.querySelector('label[for=source_2]')
  wrapper_msg = document.getElementById('wrapper')

  if(query.search_mode==='like'){
      var reg = wc2RegExp(query.keyword);
  }

  // empty query, reset
  if(query.keyword===''){
    d3.selectAll('.entry-abstract').remove();
    d3.select('#year_hits_plot').remove();
    d3.select('#year_hits_legend').remove();
    type_options.map((x,idx)=>{
      document.querySelector('label[for=entry_type_'+idx+']').innerText = x;
    })
    wyas_msg.innerText = 'WYAS';
    alcb_msg.innerText = 'ALCB blogs';
    return [];
  }

  wrapper_msg.innerHTML = '<span style="font-size:15px; margin-top:5px;">Searching...</span><div class="loader"></div>';
  // query in both tables
  if(query.search_mode==='match'){
    try{
      result_wyas = db.exec(`select highlight(wyas_fts, 0, '<span class="highlight">', '</span>'),link,date,type,part from wyas_fts where text match ? AND text NOTNULL`,[query.keyword]);
      result_alcb = db.exec(`select highlight(alcb_fts, 0, '<span class="highlight">', '</span>'),credit,link,date,type,part from alcb_fts where text match ? AND text NOTNULL`,[query.keyword]);   
    }catch(err){
      wrapper_msg.innerHTML = '<span style="font-size:15px; margin-top:5px;">' + err + '</span>';
      return;
    }
  }else if(query.search_mode==='match_exact'){
    try{
      result_wyas = db.exec(`select highlight(wyas_exact_fts, 0, '<span class="highlight">', '</span>'),link,date,type,part from wyas_exact_fts where text match ? AND text NOTNULL`,[query.keyword]);
      result_alcb = db.exec(`select highlight(alcb_exact_fts, 0, '<span class="highlight">', '</span>'),credit,link,date,type,part from alcb_exact_fts where text match ? AND text NOTNULL`,[query.keyword]);   
    }catch(err){
      wrapper_msg.innerHTML = '<span style="font-size:15px; margin-top:5px;">' + err + '</span>';
      return;
    }   
  }else if(query.search_mode==='like'){
    try{
      result_wyas = db.exec(`select text,link,date,type,part from wyas_fts where text like ? AND text NOTNULL`,[query.keyword]);
      result_alcb = db.exec(`select text,credit,link,date,type,part from alcb_fts where text like ? AND text NOTNULL`,[query.keyword]);   
    }catch(err){
      dwrapper_msg.innerHTML = '<span style="font-size:15px; margin-top:5px;">' + err + '</span>';
      return;
    }      
  }

  if (result_wyas.length>0) {
      result_wyas = result_wyas[0];
      result_wyas.values.map(x=>{
        if(query.search_mode==='like'){
          x[0] = likeHL(x[0],reg,['<span class="highlight">','</span>'])
        }
        x[0] = snippet(x[0])
      });
      date_list_wyas = result_wyas.values.map(x=>x[2]);
      date_list_wyas = date_list_wyas.filter(function(item, index, arr) {
          return arr.indexOf(item, 0) === index;});
  }
  wyas_msg.innerText = 'WYAS ('+date_list_wyas.length+')';
 
  if (result_alcb.length>0) {
      result_alcb = result_alcb[0]; 
      result_alcb.values.map(x=>{
        if(query.search_mode==='like'){
          x[0] = likeHL(x[0],reg,['<span class="highlight">','</span>'])
        }
        x[0] = snippet(x[0])
      });
      date_list_alcb = result_alcb.values.map(x=>x[3]);
      date_list_alcb = date_list_alcb.filter(function(item, index, arr) {
          return arr.indexOf(item, 0) === index;});
  }
  alcb_msg.innerText = 'ALCB blogs ('+date_list_alcb.length+')';

  wrapper_msg.innerText = "";

  //merge results. calculate hits
  if (query.source.indexOf("WYAS")===-1){
    result_wyas = [];
  }
  if (query.source.indexOf("ALCB blogs")===-1){
    result_alcb = [];
  }
  var merged_result = mergeResult(result_wyas,result_alcb);
  type_options.map((x,idx)=>{
    var entry_type_hits = merged_result.filter(item=>item.result.findIndex(y=>y.type===x)!==-1).length;
    document.querySelector('label[for=entry_type_'+idx+']').innerText = x+' ('+entry_type_hits+')';
  })

  // remove un-selected entry type. hits in each year is calculated with pruned results
  merged_result.map(y=>{
    y.result = y.result.filter(x=>query.entry_type.findIndex(item=>item===x.type)!==-1)
    y.result.sort((a, b) => (type_options.findIndex(item=>item===a.type)>type_options.findIndex(item=>item===b.type)) ? 1 : -1)
  });
  merged_result = merged_result.filter(x=>x.result.length>0);
  merged_result.sort((a, b) => (a.date > b.date) ? 1 : -1);

  yearHitsHeat(merged_result);

  var current_year = calendar.getYear();
  ftsAbstract(merged_result,current_year);

  return merged_result;
}

function mergeResult(result_wyas,result_alcb){
  var merged_result = [];
  if (typeof(result_wyas.length)==='undefined'){
    result_wyas.values.map(x=>{
      var result_day = new Object;
      result_day.text = x[0];
      result_day.credit = 'WYAS'; 
      result_day.link = x[1]; 
      result_day.type = x[3];
      result_day.part = x[4];
      if (merged_result.length===0){
        merged_result.push({
          date:x[2],
          result:[]
        });
        merged_result[0].result.push(result_day);
      }else if(merged_result.findIndex(item=>item.date===x[2])===-1){
        merged_result.push({
          date:x[2],
          result:[]
        });
        merged_result[merged_result.length-1].result.push(result_day);
      }else{
        var res_index = merged_result.findIndex(item=>item.date===x[2]);
        merged_result[res_index].result.push(result_day);
      }
    })
  }
  if (typeof(result_alcb.length)==='undefined'){
    result_alcb.values.map(x=>{
      var result_day = new Object;
      result_day.text = x[0]; 
      result_day.credit = x[1];
      result_day.link = x[2]; 
      result_day.type = x[4];
      result_day.part = x[5];
      if (merged_result.length===0){
        merged_result.push({
          date:x[3],
          result:[]
        });
        merged_result[0].result.push(result_day);
      }else if(merged_result.findIndex(item=>item.date===x[3])===-1){
        merged_result.push({
          date:x[3],
          result:[]
        });
        merged_result[merged_result.length-1].result.push(result_day);
      }else{
        var res_index = merged_result.findIndex(item=>item.date===x[3]);
        merged_result[res_index].result.push(result_day);
      }
    })
  }
  return merged_result;
}

function yearHitsHeat(merged_result){
     var year_hits = [];
    for (var i = 1806; i <= 1840; i++){
        year_hits.push(merged_result.filter(item=>item.date.split(',')[0]===i.toString()).length);
    }

    var colorRange = d3.scaleLinear().domain([0,Math.max.apply(null,year_hits)]).range([0,1])
    if (Math.max.apply(null,year_hits)===0){
      var colorGradient = d3.interpolate('#ffffff','#ffffff');
    }else{
      var colorGradient = d3.interpolate('#ffffff','#0003A9');
    }
    var gridSize = 20;

    if(document.getElementById('year_hits_plot')!==null){
      d3.select('#year_hits_plot').remove();
      d3.select('#year_hits_legend').remove();
    }
    d3.select('#wrapper').append('ul').attr('id','year_hits_legend').attr('style','margin-top:5px;');
    d3.select('#year_hits_legend').append('li').attr('id','legend_title').attr('style','margin-right:15px;').attr('margin-top',3).text('Hits in year');
    d3.select('#year_hits_legend').append('li').attr('id','legend_min').attr('style','margin-right:5px;').text('0');
    d3.select('#year_hits_legend').append('li').append('svg').attr('id','legend_gradient').attr('width',100).attr('height',12).style("background", `linear-gradient(to right, ${
          new Array(10).fill(null).map((d, i) => (
              `${colorGradient(i / 9)} ${i * 100 / 9}%`
          )).join(", ")
      })`)
    d3.select('#year_hits_legend').append('li').attr('id','legend_max').attr('style','margin-left:5px;').attr('margin-top',3).text(Math.max.apply(null,year_hits));

    var dimension = {margin:{top:5,right:0,bottom:0,left:10}};
    dimension.boundedWidth = gridSize*18; //18 years * 2 rows
    dimension.boundedHeight = gridSize*2; 
    dimension.width = dimension.boundedWidth+dimension.margin.left+dimension.margin.right;
    dimension.height = dimension.boundedHeight+dimension.margin.top+dimension.margin.bottom;      
    var wrapper = d3.select('#wrapper').append('svg').attr('id','year_hits_plot').
                attr('width','100%').attr('height',dimension.height);
    document.getElementById('year_hits_plot').style.margin = dimension.margin.top+'px '+dimension.margin.right+' '+dimension.margin.bottom+' '+dimension.margin.left+'px';
    var bounds = wrapper.append('g').style('transform',`translate(${dimension.margin.left}px),${dimension.margin.top}px`)
    var barPadding = 5;
    var totalBarDimension = d3.min([20,20]);
    var barDimension = totalBarDimension-barPadding-1;

    bounds.append('text').attr('x',360).attr('y',20+1).attr('dx',10).attr('dy',12).text('1840')
    bounds.append('text').attr('x',0).attr('y',0+1).attr('dy',12).text('1806')
    bounds.append('text').attr('x',0).attr('y',20+1).attr('dy',12).text('1824')

    var heatMap = bounds.selectAll(".yearhits")
      .data(year_hits)
      .enter()      
      .append("rect")
      .attr("x", function(d, i){ return (i % 18)*gridSize+32;})
      .attr("y", function(d, i){ return parseInt(i / 18)*gridSize+1;})
      .style("outline","1px solid rgba(27,31,35,0.6)")
      .style("cursor","pointer")
      .attr("class", "yearhits")
      .attr("year_id",function(d,i){return (i+1806)})
      .attr("width", barDimension)
      .attr("height", barDimension)
      .each(function(d,i){
         var content = (i+1806)+': '+d+' hits';
         $(this).popover({
           'html':true,
           'id':'info'+(i+1806),
           'template': "<div class='popover event-tooltip-content hits_info'>"+content+"<div class='arrow'></div>",
           'content': '<div id=info'+(i+1806)+'>'+content+'</div>'
         })
      })
      .on('mouseover',function(d,i){
         $(this).popover('show');
     })
      .on('mouseout',function(d,i){
        $(this).popover('hide');
      })
      .on('click',function(d,i){
        var current_year = $(this)[0].attributes.year_id.value
          if (typeof(merged_result)!==undefined){
              ftsAbstract(merged_result,current_year);
          }
          calendar.setYear(current_year);
      })
      .style("fill", d=>colorGradient(colorRange(d)));
    year_hits.map((x,idx)=>{
      if (x===0){
        bounds.append('text').attr('id','none-hits')
        .attr('x',(idx % 18)*gridSize-0.5).attr('y',parseInt(idx / 18)*gridSize+1)
        .attr('dx',36).attr('dy',12)
        .text('0')
      }
    })
}

function wc2RegExp(query){
  query = escapeRegExp(query)
 var index_wc = [];
  var reg ='';
  for (var i = 0;i<query.length;i++){
    if (query[i]==='%'||query[i]==='_'){
      index_wc.push({
        idx: i,
        wc: query[i]
      })
    }
  }
  if (index_wc.length===0){
    reg = '^'+query+'$'
  }else{
    if(index_wc[0].idx>0){reg += '^'}
      else if(index_wc[0].wc==='_'){reg += '^[\\s\\S]{1}'}
    reg += query.slice(0,index_wc[0].idx)
    for (var i = 1; i<index_wc.length;i++){
      reg += query.slice(index_wc[i-1].idx+1,index_wc[i].idx)
      if(index_wc[i].wc==='_'){
        for (var j = i+1; j<index_wc.length; j++){
          if(index_wc[j].wc!=='_'){
            break;
          }
        }
        reg += '[\\s\\S]{'+Number(j-i).toString()+'}'
        i = j-1;
      }
      else if (index_wc[i].wc==='%'&&i<index_wc.length-1){
        reg += '[\\s\\S]*'
      }
    }
    reg += query.slice(index_wc[index_wc.length-1].idx+1);
    if(index_wc[index_wc.length-1].idx!==query.length-1){
      reg += '$'
    }
  }
  reg = new RegExp(reg,'gi')
  return reg
}

function likeHL(text,reg,hl_mark) {
  var text_hl = text.replace(reg,function(word){
    return hl_mark[0]+word+hl_mark[1]
  })
  return text_hl;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function snippet(text,snippet_size){
  var snippet_size = 35;
  var text_list = text.split(' ');
  var text_snippet = '';
  var indices_x = [];
  var indices_y = [];
  var hl_mark = ['<span class="highlight">','</span>'];
  var idx = text.indexOf(hl_mark[0]);
  var idy = text.indexOf(hl_mark[1]);
  while (idx != -1) {
    indices_x.push(idx);
    indices_y.push(idy);
    idx = text.indexOf(hl_mark[0], idx + 1);
    idy = text.indexOf(hl_mark[1], idy + 1);
  }
  for(var i = 0; i<indices_x.length; i++){
    if (i!==0){
      temp = text.slice(indices_y[i-1]+hl_mark[1].length,indices_y[i]+hl_mark[1].length);
      temp_split = temp.split(' ');
      if(temp_split.length<snippet_size){
        text_snippet += temp;
      }else{
        text_snippet += temp_split.slice(0,parseInt(snippet_size/2)).join(' ')
                        +'<b style="color: crimson;"> (...) </b>'+temp_split.slice(temp_split.length-parseInt(snippet_size/2)).join(' ')
      }
    }else{
      temp = text.slice(0,indices_y[i]+hl_mark[1].length);
      temp_split = temp.split(' ');
      var word_length = text.slice(indices_x[i],indices_y[i]+hl_mark[1].length).split(' ').length;
      if(temp_split.length-word_length<snippet_size){
        text_snippet += temp;
      }else{
        text_snippet += '<b style="color: crimson;"> (...) </b>'+temp_split.slice(temp_split.length-word_length-snippet_size).join(' ')
      }
    }
    if(i===indices_x.length-1){
      temp = text.slice(indices_y[i]+hl_mark[1].length);
      temp_split = temp.split(' ');
      if(temp_split.length<snippet_size){
        text_snippet += temp;
      }else{
        text_snippet += temp_split.slice(0,snippet_size).join(' ') + '<b style="color: crimson;"> (...) </b>'
      }
    }
  }
  return text_snippet;
}

function ftsAbstract(merged_result,current_year){
  if (document.querySelector('.entry-abstract')!==null){
    d3.selectAll('.entry-abstract').remove();
  }
  // initial display
  if (merged_result.length<300){
    var current_fts_result = merged_result
  }else{
    var current_fts_result = merged_result.filter(x=>x.date.split(',')[0]===current_year.toString());
  }
  current_fts_result.map(x=>{
    x.result.map(y=>{
      var entry_block = document.createElement('div');
      entry_block.className = 'entry-abstract';
      entry_block.setAttribute('entry_id',x.date);
      entry_block.onclick = function(){window.open(y.link)};
      var block_info = document.createElement('div');
      block_info.className = 'abstract-info';
      block_info.color = 'blue';
      block_info.innerHTML = x.date.replace(/,/g,'-')+' ( '+y.type+'; '+ y.credit +')';
      var abstract = document.createElement('div');
      abstract.className = 'abstract-text';
      abstract.innerHTML = y.text;

      entry_block.appendChild(block_info);
      entry_block.appendChild(abstract);
      document.getElementById('fts-abstract').appendChild(entry_block);
    })
  })
}

async function loadDB(){   
    var wrapper_msg = document.getElementById('wrapper')
    wrapper_msg.innerHTML = '<span style="font-size:15px; margin-top:5px;">Connecting to database...</span><div class="loader"><div>';
    var loadingBar = document.querySelector(".progress-bar")
    var res = new Object;
    const sqlPromise = initSqlJs({
      locateFile: file => `../scripts/sql-wasm.wasm`
    });
    let total = null;
    let chunks = null;
    let loaded = 0;
    const logProcess = (res) => {
        const reader = res.body.getReader();
        const push = ({ value, done }) => {
            if (done) return chunks;
            chunks.set(value, loaded);
            loaded += value.length;
            if (total === null) {
                console.log(`Downloaded ${loaded}`);
            } else {
                loadingBar.ariaValueNow = (loaded / total * 100)
                loadingBar.style.width = `${(loaded / total * 100).toFixed(2)}%`
            }
            return reader.read().then(push);
        };
        return reader.read().then(push);
    };
    // const dataPromise = fetch("https://raw.githubusercontent.com/jiangjy-713/AL_Index/master/data/journal.db")
    const dataPromise = fetch("../data/journal.db")
                   .then((res) => {
                        total = res.headers.get('content-length')
                        chunks = new Uint8Array(total)
                        return res
                    }).then(logProcess)
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    chunks = null;     
    wrapper_msg.innerHTML = '<span style="font-size:15px; margin-top:5px;">Database loaded</span>';
    document.querySelector('.loading-mask').style.display = "none";
    db = new SQL.Database(new Uint8Array(buf));
    return db;
}

// async function loadDB(){
//     var res = new Object;
//     const sqlPromise = initSqlJs({
//       locateFile: file => `../scripts/sql-wasm.wasm`
//     });
//     const dataPromise = fetch("../data/journal.db").then(res => res.arrayBuffer());
//     const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
//     document.querySelector('.loading').style.display = "none";
//     db = new SQL.Database(new Uint8Array(buf));
//     return db;
// }

var db = loadDB();
var fts_result = [];
document.getElementById('search').addEventListener('submit',function(){
  fts_result =  searchSubmit(this,db);
  if(typeof(fts_result)!=='undefined'){
    calendar.render();
  }
})