// Transcripts coverage
DispTrProgress();

function DispTrProgress(){
    var dataSource = calendar._dataSource;
    calendar.setDataSource(dataSource.filter(item => item.startDate.getTime() !== event.startDate.getTime()));
    for (var year = 1817; year <= 1840; year++) {
        var bar = document.getElementById("bar");
          switch(year){
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
        annual_Tr = dataSource.filter(item => item.Tr.other[0].credit.length>0&item.startDate.getFullYear===year);
        bar.style.width = annual_Tr/entry_num;
        bar.style.width = parseInt(bar.style.width) +1 +"%";
        bar.innerHTML = bar.style.width;
    }
}