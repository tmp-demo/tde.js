

/* setup a canvas 2d, and shove the 2dcontext and canvas in the context. */
function setup_2d() {
  var cv = $("canvas");
  var c = cv.getContext("2d");

  return {
     cv:cv,
     c:c
  };
}
/* resize the canvas to be half the viewport, get a fresh imagedata, bound a
   couple variable to the global scope and eval the code. */
function execute_cb_2d(str, ctx) {
  function resizeCanvas(cv) {
    cv.height = window.innerHeight;
    cv.width  = (window.innerWidth / 2) | 0;
  }

  document.addEventListener("mozfullscreenchange", function() {
    resizeCanvas();
  });

  resizeCanvas(ctx.cv);

  w = ctx.cv.width;
  h = ctx.cv.height;
  ctx.id = ctx.c.createImageData(w, h),
  b = ctx.id.data;
  ctx.c.clearRect(0, 0, w, h);
  eval(str);
}

/* if the code execution did no throw, draw the pixels on screen. */
function render_2d(ctx) {
  ctx.c.putImageData(ctx.id, 0, 0);
  // ctx.c.fillStyle = "#f00";
  // ctx.c.fillRect(0, 0, ctx.cv.width, ctx.cv.height);
  // resize
  var c2 = document.createElement("canvas");
  c2.width = 512;
  c2.height = 512;
  var cc = c2.getContext("2d");
  cc.drawImage(ctx.cv, 0, 0, ctx.cv.width, ctx.cv.height, 0, 0, c2.width, c2.height);
  // cc.fillStyle = "#f00";
  // cc.fillRect(0, 0, c2.width, c2.height);
  var idd = cc.getImageData(0, 0, c2.width, c2.height);

  console.log(tex_bricks);
  tex_bricks.tex = create_texture(c2.width, c2.height, gl.RGBA, idd.data, true);
  console.log(tex_bricks);
};

