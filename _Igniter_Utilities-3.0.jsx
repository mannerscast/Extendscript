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