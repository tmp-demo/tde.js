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

// ------------------------ post processing functions

void apply_fog( in float distance, inout vec3 rgb ){

    float fogAmount = (1.0 - clamp(distance*0.0015,0.0,1.0) );
    vec3 fogColor = vec3(0.9,0.95,1);
    rgb = mix( skyColor, rgb, fogAmount );
}


void basic_lighting(in vec3 normal, in vec3 light_dir, inout vec3 color) {
    float attenuation = clamp(dot(normal, light_dir),0.0,1.0)*0.6 + 0.4;
}


$functions

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

vec3 color = default_color;





float ratio = res.x / res.y;
vec2 screen_position;
screen_position.x = (gl_FragCoord.x/res.x - 0.5);
screen_position.y = gl_FragCoord.y/res.y - 0.5;

vec3 direction;
vec3 iposition = position;


$camera



float num_steps;
float alpha= 1.0;
vec3 hitPosition = ray_march(iposition, direction, num_steps);



// TODO light is somewhat arbitrary
vec3 light_position = vec3(50.0 * sin(time*0.01), 10.0 + 40.0 * abs(cos(time*0.01)), (time) + 100.0 );
vec3 light_direction = normalize(light_position - hitPosition);





vec3 normal = compute_normal(hitPosition);

float depth = length(iposition-hitPosition);



$shading


// end
gl_FragColor = vec4(color, 1.);

}

