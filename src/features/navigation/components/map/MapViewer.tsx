import React, { Suspense, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { OrbitControls } from "@react-three/drei/native";
import * as THREE from "three";
import { useNavigationStore } from "../../store/useNavigationStore";
import { FloorRenderer } from "./FloorRenderer";
import { useBuildingMap } from "../../hooks/useBuildingMap";

function CameraController() {
  const { camera, controls, gl } = useThree();

  const lastValidPosition = useRef(new THREE.Vector3());
  const lastValidTarget = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);

  useEffect(() => {
    const ctrl = controls as any;
    if (ctrl) {
      ctrl.target.set(0, 0, 0);
      ctrl.reset();
    }

    
    camera.position.set(0, 45, 65);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    if (ctrl) {
      ctrl.update();
      lastValidTarget.current.copy(ctrl.target);
    }
    lastValidPosition.current.copy(camera.position);
    isInitialized.current = true;
  }, [camera, controls]);

  
  useEffect(() => {
    const el = gl.domElement as any;
    if (el && el.addEventListener) {
      const handleTouchEnd = (e: any) => {
        const activeTouches = e.touches ? e.touches.length : 0;
        const ctrl = controls as any;
        if (activeTouches < 2 && ctrl) {
          if (ctrl.pointers) {
            ctrl.pointers = [];
          }
          ctrl.state = -1; 
        }
      };

      el.addEventListener("touchend", handleTouchEnd);
      el.addEventListener("touchcancel", handleTouchEnd);

      return () => {
        el.removeEventListener("touchend", handleTouchEnd);
        el.removeEventListener("touchcancel", handleTouchEnd);
      };
    }
  }, [gl, controls]);

  useFrame(() => {
    if (!isInitialized.current) return;

    const ctrl = controls as any;
    const p = camera.position;

    const isPosValid =
      !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z) && isFinite(p.x) && isFinite(p.y) && isFinite(p.z);

    let isTgtValid = true;
    if (ctrl) {
      const t = ctrl.target;
      isTgtValid =
        !isNaN(t.x) && !isNaN(t.y) && !isNaN(t.z) && isFinite(t.x) && isFinite(t.y) && isFinite(t.z);
    }

    if (isPosValid && isTgtValid) {
      lastValidPosition.current.copy(p);
      if (ctrl) {
        lastValidTarget.current.copy(ctrl.target);
      }
    } else {
      camera.position.copy(lastValidPosition.current);
      if (ctrl) {
        ctrl.target.copy(lastValidTarget.current);
        ctrl.update();
      }
    }
  });

  return null;
}

export function MapViewer() {
  const { activeFloor, activeBuildingId } = useNavigationStore();
  const { data, loading, error } = useBuildingMap(activeFloor, activeBuildingId || undefined);

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải sơ đồ bệnh viện 3D...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Lỗi: Không thể tải sơ đồ.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [0, 45, 65], fov: 45 }}
        style={styles.canvas}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.75} />
          <directionalLight
            position={[10, 30, 20]}
            intensity={1.2}
          />

          <group position={[0, 0, 0]}>
            <FloorRenderer floorLevel={activeFloor} activeFloor={activeFloor} />
          </group>

          <CameraController />
        </Suspense>

        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.1}
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          maxDistance={120}
          minDistance={15}
          zoomSpeed={1.8}
          rotateSpeed={1.1}
          panSpeed={1.3}
          enableDamping={true}
          dampingFactor={0.06}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
