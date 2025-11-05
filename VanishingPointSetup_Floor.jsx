app.beginUndoGroup("Align Camera + Build Projection Room");

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) {
    alert("No active composition found.");
} else {
    try {
        // === 1. Ensure Vanishing_Camera exists ===
        var cam = comp.layer("Vanishing_Camera");
        if (!cam || !(cam instanceof CameraLayer)) {
            cam = comp.layers.addCamera("Vanishing_Camera", [comp.width / 2, comp.height / 2]);
            cam.property("Position").setValue([comp.width / 2, comp.height / 2, -1500]);
        }

        // === 2. Get Nulls ===
        var xStart = comp.layer("X_Start").property("Position").value;
        var xEnd   = comp.layer("X_End").property("Position").value;
        var yStart = comp.layer("Y_Start").property("Position").value;
        var yEnd   = comp.layer("Y_End").property("Position").value;

        // === 3. Calculate Vanishing Point ===
        function getVanishingPoint(p1, p2, p3, p4) {
            var a1 = p2[1] - p1[1];
            var b1 = p1[0] - p2[0];
            var c1 = a1 * p1[0] + b1 * p1[1];

            var a2 = p4[1] - p3[1];
            var b2 = p3[0] - p4[0];
            var c2 = a2 * p3[0] + b2 * p3[1];

            var det = a1 * b2 - a2 * b1;
            if (det === 0) return null;

            var x = (b2 * c1 - b1 * c2) / det;
            var y = (a1 * c2 - a2 * c1) / det;
            return [x, y];
        }

        var vanishing2D = getVanishingPoint(xStart, xEnd, yStart, yEnd);
        if (!vanishing2D) throw new Error("Lines do not intersect (parallel).");

        var camPos = cam.property("Position").value;
        var vanishing3D = [vanishing2D[0], vanishing2D[1], 0];

        // === 4. Rotate Camera to Look at Vanishing Point ===
        var dir = [
            vanishing3D[0] - camPos[0],
            vanishing3D[1] - camPos[1],
            vanishing3D[2] - camPos[2]
        ];
        var mag = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
        var dirNorm = [dir[0] / mag, dir[1] / mag, dir[2] / mag];

        var pitch = Math.atan2(dirNorm[1], Math.sqrt(dirNorm[0]*dirNorm[0] + dirNorm[2]*dirNorm[2])) * 180 / Math.PI;
        var yaw = Math.atan2(dirNorm[0], -dirNorm[2]) * 180 / Math.PI;

        cam.property("Orientation").setValue([pitch, yaw, 0]);

        // === 5. Create a function to build walls ===
        function createWall(name, size, position, rotation) {
            // Create a solid instead of a shape layer
            // Color: white, duration: comp duration
            var wall = comp.layers.addSolid([1, 1, 1], name, size[0], size[1], comp.pixelAspect);
            wall.threeDLayer = true;
            wall.property("Transform").property("Position").setValue(position);
            wall.property("Transform").property("Orientation").setValue(rotation);
            // Set material options
            var mat = wall.property("ADBE Material Options Group");
            if (mat) {
                mat.property("ADBE Casts Shadows").setValue(false);
                mat.property("ADBE Accepts Shadows").setValue(true);
                mat.property("ADBE Accepts Lights").setValue(false);
            }
            return wall;
            // --- SHAPE LAYER CODE REMOVED/COMMENTED OUT ---
            // var wall = comp.layers.addShape();
            // wall.name = name;
            // wall.threeDLayer = true;
            // var contents = wall.property("Contents").addProperty("ADBE Vector Group");
            // contents.name = "Shape_" + name;
            // var rect = contents.property("Contents").addProperty("ADBE Vector Shape - Rect");
            // rect.property("Size").setValue(size);
            // var fill = contents.property("Contents").addProperty("ADBE Vector Graphic - Fill");
            // fill.property("Color").setValue([1, 1, 1]); // White
        }

        // === 6. Create Floor, Ceiling, and Walls ===
        var w = comp.width * 2;
        var h = comp.height * 2;
        var depth = 1000;

        // Floor
        createWall("Floor", [w, h], [comp.width/2, comp.height + h/4, 0], [-90, 0, 0]);
        // Ceiling
        createWall("Ceiling", [w, h], [comp.width/2, comp.height - h/4, 0], [90, 0, 0]);
        // Left Wall
        createWall("Left_Wall", [h, h], [comp.width/2 - w/4, comp.height/2, 0], [0, 90, 0]);
        // Right Wall
        createWall("Right_Wall", [h, h], [comp.width/2 + w/4, comp.height/2, 0], [0, -90, 0]);

        // Back Wall
        createWall("Back_Wall", [w, h], [comp.width/2, comp.height/2, depth], [0, 0, 0]);

    } catch (e) {
        alert("Error building projection room: " + e.toString());
    }
}

app.endUndoGroup();