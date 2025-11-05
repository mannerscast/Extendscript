app.beginUndoGroup("Align Camera to Vanishing Point");

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) {
    alert("No active composition found.");
} else {
    try {
        // Get X and Y vanishing guide points
        var xStart = comp.layer("X_Start").property("Position").value;
        var xEnd   = comp.layer("X_End").property("Position").value;
        var yStart = comp.layer("Y_Start").property("Position").value;
        var yEnd   = comp.layer("Y_End").property("Position").value;

        // 2D line intersection to find vanishing point
        function lineIntersect2D(p1, p2, p3, p4) {
            var denom = (p1[0]-p2[0])*(p3[1]-p4[1]) - (p1[1]-p2[1])*(p3[0]-p4[0]);
            if (denom === 0) return null;
            var x = ((p1[0]*p2[1] - p1[1]*p2[0])*(p3[0]-p4[0]) - (p1[0]-p2[0])*(p3[0]*p4[1] - p3[1]*p4[0])) / denom;
            var y = ((p1[0]*p2[1] - p1[1]*p2[0])*(p3[1]-p4[1]) - (p1[1]-p2[1])*(p3[0]*p4[1] - p3[1]*p4[0])) / denom;
            return [x, y];
        }

        var vp2D = lineIntersect2D(xStart, xEnd, yStart, yEnd);
        if (!vp2D) {
            alert("Vanishing point calculation failed.");
            throw new Error("Invalid vanishing point");
        }

        // Set 3D vanishing point (Z = 0)
        var vanishingPoint = [vp2D[0], vp2D[1], 0];

        // Create a 3D null at the vanishing point
        var vpNull = comp.layers.addNull();
        vpNull.name = "Vanishing_Point_Target";
        vpNull.threeDLayer = true;
        vpNull.property("Position").setValue(vanishingPoint);

        // Get camera and aim it at vanishing point
        var cam = comp.layer("Vanishing_Camera");
        if (!cam || !(cam instanceof CameraLayer)) {
            cam = comp.layers.addCamera("Vanishing_Camera", [comp.width / 2, comp.height / 2]);
            cam.property("Position").setValue([comp.width / 2, comp.height / 2, -1500]);
        }
        // Set camera's Point of Interest to follow the vanishing point null
        cam.property("Point of Interest").expression = 'thisComp.layer("Vanishing_Point_Target").transform.position';

    } catch (err) {
        alert("Error aligning camera: " + err.toString());
    }
}

app.endUndoGroup();