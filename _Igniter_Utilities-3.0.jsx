<<<<<<< HEAD
﻿// ===============================================================
// Igniter Utilities - Comp Processor v3.0 (AE 2025 compatible)
// Adjusted by Trent Armstrong from scripts provided by CreativeDojo.net
// ===============================================================
//
// ⚙️ NOTES
// - Compatible with AE 2024 and AE 2025.
// - Safe for folder names with leading spaces (" RENDER THESE").
// - Works as dockable panel (in Scripts/ScriptUI Panels) or as floating dialog.
//
// ===============================================================

{
function igniterUtilities(thisObj) {
    var myPanel = null;
    var infoBox = null;

    // ---------------- CONFIGURATION ----------------
    var CONFIG = {
        PANEL_TITLE: "Igniter Utilities - Comp Processor",
        LABELS: {
            DEFAULT: 1,
            RED: 9
        },
        MARKER_TEXT: {
            EDIT_TITLE: "Edit this title here",
            OPEN_TO_EDIT: "Open to edit text"
        },
        MATCH_PATTERNS: {
            MAIN_COMP: /_4K|_UW_HD|_UW_SD|HERE/,
            MAIN_LAYER: /TITLE|SUBTITLE|EDIT TEXT|_HD/
        },
        FOLDER_NAMES: {
            RENDER: " RENDER THESE",   // Leading space intentional
            NO_EDIT: "NO EDITING",
            PRECOMPS: "Precomps",
            ASSETS: "Assets",
            SOLIDS: "Solids"
        },
        MARKER_NAME: "Thumbnail",
        RENDER_TEMPLATE: {
            STILL: "JPEG"
        },
        RENDER: {
            PRORES_SD_TEMPLATE: "ProRes SD",
            RENDER_FOLDER: "/Renders/"
        }
    };

    // ---------------- HELPER ----------------
    function safeName(obj) {
        return (obj && typeof obj.name === "string") ? obj.name : "";
    }

    function markerExists(comp, markerName) {
        var markerProp = comp.markerProperty;
        for (var i = 1; i <= markerProp.numKeys; i++) {
            if (markerProp.keyValue(i).comment === markerName) return true;
        }
        return false;
    }

    // ---------------- MAIN LOGIC ----------------
    function processRenderComps() {
        app.beginUndoGroup("Process Render Comps");
        try {
            var project = app.project;
            var renderFolder = null;

            // 1. Find the " RENDER THESE" folder
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof FolderItem) {
                    var itemName = safeName(item);
                    if (itemName === CONFIG.FOLDER_NAMES.RENDER) {
                        renderFolder = item;
                        break;
                    }
                }
            }

            if (!renderFolder) {
                infoBox.text = "⚠️ Folder '" + CONFIG.FOLDER_NAMES.RENDER + "' not found.";
                return;
            }

            // 2. Recursively find comps
            var specialComps = [], otherComps = [];
            function findComps(folder) {
                for (var i = 1; i <= folder.numItems; i++) {
                    var it = folder.item(i);
                    if (it instanceof FolderItem) findComps(it);
                    else if (it instanceof CompItem) {
                        if (/countdown|trivia/i.test(it.name)) specialComps.push(it);
                        else otherComps.push(it);
                    }
                }
            }
            findComps(renderFolder);

            // 3. Add markers
            var compsProcessed = 0;
            for (var s = 0; s < specialComps.length; s++) {
                var sc = specialComps[s];
                if (!markerExists(sc, CONFIG.MARKER_NAME)) {
                    sc.markerProperty.setValueAtTime(105 + (15 / sc.frameRate), new MarkerValue(CONFIG.MARKER_NAME));
                    compsProcessed++;
                }
            }
            for (var o = 0; o < otherComps.length; o++) {
                var oc = otherComps[o];
                if (!markerExists(oc, CONFIG.MARKER_NAME)) {
                    oc.markerProperty.setValueAtTime(6, new MarkerValue(CONFIG.MARKER_NAME));
                    compsProcessed++;
                }
            }
            infoBox.text = "✅ Processing Complete. Markers added to " + compsProcessed + " comps.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function addThumbsToRenderQueue() {
        app.beginUndoGroup("Add Thumbs to Render Queue");
        try {
            var project = app.project;
            var renderFolder = null;
            var thumbsAdded = 0;

            // 1. Find " RENDER THESE" folder
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof FolderItem) {
                    var itemName = safeName(item);
                    if (itemName === CONFIG.FOLDER_NAMES.RENDER) {
                        renderFolder = item;
                        break;
                    }
                }
            }

            if (!renderFolder) {
                infoBox.text = "⚠️ Folder '" + CONFIG.FOLDER_NAMES.RENDER + "' not found.";
                return;
            }

            // 2. Recursively find comps with markers
            function findThumbs(folder) {
                for (var i = 1; i <= folder.numItems; i++) {
                    var item = folder.item(i);
                    if (item instanceof FolderItem) findThumbs(item);
                    else if (item instanceof CompItem) {
                        var m = item.markerProperty;
                        for (var j = 1; j <= m.numKeys; j++) {
                            if (m.keyValue(j).comment === CONFIG.MARKER_NAME) {
                                var markerTime = m.keyTime(j);
                                var rqItem = project.renderQueue.items.add(item);
                                rqItem.timeSpanStart = markerTime;
                                rqItem.timeSpanDuration = item.frameDuration;
                                var om = rqItem.outputModule(1);
                                om.applyTemplate(CONFIG.RENDER_TEMPLATE.STILL);
                                var folderOut = new Folder(om.file.parent);
                                var cleanName = item.name.replace(/\.[^\.]+$/, "");
                                om.file = new File(folderOut.fsName + "/" + cleanName + ".jpg");
                                thumbsAdded++;
                                break;
=======
﻿// Reference script to create palette with resource string elements
// Adjusted by Trent Armstrong from scripts provided by CreativeDojo.net

// >>> Render Queue Prep might need to be run twice for desired results. 
// >>> Try to fix this in later releases.

{
    function igniterUtilities(thisObj) {
        var myPanel = null; // Declare myPanel in a shared scope.
        var infoBox = null; // Declare infoBox for status updates.

        // --- CONFIGURATION ---
        // Merged CONFIG from _Igniter_Utilities-2.0.jsx and _Igniter_Utilities-3.0.jsx
        var CONFIG = {
            PANEL_TITLE: "Igniter Utilities - Comp Processor",
            LABELS: { // From 2.0
                DEFAULT: 1, // None
                RED: 9 // Red
            },
            MARKER_TEXT: { // From 2.0
                EDIT_TITLE: "Edit this title here",
                OPEN_TO_EDIT: "Open to edit text"
            },
            MATCH_PATTERNS: { // From 2.0
                MAIN_COMP: /_4K|_UW_HD|_UW_SD|HERE/, // Updated suffixes
                MAIN_LAYER: /TITLE|SUBTITLE|EDIT TEXT|_HD/ // Case-insensitive flag 'i' removed
            },
            FOLDER_NAMES: {
                RENDER: " RENDER THESE", // Exists in both, same value
                NO_EDIT: "NO EDITING", // From 2.0
                PRECOMPS: "Precomps", // From 2.0
                ASSETS: "Assets", // From 2.0
                SOLIDS: "Solids" // From 2.0
            },
            MARKER_NAME: "Thumbnail",
            RENDER_TEMPLATE: {
                STILL: "JPEG" // IMPORTANT: An Output Module template with this name must exist.
            },
            RENDER: { // From 2.0
                PRORES_SD_TEMPLATE: "ProRes SD",
                RENDER_FOLDER: "/Renders/"
            }
        };

        // --- LOGIC FUNCTIONS ---

        function processRenderComps() {
            app.beginUndoGroup("Process Render Comps");
            try {
                var project = app.project;
                var renderFolder = null;

                // Arrays for categorization
                var specialComps = []; // Countdowns and Trivia
                var otherComps = [];

                // 1. Find the " RENDER THESE" folder.
                for (var i = 1; i <= project.numItems; i++) {
                    if (project.item(i) instanceof FolderItem && project.item(i).name === CONFIG.FOLDER_NAMES.RENDER) {
                        renderFolder = project.item(i);
                        break;
                    }
                }

                if (!renderFolder) {
                    if (infoBox) infoBox.text = "⚠️ The folder '" + CONFIG.FOLDER_NAMES.RENDER + "' was not found.";
                    app.endUndoGroup();
                    return;
                }

                // 2. Recursively search for and categorize comps.
                function findAndCategorizeComps(folder) {
                    for (var i = 1; i <= folder.numItems; i++) {
                        var item = folder.item(i);
                        if (item instanceof FolderItem) {
                            findAndCategorizeComps(item); // Recurse
                        } else if (item instanceof CompItem) {
                            if (/countdown|trivia/i.test(item.name)) { // Matches "countdown" or "trivia"
                                specialComps.push(item);
                            } else {
                                otherComps.push(item);
>>>>>>> 068e28af43698ab4cc113ed3d34868c8838745d6
                            }
                        }
                    }
                }
<<<<<<< HEAD
            }

            findThumbs(renderFolder);
            infoBox.text = "✅ " + thumbsAdded + " thumbnail(s) added to Render Queue.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function renderAndRenameThumbs() {
        app.beginUndoGroup("Render and Rename Thumbs");
        try {
            var rq = app.project.renderQueue;
            var intendedFiles = [];
            for (var i = 1; i <= rq.numItems; i++) {
                var item = rq.item(i);
                if (item.status === RQItemStatus.QUEUED) {
                    intendedFiles.push(item.outputModule(1).file);
                }
            }
            if (intendedFiles.length === 0) {
                infoBox.text = "✅ No items in queue.";
                return;
            }
            infoBox.text = "⏳ Rendering " + intendedFiles.length + " item(s)...";
            rq.render();
            var renamedCount = 0;
            for (var f = 0; f < intendedFiles.length; f++) {
                var intended = intendedFiles[f];
                var folder = intended.parent;
                var baseName = intended.name.replace(/\.jpg$/i, "");
                var files = folder.getFiles(baseName + ".jpg*");
                if (files.length > 0) {
                    var fileToRename = files[0];
                    if (fileToRename.rename(intended.name)) renamedCount++;
                }
            }
            while (rq.numItems > 0) rq.item(1).remove();
            infoBox.text = "✅ Renaming complete. " + renamedCount + " file(s) renamed.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function prepProject() {
        app.beginUndoGroup("Prep Project");
        try {
            var project = app.project;
            var all = project.items;
            var noEditing = null, solids = null;

            for (var i = 1; i <= all.length; i++) {
                var it = all[i];
                it.label = CONFIG.LABELS.DEFAULT;
                if (it.name.search(CONFIG.MATCH_PATTERNS.MAIN_COMP) > -1 ||
                    it.name === CONFIG.FOLDER_NAMES.RENDER ||
                    it.name === "EDIT TEXT HERE") {
                    it.label = CONFIG.LABELS.RED;
                }
                if (it instanceof FolderItem) {
                    if (it.name === CONFIG.FOLDER_NAMES.NO_EDIT) noEditing = it;
                    if (it.name === CONFIG.FOLDER_NAMES.SOLIDS) solids = it;
                }
            }
            if (solids && noEditing) solids.parentFolder = noEditing;
            infoBox.text = "✅ Project Prep Complete.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function prepComps() {
        app.beginUndoGroup("Prep Comps");
        try {
            var all = app.project.items;
            for (var i = 1; i <= all.length; i++) {
                var item = all[i];
                if (item instanceof CompItem && item.name.search(CONFIG.MATCH_PATTERNS.MAIN_COMP) > -1) {
                    for (var l = 1; l <= item.numLayers; l++) {
                        var layer = item.layer(l);
                        layer.label = CONFIG.LABELS.DEFAULT;
                        if (layer.name.search(CONFIG.MATCH_PATTERNS.MAIN_LAYER) > -1) {
                            layer.label = CONFIG.LABELS.RED;
                            var txt = "";
                            if (layer instanceof TextLayer) txt = "Edit " + layer.name + " here";
                            else if (layer instanceof AVLayer && layer.source instanceof CompItem) txt = CONFIG.MARKER_TEXT.OPEN_TO_EDIT;
                            else if (layer instanceof AVLayer && /TITLE|SUBTITLE/.test(layer.name)) txt = "Edit this in Photoshop";
                            layer.property("Marker").setValueAtTime(item.time, new MarkerValue(txt));
                        }
                    }
                }
            }
            infoBox.text = "✅ Comp Prep Complete.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function prepRenderQueue() {
        app.beginUndoGroup("Prep Render Queue");
        try {
            var project = app.project;
            if (!project.file) {
                infoBox.text = "⚠️ Save your project before running Render Queue Prep.";
                return;
            }
            var rq = project.renderQueue;
            if (rq.numItems === 0) {
                infoBox.text = "⚠️ Render Queue is empty.";
                return;
            }
            var path = project.file.path + CONFIG.RENDER.RENDER_FOLDER;
            for (var i = 1; i <= rq.numItems; i++) {
                var rqItem = rq.item(i);
                var name = rqItem.comp.name;
                while (rqItem.numOutputModules > 1) rqItem.outputModule(2).remove();
                if (rqItem.numOutputModules === 1 && name.indexOf("_HD") > -1) {
                    rqItem.outputModule(1).file = new File(path + name);
                    var sd = rqItem.outputModules.add();
                    sd.applyTemplate(CONFIG.RENDER.PRORES_SD_TEMPLATE);
                    sd.file = new File(path + name.replace("_HD", "_SD"));
                }
            }
            infoBox.text = "✅ Render Queue Prep Complete.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function createFolders() {
        app.beginUndoGroup("Add Project Folders");
        try {
            var p = app.project;
            function getOrCreateFolder(parent, name) {
                for (var i = 1; i <= parent.numItems; i++) {
                    if (parent.item(i) instanceof FolderItem && parent.item(i).name === name) return parent.item(i);
                }
                return parent.items.addFolder(name);
            }
            var render = getOrCreateFolder(p.rootFolder, CONFIG.FOLDER_NAMES.RENDER);
            render.label = CONFIG.LABELS.RED;
            var noEdit = getOrCreateFolder(p.rootFolder, CONFIG.FOLDER_NAMES.NO_EDIT);
            getOrCreateFolder(noEdit, CONFIG.FOLDER_NAMES.PRECOMPS);
            getOrCreateFolder(noEdit, CONFIG.FOLDER_NAMES.ASSETS);
            noEdit.label = CONFIG.LABELS.DEFAULT;
            infoBox.text = "✅ Folder structure verified.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    // ---------------- UI BUILD ----------------
    function buildUI(thisObj) {
        myPanel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", CONFIG.PANEL_TITLE, [0, 0, 500, 200]);

        myPanel.orientation = 'column';
        myPanel.alignChildren = ['fill', 'top'];

        var res =
            "Group { \
                orientation:'column', alignChildren:['fill','top'], \
                buttonGroup2: Group { orientation:'row', alignChildren:['fill','center'], \
                    prepProjectButton: Button { text:'Prep Project', preferredSize:[-1,30] }, \
                    prepCompsButton: Button { text:'Prep Comps', preferredSize:[-1,30] }, \
                    prepRenderQueueButton: Button { text:'Render Prep', preferredSize:[-1,30] }, \
                    createFoldersButton: Button { text:'+Folders', preferredSize:[-1,30] } }, \
                buttonGroup1: Group { orientation:'row', alignChildren:['fill','center'], \
                    processButton: Button { text:'1. Process Comps', preferredSize:[-1,30] }, \
                    addThumbsButton: Button { text:'2. Add Thumbs to Queue', preferredSize:[-1,30] }, \
                    renderButton: Button { text:'3. Render Thumbs', preferredSize:[-1,30] } }, \
                infoBox: StaticText { text:'Status messages will appear here...', properties:{multiline:true}, preferredSize:[-1,40] } \
            }";

        var mainGroup = myPanel.add(res);
        infoBox = mainGroup.infoBox;

        // Button actions
        mainGroup.buttonGroup1.processButton.onClick = function() {
            if (app.project) processRenderComps(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup1.addThumbsButton.onClick = function() {
            if (app.project) addThumbsToRenderQueue(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup1.renderButton.onClick = function() {
            if (app.project) renderAndRenameThumbs(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.prepProjectButton.onClick = function() {
            if (app.project) prepProject(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.prepCompsButton.onClick = function() {
            if (app.project) prepComps(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.prepRenderQueueButton.onClick = function() {
            if (app.project) prepRenderQueue(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.createFoldersButton.onClick = function() {
            if (app.project) createFolders(); else infoBox.text = "⚠️ Open a project first.";
        };

        myPanel.layout.layout(true);
        myPanel.onResizing = myPanel.onResize = function() { this.layout.resize(); };
        return myPanel;
    }

    // ---------------- EXECUTION ----------------
    buildUI(thisObj);
    if (myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    }
}

// Execute
igniterUtilities(this);
}
=======

                findAndCategorizeComps(renderFolder);

                // 3. Add markers to the categorized comps.
                var compsProcessed = 0;

                // Process Countdowns and Trivia
                for (var i = 0; i < specialComps.length; i++) {
                    var comp = specialComps[i];
                    if (!markerExists(comp, CONFIG.MARKER_NAME)) {
                        var specialTime = 105 + (15 / comp.frameRate); // 1m 45s 15f
                        comp.markerProperty.setValueAtTime(specialTime, new MarkerValue(CONFIG.MARKER_NAME));
                        compsProcessed++;
                    }
                }

                // Process Everything Else
                for (var j = 0; j < otherComps.length; j++) {
                    var comp = otherComps[j];
                    if (!markerExists(comp, CONFIG.MARKER_NAME)) {
                        var defaultTime = 6; // 6 seconds
                        comp.markerProperty.setValueAtTime(defaultTime, new MarkerValue(CONFIG.MARKER_NAME));
                        compsProcessed++;
                    }
                }

                // 4. Display summary.
                if (infoBox) infoBox.text = "✅ Processing Complete. Markers added to " + compsProcessed + " compositions.";
            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred: " + e.toString();
            }
            app.endUndoGroup();
        }

        function addThumbsToRenderQueue() {
            app.beginUndoGroup("Add Thumbs to Render Queue");
            try {
                var project = app.project;
                var renderFolder = null;
                var thumbsAdded = 0;

                // 1. Find the " RENDER THESE" folder.
                for (var i = 1; i <= project.numItems; i++) {
                    if (project.item(i) instanceof FolderItem && project.item(i).name === CONFIG.FOLDER_NAMES.RENDER) {
                        renderFolder = project.item(i);
                        break;
                    }
                }

                if (!renderFolder) {
                    if (infoBox) infoBox.text = "⚠️ The folder '" + CONFIG.FOLDER_NAMES.RENDER + "' was not found.";
                    app.endUndoGroup();
                    return;
                }

                // 2. Recursively search for comps with thumbnail markers.
                function findAndRenderThumbs(folder) {
                    for (var i = 1; i <= folder.numItems; i++) {
                        var item = folder.item(i);
                        if (item instanceof FolderItem) {
                            findAndRenderThumbs(item); // Recurse
                        } else if (item instanceof CompItem) {
                            var markerProp = item.markerProperty;
                            for (var j = 1; j <= markerProp.numKeys; j++) {
                                if (markerProp.keyValue(j).comment === CONFIG.MARKER_NAME) {
                                    var markerTime = markerProp.keyTime(j);

                                    // --- Fully Automated Render Queue Method ---

                                    // 1. Add the comp to the render queue.
                                    var rqItem = project.renderQueue.items.add(item);

                                    // 2. Set the time span to a single frame at the marker.
                                    rqItem.timeSpanStart = markerTime;
                                    rqItem.timeSpanDuration = item.frameDuration;

                                    // 3. Apply your "JPEG" template from the config.
                                    var om = rqItem.outputModule(1);
                                    om.applyTemplate(CONFIG.RENDER_TEMPLATE.STILL);

                                    // 4. Explicitly set the output path and filename to prevent numbering.
                                    var outputFolder = new Folder(om.file.parent); // Use the template's default folder.
                                    var cleanName = item.name.replace(/\.[^\.]+$/, ""); // Remove any extension from comp name.
                                    var newFile = new File(outputFolder.fsName + "/" + cleanName + ".jpg");
                                    om.file = newFile;

                                    thumbsAdded++;
                                    break; // Found a thumb, move to the next comp
                                }
                            }
                        }
                    }
                }

                findAndRenderThumbs(renderFolder);
                if (infoBox) infoBox.text = "✅ " + thumbsAdded + " thumbnail(s) added to the Render Queue.";
            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred: " + e.toString();
            }
            app.endUndoGroup();
        }

        function renderAndRenameThumbs() {
            app.beginUndoGroup("Render and Rename Thumbs");
            try {
                // 1. Capture intended filenames from queued items.
                var intendedFiles = [];
                for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
                    var rqItem = app.project.renderQueue.item(i);
                    if (rqItem.status === RQItemStatus.QUEUED) {
                        intendedFiles.push(rqItem.outputModule(1).file);
                    }
                }

                if (intendedFiles.length === 0) {
                    if (infoBox) infoBox.text = "✅ No items in the render queue to process.";
                    return;
                }

                // 2. Render the queue synchronously.
                if (infoBox) infoBox.text = "⏳ Starting render for " + intendedFiles.length + " item(s)...";
                app.project.renderQueue.render();
                if (infoBox) infoBox.text = "✅ Render complete. Now renaming files...";

                // 3. Find and rename the actual output files.
                var renamedCount = 0;
                var errors = [];
                var notFound = [];

                for (var i = 0; i < intendedFiles.length; i++) {
                    var intendedFile = intendedFiles[i];
                    var folder = intendedFile.parent;
                    var baseName = intendedFile.name.replace(/\.jpg$/i, "");

                    // Find the file AE actually created (e.g., "MyComp.jpg0030")
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

                // Clean up the render queue by removing all items
                while (app.project.renderQueue.numItems > 0) {
                    app.project.renderQueue.item(1).remove();
                }

                var summary = "✅ Renaming complete. " + renamedCount + " files renamed.";
                if (errors.length > 0) summary += "\n⚠️ Errors: " + errors.join(", ");
                if (notFound.length > 0) summary += "\n❓ Not Found: " + notFound.join(", ");
                if (infoBox) infoBox.text = summary;

            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred during render/rename: " + e.toString();
            }
            app.endUndoGroup();
        }

        // --- LOGIC FUNCTIONS FROM _Igniter_Utilities-2.0.jsx ---

        function prepProject() {
            app.beginUndoGroup("Prep Project");
            try {
                var project = app.project;
                var allItems = project.items;
                var noEditingFolder = null;
                var solidsFolder = null;

                for (var i = 1; i <= allItems.length; i++) {
                    var currentItem = allItems[i];
                    var itemName = currentItem.name;

                    // Default label for all items
                    currentItem.label = CONFIG.LABELS.DEFAULT;

                    // Label main comps and special folders
                    if (itemName.search(CONFIG.MATCH_PATTERNS.MAIN_COMP) > -1 || itemName === CONFIG.FOLDER_NAMES.RENDER || itemName === "EDIT TEXT HERE") {
                        currentItem.label = CONFIG.LABELS.RED;
                    }

                    // Find special folders
                    if (currentItem instanceof FolderItem) {
                        if (itemName === CONFIG.FOLDER_NAMES.NO_EDIT) {
                            noEditingFolder = currentItem;
                        } else if (itemName === CONFIG.FOLDER_NAMES.SOLIDS) {
                            solidsFolder = currentItem;
                        }
                    }
                }

                // Move Solids folder into NO EDITING folder if both exist
                if (solidsFolder && noEditingFolder) {
                    solidsFolder.parentFolder = noEditingFolder;
                }
                if (infoBox) infoBox.text = "✅ Project Prep Complete.";
            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred during Project Prep: " + e.toString();
            }
            app.endUndoGroup();
        }

        function prepComps() {
            app.beginUndoGroup("Prep Comps (Layer Labeler)");
            try {
                var project = app.project;
                var allItems = project.items;

                for (var i = 1; i <= allItems.length; i++) {
                    var currentItem = allItems[i];

                    // Process only main comps
                    if (currentItem instanceof CompItem && currentItem.name.search(CONFIG.MATCH_PATTERNS.MAIN_COMP) > -1) {
                        var compTime = currentItem.time;
                        for (var l = 1; l <= currentItem.numLayers; l++) {
                            var currentLayer = currentItem.layer(l);
                            currentLayer.label = CONFIG.LABELS.DEFAULT;

                            if (currentLayer.name.search(CONFIG.MATCH_PATTERNS.MAIN_LAYER) > -1) {
                                currentLayer.label = CONFIG.LABELS.RED;
                                var markerText = "";

                                // Corrected layer type detection logic
                                if (currentLayer instanceof TextLayer) {
                                    markerText = "Edit " + currentLayer.name + " here";
                                } else if (currentLayer instanceof AVLayer && currentLayer.source instanceof CompItem) {
                                    markerText = "Open to edit text";
                                } else if (currentLayer instanceof AVLayer && /TITLE|SUBTITLE/.test(currentLayer.name)) {
                                    // It's an AVLayer (like a PSD) with TITLE/SUBTITLE in the name.
                                    markerText = "Edit this in Photoshop";
                                }

                                var newMarker = new MarkerValue(markerText);
                                currentLayer.property("Marker").setValueAtTime(compTime, newMarker);
                            }
                        }
                    }
                }
                if (infoBox) infoBox.text = "✅ Comp Prep Complete.";
            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred during Comp Prep: " + e.toString();
            }
            app.endUndoGroup();
        }

        function prepRenderQueue() {
            app.beginUndoGroup("Prep Render Queue");
            try {
                var project = app.project;
                if (!project.file) {
                    if (infoBox) infoBox.text = "⚠️ Please save your project before preparing the Render Queue.";
                    app.endUndoGroup();
                    return;
                }
                var renderQueue = project.renderQueue;

                if (renderQueue.numItems === 0) {
                    if (infoBox) infoBox.text = "⚠️ The Render Queue is empty. Please add items to render.";
                    app.endUndoGroup();
                    return;
                }

                var renderPath = project.file.path + CONFIG.RENDER.RENDER_FOLDER;

                for (var i = 1; i <= renderQueue.numItems; i++) {
                    var rqItem = renderQueue.item(i);
                    var compName = rqItem.comp.name;

                    // Clean up extra output modules if they exist
                    while (rqItem.numOutputModules > 1) {
                        rqItem.outputModule(2).remove();
                    }

                    // Process only HD comps to create an SD version
                    if (rqItem.numOutputModules === 1 && compName.indexOf("_HD") > -1) {
                        // Set path for HD output
                        rqItem.outputModule(1).file = new File(renderPath + compName);

                        // Add and configure SD output
                        var sdModule = rqItem.outputModules.add();
                        sdModule.applyTemplate(CONFIG.RENDER.PRORES_SD_TEMPLATE);
                        var sdName = compName.replace("_HD", "_SD");
                        sdModule.file = new File(renderPath + sdName);
                    }
                }
                if (infoBox) infoBox.text = "✅ Render Queue Prep Complete.";
            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred during Render Queue Prep: " + e.toString();
            }
            app.endUndoGroup();
        }

        function createFolders() {
            app.beginUndoGroup("Add Project Folders");
            try {
                var project = app.project;
                var foldersCreated = 0;

                // Helper function to find or create a folder within a parent
                function getOrCreateFolder(parent, name) {
                    for (var i = 1; i <= parent.numItems; i++) {
                        if (parent.item(i) instanceof FolderItem && parent.item(i).name === name) {
                            return parent.item(i); // Folder already exists
                        }
                    }
                    foldersCreated++;
                    return parent.items.addFolder(name); // Create new folder
                }

                // Get or create top-level render folder
                var renderFolder = getOrCreateFolder(project.rootFolder, CONFIG.FOLDER_NAMES.RENDER);
                renderFolder.label = CONFIG.LABELS.RED;

                // Get or create "NO EDITING" folder and its children
                var noEditingFolder = getOrCreateFolder(project.rootFolder, CONFIG.FOLDER_NAMES.NO_EDIT);
                getOrCreateFolder(noEditingFolder, CONFIG.FOLDER_NAMES.PRECOMPS);
                getOrCreateFolder(noEditingFolder, CONFIG.FOLDER_NAMES.ASSETS);
                noEditingFolder.label = CONFIG.LABELS.DEFAULT;

                if (foldersCreated > 0) {
                    if (infoBox) infoBox.text = "✅ " + foldersCreated + " missing folder(s) created.";
                } else {
                    if (infoBox) infoBox.text = "✅ All required folders already exist.";
                }
            } catch (e) {
                if (infoBox) infoBox.text = "An error occurred during folder creation: " + e.toString();
            }
            app.endUndoGroup();
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

        // --- UI BUILDING ---

        function buildUI(thisObj) {
            // `myPanel` is defined here and will be accessible by the logic functions.
            myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", CONFIG.PANEL_TITLE, undefined, {
                resizeable: true
            });
            myPanel.orientation = 'column';
            myPanel.alignChildren = ['fill', 'top'];

            var res = "Group { \n\
                orientation:'column', \
                alignChildren:['fill', 'top'], \
                buttonGroup2: Group { \n\
                    orientation:'row', \
                    alignChildren:['fill', 'center'], \
                    prepProjectButton: Button { text:'Prep Project', preferredSize:[-1, 30] }, \
                    prepCompsButton: Button { text:'Prep Comps', preferredSize:[-1, 30] }, \
                    prepRenderQueueButton: Button { text:'Render Prep', preferredSize:[-1, 30] }, \
                    createFoldersButton: Button { text:'+Folders', preferredSize:[-1, 30] } \
                }, \
                buttonGroup1: Group { \n\
                    orientation:'row', \
                    alignChildren:['fill', 'center'], \
                    processButton: Button { text:'1. Process Comps', preferredSize:[-1, 30] }, \
                    addThumbsButton: Button { text:'2. Add Thumbs to Queue', preferredSize:[-1, 30] }, \
                    renderButton: Button { text:'3. Render Thumbs', preferredSize:[-1, 30] } \
                }, \
                infoBox: StaticText { text:'Status messages will appear here...', properties:{multiline:true}, preferredSize:[-1, 40] } \
            }";

            var mainGroup = myPanel.add(res);
            infoBox = mainGroup.infoBox; // Assign the UI element to the shared variable.

            // --- UI ELEMENT ACTIONS ---
            // Actions for existing buttons
            mainGroup.buttonGroup1.processButton.onClick = function() {
                if (app.project) {
                    processRenderComps();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };
            mainGroup.buttonGroup1.addThumbsButton.onClick = function() {
                if (app.project) {
                    addThumbsToRenderQueue();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };
            mainGroup.buttonGroup1.renderButton.onClick = function() {
                if (app.project) {
                    renderAndRenameThumbs();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };

            // Actions for new buttons (from 2.0)
            mainGroup.buttonGroup2.prepProjectButton.onClick = function() {
                if (app.project) {
                    prepProject();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };

            mainGroup.buttonGroup2.prepCompsButton.onClick = function() {
                if (app.project) {
                    prepComps();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };

            mainGroup.buttonGroup2.prepRenderQueueButton.onClick = function() {
                if (app.project) {
                    prepRenderQueue();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };

            mainGroup.buttonGroup2.createFoldersButton.onClick = function() {
                if (app.project) {
                    createFolders();
                } else {
                    if (infoBox) infoBox.text = "⚠️ Please open a project first.";
                }
            };


            // --- PANEL LAYOUT & SIZING ---

            myPanel.layout.layout(true);
            myPanel.onResizing = myPanel.onResize = function() {
                this.layout.resize();
            };

            return myPanel;
        }

        // --- SCRIPT EXECUTION ---

        buildUI(thisObj);

        if (myPanel instanceof Window) {
            myPanel.center();
            myPanel.show();
        }
    }

    // Execute script
    igniterUtilities(this);
}
>>>>>>> 068e28af43698ab4cc113ed3d34868c8838745d6
// ===============================================================
// Igniter Utilities - Comp Processor v3.0 (AE 2025 compatible)
// Adjusted by Trent Armstrong from scripts provided by CreativeDojo.net
// ===============================================================
//
// ⚙️ NOTES
// - Compatible with AE 2024 and AE 2025.
// - Safe for folder names with leading spaces (" RENDER THESE").
// - Works as dockable panel (in Scripts/ScriptUI Panels) or as floating dialog.
//
// ===============================================================

{
function igniterUtilities(thisObj) {
    var myPanel = null;
    var infoBox = null;

    // ---------------- CONFIGURATION ----------------
    var CONFIG = {
        PANEL_TITLE: "Igniter Utilities - Comp Processor",
        LABELS: {
            DEFAULT: 1,
            RED: 9
        },
        MARKER_TEXT: {
            EDIT_TITLE: "Edit this title here",
            OPEN_TO_EDIT: "Open to edit text"
        },
        MATCH_PATTERNS: {
            MAIN_COMP: /_4K|_UW_HD|_UW_SD|HERE/,
            MAIN_LAYER: /TITLE|SUBTITLE|EDIT TEXT|_HD/
        },
        FOLDER_NAMES: {
            RENDER: " RENDER THESE",   // Leading space intentional
            NO_EDIT: "NO EDITING",
            PRECOMPS: "Precomps",
            ASSETS: "Assets",
            SOLIDS: "Solids"
        },
        MARKER_NAME: "Thumbnail",
        RENDER_TEMPLATE: {
            STILL: "JPEG"
        },
        RENDER: {
            PRORES_SD_TEMPLATE: "ProRes SD",
            RENDER_FOLDER: "/Renders/"
        }
    };

    // ---------------- HELPER ----------------
    function safeName(obj) {
        return (obj && typeof obj.name === "string") ? obj.name : "";
    }

    function markerExists(comp, markerName) {
        var markerProp = comp.markerProperty;
        for (var i = 1; i <= markerProp.numKeys; i++) {
            if (markerProp.keyValue(i).comment === markerName) return true;
        }
        return false;
    }

    // ---------------- MAIN LOGIC ----------------
    function processRenderComps() {
        app.beginUndoGroup("Process Render Comps");
        try {
            var project = app.project;
            var renderFolder = null;

            // 1. Find the " RENDER THESE" folder
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof FolderItem) {
                    var itemName = safeName(item);
                    if (itemName === CONFIG.FOLDER_NAMES.RENDER) {
                        renderFolder = item;
                        break;
                    }
                }
            }

            if (!renderFolder) {
                infoBox.text = "⚠️ Folder '" + CONFIG.FOLDER_NAMES.RENDER + "' not found.";
                return;
            }

            // 2. Recursively find comps
            var specialComps = [], otherComps = [];
            function findComps(folder) {
                for (var i = 1; i <= folder.numItems; i++) {
                    var it = folder.item(i);
                    if (it instanceof FolderItem) findComps(it);
                    else if (it instanceof CompItem) {
                        if (/countdown|trivia/i.test(it.name)) specialComps.push(it);
                        else otherComps.push(it);
                    }
                }
            }
            findComps(renderFolder);

            // 3. Add markers
            var compsProcessed = 0;
            for (var s = 0; s < specialComps.length; s++) {
                var sc = specialComps[s];
                if (!markerExists(sc, CONFIG.MARKER_NAME)) {
                    sc.markerProperty.setValueAtTime(105 + (15 / sc.frameRate), new MarkerValue(CONFIG.MARKER_NAME));
                    compsProcessed++;
                }
            }
            for (var o = 0; o < otherComps.length; o++) {
                var oc = otherComps[o];
                if (!markerExists(oc, CONFIG.MARKER_NAME)) {
                    oc.markerProperty.setValueAtTime(6, new MarkerValue(CONFIG.MARKER_NAME));
                    compsProcessed++;
                }
            }
            infoBox.text = "✅ Processing Complete. Markers added to " + compsProcessed + " comps.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function addThumbsToRenderQueue() {
        app.beginUndoGroup("Add Thumbs to Render Queue");
        try {
            var project = app.project;
            var renderFolder = null;
            var thumbsAdded = 0;

            // 1. Find " RENDER THESE" folder
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof FolderItem) {
                    var itemName = safeName(item);
                    if (itemName === CONFIG.FOLDER_NAMES.RENDER) {
                        renderFolder = item;
                        break;
                    }
                }
            }

            if (!renderFolder) {
                infoBox.text = "⚠️ Folder '" + CONFIG.FOLDER_NAMES.RENDER + "' not found.";
                return;
            }

            // 2. Recursively find comps with markers
            function findThumbs(folder) {
                for (var i = 1; i <= folder.numItems; i++) {
                    var item = folder.item(i);
                    if (item instanceof FolderItem) findThumbs(item);
                    else if (item instanceof CompItem) {
                        var m = item.markerProperty;
                        for (var j = 1; j <= m.numKeys; j++) {
                            if (m.keyValue(j).comment === CONFIG.MARKER_NAME) {
                                var markerTime = m.keyTime(j);
                                var rqItem = project.renderQueue.items.add(item);
                                rqItem.timeSpanStart = markerTime;
                                rqItem.timeSpanDuration = item.frameDuration;
                                var om = rqItem.outputModule(1);
                                om.applyTemplate(CONFIG.RENDER_TEMPLATE.STILL);
                                var folderOut = new Folder(om.file.parent);
                                var cleanName = item.name.replace(/\.[^\.]+$/, "");
                                om.file = new File(folderOut.fsName + "/" + cleanName + ".jpg");
                                thumbsAdded++;
                                break;
                            }
                        }
                    }
                }
            }

            findThumbs(renderFolder);
            infoBox.text = "✅ " + thumbsAdded + " thumbnail(s) added to Render Queue.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function renderAndRenameThumbs() {
        app.beginUndoGroup("Render and Rename Thumbs");
        try {
            var rq = app.project.renderQueue;
            var intendedFiles = [];
            for (var i = 1; i <= rq.numItems; i++) {
                var item = rq.item(i);
                if (item.status === RQItemStatus.QUEUED) {
                    intendedFiles.push(item.outputModule(1).file);
                }
            }
            if (intendedFiles.length === 0) {
                infoBox.text = "✅ No items in queue.";
                return;
            }
            infoBox.text = "⏳ Rendering " + intendedFiles.length + " item(s)...";
            rq.render();
            var renamedCount = 0;
            for (var f = 0; f < intendedFiles.length; f++) {
                var intended = intendedFiles[f];
                var folder = intended.parent;
                var baseName = intended.name.replace(/\.jpg$/i, "");
                var files = folder.getFiles(baseName + ".jpg*");
                if (files.length > 0) {
                    var fileToRename = files[0];
                    if (fileToRename.rename(intended.name)) renamedCount++;
                }
            }
            while (rq.numItems > 0) rq.item(1).remove();
            infoBox.text = "✅ Renaming complete. " + renamedCount + " file(s) renamed.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function prepProject() {
        app.beginUndoGroup("Prep Project");
        try {
            var project = app.project;
            var all = project.items;
            var noEditing = null, solids = null;

            for (var i = 1; i <= all.length; i++) {
                var it = all[i];
                it.label = CONFIG.LABELS.DEFAULT;
                if (it.name.search(CONFIG.MATCH_PATTERNS.MAIN_COMP) > -1 ||
                    it.name === CONFIG.FOLDER_NAMES.RENDER ||
                    it.name === "EDIT TEXT HERE") {
                    it.label = CONFIG.LABELS.RED;
                }
                if (it instanceof FolderItem) {
                    if (it.name === CONFIG.FOLDER_NAMES.NO_EDIT) noEditing = it;
                    if (it.name === CONFIG.FOLDER_NAMES.SOLIDS) solids = it;
                }
            }
            if (solids && noEditing) solids.parentFolder = noEditing;
            infoBox.text = "✅ Project Prep Complete.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function prepComps() {
        app.beginUndoGroup("Prep Comps");
        try {
            var all = app.project.items;
            for (var i = 1; i <= all.length; i++) {
                var item = all[i];
                if (item instanceof CompItem && item.name.search(CONFIG.MATCH_PATTERNS.MAIN_COMP) > -1) {
                    for (var l = 1; l <= item.numLayers; l++) {
                        var layer = item.layer(l);
                        layer.label = CONFIG.LABELS.DEFAULT;
                        if (layer.name.search(CONFIG.MATCH_PATTERNS.MAIN_LAYER) > -1) {
                            layer.label = CONFIG.LABELS.RED;
                            var txt = "";
                            if (layer instanceof TextLayer) txt = "Edit " + layer.name + " here";
                            else if (layer instanceof AVLayer && layer.source instanceof CompItem) txt = CONFIG.MARKER_TEXT.OPEN_TO_EDIT;
                            else if (layer instanceof AVLayer && /TITLE|SUBTITLE/.test(layer.name)) txt = "Edit this in Photoshop";
                            layer.property("Marker").setValueAtTime(item.time, new MarkerValue(txt));
                        }
                    }
                }
            }
            infoBox.text = "✅ Comp Prep Complete.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function prepRenderQueue() {
        app.beginUndoGroup("Prep Render Queue");
        try {
            var project = app.project;
            if (!project.file) {
                infoBox.text = "⚠️ Save your project before running Render Queue Prep.";
                return;
            }
            var rq = project.renderQueue;
            if (rq.numItems === 0) {
                infoBox.text = "⚠️ Render Queue is empty.";
                return;
            }
            var path = project.file.path + CONFIG.RENDER.RENDER_FOLDER;
            for (var i = 1; i <= rq.numItems; i++) {
                var rqItem = rq.item(i);
                var name = rqItem.comp.name;
                while (rqItem.numOutputModules > 1) rqItem.outputModule(2).remove();
                if (rqItem.numOutputModules === 1 && name.indexOf("_HD") > -1) {
                    rqItem.outputModule(1).file = new File(path + name);
                    var sd = rqItem.outputModules.add();
                    sd.applyTemplate(CONFIG.RENDER.PRORES_SD_TEMPLATE);
                    sd.file = new File(path + name.replace("_HD", "_SD"));
                }
            }
            infoBox.text = "✅ Render Queue Prep Complete.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    function createFolders() {
        app.beginUndoGroup("Add Project Folders");
        try {
            var p = app.project;
            function getOrCreateFolder(parent, name) {
                for (var i = 1; i <= parent.numItems; i++) {
                    if (parent.item(i) instanceof FolderItem && parent.item(i).name === name) return parent.item(i);
                }
                return parent.items.addFolder(name);
            }
            var render = getOrCreateFolder(p.rootFolder, CONFIG.FOLDER_NAMES.RENDER);
            render.label = CONFIG.LABELS.RED;
            var noEdit = getOrCreateFolder(p.rootFolder, CONFIG.FOLDER_NAMES.NO_EDIT);
            getOrCreateFolder(noEdit, CONFIG.FOLDER_NAMES.PRECOMPS);
            getOrCreateFolder(noEdit, CONFIG.FOLDER_NAMES.ASSETS);
            noEdit.label = CONFIG.LABELS.DEFAULT;
            infoBox.text = "✅ Folder structure verified.";
        } catch (e) {
            infoBox.text = "❌ Error: " + e.toString();
        }
        app.endUndoGroup();
    }

    // ---------------- UI BUILD ----------------
    function buildUI(thisObj) {
        myPanel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", CONFIG.PANEL_TITLE, [0, 0, 500, 200]);

        myPanel.orientation = 'column';
        myPanel.alignChildren = ['fill', 'top'];

        var res =
            "Group { \
                orientation:'column', alignChildren:['fill','top'], \
                buttonGroup2: Group { orientation:'row', alignChildren:['fill','center'], \
                    prepProjectButton: Button { text:'Prep Project', preferredSize:[-1,30] }, \
                    prepCompsButton: Button { text:'Prep Comps', preferredSize:[-1,30] }, \
                    prepRenderQueueButton: Button { text:'Render Prep', preferredSize:[-1,30] }, \
                    createFoldersButton: Button { text:'+Folders', preferredSize:[-1,30] } }, \
                buttonGroup1: Group { orientation:'row', alignChildren:['fill','center'], \
                    processButton: Button { text:'1. Process Comps', preferredSize:[-1,30] }, \
                    addThumbsButton: Button { text:'2. Add Thumbs to Queue', preferredSize:[-1,30] }, \
                    renderButton: Button { text:'3. Render Thumbs', preferredSize:[-1,30] } }, \
                infoBox: StaticText { text:'Status messages will appear here...', properties:{multiline:true}, preferredSize:[-1,40] } \
            }";

        var mainGroup = myPanel.add(res);
        infoBox = mainGroup.infoBox;

        // Button actions
        mainGroup.buttonGroup1.processButton.onClick = function() {
            if (app.project) processRenderComps(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup1.addThumbsButton.onClick = function() {
            if (app.project) addThumbsToRenderQueue(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup1.renderButton.onClick = function() {
            if (app.project) renderAndRenameThumbs(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.prepProjectButton.onClick = function() {
            if (app.project) prepProject(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.prepCompsButton.onClick = function() {
            if (app.project) prepComps(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.prepRenderQueueButton.onClick = function() {
            if (app.project) prepRenderQueue(); else infoBox.text = "⚠️ Open a project first.";
        };
        mainGroup.buttonGroup2.createFoldersButton.onClick = function() {
            if (app.project) createFolders(); else infoBox.text = "⚠️ Open a project first.";
        };

        myPanel.layout.layout(true);
        myPanel.onResizing = myPanel.onResize = function() { this.layout.resize(); };
        return myPanel;
    }

    // ---------------- EXECUTION ----------------
    buildUI(thisObj);
    if (myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    }
}

// Execute
igniterUtilities(this);
}