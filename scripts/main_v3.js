console.time('load calendar')
var calendar = new Calendar('#calendar', {
    startYear: 1806,
    style: 'custom',
    minDate: new Date(1800,4,21),
    maxDate: new Date(1840,7,13),
    dataSource:  function(){
        // Load data from GitHub  "https://raw.githubusercontent.com/JiangJY-713/AL_Index/main/data/data.json"
        // return fetch("https://raw.githubusercontent.com/JiangJY-713/AL_Index/main/data/data.json")
        return fetch("../data/data.json")
      .then(result => result.json())
      .then(result => unpackEntry(result));
  },
    enableContextMenu: true,
    enableRangeSelection: false,
    contextMenuItems:[
        {
            text: 'Update',
            click: editEvent
        },
        {
            text: 'Delete',
            click: deleteEvent
        }
    ],
    selectRange: function(e) {
        editEvent({ startDate: e.startDate, endDate: e.endDate });
    },
    mouseOnDay: function(e) {
        if(e.events.length > 0) {
            var content = '';
            
            for(var i in e.events) {
                content += DispRef(e.events[i]);
                // var $link=$(content).find('.linkspan');            

            }            
            $(e.element).popover({ 
                trigger: 'manual',
                container: 'body',
                html:true,
                content: content,
                // template: "<div class='popover entryinfo'>"+content+"<div class='arrow'></div>",
                template: "<div class='popover event-tooltip-content'>"+content+"<div class='arrow'></div>",
                // delay:{show:500, hide:1000},
                container: $(e.element)
            });

            $(e.element).popover('show');
            // e.popover.stopPropagation();
        }
         
    },            
    mouseOutDay: function(e) {
        if(e.events.length > 0) {
            $(e.element).popover('hide');
        }
    },
    dayContextMenu: function(e) {
        $(e.element).popover('hide');
    },
    customDataSourceRenderer: function(elt, currentDate, events){
        // blank journal page: #CFCFCF  travel notes:#00CD00/#00CD66  index:black  AW's journal:#EE82EE
        colorScheme = ["#E8E8E8","#00CD66","black","#0000CD","#CFCFCF", "#EE82EE"];
        var parent = elt.parentElement;
        if (events.length===0){
            elt.style.color = colorScheme[0]
        }
        for (var i in events){
            // journal or journal [in AC]
            if (events[i].wyasLink.findIndex(item=>item.type==="journal"|item.type==="journal [in AC]")===-1) {
                elt.style.color = colorScheme[4]
            }else if (events[i].Tr.findIndex(item=>item.type==="journal")===-1&
                events[i].wyasLink.findIndex(item=>(item.type==="journal"|item.type==="journal [in AC]")&item.tr==="y")===-1) {
                parent.style.backgroundColor = colorScheme[0]
            }
            //journal index; itinerary; travel accounts
            if (events[i].wyasLink.findIndex(item=>item.type==="journal index"|item.type==="travel accounts"|item.type==="itinerary")!==-1) {
                if (events[i].Tr.findIndex(item=>item.type==="journal index"|item.type==="travel accounts"|item.type==="itinerary")===-1&
                    events[i].wyasLink.findIndex(item=>(item.type==="journal index"|item.type==="travel accounts"|item.type==="itinerary")&item.tr==="y")===-1) {
                    parent.style.borderBottom = "1px solid "+colorScheme[2]
                }else{
                    parent.style.borderBottom = "2px solid "+colorScheme[2]
                }
            }
            //travel notes
            if (events[i].wyasLink.findIndex(item=>item.type==="travel notes")!==-1) {
                if (events[i].Tr.findIndex(item=>item.type==="travel notes")===-1&
                    events[i].wyasLink.findIndex(item=>item.type==="travel notes"&item.tr==="y")===-1) {
                    parent.style.outline = "2px dotted "+colorScheme[1]
                }else{
                    parent.style.outline = "2px solid "+colorScheme[1]    
                }
                parent.style.outlineOffset = "-4px"
            }
            //AW's journal
            if (events[i].wyasLink.findIndex(item=>item.type==="AW's journal")!==-1) {
                if (events[i].Tr.findIndex(item=>item.type==="AW's journal")===-1&
                    events[i].wyasLink.findIndex(item=>item.type==="AW's journal"&item.tr==="y")===-1) {
                    elt.style.outline = "2px dotted "+colorScheme[5]
                    elt.style.outlineOffset = "-1px"
                    elt.style.borderRadius = "50%"
                }else{
                    elt.style.outline = "2px solid "+colorScheme[5]
                    elt.style.outlineOffset = "-1px"
                    elt.style.borderRadius = "50%"
                }
            }
        }
        return parent;
        return elt;
      }

});
console.timeEnd('load calendar')


