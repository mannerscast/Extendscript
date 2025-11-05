// AE Still Generator Panel with Info Area and Full Logic

var win = new Window("palette", "AE Still Generator", undefined);
win.orientation = "column";
win.alignChildren = ["fill", "top"];

var folderPath;
var folderGroup = win.add("group");
folderGroup.add("statictext", undefined, "Project or _Motions Folder:");
var pathDisplay = folderGroup.add("edittext", undefined, "", { readonly: true });
pathDisplay.characters = 50;
var browseBtn = folderGroup.add("button", undefined, "Browse");

var buttonGroup = win.add("group");
var buildBtn = buttonGroup.add("button", undefined, "Build Project");
var activeCompBtn = buttonGroup.add("button", undefined, "Process Active Project"); // Renamed button
var renderBtn = buttonGroup.add("button", undefined, "Render in Background");

// Info text area
var infoBox = win.add("edittext", undefined, "", { multiline: true, readonly: true });
infoBox.preferredSize.height = 120;
infoBox.text = "Status messages will appear here...";

// === BROWSE ===
browseBtn.onClick = function () {
  var selected = Folder.selectDialog("Select a _Motions folder or full project folder");
  if (selected) {
    folderPath = selected.fsName;
    pathDisplay.text = folderPath;
    infoBox.text = "📁 Selected: " + folderPath;
  }
};

// === BUILD PROJECT ===
buildBtn.onClick = function () {
  if (!folderPath) {
    infoBox.text = "⚠️ Please select a folder first.";
    return;
  }

  app.beginUndoGroup("Build AE Project");

  var folder = new Folder(folderPath);
  var motionsFolders = (folder.name === "_Motions")
    ? [folder]
    : folder.getFiles(function (f) {
        return f instanceof Folder && f.name === "_Motions";
      });

  var project = app.project || app.newProject();
  var assetsFolder = getOrCreateFolder(project.rootFolder, "Assets");
  var precompsFolder = getOrCreateFolder(project.rootFolder, "PreComps");

  var processedCount = 0;

  for (var i = 0; i < motionsFolders.length; i++) {
    var mFolder = motionsFolders[i];
    var parentName = decodeURIComponent(mFolder.parent.name);
    var assetGroup = getOrCreateFolder(assetsFolder, parentName);
    var compGroup = getOrCreateFolder(precompsFolder, parentName);

    var footageFiles = mFolder.getFiles(function (f) {
      return f instanceof File && f.name.match(/\.(mov|mp4)$/i);
    });

    for (var j = 0; j < footageFiles.length; j++) {
      var file = footageFiles[j];
      var importOptions = new ImportOptions(file);
      var footage = project.importFile(importOptions);
      footage.parentFolder = assetGroup;

      // Interpret as sRGB (Preserve RGB)
      try {
        footage.mainSource.preserveRGB = true;
      } catch (e) {}

      // Comp creation
      var comp = project.items.addComp(file.name, footage.width, footage.height, 1, footage.duration, footage.frameRate);
      comp.parentFolder = compGroup;
      comp.layers.add(footage);

      // Marker logic
      if (!markerExists(comp, "Thumbnail Marker")) {
        var markerTime = getMarkerTime(parentName, footage.duration, footage.frameRate);
        comp.markerProperty.setValueAtTime(markerTime, new MarkerValue("Thumbnail Marker"));
      }

      // Add to render queue (one frame only)
      var rqItem = project.renderQueue.items.add(comp);
      rqItem.timeSpanStart = markerTime;
      rqItem.timeSpanDuration = 1 / footage.frameRate;

      var om = rqItem.outputModule(1);
      om.applyTemplate("JPEG");
      om.file = new File(file.path + "/" + file.name.replace(/\.[^\.]+$/, ".jpg"));

      processedCount++;
    }
  }

  app.endUndoGroup();
  infoBox.text = "✅ Project build complete. " + processedCount + " files processed.";
};

