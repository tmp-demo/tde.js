{
    render_passes: [
        {
            clear: [0.0, 0.0, 0.8, 0.0],
            render_to: { color: "texture_1", depth: "texture_depth" },
        },
        {
            render_to: { color: "texture_1", depth: "texture_depth" },
            scene: [{ geometry: "lines"}],
            program: "lines",
            depth_test: true,
        },
        {
            render_to: { color: "texture_1", depth: "texture_depth" },
            depth_test: true,
            scene: [{ geometry: "sphere"}],
            program: "explode",
        },
        {
            clear: true,
            texture_inputs: ["texture_1"],
            render_to: { color: "tex_blur1" },
            scene: [{ geometry: "quad" }],
            program: "blur_h",
        },
        {
            clear: true,
            texture_inputs: ["tex_blur1"],
            render_to: { color: "tex_blur2" },
            scene: [{ geometry: "quad" }],
            program: "blur_v",
        },
        {
            clear: true,
            texture_inputs: ["tex_blur2"],
            render_to: { color: "tex_blur1" },
            scene: [{ geometry: "quad" }],
            program: "blur_h",
        },
        {
            clear: true,
            texture_inputs: ["tex_blur1"],
            render_to: { color: "tex_blur2" },
            scene: [{ geometry: "quad" }],
            program: "blur_v",
        },
        {
            clear: true,
        },
        {
            texture_inputs: ["tex_blur2"],
            //render_to: { color: "tex_blur1" },
            scene: [{ geometry: "quad"}],
            program: "alpha_threshold",
        },
        {
            enabled: "no_aquapaints",
            texture_inputs: ["texture_1"],
            scene: [{ geometry: "quad"}],
            program: "postfx1",
        },
    ],
}