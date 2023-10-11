'use client'

//General Imports
import * as THREE from 'three'
import { useEffect, useState } from "react"

//Libraries
import ThreeScene from './lib/SceneInit'

//Components
import DataGUI from "./dataController"

export default function Visualization() {
    const [data, setData] = useState(null);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        // SCENE SET-UP
        const world = new ThreeScene('threeJSCanvas');
        world.initialize();
        world.animate();

        const earth = world.createSphere(0,0,0,0xffffff,6.374,128,128);
        const earthTexture = world.texLoader.load('/daymap.jpg');
        const earthDisplacement = world.texLoader.load('/heightmap.png');
        const earthNormal = world.texLoader.load('/earthnormal.jpg');
        earth.material.displacementMap = earthDisplacement;
        earth.material.normalMap = earthNormal;
        earth.material.normalScale = new THREE.Vector2(0,0.2);
        earth.material.displacementScale = 0.15;
        earth.material.displacementBias = 0.05;
        earth.material.map = earthTexture; // +Z axis in three is equal to 0 latitude and -90 longitude (west)
        earth.material.map.mapping = THREE.EquirectangularRefractionMapping;
        // earth.material.map.mapping = THREE.
        // However the calulated cartesian coordinates from the dataset assumes +X axis goes through 0 long and 0 lat (prime meridian), +Z goes through the poles, and +Y goes through 0 lat and 90 long (east)
        world.createPositionMeshControls(earth, 'Earth', true);

        // FETCHING DATA
        const fetchData = async () => {
            const data = await fetch('/python/satellites');
            const json = await data.json();
            setData(json);
            console.log(json);
            json.forEach(element => {
                world.createSphere(element.XS, element.ZS, -element.YS, 0xffffff, 0.1, 4, 4)
            });
        }
        fetchData()
            .catch(console.error);

        const fetchSpaceData = async () => {
            const data = await fetch('/python/spacestations');
            const json = await data.json();
            setData(json);
            console.log(json);
            json.forEach(element => {
                world.createSphere(element.XS, element.ZS, -element.YS, 0xff0000, 0.5, 2, 2)
            });
        }
        fetchSpaceData()
            .catch(console.error);

    }, [])
    

    return (
        <div class='w-full h-full'>
            <div class='absolute top-0 left-0 z-50 w-1/5 h-fit bg-slate-300 p-4 m-4 rounded-lg min-w-fit  max-md:hidden'>
                <ul class='relative w-full h-full'>
                    {data ? <DataGUI loaded={true} />: <DataGUI/>}
                </ul>
            </div>
            <canvas id="threeJSCanvas" class='w-full h-full'/>
        </div>
    )
}