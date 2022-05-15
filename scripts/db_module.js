'use strict'
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs');
const xlsx = require('node-xlsx');
const async = require('async')
const axios = require('axios-extra');
axios.defaults.maxConcurrent = 5; //修改并发为1
axios.defaults.queueOptions.retry = 2; //修改默认重试次数为2
const cheerio =  require('cheerio');
const httpsProxyAgent = require('https-proxy-agent');
const https = require('https');
const rootCas = require('ssl-root-cas').create();
rootCas.addFile('E:/AL/Project/AL_index/scripts/node_modules/ssl-root-cas/pems/GeoTrust TLS DV RSA Mixed SHA256 2020 CA-1.pem')
const httpAgent = new httpsProxyAgent("http://127.0.0.1:7890");
const httpAgent_temp = new https.Agent({ca: rootCas});
httpAgent.options = httpAgent_temp.options;


let myHeaders = {
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
}

function createDBtable(db,table_name){
    if (table_name.includes('entry')){
        db.run('CREATE TABLE entry(entry_id INT PRIMARY KEY, date TEXT, type TEXT, tag TEXT, tag_id TEXT)', function (err) {
            if (err) {
                return console.log(err)
            }
            console.log('create table entry')
        })
    }
    if (table_name.includes('wyas')){
        db.run('CREATE TABLE wyas(entry_id INT, date TEXT, type TEXT, part INT, vol TEXT, page INT, finding_num TEXT, link TEXT, text TEXT '+
        ', FOREIGN KEY (entry_id) REFERENCES entry (entry_id))', function (err) {
            if (err) {
                return console.log(err)
            }
            console.log('create table wyas')
        })
    }
    if (table_name.includes('alcb')){
        db.run('CREATE TABLE alcb (entry_id INT, part INT, credit TEXT, link TEXT, text TEXT '+
        ', FOREIGN KEY (entry_id) REFERENCES entry (entry_id))', function (err) {
            if (err) {
                return console.log(err)
            }
            console.log('create table alcb')
        })
    }
    if (table_name.includes('tag_index')){
                db.run('CREATE TABLE tag_index(tag_id INT PRIMARY KEY, tag TEXT, entry_id TEXT, parent_tag TEXT)', function (err) {
            if (err) {
                return console.log(err)
            }
            console.log('create table tag_index')
        })
    }
}

// initial insert from calendar JSON data to TABLE wyas
function insertWYAS_ENTRY(db,data,start_line,end_line){
    for(var i=start_line-1; i<end_line&i<data.length;i++){
        var date = data[i].id;
        for(var j in data[i].wyasLink){
            var entry_id = data[i].wyasLink[j].entry_id;
            var type = data[i].wyasLink[j].type;
            db.run('INSERT INTO entry(entry_id, date, type) VALUES(?,?,?)',[entry_id,date,type], function (err) {
                if (err) {
                    return console.log(err.message)
                }
                console.log('inserted: TABLE entry  '+ ['entry_id:'+entry_id+' '+date+' '+type])
            })
            for (var k in data[i].wyasLink[j].link){
                var part = Number(k)+1;
                var link = data[i].wyasLink[j].link[k];
                var finding_num_temp = link.slice(link.indexOf('id=')+3,link.length).split('/');
                var vol = Number(finding_num_temp[finding_num_temp.length-2]);
                var page = Number(finding_num_temp[finding_num_temp.length-1]);
                if(type==="AW's journal"){
                    var finding_num = 'WYC:1525/7/1/5/'+vol+'/'+page;
                }else if(finding_num_temp[0]==="CC00001"&finding_num_temp[1]==="7"&     //travel notes
                finding_num_temp[2]==="9"&finding_num_temp[3]==="10"){
                    var finding_num = 'SH:7/ML/TR/'+vol+'/'+('000'+page).slice(-4);
                    // db.run('UPDATE wyas SET finding_num=(?) WHERE link=(?)',
                    // [finding_num,link], 
                    // function (err) {
                    //     if (err) {
                    //         return console.log('update data error: ', err.message, entry_id)
                    //     }
                    //     console.log('update data: ', this)
                    // })
                }else if(finding_num_temp[0]==="CC00001"&finding_num_temp[1]==="7"&     //journal
                finding_num_temp[2]==="9"&finding_num_temp[3]==="6"){
                    var finding_num = 'SH:7/ML/E/'+vol+'/'+('000'+page).slice(-4);
                }
                db.run('INSERT INTO wyas(entry_id, part, vol, page, finding_num, link) VALUES(?,?,?,?,?,?)',
                [entry_id,part,vol,page,finding_num,link], function (err) {
                    if (err) {
                        return console.log(err.message)
                    }
                    console.log('inserted: TABLE wyas  '+ ['entry_id:'+entry_id+' vol:'+vol+' page:'+page])
                })
                
            }
        }        
    }
}

