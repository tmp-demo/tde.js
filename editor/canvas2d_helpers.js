

function set(b, x, y, p) {
  var i = x * 4 + y * w * 4;
  b[i] = b[i+1] = b[i+2] = p;
  b[i+3] = 255;
}

function get(b, x, y) {
  return b[x * 4 + y * w * 4];
}

function noise(b) {
  for (var i = 0; i < b.length; i+=4) {
    b[i] = b[i+1] = b[i+2] = Math.random() * 255;
    b[i + 3] = 255;
  }
}

function zoom(b, w, h, factor) {
  var zoomed = c.createImageData(w, h);
  var zd = zoomed.data;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      zd[idx(x, y)] = zd[idx(x, y) + 1] = zd[idx(x, y) + 2] = b[idx(Math.floor(x/factor), Math.floor(y/factor))];
      zd[idx(x, y) + 3] = 255;
    }
  }
  return zoomed;
}

function smoothxy(b, x, y) {
  var fractX = x -  Math.floor(x);
  var fractY = y - Math.floor(y);

  var x1 =  (Math.floor(x) + w) % w;
  var y1 = (Math.floor(y) + h) % h;

  var x2 = (x1 + w - 1) % w;
  var y2 = (y1 + h - 1) % h;

  var value = 0.0;
  value += fractX       * fractY       * b[idx(x1,y1)];
  value += fractX       * (1 - fractY) * b[idx(x1,y2)];
  value += (1 - fractX) * fractY       * b[idx(x2,y1)];
  value += (1 - fractX) * (1 - fractY) * b[idx(x2,y2)];

  return value;
}

function smoothnoise(b, filtering) {
  cid = c.createImageData(w, h);
  cd = cid.data;

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      cd[idx(x, y)] = cd[idx(x, y) + 1] = cd[idx(x, y) + 2] = smoothxy(b, x / filtering, y / filtering);
      cd[idx(x, y) + 3] = 255;
    }
  }

  return cid;
}

function turbulence(b, octaves) {
  var initial_octaves = octaves;
  var outid = c.createImageData(w, h);
  var out = outid.data;
  while(octaves >= 1) {
    console.log(octaves)
    // var cid = smoothnoise(b, octaves);
    // var cc = cid.data;
    var cc = b;
    for (var i = 0; i < cc.length; i++) {
      out[i] = Math.min((out[i] + (cc[i] /* / Math.sqrt(initial_octaves) */ )), 255);
    }
    octaves /= 2;
  }
  return outid;
}

function funny_yellowish_thing() {
  function noise(b) {
    for (var i = 0; i < b.length; i+=4) {
      b[i] = b[i+1] = b[i+2] = Math.random() * 255;
      b[i + 3] = 255;
    }
  }

  function zoom(b, w, h, factor) {
    var zoomed = c.createImageData(w, h);
    var zd = zoomed.data;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        zd[idx(x, y)] = zd[idx(x, y) + 1] = zd[idx(x, y) + 1] = b[idx(x / factor, y/factor)];
        zd[idx(x, y) + 3] = 255;
      }
    }
    return zoomed;
  }
  noise(b, w, h);
  id = zoom(b, w, h, 8);
}

function simplex_noise(b, w, h, largestFeature, persistence) {
  var octave_count = ((Math.log(largestFeature)/Math.log(2))|0) + 1;
  var octaves = [];
  var freqs = [];
  var ampl = [];
  for (var i = 0; i < octave_count; i++) {
    octaves[i] = new SimplexNoise();
    freqs[i] = Math.pow(2, i);
    ampl[i] = Math.pow(persistence, octaves.length - i);
  }

  var rv = 0;
  var x = 0, y = 0;
  for (var i = 0; i < b.length; i+=4) {
    var result = 0;
    for (var j = 0; j < octave_count; j++) {
      result = result + octaves[j].noise2D(x / freqs[j], y / freqs[j]) * ampl[j];
    }
    b[i] = b[i+1] = b[i+2] = (result + 1) * 128;
    b[i + 3] = 255;
    x++;
    if (x >= w) {
      x = 0;
      y++;
    }
  }
}

