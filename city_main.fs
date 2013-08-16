


void FishEyeCamera(vec2 screenPos, float ratio, float fovy, mat4 transform, out vec3 direction)
{
    screenPos.y -= 0.2;
    screenPos *= vec2(PI*0.5,PI*0.5/ratio)/fovy;
    
    float px = screenPos.x / 2.0;
    float py = screenPos.y / 2.0;

    direction = vec3(
           sin(py+PI*0.5)*sin(px)
        , -cos(py+PI*0.5)
        , sin(py+PI*0.5)*cos(px)
    );
    direction = (mvmat * vec4(direction,0.0)).xyz;
}



void main(void)
{
    float ratio = res.x / res.y;
    // position on the screen
    vec2 screenPos;
    screenPos.x = (gl_FragCoord.x/res.x - 0.5);
    screenPos.y = gl_FragCoord.y/res.y - 0.5;

    vec3 direction;
    FishEyeCamera(screenPos, ratio, fovyCoefficient, viewMatrix, direction);
    int material;
    vec3 hitposition = RayMarch(position, direction, material);

    // see city_mtl_*.fs
    vec3 hitColor = computeColor(position, hitposition, direction, material);
    // see city_post_*.fs
    gl_FragColor = postProcess(vec4(hitColor,1.0), position, hitposition, material);

}
