app.beginUndoGroup("Create Projection Light and Image");

var comp = app.project.activeItem; // Get the active composition
if (comp && comp instanceof CompItem) {

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0 || !(selectedLayers[0] instanceof AVLayer)) {
        alert("Please select an image layer.");
    } else {
        var originalImage = selectedLayers[0];

        var camera = comp.layer("Vanishing_Camera");
        if (!camera || !(camera instanceof CameraLayer)) {
            alert("Vanishing_Camera not found.");
        } else {
            var camPos = camera.property("Position").value;

            // Create the light at camera position
            var newLight = comp.layers.addLight("Projection_Light", [camPos[0], camPos[1]]);
            newLight.threeDLayer = true;
            newLight.property("Position").setValue(camPos);

            // Accessing the Light Options property group
            var lightOptions = newLight.property("ADBE Light Options Group");

            // Apply light settings using working format
            lightOptions.lightType = LightType.SPOT;
            lightOptions.property("ADBE Light Intensity").setValue(100);
            lightOptions.property("ADBE Light Color").setValue([1, 1, 1]); // White
            lightOptions.property("ADBE Light Cone Angle").setValue(65);
            lightOptions.property("ADBE Casts Shadows").setValue(true); 

            try {
                var projImage = originalImage.duplicate();
                projImage.name = "Projection_Image";
                projImage.threeDLayer = true;

                var lightPos = newLight.property("Position").value;
                projImage.property("Position").setValue([
                    lightPos[0],
                    lightPos[1],
                    lightPos[2] + 100
                ]);
                projImage.property("Scale").setValue([5.4, 5.4, 5.4]);

            } catch (e) {
                alert("Error during image duplication: " + e.toString());
            }

            projImage.moveAfter(newLight);

            
            var materialOptions = projImage.property("ADBE Material Options Group");

                materialOptions.property("ADBE Casts Shadows").setValue(true);                // Casts Shadows: On
                materialOptions.property("ADBE Light Transmission").setValue(100);           // Light Transmission: 100%
                materialOptions.property("ADBE Accepts Shadows").setValue(2);                // Accepts Shadows: Only
                materialOptions.property("ADBE Accepts Lights").setValue(0);                 // Accepts Lights: Off
            
        }
    }

} else {
    alert("Please select a composition.");
}

app.endUndoGroup();