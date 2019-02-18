module.exports = {
    hello_world: {
        ja: "こんにちは。",
        en: "Hello world."
    },
    hello_world_x: {
        ja: (options) => {
            return `こんにちは、${options.x}さん。`
        },
        en: (options) => {
            return `Hello ${options.x}.`
        }
    }
}