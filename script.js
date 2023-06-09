window.addEventListener(events.LOAD, function(){
    const penMode = {
        PEN: 0,
        ERASER: 1,
        FILL: 2,
        PICKER: 3,
        MAGIC_ERASER: 4
    };

    const canvas = document.querySelector('#graphic-canvas');
    const ctx = canvas.getContext('2d');
    const zoomIn = document.querySelector('#zoom-in');
    const zoomOut = document.querySelector('#zoom-out'); 
    const undo = document.querySelector('#undo');
    const redo = document.querySelector('#redo');
    const save = document.querySelector('#save');
    const color = document.querySelector('input[name="color"]');
    const penWeight = document.querySelector('input[name="pen-weight"]');
    const opacity = document.querySelector('input[name="opacity"]');
    const pen = document.querySelector('#pen');
    const eraser = document.querySelector('#eraser');
    const magicalEraser = this.document.querySelector('#magical-eraser');
    const fill = document.querySelector('#fill');
    const picker = document.querySelector('#picker');
    const mouseXCounter = document.querySelector('#mouse-x');
    const mouseYCounter = document.querySelector('#mouse-y');
    const loadImage = document.querySelector('#load-image');
    const importImage = this.document.querySelector('#import-image');
    const importResult = this.document.querySelector('#import-result');
    const newCanvas = this.document.querySelector('#new');
    const history = [];
    const buffer = new Image();
    const loadImageBuffer = new Image();
    const importImageBuffer = new Image();
    const loadFileReader = new FileReader();
    const importFileReader = new FileReader();
    ImageImport.init(canvas, ctx, saveProgress, importImage);

    let drag = false;
    let currentColor = "#000000";
    let weight = penWeight.value;
    let mode = penMode.PEN;
    let mouseX;
    let mouseY;
    let lastX;
    let lastY;
    let index = 0;
    let penOpacity = 1;

    buffer.addEventListener(events.LOAD, function(){
        ctx.drawImage(buffer, 0 ,0);
    });

    loadFileReader.addEventListener(events.LOAD, function(e){
        ctx.clearRect(0,0,1000,700);
        loadImageBuffer.src = e.target.result;
    });

    importFileReader.addEventListener(events.LOAD, function(e){
        importImageBuffer.src = e.target.result;
    });

    loadImageBuffer.addEventListener(events.LOAD, function(){
        ctx.drawImage(loadImageBuffer, 0, 0);
        saveProgress();
    });

    importImageBuffer.addEventListener(events.LOAD, function(){
        ImageImport.open(importResult, importImageBuffer);
    });

    document.addEventListener(events.KEYDOWN, function(e){
        if (e.shiftKey && e.ctrlKey && e.keyCode == keyboardKeys.Z)
        {
            redoHandler();
        }
        else if (e.ctrlKey && e.keyCode == keyboardKeys.Z)
        {
            e.preventDefault();
            undoHandler();
        }
        else if (e.ctrlKey && e.keyCode == keyboardKeys.S)
        {
            e.preventDefault();
            saveCanvas();
        }
        else if (e.keyCode == keyboardKeys.P)
        {
            mode = penMode.PEN;
        }
        else if (e.keyCode == keyboardKeys.E)
        {
            mode = penMode.ERASER;
        }
        else if (e.keyCode == keyboardKeys.G)
        {
            mode = penMode.FILL;
        }
        else if (e.keyCode == keyboardKeys.I)
        {
            mode = penMode.PICKER;
        }
        else if (e.ctrlKey && e.keyCode == keyboardKeys.L)
        {
            e.preventDefault();
            loadImage.click();
        }
        else if (e.ctrlKey && e.keyCode == keyboardKeys.O)
        {
            e.preventDefault();
            importImage.click();
        }
    });

    ctx.lineCap = 'round';
    history.push(canvas.toDataURL());

    function saveProgress()
    {
        ctx.globalCompositeOperation="source-over";
        if (index < history.length - 1)
        {
            while (history.length > index + 1)
                history.pop();
        }
        history.push(canvas.toDataURL());
        index++;
    }

    function rgbToHex(imageData)
    {
        let r = imageData[0].toString(16);
        let g = imageData[1].toString(16);
        let b = imageData[2].toString(16);
        let a = imageData[3].toString(16);
        r = (r.length == 1) ? "0" + r : r;
        g = (g.length == 1) ? "0" + g : g;
        b = (b.length == 1) ? "0" + b : b;
        a = (a.length == 1) ? "0" + a : a;
        return "#" + r + g + b + a;
    }

    function fillFunc(x, y, srcCol)
    {
        const colorStack = [[x, y]];
        let leftReach, rightReach, posX, posY;
        while (colorStack.length > 0) {
            posX = colorStack[colorStack.length - 1][0];
            posY = colorStack[colorStack.length - 1][1];
            colorStack.pop();
            leftReach = false;
            rightReach = false;
            while (posY > canvas.getClientRects()[0].y && rgbToHex(ctx.getImageData(posX, posY, 1, 1).data) == srcCol)
            {
                posY--;
            }
            posY++;
            while (posY < 699 && rgbToHex(ctx.getImageData(posX, posY, 1, 1).data) == srcCol)
            {
                if (posX - 1 > canvas.getClientRects()[0].x)
                {
                    if (rgbToHex(ctx.getImageData(posX - 1, posY, 1, 1).data) != srcCol)
                        leftReach = false;
                    if (rgbToHex(ctx.getImageData(posX - 1, posY, 1, 1).data) == srcCol && !leftReach)
                    {
                        colorStack.push([posX - 1, posY]);
                        leftReach = true;
                    }
                }
                if (posX + 1 < 999)
                {
                    if (rgbToHex(ctx.getImageData(posX + 1, posY, 1, 1).data) != srcCol)
                        rightReach = false;
                    if (rgbToHex(ctx.getImageData(posX + 1, posY, 1, 1).data) == srcCol && !rightReach)
                    {
                        colorStack.push([posX + 1, posY]);
                        rightReach = true;
                    }
                }
                ctx.fillRect(posX, posY, 1, 1);
                posY++;
            }
        }
    }

    function colorEuclideanDistance(col1, col2)
    {
        const col1Val = col1.slice(1);
        const col2Val = col2.slice(1);
        const [px, py, pz] = [parseInt(col1Val.slice(0, 2), 16), parseInt(col1Val.slice(2, 4), 16), parseInt(col1Val.slice(5, 6), 16)];
        const [qx, qy, qz] = [parseInt(col2Val.slice(0, 2), 16), parseInt(col2Val.slice(2, 4), 16), parseInt(col2Val.slice(5, 6), 16)];
        const d = Math.sqrt(Math.pow(px - qx, 2) + Math.pow(py - qy, 2) + Math.pow(pz - qz, 2));
        return d;
    }

    function magicalEraserFunc(x, y, srcCol)
    {
        const colorStack = [[x, y]];
        let leftReach, rightReach, posX, posY, posColor, posAlpha;
        while (colorStack.length > 0) {
            posX = colorStack[colorStack.length - 1][0];
            posY = colorStack[colorStack.length - 1][1];
            posColor = rgbToHex(ctx.getImageData(posX, posY, 1, 1).data).slice(0, 7);
            posAlpha = ctx.getImageData(posX, posY, 1, 1).data[3];
            colorStack.pop();
            leftReach = false;
            rightReach = false;
            while (posY > canvas.getClientRects()[0].y && colorEuclideanDistance(posColor, srcCol) <= 50 && (posAlpha > 0 && posAlpha <= 255))
            {
                posY--;
                posColor = rgbToHex(ctx.getImageData(posX, posY, 1, 1).data).slice(0, 7);
                posAlpha = ctx.getImageData(posX, posY, 1, 1).data[3];
            }
            posY++;
            posColor = rgbToHex(ctx.getImageData(posX, posY, 1, 1).data).slice(0, 7);
            posAlpha = ctx.getImageData(posX, posY, 1, 1).data[3];

            while (posY < 699 && colorEuclideanDistance(posColor, srcCol) <= 50 && (posAlpha > 0 && posAlpha <= 255))
            {
                if (posX - 1 > canvas.getClientRects()[0].x)
                {
                    const hexColor = rgbToHex(ctx.getImageData(posX - 1, posY, 1, 1).data).slice(0, 7);
                    const alpha = ctx.getImageData(posX - 1, posY, 1, 1).data[3];
                    if (colorEuclideanDistance(hexColor, srcCol) > 50 || alpha == 255 || alpha == 0)
                        leftReach = false;
                    if (colorEuclideanDistance(hexColor, srcCol) <= 50 && !leftReach)
                    {
                        colorStack.push([posX - 1, posY]);
                        leftReach = true;
                    }
                }
                if (posX + 1 < 999)
                {
                    const hexColor = rgbToHex(ctx.getImageData(posX + 1, posY, 1, 1).data).slice(0, 7);
                    const alpha = ctx.getImageData(posX + 1, posY, 1, 1).data[3];
                    if (colorEuclideanDistance(hexColor, srcCol) > 50 || alpha == 255 || alpha == 0)
                        rightReach = false;
                    if (colorEuclideanDistance(hexColor, srcCol) <= 50 && !rightReach)
                    {
                        colorStack.push([posX + 1, posY]);
                        rightReach = true;
                    }
                }
                ctx.clearRect(posX, posY, 1, 1);
                posY++;
                posColor = rgbToHex(ctx.getImageData(posX, posY, 1, 1).data).slice(0, 7);
                posAlpha = ctx.getImageData(posX, posY, 1, 1).data[3];
            }
        }
    }

    canvas.addEventListener(events.MOUSEUP, function(e){
        mouseX = parseInt(e.clientX - canvas.getClientRects()[0].x);
        mouseY = parseInt(e.clientY - canvas.getClientRects()[0].y);
        drag = false;
        ctx.globalAlpha = 1;
        if (mode != penMode.FILL || mode != penMode.PICKER)
            saveProgress();
    });
    canvas.addEventListener(events.MOUSEOVER, function(e){
        mouseX = parseInt(e.clientX - canvas.getClientRects()[0].x);
        mouseY = parseInt(e.clientY - canvas.getClientRects()[0].y);
        drag = false;
    });
    canvas.addEventListener(events.MOUSEDOWN, function(e){
        mouseX = parseInt(e.clientX - canvas.getClientRects()[0].x);
        mouseY = parseInt(e.clientY - canvas.getClientRects()[0].y);
        lastX = mouseX;
        lastY = mouseY;
        ctx.globalAlpha = penOpacity;
        drag = true;
    });
    canvas.addEventListener(events.MOUSEMOVE, function(e){
        mouseX = parseInt(e.clientX - canvas.getClientRects()[0].x);
        mouseY = parseInt(e.clientY - canvas.getClientRects()[0].y);
        mouseXCounter.innerText = mouseX;
        mouseYCounter.innerText = mouseY;
        if (drag){
            ctx.beginPath();
            if (mode == penMode.PEN)
            {
                ctx.globalCompositeOperation="source-over";
                ctx.strokeStyle = currentColor;
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(mouseX, mouseY);
                ctx.lineWidth = weight;
                ctx.stroke();
            }
            else if (mode == penMode.ERASER)
            {
                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(mouseX, mouseY);
                ctx.lineWidth = weight;
                ctx.stroke();
            }
            lastX = mouseX;
            lastY = mouseY;
        }
    });
    function undoHandler(){
        if (index > 0)
        {
            ctx.clearRect(0, 0, 1000, 700);
            index--;
            buffer.src = history[index];
        }
    }
    function redoHandler(){
        if (index < history.length - 1)
        {
            ctx.clearRect(0, 0, 1000, 700);
            index++;
            buffer.src = history[index];
        }
    }
    canvas.addEventListener(events.CLICK, function(e){
        mouseX = parseInt(e.clientX - canvas.getClientRects()[0].x);
        mouseY = parseInt(e.clientY - canvas.getClientRects()[0].y);
        if (mode == penMode.PICKER)
        {
            const imageData = ctx.getImageData(mouseX, mouseY, 1 ,1).data;
            currentColor = rgbToHex(imageData).slice(0,7);
            color.value = currentColor;
        }
        else if (mode == penMode.FILL)
        {
            const srcColor = rgbToHex(ctx.getImageData(mouseX, mouseY, 1 ,1).data);
            ctx.fillStyle = currentColor;
            if (srcColor != currentColor + parseInt(penOpacity * 255).toString(16))
                fillFunc(mouseX, mouseY, srcColor);
            saveProgress();
        }
        else if (mode == penMode.MAGIC_ERASER)
        {
            const srcPoint = ctx.getImageData(mouseX, mouseY, 1, 1).data;
            if (srcPoint[3] > 0)
            {
                magicalEraserFunc(mouseX, mouseY, rgbToHex(srcPoint).slice(0, 7));
            }
        }
    })
    zoomIn.addEventListener(events.CLICK, function(){
        ctx.scale(2,2);
    });
    zoomOut.addEventListener(events.CLICK, function(){
        ctx.scale(0.5, 0.5);
    });

    undo.addEventListener(events.CLICK, undoHandler);
    redo.addEventListener(events.CLICK, redoHandler);

    function saveCanvas(){
        const canvasUrl = canvas.toDataURL();
        const anchor = document.createElement('a');
        anchor.href = canvasUrl;
        anchor.download = "javascript-graphic-editor-demo-download";
        anchor.click();
        anchor.remove();
    }

    save.addEventListener(events.CLICK, saveCanvas);
    color.addEventListener(events.CHANGE, function(e){
        currentColor = e.target.value;
    });
    penWeight.addEventListener(events.CHANGE, function(e){
        weight = e.target.value;
        penWeight.blur();
    });
    pen.addEventListener(events.CLICK, function(){
        mode = penMode.PEN;
    });
    eraser.addEventListener(events.CLICK, function(){
        mode = penMode.ERASER;
    });
    magicalEraser.addEventListener(events.CLICK, function(){
        mode = penMode.MAGIC_ERASER;
    })
    fill.addEventListener(events.CLICK, function(){
        mode = penMode.FILL;
    })
    picker.addEventListener(events.CLICK, function(){
        mode = penMode.PICKER;
    });
    opacity.addEventListener(events.CHANGE, function(e){
        penOpacity = e.target.value;
        opacity.blur();
    });
    loadImage.addEventListener(events.CHANGE, function(e){
        loadFileReader.readAsDataURL(e.target.files[0]);
    });
    importImage.addEventListener(events.CHANGE, function(e){
        if (e.target.files.length)
            importFileReader.readAsDataURL(e.target.files[0]);
    })
    newCanvas.addEventListener(events.CLICK, function(){
        if (confirm("Your work is unsaved and your progress will be deleted. Do you want to create a new canvas?"))
        {
            while (history.length)
                history.pop();
            index = -1;
            ctx.clearRect(0,0,1000,700);
        }
    });
    document.addEventListener(events.MOUSEOVER, function(e){
        
        //console.log((importResult.getClientRects()[0].x - canvas.getClientRects()[0].x), (importResult.getClientRects()[0].y - canvas.getClientRects()[0].y));
    })
});