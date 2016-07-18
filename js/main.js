window.onload = function() {
  // Set the name of the hidden property and the change event for visibility
  var hidden, visibilityChange; 
  if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }
  
  // Back key event listener
  document.addEventListener('tizenhwkey', function(e) {
    if (e.keyName === "back") {
        try {
            tizen.application.getCurrentApplication().exit();
        } catch (ignore) {}
    }
  });
  
  // Visibility change event listener
  document.addEventListener(visibilityChange, function () {
	  if (document[hidden]){
	  	pause = true;
        document.removeEventListener('click', action);
        document.removeEventListener('rotarydetent', move);
	  } else {
	    pause = false;
	    countP = 0;
	    document.addEventListener('click', action);
	    document.addEventListener('rotarydetent', move);
	  }
  }, false);
  // tap event
  document.addEventListener('click', action);
  
  // Sprites
  var spriteExplosion = new Image();
  spriteExplosion.src = 'images/explosion.png';
  var imgHeart = new Image();
  imgHeart.src = 'images/heart.png';
  var imgRefresh = new Image();
  imgRefresh.src = 'images/refresh.png';

  // Setting up the canvas
  var canvas = document.getElementById('canvas'),
      ctx    = canvas.getContext('2d'),
      cH     = ctx.canvas.height = 360,
      cW     = ctx.canvas.width  = 360;

  // Game variables
  var bullets    = [],
      asteroids  = [],
      explosions = [],
      collected  = 0,
      roundRecord = 0,
      minBallSpeed = 1,
      maxBallSpeed = 2,
      maxBalls = 1,
      destroyed  = 0,
      record     = 0,
      lifes      = 4,
      count      = 0,
      pause 	 = false,
      countP 	 = 0,
      playing    = false,
      gameOver   = false;

  //Player
  var player = {
      posX   : -24,
      posY   : -24,
      spriteWidth  : 48,
      spriteHeight : 48,
      sizeX : 48,
      sizeY : 48,
      deg    : 0
  };

  function drawCircle() {
      var data = [1,1,1,1];
      var colors = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12"];
      var center = [0, 0];
      var radius = 50;
      var lastPosition = 0, total = 0;
      for(var i in data) { total += data[i]; }
      for (var i = 0; i < data.length; i++) {
          ctx.fillStyle = colors[i];
          ctx.beginPath();
          ctx.moveTo(center[0],center[1]);
          ctx.arc(center[0],center[1],radius,lastPosition,lastPosition+(Math.PI*2*(data[i]/total)),false);
          ctx.lineTo(center[0],center[1]);
          ctx.fill();
          lastPosition += Math.PI*2*(data[i]/total);
      }
  }

  function drawBall(centerX, centerY, ballType) {
      var strokeColor = "";
      var fillColor = "";

      switch(ballType){
          case 1: // yellow
              fillColor = "#f39c12";
              strokeColor = "#664207";
              break;
          case 2: // blue
              fillColor = "#3498db";
              strokeColor = "#184766";
              break;
          case 3: // red
              fillColor = "#e74c3c";
              strokeColor = "#66221b";
              break;
          case 4: // green
              fillColor = "#2ecc71";
              strokeColor = "#176638";
              break;
      }

      var radius = 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();

  }

  function move(e) {
	  if (e.detail.direction === "CW") {
		  player.deg += 0.261799388;
		  player.deg %= 2*Math.PI;
	  } else {
		  player.deg -= 0.261799388;
		  player.deg %= 2*Math.PI;
	  }
  }

  function action(e) {
      e.preventDefault();
      if(gameOver) {
          if(e.type === 'click') {
              gameOver   = false;
              count      = 0;
              bullets    = [];
              asteroids  = [];
              explosions = [];
              destroyed  = 0;
              player.deg = 0;
              collected = 0;
              roundRecord = 0;
              minBallSpeed = 1;
              maxBallSpeed = 2;
              maxBalls = 1;
              lifes = 4;
              document.removeEventListener('rotarydetent', move);
          } 
      } else {
          if(e.type === 'click') {
              playing = true;
              document.removeEventListener("rotarydetent", action);
              document.addEventListener('rotarydetent', move);
          }
      }
      
  }

  function _player() {

      ctx.save();
      ctx.translate(cW/2,cH/2);

      ctx.rotate(player.deg);
      drawCircle()

      ctx.restore();
  }

  function newAsteroid() {

      var tmpRand = random(1,4),
          type = random(1,4),
          coordsX,
          coordsY;

      switch(tmpRand){
          case 1:
              coordsX = random(0, cW);
              coordsY = 0 - 150;
              break;
          case 2:
              coordsX = cW + 150;
              coordsY = random(0, cH);
              break;
          case 3:
              coordsX = random(0, cW);
              coordsY = cH + 150;
              break;
          case 4:
              coordsX = 0 - 150;
              coordsY = random(0, cH);
              break;
      }

      var asteroid = {
          state: 0,
          stateX: 0,
          width: 20,
          height: 20,
          realX: coordsX,
          realY: coordsY,
          moveY: 0,
          speed: Math.random() * (maxBallSpeed - minBallSpeed) + minBallSpeed,
          coordsX: coordsX,
          coordsY: coordsY,
          type: type,
          size: random(1,3),
          deg: Math.atan2(coordsX  - (cW/2), -(coordsY - (cH/2))),
          destroyed: false
      };
      asteroids.push(asteroid);
  }

  function _asteroids() {
      var distance;

      for(var i = 0; i < asteroids.length; i++) {
          if (!asteroids[i].destroyed) {
              ctx.save();
              ctx.translate(asteroids[i].coordsX, asteroids[i].coordsY);
              ctx.rotate(asteroids[i].deg);

              drawBall(10,asteroids[i].moveY += asteroids[i].speed,asteroids[i].type);
              ctx.restore();

              //Real Coords
              asteroids[i].realX = (0) - (asteroids[i].moveY + (asteroids[i].height/2)) * Math.sin(asteroids[i].deg);
              asteroids[i].realY = (0) + (asteroids[i].moveY + (asteroids[i].height/2)) * Math.cos(asteroids[i].deg);

              asteroids[i].realX += asteroids[i].coordsX;
              asteroids[i].realY += asteroids[i].coordsY;

              //Game over
              distance = Math.sqrt(Math.pow(asteroids[i].realX -  cW/2, 2) + Math.pow(asteroids[i].realY - cH/2, 2));
              if (distance < 50) {

                  // Scaling player rotation angle to 2xPI
                  var deg = player.deg;// < 0 ? player.deg + Math.PI*2 : player.deg;
                  
                  // Computing start and end of target arc
                  var arcStart = ((asteroids[i].type-1)*(Math.PI/2) + deg) % (2*Math.PI);
                  var arcEnd = (asteroids[i].type-1)*(Math.PI/2) + deg + Math.PI/2;

                  if (arcEnd > Math.PI/2) {
                      arcEnd = arcEnd % (2*Math.PI);
                  }

                  // Computing angle of ball
                  var angle = Math.atan2(asteroids[i].realX-cW/2,cH/2 - asteroids[i].realY);
                  if (angle < 0) {
                      angle = angle + 2*Math.PI;
                  }
                  
                  if (((angle > arcStart) && (angle < arcEnd)) ||
                     ((arcEnd < arcStart) && ((angle > arcStart && angle <= Math.PI*2) || (angle >= 0 && angle < arcEnd)))) {
                      collected += 1;
                      if (collected > roundRecord) {roundRecord = collected};
                      maxBallSpeed = roundRecord/5 + 2;
                      if (maxBallSpeed > 3) {
                          maxBallSpeed = 3;
                      }
                      if (roundRecord > 15) {
                          minBallSpeed = 0.4;
                          maxBalls = 2;
                      }
                      asteroids.splice(i, 1)
                  } else {
                      collected -= 1;
                      lifes -= 1;
                      if (collected < 0) {collected = 0};
                      destroyed += 1;
                      asteroids[i].destroyed = true;
                      explosions.push(asteroids[i]);
                  }

                  if (lifes === -1) {
                      gameOver = true;
                      playing  = false;
                  }
              }
          } else if(!asteroids[i].extinct) {
              explosion(asteroids[i]);
          }
      }

      if(asteroids.length - destroyed < maxBalls) {
          newAsteroid();
      }
  }

  function explosion(asteroid) {
      ctx.save();
      ctx.translate(asteroid.realX, asteroid.realY);
      ctx.rotate(asteroid.deg);

      var spriteY,
          spriteX = 256;
      if(asteroid.state === 0) {
          spriteY = 0;
          spriteX = 0;
      } else if (asteroid.state < 8) {
          spriteY = 0;
      } else if(asteroid.state < 16) {
          spriteY = 256;
      } else if(asteroid.state < 24) {
          spriteY = 512;
      } else {
          spriteY = 768;
      }

      if(asteroid.state === 8 || asteroid.state === 16 || asteroid.state === 24) {
          asteroid.stateX = 0;
      }

      ctx.drawImage(
          spriteExplosion,
          asteroid.stateX += spriteX,
          spriteY,
          256,
          256,
          -25,
          -25,
          60,
          60
      );
      asteroid.state += 1;

      if(asteroid.state === 31) {
          asteroid.extinct = true;
      }

      ctx.restore();
  }

  function start() {
	  if (pause) {
          if (countP < 1) {
              countP = 1;
          }
      } else if (!gameOver) {
          //Clear
          ctx.clearRect(0, 0, cW, cH);
          ctx.beginPath();

          //Player
          _player();

          if(playing) {
              _asteroids();

              var startX = 130;
              for (var i = 0; i < lifes; i++) {
                  ctx.drawImage(
                      imgHeart,
                      startX,
                      40,
                      20,
                      20
                  );
                  startX += 25;
              }

              ctx.font = "10px Helvetica";
              ctx.fillStyle = "white";
              ctx.textBaseline = 'middle';
              ctx.textAlign = "center";
              ctx.fillText(TIZEN_L10N["record"] + ': '+record, cW/2,cH/2 - 150);

              ctx.font = "18px Helvetica";
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              ctx.textBaseline = 'middle';
              ctx.fillText(''+collected+'', cW/2,cH/2 + 150);

          } else {
              ctx.font = "bold 25px Helvetica";
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              ctx.fillText("Color Catcher", cW/2,cH/2 - 120);

              ctx.font = "bold 18px Helvetica";
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              ctx.fillText(TIZEN_L10N["tap_to_play"], cW/2,cH/2 - 90);     
                
              ctx.font = "bold 18px Helvetica";
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              ctx.fillText(TIZEN_L10N["instructions"], cW/2,cH/2 + 100);
                
              ctx.font = "14px Helvetica";
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              ctx.fillText(TIZEN_L10N["catch"], cW/2,cH/2 + 125);
              ctx.fillText(TIZEN_L10N["use_bezel"], cW/2,cH/2 + 145);
          }
      } else if(count < 1) {
          count = 1;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.rect(0,0, cW,cH);
          ctx.fill();

          ctx.font = "25px Helvetica";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(TIZEN_L10N["game_over"],cW/2,cH/2 - 100);

          ctx.font = "18px Helvetica";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(TIZEN_L10N["score"] + ': ' + roundRecord, cW/2,cH/2 + 100);

          record = roundRecord > record ? roundRecord : record;

          ctx.font = "18px Helvetica";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(TIZEN_L10N["record"] + ": "+ record, cW/2,cH/2 + 125);

          ctx.drawImage(imgRefresh, cW/2 - 23, cH/2 - 23);
      }
  }

  function init() {
      window.requestAnimationFrame(init);
      start();
  }

  init();

  //Utils
  function random(from, to) {
      return Math.floor(Math.random() * (to - from + 1)) + from;
  }
}