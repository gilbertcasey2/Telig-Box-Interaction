/**
* Name: main.js
* Author: Casey E Gilbert
* Created: 27MAR2017
* Purpose: This program runs the main webGL for the exploded
* product for Council Rock. It allows the product to be viewed 
* in its original state, exploded out, and analyzed in detail.
* The three.js library is used.
*/

		
// Set up the scene for WebGL
	
	var scene; // the scene
	var camera;  // the camera
	var renderer; // the renderer
	var controls; // the controls to rotate the screen
	var loader; // the object loader
	var sphere; // the sphere that creates the background
	var mouse = new THREE.Vector2(), INTERSECTED;  // allows you to select objects
	var raycaster; // also allows you to select objects
	var obj;  // whatever object you are loading
	var whiteMat; // the material needed
	var loader; // loads the objects
	var objects; // an array that holds all the objects
	//var origPos; // an array holding the original positions
	var newPosx; // an array holding new x positions
	var newPosy; // an array holding new y positions
	var newPosz;// an array holding new z positions

	var newRotx; // an array holding new x rotations
	var newRoty; // an array holding new y rotations
	var newRotz; // an array holding new z rotations

	// how much to move/ rotate each object to set up the scene
	var xchange = -9;
	var ychange = 3;
	var zchange = -1;
	var xrotate = 0;
	var yrotate = 0;
	var zrotate = 0;

	// animation stuff
	//var movable = 1;  // can we move about the scene
	var state = 0; 		// What state are we in? 0 = whole, 1 = exploded, 2 = detail
	var objNum = 13;	// total number of objects

	var circScale = 1;       // the original circuit scale
	var newCircScale = 1.7;  // scale up the circuit board by this much

	// dealing with adding dummy objects
	var objAdded = 0;
	var rect; // rectangle for circuit board
	var batRect; // for battery
	var elecRect; // for electric interfaces
	var shellRect; // for the shell
	var antennaeRect; // for the antennae
	var moduleRect; // for the antennae

	// define the states for each detail object
	var CIRCUITDETAIL = 1;
	var BATTERYDETAIL = 2;
	var ELECTRICDETAIL = 3;
	var SHELLDETAIL = 4;
	var ANTENNAEDETAIL = 5;
	var MODULEDETAIL = 6;

	// tell us if one of objects is in detail view
	// 0 means none, 1 is circuit board, 2 is battery,
	// 3 is electric interface, 4 is shell, 5 is antennae, 6 is module
	var detail = 0;
	var labelCount = 0; // so we can add the labels piece by piece (aesthetics) 
	var isDragging = false; // if we are dragging gthe mouse
	var origQuat; // the object's original quatarion
	var currObj; // the current selected obj ( if we are in detailed view)
	var deltaRotationQuaternion; // rotational quaternion

	// now for the new positions/rotations for each detail view of objects

	var pivot = new THREE.Mesh(new THREE.BoxGeometry(10,10,10));
	
	// the detail positions/rotations for each detail object 

	var circuitPos = new THREE.Vector3(0,30,-45);
	var circuitRot = new THREE.Vector3(round(-35* (Math.PI/180), 2), round(20 * (Math.PI/180), 2), round(10 * (Math.PI/180), 2));
	var circuitChange = new THREE.Vector3(-6,21,-30);

	var batteryPos = new THREE.Vector3(15,55,-90);
	var batteryRot = new THREE.Vector3(round(-10* (Math.PI/180), 2), round(25 * (Math.PI/180), 2), round(10 * (Math.PI/180), 2));
	var batteryChange = new THREE.Vector3(-22,-18,12);

	var electricPos = new THREE.Vector3(20,45,-110);
	var electricRot = new THREE.Vector3(round(-10* (Math.PI/180), 2), round(15 * (Math.PI/180), 2), round(10 * (Math.PI/180), 2));
	var electricChange = new THREE.Vector3(-24,4,10);

	var shellPos = new THREE.Vector3(0,25,-30);
	var shellRot = new THREE.Vector3(round(60* (Math.PI/180), 2), round(15 * (Math.PI/180), 2), round(10 * (Math.PI/180), 2));
	var shellChange = new THREE.Vector3(-9,-3,0);

	var antennaePos = new THREE.Vector3(0,0,-90);
	var antennaeRot = new THREE.Vector3(round(5* (Math.PI/180), 2), round(15 * (Math.PI/180), 2), round(10 * (Math.PI/180), 2));
	var antennaeChange = new THREE.Vector3(-9,42,4);

	var modulePos = new THREE.Vector3(-14,55,-115);
	var moduleRot = new THREE.Vector3(round(0* (Math.PI/180), 2), round(0 * (Math.PI/180), 2), round(0 * (Math.PI/180), 2));
	var moduleChange = new THREE.Vector3(0,0,0);

	var click = 0; // did we click?

	//tween
	var target; // target moving towards
	var position; // position moving from
	var tween;  // the tween!
		
/**
* name: start 
* This sets the logo position depending on screen height
*/
function start() {
	var logo = $("#logo");
	var h = window.innerHeight;
	logo.css("top", h - 90 + "px");									  
}
		
/**
* name: init
* This function builds scene, camera, and adds the elements
* and waits for them to load
*/
function init() {
		// new scene
		scene = new THREE.Scene();
		
		//new camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
		// set the camera position
		camera.position.set(-12,70,-140);
		scene.add(camera);
		// add scene elements
		addSceneElements();
} 

