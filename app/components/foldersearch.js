import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import jQuery from "jquery";

export default class FoldersearchComponent extends Component {
  @tracked loginpage = true;
  @tracked searchpage = false;
  @tracked pattern = "";

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
  builds(parentElement,nodes,depth) {
      var leftPadding = '1.25rem';
      if(depth > 0) {
        leftPadding = (1.25 + depth * 1.25).toString() + "rem;";
      }
      depth += 1;

      $.each(nodes,(id,node) => {
          var treeItem = $('<div role="treeitem" class="list-group-item" data-toggle="collapse"></div>')
              .attr('data-target',"#tree-item-"+node.nodeId)
              .attr('style','padding-left:'+leftPadding)
              .attr('aria-level',depth);
          if(node.nodes) {
            var treeItemStateIcon = $('<i class="state-icon"></i>')
              .addClass('fa fa-angle-right fa-fw');
              treeItem.append(treeItemStateIcon);
          }
          if(node.icon) {
            var treeItemIcon = $('<i class="item-icon"></i>')
              .addClass(node.icon);
            treeItem.append(treeItemIcon);
          }
          treeItem.append(node.text);
          if(node.id) {
            treeItem.attr('id',node.id);
          }
          parentElement.append(treeItem);
          if(node.nodes) {
            var treeGroup = $('<div role="group" class="list-group collapse" id="itemid"></div>')
              .attr('id',"tree-item-"+node.nodeId);
            parentElement.append(treeGroup);
            this.builds(treeGroup,node.nodes,depth);
          }
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
  initTree(element,tree) {
    $(element).addClass('bstreeview');
    this.initData({nodes:tree},0);
    this.builds($(element),tree,0);
    $(element).on('click','.list-group-item',function(e) {
      $('.state-icon',this)
          .toggleClass('fa fa-angle-down fa-fw')
          .toggleClass('fa fa-angle-right fa-fw');
    });
  }
  create(treeNode) {
    $("#data").empty();
    $("#data").append("<div id='tree'></div>");
    // $("#tree").bstreeview({
    //   data: treeNode,
    //   indent: 1.25,
    //   parentsMarginLeft: "1.25rem",
    // });
    this.initTree("#tree",treeNode);
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
      this.create(tree);
      this.eventlistener();
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
          expandIcon:"none",
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
