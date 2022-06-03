const {
  override,
  addPostcssPlugins,
  addWebpackAlias,
} = require("customize-cra");
const path = require("path");
// const resolve = (dir) => path.join(__dirname, dir);

function myOver(webpackConfig) {
  webpackConfig.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
  });

  return webpackConfig;
}

module.exports = override(
  myOver,
  addWebpackAlias({
    "@": path.resolve(__dirname, "./src/"),
    "@/components": path.resolve(__dirname, "./src/components/"),
  }),
  addPostcssPlugins([require("tailwindcss"), require("autoprefixer")])
  // addWebpackAlias({
  //   "@": resolve("src"),
  // })
);