/**
* name: init2()
* This function starts after the objects have all loaded
* so that we are not trying to access objects or properties 
* of objects that have not loaded yet.
*/
function init2() {
		// attach the telig logo to the cap
		THREE.SceneUtils.attach( scene.getObjectByName("telig"), scene, scene.getObjectByName("cap"));
		// rotate/position the telig logo so that it sits nicely on the cap
		scene.getObjectByName("telig").position.z = scene.getObjectByName("telig").position.z + .5;
		scene.getObjectByName("telig").rotation.x = scene.getObjectByName("telig").rotation.x - 3 * (Math.PI/180);
		scene.getObjectByName("telig").rotation.z = scene.getObjectByName("telig").rotation.z + 3 * (Math.PI/180);
	
		// add lights
		addLights();
	
		// make sure that we can't see the pivot
		pivot.material.visible = false;
	
		// Create the renderer
		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth-4, window.innerHeight-4); // make it the size of the site
		
		// append the renderer to the document
		document.body.appendChild( renderer.domElement );
	
		// add orbit controls so we can move around scene
		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.target = new THREE.Vector3(xchange - 10, ychange, zchange);
	
		// build axis
		projector = new THREE.Projector();
		mouseVector = new THREE.Vector3();
		
		// add a window resize listener
		window.addEventListener('resize', onWindowResize, false);
		window.addEventListener('click', onDocumentMouseClick, false);
		
		// check for mouse movement
		window.addEventListener('mousemove', onDocumentMouseMove, false);
		
		// add explode eventlistener
        document.getElementById("exp").addEventListener("click", explode);
        //document.getElementById("exp").addEventListener("click", exp);
		// create function to handle closing from detail view
		
		document.getElementById('closeDetail').addEventListener('click', function() {
			if(detail == BATTERYDETAIL + 10) {
				batteryTweenOut();
			} else if (detail == CIRCUITDETAIL + 10){
				circuitTweenOut();
			} else if (detail == ANTENNAEDETAIL + 10){
				antennaeTweenOut();
			} else if (detail == ELECTRICDETAIL + 10){
				electricTweenOut();
			} else if (detail == SHELLDETAIL + 10){
				shellTweenOut();
			} else if (detail == MODULEDETAIL + 10){
				moduleTweenOut();
			}
			//reset the pivot
			pivot.rotation.x = 0;
			pivot.rotation.y = 0;
			pivot.rotation.z = 0;
		});
	
		// add event labels to handle the circuit's different button options
		document.getElementById("top").addEventListener("click", function() {
			$("#circLabel").css("display", "none");
			$(".circLabel").css("display", "none");
			$("#circText").css("display", "none");
			$('#circLabel2').css("display", "block");
			
			document.getElementById('two').style.display = "list-item";
			document.getElementById('three').style.display = "list-item";
			document.getElementById('four').style.display = "list-item";
			document.getElementById('five').style.display = "list-item";
			document.getElementById('six').style.display = "list-item";
			document.getElementById('seven').style.display = "list-item";
			
			document.getElementById('one').innerHTML = "WiMAX and LTE secure signaling";
			document.getElementById('two').innerHTML = "Encryption: AES 128-bit and 256-bit, 3DES";
			document.getElementById('three').innerHTML = "Firewall: ALC, MAC";
			document.getElementById('four').innerHTML = "Authentication: RADIUS, TACACS+, 802.1x";
			document.getElementById('five').innerHTML = "Cryptology: SHA-1, MD5, RSA";
			document.getElementById('six').innerHTML = "VPN: IPsec, SSL";
			document.getElementById('seven').innerHTML = "FIPS 197";
			document.getElementById('circSub').innerHTML = "SECURITY";
			});
	
		document.getElementById("mid").addEventListener("click", function() {
			$("#circLabel").css("display", "none");
			$(".circLabel").css("display", "none");
			$("#circText").css("display", "none");
			$('#circLabel2').css("display", "block");
			
			document.getElementById('two').style.display = "list-item";
			document.getElementById('three').style.display = "list-item";
			document.getElementById('four').style.display = "list-item";
			document.getElementById('five').style.display = "list-item";
			document.getElementById('six').style.display = "list-item";
			
			document.getElementById('one').innerHTML = "RS-232/485 serial interfaces to support DNP3, MODBUS, and IEC 61850";
			document.getElementById('two').innerHTML = "USB and Ethernet (w/PoE) with IPV4/IPV6 Translation for seamless integration with IoT standards";
			document.getElementById('three').innerHTML = "General Purpose Digital I/O";
			document.getElementById('four').innerHTML = "Digital 9-Axis Accelerometer/Magnetometer";
			document.getElementById('five').innerHTML = "Voltage and Temperature Monitor";
			document.getElementById('six').innerHTML = "GPS";
			document.getElementById('seven').style.display = "none";
			document.getElementById('circSub').innerHTML = "INTERFACES";
			});
	
		document.getElementById("bot").addEventListener("click", function() {
			$("#circLabel").css("display", "none");
			$(".circLabel").css("display", "none");
			$("#circText").css("display", "none");
			$('#circLabel2').css("display", "block");
			document.getElementById('one').innerHTML = "Embedded Private LTE and WiMAX module";
			document.getElementById('two').style.display = "none";
			document.getElementById('three').style.display = "none";
			document.getElementById('four').style.display = "none";
			document.getElementById('five').style.display = "none";
			document.getElementById('six').style.display = "none";
			document.getElementById('seven').style.display = "none";
			document.getElementById('circSub').innerHTML = "WAN";

			});
		document.getElementById("backBut").addEventListener("click", function() {
			$("#circLabel2").css("display", "none");
			$("#circLabel").css("display", "block");
			$("#circText").css("display", "block");
			$(".circLabel").css("display", "inline");
		});
		
		// build axis
		projector = new THREE.Projector();
		mouseVector = new THREE.Vector3();
	
		// cast a ray
		raycaster = new THREE.Raycaster();
		animate();
	
}
	/**
	* name: tweenIn()
	* This function handles the explosion of the model from its
	* collapsed, rotatable view to the exploded, labled view
	*/
	function tweenIn() {
	
		// SET UP THE POSITIONS AND ROTATIONS
		position = {x : xchange, y : ychange, z: zchange};
		target = {x : newPosx[0], y : newPosy[0], z : newPosz[0]};
		rotation = {x:xrotate, y:yrotate, z:zrotate};
		targetRot = {x : newRotx[0], y : newRoty[0], z : newRotz[0]};
		
		position1 = {x : xchange, y : ychange, z: zchange};
		target1 = {x : newPosx[1], y : newPosy[1], z : newPosz[1]};
		rotation1 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot1 = {x : newRotx[1], y : newRoty[1],z : newRotz[1]};
		
		position2 = {x : xchange, y : ychange, z: zchange};
		target2 = {x : newPosx[2], y : newPosy[2], z : newPosz[2]};
		rotation2 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot2 = {x : newRotx[2], y : newRoty[2],z : newRotz[2]};
		
		position3 = {x : xchange, y : ychange, z: zchange};
		target3 = {x : newPosx[3], y : newPosy[3], z : newPosz[3]};
		rotation3 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot3 = {x : newRotx[3], y : newRoty[3],z : newRotz[3]};
		
		position4 = {x : xchange, y : ychange, z: zchange};
		target4 = {x : newPosx[4], y : newPosy[4], z : newPosz[4]};
		rotation4 ={x:xrotate, y:yrotate, z:zrotate};
		targetRot4 = {x : newRotx[4], y : newRoty[4],z : newRotz[4]};
		
		position5 = {x : xchange, y : ychange, z: zchange};
		target5 = {x : newPosx[5], y : newPosy[5], z : newPosz[5]};
		rotation5 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot5 = {x : newRotx[5], y : newRoty[5],z : newRotz[5]};
		
		position6 = {x : xchange, y : ychange, z: zchange};
		target6 = {x : newPosx[6], y : newPosy[6], z : newPosz[6]};
		rotation6 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot6 = {x : newRotx[6], y : newRoty[6],z : newRotz[6]};
		
		position7 = {x : xchange, y : ychange, z: zchange};
		target7 = {x : newPosx[7], y : newPosy[7], z : newPosz[7]};
		rotation7 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot7 = {x : newRotx[7], y : newRoty[7],z : newRotz[7]};
		
		position8 = {x : xchange, y : ychange, z: zchange};
		target8 = {x : newPosx[8], y : newPosy[8], z : newPosz[8]};
		rotation8 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot8 = {x : newRotx[8], y : newRoty[8],z : newRotz[8]};
		
		position9 = {x : xchange, y : ychange, z: zchange};
		target9 = {x : newPosx[9], y : newPosy[9], z : newPosz[9]};
		rotation9 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot9 = {x : newRotx[9], y : newRoty[9],z : newRotz[9]};
		
		position10 = {x : xchange, y : ychange, z: zchange};
		target10 = {x : newPosx[10], y : newPosy[10], z : newPosz[10]};
		rotation10 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot10 = {x : newRotx[10], y : newRoty[10],z : newRotz[10]};
		
		position11 = {x : xchange, y : ychange, z: zchange};
		target11 = {x : newPosx[11], y : newPosy[11], z : newPosz[11]};
		rotation11 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot11 = {x : newRotx[11], y : newRoty[11],z : newRotz[11]};
		
		position12 = {x : xchange, y : ychange, z: zchange};
		target12 = {x : newPosx[12], y : newPosy[12], z : newPosz[12]};
		rotation12 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot12 = {x : newRotx[12], y : newRoty[12],z : newRotz[12]};
		
		// CREATE THE POSITION TWEENS
		var tween0 = new TWEEN.Tween(position).to(target, 1000);
		var tween1 = new TWEEN.Tween(position1).to(target1, 1000);
		var tween2 = new TWEEN.Tween(position2).to(target2, 1000);
		var tween3 = new TWEEN.Tween(position3).to(target3, 1000);
		var tween4 = new TWEEN.Tween(position4).to(target4, 1000);
		var tween5 = new TWEEN.Tween(position5).to(target5, 1000);
		var tween6 = new TWEEN.Tween(position6).to(target6, 1000);
		var tween7 = new TWEEN.Tween(position7).to(target7, 1000);
		var tween8 = new TWEEN.Tween(position8).to(target8, 1000);
		var tween9 = new TWEEN.Tween(position9).to(target9, 1000);
		var tween10 = new TWEEN.Tween(position10).to(target10, 1000);
		var tween11 = new TWEEN.Tween(position11).to(target11, 1000);
		var tween12 = new TWEEN.Tween(position12).to(target12, 1000);

		// CREATE THE ROTATION TWEENS
		var tweenRot0 = new TWEEN.Tween(rotation).to(targetRot, 1000);
		var tweenRot1 = new TWEEN.Tween(rotation1).to(targetRot1, 1000);
		var tweenRot2 = new TWEEN.Tween(rotation2).to(targetRot2, 1000);
		var tweenRot3 = new TWEEN.Tween(rotation3).to(targetRot3, 1000);
		var tweenRot4 = new TWEEN.Tween(rotation4).to(targetRot4, 1000);
		var tweenRot5 = new TWEEN.Tween(rotation5).to(targetRot5, 1000);
		var tweenRot6 = new TWEEN.Tween(rotation6).to(targetRot6, 1000);
		var tweenRot7 = new TWEEN.Tween(rotation7).to(targetRot7, 1000);
		var tweenRot8 = new TWEEN.Tween(rotation8).to(targetRot8, 1000);
		var tweenRot9 = new TWEEN.Tween(rotation9).to(targetRot9, 1000);
		var tweenRot10 = new TWEEN.Tween(rotation10).to(targetRot10, 1000);
		var tweenRot11 = new TWEEN.Tween(rotation11).to(targetRot11, 1000);
		var tweenRot12 = new TWEEN.Tween(rotation12).to(targetRot12, 1000);


		// POSITION UPDATE
		tween0.onUpdate(function() {
			calcScale(newCircScale);
			objects[0].position.x = position.x;
			objects[0].position.y = position.y;
			objects[0].position.z = position.z;
		});
		tween1.onUpdate(function() {
			objects[1].position.x = position1.x;
			objects[1].position.y = position1.y;
			objects[1].position.z = position1.z;
		});
		tween2.onUpdate(function() {
			objects[2].position.x = position2.x;
			objects[2].position.y = position2.y;
			objects[2].position.z = position2.z;
		});
		tween3.onUpdate(function() {
			objects[3].position.x = position3.x;
			objects[3].position.y = position3.y;
			objects[3].position.z = position3.z;
		});
		tween4.onUpdate(function() {
			objects[4].position.x = position4.x;
			objects[4].position.y = position4.y;
			objects[4].position.z = position4.z;
		});
		tween5.onUpdate(function() {
			objects[5].position.x = position5.x;
			objects[5].position.y = position5.y;
			objects[5].position.z = position5.z;
		});
		tween6.onUpdate(function() {
			objects[6].position.x = position6.x;
			objects[6].position.y = position6.y;
			objects[6].position.z = position6.z;
		});
		tween7.onUpdate(function() {
			objects[7].position.x = position7.x;
			objects[7].position.y = position7.y;
			objects[7].position.z = position7.z;
		});
		tween8.onUpdate(function() {
			objects[8].position.x = position8.x;
			objects[8].position.y = position8.y;
			objects[8].position.z = position8.z;
		});
		tween9.onUpdate(function() {
			objects[9].position.x = position9.x;
			objects[9].position.y = position9.y;
			objects[9].position.z = position9.z;
		});
		tween10.onUpdate(function() {
			objects[10].position.x = position10.x;
			objects[10].position.y = position10.y;
			objects[10].position.z = position10.z;
		});
		tween11.onUpdate(function() {
			objects[11].position.x = position11.x;
			objects[11].position.y = position11.y;
			objects[11].position.z = position11.z;
		});
		tween12.onUpdate(function() {
			objects[12].position.x = position12.x;
			objects[12].position.y = position12.y;
			objects[12].position.z = position12.z;
		});
		
		
		// ROTATION UPDATE
		tweenRot0.onUpdate(function() {
			objects[0].rotation.x = rotation.x;
			objects[0].rotation.y = rotation.y;
			objects[0].rotation.z = rotation.z;
		});
		tweenRot1.onUpdate(function() {
			objects[1].rotation.x = rotation1.x;
			objects[1].rotation.y = rotation1.y;
			objects[1].rotation.z = rotation1.z;
		});
		tweenRot2.onUpdate(function() {
			objects[2].rotation.x = rotation2.x;
			objects[2].rotation.y = rotation2.y;
			objects[2].rotation.z = rotation2.z;
		});
		tweenRot3.onUpdate(function() {
			objects[3].rotation.x = rotation3.x;
			objects[3].rotation.y = rotation3.y;
			objects[3].rotation.z = rotation3.z;
		});
		tweenRot4.onUpdate(function() {
			objects[4].rotation.x = rotation4.x;
			objects[4].rotation.y = rotation4.y;
			objects[4].rotation.z = rotation4.z;
		});
		tweenRot5.onUpdate(function() {
			objects[5].rotation.x = rotation5.x;
			objects[5].rotation.y = rotation5.y;
			objects[5].rotation.z = rotation5.z;
		});
		tweenRot6.onUpdate(function() {
			objects[6].rotation.x = rotation6.x;
			objects[6].rotation.y = rotation6.y;
			objects[6].rotation.z = rotation6.z;
		});
		tweenRot7.onUpdate(function() {
			objects[7].rotation.x = rotation7.x;
			objects[7].rotation.y = rotation7.y;
			objects[7].rotation.z = rotation7.z;
		});
		tweenRot8.onUpdate(function() {
			objects[8].rotation.x = rotation8.x;
			objects[8].rotation.y = rotation8.y;
			objects[8].rotation.z = rotation8.z;
		});
		tweenRot9.onUpdate(function() {
			objects[9].rotation.x = rotation9.x;
			objects[9].rotation.y = rotation9.y;
			objects[9].rotation.z = rotation9.z;
		});
		tweenRot10.onUpdate(function() {
			objects[10].rotation.x = rotation10.x;
			objects[10].rotation.y = rotation10.y;
			objects[10].rotation.z = rotation10.z;
		});
		tweenRot11.onUpdate(function() {
			objects[11].rotation.x = rotation11.x;
			objects[11].rotation.y = rotation11.y;
			objects[11].rotation.z = rotation11.z;
		});
		tweenRot12.onUpdate(function() {
			objects[12].rotation.x = rotation12.x;
			objects[12].rotation.y = rotation12.y;
			objects[12].rotation.z = rotation12.z;
		});
		
		
		// when everything is moved, bring up labels
		tween3.onComplete(function() {
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			
			$('#antennaeline2').css("display", "block");
			
			// make sure dummies are there
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;
		});
		
		// easing for position
		tween0.easing(TWEEN.Easing.Cubic.InOut);
		tween1.easing(TWEEN.Easing.Cubic.InOut);
		tween2.easing(TWEEN.Easing.Cubic.InOut);
		tween3.easing(TWEEN.Easing.Cubic.InOut);
		tween4.easing(TWEEN.Easing.Cubic.InOut);
		tween5.easing(TWEEN.Easing.Cubic.InOut);
		tween6.easing(TWEEN.Easing.Cubic.InOut);
		tween7.easing(TWEEN.Easing.Cubic.InOut);
		tween8.easing(TWEEN.Easing.Cubic.InOut);
		tween9.easing(TWEEN.Easing.Cubic.InOut);
		tween10.easing(TWEEN.Easing.Cubic.InOut);
		tween11.easing(TWEEN.Easing.Cubic.InOut);
		tween12.easing(TWEEN.Easing.Cubic.InOut);
		
		
		// easing for rotation
		tweenRot0.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot1.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot2.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot3.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot4.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot5.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot6.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot7.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot8.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot9.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot10.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot11.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot12.easing(TWEEN.Easing.Cubic.InOut);
		
		
		// start position change
		tween0.start();
		tween1.start();
		tween2.start();
		tween3.start();
		tween4.start();
		tween5.start();
		tween6.start();
		tween7.start();
		tween8.start();
		tween9.start();
		tween10.start();
		tween11.start();
		tween12.start();

		// start rotation
		tweenRot0.start();
		tweenRot1.start();
		tweenRot2.start();
		tweenRot3.start();
		tweenRot4.start();
		tweenRot5.start();
		tweenRot6.start();
		tweenRot7.start();
		tweenRot8.start();
		tweenRot9.start();
		tweenRot10.start();
		tweenRot11.start();
		tweenRot12.start();

	}
	
	/**
	* name: tweenOut()
	* This function handles the collapse of the model
	* from the static labled exploded view back into
	* the rotatable collapsed view
	*/
	function tweenOut() {
		// SET UP THE POSITIONS AND ROTATIONS
		position = {x : xchange, y : ychange, z: zchange};
		target = {x : newPosx[0], y : newPosy[0], z : newPosz[0]};
		rotation = {x:xrotate, y:yrotate, z:zrotate};
		targetRot = {x : newRotx[0], y : newRoty[0], z : newRotz[0]};
		
		position1 = {x : xchange, y : ychange, z: zchange};
		target1 = {x : newPosx[1], y : newPosy[1], z : newPosz[1]};
		rotation1 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot1 = {x : newRotx[1], y : newRoty[1],z : newRotz[1]};
		
		position2 = {x : xchange, y : ychange, z: zchange};
		target2 = {x : newPosx[2], y : newPosy[2], z : newPosz[2]};
		rotation2 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot2 = {x : newRotx[2], y : newRoty[2],z : newRotz[2]};
		
		position3 = {x : xchange, y : ychange, z: zchange};
		target3 = {x : newPosx[3], y : newPosy[3], z : newPosz[3]};
		rotation3 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot3 = {x : newRotx[3], y : newRoty[3],z : newRotz[3]};
		
		position4 = {x : xchange, y : ychange, z: zchange};
		target4 = {x : newPosx[4], y : newPosy[4], z : newPosz[4]};
		rotation4 ={x:xrotate, y:yrotate, z:zrotate};
		targetRot4 = {x : newRotx[4], y : newRoty[4],z : newRotz[4]};
		
		position5 = {x : xchange, y : ychange, z: zchange};
		target5 = {x : newPosx[5], y : newPosy[5], z : newPosz[5]};
		rotation5 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot5 = {x : newRotx[5], y : newRoty[5],z : newRotz[5]};
		
		position6 = {x : xchange, y : ychange, z: zchange};
		target6 = {x : newPosx[6], y : newPosy[6], z : newPosz[6]};
		rotation6 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot6 = {x : newRotx[6], y : newRoty[6],z : newRotz[6]};
		
		position7 = {x : xchange, y : ychange, z: zchange};
		target7 = {x : newPosx[7], y : newPosy[7], z : newPosz[7]};
		rotation7 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot7 = {x : newRotx[7], y : newRoty[7],z : newRotz[7]};
		
		position8 = {x : xchange, y : ychange, z: zchange};
		target8 = {x : newPosx[8], y : newPosy[8], z : newPosz[8]};
		rotation8 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot8 = {x : newRotx[8], y : newRoty[8],z : newRotz[8]};
		
		position9 = {x : xchange, y : ychange, z: zchange};
		target9 = {x : newPosx[9], y : newPosy[9], z : newPosz[9]};
		rotation9 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot9 = {x : newRotx[9], y : newRoty[9],z : newRotz[9]};
		
		position10 = {x : xchange, y : ychange, z: zchange};
		target10 = {x : newPosx[10], y : newPosy[10], z : newPosz[10]};
		rotation10 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot10 = {x : newRotx[10], y : newRoty[10],z : newRotz[10]};
		
		position11 = {x : xchange, y : ychange, z: zchange};
		target11 = {x : newPosx[11], y : newPosy[11], z : newPosz[11]};
		rotation11 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot11 = {x : newRotx[11], y : newRoty[11],z : newRotz[11]};
		
		position12 = {x : xchange, y : ychange, z: zchange};
		target12 = {x : newPosx[12], y : newPosy[12], z : newPosz[12]};
		rotation12 = {x:xrotate, y:yrotate, z:zrotate};
		targetRot12 = {x : newRotx[12], y : newRoty[12],z : newRotz[12]};
		
		// CREATE THE POSITION TWEENS
		var tween0 = new TWEEN.Tween(target).to(position, 1000);
		var tween1 = new TWEEN.Tween(target1).to(position1, 1000);
		var tween2 = new TWEEN.Tween(target2).to(position2, 1000);
		var tween3 = new TWEEN.Tween(target3).to(position3, 1000);
		var tween4 = new TWEEN.Tween(target4).to(position4, 1000);
		var tween5 = new TWEEN.Tween(target5).to(position5, 1000);
		var tween6 = new TWEEN.Tween(target6).to(position6, 1000);
		var tween7 = new TWEEN.Tween(target7).to(position7, 1000);
		var tween8 = new TWEEN.Tween(target8).to(position8, 1000);
		var tween9 = new TWEEN.Tween(target9).to(position9, 1000);
		var tween10 = new TWEEN.Tween(target10).to(position10, 1000);
		var tween11 = new TWEEN.Tween(target11).to(position11, 1000);
		var tween12 = new TWEEN.Tween(target12).to(position12, 1000);

		// CREATE THE ROTATION TWEENS
		var tweenRot0 = new TWEEN.Tween(targetRot).to(rotation, 1000);
		var tweenRot1 = new TWEEN.Tween(targetRot1).to(rotation1, 1000);
		var tweenRot2 = new TWEEN.Tween(targetRot2).to(rotation2, 1000);
		var tweenRot3 = new TWEEN.Tween(targetRot3).to(rotation3, 1000);
		var tweenRot4 = new TWEEN.Tween(targetRot4).to(rotation4, 1000);
		var tweenRot5 = new TWEEN.Tween(targetRot5).to(rotation5, 1000);
		var tweenRot6 = new TWEEN.Tween(targetRot6).to(rotation6, 1000);
		var tweenRot7 = new TWEEN.Tween(targetRot7).to(rotation7, 1000);
		var tweenRot8 = new TWEEN.Tween(targetRot8).to(rotation8, 1000);
		var tweenRot9 = new TWEEN.Tween(targetRot9).to(rotation9, 1000);
		var tweenRot10 = new TWEEN.Tween(targetRot10).to(rotation10, 1000);
		var tweenRot11 = new TWEEN.Tween(targetRot11).to(rotation11, 1000);
		var tweenRot12 = new TWEEN.Tween(targetRot12).to(rotation12, 1000);


		// POSITION UPDATE
		tween0.onUpdate(function() {
			calcScale(circScale);
			objects[0].position.x = target.x;
			objects[0].position.y = target.y;
			objects[0].position.z = target.z;
		});
		tween1.onUpdate(function() {
			objects[1].position.x = target1.x;
			objects[1].position.y = target1.y;
			objects[1].position.z = target1.z;
		});
		tween2.onUpdate(function() {
			objects[2].position.x = target2.x;
			objects[2].position.y = target2.y;
			objects[2].position.z = target2.z;
		});
		tween3.onUpdate(function() {
			objects[3].position.x = target3.x;
			objects[3].position.y = target3.y;
			objects[3].position.z = target3.z;
		});
		tween4.onUpdate(function() {
			objects[4].position.x = target4.x;
			objects[4].position.y = target4.y;
			objects[4].position.z = target4.z;
		});
		tween5.onUpdate(function() {
			objects[5].position.x = target5.x;
			objects[5].position.y = target5.y;
			objects[5].position.z = target5.z;
		});
		tween6.onUpdate(function() {
			objects[6].position.x = target6.x;
			objects[6].position.y = target6.y;
			objects[6].position.z = target6.z;
		});
		tween7.onUpdate(function() {
			objects[7].position.x = target7.x;
			objects[7].position.y = target7.y;
			objects[7].position.z = target7.z;
		});
		tween8.onUpdate(function() {
			objects[8].position.x = target8.x;
			objects[8].position.y = target8.y;
			objects[8].position.z = target8.z;
		});
		tween9.onUpdate(function() {
			objects[9].position.x = target9.x;
			objects[9].position.y = target9.y;
			objects[9].position.z = target9.z;
		});
		tween10.onUpdate(function() {
			objects[10].position.x = target10.x;
			objects[10].position.y = target10.y;
			objects[10].position.z = target10.z;
		});
		tween11.onUpdate(function() {
			objects[11].position.x = target11.x;
			objects[11].position.y = target11.y;
			objects[11].position.z = target11.z;
		});
		tween12.onUpdate(function() {
			objects[12].position.x = target12.x;
			objects[12].position.y = target12.y;
			objects[12].position.z = target12.z;
		});	
		
		// ROTATION UPDATE
		tweenRot0.onUpdate(function() {
			objects[0].rotation.x = targetRot.x;
			objects[0].rotation.y = targetRot.y;
			objects[0].rotation.z = targetRot.z;
		});
		tweenRot1.onUpdate(function() {
			objects[1].rotation.x = targetRot1.x;
			objects[1].rotation.y = targetRot1.y;
			objects[1].rotation.z = targetRot1.z;
		});
		tweenRot2.onUpdate(function() {
			objects[2].rotation.x = targetRot2.x;
			objects[2].rotation.y = targetRot2.y;
			objects[2].rotation.z = targetRot2.z;
		});
		tweenRot3.onUpdate(function() {
			objects[3].rotation.x = targetRot3.x;
			objects[3].rotation.y = targetRot3.y;
			objects[3].rotation.z = targetRot3.z;
		});
		tweenRot4.onUpdate(function() {
			objects[4].rotation.x = targetRot4.x;
			objects[4].rotation.y = targetRot4.y;
			objects[4].rotation.z = targetRot4.z;
		});
		tweenRot5.onUpdate(function() {
			objects[5].rotation.x = targetRot5.x;
			objects[5].rotation.y = targetRot5.y;
			objects[5].rotation.z = targetRot5.z;
		});
		tweenRot6.onUpdate(function() {
			objects[6].rotation.x = targetRot6.x;
			objects[6].rotation.y = targetRot6.y;
			objects[6].rotation.z = targetRot6.z;
		});
		tweenRot7.onUpdate(function() {
			objects[7].rotation.x = targetRot7.x;
			objects[7].rotation.y = targetRot7.y;
			objects[7].rotation.z = targetRot7.z;
		});
		tweenRot8.onUpdate(function() {
			objects[8].rotation.x = targetRot8.x;
			objects[8].rotation.y = targetRot8.y;
			objects[8].rotation.z = targetRot8.z;
		});
		tweenRot9.onUpdate(function() {
			objects[9].rotation.x = targetRot9.x;
			objects[9].rotation.y = targetRot9.y;
			objects[9].rotation.z = targetRot9.z;
		});
		tweenRot10.onUpdate(function() {
			objects[10].rotation.x = targetRot10.x;
			objects[10].rotation.y = targetRot10.y;
			objects[10].rotation.z = targetRot10.z;
		});
		tweenRot11.onUpdate(function() {
			objects[11].rotation.x = targetRot11.x;
			objects[11].rotation.y = targetRot11.y;
			objects[11].rotation.z = targetRot11.z;
		});
		tweenRot12.onUpdate(function() {
			objects[12].rotation.x = targetRot12.x;
			objects[12].rotation.y = targetRot12.y;
			objects[12].rotation.z = targetRot12.z;
		});
		
		// when the tween starts, take away the labels
		tween0.onStart(function() {
			$('p#shell').css("display", "none");
			$('#shellline').css("display", "none");

			$('p#battery').css("display", "none");
			$('#battline').css("display", "none");

			$('p#elec').css("display", "none");
			$('#electricline').css("display", "none");

			$('p#circuit').css("display", "none");
			$('#circuitline').css("display", "none");

			$('p#antennae').css("display", "none");
			$('#antennaeline').css("display", "none");
			
			$('#antennaeline2').css("display", "none");
			
			// make the dummy objects invisible (unclickable)
			rect.visible = false;
			batRect.visible = false;
			elecRect.visible = false;
			antennaeRect.visible = false;
			shellRect.visible = false;
			moduleRect.visible = false;
		});		
		// easing for position
		tween0.easing(TWEEN.Easing.Cubic.InOut);
		tween1.easing(TWEEN.Easing.Cubic.InOut);
		tween2.easing(TWEEN.Easing.Cubic.InOut);
		tween3.easing(TWEEN.Easing.Cubic.InOut);
		tween4.easing(TWEEN.Easing.Cubic.InOut);
		tween5.easing(TWEEN.Easing.Cubic.InOut);
		tween6.easing(TWEEN.Easing.Cubic.InOut);
		tween7.easing(TWEEN.Easing.Cubic.InOut);
		tween8.easing(TWEEN.Easing.Cubic.InOut);
		tween9.easing(TWEEN.Easing.Cubic.InOut);
		tween10.easing(TWEEN.Easing.Cubic.InOut);
		tween11.easing(TWEEN.Easing.Cubic.InOut);
		tween12.easing(TWEEN.Easing.Cubic.InOut);
		
		// easing for rotation
		tweenRot0.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot1.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot2.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot3.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot4.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot5.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot6.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot7.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot8.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot9.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot10.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot11.easing(TWEEN.Easing.Cubic.InOut);
		tweenRot12.easing(TWEEN.Easing.Cubic.InOut);
		
		// start position change
		tween0.start();
		tween1.start();
		tween2.start();
		tween3.start();
		tween4.start();
		tween5.start();
		tween6.start();
		tween7.start();
		tween8.start();
		tween9.start();
		tween10.start();
		tween11.start();
		tween12.start();

		// start rotation
		tweenRot0.start();
		tweenRot1.start();
		tweenRot2.start();
		tweenRot3.start();
		tweenRot4.start();
		tweenRot5.start();
		tweenRot6.start();
		tweenRot7.start();
		tweenRot8.start();
		tweenRot9.start();
		tweenRot10.start();
		tweenRot11.start();
		tweenRot12.start();
		
	}
	
	/**
	* onDocumentMouseMove (event)
	* Purpose: when a mouse moves, this function is called.
	* it calculates the mouse vector so we can later calculate
	* if it has hit an object or not, and notes that it wasn't clicked
	*/
	function onDocumentMouseMove( event ) {
		event.preventDefault();
		// translate our mouse coordinates
		mouseVector.x = 2 * (event.clientX / window.innerWidth) -1;
		mouseVector.y = 1-2 * (event.clientY/window.innerHeight );	
		click = 0;
	}

	/**
	* onDocumentMouseClick(event)
	* Purpose: when a mouse clicks, we calculate if the mouse
	* has hit a 3d object or not, and if it has then we 
	* record that a click has been made
	*/
	function onDocumentMouseClick( event ) {
		event.preventDefault();
		// translate our mouse coordinates
		mouseVector.x = 2 * (event.clientX / window.innerWidth) -1;
		mouseVector.y = 1-2 * (event.clientY/window.innerHeight );	
		click = 1;
	}

	/**
	* name: render
	*
	* This function is called by the animation each time a new
	* animation frame is requested. It renders out the whole scene.
	* It updates all tweens so if they are doing anything funky then
	* they go. It also calculates if the mouse has moved or clicked and
	* if so, did it click an object? if it did, it calls the appropriate 
	* functions.
	*/
	function render() {
			// update tween
			TWEEN.update();
			// The select objects stuff
			raycaster.setFromCamera( mouseVector, camera);
			var intersects = raycaster.intersectObjects( scene.children );
			// if the mouse has intersected with an object
			if (intersects.length > 0) {
				for ( var i = 0; i < intersects.length; i++) {
					// if the object name is not null and the mouse was clicked and we are not already in detail view
					// then we see which object was clicked and pull it into detail
					if (intersects[i].object.name !== null && click===1 && detail === 0) {
						if (intersects[i].object.name === "circuitRect") {
								circuitTween();
								hideObjects("circuit");
						} else if (intersects[i].object.name === "batRect") {
								batteryTween();
								hideObjects("battery");
						} else if (intersects[i].object.name === "elecRect") {
								electricTween();
								hideObjects("electric");
						} else if (intersects[i].object.name === "shellRect") {
								shellTween();
								hideObjects("shell");
						} else if (intersects[i].object.name === "antennaeRect") {
								antennaeTween();
								hideObjects("antennae");
						}  else if (intersects[i].object.name === "moduleRect") {
								moduleTween();
								hideObjects("module");
						}
					}
				}
			}
		// click returns to 0
		click = 0;
		// finally, render the scene
		renderer.render( scene, camera );
	}
	
	/**
	* name: hideObjects
	* @peram: objName - the name of the object that was clicked
	* This function hides all the objects except the clicked 
	* object, and the labels and such. It also attaches the 
	* clicked object to the pivot so it can animate all. Finally,
	* it sets up the rotational capabilities.
	*/
	function hideObjects(objName) {
		
		// see if the mouse is dragging
		window.addEventListener('mousedown', function() {
			isDragging = true;
		},false);
		
		// loop through objects, if they are not the selected
		// object then hide them
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].name !== objName) {
				objects[i].visible = false;
			}
		}
		// set the pivot to zero
		pivot.rotation.x = 0;
		pivot.rotation.y = 0;
		pivot.rotation.z = 0;
		
		// if the object is the shell, we have to also add the cap and gasket to the pivot
        if (objName == "shell") {
            scene.getObjectByName("cap").visible = true;
			scene.getObjectByName("gasket").visible = true;
			// attach the cap
			THREE.SceneUtils.attach( scene.getObjectByName("cap"), scene, pivot );
			// now for the gasket
			THREE.SceneUtils.attach( scene.getObjectByName("gasket"), scene, pivot );
        }
		// set the current object
        currObj = scene.getObjectByName(objName);
		// attach the current object to the pivot
		THREE.SceneUtils.attach( scene.getObjectByName(objName), scene, pivot );
		// remove dummy objects
		removeObjects();
		
		 // hide all of the labels
		$('#selectObj').css("visibility", "hidden");
		$('#closeDetail').css("display", "block");
		$('p#shell').css("display", "none");
		$('#shellline').css("display", "none");

		$('p#battery').css("display", "none");
		$('#battline').css("display", "none");

		$('p#elec').css("display", "none");
		$('#electricline').css("display", "none");

		$('p#circuit').css("display", "none");
		$('#circuitline').css("display", "none");

		$('p#antennae').css("display", "none");
		$('#antennaeline').css("display", "none");
		$('#antennaeline2').css("display", "none");
		
		// here we do all the stuff to allow rotating the object on the pivot
		//remember old mouse position
		var previousMousePosition = {
			x: 0,
			y: 0
		};
		// do when the mouse moves
		$(renderer.domElement).on('mousemove', function(e) {
			// calculate how much its moved
			var deltaMove = {
				x: e.offsetX-previousMousePosition.x,
				y: e.offsetY-previousMousePosition.y
			};
			
			// if its dragging, then we hide the lines (circuit only)
			if(isDragging) {
				$("#topline").css("display", "none");
				$("#midline").css("display", "none");
				$("#botline").css("display", "none");
				// set the new rotation of the pivot depending on
				// how the mouse moved
				deltaRotationQuaternion = new THREE.Quaternion()
					.setFromEuler(new THREE.Euler(
						round(toRadians(deltaMove.y * 1),2),
						round(toRadians(deltaMove.x * 1),2),
						0,
						'XYZ'
					));
				// set the new rotation to the pivot
				origQuat = pivot.quaternion.clone();
				pivot.quaternion.multiplyQuaternions(deltaRotationQuaternion, pivot.quaternion);

			}
			// record the previous mouse position
			previousMousePosition = {
				x: e.offsetX,
				y: e.offsetY
			};
		});
		// if we lift the mouse, no longer dragging
		$(document).on('mouseup', function(e) {
			isDragging = false;
		});
	}
	/**
	* name: toRadians
	* @peram: the angle you want to convert to radians
	* @return: the angle converted to radians
	*/
	function toRadians(angle) {
		return angle * (Math.PI / 180);
	}

	/**
	* name: detailOut()
	* This function handles what to do when we leave the detailed view
	* It detaches the object from the pivot, changes the state, brings back
	* dummy objects, and closes all detail labels
	*/
	function detailOut() {

		// detach current object
		THREE.SceneUtils.detach(currObj, pivot, scene);
		
		// if the obj was shell, then we have to detach the cap and gasket too
		if (currObj.name == "shell") {
			THREE.SceneUtils.detach(pivot.getObjectByName("cap"), pivot, scene);
			// now for the gasket
			THREE.SceneUtils.detach(pivot.getObjectByName("gasket"), pivot, scene);
		}
		// set the current object to null
		currObj = null;
		// state goes back to 1 (exploded view)
		state = 1;
		
		// bring or dummy objects back
		rect.visible = true;
		batRect.visible = true;
		elecRect.visible = true;
		antennaeRect.visible = true;
		shellRect.visible = true;
		moduleRect.visible = true;
		
		// reset detail to 0 (since we are not in detail)
		detail = 0;
		
		// close all the labels
		batLabelClose();
		shellLabelClose();
		elecLabelClose();
		antenLabelClose();
		modLabelClose();
		
		// hide the close detail button
		$('#closeDetail').css("display", "none");
		
		// make sure constrols are not enabled
        controls.enabled = false;
		
		// make all of the objects visible
		for (var i = 0; i < objects.length; i++) {
			objects[i].visible = true;
		}
		// make instructions visible
		document.getElementById("selectObj").style.visibility = "visible";
	}
		
	/**
	* name: addLights
	* This function just adds all the lights to the scene.
	* Pretty basic!
	*/
	function addLights() {                                                                                                                                               
        // I didn't like the ambient light, so its not added
		var amblight = new THREE.AmbientLight(0x404040,1);
		//scene.add(amblight);
       
        // The main light ( light )
		var mainLight = new THREE.PointLight(0xffffff, 0.3, 0, 2);
		mainLight.position.set(1900,0,40);
		scene.add(mainLight);
		
		// the opposite to the main
		var mainLight2 = new THREE.PointLight(0xffffff, 0.6, 0, 2);
		mainLight2.position.set(-1900,0,40);
		scene.add(mainLight2);
        
        // a side light ( light 2 )
		var upperSideLight = new THREE.PointLight(0xfdf7ee, 0.7,0,2);
		upperSideLight.position.set(40,1900,0);
		scene.add(upperSideLight);
		
		// a side light ( light 2 )
		var upperSideLight2 = new THREE.PointLight(0xffffff, 0.5,0,2);
		upperSideLight2.position.set(40,-1900,0);
		scene.add(upperSideLight2);
        
        // a second side light ( light 3 ) 
		var lowerSideLight = new THREE.PointLight(0xfdf7ee, 0.4, 0, 2);
		lowerSideLight.position.set(40,0,1900);
		scene.add(lowerSideLight);
		
		// a second side light ( light 3 ) 
		var lowerSideLight2 = new THREE.PointLight(0xffffff, 0.5, 0, 2);
		lowerSideLight2.position.set(40,0,-1900);
		scene.add(lowerSideLight2);
	}
	
	/**
	* name: addSceneElements()
	* This function adds ALL of the scene elements 
	* (except for the dummy objects)
	* It also adds them to an array and sets up their 
	* future exploded positions
	*/
	function addSceneElements() {	
		// set up the arrays for objects and 
		// their future positions and rotations
		objects = [];
		origPos = {xchange, ychange, zchange};
		newPosx = [];
		newPosy = [];
		newPosz = [];
		
		newRotx = [];
		newRoty = [];
		newRotz = [];
		
		// create the white material for the sphere
		whiteMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x555555, shininess: 0 } );
		
		// create the giant sphere that gives the white background
		sphere = new THREE.Mesh(new THREE.SphereGeometry(750,100,100), whiteMat);
		sphere.position.set(0,100,0);
        sphere.material.side = THREE.DoubleSide;
        sphere.name = "sphere";
		scene.add(sphere);
		
		// this variable checks if all objects have loaded
		// once it equals 13, we call init2
		var check = 0;
		
		// add the pivot to the scene (for detail objects)
		scene.add(pivot);
		
		// create the loading manager for the loaders
		var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {
					//console.log( item, loaded, total );
				};
				// our two textures 
				var texture = new THREE.Texture();
				var texture2 = new THREE.Texture();
				var onProgress = function ( xhr ) {
					if ( xhr.lengthComputable ) {
						var percentComplete = xhr.loaded / xhr.total * 100;
						//console.log( Math.round(percentComplete, 2) + '% downloaded' );
					}
				};
				var onError = function ( xhr ) {
				};
		// load the white texture for the main model
		loader = new THREE.ImageLoader( manager );
				loader.load( 'mat/white.jpg', function ( image ) {
					texture.image = image;
					texture.needsUpdate = true;
				} );
		// load the blue texture for the logo geometry
		var loader2 = new THREE.ImageLoader( manager );
				loader2.load( 'mat/blue.jpg', function ( image ) {
					texture2.image = image;
					texture2.needsUpdate = true;
				} );
		
		// the object loader
		loader = new THREE.OBJLoader( manager );
		
		// load the main shell
		loader.load( 'models/shell.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);	
		object.name = "shell";
		obj = object;	
				objects.push(obj);
				newPosx.push(120);
				newPosy.push(5);
				newPosz.push(50);
				newRotx.push(round(0 * (Math.PI/180), 2));
				newRoty.push(round(20 * (Math.PI/180), 2));
				newRotz.push(round(15 * (Math.PI/180), 2));
				//console.log(objects[0]);
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			//console.log("checking");
			}, onProgress, onError );
		
		// load the circuit board
		loader.load( 'models/circuit.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		object.name = "circuit";
		object.id=4;
		obj = object;	
				objects.push(obj);
				newPosx.push(5);
				newPosy.push(10);
				newPosz.push(-15);
				newRotx.push(round(-20* (Math.PI/180), 2));
				newRoty.push(round(20 * (Math.PI/180), 2));
				newRotz.push(round(5 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			console.log("checking");
			}, onProgress, onError );
		
		// load the module board
		loader.load( 'models/circuit2.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange + 16,zchange);
		object.rotation.set(-5 * Math.PI/180 + xrotate, yrotate, 5 * Math.PI/180 + zrotate);
			object.scale.set(4,4,4);
		object.name = "module";
		obj = object;	
				objects.push(obj);
				newPosx.push(-35);
				newPosy.push(60);
				newPosz.push(-60);
				newRotx.push(round(-20* (Math.PI/180), 2));
				newRoty.push(round(180 * (Math.PI/180), 2));
				newRotz.push(round(5 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );

		// load the antennae
		loader.load( 'models/antennae.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		object.name = "antennae";
		obj = object;	
			objects.push(obj);
			newPosx.push(0);
			newPosy.push(30);
			newPosz.push(30);
			newRotx.push(round(-5* (Math.PI/180), 2));
			newRoty.push(round(20 * (Math.PI/180), 2));
			newRotz.push(round(5 * (Math.PI/180), 2));
			scene.add( obj );
			check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}

			}, onProgress, onError );
		
		// load the mounting board
		loader.load( 'models/mounting.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		obj = object;	
				objects.push(obj);
				newPosx.push(5);
				newPosy.push(10);
				newPosz.push(-20);
				newRotx.push(round(-20* (Math.PI/180), 2));
				newRoty.push(round(20 * (Math.PI/180), 2));
				newRotz.push(round(5 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}

			}, onProgress, onError );
		
		// load the cap
		loader.load( 'models/cap.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
        object.name = "cap";

		obj = object;	
				objects.push(obj);
				newPosx.push(-110);
				newPosy.push(-15);
				newPosz.push(-20);
				newRotx.push(round(5 * (Math.PI/180), 2));
				newRoty.push(round(-10 * (Math.PI/180), 2));
				newRotz.push(round(-10 * (Math.PI/180), 2));
				scene.add(obj);
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
		
		// load the logo
		loader.load( 'models/telig.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture2;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
        object.name = "telig";
		obj = object;	
		scene.add(obj);
			}, onProgress, onError );
		
		// load the power outlet
		loader.load( 'models/power.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		obj = object;	
				objects.push(obj);
				newPosx.push(5);
				newPosy.push(-45);
				newPosz.push(-10);
				newRotx.push(round(10* (Math.PI/180), 2));
				newRoty.push(round(20 * (Math.PI/180), 2));
				newRotz.push(round(10 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
		
		// load the ups
		loader.load( 'models/ups.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);

		obj = object;	
				objects.push(obj);
				newPosx.push(0);
				newPosy.push(-10);
				newPosz.push(-30);
				newRotx.push(round(10* (Math.PI/180), 2));
				newRoty.push(round(20 * (Math.PI/180), 2));
				newRotz.push(round(10 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
		
		// load the surge suppressor
		loader.load( 'models/surge.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);

		obj = object;	
				objects.push(obj);
				newPosx.push(45);
				newPosy.push(-10);
				newPosz.push(0);
				newRotx.push(round(10* (Math.PI/180), 2));
				newRoty.push(round(25 * (Math.PI/180), 2));
				newRotz.push(round(10 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
		
		// load the battery
		loader.load( 'models/battery.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		object.name = "battery";
		obj = object;	
				objects.push(obj);
				newPosx.push(-30);
				newPosy.push(-10);
				newPosz.push(-10);
				newRotx.push(round(10* (Math.PI/180), 2));
				newRoty.push(round(15 * (Math.PI/180), 2));
				newRotz.push(round(10 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
		
		// load the gasket and screws
		loader.load( 'models/gasket.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		object.name = "gasket";
		obj = object;	
				objects.push(obj);
				newPosx.push(-60);
				newPosy.push(-10);
				newPosz.push(-15);
				newRotx.push(round(0 * (Math.PI/180), 2));
				newRoty.push(round(0 * (Math.PI/180), 2));
				newRotz.push(round(0* (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
		
		// load the nuts and screws
		loader.load( 'models/nuts.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		obj = object;	
				objects.push(obj);
				newPosx.push(-105);
				newPosy.push(-10);
				newPosz.push(-15);
				newRotx.push(round(0 * (Math.PI/180), 2));
				newRoty.push(round(0 * (Math.PI/180), 2));
				newRotz.push(round(0* (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
			}, onProgress, onError );
	
		// load the general electric interface
		loader.load( 'models/genelec.obj', function ( object ) {
				object.traverse( function ( child ) {
					if ( child instanceof THREE.Mesh ) {
						child.material.map = texture;
					}
				} );
		object.position.set(xchange,ychange,zchange);
		object.rotation.set(xrotate, yrotate, zrotate);
		object.name = "electric";

		obj = object;	
				objects.push(obj);
				newPosx.push(-33);
				newPosy.push(0);
				newPosz.push(-15);
				newRotx.push(round(10* (Math.PI/180), 2));
				newRoty.push(round(15 * (Math.PI/180), 2));
				newRotz.push(round(10 * (Math.PI/180), 2));
				scene.add( obj );
				check++;
				if(check ==13) {
					init2()
					check = 0;
				} else {
					//console.log("check: " + check);
				}
		}, onProgress, onError );
	}

	/**
	* name: addOtherObjects
	* Purpose: This function adds the dummy objects that makes the real ones clickable
	*/
	function addOtherObjects() {
		
		// ADD THE DUMMY FOR THE CIRCUIT BOARD
		var whiteMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x555555, shininess: 0 } );
		// build the object to hide in circuit (clickable) 
		rect = new THREE.Mesh(new THREE.CubeGeometry(25, 0.4, 23), whiteMat);
		rect.position.set(0,40,-50);
		rect.rotation.set(round(-20 * (Math.PI/180), 2),round(-40 * (Math.PI/180), 2), round(-5 * (Math.PI/180), 2));
		rect.scale.set(newCircScale, newCircScale, newCircScale);
		rect.name = "circuitRect";
		scene.add(rect);
		rect.material.visible = false;
		
		// ADD DUMMY FOR BATTERY
		batRect = new THREE.Mesh(new THREE.CubeGeometry(30, 15, 8), whiteMat);
		batRect.position.set(-45,-35,0);
		batRect.rotation.set(round(10 * (Math.PI/180), 2),round(-40 * (Math.PI/180), 2), round(-5 * (Math.PI/180), 2));
		batRect.scale.set(newCircScale, newCircScale, newCircScale);
		batRect.name = "batRect";
		scene.add(batRect);
		batRect.material.visible = false;
		
		// ADD DUMMY FOR ELECTRICAL INTERFACES
		elecRect = new THREE.Mesh(new THREE.CubeGeometry(15, 8, 8), whiteMat);
		elecRect.position.set(-55,0,0);
		elecRect.rotation.set(round(10 * (Math.PI/180), 2),round(-40 * (Math.PI/180), 2), round(-5 * (Math.PI/180), 2));
		elecRect.scale.set(newCircScale, newCircScale, newCircScale);
		elecRect.name = "elecRect";
		scene.add(elecRect);
		elecRect.material.visible = false;
		
		// ADD DUMMY FOR ANTENNAE
		antennaeRect = new THREE.Mesh(new THREE.CubeGeometry(15, 10, 20), whiteMat);
		antennaeRect.position.set(-5,70,30);
		antennaeRect.rotation.set(round(10 * (Math.PI/180), 2),round(-90 * (Math.PI/180), 2), round(-5 * (Math.PI/180), 2));
		antennaeRect.scale.set(newCircScale, newCircScale, newCircScale);
		antennaeRect.name = "antennaeRect";
		scene.add(antennaeRect);
		antennaeRect.material.visible = false;
		
		/*
				newRotx.push(round(-20* (Math.PI/180), 2));
				newRoty.push(round(180 * (Math.PI/180), 2));
				newRotz.push(round(5 * (Math.PI/180), 2));
		*/
		// ADD DUMMY FOR module
		moduleRect = new THREE.Mesh(new THREE.CubeGeometry(15, 10, 20), whiteMat);
		moduleRect.position.set(-35,60,-60);
		moduleRect.rotation.set(round(10 * (Math.PI/180), 2),round(-90 * (Math.PI/180), 2), round(-5 * (Math.PI/180), 2));
		moduleRect.scale.set(newCircScale, newCircScale, newCircScale);
		moduleRect.name = "moduleRect";
		scene.add(moduleRect);
		//moduleRect.material.visible = false;
		
		// ADD DUMMY FOR SHELL INTERFACE
		shellRect = new THREE.Mesh(new THREE.CubeGeometry(30, 50, 40), whiteMat);
		shellRect.position.set(135,0,70);
		shellRect.rotation.set(round(10 * (Math.PI/180), 2),round(-30 * (Math.PI/180), 2), round(0 * (Math.PI/180), 2));
		shellRect.scale.set(newCircScale, newCircScale, newCircScale);
		shellRect.name = "shellRect";
		scene.add(shellRect);
		shellRect.material.visible = false;
	}

	/**
	* name: removeObjects
	* This function just removes the dummy
	* objects from the scene
	*/
	function removeObjects() {
		rect.visible = false;
		batRect.visible = false;
		elecRect.visible = false;
		antennaeRect.visible = false;
		shellRect.visible = false;
		moduleRect.visible = false;
	}

	// ANIMATION FUNCTIONS //

	/**
	* name: explode
	* This function is called when the explode button is pushed.
	* It either explodes the model out and sets teh state accordingly,
	* or it collapses it. It also takes care or the collapse/expand text
	*/
	function explode() {

		// Reset the camera 
		camera.position.set(-12,70,-140);
		controls.target = new THREE.Vector3(xchange - 10, ychange, zchange);
		controls.update();
		
		// if state == 0, objs explode out
		// if state == 1, they explode in
		
		// if we are in a detail view, we leave the detail view
		if(detail !=0) {
				pivot.rotation.x = 0;
				pivot.rotation.y = 0;
				pivot.rotation.z = 0;
				if(detail == BATTERYDETAIL + 10) {
					batteryTweenOut();
				} else if (detail == CIRCUITDETAIL + 10){
					circuitTweenOut();
				} else if (detail == ANTENNAEDETAIL + 10){
					antennaeTweenOut();
				} else if (detail == ELECTRICDETAIL + 10){
					electricTweenOut();
				} else if (detail == SHELLDETAIL + 10){
					shellTweenOut();
				} else if (detail == MODULEDETAIL + 10){
					moduleTweenOut();
				}
				state = 1;	
		} 
		// otherwise, we respond appropriately 
		else {
			// if we are in a collapsed state
			if (state === 0) {
				//add the dummy elements, if they are not already added
				if (objAdded === 0) {
					addOtherObjects();
					objAdded = 1;
				}
				// animate our model out
				tweenIn();
				// now we are in exploded state
				state = 1;
				// disable the controls
				controls.enabled = false;

			} 
			// if we are in an expanded state
			else {
				// the state will become the collapsed state
				state = 0;
				// remove dummy objects from scene
				removeObjects();

				// update camera position and enable controls
				camera.position.set(-12,70,-140);
				controls.target = new THREE.Vector3(xchange - 10, ychange, zchange);
				controls.update();
				controls.enabled = true;
				// animate the model back to the collapsed stae
				tweenOut();
			}
		}
			// handle the wording of the explode button
			var exp = document.getElementById("exp");
			if (state !== 0) {
				exp.innerHTML = "COLLAPSE";
				exp.setAttribute("style", "left: 59px;");
				document.getElementById("selectObj").style.visibility = "visible";
			} else {
				exp.innerHTML = "EXPLODE";
				exp.setAttribute("style", "left: 62px;");
				document.getElementById("selectObj").style.visibility = "hidden";
			}
	}
	
	/**
	* This function resets the rotation of the objects
	*/
	function rotationReset() {
		for (i=0; i < objNum; i++) {
			objects[i].rotation.x = newRotx[i];
			objects[i].rotation.y = newRoty[i];
			objects[i].rotation.z = newRotz[i];
		}
	}

	// HERE ARE ALL OF THE FUNCTIONS THAT HANDLE DETAIL TWEENING FOR DETAIL OBJS // 

	// THE CIRCUIT TWEENING
	function circuitTween() {
		var c = scene.getObjectByName("circuit");

		// ROTATION TWEEN
		var rct = {x: circuitRot.getComponent(0), y: circuitRot.getComponent(1), z: circuitRot.getComponent(2)};
		var rcp = { x: round(-20* (Math.PI/180), 2), y: round(20* (Math.PI/180), 2), z: round(5* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rcp).to(rct,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rcp.x;
			c.rotation.y = rcp.y;
			c.rotation.z = rcp.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		//console.log("start: " + c.position.x + " " + c.position.y + " " + c.position.z);
		// OBJECT POSITION
		var ct = {x: -circuitChange.getComponent(0), y: -circuitChange.getComponent(1), z: -circuitChange.getComponent(2)};
		var cp = { x: 5, y: 10, z: -5 };
		var objTween = new TWEEN.Tween(cp).to(ct,1000);
		objTween.onUpdate(function() {
			c.position.x = cp.x;
			c.position.y = cp.y;
			c.position.z = cp.z;

		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.start();
		objTween.onComplete(function() {
			detail = CIRCUITDETAIL;
		});
		
		// PIVOT POSITION
		var circPosition = {x:0, y:0, z:0};
		var circTarget = { x: circuitPos.getComponent(0) + circuitChange.getComponent(0), y: circuitPos.getComponent(1)+ circuitChange.getComponent(1), z: circuitPos.getComponent(2)+ circuitChange.getComponent(2) };
		var circTween = new TWEEN.Tween(circPosition).to(circTarget, 2000);
		circTween.onUpdate(function() {
			pivot.position.x = circPosition.x;
			pivot.position.y = circPosition.y;
			pivot.position.z = circPosition.z;
		});
		circTween.easing(TWEEN.Easing.Cubic.InOut);
		circTween.start();
	}

	function circuitTweenOut() {
		var c = scene.getObjectByName("circuit");

		// ROTATION TWEEN
		var rct = {x: circuitRot.getComponent(0), y: circuitRot.getComponent(1), z: circuitRot.getComponent(2)};
		var rcp = { x: round(-20* (Math.PI/180), 2), y: round(20* (Math.PI/180), 2), z: round(5* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rct).to(rcp,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rct.x;
			c.rotation.y = rct.y;
			c.rotation.z = rct.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		// OBJECT POSITION
		var ct = {x: -circuitChange.getComponent(0), y: -circuitChange.getComponent(1), z: -circuitChange.getComponent(2)};
		//var cp = { x: circuitChange.getComponent(0), y: circuitChange.getComponent(1), z: circuitChange.getComponent(2) };
		var cp = { x: 5, y: 10, z: -15 };
		var objTween = new TWEEN.Tween(ct).to(cp,500);
		objTween.onUpdate(function() {
			c.position.x = ct.x;
			c.position.y = ct.y;
			c.position.z = ct.z;
		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.onComplete(function() {
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;
			
			detailOut();
		});
		
		// PIVOT POSITION
		var circPosition = {x:0, y:0, z:0};
		var circTarget = { x: circuitPos.getComponent(0) + circuitChange.getComponent(0), y: circuitPos.getComponent(1)+ circuitChange.getComponent(1), z: circuitPos.getComponent(2)+ circuitChange.getComponent(2) };
		var circTween = new TWEEN.Tween(circTarget).to(circPosition, 1000);
		circTween.onUpdate(function() {
			pivot.position.x = circTarget.x;
			pivot.position.y = circTarget.y;
			pivot.position.z = circTarget.z;
		});
		circTween.easing(TWEEN.Easing.Cubic.Out);
		
		circTween.start();
		circTween.onComplete(function() {
			objTween.start();
			circLabelClose();			
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			
			$('#antennaeline2').css("display", "block");
		});
		
	}


	// THE BATTERY TWEENING

	function batteryTween() {
		var c = scene.getObjectByName("battery");

		// ROTATION TWEEN
		var rct = {x: batteryRot.getComponent(0), y: batteryRot.getComponent(1), z: batteryRot.getComponent(2)};
		var rcp = { x: round(10* (Math.PI/180), 2), y: round(15* (Math.PI/180), 2), z: round(10* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rcp).to(rct,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rcp.x;
			c.rotation.y = rcp.y;
			c.rotation.z = rcp.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		//console.log("start: " + c.position.x + " " + c.position.y + " " + c.position.z);
		// OBJECT POSITION
		var ct = {x: -batteryChange.getComponent(0), y: -batteryChange.getComponent(1), z: -batteryChange.getComponent(2)};
		var cp = { x: -30, y: -10, z: -10 };
		var objTween = new TWEEN.Tween(cp).to(ct,1000);
		objTween.onUpdate(function() {
			c.position.x = cp.x;
			c.position.y = cp.y;
			c.position.z = cp.z;

		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.start();
		objTween.onComplete(function() {
			detail = BATTERYDETAIL;
		});
		
		// PIVOT POSITION
		var battPosition = {x:0, y:0, z:0};
		var battTarget = { x: batteryPos.getComponent(0) + batteryChange.getComponent(0), y: batteryPos.getComponent(1)+ batteryChange.getComponent(1), z: batteryPos.getComponent(2)+ batteryChange.getComponent(2) };
		var battTween = new TWEEN.Tween(battPosition).to(battTarget, 2000);
		battTween.onUpdate(function() {
			pivot.position.x = battPosition.x;
			pivot.position.y = battPosition.y;
			pivot.position.z = battPosition.z;
		});
		battTween.easing(TWEEN.Easing.Cubic.InOut);
		battTween.start();
	}

	function batteryTweenOut() {
		var c = scene.getObjectByName("battery");

		// ROTATION TWEEN
		var rct = {x: batteryRot.getComponent(0), y: batteryRot.getComponent(1), z: batteryRot.getComponent(2)};
		var rcp = { x: round(10* (Math.PI/180), 2), y: round(15* (Math.PI/180), 2), z: round(10* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rct).to(rcp,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rct.x;
			c.rotation.y = rct.y;
			c.rotation.z = rct.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		// OBJECT POSITION
		var ct = {x: -batteryChange.getComponent(0), y: -batteryChange.getComponent(1), z: -batteryChange.getComponent(2)};
		var cp = { x: -30, y: -10, z: -10 };
		var objTween = new TWEEN.Tween(ct).to(cp,500);
		objTween.onUpdate(function() {
			c.position.x = ct.x;
			c.position.y = ct.y;
			c.position.z = ct.z;
		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.onComplete(function() {
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;
			
			detailOut();
		});
		
		
		// PIVOT POSITION
		var battPosition = {x:0, y:0, z:0};
		var battTarget = { x: batteryPos.getComponent(0) + batteryChange.getComponent(0), y: batteryPos.getComponent(1)+ batteryChange.getComponent(1), z: batteryPos.getComponent(2)+ batteryChange.getComponent(2) };
		var battTween = new TWEEN.Tween(battTarget).to(battPosition, 1000);
		battTween.onUpdate(function() {
			pivot.position.x = battTarget.x;
			pivot.position.y = battTarget.y;
			pivot.position.z = battTarget.z;
		});
		battTween.easing(TWEEN.Easing.Cubic.Out);
		objTween.start();
		battTween.start();
		battTween.onComplete(function() {
			
			batLabelClose();			
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			$('#antennaeline2').css("display", "block");

		});
		
	}

// THE ANTENNAE TWEENING

	function antennaeTween() {
		var c = scene.getObjectByName("antennae");
		
		// ROTATION TWEEN
		var rct = {x: antennaeRot.getComponent(0), y: antennaeRot.getComponent(1), z: antennaeRot.getComponent(2)};
		var rcp = { x: round(-5* (Math.PI/180), 2), y: round(20* (Math.PI/180), 2), z: round(5* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rcp).to(rct,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rcp.x;
			c.rotation.y = rcp.y;
			c.rotation.z = rcp.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		//console.log("start: " + c.position.x + " " + c.position.y + " " + c.position.z);
		// OBJECT POSITION
		var ct = {x: -antennaeChange.getComponent(0), y: -antennaeChange.getComponent(1), z: -antennaeChange.getComponent(2)};
		var cp = { x: 0, y: 30, z: 30 };
		var objTween = new TWEEN.Tween(cp).to(ct,1000);
		objTween.onUpdate(function() {
			c.position.x = cp.x;
			c.position.y = cp.y;
			c.position.z = cp.z;

		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.start();
		objTween.onComplete(function() {
			detail = ANTENNAEDETAIL;
		});
		
		// PIVOT POSITION
		var antPosition = {x:0, y:0, z:0};
		var antTarget = { x: antennaePos.getComponent(0) + antennaeChange.getComponent(0), y: antennaePos.getComponent(1)+ antennaeChange.getComponent(1), z: antennaePos.getComponent(2)+ antennaeChange.getComponent(2) };
		var antTween = new TWEEN.Tween(antPosition).to(antTarget, 2000);
		antTween.onUpdate(function() {
			pivot.position.x = antPosition.x;
			pivot.position.y = antPosition.y;
			pivot.position.z = antPosition.z;
		});
		antTween.easing(TWEEN.Easing.Cubic.InOut);
		antTween.start();
	}

	function antennaeTweenOut() {
		var c = scene.getObjectByName("antennae");

		// ROTATION TWEEN
		var rct = {x: antennaeRot.getComponent(0), y:antennaeRot.getComponent(1), z: antennaeRot.getComponent(2)};
		var rcp = { x: round(-5* (Math.PI/180), 2), y: round(20* (Math.PI/180), 2), z: round(5* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rct).to(rcp,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rct.x;
			c.rotation.y = rct.y;
			c.rotation.z = rct.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		// OBJECT POSITION
		var ct = {x: -antennaeChange.getComponent(0), y: -antennaeChange.getComponent(1), z: -antennaeChange.getComponent(2)};
		var cp = { x: 0, y: 30, z: 30 };
		var objTween = new TWEEN.Tween(ct).to(cp,500);
		objTween.onUpdate(function() {
			c.position.x = ct.x;
			c.position.y = ct.y;
			c.position.z = ct.z;
		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.onComplete(function() {
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;

			detailOut();
		});
		
		
		// PIVOT POSITION
		var antPosition = {x:0, y:0, z:0};
		var antTarget = { x: antennaePos.getComponent(0) + antennaeChange.getComponent(0), y: antennaePos.getComponent(1)+ antennaeChange.getComponent(1), z: antennaePos.getComponent(2)+ antennaeChange.getComponent(2) };
		var antTween = new TWEEN.Tween(antTarget).to(antPosition, 1000);
		antTween.onUpdate(function() {
			pivot.position.x = antTarget.x;
			pivot.position.y = antTarget.y;
			pivot.position.z = antTarget.z;
		});
		antTween.easing(TWEEN.Easing.Cubic.Out);
		objTween.start();
		antTween.start();
		antTween.onComplete(function() {
			antenLabelClose();
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			$('#antennaeline2').css("display", "block");
		});
		
	}

// THE MODULE TWEENING

	function moduleTween() {
		var c = scene.getObjectByName("module");
		//console.log("obj scale: " + scene.getObjectByName("module").scale.x + " y: " + scene.getObjectByName("module").scale.y + " z " + scene.getObjectByName("module").scale.z);
		//console.log("obj rot: " + scene.getObjectByName("module").rotation.x + " y: " + scene.getObjectByName("module").rotation.y + " z " + scene.getObjectByName("module").rotation.z);
		//console.log("obj position: " + scene.getObjectByName("module").position.x + " y: " + scene.getObjectByName("module").position.y + " z " + scene.getObjectByName("module").position.z);

		// ROTATION TWEEN
		var rct = {x: moduleRot.getComponent(0), y: moduleRot.getComponent(1), z: moduleRot.getComponent(2)};
		var rcp = { x: round(-20* (Math.PI/180), 2), y: round(180* (Math.PI/180), 2), z: round(5* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rcp).to(rct,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rcp.x;
			c.rotation.y = rcp.y;
			c.rotation.z = rcp.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		//console.log("start: " + c.position.x + " " + c.position.y + " " + c.position.z);
		// OBJECT POSITION
		var ct = {x: -moduleChange.getComponent(0), y: -moduleChange.getComponent(1), z: -moduleChange.getComponent(2)};
		var cp = { x: -35, y: 60, z: -60 };
		var objTween = new TWEEN.Tween(cp).to(ct,1000);
		objTween.onUpdate(function() {
			c.position.x = cp.x;
			c.position.y = cp.y;
			c.position.z = cp.z;

		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.start();
		objTween.onComplete(function() {
			detail = MODULEDETAIL;
		});
		
		// PIVOT POSITION
		var modPosition = {x:0, y:0, z:0};
		var modTarget = { x: modulePos.getComponent(0) + moduleChange.getComponent(0), y: modulePos.getComponent(1)+ moduleChange.getComponent(1), z: modulePos.getComponent(2)+ moduleChange.getComponent(2) };
		var modTween = new TWEEN.Tween(modPosition).to(modTarget, 2000);
		modTween.onUpdate(function() {
			pivot.position.x = modPosition.x;
			pivot.position.y = modPosition.y;
			pivot.position.z = modPosition.z;
		});
		modTween.easing(TWEEN.Easing.Cubic.InOut);
		modTween.start();
	}

	function moduleTweenOut() {
		var c = scene.getObjectByName("module");

		// ROTATION TWEEN
		var rct = {x: moduleRot.getComponent(0), y:moduleRot.getComponent(1), z: moduleRot.getComponent(2)};
		var rcp = {x: round(-20* (Math.PI/180), 2), y: round(180* (Math.PI/180), 2), z: round(5* (Math.PI/180), 2)};
		var rotTween = new TWEEN.Tween(rct).to(rcp,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rct.x;
			c.rotation.y = rct.y;
			c.rotation.z = rct.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		// OBJECT POSITION
		var ct = {x: -moduleChange.getComponent(0), y: -moduleChange.getComponent(1), z: -moduleChange.getComponent(2)};
		var cp = { x: -35, y: 60, z: -60};
		var objTween = new TWEEN.Tween(ct).to(cp,500);
		objTween.onUpdate(function() {
			c.position.x = ct.x;
			c.position.y = ct.y;
			c.position.z = ct.z;
		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.onComplete(function() {
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;
			detailOut();
		});
		
		
		// PIVOT POSITION
		var modPosition = {x:0, y:0, z:0};
		var modTarget = { x: modulePos.getComponent(0) + moduleChange.getComponent(0), y: modulePos.getComponent(1)+ moduleChange.getComponent(1), z: modulePos.getComponent(2)+ moduleChange.getComponent(2) };
		var modTween = new TWEEN.Tween(modTarget).to(modPosition, 1000);
		modTween.onUpdate(function() {
			pivot.position.x = modTarget.x;
			pivot.position.y = modTarget.y;
			pivot.position.z = modTarget.z;
		});
		modTween.easing(TWEEN.Easing.Cubic.Out);
		
		modTween.start();
		//objTween.delay(300);
		objTween.start();
		
		// OBJECT POSITION
		
			
		
		modTween.onComplete(function() {
			modLabelClose();
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			$('#antennaeline2').css("display", "block");
			var ct2 = {x: scene.getObjectByName("module").position.x, y: scene.getObjectByName("module").position.y, z: scene.getObjectByName("module").position.z};
			var cp2 = { x: -35, y: 60, z: -60};
			var objTween2 = new TWEEN.Tween(ct2).to(cp2,500);
			objTween2.onUpdate(function() {
				c.position.x = ct2.x;
				c.position.y = ct2.y;
				c.position.z = ct2.z;
			});	
			objTween2.easing(TWEEN.Easing.Cubic.In);
			objTween2.start();
			objTween2.onComplete(function() {
				//console.log("obj scale: " + scene.getObjectByName("module").scale.x + " y: " + scene.getObjectByName("module").scale.y + " z " + scene.getObjectByName("module").scale.z);
			//console.log("obj rot: " + scene.getObjectByName("module").rotation.x + " y: " + scene.getObjectByName("module").rotation.y + " z " + scene.getObjectByName("module").rotation.z);
			//console.log("obj position: " + scene.getObjectByName("module").position.x + " y: " + scene.getObjectByName("module").position.y + " z " + scene.getObjectByName("module").position.z);
			});
		});
		
	}

// THE ELECTRIC TWEENING

	function electricTween() {
		var c = scene.getObjectByName("electric");
		
		// ROTATION TWEEN
		var rct = {x: electricRot.getComponent(0), y: electricRot.getComponent(1), z: electricRot.getComponent(2)};
		var rcp = { x: round(10* (Math.PI/180), 2), y: round(15* (Math.PI/180), 2), z: round(10* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rcp).to(rct,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rcp.x;
			c.rotation.y = rcp.y;
			c.rotation.z = rcp.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		//console.log("start: " + c.position.x + " " + c.position.y + " " + c.position.z);
		// OBJECT POSITION
		var ct = {x: -electricChange.getComponent(0), y: -electricChange.getComponent(1), z: -electricChange.getComponent(2)};
		var cp = { x: -33, y: 0, z: -15 };
		var objTween = new TWEEN.Tween(cp).to(ct,1000);
		objTween.onUpdate(function() {
			c.position.x = cp.x;
			c.position.y = cp.y;
			c.position.z = cp.z;

		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.start();
		objTween.onComplete(function() {
			detail = ELECTRICDETAIL;
		});
		
		// PIVOT POSITION
		var elecPosition = {x:0, y:0, z:0};
		var elecTarget = { x: electricPos.getComponent(0) + electricChange.getComponent(0), y: electricPos.getComponent(1)+ electricChange.getComponent(1), z: electricPos.getComponent(2)+ electricChange.getComponent(2) };
		var elecTween = new TWEEN.Tween(elecPosition).to(elecTarget, 2000);
		elecTween.onUpdate(function() {
			pivot.position.x = elecPosition.x;
			pivot.position.y = elecPosition.y;
			pivot.position.z = elecPosition.z;
		});
		elecTween.easing(TWEEN.Easing.Cubic.InOut);
		elecTween.start();
	}

	function electricTweenOut() {
		var c = scene.getObjectByName("electric");

		// ROTATION TWEEN
		var rct = {x: electricRot.getComponent(0), y:electricRot.getComponent(1), z: electricRot.getComponent(2)};
		var rcp = { x: round(10* (Math.PI/180), 2), y: round(15* (Math.PI/180), 2), z: round(10* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rct).to(rcp,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rct.x;
			c.rotation.y = rct.y;
			c.rotation.z = rct.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		
		// OBJECT POSITION
		var ct = {x: -electricChange.getComponent(0), y: -electricChange.getComponent(1), z: -electricChange.getComponent(2)};
		var cp = { x: -33, y: 0, z: -15  };
		var objTween = new TWEEN.Tween(ct).to(cp,500);
		objTween.onUpdate(function() {
			c.position.x = ct.x;
			c.position.y = ct.y;
			c.position.z = ct.z;
		});
		objTween.easing(TWEEN.Easing.Cubic.In);
		objTween.onComplete(function() {
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;
			detailOut();
		});
		
		
		// PIVOT POSITION
		var elecPosition = {x:0, y:0, z:0};
		var elecTarget = { x: electricPos.getComponent(0) + electricChange.getComponent(0), y: electricPos.getComponent(1)+ electricChange.getComponent(1), z: electricPos.getComponent(2)+ electricChange.getComponent(2) };
		var elecTween = new TWEEN.Tween(elecTarget).to(elecPosition, 1000);
		elecTween.onUpdate(function() {
			pivot.position.x = elecTarget.x;
			pivot.position.y = elecTarget.y;
			pivot.position.z = elecTarget.z;
		});
		elecTween.easing(TWEEN.Easing.Cubic.Out);
		objTween.start();
		elecTween.start();
		elecTween.onComplete(function() {
			elecLabelClose();
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			$('#antennaeline2').css("display", "block");
		});
		
	}

// THE SHELL TWEENING

	function shellTween() {
		var c = scene.getObjectByName("shell");
		
		// ROTATION TWEEN
		var rct = {x: shellRot.getComponent(0), y: shellRot.getComponent(1), z: shellRot.getComponent(2)};
		var rcp = { x: round(0* (Math.PI/180), 2), y: round(20* (Math.PI/180), 2), z: round(15* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rcp).to(rct,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rcp.x;
			c.rotation.y = rcp.y;
			c.rotation.z = rcp.z;
			scene.getObjectByName("cap").rotation.x = rcp.x;
			scene.getObjectByName("cap").rotation.y = rcp.y;
			scene.getObjectByName("cap").rotation.z = rcp.z;
			scene.getObjectByName("gasket").rotation.x = rcp.x;
			scene.getObjectByName("gasket").rotation.y = rcp.y;
			scene.getObjectByName("gasket").rotation.z = rcp.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		//console.log("start: " + c.position.x + " " + c.position.y + " " + c.position.z);
		// OBJECT POSITION
		var ct = {x: -shellChange.getComponent(0), y: -shellChange.getComponent(1), z: -shellChange.getComponent(2)};
		var cp = { x: 120, y: 5, z: 50 };
		var objTween = new TWEEN.Tween(cp).to(ct,1000);
		objTween.onUpdate(function() {
			c.position.x = cp.x;
			c.position.y = cp.y;
			c.position.z = cp.z;

		});
		objTween.easing(TWEEN.Easing.Cubic.InOut);
		
		objTween.onComplete(function() {
			detail = SHELLDETAIL;
		});
		objTween.start();
		
		
		// OTHER object Tweens
		// CAP
		var cty = {x: -shellChange.getComponent(0), y: -shellChange.getComponent(1), z: -shellChange.getComponent(2)};
		var cpy = { x: -110, y: -15, z: -20 };
		var objTweeny = new TWEEN.Tween(cpy).to(cty,1000);
		objTweeny.onUpdate(function() {
			scene.getObjectByName("cap").position.x = cpy.x;
			scene.getObjectByName("cap").position.y = cpy.y;
			scene.getObjectByName("cap").position.z = cpy.z;
			//console.log("test");
		});
		objTweeny.easing(TWEEN.Easing.Cubic.InOut);
		objTweeny.start();
		
		// OTHER object Tweens
		// GASKET
		var ct3 = {x: -shellChange.getComponent(0), y: -shellChange.getComponent(1), z: -shellChange.getComponent(2)};
		var cp3 = { x: -60, y: -10, z: -15 };
		var objTween3 = new TWEEN.Tween(cp3).to(ct3,1000);
		objTween3.onUpdate(function() {
			scene.getObjectByName("gasket").position.x = cp3.x;
			scene.getObjectByName("gasket").position.y = cp3.y;
			scene.getObjectByName("gasket").position.z = cp3.z;
		});
		objTween3.easing(TWEEN.Easing.Cubic.InOut);
		objTween3.start();
	
		// PIVOT POSITION
		var shPosition = {x:0, y:0, z:0};
		var shTarget = { x: shellPos.getComponent(0) + shellChange.getComponent(0), y: shellPos.getComponent(1)+ shellChange.getComponent(1), z: shellPos.getComponent(2)+ shellChange.getComponent(2) };
		var shTween = new TWEEN.Tween(shPosition).to(shTarget, 1000);
		shTween.onUpdate(function() {
			pivot.position.x = shPosition.x;
			pivot.position.y = shPosition.y;
			pivot.position.z = shPosition.z;
		});
		shTween.easing(TWEEN.Easing.Cubic.InOut);
		shTween.start();
	}

	function shellTweenOut() {
		var c = scene.getObjectByName("shell");

		// ROTATION TWEEN
		var rct = {x: shellRot.getComponent(0), y:shellRot.getComponent(1), z: shellRot.getComponent(2)};
		var rcp = { x: round(0* (Math.PI/180), 2), y: round(20* (Math.PI/180), 2), z: round(15* (Math.PI/180), 2) };
		var rotTween = new TWEEN.Tween(rct).to(rcp,1000);
		rotTween.onUpdate(function() {
			c.rotation.x = rct.x;
			c.rotation.y = rct.y;
			c.rotation.z = rct.z;
		});
		rotTween.easing(TWEEN.Easing.Cubic.InOut);
		rotTween.start();
		
		// OBJECT POSITION
		var ct = {x: -shellChange.getComponent(0), y: -shellChange.getComponent(1), z: -shellChange.getComponent(2)};
		var cp = { x: 120, y: 5, z: 50 };
		var objTween = new TWEEN.Tween(ct).to(cp,500);
		objTween.onUpdate(function() {
			c.position.x = ct.x;
			c.position.y = ct.y;
			c.position.z = ct.z;
		});
		objTween.easing(TWEEN.Easing.Cubic.InOut);
		objTween.onComplete(function() {
			
		});
		
		
		// OTHER object Tweens
		// CAP
		var cty = {x: -shellChange.getComponent(0), y: -shellChange.getComponent(1), z: -shellChange.getComponent(2)};
		var cpy = { x: -110, y: -15, z: -20 };
		var objTweeny = new TWEEN.Tween(cty).to(cpy,1000);
		objTweeny.onUpdate(function() {
			scene.getObjectByName("cap").position.x = cty.x;
			scene.getObjectByName("cap").position.y = cty.y;
			scene.getObjectByName("cap").position.z = cty.z;
			//console.log("test");
		});
		objTweeny.easing(TWEEN.Easing.Cubic.InOut);
		objTweeny.start();
		objTweeny.onComplete(function() {
			
			rect.visible = true;
			batRect.visible = true;
			elecRect.visible = true;
			antennaeRect.visible = true;
			shellRect.visible = true;
			moduleRect.visible = true;

			detailOut();
		});
		
		// OTHER object Tweens
		// GASKET
		var ct3 = {x: -shellChange.getComponent(0), y: -shellChange.getComponent(1), z: -shellChange.getComponent(2)};
		var cp3 = { x: -60, y: -10, z: -15 };
		var objTween3 = new TWEEN.Tween(ct3).to(cp3,1000);
		objTween3.onUpdate(function() {
			scene.getObjectByName("gasket").position.x = ct3.x;
			scene.getObjectByName("gasket").position.y = ct3.y;
			scene.getObjectByName("gasket").position.z = ct3.z;
		});
		objTween3.easing(TWEEN.Easing.Cubic.InOut);
		objTween3.start();
		
		// ROTATION TWEEN
		var rct2 = {x: shellRot.getComponent(0), y: shellRot.getComponent(1), z: shellRot.getComponent(2)};
		var rcp2 = { x: round(5* (Math.PI/180), 2), y: round(-10* (Math.PI/180), 2), z: round(-10* (Math.PI/180), 2) };
		var rotTween2 = new TWEEN.Tween(rct2).to(rcp2,1000);
		rotTween2.onUpdate(function() {
			scene.getObjectByName("cap").rotation.x = rct2.x;
			scene.getObjectByName("cap").rotation.y = rct2.y;
			scene.getObjectByName("cap").rotation.z = rct2.z;
		});
		rotTween2.easing(TWEEN.Easing.Cubic.InOut);
		rotTween2.start();
		
				// ROTATION TWEEN
		var rct3 = {x: shellRot.getComponent(0), y: shellRot.getComponent(1), z: shellRot.getComponent(2)};
		var rcp3 = { x: round(0* (Math.PI/180), 2), y: round(0* (Math.PI/180), 2), z: round(0* (Math.PI/180), 2) };
		var rotTween3 = new TWEEN.Tween(rct3).to(rcp3,1000);
		rotTween3.onUpdate(function() {
			scene.getObjectByName("gasket").rotation.x = rct3.x;
			scene.getObjectByName("gasket").rotation.y = rct3.y;
			scene.getObjectByName("gasket").rotation.z = rct3.z;
		});
		rotTween3.easing(TWEEN.Easing.Cubic.InOut);
		rotTween3.start();

		
		// PIVOT POSITION
		var shPosition = {x:0, y:0, z:0};
		var shTarget = { x: shellPos.getComponent(0) + shellChange.getComponent(0), y: shellPos.getComponent(1)+ shellChange.getComponent(1), z: shellPos.getComponent(2)+ shellChange.getComponent(2) };
		var shTween = new TWEEN.Tween(shTarget).to(shPosition, 1000);
		shTween.onUpdate(function() {
			pivot.position.x = shTarget.x;
			pivot.position.y = shTarget.y;
			pivot.position.z = shTarget.z;
		});
		shTween.easing(TWEEN.Easing.Cubic.Out);
		objTween.start();
		shTween.start();
		shTween.onComplete(function() {
			shellLabelClose();
			$('p#shell').css("display", "block");
			$('#shellline').css("display", "block");

			$('p#battery').css("display", "block");
			$('#battline').css("display", "block");

			$('p#elec').css("display", "block");
			$('#electricline').css("display", "block");

			$('p#circuit').css("display", "block");
			$('#circuitline').css("display", "block");

			$('p#antennae').css("display", "block");
			$('#antennaeline').css("display", "block");
			$('#antennaeline2').css("display", "block");
			
		});
		
	}

	/**
	* name: animate
	* this function requests animation frames and then 
	* calls the scene to render
	*/
	function animate(time) {
		// request animation frame
		requestAnimationFrame( animate );	
		
		// NOW CHECK FOR DIFFERENT DETAIL STATES 
		// add the appropriate labels
		if(detail !== 0) {
			if (detail === CIRCUITDETAIL) {
				circLabel();
			} else if (detail === BATTERYDETAIL) {
				batLabel();
			} else if (detail === ELECTRICDETAIL) {
				elecLabel();
			} else if (detail === ANTENNAEDETAIL) {
				antenLabel();
			} else if (detail === SHELLDETAIL) {
				shellLabel();
			} else if (detail === MODULEDETAIL) {
				modLabel();
			}
		}
		// render the scene
		render();
		// update the camera
		controls.update();
	}
	/**
	* This function calculates the new scale of anything passed to it
	*/
	function calcScale(end) {
		var cir = scene.getObjectByName("circuit");
		var scalenum = new THREE.Vector3();
		cir.getWorldScale(scalenum);
		if(round(scalenum.getComponent(0),2) < end) {
			cir.scale.set(round(scalenum.getComponent(0) + 0.006, 2), round(scalenum.getComponent(1) + 0.006, 2), round(scalenum.getComponent(2) + 0.006, 2));
		} else if (round(scalenum.getComponent(0),2) > end) {
			cir.scale.set(round(scalenum.getComponent(0) - 0.006, 2), round(scalenum.getComponent(1) - 0.006, 2), round(scalenum.getComponent(2) - 0.006, 2));
		}
	}

/**
* name: round
* @peram: value - the value to round
* @peram: decimal - how many places to round to
*/
function round(value, decimals) {
	return Number(Math.round(value+'e'+decimals) + 'e-' + decimals);
}
	
/**
* This function recalculates the 3D scene if the window size changes
*/
function onWindowResize() {
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth-4, window.innerHeight-4 );
}

//*------------ Functions for bringing on the labels ---------------*/

function batLabel() {
	
	if(labelCount === 0) {
		$("#batLabel").css("display", "block");
	}
	if(labelCount === 5) {
		$("#batLine").css("display", "block");
	}
	if(labelCount === 10) {
		$("#batText").css("display", "block");
		$("#batBullets").css("display", "block");

	}
	labelCount = labelCount + 1;
	if (labelCount > 12) {
		labelCount = 0;
		detail = BATTERYDETAIL + 10;
	}
}
function batLabelClose() {
	$("#batLabel").css("display", "none");
	$("#batLine").css("display", "none");
	$("#batText").css("display", "none");
	$("#batBullets").css("display", "none");
}

function shellLabel() {
	
	if(labelCount === 0) {
		$("#shellLabel").css("display", "block");
	}
	if(labelCount === 5) {
		$("#shellLine").css("display", "block");
	}
	if(labelCount === 10) {
		$("#shellText").css("display", "block");
		$("#shellBullets").css("display", "block");
	}
	labelCount = labelCount + 1;
	if (labelCount > 12) {
		labelCount = 0;
		detail = SHELLDETAIL + 10;
	}
}

function shellLabelClose() {
	$("#shellLabel").css("display", "none");
	$("#shellLine").css("display", "none");
	$("#shellText").css("display", "none");
	$("#shellBullets").css("display", "none");
}


function antenLabel() {
	if(labelCount === 0) {
		$("#antenLabel").css("display", "block");
	}
	if(labelCount === 5) {
		$("#antenLine").css("display", "block");
	}
	if(labelCount === 10) {
		$("#antenText").css("display", "block");
		$("#antenBullets").css("display", "block");

	}
	labelCount = labelCount + 1;
	if (labelCount > 12) {
		labelCount = 0;
		detail = ANTENNAEDETAIL + 10;
	}
}

function antenLabelClose() {
	$("#antenLabel").css("display", "none");
	$("#antenLine").css("display", "none");
	$("#antenText").css("display", "none");
	$("#antenBullets").css("display", "none");	
}

function modLabel() {
	if(labelCount === 0) {
		$("#modLabel").css("display", "block");
	}
	if(labelCount === 5) {
		$("#modLine").css("display", "block");
	}
	if(labelCount === 10) {
		$("#modText").css("display", "block");
	}
	labelCount = labelCount + 1;
	if (labelCount > 12) {
		labelCount = 0;
		detail = MODULEDETAIL + 10;
	}
}

function modLabelClose() {
	$("#modLabel").css("display", "none");
	$("#modLine").css("display", "none");
	$("#modText").css("display", "none");
}


function elecLabel() {
	if(labelCount === 0) {
		$("#elecLabel").css("display", "block");
	}
	if(labelCount === 5) {
		$("#elecLine").css("display", "block");
	}
	if(labelCount === 10) {
		$("#elecText").css("display", "block");
	}
	labelCount = labelCount + 1;
	if (labelCount > 12) {
		labelCount = 0;
		detail = ELECTRICDETAIL + 10;
	}
}

function elecLabelClose() {
	$("#elecLabel").css("display", "none");
	$("#elecLine").css("display", "none");
	$("#elecText").css("display", "none");
}


function circLabel() {
	
	if(labelCount === 0) {
		$("#circLabel").css("display", "block");
		$("#topline").css("display", "none");
		$("#midline").css("display", "none");
		$("#botline").css("display", "none");
	}
	if(labelCount === 5) {
		$("#circText").css("display", "block");
	}
	if(labelCount === 10) {
		$(".circLabel").css("display", "inline");
		$("#topline").css("display", "block");
		$("#midline").css("display", "block");
		$("#botline").css("display", "block");
	}
	labelCount = labelCount + 1;
	if (labelCount > 12) {
		labelCount = 0;
		detail = CIRCUITDETAIL + 10;
	}
	
}

function circLabelClose() {
	$("#circLabel").css("display", "none");
	$(".circLabel").css("display", "none");
	$("#circText").css("display", "none");
	$('#circLabel2').css("display", "none");
}