// https://github.com/jwagner/simplex-noise.js
function SimplexNoise(random) {
  if (!random) random = Math.random;
  this.p = new Uint8Array(256);
  this.perm = new Uint8Array(512);
  this.permMod12 = new Uint8Array(512);
  for (var i = 0; i < 256; i++) {
    this.p[i] = random() * 256;
  }
  for (i = 0; i < 512; i++) {
    this.perm[i] = this.p[i & 255];
    this.permMod12[i] = this.perm[i] % 12;
  }
}

var F2 = 0.5 * (Math.sqrt(3.0) - 1.0),
    G2 = (3.0 - Math.sqrt(3.0)) / 6.0,
    F3 = 1.0 / 3.0,
    G3 = 1.0 / 6.0,
    F4 = (Math.sqrt(5.0) - 1.0) / 4.0,
    G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

SimplexNoise.prototype = {
grad3: new Float32Array([1, 1, 0,
           - 1, 1, 0,
           1, - 1, 0,

           - 1, - 1, 0,
           1, 0, 1,
           - 1, 0, 1,

           1, 0, - 1,
           - 1, 0, - 1,
           0, 1, 1,

           0, - 1, 1,
           0, 1, - 1,
           0, - 1, - 1]),
       noise2D: function (xin, yin) {
         var permMod12 = this.permMod12,
         perm = this.perm,
         grad3 = this.grad3;
         var n0=0, n1=0, n2=0; // Noise contributions from the three corners
         // Skew the input space to determine which simplex cell we're in
         var s = (xin + yin) * F2; // Hairy factor for 2D
         var i = Math.floor(xin + s);
         var j = Math.floor(yin + s);
         var t = (i + j) * G2;
         var X0 = i - t; // Unskew the cell origin back to (x,y) space
         var Y0 = j - t;
         var x0 = xin - X0; // The x,y distances from the cell origin
         var y0 = yin - Y0;
         // For the 2D case, the simplex shape is an equilateral triangle.
         // Determine which simplex we are in.
         var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
         if (x0 > y0) {
           i1 = 1;
           j1 = 0;
         } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
         else {
           i1 = 0;
           j1 = 1;
         } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
         // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
         // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
         // c = (3-sqrt(3))/6
         var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
         var y1 = y0 - j1 + G2;
         var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
         var y2 = y0 - 1.0 + 2.0 * G2;
         // Work out the hashed gradient indices of the three simplex corners
         var ii = i & 255;
         var jj = j & 255;
         // Calculate the contribution from the three corners
         var t0 = 0.5 - x0 * x0 - y0 * y0;
         if (t0 >= 0) {
           var gi0 = permMod12[ii + perm[jj]] * 3;
           t0 *= t0;
           n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
         }
         var t1 = 0.5 - x1 * x1 - y1 * y1;
         if (t1 >= 0) {
           var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
           t1 *= t1;
           n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
         }
         var t2 = 0.5 - x2 * x2 - y2 * y2;
         if (t2 >= 0) {
           var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
           t2 *= t2;
           n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
         }
         // Add contributions from each corner to get the final noise value.
         // The result is scaled to return values in the interval [-1,1].
         return 70.0 * (n0 + n1 + n2);
       }
}

/* box blur, operate on a scanline */
function blur_scanline(b, offset, len, blur_px) {
  var x = offset;
  var avg = 0;
  // XXX distinguish left and right lobe if blur_px is odd
  var hb = Math.floor(blur_px / 2);
  // fill kernel: first pixel
  for (var i = 0; i < hb; i++) {
    avg += b[i * 4];
  }
  b[x] = b[x+1] = b[x+2] = avg / hb;
  x+=4;

  // left lobe
  for (var i = 0; i < hb; i++) {
    avg += b[x + hb * 4];
    b[x] = b[x+1] = b[x+2] = avg / (hb + 1 + i);
    x += 4;
  }

  // process most of the scanline
  for (var i = 0; i < len - hb - hb - 1; i++) {
    avg += b[x + hb * 4];
    avg -= b[x - hb * 4];
    b[x] = b[x+1] = b[x+2] = avg / blur_px;
    x += 4;
  }

  // flush kernel
  for (var i = 0; i < hb; i++) {
    avg -= b[x - hb * 4];
    b[x] = b[x+1] = b[x+2] = avg / (blur_px - i - 1);
    x += 4;
  }
  return x;
}

