#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform float beat;
uniform vec2 res;
uniform mat4 mvmat;
uniform vec3 position;

#define time time/10.0

$define_max

// shadertoy compat
// #define time (iGlobalTime*30.0)
// #define resolution iResolution

$define_colors

#define viewMatrix mat4(0.0)
#define fovyCoefficient 1.0
#define shadowHardness 7.0
#define fovy_coef 1.0

#define epsilon 0.01
#define PI 3.14159265

$scene

// ------------------------ post processing

void apply_fog( in float distance, inout vec3 rgb ){

    float fogAmount = (1.0 - clamp(distance*0.0015,0.0,1.0) );
    vec3 fogColor = vec3(0.9,0.95,1);
    rgb = mix( skyColor, rgb, fogAmount );
}

float soft_shadow(in vec3 landPoint,
                  in vec3 light_direction,
                  float mint, float maxt,
                  float iterations)
{
    float penumbraFactor = 1.0;
    vec3 sphereNormal;
    float t = mint; //(mint + rand(gl_FragCoord.xy) * 0.01);
    for( int s = 0; s < 100; ++s )
    {
      // TODO[nical] use DistanceField instead
        if(t > maxt) break;
        float nextDist = min(
            BuildingsDistance(landPoint + light_direction * t )
            , RedDistance(landPoint + light_direction * t )
        );

        if( nextDist < 0.001 ){
            return 0.0;
        }
        //float penuAttenuation = mix (1.0, 0.0, t/maxt);
        penumbraFactor = min( penumbraFactor, iterations * nextDist / t );
        t += nextDist;
    }
    return penumbraFactor;
}

void basic_lighting(in vec3 normal, in vec3 light_dir, inout vec3 color) {
    float attenuation = clamp(dot(normal, light_dir),0.0,1.0)*0.6 + 0.4;
}

void ambient_occlusion (vec3 point, vec3 normal, float stepDistance, float samples, inout vec3 color) 
{
  float occlusion = 1.0;
  
  for (int i = 0; i < 20; ++i ) 
  {
    if(--samples < 0.0) break;
    occlusion -= (samples * stepDistance - (distance_field( point + normal * samples * stepDistance))) / pow(2.0, samples);
  }
  color = mix(shadowColor, color, occlusion);
}

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

// -------------------- marcher

vec3 ray_march(in vec3 position, in vec3 direction, out float steps)
{
    float next_distance = 1.0;
    for (int i = 0; i < MAX_STEPS ; ++i)
    {
        next_distance = distance_field(position);
        
        if (next_distance < 0.01)
        {
            steps = float(i);
            return position;
        }
        position += direction * next_distance;
    }
  steps = float(MAX_STEPS);

  return position;
}

vec3 compute_normal(vec3 pos)
{
    int dummy;
    return normalize(
        vec3(
          distance_field(vec3(pos.x + epsilon, pos.y, pos.z)) - distance_field( vec3(pos.x - epsilon, pos.y, pos.z))
        , distance_field(vec3(pos.x, pos.y + epsilon, pos.z)) - distance_field( vec3(pos.x, pos.y - epsilon, pos.z))
        , distance_field(vec3(pos.x, pos.y, pos.z + epsilon)) - distance_field( vec3(pos.x, pos.y, pos.z - epsilon))
        )
    );
}

// ----- main

void main(void)
{

float ratio = res.x / res.y;
vec2 screen_position;
screen_position.x = (gl_FragCoord.x/res.x - 0.5);
screen_position.y = gl_FragCoord.y/res.y - 0.5;

vec3 direction;
vec3 position;

$camera

float num_steps;
vec3 hitPosition = ray_march(position, direction, num_steps);

vec3 light_position = vec3(50.0 * sin(time*0.01), 10.0 + 40.0 * abs(cos(time*0.01)), (time) + 100.0 );
vec3 light_direction = normalize(light_position - hitPosition);
vec3 normal = compute_normal(hitPosition);
vec3 color = default_color;
float depth = length(position-hitPosition);

$shading

// end
gl_FragColor = vec4(color, 1.0);

}