// initial insert from calendar JSON data to TABLE alcb
async function insertALCB(db,data,start_line, end_line){
    // var data = require('../../data/data+entry_id.json')
    let tasks = [];
    console.time('insert alcb')
    for(var i=start_line-1; i<end_line&i<data.length;i++){
        if (data[i].Tr[0].credit!==""){
            for (var j in data[i].Tr) {
                for (var k in data[i].Tr[j].link){
                    console.log(i+'  '+data[i].id+'  '+data[i].Tr[j].credit)
                    var doc = new Object;
                    doc.part = Number(k)+1;
                    doc.entry_id = data[i].wyasLink.filter(item=>item.type===data[i].Tr[j].type)[0].entry_id;
                    doc.credit = data[i].Tr[j].credit;
                    doc.link = data[i].Tr[j].link[k];
                    var rows = await new Promise((resolve, reject) => {                
                        db.all('SELECT link FROM alcb WHERE entry_id=(?) AND credit=(?)',[doc.entry_id,doc.credit], (err, rows) => {
                            if (err)
                                reject(err)
                            resolve(rows)
                        })
                    }).catch(err=>console.log('find entry_id error: ', err.message))
                    if (rows.length>0 & rows.findIndex(item=>item.link===doc.link)!==-1){
                        console.log('alcb record existed! '+doc.entry_id+' '+doc.credit)
                        continue;
                    }else{
                        crawler_single(doc,db,'insert alcb'); 
                    }
                }
            }
        }
    }
    console.timeEnd('insert alcb')
    console.log('Finish!')
}

// Regular ALCB Transcipts maintenance, reading from Excel file
async function updateALCBdoc(db,mode){
    // var data = require('../../data/data+entry_id.json');
    var sheets = xlsx.parse('../data/Transcript Calendar.xlsx');
    var oSheet = sheets.find(element=>element.name==='daily maintain').data; 
    oSheet = oSheet.filter(item=>typeof(item[0])!=="undefined" & typeof(item[1]) !=="undefined" & typeof(item[2]) !=="undefined" );
    for(var i=1; i<oSheet.length; i++){   
      console.log('row ('+i + ') ' + oSheet[i][1] + ' ' + oSheet[i][0] + ' ' +oSheet[i][3]);
        var type = oSheet[i][3];
        var date = oSheet[i][1];
        var doc = new Object;       // doc: entry_id,part,credit,link,text      
        doc.credit = oSheet[i][0];
        doc.link = oSheet[i][2];
        doc.type = type;
        doc.date = date;
        var rows = await new Promise((resolve, reject) => {                
            db.all('SELECT entry_id FROM entry WHERE type=(?) AND date=(?)',[type, date], (err, rows) => {
                if (err)
                    reject(err)
                resolve(rows)
            })
        }).catch(err=>console.log('find entry_id error: ', err.message))
        doc.entry_id = rows[0].entry_id;
        var rows = await new Promise((resolve, reject) => {                
            db.all('SELECT link FROM alcb WHERE entry_id=(?) AND credit=(?)',[doc.entry_id,doc.credit], (err, rows) => {
                if (err)
                    reject(err)
                resolve(rows)
            })
        }).catch(err=>console.log('find entry_id error: ', err.message))
        if (rows.length>0 & rows.findIndex(item=>item.link===doc.link)!==-1){
            console.log('alcb record existed! '+doc.entry_id+' '+doc.credit)
            continue;
        }else{
            doc.part = rows.length+1;
            await crawler_single(doc,db,mode);
        }
    }
}


// Fetch WYAS newly-checked-volumes of transcripts
// vol_type = "journal"/"travel notes"/AW's journal
function updateWYASdoc(vol_type, vol_index, db){
    switch(vol_type){
        case "journal":
            var prefix = "CC00001/7/9/6/"+vol_index;
            break;
        case "travel notes":
            var prefix = "CC00001/7/9/10/"+vol_index;
            break;
        case "AW's journal":
            var prefix = "WYAS4971/7/1/5/"+vol_index;
            break;
    }
    db.all('SELECT link,date,type,entry_id,part FROM wyas WHERE link LIKE (?)',["%"+prefix+"/%"],(err,rows)=>{
        if (err)
            return console.log(err.message)
        var rows = arrayGroupBy(rows,"link");
        Promise.all(
            rows.map(async (x)=> {
                crawler_single(x,db,'update wyas')
            })
        )
    })
}

