[
    {
        name: "first pass",
        render_to: {color: "texture_1", depth: "texture_depth"},
        clear: [0.5, 0.5, 0.5],
    },
    {
        render_to: {color: "texture_1", depth: "texture_depth"},
        depth_test: true,
        scene: "five_spheres",
        program: "explode",
    },
    {
        clear: true,
    },
    {
        enabled: "pass_effect1",
        texture_inputs: ["texture_1"],
        scene: [{ geometry: "quad"}],
        program: "postfx1",
    },
    {
        enabled: "pass_effect2",
        texture_inputs: ["texture_1"],
        scene: [{ geometry: "quad"}],
        program: "postfx2",
    }
]
