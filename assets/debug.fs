
void debug_depth(float d, inout vec3 color) {
  float val = min(d, MAX_DISTANCE) / MAX_DISTANCE;
  color.r = val;
  color.g = val;
  color.b = val;
}

void debug_steps(float steps, inout vec3 color) {
  float val = steps / float(MAX_STEPS);
  color.r = val;
  color.g = val;
  color.b = val;
}

void debug_coords(in vec3 position, in float size, in float dist, inout vec3 color) {
  if (dist < MAX_DISTANCE &&
      (mod(position.x, size) < 0.4 || mod(position.z, size) < 0.4)) {
    color = vec3(1.0,0.0,0.0);
  }
}
