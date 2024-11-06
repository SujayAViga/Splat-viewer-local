import { useContext, useEffect, useState, useRef } from "react";
import { Canvas,useFrame } from "@react-three/fiber";
import { FlyControls, Splat } from "@react-three/drei";
import { GlobalVariablesContext } from "../../GlobalVariables";
import PIPCameraControls from "./playerControls/PIPCameraControls";
import { Vector3, Euler, Quaternion, ArrowHelper } from "three";

function Viewer() {
  const { splatFile, boundaryData } = useContext(GlobalVariablesContext);

  const [centroid, setCentroid] = useState({ x: 0, y: 0 });
  const [cameraFocalLength, setCameraFocalLength] = useState(110); // Set your camera's initial focal length
  const [boundaryScale, setBoundaryScale] = useState(1);
  const [p1, setP1] = useState(new Vector3());
  const [p2, setP2] = useState(new Vector3());
  const [p3, setP3] = useState(new Vector3());
  const [inclination, setInclination] = useState(new Euler());
  const boxRef = useRef();
  const splatRef = useRef();

  useEffect(() => {
    if (boundaryData) {
      // Calculate centroid
      const total = boundaryData.reduce(
        (acc, vertex) => {
          acc.x += vertex.x;
          acc.y += vertex.y;
          acc.z += vertex.z;
          return acc;
        },
        { x: 0, y: 0, z: 0 }
      );
      const centroid = {
        x: total.x / boundaryData.length,
        y: total.z / boundaryData.length,
        z: total.y / boundaryData.length,
      };
      setCentroid(centroid);
      // Calculate normal vector using first three points
      const p1 = new Vector3(
        boundaryData[0].x * boundaryScale,
        boundaryData[0].z * boundaryScale,
        boundaryData[0].y * boundaryScale
      );
      const p2 = new Vector3(
        boundaryData[5].x * boundaryScale,
        boundaryData[5].z * boundaryScale,
        boundaryData[5].y * boundaryScale
      );
      const p3 = new Vector3(
        boundaryData[10].x * boundaryScale,
        boundaryData[10].z * boundaryScale,
        boundaryData[10].y * boundaryScale
      );

      setP1(p1);
      setP2(p2);
      setP3(p3);

      const v1 = new Vector3().subVectors(p2, p1);
      const v2 = new Vector3().subVectors(p3, p1);
      const normal = new Vector3().crossVectors(v1, v2).normalize();
      // Calculate the quaternion to rotate the normal to align with the y-axis
      const up = new Vector3(0, 1, 0);

      // Check if normal is closer to up or down vector
      const dotProduct = normal.dot(up);
      let target = up;
      if (dotProduct < 0) {
        // Normal is closer to the down vector, flip the target
        target = new Vector3(0, -1, 0);
      }

      const quaternion = new Quaternion().setFromUnitVectors(normal, target);
      const euler = new Euler().setFromQuaternion(quaternion);

      // Calculate the inclination angle with the x-z plane (y-axis)

      // const inclinationAngle = Math.acos(Math.abs(normal.y));
      setInclination(euler);
      if (splatRef.current) {
        splatRef.current.quaternion.copy(quaternion);
      }
      const scene2 = splatRef.current;

      // Visualize the up and normal vectors
      const scene = boxRef.current;
      const origin = new Vector3(centroid.x, centroid.y, centroid.z);

      // Arrow for the normal vector
      const normalArrow = new ArrowHelper(normal, origin, 2, "cyan");
      // scene.add(normalArrow);

      // Arrow for the global up vector
      const upArrow = new ArrowHelper(up, origin, 5, "blue");
      // scene.add(upArrow);

      // Arrow for the splat up vector
      const upArrow2 = new ArrowHelper(up, origin, 5, "pink");
      // scene2.add(upArrow2)
      // Visualize v1 and v2
      const v1Arrow = new ArrowHelper(
        v1.normalize(),
        p1,
        v1.length(),
        0x0000ff
      );
      const v2Arrow = new ArrowHelper(
        v2.normalize(),
        p2,
        v2.length(),
        0xff00ff
      );
      // scene.add(v1Arrow);
      // scene.add(v2Arrow);
    }
  }, [boundaryData]);

  function isPointInPolygon(point, polygon) {
    let x = point.x,
      y = -point.y;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let xi = polygon[i].x,
        yi = polygon[i].y;
      let xj = polygon[j].x,
        yj = polygon[j].y;
      let intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function scalePolygon(polygon, scale) {
    return polygon.map((vertex) => ({
      x: vertex.x * scale,
      y: vertex.y * scale,
    }));
  }

  const previousPosition = useRef({ x: 0, y: 0, z: 0 });

  function CameraControls({ polygon }) {
    useFrame((state) => {
      let newPosition = state.camera.position.clone();
      state.camera.position.set(
        state.camera.position.x,
        0,
        state.camera.position.x
      );
      const point = { x: newPosition.x + 0.2, y: newPosition.z + 0.2 }; // Adjust depending on your coordinate system
      const scaledPolygon = scalePolygon(polygon, boundaryScale);
      if (isPointInPolygon(point, scaledPolygon)) {
        previousPosition.current = newPosition.clone();
      } else {
        newPosition = previousPosition.current;
      }
      state.camera.position.copy(newPosition);
    });
    return null;
  }

  useEffect(() => {
    console.log(splatFile, boundaryData);
  }, [splatFile, boundaryData]);

  return (
    <Canvas>
      {!boundaryData && (
        <FlyControls rollSpeed={1} speed={10} />
      )}

      {boundaryData &&
       <CameraControls polygon={boundaryData} />
       }
       
       {boundaryData && (
        <PIPCameraControls
          focalLength={cameraFocalLength}
          position={[centroid.x, 10, centroid.y]}
          minPolarAngle={(2 * Math.PI) / 6}
          maxPolarAngle={(2 * Math.PI) / 3}
          speed={100}
          height={0}
        />
      )}

      {splatFile && (
        <Splat
          rotation={boundaryData ? [inclination.x, inclination.y, -inclination.z] : [0,0,0]}
          src={URL.createObjectURL(splatFile)}
        />
      )}

      <mesh ref={boxRef}></mesh>
      <mesh ref={splatRef}></mesh>

      {/* <group>
        {boundaryData &&
          boundaryData.map((vertex, index) => (
            <mesh
              key={index}
              position={[
                vertex.x * boundaryScale,
                0 * vertex.z * boundaryScale,
                -vertex.y * boundaryScale,
              ]}
            >
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color="red" />
            </mesh>
          ))}
      </group>

      <group>
        {boundaryData && (
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={Float32Array.from(
                  boundaryData.flatMap((vertex, index, array) => {
                    const nextVertex = array[(index + 1) % array.length];
                    return [
                      vertex.x * boundaryScale,
                      0 * vertex.z * boundaryScale,
                      -vertex.y * boundaryScale,
                      nextVertex.x * boundaryScale,
                      0 * nextVertex.z * boundaryScale,
                      -nextVertex.y * boundaryScale,
                    ];
                  })
                )}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="red" />
          </line>
        )}
      </group> */}
    </Canvas>
  );
}

export default Viewer;
