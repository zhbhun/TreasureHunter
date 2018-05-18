import * as PIXI from 'pixi.js';

export default (name, atlas) => {
  let callback = null;
  PIXI.loader.add(name, atlas.meta.image).load((loader, resources) => {
    const { texture } = resources[name];
    Object.keys(atlas.frames).forEach((key) => {
      const { frame } = atlas.frames[key];
      texture[key] = new PIXI.Texture(
        texture,
        new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h),
      );
    });
    if (callback) {
      callback(loader, resources);
    }
  });
  return {
    load: (func) => {
      callback = func;
    },
  };
};