function editEvent(event) {

    $('#event-modal input[name="event-index"]').val(event ? event.id : '');
    $('#event-modal input[name="event-name"]').val(event ? event.name : '');
    $('#event-modal input[name="event-location"]').val(event ? event.location : '');
    $('#event-modal input[name="event-start-date"]').datepicker('update', event ? event.startDate : '');
    $('#event-modal input[name="event-end-date"]').datepicker('update', event ? event.endDate : '');
    $('#event-modal').modal();
}

function deleteEvent(event) {
    var dataSource = calendar._dataSource;
    calendar.setDataSource(dataSource.filter(item => item.startDate.getTime() !== event.startDate.getTime()));
}

function saveEvent() {
    var event = {
        id: $('#event-modal input[name="event-index"]').val(),
        name: $('#event-modal input[name="event-name"]').val(),
        location: $('#event-modal input[name="event-location"]').val(),
        startDate: $('#event-modal input[name="event-start-date"]').datepicker('getDate'),
        endDate: $('#event-modal input[name="event-end-date"]').datepicker('getDate')
    }
    var dataSource = calendar._dataSource;
    dataSource = addEvent(dataSource,event);
    calendar.setDataSource(dataSource);
    $('#event-modal').modal('hide');
}


// buttons etc.
$(function() {
    $("#externallink").click(function(event) {
        event.stopPropagation();
    });
});

$(function() {
    $("#externallink").contextmenu(function(event) {
        event.stopPropagation();
    });
});

$('#save-event').click(function() {
        saveEvent();
});

//update log 
$(function(){
    commit_url = "https://api.github.com/repos/JiangJY-713/AL_Index/commits";
    fetch(commit_url)
          .then(result => result.json())
          .then(result => result[0].commit.committer.date.slice(0,10))
          .then(function(result){
                // log_link = document.createElement("a")
                // log_link.target = "_blank"
                // log_link.href = commit_url
                // log_link.innerText = "Update log <sub>(last: " + result + ")</sub>"
                log_btn = document.getElementById("update_log")
                // log_btn.appendChild(log_link)
                log_btn.innerHTML = "Update log <sub>(last: " + result + ")</sub>"
          }
            );
});


document.querySelector('#update-current-year').addEventListener('click', function() {
    calendar.setYear(document.querySelector('#current-year').value);
});

document.querySelector('#TrProgress').addEventListener('click', function() {
    button = document.getElementById("TrProgress")
    if (button.innerText==="Show coverage"){
        if(document.getElementById("Tr1817")===null){
            dataSource = calendar._dataSource
            progress = document.createElement("div")
            progress.id = "progress"
            progress.style.marginLeft = "10px"
            for (var i = 1806; i <= 1840; i++) {
                data_annual = dataSource.filter(item=>item.startDate.getFullYear()===i)
                bar = document.createElement("progress")
                entry_num = data_annual.filter(item=>(item.wyasLink.findIndex(x=>x.type==="journal")!==-1)).length
                            +data_annual.filter(item=>(item.wyasLink.findIndex(x=>x.type==="travel notes")!==-1)).length
                annual_Tr = data_annual.filter(item=>(item.wyasLink.findIndex(x=>x.type==="journal"&x.tr==="y")!==-1|item.Tr.findIndex(x=>x.type==="journal")!==-1)).length
                            +data_annual.filter(item=>(item.wyasLink.findIndex(x=>x.type==="travel notes"&x.tr==="y")!==-1|item.Tr.findIndex(x=>x.type==="travel notes")!==-1)).length
                if (entry_num>0){
                    bar.max = entry_num
                    bar.value = annual_Tr;
                    bar.id = "Tr"+i;
                    bar.style.width = entry_num/5+"px";
                    label = document.createElement("label")
                    label.innerText = "  "+i+" "
                    label.style.margin = "8px";
                    label.appendChild(bar);
                    progress.appendChild(label);
                }
            }
            let currentDiv = document.getElementById("legend");
            document.body.insertBefore(progress, currentDiv);                
        }
        else{
            coverage = document.getElementById("progress")
            coverage.style.display = "block"
        }
        button.innerText = "Hide coverage"
    }
    else if(button.innerText==="Hide coverage"){
        coverage = document.getElementById("progress")
        coverage.style.display = "none"
        button.innerText = "Show coverage"
    }
    
});

