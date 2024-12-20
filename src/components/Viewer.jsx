import { useContext, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { FlyControls, Splat } from "@react-three/drei";
import { GlobalVariablesContext } from "../../GlobalVariables";
import PIPCameraControls from "./playerControls/PIPCameraControls";
import { Vector3, Euler, Quaternion, ArrowHelper } from "three";
import TouchPIPControls from "./playerControls/TouchPIPControls";
import { useNavigate } from "react-router-dom";
import { RxEnterFullScreen, RxExitFullScreen } from "react-icons/rx";

function Viewer() {
  const { splatFile, boundaryData, deviceType, setDeviceType } = useContext(
    GlobalVariablesContext
  );
  const [screenHeight, setScreenHeight] = useState("100vh");
  const navigate = useNavigate();

  
  const [cameraFocalLength, setCameraFocalLength] = useState(110); // Set your camera's initial focal length
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [boundaryScale, setBoundaryScale] = useState(1);
  
  const [centroid, setCentroid] = useState({ x: 0, y: 0 }); 
  const [inclination, setInclination] = useState(new Euler());
  const boxRef = useRef();
  const splatRef = useRef();

  const [p1, setP1] = useState(new Vector3());
  const [p2, setP2] = useState(new Vector3());
  const [p3, setP3] = useState(new Vector3());

  // mobile fps
  const [tapType, setTapType] = useState(null);
  const [moveCamera, setMoveCamera] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  

  useEffect(() => {
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent;
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        )
      ) {
        setDeviceType("mobile");
        setScreenHeight("85vh");
      } else {
        setDeviceType("desktop");
        setScreenHeight("100vh");
      }
    };
    detectDeviceType();
    // Add event listener for orientation change, if needed
    window.addEventListener("orientationchange", detectDeviceType);
    return () => {
      window.removeEventListener("orientationchange", detectDeviceType);
    };
  }, []);

  // Full screen
  const [fullScreen, setFullScreen] = useState(false);
  useEffect(()=>{      
    var elem = document.getElementById("canvas-full");
    if(fullScreen){
      // setShowColmapValue(false)
      // if(env==="development"){
        // set({showColmap:false})
        // setShowColmap(false)
      // }
      
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
    }

    // Add an event listener for fullscreen changes
    document.addEventListener('fullscreenchange', (event) => {
      // Check if the document is no longer in fullscreen mode
      if (!document.fullscreenElement) {
        // Call your custom function
        // if(env==="development"){
          // set({showColmap:true})
          // setShowColmap(true)
        // }
        
        setFullScreen(false)
      }
    });

    // Similarly handle webkit and ms prefixes if needed
    document.addEventListener('webkitfullscreenchange', (event) => {
      if (!document.webkitIsFullScreen) {
        setFullScreen(false)
      }
    });

    document.addEventListener('MSFullscreenChange', (event) => {
      if (!document.msFullscreenElement) {
        setFullScreen(false)
      }
    });
  },[fullScreen])
  
  const handleFullscreen = () => {
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE11 */
        document.msExitFullscreen();
      }
    }
    setFullScreen((prevFullScreen) => !prevFullScreen);
  };

  

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
      // const scene2 = splatRef.current;

      // Visualize the up and normal vectors
      // const scene = boxRef.current;
      // const origin = new Vector3(centroid.x, centroid.y, centroid.z);

      // Arrow for the normal vector
      // const normalArrow = new ArrowHelper(normal, origin, 2, "cyan");
      // scene.add(normalArrow);

      // Arrow for the global up vector
      // const upArrow = new ArrowHelper(up, origin, 5, "blue");
      // scene.add(upArrow);

      // Arrow for the splat up vector
      // const upArrow2 = new ArrowHelper(up, origin, 5, "pink");
      // scene2.add(upArrow2)
      // Visualize v1 and v2
      // const v1Arrow = new ArrowHelper(
      //   v1.normalize(),
      //   p1,
      //   v1.length(),
      //   0x0000ff
      // );
      // const v2Arrow = new ArrowHelper(
      //   v2.normalize(),
      //   p2,
      //   v2.length(),
      //   0xff00ff
      // );
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
    if (!splatFile) {
      navigate("/");
    }
  }, [splatFile, boundaryData]);

  function getDistance(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Function to handle touch start
  const handleTouchStart = (event) => {
    setIsTouching(true);
    console.log("aa");
    
    if (event.touches.length === 2) {
      // Check if two fingers are used
      const distance = getDistance(event.touches);
      setInitialPinchDistance(distance);
      // setIsTouching(true);
    }

    if (event.touches.length === 1) {
      setTouchStart({
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      });
      setTouchEnd({
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      });
      setHasMoved(false);
    }
  };

  // Function to handle touch move
  const handleTouchMove = (event) => {
    if (isTouching && event.touches.length === 2) {
      const currentDistance = getDistance(event.touches);
      if (initialPinchDistance) {
        var scale =
          currentDistance < initialPinchDistance
            ? currentDistance / initialPinchDistance
            : -currentDistance / initialPinchDistance;
        setInitialPinchDistance(currentDistance);
        var newFocalLength = cameraFocalLength + scale; // Adjust scale factor according to your camera setup
        if (newFocalLength < 40) {
          newFocalLength = 40;
        } else if (newFocalLength > 110) {
          newFocalLength = 110;
        }
        setCameraFocalLength(newFocalLength);
      }
    }

    if (isTouching && event.touches.length === 1) {
      const newTouchEnd = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
      if (
        Math.abs(newTouchEnd.x - touchStart.x) > 2 ||
        Math.abs(newTouchEnd.y - touchStart.y) > 2
      ) {
        setHasMoved(true);
      }
      setTouchEnd(newTouchEnd);
    }
  };

  // Function to handle touch end
  const handleTouchEnd = () => {
    setIsTouching(false);
    setInitialPinchDistance(null);
    setIsTouching(false);
  };

  const clickTimeout = useRef(null);

  const handleClick = () => {
    // Clear any existing timeout to prevent the single click action
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    // Set a timeout to call the single click handler after 300ms
    clickTimeout.current = setTimeout(() => {
      // Your single click logic here
      if (moveCamera) {
        setMoveCamera(false);
        return;
      }
      setTapType(1);
      setMoveCamera(true);
    }, 200);
  };

  const handleDoubleClick = () => {
    // Clear the timeout to prevent the single click handler from being called
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    // Your double click logic here
    if (moveCamera) {
      setMoveCamera(false);
      return;
    }
    setTapType(2.5);
    setMoveCamera(true);
  };

  return (
    <div id='canvas-full' className='main-container'>
      <Canvas
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="scene"
        style={{ height: "100vh" }}
      >
        {!boundaryData && <FlyControls rollSpeed={1} speed={10} dragToLook />}

        {boundaryData && (
          <>
            <CameraControls polygon={boundaryData} />
            {deviceType === "desktop" && (
              <PIPCameraControls
                focalLength={cameraFocalLength}
                position={[centroid.x, 10, centroid.y]}
                minPolarAngle={(2 * Math.PI) / 6}
                maxPolarAngle={(2 * Math.PI) / 3}
                speed={100}
                height={0}
              />
            )}
            {deviceType === "mobile" && (
              <TouchPIPControls
                focalLength={cameraFocalLength}
                setTapType={setTapType}
                tapType={tapType}
                setMoveCamera={setMoveCamera}
                moveCamera={moveCamera}
                isTouching={isTouching}
                touchStart={touchStart}
                touchEnd={touchEnd}
                setTouchStart={setTouchStart}
                hasMoved={hasMoved}
              />
            )}
          </>
        )}

        {splatFile && (
          <Splat
            rotation={
              boundaryData
                ? [inclination.x, inclination.y, -inclination.z]
                : [0, 0, 0]
            }
            src={URL.createObjectURL(splatFile)}
          />
        )}

        <mesh ref={boxRef}></mesh>
        <mesh ref={splatRef}></mesh>
      </Canvas>
      <div className="joystick-container">
        {fullScreen && (
          <RxExitFullScreen size={50} onClick={handleFullscreen} />
        )}
        {!fullScreen && (
          <RxEnterFullScreen size={50} onClick={handleFullscreen} />
        )}
      </div>
    </div>
  );
}

export default Viewer;
