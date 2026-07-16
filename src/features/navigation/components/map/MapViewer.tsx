import React, { Suspense, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { OrbitControls } from "@react-three/drei/native";
import * as THREE from "three";
import { useNavigationStore } from "../../store/useNavigationStore";
import { FloorRenderer } from "./FloorRenderer";
import { useBuildingMap } from "../../hooks/useBuildingMap";

function CameraController() {
  const { viewMode } = useNavigationStore();
  const { camera, controls } = useThree();

  const lastValidPosition = useRef(new THREE.Vector3());
  const lastValidTarget = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);

  useEffect(() => {
    const ctrl = controls as any;
    if (ctrl) {
      ctrl.target.set(0, 0, 0);
      ctrl.reset();
    }

    if (viewMode === "2D") {
      // 2D orthographic-like top down perspective
      camera.position.set(0, 85, 0.1);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    } else {
      // 3D angled perspective
      camera.position.set(0, 45, 65);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    }

    if (ctrl) {
      ctrl.update();
      lastValidTarget.current.copy(ctrl.target);
    }
    lastValidPosition.current.copy(camera.position);
    isInitialized.current = true;
  }, [viewMode, camera, controls]);

  useFrame(() => {
    if (!isInitialized.current) return;

    const ctrl = controls as any;
    const p = camera.position;

    // Safety guard to avoid NaN/Infinity coordinates crash
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
  const { activeFloor, viewMode } = useNavigationStore();
  const { data, loading, error } = useBuildingMap(activeFloor);

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
            castShadow
          />

          <group position={[0, -activeFloor * 8, 0]}>
            {/* Renders the dynamic floor levels */}
            <FloorRenderer floorLevel={1} activeFloor={activeFloor} />
          </group>

          <CameraController />
        </Suspense>

        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={viewMode === "2D" ? 0.01 : Math.PI / 2.1}
          enableRotate={viewMode === "3D"}
          enableZoom={true}
          enablePan={true}
          maxDistance={120}
          minDistance={15}
          zoomSpeed={0.8}
          rotateSpeed={0.9}
          panSpeed={1.0}
          enableDamping={true}
          dampingFactor={0.15}
        />
      </Canvas>

      {/* Floor Indicator Overlay */}
      <View style={styles.floorIndicator}>
        <View style={styles.pulseDot} />
        <Text style={styles.floorText}>Tầng {activeFloor}</Text>
      </View>
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
  floorIndicator: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginRight: 8,
  },
  floorText: {
    fontWeight: "700",
    color: "#1E293B",
    fontSize: 13,
  },
});
