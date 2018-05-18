/* eslint-disable no-param-reassign */
import {
  Application,
  Container,
  loader,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from 'pixi.js';

import treasureHunter from './images/treasureHunter';
import loadAtlas from './loadAtlas';

const { resources } = loader;
const idKey = 'treasureHunter';
// Create a Pixi Application
const app = new Application({
  view: document.getElementById('app'),
  width: 512,
  height: 512,
  antialias: true,
  transparent: false,
  resolution: 1,
});

loadAtlas(idKey, treasureHunter).load(setup);

// Define variables that might be used in more than one function
let state;
let explorer;
let treasure;
let blobs;
let dungeon;
let door;
let healthBar;
let message;
let gameScene;
let gameOverScene;
let id;

function setup(a, b) {
  // Make the game scene and add it to the stage
  gameScene = new Container();
  app.stage.addChild(gameScene);

  // Make the sprites and add them to the `gameScene`
  // Create an alias for the texture atlas frame ids
  id = resources[idKey].texture;

  // Dungeon
  dungeon = new Sprite(id['dungeon.png']);
  gameScene.addChild(dungeon);

  // Door
  door = new Sprite(id['door.png']);
  door.position.set(32, 0);
  app.stage.addChild(door);

  // Explorer
  explorer = new Sprite(id['explorer.png']);
  explorer.x = 68;
  explorer.y = gameScene.height / 2 - explorer.height / 2;
  explorer.vx = 0;
  explorer.vy = 0;
  gameScene.addChild(explorer);

  // Treasure
  treasure = new Sprite(id['treasure.png']);
  treasure.x = gameScene.width - treasure.width - 48;
  treasure.y = gameScene.height / 2 - treasure.height / 2;
  gameScene.addChild(treasure);

  // Make the blobs
  const numberOfBlobs = 6;
  const spacing = 48;
  const xOffset = 150;
  const speed = 2;
  let direction = 1;
  // An array to store all the blob monsters
  blobs = [];
  // Make as many blobs as there are `numberOfBlobs`
  for (let i = 0; i < numberOfBlobs; i += 1) {
    // Make a blob
    const blob = new Sprite(id['blob.png']);

    // Space each blob horizontally according to the `spacing` value.
    // `xOffset` determines the point from the left of the screen
    // at which the first blob should be added.
    const x = spacing * i + xOffset;

    // Give the blob a random y position
    // (`randomInt` is a custom function - see below)
    const y = randomInt(0, app.stage.height - blob.height);

    // Set the blob's position
    blob.x = x;
    blob.y = y;

    // Set the blob's vertical velocity. `direction` will be either `1` or
    // `-1`. `1` means the enemy will move down and `-1` means the blob will
    // move up. Multiplying `direction` by `speed` determines the blob's
    // vertical direction
    blob.vy = (speed + i) * direction;

    // Reverse the direction for the next blob
    direction *= -1;

    // Push the blob into the `blobs` array
    blobs.push(blob);

    // Add the blob to the `gameScene`
    gameScene.addChild(blob);
  }

  // Create the health bar
  healthBar = new Container();
  healthBar.position.set(app.stage.width - 170, 4);
  gameScene.addChild(healthBar);

  // Create the black background rectangle
  const innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  // Create the front red rectangle
  const outerBar = new Graphics();
  outerBar.beginFill(0xff3300);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;

  // Create the `gameOver` scene
  gameOverScene = new Container();
  app.stage.addChild(gameOverScene);

  // Make the `gameOver` scene invisible when the game first starts
  gameOverScene.visible = false;

  // Create the text sprite and add it to the `gameOver` scene
  const style = new TextStyle({
    fontFamily: 'Futura',
    fontSize: 64,
    fill: 'white',
  });
  message = new Text('The End!', style);
  message.x = 120;
  message.y = app.stage.height / 2 - 32;
  gameOverScene.addChild(message);

  // Capture the keyboard arrow keys
  const left = keyboard(37);
  const up = keyboard(38);
  const right = keyboard(39);
  const down = keyboard(40);

  left.press = () => {
    // Change the explorer's velocity when the key is pressed
    explorer.vx = -5;
    explorer.vy = 0;
  };

  // Left arrow key `release` method
  left.release = () => {
    // If the left arrow has been released, and the right arrow isn't down,
    // and the cat isn't moving vertically:
    // Stop the explorer
    if (!right.isDown && explorer.vy === 0) {
      explorer.vx = 0;
    }
  };

  // Up
  up.press = () => {
    explorer.vy = -5;
    explorer.vx = 0;
  };
  up.release = () => {
    if (!down.isDown && explorer.vx === 0) {
      explorer.vy = 0;
    }
  };

  // Right
  right.press = () => {
    explorer.vx = 5;
    explorer.vy = 0;
  };
  right.release = () => {
    if (!left.isDown && explorer.vy === 0) {
      explorer.vx = 0;
    }
  };

  // Down
  down.press = () => {
    explorer.vy = 5;
    explorer.vx = 0;
  };
  down.release = () => {
    if (!up.isDown && explorer.vx === 0) {
      explorer.vy = 0;
    }
  };

  // Set the game state
  state = play;

  // Start the game loop
  app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
  // Update the current game state:
  state(delta);
}

function play(delta) {
  // use the explorer's velocity to make it move
  explorer.x += explorer.vx;
  explorer.y += explorer.vy;

  // Contain the explorer inside the area of the dungeon
  contain(explorer, {
    x: 28,
    y: 10,
    width: 488,
    height: 480,
  });
  // contain(explorer, stage);

  // Set `explorerHit` to `false` before checking for a collision
  let explorerHit = false;

  // Loop through all the sprites in the `enemies` array
  blobs.forEach((blob) => {
    // Move the blob
    blob.y += blob.vy;
    // Check the blob's screen boundaries
    const blobHitsWall = contain(blob, {
      x: 28,
      y: 10,
      width: 488,
      height: 480,
    });
    // If the blob hits the top or bottom of the stage, reverse
    // its direction
    if (blobHitsWall === 'top' || blobHitsWall === 'bottom') {
      blob.vy *= -1;
    }
    // Test for a collision. If any of the enemies are touching
    // the explorer, set `explorerHit` to `true`
    if (hitTestRectangle(explorer, blob)) {
      explorerHit = true;
    }
  });
  // If the explorer is hit...
  if (explorerHit) {
    // Make the explorer semi-transparent
    explorer.alpha = 0.5;
    // Reduce the width of the health bar's inner rectangle by 1 pixel
    healthBar.outer.width -= 3;
  } else {
    // Make the explorer fully opaque (non-transparent) if it hasn't been hit
    explorer.alpha = 1;
  }

  // Check for a collision between the explorer and the treasure
  if (hitTestRectangle(explorer, treasure)) {
    // If the treasure is touching the explorer, center it over the explorer
    treasure.x = explorer.x + 8;
    treasure.y = explorer.y + 8;
  }

  // Does the explorer have enough health? If the width of the `innerBar`
  // is less than zero, end the game and display "You lost!"
  if (healthBar.outer.width < 0) {
    state = end;
    message.text = 'You lost!';
  }
  // If the explorer has brought the treasure to the exit,
  // end the game and display "You won!"
  if (hitTestRectangle(treasure, door)) {
    state = end;
    message.text = 'You won!';
  }
}

function end() {
  gameScene.visible = false;
  gameOverScene.visible = true;
}

/* Helper functions */
function contain(sprite, container) {
  let collision;
  // Left
  if (sprite.x < container.x) {
    sprite.x = container.x;
    collision = 'left';
  }
  // Top
  if (sprite.y < container.y) {
    sprite.y = container.y;
    collision = 'top';
  }
  // Right
  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision = 'right';
  }
  // Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision = 'bottom';
  }
  // Return the `collision` value
  return collision;
}

// The `hitTestRectangle` function
function hitTestRectangle(r1, r2) {
  // Define the variables we'll need to calculate
  let hit = false;
  let combinedHalfWidths = 0;
  let combinedHalfHeights = 0;
  let vx = 0;
  let vy = 0;

  // hit will determine whether there's a collision
  hit = false;

  // Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  // Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  // Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  // Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  // Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {
    // A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {
      // There's definitely a collision happening
      hit = true;
    } else {
      // There's no collision on the y axis
      hit = false;
    }
  } else {
    // There's no collision on the x axis
    hit = false;
  }
  // `hit` will be either `true` or `false`
  return hit;
}

// The `randomInt` helper function
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// The `keyboard` helper function
function keyboard(keyCode) {
  const key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;

  // The `downHandler`
  key.downHandler = (event) => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  // The `upHandler`
  key.upHandler = (event) => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  // Attach event listeners
  window.addEventListener('keydown', key.downHandler.bind(key), false);
  window.addEventListener('keyup', key.upHandler.bind(key), false);
  return key;
}
