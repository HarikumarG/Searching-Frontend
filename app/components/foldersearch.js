import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import jQuery from "jquery";

export default class FoldersearchComponent extends Component {
  @tracked loginpage = true;
  @tracked searchpage = false;
  @tracked pattern = "";
  @tracked treeData = undefined;
  @tracked showFolder = false;

  folderpath = "";
  responsedata = undefined;
  folderregexlinux = /^\/$|(\/[a-zA-Z_0-9-]+)+$/;
  props = {};

  @action onValidate() {
    if (this.folderInput == undefined) {
      alert("Enter the folder path");
      location.reload();
    } else if (
      this.folderInput != undefined &&
      !this.folderregexlinux.test(this.folderInput)
    ) {
      alert("Enter a valid Folder Path");
      location.reload();
    } else {
      this.checkpathReq();
    }
  }
  @action onSearch() {
    if (this.patternInput != undefined) {
      this.searchReq();
    } else {
      alert("Enter the pattern to be searched");
    }
  }

  checkpathReq() {
    jQuery
      .ajax({
        url: "http://localhost:8080/Searching-Backend/checkpath",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({
          folderpath: this.folderInput + "/",
          filename: "",
        }),
      })
      .then((response) => {
        if (response == "SUCCESS") {
          this.folderpath = this.folderInput + "/";
          this.loginpage = false;
          this.searchpage = true;
        } else {
          alert("No such file exist in the specified path");
          location.reload();
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  searchReq() {
    jQuery
      .ajax({
        url: "http://localhost:8080/Searching-Backend/foldersearch",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({
          folderpath: this.folderpath,
          pattern: this.patternInput,
        }),
      })
      .then((response) => {
        this.pattern = this.patternInput;
        this.responsedata = response;
        this.buildStructure();
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  initData(node,val) {
    if(!node.nodes) return;
    $.each(node.nodes,(index,nod)=> {
      nod.nodeId = val.toString();
      val++;
      if(nod.nodes) {
        this.initData(nod,val);
      }
    });
  }
  buildStructure() {
    var tree = [];
    var treenode = {
      text: "",
      icon: "",
      nodes: [],
    };
      for(var i = 0; i < this.responsedata.length; i++) {
          var path = this.responsedata[i]["filepath"] + this.responsedata[i]["filename"];
          var parts = path.split("/");
          parts.splice(0,1);
          if(treenode["text"] == "") {
              treenode["text"] = parts[i];
              treenode["icon"] = "fa fa-folder";
              tree[0] = treenode;
          }
          this.add(parts,tree,0,"folder",this.responsedata[i]["id"]);
      }
      this.initData({nodes:tree},0);
      this.showFolder = true;
      this.treeData = tree;
      setTimeout(() => {
        this.eventlistener();
      },2000);
  }
  add(parts,root,ind,type,id) {
      if(ind == parts.length-1) {
        type = "file";
      }
      if(ind == parts.length) {
          return;
      }
      root = this.checkfolder(root,parts[ind],type,id);
      this.add(parts,root,ind+1,type,id);
  }
  checkfolder(root,name,type,id1) {
      for(var i = 0; i < root.length; i++) {
          if(root[i]["text"] == name) {
              return root[i].nodes;
          } 
      }
      var node = {};
      if(type == "folder") {
        node = {
            text:name,
            icon:"fa fa-folder",
            nodes:[]
        };
      } else if(type == "file") {
        node = {
          id : id1,
          text:name,
          icon:"fa fa-file",
          expandIcon:"none"
        }
      }
      root.push(node);
      return node.nodes;
  }
  eventlistener() {
    this.props = {};
    for(var i = 0; i < this.responsedata.length; i++) {
        var id = this.responsedata[i]["id"];
        if(!this.props[id]) {
          this.props[id] = {
              filename : this.responsedata[i]["filename"],
              filepath : this.responsedata[i]["filepath"],
              filesize : this.responsedata[i]["filesize"],
              createdtime:this.responsedata[i]["createdtime"],
              modifiedtime:this.responsedata[i]["modifiedtime"]
          }
        }
        var div = document.getElementById(id);
        div.addEventListener('click',(event)  => {
            this.displaydata(event);
        });
    }
  }
  displaydata(event) {
    var id = event.target.id;
    alert(
      "FILENAME : "+this.props[id]["filename"]+"\n"+
      "FILEPATH : "+this.props[id]["filepath"]+"\n"+
      "FILESIZE : "+this.props[id]["filesize"]+"\n"+
      "CREATEDTIME : "+this.props[id]["createdtime"]+"\n"+
      "MODIFIEDTIME : "+this.props[id]["modifiedtime"]+"\n"
    )
  }
}