// === PROCESS ACTIVE PROJECT ===
activeCompBtn.onClick = function () {
  if (!app.project) {
    infoBox.text = "⚠️ Please open a project first.";
    return;
  }

  app.beginUndoGroup("Process Active Project for Thumbnails");

  var compsProcessed = 0;
  var project = app.project;

  // Iterate through all items in the project
  for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);

    if (item instanceof CompItem) {
      var comp = item;
      var markerTime;

      // Determine marker time based on comp name, similar to _Igniter_Utilities-3.0.jsx
      if (/countdown|trivia/i.test(comp.name)) {
        markerTime = (1 * 60 + 45) + (15 / comp.frameRate); // 1m 45s 15f
      } else {
        markerTime = 6.0; // Default to 6 seconds for other comps
      }

      // Add a marker for visual feedback, if one doesn't already exist
      if (!markerExists(comp, "Thumbnail Marker")) {
        comp.markerProperty.setValueAtTime(markerTime, new MarkerValue("Thumbnail Marker"));
      }

      // Add to render queue for a single frame
      var rqItem = project.renderQueue.items.add(comp);
      rqItem.timeSpanStart = markerTime;
      rqItem.timeSpanDuration = comp.frameDuration; // Duration of one frame

      // Set output module and filename
      var om = rqItem.outputModule(1);
      om.applyTemplate("JPEG");

      // Set the output file path. The "Render in Background" button will handle the final renaming.
      var projectPath = app.project.file ? app.project.file.path : Folder.myDocuments.fsName;
      var cleanName = comp.name.replace(/\.[^\.]+$/, ""); // Remove any existing extension
      om.file = new File(projectPath + "/" + cleanName + ".jpg");

      compsProcessed++;
    }
  }

  app.endUndoGroup();
  infoBox.text = "✅ " + compsProcessed + " comps from active project added to Render Queue.";
};

// === RENDER IN BACKGROUND ===
renderBtn.onClick = function () {
  if (!folderPath) {
    infoBox.text = "⚠️ Please select a folder first.";
    return;
  }

  var aerenderPath = "/Applications/Adobe After Effects 2025/aerender";
  var projectPath = app.project.file ? app.project.file.fsName : null;

  if (!projectPath) {
    infoBox.text = "⚠️ Please save your project before rendering.";
    return;
  }

  // --- NEW: Capture intended filenames before rendering ---
  var intendedFiles = [];
  for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
    var rqItem = app.project.renderQueue.item(i);
    if (rqItem.status === RQItemStatus.QUEUED) {
      intendedFiles.push(rqItem.outputModule(1).file);
    }
  }

  if (intendedFiles.length === 0) {
    infoBox.text = "✅ No items in the render queue to process.";
    return;
  }

  infoBox.text = "⏳ Starting render... The UI will be unresponsive until complete.";
  app.project.renderQueue.render(); // This is a synchronous render call.
  infoBox.text = "✅ Render complete. Now renaming files...";

  var renamedCount = 0;
  var errors = [];
  var notFound = [];

  // --- NEW: Loop through the captured filenames to find and rename ---
  for (var i = 0; i < intendedFiles.length; i++) {
    var intendedFile = intendedFiles[i];
    var folder = intendedFile.parent;
    var baseName = intendedFile.name.replace(/\.jpg$/i, "");

    // Find the file AE actually created (e.g., "WB_1_4K.jpg0030")
    var actualFiles = folder.getFiles(baseName + ".jpg*");

    if (actualFiles.length > 0) {
      var fileToRename = actualFiles[0];
      if (fileToRename.rename(intendedFile.name)) {
        renamedCount++;
      } else {
        errors.push("Could not rename: " + fileToRename.name);
      }
    } else {
      notFound.push(intendedFile.name);
    }
  }

  // Clear the render queue after processing
  while (app.project.renderQueue.numItems > 0) {
    app.project.renderQueue.item(1).remove();
  }

  var summary = "✅ Renaming complete. " + renamedCount + " files renamed.";
  if (errors.length > 0) summary += "\n⚠️ Errors: " + errors.join(", ");
  if (notFound.length > 0) summary += "\n❓ Not Found: " + notFound.join(", ");
  infoBox.text = summary;
};

// === HELPERS ===
function getMarkerTime(folderName, duration, frameRate) {
  if (folderName.indexOf("06_Countdown") !== -1 || folderName.indexOf("07_Trivia") !== -1) {
    return (1 * 60 + 45) + 10 / frameRate; // 00:01:45:10
  } else if (folderName.indexOf("02_Title") !== -1) {
    return 6.0; // 00:00:06:00
  } else if (folderName.indexOf("08_Bumper") !== -1) {
    return Math.max(duration - 5.0, 0); // last 5 sec
  }
  return 0; // default
}

function getOrCreateFolder(parent, name) {
  for (var i = 1; i <= parent.numItems; i++) {
    if (parent.item(i) instanceof FolderItem && parent.item(i).name === name) {
      return parent.item(i);
    }
  }
  return parent.items.addFolder(name);
}

// Helper function to check if a comp already has a marker with a specific name
function markerExists(comp, markerName) {
  var markerProp = comp.markerProperty;
  for (var i = 1; i <= markerProp.numKeys; i++) {
    if (markerProp.keyValue(i).comment === markerName) {
      return true;
    }
  }
  return false;
}

win.center();
win.show();