class ImageImport
{
    static canvas;
    static context;
    static imageBuffer;
    static importImage;
    static image;
    static originW;
    static originH;
    static imageDegree = 0;
    static flipX = 1;
    static flipY = 1;
    static imageDrag = false;
    static mouseX;
    static mouseY;
    static lastX;
    static lastY;
    static saveCb;

    static init(canvas, context, saveCb, importImage)
    {
        ImageImport.canvas = canvas;
        ImageImport.context = context;
        ImageImport.saveCb = saveCb;
        ImageImport.importImage = importImage;
    }

    static open(image, imageBuffer) {
        ImageImport.importImage.blur();
        ImageImport.imageBuffer = imageBuffer;
        ImageImport.image = image;
        ImageImport.image.src = ImageImport.imageBuffer.src;
        ImageImport.image.style.display = "block";
        ImageImport.image.style.position = "absolute";
        ImageImport.image.style.top = "8px";
        ImageImport.image.style.left = "8px";
        ImageImport.image.style.border = "1px solid cyan";
        [ImageImport.originW, ImageImport.originH] = [ImageImport.image.clientWidth, ImageImport.image.clientHeight];
        ImageImport.setupListeners();
    }
    static increaseSize()
    {
        const w = ImageImport.image.clientWidth;
        const h = ImageImport.image.clientHeight;
        ImageImport.image.style.width = w + ((0.1 * ImageImport.originW)) + "px";
        ImageImport.image.style.height = h + ((0.1 * ImageImport.originH)) + "px";
    }
    static decreaseSize(){
        const w = ImageImport.image.clientWidth;
        const h = ImageImport.image.clientHeight;
        ImageImport.image.style.width = w - ((0.1 * ImageImport.originW)) + "px";
        ImageImport.image.style.height = h - ((0.1 * ImageImport.originH)) + "px";
    }
    static cancelChanges()
    {
        ImageImport.close();
    }
    static commitTransform()
    {
        ImageImport.image.style.transform = "scale(" + ImageImport.flipX + ", " + ImageImport.flipY + ") rotate(" + (ImageImport.imageDegree * ImageImport.flipX * ImageImport.flipY) + "deg)";
    }
    static flipHorizontal(){
        ImageImport.flipX *= -1;
        ImageImport.commitTransform();
    }
    static flipVertical(){
        ImageImport.flipY *= -1;
        ImageImport.commitTransform();
    }
    static rotateLeft(){
        ImageImport.imageDegree--;
        ImageImport.commitTransform();
    }
    static rotateRight(){
        ImageImport.imageDegree++;
        ImageImport.commitTransform();
    }
    static commitChanges(){
        const w = parseInt(ImageImport.image.clientWidth);
        const h = parseInt(ImageImport.image.clientHeight);
        const x = parseInt(ImageImport.image.style.left) - ImageImport.canvas.getClientRects()[0].x + w / 2;
        const y = parseInt(ImageImport.image.style.top) - ImageImport.canvas.getClientRects()[0].y + h / 2;
        ImageImport.context.save();
        ImageImport.context.translate(x, y);
        ImageImport.context.rotate((ImageImport.imageDegree) * Math.PI / 180);
        ImageImport.context.scale(ImageImport.flipX, ImageImport.flipY);
        ImageImport.context.drawImage(ImageImport.imageBuffer, -w / 2, -h / 2, w, h);
        ImageImport.context.restore();
        ImageImport.saveCb();
        ImageImport.close();
    }
    static setupListeners(){
        ImageImport.image.addEventListener(events.CLICK, ImageImport.clickHandler);
        ImageImport.image.addEventListener(events.MOUSEMOVE, ImageImport.mousemoveHandler);
        document.addEventListener(events.KEYDOWN, ImageImport.keyDownHandler);
    }
    static clickHandler(event){
        ImageImport.mouseX = event.clientX - ImageImport.canvas.getClientRects()[0].x;
        ImageImport.mouseY = event.clientY - ImageImport.canvas.getClientRects()[0].y;
        ImageImport.lastX = ImageImport.mouseX;
        ImageImport.lastY = ImageImport.mouseY;
        ImageImport.imageDrag = !ImageImport.imageDrag;
    }
    static mousemoveHandler(event){
        if (ImageImport.imageDrag)
        {
            ImageImport.mouseX = event.clientX - ImageImport.canvas.getClientRects()[0].x;
            ImageImport.mouseY = event.clientY - ImageImport.canvas.getClientRects()[0].y;
            // importResult.style.top = ((importResult.getClientRects()[0].y) + (mouseY - lastY)) + "px";
            // importResult.style.left = ((importResult.getClientRects()[0].x) + (mouseX - lastX)) + "px";
            // lastX = mouseX;
            // lastY = mouseY;
            ImageImport.image.style.top = ImageImport.mouseY - ImageImport.image.clientHeight / 2 + "px";
            ImageImport.image.style.left = ImageImport.mouseX - ImageImport.image.clientWidth / 2 + "px";
        }
        //console.log(parseInt(importResult.style.top), parseInt(importResult.style.left))
    }
    static keyDownHandler(event){
        if (event.keyCode == keyboardKeys.ENTER)
            ImageImport.commitChanges();
        else if (event.keyCode == keyboardKeys.ADD)
            ImageImport.increaseSize();
        else if (event.keyCode == keyboardKeys.SUBTRACT)
            ImageImport.decreaseSize();
        else if (event.keyCode == keyboardKeys.DELETE)
            ImageImport.cancelChanges();
        else if (event.shiftKey && event.keyCode == keyboardKeys.H)
            ImageImport.flipHorizontal();
        else if (event.shiftKey && event.keyCode == keyboardKeys.V)
            ImageImport.flipVertical();
        else if (event.keyCode == keyboardKeys.NUM_4)
            ImageImport.rotateLeft();
        else if (event.keyCode == keyboardKeys.NUM_6)
            ImageImport.rotateRight();
    }
    static close() {
        ImageImport.imageDegree = 0;
        ImageImport.flipX = 1;
        ImageImport.flipY = 1;
        ImageImport.imageDrag = false;
        ImageImport.image.style.display = "none";
        ImageImport.image.style.width = '';
        ImageImport.image.style.height = '';
        ImageImport.image.style.width = '';
        ImageImport.image.style.height = '';
        ImageImport.importImage.value = "";
        ImageImport.image.style.transform = "scale(1, 1) rotate(0deg)";
        ImageImport.image.removeEventListener(events.CLICK, ImageImport.clickHandler);
        ImageImport.image.removeEventListener(events.MOUSEMOVE, ImageImport.mousemoveHandler);
        document.removeEventListener(events.KEYDOWN, ImageImport.keyDownHandler);
    }
}