module.exports = {
  content: ["./src/pages/**/*.{js,html}", "./src/components/**/*.{js,html}"],
  theme: {
    extend: {
      "loa-logo": "url('../public/img/ico_logo.svg')",
    },
    backgroundColor: (theme) => ({
      ...theme("colors"),
      "intro-bg": "#f3f1f1",
    }),
  },
  plugins: [],
};
