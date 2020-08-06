import Helper from "@ember/component/helper";

export default class Generatetree extends Helper {
  compute([tree], {divid}) {
    console.log(tree);
    $("#"+divid).empty();
    var element = "#"+divid;
    $(element).addClass("bstreeview");
    this.builds($(element), tree, 0,divid);
    $(element).on("click", ".list-group-item", function (e) {
      $(".state-icon", this)
        .toggleClass("fa fa-angle-down fa-fw")
        .toggleClass("fa fa-angle-right fa-fw");
    });
  }
  builds(parentElement, nodes, depth,divid) {
    var leftPadding = "1.25rem";
    if (depth > 0) {
      leftPadding = (1.25 + depth * 1.25).toString() + "rem;";
    }
    depth += 1;

    $.each(nodes, (id, node) => {
      var treeItem = $(
        '<div role="treeitem" class="list-group-item" data-toggle="collapse"></div>'
      )
        .attr("data-target", "#"+divid+"-item-" + node.nodeId)
        .attr("style", "padding-left:" + leftPadding)
        .attr("aria-level", depth);
      if (node.nodes) {
        var treeItemStateIcon = $('<i class="state-icon"></i>').addClass(
          "fa fa-angle-right fa-fw"
        );
        treeItem.append(treeItemStateIcon);
      }
      if (node.icon) {
        var treeItemIcon = $('<i class="item-icon"></i>').addClass(node.icon);
        treeItem.append(treeItemIcon);
      }
      treeItem.append(node.text);
      if (node.id) {
        treeItem.attr("id", node.id);
      }
      parentElement.append(treeItem);
      if (node.nodes) {
        var treeGroup = $(
          '<div role="group" class="list-group collapse" id="itemid"></div>'
        ).attr("id", divid+"-item-" + node.nodeId);
        parentElement.append(treeGroup);
        this.builds(treeGroup, node.nodes, depth,divid);
      }
    });
  }
}
