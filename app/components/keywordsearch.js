import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery'

export default class KeywordsearchComponent extends Component {

    @tracked loginpage = true;
    @tracked searchpage = false;

    folderpath = "";
    filename = "";
    lineNo = 1;

    @action onValidate() {
        if(this.folderInput != undefined && this.fileInput != undefined) {
            this.checkpathReq();            
        } else {
            alert("Fill all the fields");
            location.reload();
        }
    }

    @action onSearch() {
        if(this.keywordInput != undefined) {
            this.searchReq();
        } else {
            alert("Enter the keyword to be searched");
        }
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
            var keyword = this.keywordInput;
            for(var key in response[keyword]) {
                var sentence = response[keyword][key];
                if(sentence.length > 0) {
                    this.displaytoDOM(sentence,keyword,this.lineNo);
                    this.lineNo++;
                }
            }
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
}