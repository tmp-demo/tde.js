#ifdef GL_ES
precision highp float;
#endif

uniform float time;
#define time time / 10.0

uniform float duration;
/* beat */
uniform float beat;
/* resolution */
uniform vec2 res;

uniform mat4 mvmat;
uniform vec3 position;

#define MAX_STEPS 100


#define epsilon 0.01
#define PI 3.14159265

#define NO_HIT 0
#define HAS_HIT 1

#define SKY_MTL 0
#define GROUND_MTL 1
#define BUILDINGS_MTL 2
#define DEFAULT_MTL 3
#define RED_MTL 273812

