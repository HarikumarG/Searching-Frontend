import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery'

export default class KeywordsearchComponent extends Component {

    @tracked loginpage = true;
    @tracked searchpage = false;
    @tracked analytics = false;
    @tracked showAnalytics = false;
    @tracked showChart = false;
    @tracked analyticsdata = undefined;
    @tracked chartType = false;

    folderpath = "";
    filename = "";
    lineNo = 1;
    keyword = undefined;
    responsedata = undefined;
    folderregexlinux = /^\/$|(\/[a-zA-Z_0-9-]+)+\//;

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
            this.chartType = true;
        } else {
            alert("Keyword is undefined");
        }
    }

    @action onChartView() {
        this.charts(this.responsedata);
    }

    @action onNormalView() {
        this.showAnalytics = true;
        this.showChart = false;
    }

    checkpathReq() {
        jQuery.ajax({
            url:"http://localhost:8080/Searching-Backend/checkpath",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "folderpath":this.folderInput,
                "filename":this.fileInput
            })
        }).then((response) => {
            if(response == "SUCCESS") {
                this.folderpath = this.folderInput;
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
            for(var key in response[this.keyword]) {
                var sentence = response[this.keyword][key];
                if(sentence.length > 0) {
                    this.displaytoDOM(sentence,this.keyword,this.lineNo);
                    this.lineNo++;
                }
            }
            this.analytics = true;
        }).catch(function(error) {
            console.log(error);
        })
    }
    getAnalyticsReq() {
        jQuery.ajax({
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
            this.charts(response);
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

    async charts(data) {
        this.showChart = true;
        this.showAnalytics = false;
        await google.charts.load('current', {packages: ['corechart']});
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
        this.drawChart(d);
    }
    drawChart(data) {
        var d = google.visualization.arrayToDataTable([
            ['Type',      'MAX',{ role: 'annotation'}, 'MIN',{ role: 'annotation'}, 'CURRENT',{ role: 'annotation'}],
            ['Searches',  data.smaxval,data.smaxkey,   data.sminval,data.sminkey,    data.scval,data.sckey],
            ['Results',   data.rmaxval,data.rmaxkey,   data.rminval,data.rminkey,    data.rcval,data.rckey]
        ]);

        var options = {title: 'Searches (in number of times searched)\nResults (in number of lines obtained)'};
        var chart = new google.visualization.BarChart(document.getElementById('data_div'));
        chart.draw(d, options);

        var timedata = google.visualization.arrayToDataTable([
            ['Type',      'MAX',{ role: 'annotation'}, 'MIN',{ role: 'annotation'}, 'CURRENT',{ role: 'annotation'}],
            ['Time Taken', data.tmaxval,data.tmaxkey,    data.tminval,data.tminkey, data.tcval,data.tckey]
        ]);

        var timeoptions = {title: 'Time (in Nano seconds)'};
        var timechart = new google.visualization.BarChart(document.getElementById('time_div'));
        timechart.draw(timedata,timeoptions);
    }
}