function addEvent(dataSource,event){
    if (event.startDate) {
        entry_exist = 0;
        for (var i in dataSource) {
            if (dataSource[i].startDate.getTime() === event.startDate.getTime()) {
                if (dataSource[i].Tr.length === 1 & dataSource[i].Tr[0].credit === ""){
                    dataSource[i].Tr[0].credit = event.name;
                    dataSource[i].Tr[0].link = [event.location];
                    dataSource[i].Tr[0].type = event.type;
                }else{
                    credit_exist = 0;
                    for(var j in dataSource[i].Tr){
                        if (dataSource[i].Tr[j].link.includes(event.location)&dataSource[i].Tr[j].type===event.type){
                            credit_exist = 1;
                        }else if(dataSource[i].Tr[j].credit===event.name&dataSource[i].Tr[j].type===event.type){
                            dataSource[i].Tr[j].link.push(event.location);
                            credit_exist = 1;
                        }
                    }
                    if (credit_exist === 0){
                        temp = new Object;
                        temp.credit = event.name;
                        temp.link = [event.location];
                        temp.type = event.type;
                        dataSource[i].Tr.push(temp);
                    }
                }
            entry_exist = 1;
            }
        }
        if (entry_exist===0) {
            temp = new EntryObj();
            temp.startDate = event.startDate;
            temp.endDate = event.endDate;
            temp.Tr[0].credit = event.name;
            temp.Tr[0].link.push(event.location);
            temp.Tr[0].type = event.type;
            dataSource.push(temp);
            dataSource.sort(function(a, b){return a.startDate.getTime() > b.startDate.getTime() ? 1 : -1;});
        }
    }
    return dataSource
}

function unpackEntry(entry_info){
   return entry_info.map(x=>({
    startDate:id2Date(x.id),
    endDate:id2Date(x.id),
    wyasLink: x.wyasLink,
    Tr: x.Tr,
    // tag: x.tag
   }))
}

function id2Date(id){
    date_element = id.split(",");
    yy = Number(date_element[0]);
    mm = Number(date_element[1])-1;
    dd = Number(date_element[2]);
    return new Date(yy,mm,dd);
}

function packEntry(dataSource){
    return dataSource.map(x=>({
        id: x.startDate.getFullYear()+','+
            ('0'+(Number(x.startDate.getMonth())+1)).slice(-2)+','+
            ('0'+x.startDate.getDate()).slice(-2),
        wyasLink: x.wyasLink,
        Tr: x.Tr,
        // tag: x.tag
    }))
}

function EntryObj(){
    this.startDate = "";    //"year,month,day",eg. "1817,4,5"
    this.endDate = "";
    this.wyasLink = [{}];
    this.wyasLink[0].link = [];
    this.wyasLink[0].type = ""; //"journal"/"travel notes"/"journal index"/"travel accounts"/"itinerary"/"AW's journal"
    this.wyasLink[0].tr = ""; // "y"/"n", wyas transcripts availability
    this.Tr = [{}];
    this.Tr[0].link = [];
    this.Tr[0].credit = "";
    this.Tr[0].type = "";  //"journal"/"travel notes"/"journal index"/...
    // this.tag = {};
    
}

function TypeFormat(type){
    // blank journal page: #CFCFCF  travel notes:#00CD00/#00CD66  index:black  AW's journal:#EE82EE
    colorScheme = ["#E8E8E8","#00CD66","black","#0000CD","#CFCFCF", "#EE82EE"];
    if (type === "journal"){
        typeWformat = type;
    }else if (type === "journal index"|type === "travel accounts"|type === "itinerary") {
        typeWformat = '<u>'+type+'</u>';
    }else if (type === "travel notes") {
        typeWformat = '<font color="'+colorScheme[1]+'">'+type+'</font>'
    }else if (type === "AW's journal") {
        typeWformat = '<font color="'+colorScheme[5]+'">'+type+'</font>'
    }else{typeWformat=type}
    return typeWformat;
}

