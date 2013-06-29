precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
/* resolution */
uniform vec2 res;

uniform float beat;

uniform sampler2D u_image;
uniform vec2 u_textureSize;

varying vec2 v_texCoord;

float DistanceToFunc(vec2 xy, float time, float phi){
	// y = cos(t)*cos(x) +x	=> x = y - cost
	
	float t = mod(time,6.28);
	float t2 = 3.5*time*1000.0/duration - 1.3;//mod(time*0.2, 4.0)-1.0;
	float t3 = mod(time*0.2,6.28);
	
	float disty = abs(xy.y +t2 - xy.x + 0.1*cos(t+phi)*cos(10.0*xy.x));
	float distx = 9999.0;
	
	return min(disty, distx);
	
}

void main(void)
{
	
	
	
	gl_FragColor = texture2D(u_image,(vec2(1.0, 1.0) + v_texCoord) / 2.0 ) - vec4 (0.0,0.0,0.0,0.001);
	
	float timeInSeconds = time /1000.0;
	
	vec2 uv = gl_FragCoord.xy / res.xy;
	if(DistanceToFunc(uv+vec2(0.00,0),timeInSeconds,0.0) < 0.2)
	   gl_FragColor = vec4(0.93, 0.0, 0.0, 1.0);
	if(DistanceToFunc(uv+vec2(0.2,0),timeInSeconds,0.4) < 0.2 && gl_FragColor.w != 1.0)
	   gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
	if(DistanceToFunc(uv+vec2(0.4,0),timeInSeconds,0.8) < 0.2 && gl_FragColor.w != 1.0)
	   gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
	if(DistanceToFunc(uv+vec2(0.6,0),timeInSeconds,1.2) < 0.2 && gl_FragColor.w != 1.0)
	   gl_FragColor = vec4(0.0, 0.47, 0.25, 1.0);
	if(DistanceToFunc(uv+vec2(0.8,0),timeInSeconds,1.6) < 0.2 && gl_FragColor.w != 1.0)
	   gl_FragColor = vec4(0.25, 0.25, 1.0, 1.0);
	if(DistanceToFunc(uv+vec2(1.0,0),timeInSeconds,2.0) < 0.2 && gl_FragColor.w != 1.0)
	   gl_FragColor = vec4(0.62, 0.0, 0.75, 1.0);

	

}