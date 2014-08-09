//! VERTEX

void main_vs_depth_of_field() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

const float RADIUS = 0.03;
//const float STEP = RADIUS / 4.0;

float sample_depth(vec2 uv) {
  return texture2D(texture_1, v_tex_coords + uv).r;
}

float linearizeDepth(float depth)
{
  /*const float zNear = 2.0;
  const float zFar = 2000.0;

  depth = 2.0 * depth - 1.0;
  return 2.0 * zNear * zFar / (zFar + zNear - depth * (zFar - zNear));*/
  
  return 8000.0 / (2002.0 - (2.0 * depth - 1.0) * 1998.0);
}

float computeCoc(float depth)
{
  const float dof = 100.0;
  return clamp(abs(depth - focus) / dof, 0.0, 1.0) * RADIUS;
}


void main_fs_depth_of_field() {
  float rx = 1.0 /resolution.x;
  float ry = 1.0 /resolution.y;
  float main_sample = sample_depth(vec2(0.0, 0.0));
  float depth_r  = sample_depth(vec2(rx,  0.0));
  float depth_l  = sample_depth(vec2(-rx, 0.0));
  float depth_t  = sample_depth(vec2(0.0,  ry));
  float depth_b  = sample_depth(vec2(0.0, -ry));
  float depth_tr = sample_depth(vec2(rx,   ry));
  float depth_br = sample_depth(vec2(rx,  -ry));
  float depth_tl = sample_depth(vec2(-rx,  ry));
  float depth_bl = sample_depth(vec2(-rx, -ry));

  /*float samples = main_sample
                + depth_r
                + depth_l
                + depth_t
                + depth_b
                + depth_tr
                + depth_br
                + depth_tl
                + depth_bl;

  samples = max(samples / 9.0, main_sample);
  float v = max((samples - near) / (far-near), 0.0);

  v = v*v;
  if (v > focus) {
    v = (v  - focus) / (1.0 - focus);
  } else {
    v = (focus - v - 0.2) / max(focus, 0.0000001);
  }
  vec3 a = texture2D(texture_0, v_tex_coords).rgb;
  vec3 b = texture2D(texture_1, v_tex_coords).rgb;
  vec3 c = texture2D(texture_2, v_tex_coords).rgb;
  vec3 d = texture2D(texture_3, v_tex_coords).rgb;*/

  float sobel_x =  depth_tl + 2.0*depth_l + depth_bl - depth_tr - 2.0 * depth_r - depth_br;
  float sobel_y = -depth_tl - 2.0*depth_t - depth_tr + depth_bl + 2.0 * depth_b + depth_br;
  float sob = 1.0 - 10.0 * sqrt((sobel_x*sobel_x) + (sobel_y*sobel_y));

//  gl_FragColor = vec4(v, v, v, 1.0);
//
//  a = vec4(0.2,0.2,0.2, 1.0);
//  b = vec4(0.4,0.4,0.4, 1.0);
//  c = vec4(0.6,0.6,0.6, 1.0);
//  d = vec4(0.8,0.8,0.8, 1.0);
//
//  a = vec4(1.0,0.0,0.0, 1.0);
//  b = vec4(0.0,1.0,0.0, 1.0);
//  c = vec4(0.0,0.0,1.0, 1.0);
//  d = vec4(0.5,0.5,0.5, 1.0);

  // smoothstep(a, b, x) has undefined behavior if a > b
  /*float da = 1.0 - smoothstep(0.4, 0.6, v);// +  smoothstep(0.999999999999, 1.0, v);
  float db = smoothstep(0.4, 0.6, v) * (1.0 - smoothstep(0.7, 0.8, v));
  float dc = smoothstep(0.7, 0.8, v) * (1.0 - smoothstep(0.9, 1.0, v));
  float dd = smoothstep(0.9, 0.99, v); // * (1.0 - smoothstep(0.99999999999, 1.0, v));*/

  /*gl_FragColor = a * da + b * db + c * dc + d * dd;
  //gl_FragColor = a;// * da + b * db + c * dc + d * dd;
  gl_FragColor *= sob;
  //gl_FragColor = vec4(main_sample, main_sample, main_sample, 1.0);

  gl_FragColor.a = 1.0;*/
  
  /*vec4 color;
  if (v_tex_coords.x < 0.25)
    color = a;
  else if (v_tex_coords.x < 0.5)
    color = b;
  else if (v_tex_coords.x < 0.75)
    color = c;
  else
    color = d;
  
  gl_FragColor = vec4(color.rgb, 1.0);*/
  
  vec2 poissonDisk[16];
  poissonDisk[0] = vec2(-0.613392, 0.617481);
  poissonDisk[1] = vec2(0.170019, -0.040254);
  poissonDisk[2] = vec2(-0.299417, 0.791925);
  poissonDisk[3] = vec2(0.645680, 0.493210);
  poissonDisk[4] = vec2(-0.651784, 0.717887);
  poissonDisk[5] = vec2(0.421003, 0.027070);
  poissonDisk[6] = vec2(-0.817194, -0.271096);
  poissonDisk[7] = vec2(-0.705374, -0.668203);
  poissonDisk[8] = vec2(0.977050, -0.108615);
  poissonDisk[9] = vec2(0.063326, 0.142369);
  poissonDisk[10] = vec2(0.203528, 0.214331);
  poissonDisk[11] = vec2(-0.667531, 0.326090);
  poissonDisk[12] = vec2(-0.098422, -0.295755);
  poissonDisk[13] = vec2(-0.885922, 0.215369);
  poissonDisk[14] = vec2(0.566637, 0.605213);
  poissonDisk[15] = vec2(0.0, 0.0);
  /*poissonDisk[15] = vec2(0.039766, -0.396100);
  poissonDisk[16] = vec2(0.751946, 0.453352);
  poissonDisk[17] = vec2(0.078707, -0.715323);
  poissonDisk[18] = vec2(-0.075838, -0.529344);
  poissonDisk[19] = vec2(0.724479, -0.580798);
  poissonDisk[20] = vec2(0.222999, -0.215125);
  poissonDisk[21] = vec2(-0.467574, -0.405438);
  poissonDisk[22] = vec2(-0.248268, -0.814753);
  poissonDisk[23] = vec2(0.354411, -0.887570);
  poissonDisk[24] = vec2(0.175817, 0.382366);
  poissonDisk[25] = vec2(0.487472, -0.063082);
  poissonDisk[26] = vec2(-0.084078, 0.898312);
  poissonDisk[27] = vec2(0.488876, -0.783441);
  poissonDisk[28] = vec2(0.470016, 0.217933);
  poissonDisk[29] = vec2(-0.696890, -0.549791);
  poissonDisk[30] = vec2(-0.149693, 0.605762);
  poissonDisk[31] = vec2(0.034211, 0.979980);
  poissonDisk[32] = vec2(0.503098, -0.308878);
  poissonDisk[33] = vec2(-0.016205, -0.872921);
  poissonDisk[34] = vec2(0.385784, -0.393902);
  poissonDisk[35] = vec2(-0.146886, -0.859249);
  poissonDisk[36] = vec2(0.643361, 0.164098);
  poissonDisk[37] = vec2(0.634388, -0.049471);
  poissonDisk[38] = vec2(-0.688894, 0.007843);
  poissonDisk[39] = vec2(0.464034, -0.188818);
  poissonDisk[40] = vec2(-0.440840, 0.137486);
  poissonDisk[41] = vec2(0.364483, 0.511704);
  poissonDisk[42] = vec2(0.034028, 0.325968);
  poissonDisk[43] = vec2(0.099094, -0.308023);
  poissonDisk[44] = vec2(0.693960, -0.366253);
  poissonDisk[45] = vec2(0.678884, -0.204688);
  poissonDisk[46] = vec2(0.001801, 0.780328);
  poissonDisk[47] = vec2(0.145177, -0.898984);
  poissonDisk[48] = vec2(0.062655, -0.611866);
  poissonDisk[49] = vec2(0.315226, -0.604297);
  poissonDisk[50] = vec2(-0.780145, 0.486251);
  poissonDisk[51] = vec2(-0.371868, 0.882138);
  poissonDisk[52] = vec2(0.200476, 0.494430);
  poissonDisk[53] = vec2(-0.494552, -0.711051);
  poissonDisk[54] = vec2(0.612476, 0.705252);
  poissonDisk[55] = vec2(-0.578845, -0.768792);
  poissonDisk[56] = vec2(-0.772454, -0.090976);
  poissonDisk[57] = vec2(0.504440, 0.372295);
  poissonDisk[58] = vec2(0.155736, 0.065157);
  poissonDisk[59] = vec2(0.391522, 0.849605);
  poissonDisk[60] = vec2(-0.620106, -0.328104);
  poissonDisk[61] = vec2(0.789239, -0.419965);
  poissonDisk[62] = vec2(-0.545396, 0.538133);
  poissonDisk[63] = vec2(-0.178564, -0.596057);*/

  vec3 color = vec3(0.0);
  float sum = 0.0;
  for (int i = 0; i < 16; i++)
  {
    vec2 offset = poissonDisk[i] * RADIUS;
    float depth = sample_depth(offset);
    if (depth <= main_sample)
    {
      float linearDepth = linearizeDepth(depth);
      float coc = computeCoc(linearDepth);
      float weight = smoothstep(coc, coc * 0.5, length(offset));
      color += weight * texture2D(texture_0, v_tex_coords + offset).rgb;
      sum += weight;
    }
  }
  
  /*vec3 color = vec3(0.0);
  float sum = 0.0;
  for (float y = -RADIUS; y <= RADIUS; y += STEP)
  {
    for (float x = -RADIUS; x <= RADIUS; x += STEP)
    {
      vec2 offset = vec2(x, y);
      float depth = sample_depth(offset);
      if (depth <= main_sample)
      {
        float linearDepth = linearizeDepth(depth);
        float coc = computeCoc(linearDepth);
        float weight = smoothstep(coc, coc * 0.5, length(offset));
        color += weight * texture2D(texture_0, v_tex_coords + offset).rgb;
        sum += weight;
      }
    }
  }*/
  
  
  color /= sum;
  
  //float d = sample_depth(vec2(0.0));
  // d = 2.0 * d - 1.0;
  // float ld = 2.0 * zNear * zFar / (zFar + zNear - d * (zFar - zNear));
  //float coc = clamp((d - focus) / 2.0, 0.0, 1.0);
  //float coc = max((d - 0.98) / 0.02, 0.0);
  //color = vec3(computeCoc(linearizeDepth(d)));
  gl_FragColor = vec4(color * sob, 1.0);
}
