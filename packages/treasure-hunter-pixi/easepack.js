module.exports = {
  presets: [
    [
      require.resolve('easepack/lib/config/es'),
      {
        input: 'src/index.html',
        env: {
          development: {
            vendors: true,
          },
          production: {
            publicPath: '/TreasureHunter/pixi',
          },
        },
      },
    ],
  ],
  devServer: {
    index: 'index.html',
  },
};
