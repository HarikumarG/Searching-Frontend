import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery'

export default class KeywordsearchComponent extends Component {

    @tracked loginpage = true;
    @tracked searchpage = false;
    @tracked analytics = false;
    @tracked chartType = false;

    @tracked analyticsdata = undefined;

    folderpath = "";
    filename = "";
    lineNo = 1;
    keyword = undefined;
    responsedata = undefined;
    folderregexlinux = /^\/$|(\/[a-zA-Z_0-9-]+)+$/;

    constructor() {
        super(...arguments);
        google.charts.load('current', {packages: ['corechart','table']});
    }
    @action onValidate() {
        if(this.folderInput == undefined || this.fileInput == undefined) {
            alert("Fill all the fields");
            location.reload();
        } else if(this.folderInput != undefined && !this.folderregexlinux.test(this.folderInput)) {
            alert("Enter valid Folder Path");
            location.reload();
        }
        else {
            this.checkpathReq();
        }
    }

    @action onSearch() {
        if(this.keywordInput != undefined) {
            this.searchReq();
        } else {
            alert("Enter the keyword to be searched");
        }
    }

    @action onAnalytics() {
        if(this.keyword != undefined) {
            this.getAnalyticsReq();
        } else {
            alert("Keyword is undefined");
        }
    }

    @action onTableView() {
        this.clearChart();
        this.drawChart(this.analyticsdata,"tablechart");
    }

    @action onBarView() {
        this.clearChart();
        this.drawChart(this.analyticsdata,"barchart");
    }

    @action onColView() {
        this.clearChart();
        this.drawChart(this.analyticsdata,"colchart");
    }

    checkpathReq() {
        jQuery.ajax({
            url:"http://localhost:8080/Searching-Backend/checkpath",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "folderpath":this.folderInput+"/",
                "filename":this.fileInput
            })
        }).then((response) => {
            if(response == "SUCCESS") {
                this.folderpath = this.folderInput+"/";
                this.filename = this.fileInput;
                this.loginpage = false;
                this.searchpage = true;
            } else {
                alert("No such file exist in the specified path");
                location.reload();
            }
        }).catch(function(error) {
            console.log(error);
        })
    }
    searchReq() {
        jQuery.ajax({
            url:"http://localhost:8080/Searching-Backend/keywordsearch",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "folderpath":this.folderpath,
                "filename":this.filename,
                "keyword":this.keywordInput
            })
        }).then((response) => {
            this.keyword = this.keywordInput;
            $("#display-results").empty();
            for(var key in response[this.keyword]) {
                var sentence = response[this.keyword][key];
                if(sentence.length > 0) {
                    this.displaytoDOM(sentence,this.keyword,this.lineNo);
                    this.lineNo++;
                }
            }
            if(response[this.keyword].length > 0) {
                this.analytics = true;
            } else {
                alert("No results for the search");
            }
        }).catch(function(error) {
            console.log(error);
        })
    }
    async getAnalyticsReq() {
        await jQuery.ajax({
            url:"http://localhost:8080/Searching-Backend/analytics",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "keyword":this.keyword
            })
        }).then((response) => {
            console.log(response);
            this.responsedata = response;
            this.charts(this.responsedata);
            this.chartType = true;
        }).catch(function(error) {
            console.log(error);
        })
    }

    displaytoDOM(sentence,key,lineNo) {
        const tbody = document.querySelector("#display-results");
        let trow = document.createElement('tr');

        let tdata1 = document.createElement('td');
        var line = document.createTextNode(lineNo);
        tdata1.appendChild(line);

        let tdata2 = document.createElement('td');
        let datadiv = document.createElement('div');
        
        var regexExp = new RegExp(key,"g");
        const replaceWith = "<span class='highlight'>"+key+"</span>";
        var fi = sentence.replace(regexExp,replaceWith);

        datadiv.innerHTML = fi;
        tdata2.appendChild(datadiv);

        trow.appendChild(tdata1);
        trow.appendChild(tdata2);

        tbody.appendChild(trow);
    }

    charts(data) {
        var searches = data["searchcount"];
        var results = data["resultcount"];
        var time = data["timetaken"];
        let d = {
            smaxkey:searches[0]["keyname"],
            smaxval:searches[0]["keyval"],
            sckey:searches[1]["keyname"],
            scval:searches[1]["keyval"],
            sminkey:searches[2]["keyname"],
            sminval:searches[2]["keyval"],
            rmaxkey:results[0]["keyname"],
            rmaxval:results[0]["keyval"],
            rckey:results[1]["keyname"],
            rcval:results[1]["keyval"],
            rminkey:results[2]["keyname"],
            rminval:results[2]["keyval"],
            tmaxkey:time[0]["keyname"],
            tmaxval:time[0]["keyval"],
            tckey:time[1]["keyname"],
            tcval:time[1]["keyval"],
            tminkey:time[2]["keyname"],
            tminval:time[2]["keyval"],
        }
        this.analyticsdata = d;
    }
    drawChart(data,type) {
        if(type === "tablechart") {
            var tableval = this.data_div_tableType(data);
            var chart = new google.visualization.Table(document.getElementById('data_div'));
            chart.draw(tableval[0],tableval[1]);
        }
        else if(type === "barchart") {
            var dataval = this.data_div_arrayType(data);
            var chart = new google.visualization.BarChart(document.getElementById('data_div'));
            chart.draw(dataval[0],dataval[1]);
            var timeval = this.time_div_arrayType(data);
            var timechart = new google.visualization.BarChart(document.getElementById('time_div'));
            timechart.draw(timeval[0],timeval[1]);
        } else if(type === "colchart") {
            var dataval = this.data_div_arrayType(data);
            var chart = new google.visualization.ColumnChart(document.getElementById('data_div'));
            chart.draw(dataval[0],dataval[1]);
            var timeval = this.time_div_arrayType(data);
            var timechart = new google.visualization.ColumnChart(document.getElementById('time_div'));
            timechart.draw(timeval[0],timeval[1]);
        }
    }
    clearChart() {
        $('#data_div').empty();
        $('#time_div').empty();
    }
    data_div_arrayType(data) {
        var d = google.visualization.arrayToDataTable([
                ['Type',      'MAX',{ role: 'annotation'}, 'MIN',{ role: 'annotation'}, 'CURRENT',{ role: 'annotation'}],
                ['Searches',  data.smaxval,data.smaxkey,   data.sminval,data.sminkey,    data.scval,data.sckey],
                ['Results',   data.rmaxval,data.rmaxkey,   data.rminval,data.rminkey,    data.rcval,data.rckey]
            ]);
        var options = {title: 'Searches (in number of times searched)\nResults (in number of lines obtained)'};
        return [d,options];        
    }
    time_div_arrayType(data) {
        var timedata = google.visualization.arrayToDataTable([
                ['Type',      'MAX',{ role: 'annotation'}, 'MIN',{ role: 'annotation'}, 'CURRENT',{ role: 'annotation'}],
                ['Time Taken', data.tmaxval,data.tmaxkey,    data.tminval,data.tminkey, data.tcval,data.tckey]
            ]);
        var timeoptions = {title: 'Time (in Nano seconds)'};
        return[timedata,timeoptions];
    }
    data_div_tableType(data) {
        var d = new google.visualization.DataTable();
        d.addColumn('string','Type');
        d.addColumn('string','Max Name (keyword)');
        d.addColumn('number','Max Value');
        d.addColumn('string','Min Name (keyword)');
        d.addColumn('number','Min Value');
        d.addColumn('string','Current Name (keyword)');
        d.addColumn('number','Current Value');
        d.addRows([
            ['Search Count (in Counts)',data.smaxkey,data.smaxval,data.sminkey,data.sminval,data.sckey,data.scval],
            ['Results Count (in Counts)',data.rmaxkey,data.rmaxval,data.rminkey,data.rminval,data.rckey,data.rcval],
            ['Time Taken (in NanoSecs)',data.tmaxkey,data.tmaxval,data.tminkey,data.tminval,data.tckey,data.tcval]
        ]);
        var options = {};
        return [d,options];
    }
}

