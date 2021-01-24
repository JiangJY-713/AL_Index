// fetch("./data/EntryData.json")
//   .then(response => response.json())
//   .then(EntryData = JSON.parse(response));
// EntryData = JSON.parse(EntryData)



const calendar = new Calendar('#calendar', {
    startYear: 1817,
    style: 'background',
    minDate: new Date(1800,4, 21),
    maxDate: new Date(1840,7,13),
    dataSource:  function(year){
        // Load data from GitHub  "https://raw.githubusercontent.com/JiangJY-713/AL_Index/main/data/"
        return fetch("https://raw.githubusercontent.com/JiangJY-713/AL_Index/main/data/"+year+'.json')
      .then(result => result.json())
      .then(result => unpackEntry(result));
  },
    enableContextMenu: true,
    enableRangeSelection: true,
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
    var dataSource = calendar.getDataSource();
    
    calendar.setDataSource(dataSource.filter(item => item.id == event.id));
}

function saveEvent() {
    var event = {
        id: $('#event-modal input[name="event-index"]').val(),
        name: $('#event-modal input[name="event-name"]').val(),
        location: $('#event-modal input[name="event-location"]').val(),
        startDate: $('#event-modal input[name="event-start-date"]').datepicker('getDate'),
        endDate: $('#event-modal input[name="event-end-date"]').datepicker('getDate')
    }
    

    //var dataSource = calendar.getDataSource();

    var dataSource = calendar._dataSource;
    //var temp = Object.create(dataSource[0])
    //temp = temp._proto_;
    //Object.keys(temp).forEach(key=>temp[key] = "");
    

    if (event.startDate) {
        entry_exist = 0;
        for (var i in dataSource) {
            if (dataSource[i].startDate.getTime() === event.startDate.getTime()) {
                if (dataSource[i].Tr.other[0].link.length===0) {
                    dataSource[i].Tr.other[0].link = event.location
                    dataSource[i].Tr.other[0].credit = event.name
                } else {
                    temp.credit = event.name;
                    temp.link = event.location;
                    dataSource[i].Tr.other.push(temp);
                }

            entry_exist = 1;
                //dataSource[i].startDate = event.startDate;
                //dataSource[i].endDate = event.endDate;
            }
        }
        if (entry_exist===0) {
            temp = new EntryObj();
            temp.startDate = event.startDate;
            temp.endDate = event.endDate;
            temp.Tr.other[0].credit = event.name;
            temp.Tr.other[0].link = event.location;
            temp.Tr.wyas = "n";
            dataSource.push(temp);
        }
    }

    
    calendar.setDataSource(dataSource);
    $('#event-modal').modal('hide');
}


// bottoms etc.

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


// $(function() {
//     $("#update-current-year").onclick(function(event) {
//         calendar.setYear(document.querySelector('#current-year').value);
//     });
// });

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
    //this.Tr.other.link = "";
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

    if (entry.Tr.wyas=='y'|entry.Tr.other[0].link.length !== 0){
        content += '<div class="Tr">Transcripts: '
       if (entry.Tr.wyas=='y') {
        content += 'WYAS ver. available (see above); '
       } 
        if (entry.Tr.other[0].link.length !== 0) {
        for (var i in entry.Tr.other){
            content += '<a href='+entry.Tr.other[i].link+' target="popsite">By '+ entry.Tr.other[i].credit+'</a>' +'; ' 
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