function wyaslink2page(url){
    url_prefix_26 = "https://www.catalogue.wyjs.org.uk/CalmView/Record.aspx?src=CalmView.Catalog&id=CC00001/7/9/6/26/"
    url_prefix_ac = "https://www.catalogue.wyjs.org.uk/CalmView/Record.aspx?src=CalmView.Catalog&id=CC00001/7/9/9/"
    pageText_arr = url.split("/").slice(-2)
    if (url.includes(url_prefix_26)){
        pageText = "26(" + pageText_arr[0]+")-p"+pageText_arr[1] 
    }else{
        pageText = pageText_arr[0]+"-p"+pageText_arr[1]
    }

    if (url.includes(url_prefix_ac)) {
        return "AC-Vol."+pageText
    }else{
        return "Vol."+pageText
    }
}

function DispRef(entry){
   // content = '<div class="event-tooltip-content"><div>WYAS Link: '
   // content = '<div class="event-tooltip-content"><details open><summary>WYAS Link</summary><div>'
   content = '<details open class="details-black"><summary><b>WYAS Link</b></summary><div>'
   contentTr = [];
   for (var i in entry.wyasLink){
    // content += '<i>'+entry.wyasLink[i].type+'</i> (';
    content += TypeFormat(entry.wyasLink[i].type)+' (';
    for (var j in entry.wyasLink[i].link){
        if(Number(j)===entry.wyasLink[i].link.length-1){
            content += '<i><a href='+entry.wyasLink[i].link[j]+' target="_blank">'+wyaslink2page(entry.wyasLink[i].link[j])+'</a></i>'
        }else{
            content += '<i><a href='+entry.wyasLink[i].link[j]+' target="_blank">'+wyaslink2page(entry.wyasLink[i].link[j])+'</a></i>'+'||'
        }       
    }
    content += '); '

    contentTr_sub = '<i>'
    if (entry.wyasLink[i].tr==="y") {
        contentTr_sub = '<i>WYAS; '
    }
    alcb_index = entry.Tr.map((x, idx) => [x, idx]).filter(x => x[0].type===entry.wyasLink[i].type).map(x => x[1])
    if (alcb_index!==-1) {
        for(var j in alcb_index){            
            if (entry.Tr[alcb_index[j]].link.length>1) {
                contentTr_sub += 'By '+ entry.Tr[alcb_index[j]].credit+' ( ';
                for(var k in entry.Tr[alcb_index[j]].link){
                    contentTr_sub += '<a href='+entry.Tr[alcb_index[j]].link[k]+' target="_blank">p'+ (Number(k)+1)+'</a>' +' | ' 
                }
                contentTr_sub += '); ';
            } else {
                contentTr_sub += '<a href='+entry.Tr[alcb_index[j]].link+' target="_blank">By '+ entry.Tr[alcb_index[j]].credit+'</a>' +'; ' 
            }
        }
    }
    if (contentTr_sub!=='<i>') {
        // contentTr.push('<i>'+entry.wyasLink[i].type+'</i>: '+contentTr_sub+'  ')
        contentTr.push(TypeFormat(entry.wyasLink[i].type)+': '+contentTr_sub+'</i>  ')
    }
   }
    content += '</div></details>'
    if (contentTr.length>0){
        content += '<details open class="details-black"><summary><b>Transcripts</b></summary><div>'
        for(var i in contentTr){
            content += contentTr[i]
        }
    }  
    return content
}

function saveJSON(data, filename){
    if(!data) {
        alert('no data to be saved!');
        return;
    }
    if(!filename) 
        filename = 'json.json'
    if(typeof data === 'object'){
        data = JSON.stringify(data, undefined, 4)
    }
    var blob = new Blob([data], {type: 'text/json'}),
    e = document.createEvent('MouseEvents'),
    a = document.createElement('a')
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
}


function jump(next){
var nextInp = document.getElementById(next);
var event = arguments.callee.caller.arguments[0] || window.event;
if(event.keyCode == 13){//"enter" was pressed，keycode:13
nextInp.focus();
}
}


