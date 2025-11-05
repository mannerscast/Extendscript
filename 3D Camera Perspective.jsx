
/*
    AE Power Pin to 3D Scene
    
    This script creates a 3D camera, light, and floor solid for camera projection mapping.
    It uses the corner positions from a "CC Power Pin" effect on a selected 2D layer
    to calculate the correct 3D perspective.

    Usage:
    1. Apply the "CC Power Pin" effect to a layer and adjust the pins to match the perspective of a surface.
    2. Keep the layer selected.
    3. Run this script from File > Scripts > Run Script File...

    The script uses a geometric approach to find the horizon line and vanishing points, from
    which it derives the camera's position, orientation, and focal length.
*/

(function create3DSceneFromPowerPin() {

    // --- Main Function ---
    function main() {
        app.beginUndoGroup("Create 3D Scene from Power Pin");

        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            alert("Please select a composition first.");
            return;
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length !== 1) {
            alert("Please select exactly one layer with the CC Power Pin effect.");
            return;
        }
        var sourceLayer = selectedLayers[0];

        var powerPinEffect = sourceLayer.property("Effects").property("CC Power Pin");
        if (!powerPinEffect) {
            alert("The selected layer does not have the 'CC Power Pin' effect. Please add it and try again.");
            return;
        }

        // Get corner pin coordinates
        var p1 = powerPinEffect.property("Top Left").value;
        var p2 = powerPinEffect.property("Top Right").value;
        var p3 = powerPinEffect.property("Bottom Right").value;
        var p4 = powerPinEffect.property("Bottom Left").value;

        // --- Geometric Calculations ---

        // Calculate vanishing points
        var vp1 = findIntersection(p1, p2, p4, p3); // Vanishing point for horizontal lines
        var vp2 = findIntersection(p1, p4, p2, p3); // Vanishing point for vertical lines

        if (!vp1 || !vp2) {
             alert("Could not determine vanishing points. The corner pins might form a shape too close to a rectangle without perspective. Please ensure there is visible perspective distortion.");
             return;
        }

        // --- Create Scene Elements ---
        var cam = comp.layers.addCamera("Projection Cam", [comp.width / 2, comp.height / 2]);
        var floor = comp.layers.addSolid([0.8, 0.8, 0.8], "Floor Plane", comp.width * 2, comp.width * 2, 1);
        var light = comp.layers.addLight("Projection Light", [comp.width / 2, comp.height / 2]);
        light.lightType = LightType.SPOT;
        light.intensity.setValue(150);
        light.coneAngle.setValue(90);
        light.castsShadows.setValue(true);
        
        floor.threeDLayer = true;
        floor.materialOption.acceptsShadows = true;

        // --- Calculate Camera Parameters ---

        // Center of the composition
        var principalPoint = [comp.width / 2, comp.height / 2];

        // Camera rotation (orientation)
        var cameraZ = normalize(vector(principalPoint, vp1));
        var cameraX = normalize(vector(principalPoint, vp2));
        var cameraY = cross(cameraZ, cameraX);
        
        // Adjust coordinate system from 2D screen to 3D AE world
        var orientX = Math.atan2(cameraY[1], cameraY[0]) * 180 / Math.PI;
        var orientY = Math.asin(-cameraY[2]) * 180 / Math.PI;
        var orientZ = Math.atan2(cameraX[2], cameraZ[2]) * 180 / Math.PI;

        cam.property("Orientation").setValue([orientZ, -orientY, -orientX]);

        // Camera focal length (zoom)
        // Using Math.abs() here makes the calculation robust against minor inaccuracies in the source points
        // which could otherwise lead to a negative value inside the square root, causing a NaN error.
        var focalLength = Math.sqrt(Math.abs(dot(vector(principalPoint, vp1), vector(principalPoint, vp2))));
        cam.property("Zoom").setValue(focalLength);

        // Position the camera and light
        var camPos = [principalPoint[0], principalPoint[1], -focalLength];
        cam.property("Position").setValue(camPos);
        light.property("Position").setValue(cam.property("Position").value);
        light.property("Point of Interest").setValue(floor.property("Position").value);

        // --- Position and orient the floor plane ---

        // Find the 2D center of the power pins
        var pinCenter = [ (p1[0]+p2[0]+p3[0]+p4[0])/4, (p1[1]+p2[1]+p3[1]+p4[1])/4 ];
        
        // The function 'fromCompToSurface' is only available in expressions, not scripts.
        // To work around this, we temporarily apply an expression to the floor's position property,
        // read the calculated 3D value, and then remove the expression.
        var positionExpression = 'thisComp.layer("' + cam.name + '").fromCompToSurface([' + pinCenter[0] + ',' + pinCenter[1] + '])';
        floor.property("Position").expression = positionExpression;
        var floorPos = floor.property("Position").value;
        floor.property("Position").expression = "";
        floor.property("Position").setValue(floorPos);

        // Orient the floor to match the camera's perspective plane.
        // Since the camera has been oriented to "see" the pinned surface as a flat plane,
        // the floor solid should have the same orientation as the camera to be parallel to it.
        floor.property("Orientation").setValue(cam.property("Orientation").value);
        
        // Disable the original layer so we only see the new 3D scene
        sourceLayer.enabled = false;

        alert("3D Projection Scene created successfully!");
        app.endUndoGroup();
    }

    // --- Helper Functions ---

    // Find intersection of two lines defined by points (a,b) and (c,d)
    function findIntersection(a, b, c, d) {
        var a1 = b[1] - a[1];
        var b1 = a[0] - b[0];
        var c1 = a1 * a[0] + b1 * a[1];

        var a2 = d[1] - c[1];
        var b2 = c[0] - d[0];
        var c2 = a2 * c[0] + b2 * c[1];

        var det = a1 * b2 - a2 * b1;
        if (det == 0) {
            return null; // Parallel lines
        } else {
            var x = (b2 * c1 - b1 * c2) / det;
            var y = (a1 * c2 - a2 * c1) / det;
            return [x, y, 0];
        }
    }
    
    // Create a vector from point p1 to p2
    function vector(p1, p2) {
        return [p2[0] - p1[0], p2[1] - p1[1], (p2[2]||0) - (p1[2]||0)];
    }

    // Dot product of two vectors
    function dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + (v1[2]||0) * (v2[2]||0);
    }

    // Cross product of two 3D vectors
    function cross(v1, v2) {
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }
    
    // Magnitude of a vector
    function magnitude(v) {
        return Math.sqrt(dot(v, v));
    }
    
    // Normalize a vector to unit length
    function normalize(v) {
        var mag = magnitude(v);
        if (mag === 0) return [0,0,0];
        return [v[0] / mag, v[1] / mag, v[2] / mag];
    }

    // Convert LookAt and Up vectors to AE Orientation values (in degrees)
    function lookAtToOrientation(lookAt, up) {
        var z = normalize(lookAt);
        var x = normalize(cross(up, z));
        var y = cross(z, x);

        var sy = Math.sqrt(x[0] * x[0] +  x[1] * x[1]);
        var singular = sy < 1e-6;

        var xRot, yRot, zRot;

        if (!singular) {
            xRot = Math.atan2(y[2], z[2]);
            yRot = Math.atan2(-x[2], sy);
            zRot = Math.atan2(x[1], x[0]);
        } else {
            xRot = Math.atan2(-z[1], y[1]);
            yRot = Math.atan2(-x[2], sy);
            zRot = 0;
        }

        return [xRot * 180 / Math.PI, yRot * 180 / Math.PI, zRot * 180 / Math.PI];
    }

    // Run the main script
    main();

})();
