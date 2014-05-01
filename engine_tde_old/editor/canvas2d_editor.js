
function CanvasToTexturePlugin() {
  this.image = null;
  var img = this.image;

  /* setup a canvas 2d, and shove the 2dcontext and canvas in the context. */
  this.init = function() {};

  /* resize the canvas to be half the viewport, get a fresh imagedata, bound a
     couple variable to the global scope and eval the code. */
  this.execute = function canvas2d_execute(str, asset) {
    w = asset.width;
    h = asset.height;

    var canvas2d = document.createElement("canvas");
    canvas2d.width = w;
    canvas2d.height = h;

    var canvas_context = canvas2d.getContext("2d");
    var b = canvas_context.createImageData(0, 0, w, h);
    eval(str);
    img = b;
    console.log(b)
  }

  /* if the code execution did no throw, draw the pixels on screen. */
  this.render = function canvas2d_render(asset) {
    if (!img) {
      console.log("missing image :(");
      return;
    }
    console.log(asset);
    console.log(asset.tex);
    console.log(asset.width);
    console.log(asset.height);
    // TODO
    var new_asset = create_texture(
      asset.width, asset.height,
      gl.RGBA, this.image, true
    );
    asset.tex = new_asset.tex;
  };
}

canvas_editor_plugin = new CanvasToTexturePlugin();