function dailyMaintain(file, callback) {
   var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {type: 'binary'});
        if(callback) callback(workbook);
        dataSource = calendar._dataSource;
        oSheet = workbook.Sheets["daily maintain"];
        for(var i=2;typeof(oSheet["A"+i]) !=="undefined";i++){ 
            if(typeof(oSheet["B"+i]) !=="undefined" & typeof(oSheet["C"+i]) !=="undefined" ){
                event = new Object;
                event.startDate = id2Date(oSheet["B"+i].v.toString());
                event.endDate = event.startDate;
                event.name = oSheet["A"+i].v.toString();
                event.type = oSheet["D"+i].v.toString();
                event.location = oSheet["C"+i].v.toString();
                dataSource = addEvent(dataSource,event);
            }
        }
        calendar.setDataSource(dataSource);
        document.getElementById('maintain Trs').value = "";
        obj = packEntry(calendar._dataSource);
        saveJSON(obj,"data.json");
    };
    reader.readAsBinaryString(file);
}

function addWYAS(file,callback){
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {type: 'binary'});
        if(callback) callback(workbook);
        dataSource = calendar._dataSource;
        oSheet = workbook.Sheets["journal"];
        oSheetTN = workbook.Sheets["travel notes"];
        oSheetAW = workbook.Sheets["AW's journal"];
        oSheetBLK = workbook.Sheets["new found"]
        oSheet = oSheetBLK;
        for(i=2;typeof(oSheet["F"+i])!=="undefined";i++){
            console.log(i)
            if (i===1564) {
                test = 1
            }
            data_index = dataSource.findIndex(item=>item.startDate.getTime()===id2Date(oSheet["A"+i].v).getTime());
            if(data_index!==-1){
                wyas_index = dataSource[data_index].wyasLink.findIndex(item=>item.type===oSheet["B"+i].v)
                if (dataSource[data_index].wyasLink[0].type==="") {
                    dataSource[data_index].wyasLink[0].type = oSheet["B"+i].v;
                    dataSource[data_index].wyasLink[0].link.push(oSheet["F"+i].v);
                    dataSource[data_index].wyasLink[0].tr = "";
                }else if(wyas_index===-1){
                    temp = new Object;
                    temp.type = oSheet["B"+i].v;
                    temp.link = [oSheet["F"+i].v];
                    temp.tr = "";
                    dataSource[data_index].wyasLink.push(temp);
                }else if(!dataSource[data_index].wyasLink[wyas_index].link.includes(oSheet["F"+i].v)){
                    dataSource[data_index].wyasLink[wyas_index].link.push(oSheet["F"+i].v);
                }              
            }else{
                event = new EntryObj();
                event.startDate = id2Date(oSheet["A"+i].v);
                event.endDate = event.startDate;
                event.wyasLink[0].type = oSheet["B"+i].v;
                event.wyasLink[0].link.push(oSheet["F"+i].v);
                dataSource.push(event);
                dataSource.sort(function(a,b){
                    if(a.startDate.getTime()>b.startDate.getTime()){return 1}
                    else if(a.startDate.getTime()<b.startDate.getTime()){return -1}
                        else{return 0}
                })
                dataSource.sort(function(a, b){return a.startDate.getTime() > b.startDate.getTime() ? 1 : -1;});
            }
        }
        calendar.setDataSource(dataSource);
        document.getElementById('maintain Trs').value = "";
    };
    reader.readAsBinaryString(file);
}

function updateTrWYAS(vol_type,vol_index){
    dataSource = calendar._dataSource
    url_prefix = "https://www.catalogue.wyjs.org.uk/CalmView/Record.aspx?src=CalmView.Catalog&id=CC00001/7/9/"
    if (vol_type === "journal") {url_prefix += "6/"}
        else if (vol_type === "travel notes") {url_prefix += "10/"}
            else if(vol_type === "AW's journal"){url_prefix = "https://www.catalogue.wyjs.org.uk/CalmView/Record.aspx?src=CalmView.Catalog&id=WYAS4971/7/1/5/"}
                else if(vol_type === "journal [in AC]"){url_prefix += "9/"}
    url_prefix += vol_index+"/"
    for (i = 0; i<dataSource.length; i++){
        for (j in dataSource[i].wyasLink){
             if(dataSource[i].wyasLink[j].link.findIndex(x=>x.includes(url_prefix))!==-1){
                dataSource[i].wyasLink[j].tr = "y";
             }
        }
    }
    calendar.setDataSource(dataSource)
    // obj = packEntry(calendar._dataSource);
    // saveJSON(obj,"data.json");
}
