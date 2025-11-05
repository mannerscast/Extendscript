// Reference script to create palette with resource string elements
// Adjusted by Trent Armstrong from scripts provided by CreativeDojo.net

// >>> Render Queue Prep might need to be run twice for desired results. 
// >>> Try to fix this in later releases.

{
    function igniterUtilities(thisObj) {
        // --- CONFIGURATION ---
        var CONFIG = {
            PANEL_TITLE: "IGNITER MEDIA UTILITIES 2.0",
            LABELS: {
                DEFAULT: 1, // None
                RED: 9 // Red
            },
            MARKER_TEXT: {
                EDIT_TITLE: "Edit this title here",
                OPEN_TO_EDIT: "Open to edit text"
            },
            MATCH_PATTERNS: {
                // Regex to find comps that should be labeled red
                MAIN_COMP: /_HD|_SD|_UW|HERE/,
                // Regex to find layers that should be labeled red
                MAIN_LAYER: /TITLE|EDIT TEXT|_HD/
            },
            FOLDER_NAMES: {
                RENDER: " RENDER THESE",
                NO_EDIT: "NO EDITING",
                PRECOMPS: "Precomps",
                ASSETS: "Assets",
                SOLIDS: "Solids"
            },
            RENDER: {
                PRORES_SD_TEMPLATE: "ProRes SD",
                RENDER_FOLDER: "/Renders/"
            }
        };

        // --- LOGIC FUNCTIONS ---

        function prepProject() {
            app.beginUndoGroup("Prep Project");
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
            app.endUndoGroup();
        }

        function prepComps() {
            app.beginUndoGroup("Prep Comps (Layer Labeler)");
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
                            var markerText = (currentLayer.name.indexOf("TITLE") > -1) ? CONFIG.MARKER_TEXT.EDIT_TITLE : CONFIG.MARKER_TEXT.OPEN_TO_EDIT;
                            var newMarker = new MarkerValue(markerText);
                            currentLayer.property("Marker").setValueAtTime(compTime, newMarker);
                        }
                    }
                }
            }
            app.endUndoGroup();
        }

        function prepRenderQueue() {
            app.beginUndoGroup("Prep Render Queue");
            var project = app.project;
            var renderQueue = project.renderQueue;

            if (renderQueue.numItems === 0) {
                alert("The Render Queue is empty. Please add items to render.");
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
            app.endUndoGroup();
        }

        function createFolders() {
            app.beginUndoGroup("Add Project Folders");
            var project = app.project;

            // Create top-level render folder
            project.items.addFolder(CONFIG.FOLDER_NAMES.RENDER).label = CONFIG.LABELS.RED;

            // Create "NO EDITING" folder and its children
            var noEditingFolder = project.items.addFolder(CONFIG.FOLDER_NAMES.NO_EDIT);
            project.items.addFolder(CONFIG.FOLDER_NAMES.PRECOMPS).parentFolder = noEditingFolder;
            project.items.addFolder(CONFIG.FOLDER_NAMES.ASSETS).parentFolder = noEditingFolder;
            noEditingFolder.label = CONFIG.LABELS.DEFAULT;

            app.endUndoGroup();
        }


        // --- UI BUILDING ---

        function buildUI(thisObj) {
            var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", CONFIG.PANEL_TITLE, undefined, {
                resizeable: true
            });
            myPanel.orientation = 'column';
            myPanel.alignChildren = ['fill', 'top'];

            var res = "Panel { \
                text: '" + CONFIG.PANEL_TITLE + "', \
                orientation:'row', \
                alignChildren:['left', 'fill'], \
                projectButton: Button { preferredSize: [90, 30], text:'Prep Project' }, \
                compButton: Button { preferredSize: [90, 30], text:'Prep Comps' }, \
                renderQueueButton: Button { preferredSize: [90, 30], text:'Render Prep' }, \
                foldersButton: Button { preferredSize: [60, 30], text:'+Folders' } \
            }";

            var mainGroup = myPanel.add(res);

            // --- UI ELEMENT ACTIONS ---

            mainGroup.projectButton.onClick = function() {
                if (app.project) {
                    prepProject();
                    alert("Project Prep Complete.");
                } else {
                    alert("Please open a project first.");
                }
            };

            mainGroup.compButton.onClick = function() {
                if (app.project) {
                    prepComps();
                    alert("Comp Prep Complete.");
                } else {
                    alert("Please open a project first.");
                }
            };

            mainGroup.renderQueueButton.onClick = function() {
                if (app.project) {
                    prepRenderQueue();
                    alert("Render Queue Prep Complete.");
                } else {
                    alert("Please open a project first.");
                }
            };

            mainGroup.foldersButton.onClick = function() {
                if (app.project) {
                    createFolders();
                    alert("Folders Created.");
                } else {
                    alert("Please open a project first.");
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

        var scriptPanel = buildUI(thisObj);

        if (scriptPanel instanceof Window) {
            scriptPanel.center();
            scriptPanel.show();
        }
    }

    // Execute script
    igniterUtilities(this);
}
