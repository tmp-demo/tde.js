{
    textures: {
        "depth": {
            format: "gl.DEPTH_COMPONENT",
        },
        "texture_1": {},
        "blur1": {},
        "blur2": {},
    },
    render_targets: {
        "color_depth": { color: "texture_1", depth: "depth" },
        "color_no_depth": { color: "texture_1" },
        "blur1": { color: "blur1" },
        "blur2": { color: "blur2" },
    },
    render_passes: [
        {
            clear: [0.0, 0.0, 0.8, 0.0],
            render_to: "color_depth",
        },
        {
            render_to: "color_depth",
            geometry: [["lines"]],
            uniforms: [{ name: "u_global_time", track: "foobar"}],
            program: "lines",
            depth_test: true,
        },
        {
            render_to: "color_depth",
            depth_test: true,
            geometry: [["sphere"]],
            program: "explode",
        },
        {
            clear: true,
            texture_inputs: ["texture_1"],
            render_to: "blur1",
            geometry: [["quad"]],
            program: "blur_h",
        },
        {
            clear: true,
            texture_inputs: ["blur1"],
            render_to: "blur2",
            geometry: [["quad"]],
            program: "blur_v",
        },
        {
            clear: true,
            texture_inputs: ["blur2"],
            render_to: "blur1",
            geometry: [["quad"]],
            program: "blur_h",
        },
        {
            clear: true,
            texture_inputs: ["blur1"],
            render_to: "blur2",
            geometry: [["quad"]],
            program: "blur_v",
        },
        {
            clear: true,
        },
        {
            texture_inputs: ["blur2"],
            geometry: [["quad"]],
            program: "alpha_threshold",
        },
        {
            enabled: "no_aquapaints",
            texture_inputs: ["texture_1"],
            geometry: [["quad"]],
            program: "postfx1",
        },
    ],
}