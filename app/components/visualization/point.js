'use client'
import { useState } from "react";

    export default function Point({ propID, ptColor=0x5920ff, ...props }) {
    const [hovered, setHover] = useState(false)
    const selected = useSelect().map((sel) => sel.userData.propID)
    const isSelected = !!selected.find((sel) => sel === propID)
    useCursor(hovered)
    return (
        <>
            {/* <mesh
                {...props}
                userData={{ propID }}
                onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
                onPointerOut={(e) => setHover(false)}
            >
                <sphereGeometry args={[0.1, 6, 4]}/>
                <meshBasicMaterial color={ptColor}/>
                <Edges visible={isSelected} scale={2} renderOrder={1000}>
                    <meshBasicMaterial transparent color="#39FF14" depthTest={false} />
                </Edges>
            </mesh> */}
        </>
    )
}