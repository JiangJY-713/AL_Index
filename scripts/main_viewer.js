const calendar = new Calendar('#calendar', {
    startYear: 1817,
    style: 'background',
    minDate: new Date(1800,4, 21),
    maxDate: new Date(1840,7,13),
    dataSource:  function(){
        // Load data from GitHub  "https://raw.githubusercontent.com/JiangJY-713/AL_Index/main/data/"
        return fetch("https://raw.githubusercontent.com/JiangJY-713/AL_Index/main/data/data.json")
      .then(result => result.json())
      .then(result => unpackEntry(result));
  },
    enableContextMenu: false,
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

});



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
    //event.name = " Lily Mo (@woollymitts)";

    var dataSource = calendar._dataSource;

    if (event.startDate) {
        entry_exist = 0;
        for (var i in dataSource) {
            if (dataSource[i].startDate.getTime() === event.startDate.getTime()) {
                credit_exist = 0;
                for(var j in dataSource[i].Tr.other){
                    if(dataSource[i].Tr.other[j].credit===event.name){
                        dataSource[i].Tr.other[j].link.push(event.location);
                        credit_exist = 1;
                    }
                }
                if (credit_exist === 0){
                    temp = new Object;
                    temp.credit = event.name;
                    temp.link = [event.location];
                    dataSource[i].Tr.other.push(temp);
                }
            entry_exist = 1;
            }
        }
        if (entry_exist===0) {
            temp = new EntryObj();
            temp.startDate = event.startDate;
            temp.endDate = event.endDate;
            temp.Tr.other[0].credit = event.name;
            temp.Tr.other[0].link.push(event.location);
            temp.Tr.wyas = "n";
            dataSource.push(temp);
            dataSource.sort(function(a,b){
                return a.startDate - b.startDate;
            })
        }
    }

    
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
            for (var i = 1817; i <= 1840; i++) {
                bar = document.createElement("progress")
                switch(i){
                    case "1817": 
                        entry_num = 224
                        break;
                    case "1840":
                        entry_num = 226
                        break;
                    case "1820"|"1824"|"1828"|"1832":
                        entry_num = 366
                    default:
                        entry_num = 365;
                  }
                annual_Tr = dataSource.filter(item => item.Tr.other[0].credit.length>0&item.startDate.getFullYear()===i);
                bar.max = entry_num
                bar.value = annual_Tr.length;
                bar.id = "Tr"+i;
                bar.style.width = "80px"
                label = document.createElement("label")
                label.innerText = "  "+i+" "
                label.style.margin = "8px"
                label.appendChild(bar);
                progress.appendChild(label);
            }
            let currentDiv = document.getElementById("feature");
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


function unpackEntry(entry_info){
   return entry_info.map(x=>({
    startDate: new Date(x.id),
    endDate: new Date(x.id),
    wyasLink: x.wyasLink,
    Tr: x.Tr,
    tag: x.tag
   }))
}

function packEntry(dataSource){
    return dataSource.map(x=>({
        id: x.startDate.getFullYear()+','+(Number(x.startDate.getMonth())+1)+','+x.startDate.getDate(),
        wyasLink: x.wyasLink,
        Tr: x.Tr,
        tag: x.tag
    }))
}

function EntryObj(){
    this.startDate = "";
    this.endDate = "";
    this.wyasLink = {};
    this.wyasLink.journal = [];
    this.wyasLink.journal_index = [];
    this.wyasLink.travel_note = [];
    this.Tr = {};
    //this.Tr.wyas = "";
    this.Tr.other = [{}];
    this.Tr.other[0].link = [];
    //this.Tr.other.credit = "";
    this.tag = {};
    
}

function DispRef(entry){
    content = '<div class="event-tooltip-content"><div  class="WYAS" >' + 'WYAS Link: ' 
   for (var i in entry.wyasLink.journal){
    journalRef_index = Number(i)+1
    journalRef = 'Journal (p'+journalRef_index+')'
    content += '<a href='+entry.wyasLink.journal[i]+' target="popsite" id="externallink">'+journalRef+'</a>' +'; '
   }
    content += '</div>'

    if (entry.Tr.wyas=='y'|entry.Tr.other[0].link.length>0){
        content += '<div class="Tr">Transcripts: '
       if (entry.Tr.wyas=='y') {
        content += 'WYAS ver. available (see above); '
       } 
        if (entry.Tr.other[0].link.length>0) {
        for (var i in entry.Tr.other){
            if (entry.Tr.other[i].link.length>1) {
                content += 'By '+ entry.Tr.other[i].credit+' ( ';
                for(var j in entry.Tr.other[i].link){
                    content += '<a href='+entry.Tr.other[i].link[j]+' target="popsite">p'+ (Number(j)+1)+'</a>' +' | ' 
                }
                content += ')';
            } else {
                content += '<a href='+entry.Tr.other[i].link+' target="popsite">By '+ entry.Tr.other[i].credit+'</a>' +'; ' 
            }
       }
    }}

    content += '</div>'
    
   content += '</div>'
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
if(event.keyCode == 13){//judge if enter was pressed，keycode:13
nextInp.focus();
}
}