// {{#if showAnalytics}}
//         <table class="table table-hover table-bordered adjustwidth">
//             <thead>
//                 <th scope="col">Type</th>
//                 <th scope="col">MAX</th>
//                 <th scope="col">MAX Value</th>
//                 <th scope="col">MIN</th>
//                 <th scope="col">MIN Value</th>
//                 <th scope="col">CURRENT</th>
//                 <th scope="col">CURRENT Value</th>
//             </thead>
//             <tbody>
//                 <tr>
//                     <td>Search Count (in No.of.times)</td>
//                     <td>{{analyticsdata.smaxkey}}</td>
//                     <td>{{analyticsdata.smaxval}}</td>
//                     <td>{{analyticsdata.sminkey}}</td>
//                     <td>{{analyticsdata.sminval}}</td>
//                     <td>{{analyticsdata.sckey}}</td>
//                     <td>{{analyticsdata.scval}}</td>
//                 </tr>
//                 <tr>
//                     <td>Results Count (in No.of.times)</td>
//                     <td>{{analyticsdata.rmaxkey}}</td>
//                     <td>{{analyticsdata.rmaxval}}</td>
//                     <td>{{analyticsdata.rminkey}}</td>
//                     <td>{{analyticsdata.rminval}}</td>
//                     <td>{{analyticsdata.rckey}}</td>
//                     <td>{{analyticsdata.rcval}}</td>
//                 </tr>
//                 <tr>
//                     <td>Time Taken (in NanoSecs)</td>
//                     <td>{{analyticsdata.tmaxkey}}</td>
//                     <td>{{analyticsdata.tmaxval}}</td>
//                     <td>{{analyticsdata.tminkey}}</td>
//                     <td>{{analyticsdata.tminval}}</td>
//                     <td>{{analyticsdata.tckey}}</td>
//                     <td>{{analyticsdata.tcval}}</td>
//                 </tr>
//             </tbody>
//         </table>
//         {{/if}}