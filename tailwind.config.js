module.exports = {
  content: ["./src/pages/**/*.{js,html}", "./src/components/**/*.{js,html}"],
  theme: {
    extend: {
      backgroundImage: {
        "intro-pattern": "url('./assets/img/bg-main.png')",
        "intro-pattern-m": "url('./assets/img/bg-main_m.png')",
      },
    },
  },
  plugins: [],
};
