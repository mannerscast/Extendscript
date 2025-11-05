(function(thisObj) {
  var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Test Panel", [0, 0, 300, 100]);

  var res = 
    "group{orientation:'column', alignment:['fill', 'fill'], alignChildren:['fill', 'fill'],\
      btnGroup: Group{orientation:'row',\
        myButton: Button{text:'Click Me', preferredSize:[100,30]}\
      }\
    }";

  myPanel.grp = myPanel.add(res);

  myPanel.grp.btnGroup.myButton.onClick = function() {
    alert("Button was clicked!");
  };

  myPanel.layout.layout(true);
  if (myPanel instanceof Window) myPanel.show();
})(this);