/* horizontal blur */
function hblur(b, blur_px)  {
  var x = 0;
  for (var scanline = 0; scanline < h; scanline++) {
    x = blur_scanline(b, x, w, blur_px);
  }
}

/* copy a vertical line of pixel from the image to a linear buffer */
function copy_vertical_in_buffer(b, scanline, buffer) {
  for (var i = 0; i < buffer.length; i+=4) {
    buffer[i]   = b[4 * (scanline + i / 4* w)];
    buffer[i+1] = b[4 * (scanline + i / 4* w) + 1];
    buffer[i+2] = b[4 * (scanline + i / 4* w) + 2];
    buffer[i+3] = b[4 * (scanline + i / 4* w) + 3];
  }
}

/* copy a buffer to a vertical */
function copy_buffer_in_vertical(b, scanline, buffer) {
  for (var i = 0; i < buffer.length; i+=4) {
    b[scanline * 4 + i / 4 * w * 4]     = buffer[i];
    b[scanline * 4 + i / 4 * w * 4 + 1] = buffer[i+1];
    b[scanline * 4 + i / 4 * w * 4 + 2] = buffer[i+2];
    b[scanline * 4 + i / 4 * w * 4 + 3] = buffer[i+3];
  }
}

/* vertical blur of blur_px */
function vblur(b, blur_px) {
  var buf = new Uint8ClampedArray(h * 4);

  for (var vertical = 0; vertical < w; vertical++) {
    copy_vertical_in_buffer(b, vertical, buf);
    blur_scanline(buf, 0, h, blur_px);
    copy_buffer_in_vertical(b, vertical, buf);
  }
}

function gaussian_blur(b, blur_px) {
  for (var i = 0; i < 3; i++) {
    hblur(b, blur_px);
    vblur(b, blur_px);
  }
}

function lopass(b, pole) {
  var mem_in = b[0];
  var mem_out = b[0];
  for (var i = 4; i < b.length; i += 4) {
    mem_in = b[i];
  }
}

function clamp(v, min, max) {
  return Math.max(Math.min(v, max), min);
}

function rgbavg(b, i) {
  return (b[i] + b[i+1] + b[i+2]) / (3 * 255);
}

function idx(x, y) {
  return x * 4 + y * w * 4;
}

function vnorm(x, y, z) {
  var len = Math.sqrt((x * x) + (y * y) + (z * z))
  return [x / len, y / len, z / len];
}

function normalmap(b, w, h, depth) {
  var nm = c.createImageData(w, h);
  var nmd = nm.data;

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var topleft      = idx(clamp(x - 1, 0, w), clamp(y - 1, 0, h)),
          top          = idx(clamp(x - 0, 0, w), clamp(y - 1, 0, h)),
          topright     = idx(clamp(x + 1, 0, w), clamp(y - 1, 0, h)),
          right        = idx(clamp(x - 0, 0, w), clamp(y - 0, 0, h)),
          bottomright  = idx(clamp(x + 1, 0, w), clamp(y + 1, 0, h)),
          bottom       = idx(clamp(x + 1, 0, w), clamp(y - 0, 0, h)),
          bottomleft   = idx(clamp(x - 1, 0, w), clamp(y + 1, 0, h)),
          left         = idx(clamp(x - 1, 0, w), clamp(y - 0, 0, h)),
          tlnorm = rgbavg(b, topleft),
          tnorm  = rgbavg(b, top),
          trnorm = rgbavg(b, topright),
          rnorm  = rgbavg(b, right),
          brnorm = rgbavg(b, bottomright),
          bnorm  = rgbavg(b, bottom),
          blnorm = rgbavg(b, bottomleft),
          lnorm  = rgbavg(b, left),
          dx = (trnorm + 2.0 * rnorm + brnorm) - (tlnorm + 2.0 * lnorm + blnorm),
          dy = (blnorm + 2.0 * bnorm + brnorm) - (tlnorm + 2.0 * tnorm + trnorm),
          dz = 1.0 / depth,
          normalized = vnorm(dx, dy, dz);

      function remap(px) {
        return (px + 1.0) * (128);
      }

      nmd[idx(x,y)] = remap(normalized[0]);
      nmd[idx(x,y)+1] = remap(normalized[1]);
      nmd[idx(x,y)+2] = remap(normalized[2]);
      nmd[idx(x,y)+3] = 255;
    }
  }
 return nm;
}

