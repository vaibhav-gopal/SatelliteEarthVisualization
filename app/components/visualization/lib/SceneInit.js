import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Post-Processing Effects
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export default class ThreeScene {
    constructor(canvasId) {
        // NOTE: Core components to initialize Three.js app.
        this.scene = undefined;
        this.camera = undefined;
        this.renderer = undefined;

        // Texture loader
        this.texLoader = undefined;

        // NOTE: Canvas html ID
        this.canvasId = canvasId;

        // NOTE: Additional components.
        this.clock = undefined;
        this.controls = undefined;

        // NOTE: Lighting is basically required.
        this.ambientLight = undefined;
        this.directionalLight = undefined;
        this.hemisphereLight = undefined;

        // NOTE: Raycasting and pointer location
        this.raycaster = undefined;
        this.pointer = undefined;
        this.intersections = undefined;
        this.displayMouseIntersection = undefined;
        this.rayObject = undefined;
        
        // NOTE: Post-Processing Effect 
        this.composer = undefined;
        this.bokeh = undefined;
        this.bokehController = undefined;
        this.outline1 = undefined;
        this.outline1Colors = undefined;
        this.outline2 = undefined;
        this.outline2Colors = undefined;

        // NOTE: GUI and Color picker
        this.gui = undefined;

        // Focusing
        this.selectedObjects = [];
        this.hovering = [];
    }

    initialize() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        this.camera.position.z = 48;

        // NOTE: Specify a canvas which is already created in the HTML.
        const canvas = document.getElementById(this.canvasId);
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            // NOTE: Anti-aliasing smooths out the edges.
            antialias: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.texLoader = new THREE.TextureLoader();

        this.clock = new THREE.Clock();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 8;
        this.controls.maxDistance = 200;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;

        // ambient light which is for the whole scene
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // directional light - parallel sun rays
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        this.directionalLight.position.set(0, 32, 64);
        this.scene.add(this.directionalLight);

        // if window resizes
        window.addEventListener('resize', () => this.onWindowResize());

        // Raycaster and pointer
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        window.addEventListener('pointermove', (ev) => this.onPointerMove(ev));
        window.addEventListener('pointerdown', (ev) => this.onPointerDown(ev));
        window.addEventListener('pointerup', (ev) => this.onPointerUp(ev));
        this.displayMouseIntersection = false;

        //Keyboard
        window.addEventListener('keydown', (ev) => this.onKeyUp(ev));

        // Helper objects
        if (this.displayMouseIntersection){
            this.createRayObject();
        }

        // Post Processing EffectComposer
        this.composer = new EffectComposer(this.renderer);
        this.initComposer();

        this.initGUI();
    }

    initComposer() {
        const renderPass = new RenderPass( this.scene, this.camera );
        const outputPass = new OutputPass();
        const colorCorrectionPass = new ShaderPass( ColorCorrectionShader );

        this.bokehController = {
            focus: 10.0,
            aperture: 0.0001,
            maxblur: 0.00
        }
        this.bokehPass = new BokehPass( this.scene, this.camera, this.bokehController );

        this.outline1 = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        this.outline1Colors = {
            visibleEdgeColor: '#61de2b',
            hiddenEdgeColor: '#190a05'
        }
        this.outline1.visibleEdgeColor.set(this.outline1Colors.visibleEdgeColor);
        this.outline1.hiddenEdgeColor.set(this.outline1Colors.hiddenEdgeColor);
        this.outline1.edgeStrength = 5;
        this.outline1.edgeGlow = 0.5;
        this.outline1.edgeThickness = 2;
        this.outline1.pulsePeriod = 2;
        this.outline1.selectedObjects = this.selectedObjects;

        this.outline2 = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        this.outline2Colors = {
            visibleEdgeColor: '#ffffff',
            hiddenEdgeColor: '#190a05'
        }
        this.outline2.visibleEdgeColor.set(this.outline2Colors.visibleEdgeColor);
        this.outline2.hiddenEdgeColor.set(this.outline2Colors.hiddenEdgeColor);
        this.outline2.edgeStrength = 5;
        this.outline2.edgeGlow = 0.5;
        this.outline2.edgeThickness = 2;
        this.outline2.pulsePeriod = 0;
        this.outline2.selectedObjects = this.hovering;

        this.composer.addPass( renderPass );
        this.composer.addPass( colorCorrectionPass );
        this.composer.addPass( this.bokehPass );
        this.composer.addPass( this.outline1 );
        this.composer.addPass( this.outline2 );
        this.composer.addPass( outputPass );
    }

    initGUI() {
        // CONTROLLER GUI
        this.gui = new GUI({closeFolders: true});

        //Camera
        const cam = this.gui.addFolder( 'Camera' );
        const fov = cam.add(this.camera, 'fov', 10, 120);  // FOV change
        const near = cam.add(this.camera, 'near', 1, 5000);   // Near plane
        const far = cam.add(this.camera, 'far', 2, 5000);   // Far plane
        const reset = {
            Reset: () => {
                fov.reset();
                near.reset();
                far.reset();
            }
        }
        cam.add(reset, 'Reset');
        cam.onFinishChange((event) => this.onCameraChange(event))

        //Ambient Light
        const amb = this.gui.addFolder( 'Ambient Light');
        amb.add(this.ambientLight, 'intensity');

        //Directional Light
        const directional = this.gui.addFolder( 'Directional Light');
        directional.add(this.ambientLight, 'intensity');

        //Orbit Controls
        const controls = this.gui.addFolder( 'Controls' );
        const recenter = {
            Recenter: () => {
                this.controls.target = new THREE.Vector3(0,0,0);
            }
        }
        controls.add(this.controls, 'enablePan');
        controls.add(this.controls, 'minDistance');
        controls.add(this.controls, 'maxDistance');
        controls.add(this.controls, 'zoomSpeed');
        controls.add(this.controls, 'rotateSpeed');
        controls.add(this.controls, 'panSpeed');
        controls.add(this.controls, 'enableDamping');
        controls.add(this.controls, 'dampingFactor');
        controls.add(recenter, 'Recenter');

        //Post processing Effects - Bokeh
        const bokehChanger = () => {
            this.bokehPass.uniforms[ 'focus' ].value = this.bokehController.focus;
            this.bokehPass.uniforms[ 'aperture' ].value = this.bokehController.aperture;
            this.bokehPass.uniforms[ 'maxblur' ].value = this.bokehController.maxblur;
        }
        const bokehGUI = this.gui.addFolder( 'Bokeh' );
        const focus = bokehGUI.add(this.bokehController, 'focus', 0.1, 200.0, 0.01);
        focus.onChange(bokehChanger);
        const aperature = bokehGUI.add(this.bokehController, 'aperture', 0.0001, 0.05, 0.0001);
        aperature.onChange(bokehChanger);
        const maxblur = bokehGUI.add(this.bokehController, 'maxblur', 0.0, 0.01, 0.001);
        maxblur.onChange(bokehChanger);

        const outlineGUI1 = this.gui.addFolder('Outline1');
        outlineGUI1.add(this.outline1, 'edgeStrength', 0.01, 10);
        outlineGUI1.add(this.outline1, 'edgeGlow', 0.0, 1);
        outlineGUI1.add(this.outline1, 'edgeThickness', 1, 4);
        outlineGUI1.add(this.outline1, 'pulsePeriod', 0.0, 5);
        outlineGUI1.addColor(this.outline1Colors, 'visibleEdgeColor').onChange((val) => {
            this.outline1.visibleEdgeColor.set(val)
        })
        outlineGUI1.addColor(this.outline1Colors, 'hiddenEdgeColor').onChange((val) => {
            this.outline1.hiddenEdgeColor.set(val)
        })

        const outlineGUI2 = this.gui.addFolder('Outline2');
        outlineGUI2.add(this.outline2, 'edgeStrength', 0.01, 10);
        outlineGUI2.add(this.outline2, 'edgeGlow', 0.0, 1);
        outlineGUI2.add(this.outline2, 'edgeThickness', 1, 4);
        outlineGUI2.add(this.outline2, 'pulsePeriod', 0.0, 5);
        outlineGUI2.addColor(this.outline2Colors, 'visibleEdgeColor').onChange((val) => {
            this.outline2.visibleEdgeColor.set(val)
        })
        outlineGUI2.addColor(this.outline2Colors, 'hiddenEdgeColor').onChange((val) => {
            this.outline2.hiddenEdgeColor.set(val)
        })
    }

    animate() {
        // NOTE: Window is implied.
        // requestAnimationFrame(this.animate.bind(this));
        window.requestAnimationFrame(this.animate.bind(this));
        this.render();
        this.controls.update();
    }

    render() {
        // NOTE: Update uniform data on each render.
        // this.uniforms.u_time.value += this.clock.getDelta();

        // Update raycaster
        this.raycaster.setFromCamera(this.pointer, this.camera);
        this.intersections = this.raycaster.intersectObjects(this.scene.children.filter((child) => !child.layers.isEnabled(1))); //explicity not check any object in layer 1

        if (this.intersections.length != 0) {
            this.hovering[0] = this.intersections[0].object;
            this.outline2.selectedObjects = this.hovering;
        }else {
            this.hovering = [];
            this.outline2.selectedObjects = this.hovering;
        }
        
        if (this.displayMouseIntersection){
            this.renderRayObject();
        }

        // this.renderer.render(this.scene, this.camera);
        this.composer.render(0.1);
    }

    createRayObject() {
        this.rayObject = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshStandardMaterial({color:0xff0000}));
        this.rayObject.visible = false;
        this.rayObject.layers.enable(1); // objects are set to 0 by default
        this.scene.add(this.rayObject);
    }

    renderRayObject() {
        if (this.intersections.length != 0){
            this.rayObject.position.fromArray(this.intersections[0].point.toArray());
            this.rayObject.visible = true;
            this.rayObject.updateMatrixWorld();
        }else {
            this.rayObject.visible = false;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onPointerMove(event) {
        this.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    onPointerDown(event) {
        if (this.intersections.length != 0) {
            if (this.selectedObjects.length != 0) {
                if (!event.shiftKey){
                    if (this.selectedObjects[0].id == this.intersections[0].object.id){
                        this.selectedObjects = [];
                        this.outline1.selectedObjects = this.selectedObjects;
                    }else {
                        this.selectedObjects = []
                        this.selectedObjects[0] = this.intersections[0].object;
                        this.outline1.selectedObjects = this.selectedObjects;
                    }
                }else {
                    if (this.selectedObjects.reduce((total, current) => {
                        if (current.id == this.intersections[0].object.id){
                            return (total && false)
                        }else {
                            return (total && true)
                        }
                    }, true)){
                        this.selectedObjects.push(this.intersections[0].object);
                        this.outline1.selectedObjects = this.selectedObjects;
                    }
                }
            } else {
                this.selectedObjects[0] = this.intersections[0].object;
                this.outline1.selectedObjects = this.selectedObjects;
            }
        }
    }

    onPointerUp(event) {
    }

    onKeyUp(event) {
        switch (event.keyCode){
            case 32:
                if (this.selectedObjects.length != 0) {
                    this.controls.target.copy(this.selectedObjects[0].position);
                }
                break;
            case 27:
                this.selectedObjects = []
                this.outline1.selectedObjects = this.selectedObjects;
                break;
            default:
                break;
        }
    }

    onCameraChange(event) {
        this.camera.updateProjectionMatrix(); //need to call this everytime camera params change
    }

    createPositionMeshControls(obj, name, resetButton = false) {
        const controls = this.gui.addFolder(name + ' -> id:' + obj.id);
        const x = controls.add(obj.position, 'x');
        const y = controls.add(obj.position, 'y');
        const z = controls.add(obj.position, 'z');

        if (resetButton) {
            const reset = {
                Reset: () => {
                    x.reset();
                    y.reset();
                    z.reset();
                }
            }
            controls.add(reset, 'Reset');
        }
    }

    createBox(x,y,z,color=0xffffff,w=2,h=2,d=2) {
        const obj = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color: color}));
        obj.position.set(x,y,z);
        this.scene.add(obj);
        return obj;
    }

    createSphere(x,y,z,color=0xffffff,r=2,vertSeg=16,horzSeg=16) {
        const obj = new THREE.Mesh(new THREE.SphereGeometry(r,vertSeg,horzSeg), new THREE.MeshStandardMaterial({color: color}));
        obj.position.set(x,y,z);
        this.scene.add(obj);
        return obj;
    }
}
