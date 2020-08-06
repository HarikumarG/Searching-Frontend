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
    @tracked resultsdata = undefined;
    @tracked keyword = undefined;

    folderpath = "";
    filename = "";
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
            this.resultsdata = response[this.keyword];
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