function arrayGroupBy(list, groupId){
    function groupBy(array, f){
        const groups = {}
        // var groupId_list = [];
        array.forEach(function (o) {
            const group = JSON.stringify(f(o))
            groups[group] = groups[group] || []
            groups[group].push(o)      
        })
        return Object.keys(groups).map(function (group) {
            return groups[group]
        })
    };
    return groupBy(list, function (item) {
        return item[groupId]
    });
};

function DateModeList(date_id){
    var mode_list = [];
    var month_list = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    var week_list = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    var date_element = date_id.split(",");
    var yy = Number(date_element[0]);
    var mm = Number(date_element[1])-1;
    var dd = Number(date_element[2]);
    var date = new Date(yy,mm,dd);
    var week_id = date.getDay();
    var month_id = date.getMonth();
    // mode_list.push(date_element[2]);
    // mode_list.push(month_list[month_id]+' '+dd);
    mode_list.push(week_list[week_id]+' '+dd);
    return mode_list
}

// fetch transcripts, mode = "insert alcb"/"update alcb"/"update wyas".
async function crawler_single(doc,db,mode){
    if (mode.includes('alcb')){
        var url = doc.link;
        var text = "";
    }else if (mode.includes('wyas')){
        var url = doc[0].link;
    }
    
    let $ = await new Promise((resolve, reject) => {   
        console.log(url)
        axios.get(url, {httpsAgent:httpAgent,headers:myHeaders,proxy: {
            host: '127.0.0.1',
            port: 7890,
          },}).then(res=>{
            console.log(res.status);
            resolve(cheerio.load(res.data))
        }
        ).catch(error=>{return reject(error)})          
    }).catch(error=>{
        console.log(error+': '+doc.entry_id+' '+doc.credit+' '+doc.link)
    })       
    if (typeof($)==="undefined"){
        return 
    }else{
        // text processing
        if (mode.includes('alcb')){
            if(url.includes('tumblr.com')){
                let data_post_id = url.split("/");
                data_post_id = data_post_id[4];
                if(url.includes('skgway.tumblr.com')|url.includes('wrotetheaboveoftoday.tumblr.com')
                |url.includes('babysackville.tumblr.com')){
                    $(".text").find("p").each(function(i,v){
                        text += cleanText(v,$);
                    })
                }else if(url.includes('anne-lister-adventures.tumblr.com')|url.includes('listersisterjournal.tumblr.com')){
                    $("article.template-main-section-content-post").find(".template-post-content-body").find("p").each(function(i,v){
                        text += cleanText(v,$);
                    })
                }else if(url.includes('veryfineday.tumblr.com')){
                    $("article[id=post-"+data_post_id+"]").find("p").each(function(i,v){
                        text += cleanText(v,$);
                    })
                }else if(url.includes('listertranscriptions.tumblr.com')){
                    $(".caption_content.color_class_inner").find("p").each(function(i,v){
                        text += cleanText(v,$);
                    })
                }else{
                    $("article[data-post-id="+data_post_id+"]").find("div.body-text").find("p").each(function(i,v){
                        text += cleanText(v,$);
                    })
                }
            }else if(url.includes('blogspot.com')){
                if (url.includes('iloveandonlylovethefairersex.blogspot.com')){              
                    $(".post-body.entry-content.float-container").find("span").each(function(i,v){
                        text += cleanText(v,$);
                    })
                    text = text.slice(0,text.indexOf("Original diary pages:"))
                    text = text.slice(0,text.indexOf("Original page here:"))
                }else{
                    $(".post-body.entry-content.float-container").find("p").each(function(i,v){
                        text += cleanText(v,$);
                    })
                }
            }else if(url.includes('xldev.co.uk')){
                $("br").replaceWith(" ");
                $("span.footnote").remove();
                $("span.tooltiptext").remove();
                let data_post_id = url.split("#");
                data_post_id = data_post_id[data_post_id.length-1];
                for(var i = $("a[name="+data_post_id+"]").next(); i.length>0;i=i.next()){
                    if (i[0].name==='span'&i[0].attribs.class!=='footnote'){
                        text += cleanTextStr(i.text());
                    }else if(i[0].name==='a'){
                        break;
                    }
                }
            }else if (url.includes('tolerablygoodtranscriptions.wordpress.com')){
                var month_list = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                var rows = await new Promise((resolve, reject) => {                
                    db.all('SELECT date FROM entry WHERE entry_id=(?)',[doc.entry_id], (err, rows) => {
                        if (err)
                            reject(err)
                        resolve(rows)
                    })
                }).catch(err=>console.log('find entry_id error: ', err.message))
                let data_post_id_temp = rows[0].date.split(',');
                let data_post_id = data_post_id_temp[2]+' '+month_list[Number(data_post_id_temp[1])-1]+
                    ' '+data_post_id_temp[0];
                $("br").replaceWith(" ");
                text += cleanTextStr($('h2:contains('+data_post_id+')').next().text());
            }else if(url.includes("annelistersibellamaclean.wordpress.com")){
                $(".entry-content").find("p").each(function(i,v){
                    text += cleanText(v,$);
                })
            }
            else if(url.includes("insearchofannwalker.com")){
                var rows = await new Promise((resolve, reject) => {                
                    db.all('SELECT type FROM entry WHERE entry_id=(?)',[doc.entry_id], (err, rows) => {
                        if (err)
                            reject(err)
                        resolve(rows)
                    })
                }).catch(err=>console.log('find entry_id error: ', err.message))
                if (rows[0].type==="AW's journal"){
                    var prefix = "WYC:1525/7/1/5/";
                }else if (rows[0].type==="journal"){
                    var prefix = "SH:7/ML/E/";
                }
                $("div.wp-block-column:contains("+ prefix +")").find("p").each(function(i,v){
                    if(!$(v).text().includes(prefix)){
                        text += cleanText(v,$);
                    }
                })
            }
            text = text.replace(/^\s*|\s*$/g,"");
            if (text!==""){
                doc.text = text;
            }else{
                console.log('Failed to fetch text: entry_id = '+doc.entry_id+'  part:'+doc.part)
                fs.appendFileSync('update alcb error.txt','Failed to fetch text: entry_id = '+doc.entry_id+'  part:'+doc.part)
            }
            updateTR_inDB(doc,db,mode)
        }else if(mode.includes('wyas')){
            $('td.tabletitle:contains(Description)').next().find("br").replaceWith("\n");
            var text_list = $('td.tabletitle:contains(Description)').next().text().split("\n");
            text_list.splice(0,1);
            // if other than journal, update manually
            if (doc.findIndex(item=>item.type!=='journal')===-1){
                for (var i in doc){
                    var date_mode = new RegExp('^'+DateModeList(doc[i].date)[0]+'|'+DateModeList(doc[i].date)[0]+'$')
                    // var date_mode_h = new RegExp('^'+DateModeList(doc[i].date)[0])
                    if (doc[i].part===1){
                        doc[i].start_row = text_list.findIndex(item=>item.toLowerCase().match(date_mode)!==null)
                    }else{
                        doc[i].start_row = 2
                    }
                    doc[i].text ="";
                }
                doc.sort(function(a,b){
                    return (a.start_row-b.start_row)
                })
                for (var i=0;i<doc.length;i++){
                    if (i===doc.length-1){
                        var end_row = text_list.length;
                    }else{var end_row = doc[Number(i)+1].start_row-1}
                    for (var j = doc[i].start_row;j<end_row;j++){
                        doc[i].text += text_list[j]+"\n";
                    }
                }
                doc.map(x=>updateTR_inDB(x,db,'update wyas'))
            }
        }
    }         
}



