import React, { Suspense, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import { OrbitControls } from "@react-three/drei/native";
import { Ionicons } from "@expo/vector-icons";
import * as THREE from "three";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigationStore } from "../../store/useNavigationStore";
import { FloorRenderer } from "./FloorRenderer";
import { useBuildingMap } from "../../hooks/useBuildingMap";

function CameraController({ activeFloor }: { activeFloor: number }) {
  const { camera, controls } = useThree();

  const lastValidPosition = useRef(new THREE.Vector3());
  const lastValidTarget = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);

  const resetToTopDown = () => {
    const ctrl = controls as any;
    if (ctrl) {
      ctrl.target.set(0, 0, 0);
    }

    camera.position.set(0, 180, 0.001);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    if (ctrl) {
      ctrl.update();
      lastValidTarget.current.copy(ctrl.target);
    }
    lastValidPosition.current.copy(camera.position);
  };

  useEffect(() => {
    resetToTopDown();
    isInitialized.current = true;
  }, [camera, controls, activeFloor]);

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

function ScreenMarkerTracker({
  onUpdate,
}: {
  onUpdate: (data: {
    start?: { x: number; y: number; visible: boolean };
    dest?: { x: number; y: number; visible: boolean };
  }) => void;
}) {
  const { camera, size } = useThree();
  const marker3DPositions = useNavigationStore((s) => s.marker3DPositions);

  useFrame(() => {
    if (!marker3DPositions) {
      onUpdate({});
      return;
    }

    const projectPoint = (pt?: { x: number; y: number; z: number }) => {
      if (!pt) return undefined;
      const vec = new THREE.Vector3(pt.x, pt.y, pt.z);
      vec.project(camera);

      if (vec.z > 1) return { x: 0, y: 0, visible: false };

      const x = ((vec.x + 1) * size.width) / 2;
      const y = ((-vec.y + 1) * size.height) / 2;
      return { x, y, visible: true };
    };

    onUpdate({
      start: projectPoint(marker3DPositions.start),
      dest: projectPoint(marker3DPositions.dest),
    });
  });

  return null;
}

interface MapViewerProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function MapViewer({ isFullscreen = false, onToggleFullscreen }: MapViewerProps) {
  const insets = useSafeAreaInsets();
  const { activeFloor, activeBuildingId, startRoom, targetRoom } = useNavigationStore();
  const { data, rawMap, loading, error } = useBuildingMap(activeFloor, activeBuildingId || undefined);
  const controlsRef = useRef<any>(null);
  const [controlMode, setControlMode] = useState<"pan" | "rotate">("pan");
  const [screenMarkers, setScreenMarkers] = useState<{
    start?: { x: number; y: number; visible: boolean };
    dest?: { x: number; y: number; visible: boolean };
  }>({});

  const topOffset = insets.top > 0 ? insets.top + 12 : 52;
  const hasMultipleFloors = !!(rawMap?.floors && rawMap.floors.length > 1);

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
        camera={{ position: [0, 180, 0.001], fov: 50, up: [0, 1, 0] }}
        style={styles.canvas}
        frameloop="demand"
        gl={{ antialias: false, powerPreference: "high-performance" }}
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

          <CameraController activeFloor={activeFloor} />
          <ScreenMarkerTracker onUpdate={setScreenMarkers} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.4}
          enableRotate={controlMode === "rotate"}
          enableZoom={true}
          enablePan={controlMode === "pan"}
          maxDistance={350}
          minDistance={15}
          zoomSpeed={1.8}
          rotateSpeed={1.1}
          panSpeed={1.3}
          enableDamping={true}
          dampingFactor={0.06}
          touches={{
            ONE: controlMode === "pan" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>

      {screenMarkers.start?.visible && startRoom && (
        <View
          pointerEvents="none"
          style={[
            styles.floatingMarkerContainer,
            { left: screenMarkers.start.x, top: screenMarkers.start.y },
          ]}
        >
          <View style={styles.startBadgeTag}>
            <View style={styles.badgeStartDot} />
            <Text style={styles.startBadgeText} numberOfLines={1}>
              {startRoom.roomLabel}
            </Text>
          </View>
        </View>
      )}

      {screenMarkers.dest?.visible && targetRoom && (
        <View
          pointerEvents="none"
          style={[
            styles.floatingMarkerContainer,
            { left: screenMarkers.dest.x, top: screenMarkers.dest.y },
          ]}
        >
          <View style={styles.destBadgeTag}>
            <View style={styles.badgeDestDot} />
            <Text style={styles.destBadgeText} numberOfLines={1}>
              {targetRoom.roomLabel}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.toggleContainer, { top: topOffset, right: hasMultipleFloors ? 72 : 16 }]}>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            controlMode === "pan" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => setControlMode("pan")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="hand-left-outline"
            size={20}
            color={controlMode === "pan" ? "#ffffff" : "#4b5563"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            controlMode === "rotate" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => setControlMode("rotate")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sync-outline"
            size={20}
            color={controlMode === "rotate" ? "#ffffff" : "#4b5563"}
          />
        </TouchableOpacity>

        {onToggleFullscreen && (
          <TouchableOpacity
            style={[styles.toggleButton, styles.inactiveButton]}
            onPress={onToggleFullscreen}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFullscreen ? "contract" : "scan-outline"}
              size={20}
              color="#2563EB"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    position: "relative",
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
  toggleContainer: {
    position: "absolute",
    flexDirection: "column",
    gap: 8,
    zIndex: 30,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  activeButton: {
    backgroundColor: "#3b82f6",
  },
  inactiveButton: {
    backgroundColor: "#ffffff",
  },
  floatingMarkerContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    transform: [{ translateX: -80 }, { translateY: -40 }],
  },
  startBadgeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#166534",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  destBadgeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#991B1B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeStartDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  badgeDestDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F87171",
  },
  startBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  destBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
