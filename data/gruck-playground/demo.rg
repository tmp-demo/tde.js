{
    render_passes: [
        {
            clear: [0.0, 0.0, 0.8, 0.0],
            render_to: { color: "texture_1", depth: "texture_depth" },
        },
        {
            texture_inputs: ["texture_paris"],
            render_to: { color: "texture_1", depth: "texture_depth" },
            depth_test: true,
            scene: [{ geometry: "grid"}],
            program: "debug_grid"
        },
        {
            texture_inputs: ["texture_1"],
            //render_to: { color: "tex_blur1" },
            scene: [{ geometry: "quad"}],
            program: "alpha_threshold"
        }
    ],
}