// date_id:"yy,mm,dd", which is the form stored in DB
function dateID2Date(date_id){
    date_element = date_id.split(",");
    yy = Number(date_element[0]);
    mm = Number(date_element[1])-1;
    dd = Number(date_element[2]);
    return new Date(yy,mm,dd);
}

function cleanText(v,$){
    if ($(v).text().length < 15 & $(v).text().match(/[A-Za-z]{2,}/g)===null){
        $(v).find("br").replaceWith("\n");
    }else{
        $(v).find("br").replaceWith(" ");
    }    
    var temp = $(v).text().toLowerCase();
    if (temp.includes("original diary pages:")|temp.includes("original page here:")|
    temp.includes("reference number:")|temp.includes("page references:")|
    temp.includes("wyas")|temp.includes("diary reference:")|temp.includes("diary page: ")|
    temp.includes("you can see the original diary entry here:")|temp.includes("you can read the original diary entry here:")){
        return "";
    }else{
        var sub_text = $(v).text();
        sub_text = cleanTextStr(sub_text);
        return sub_text;
    }
}

function cleanTextStr(sub_text){
    var sub_text = sub_text.replace(/\t+/g," ");
    // keep necessary square brackets and remove the rest
    var matches_pre = sub_text.match(/[A-Za-z]*\[([^A-Z]*?)][A-Za-z]*/g);
    if (matches_pre!==null){
        if (matches_pre.filter(item=>item[0]!=="["|item[item.length-1]!=="]").length>0){
            var matches = sub_text.match(/\[([A-Z]+.*?)]/g);
            if (matches!==null){
                for (var i in matches){
                    sub_text = sub_text.replace(matches[i]," "+matches[i])
                }
            }
            matches = sub_text.match(/\S\[sic]/g);
            if (matches!==null){
                for (var i in matches){
                    sub_text = sub_text.replace(matches[i],matches[i].replace(/\[/g," ["))
                }
            }
            matches = sub_text.match(/[A-Za-z]*\[([^A-Z]*?)][A-Za-z]*/g);
            if (matches!==null){
                for (var i in matches){
                    if (matches[i].match(/\[([^A-Za-z].*?)]/g)===null
                    &(matches[i][0]!=="["|matches[i][matches[i].length-1]!=="]")){
                        sub_text = sub_text.replace(matches[i],matches[i].replace(/\[|]/g,""));
                    }
                    else if(matches[i].match(/\[([^A-Za-z].*?)]/g)===null&sub_text.indexOf(matches[i])>0){
                        if(/^[a-zA-z]*$/.test(sub_text[sub_text.indexOf(matches[i])-1])){
                            sub_text = sub_text.replace(matches[i],matches[i].replace(/\[|]/g,""));
                        }
                    }
                    
                    // sub_text[sub_text.match(matches[i]).index-1]!==' '
                }
            }
            }
    }
    //start a new line if it's title/time/margin symbol/margin notes/WYAS reference/annotation
    if (sub_text.length>15|sub_text.match(/[A-Za-z]{2,}/g)!==null){
        sub_text = (sub_text+" ").replace(/\s+/g," ")
    }
    
    if (sub_text.length<30 |sub_text.includes('}')|sub_text.includes('{')
    |sub_text.includes(' margin')|sub_text.includes('WYAS')|sub_text.match(/^\[[0-9]+]/g)!==null){
        sub_text += '\n';
        if (sub_text.includes(' margin')|sub_text.includes('WYAS')|sub_text.match(/^\[[0-9]+]/g)!==null){
            sub_text = '\n' + sub_text;
        }
    }
    return sub_text;
}

async function updateTR_inDB(doc,db,mode){
    switch(mode){
        case 'insert alcb': db.run('INSERT INTO alcb(entry_id, part, credit, link, text,date,type) VALUES(?,?,?,?,?,?,?)',
        [doc.entry_id,doc.part,doc.credit,doc.link,doc.text,doc.date,doc.type], function (err) {
            if (err) {
                return console.log(err.message)
            }
            console.log('inserted: ',this)
        });
        db.run('INSERT INTO alcb_fts(text, credit, link, date,type,part) VALUES(?,?,?,?,?,?)',
        [doc.text,doc.credit,doc.link,doc.date,doc.type,doc.part], function (err) {
            if (err) {
                return console.log(err.message)
            }
            console.log('inserted: ',this)
        });
        break;
        case 'update alcb': db.run('UPDATE alcb SET text=(?) WHERE entry_id=(?) AND part=(?) AND credit=(?)',
        [doc.text,doc.entry_id,doc.part,doc.credit], function (err) {
            if (err) {
                return console.log('update alcb error: ', err.message)
            }
            console.log('update alcb: ', this)
        });
        db.run('UPDATE alcb_fts SET text=(?) WHERE date=(?) AND type=(?) AND part=(?) AND credit=(?)',
        [doc.text,doc.date,doc.type,doc.part,doc.credit], function (err) {
            if (err) {
                return console.log('update alcb error: ', err.message)
            }
            console.log('update alcb: ', this)
        });
        break;
        case 'update wyas':db.run('UPDATE wyas SET text=(?) WHERE entry_id=(?) AND part=(?)',
        [doc.text,doc.entry_id,doc.part], function (err) {
            if (err) {
                return console.log('update wyas error: ', err.message)
            }
            console.log('update wyas: ', this)
        });
        db.run('UPDATE wyas_fts SET text=(?) WHERE date=(?) AND type=(?) AND part=(?)',
        [doc.text,doc.date,doc.type,doc.part], function (err) {
            if (err) {
                return console.log('update wyas error: ', err.message)
            }
            console.log('update wyas: ', this)
        });
        break;
    }
}

exports.createDBtable = createDBtable;
exports.insertWYAS_ENTRY = insertWYAS_ENTRY;
exports.insertALCB = insertALCB;
exports.updateALCBdoc = updateALCBdoc;
exports.updateWYASdoc = updateWYASdoc;
exports.crawler_single = crawler_single;