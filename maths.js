// TODO[nical]

function dot(a,b) {
    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}

function cross(a,b) {
    return [a[2]*b[1]-b[2]*a[1],
            a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0]];
}

function add3(a,b) {
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

function normalize(a) {
    var l = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
    return [a[0]/l, a[1]/l, a[2]/l];
}

// Taken from tojiro's glmatrix library
// https://code.google.com/p/glmatrix/
function identity(dest) {
    if(!dest) { dest = new Float32Array(16); }
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
}

// Taken from tojiro's glmatrix library
// https://code.google.com/p/glmatrix/
function mat4_multiply(mat, mat2, dest) {
    if(!dest) { dest = mat }
    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
    var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
    var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
    var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
    var b00 = mat2[0], b01 = mat2[1], b02 = mat2[2], b03 = mat2[3];
    var b10 = mat2[4], b11 = mat2[5], b12 = mat2[6], b13 = mat2[7];
    var b20 = mat2[8], b21 = mat2[9], b22 = mat2[10], b23 = mat2[11];
    var b30 = mat2[12], b31 = mat2[13], b32 = mat2[14], b33 = mat2[15];
    dest[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
    dest[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
    dest[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
    dest[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
    dest[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
    dest[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
    dest[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
    dest[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
    dest[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
    dest[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
    dest[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
    dest[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
    dest[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
    dest[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
    dest[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
    dest[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
    return dest;
};

// Taken from tojiro's glmatrix library
// https://code.google.com/p/glmatrix/
function look_at(eye, center, up, mat) {
    if(!mat) { mat = identity(); }
    var eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (eyex == centerx && eyey == centery && eyez == centerz) {
        return identity(mat);
    }
    var z0,z1,z2,x0,x1,x2,y0,y1,y2,len;
    //vec3.direction(eye, center, z);
    z0 = eyex - center[0];
    z1 = eyey - center[1];
    z2 = eyez - center[2];
    // normalize (no check needed for 0 because of early return)
    len = 1/Math.sqrt(z0*z0 + z1*z1 + z2*z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;
    //vec3.normalize(vec3.cross(up, z, x));
    x0 = upy*z2 - upz*z1;
    x1 = upz*z0 - upx*z2;
    x2 = upx*z1 - upy*z0;
    len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1/len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    };
    //vec3.normalize(vec3.cross(z, x, y));
    y0 = z1*x2 - z2*x1;
    y1 = z2*x0 - z0*x2;
    y2 = z0*x1 - z1*x0;
    len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1/len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }
    mat[0] = x0;
    mat[1] = y0;
    mat[2] = z0;
    mat[3] = 0;
    mat[4] = x1;
    mat[5] = y1;
    mat[6] = z1;
    mat[7] = 0;
    mat[8] = x2;
    mat[9] = y2;
    mat[10] = z2;
    mat[11] = 0;
    mat[12] = -(x0*eyex + x1*eyey + x2*eyez);
    mat[13] = -(y0*eyex + y1*eyey + y2*eyez);
    mat[14] = -(z0*eyex + z1*eyey + z2*eyez);
    mat[15] = 1;
    return mat;
}

// Taken from tojiro's glmatrix library
// https://code.google.com/p/glmatrix/
function frustum(left, right, bottom, top, near, far, dest) {
        if(!dest) { dest = identity(); }
        var rl = (right - left);
        var tb = (top - bottom);
        var fn = (far - near);
        dest[0] = (near*2) / rl;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        dest[4] = 0;
        dest[5] = (near*2) / tb;
        dest[6] = 0;
        dest[7] = 0;
        dest[8] = (right + left) / rl;
        dest[9] = (top + bottom) / tb;
        dest[10] = -(far + near) / fn;
        dest[11] = -1;
        dest[12] = 0;
        dest[13] = 0;
        dest[14] = -(far*near*2) / fn;
        dest[15] = 0;
        return dest;
};

// Taken from tojiro's glmatrix library
// https://code.google.com/p/glmatrix/
function perspective(fovy, aspect, near, far, mat) {
        var top = near*Math.tan(fovy*Math.PI / 360.0);
        var right = top*aspect;
        return frustum(-right, right, -top, top, near, far, mat);
};

function sub3(a,b) {
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

function mix3(a,b,t) {
  return [
    a[0]*(1.0-t)+b[0]*t,
    a[1]*(1.0-t)+b[1]*t,
    a[2]*(1.0-t)+b[2]*t,
  ]
}

function quadratic(t) {
  return t * t;
}

function sqrt(t) {
  return Math.sqrt(t);
}

function exp(t) {
  return Math.expm1(t * Math.LN2);
}
