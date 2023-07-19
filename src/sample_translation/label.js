module.exports = {
    which_pizza: {
        ja: "ピザのタイプは？",
        en: "Which pizza you like?"
    },
    its_x_yen: {
        ja: (options) => {
            return `${options.amount}円です。`
        },
        en: (options) => {
            return `Amount is ${options.amount} yen.`
        }
    },
    hello_world: {
        ja: "こんにちは。",
        en: "Hello world."
    }
}