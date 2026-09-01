import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber/native";
import { useNavigationStore } from "../../store/useNavigationStore";

interface RoutePathProps {
  path: any[] | undefined | null;
  centerShiftX: number;
  centerShiftZ: number;
  activeFloor: number;
}

/**
 * Creates 3D Navigation Arrow Pointer Geometry (Gấp đôi kích thước)
 */
function createGoogleMapsArrowGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Đỉnh nhọn phía trước (+Y) - Kích thước lớn x2
  shape.moveTo(0, 2.6);
  shape.lineTo(1.4, -1.4);     // Góc phải sau
  shape.lineTo(0, -0.6);       // Hõm đuôi giữa
  shape.lineTo(-1.4, -1.4);    // Góc trái sau
  shape.closePath();

  const extrudeSettings = {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Traveling 3D Navigation Arrow Pointer
 * - Thuần 1 màu TRẮNG tinh khiết (#FFFFFF)
 * - Không viền màu, không vòng sáng / không nhiễu
 * - Kích thước to x2, tốc độ chậm êm đềm
 */
function GoogleMapsTravelingArrow({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const arrowGroupRef = useRef<THREE.Group>(null);
  const arrowGeometry = useMemo(() => createGoogleMapsArrowGeometry(), []);

  useFrame((state) => {
    if (!arrowGroupRef.current || !curve) return;

    const speed = 0.10;
    const t = (state.clock.getElapsedTime() * speed) % 1.0;

    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    // Nâng mũi tên lên 0.45 để nổi rõ ràng trên mặt sàn và đường ống
    arrowGroupRef.current.position.set(position.x, position.y + 0.45, position.z);

    // Xoay hướng mũi nhọn chuẩn xác theo tiếp tuyến lộ trình
    const arrowForward = new THREE.Vector3(0, 0, -1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(arrowForward, tangent);
    arrowGroupRef.current.quaternion.copy(quaternion);

    state.invalidate();
  });

  return (
    <group ref={arrowGroupRef}>
      {/* Mũi tên 3D thuần màu Trắng tinh, sắc nét, không viền, không nhiễu */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={arrowGeometry}>
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Start (Green Beacon) & Destination (Red Pin) 3D Markers on Map
 */
function RouteMarkers({
  startPoint,
  endPoint,
}: {
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
}) {
  const startRippleRef = useRef<THREE.MeshBasicMaterial>(null);
  const endRippleRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (startRippleRef.current) {
      startRippleRef.current.opacity = 0.45 + Math.sin(time * 4) * 0.4;
    }
    if (endRippleRef.current) {
      endRippleRef.current.opacity = 0.45 + Math.sin(time * 4 + Math.PI) * 0.4;
    }
    state.invalidate();
  });

  return (
    <group>
      {/* 🟢 ĐIỂM XUẤT PHÁT: Ghim cột xanh lá + Cột cờ xuất phát 3D */}
      <group position={[startPoint.x, startPoint.y, startPoint.z]}>
        {/* Cột trụ */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.6, 12]} />
          <meshBasicMaterial color="#15803D" />
        </mesh>
        {/* Chấm tròn tâm */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#22C55E" />
        </mesh>
        {/* Vòng sóng */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 1.2, 24]} />
          <meshBasicMaterial ref={startRippleRef} color="#4ADE80" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 🔴 ĐIỂM ĐẾN: Ghim đích đỏ to + Cột cờ đích 3D */}
      <group position={[endPoint.x, endPoint.y, endPoint.z]}>
        {/* Cột trụ đích */}
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2.0, 12]} />
          <meshBasicMaterial color="#991B1B" />
        </mesh>
        {/* Ghim đích hình nón chúc xuống */}
        <mesh position={[0, 1.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.6, 1.3, 16]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#DC2626" />
        </mesh>
        {/* Vòng tròn đích */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 1.4, 24]} />
          <meshBasicMaterial ref={endRippleRef} color="#F87171" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Renders the 3D route paths as a glowing neon tube with Google Maps-style navigation arrow and markers.
 */
export function RoutePath({ path, centerShiftX, centerShiftZ, activeFloor }: RoutePathProps) {
  const setMarker3DPositions = useNavigationStore((s) => s.setMarker3DPositions);

  const { tubeGeometry, curve, startPoint, endPoint } = useMemo(() => {
    if (!path || path.length < 2) {
      return { tubeGeometry: null, curve: null, startPoint: null, endPoint: null };
    }

    let floorNodes = path.filter((node: any) => {
      if (node.floorNumber !== undefined) {
        return Number(node.floorNumber) === Number(activeFloor);
      }
      return true;
    });

    if (floorNodes.length < 2) {
      floorNodes = path;
    }

    if (floorNodes.length < 2) {
      return { tubeGeometry: null, curve: null, startPoint: null, endPoint: null };
    }

    const points = floorNodes.map((node: any) => {
      const [lng, lat] = node.coords;
      const x = lng * 111320 - centerShiftX;
      const z = -(lat * 110540) - centerShiftZ;
      return new THREE.Vector3(x, 0.3, z);
    });

    const uniquePoints: THREE.Vector3[] = [];
    points.forEach((p) => {
      if (uniquePoints.length === 0) {
        uniquePoints.push(p);
      } else {
        const prev = uniquePoints[uniquePoints.length - 1];
        if (p.distanceTo(prev) > 0.01) {
          uniquePoints.push(p);
        }
      }
    });

    if (uniquePoints.length < 2) {
      return { tubeGeometry: null, curve: null, startPoint: null, endPoint: null };
    }

    try {
      const createdCurve = new THREE.CatmullRomCurve3(uniquePoints);
      const createdTube = new THREE.TubeGeometry(createdCurve, 64, 0.35, 8, false);
      return {
        tubeGeometry: createdTube,
        curve: createdCurve,
        startPoint: uniquePoints[0],
        endPoint: uniquePoints[uniquePoints.length - 1],
      };
    } catch (e) {
      console.warn("Lỗi dựng RoutePath TubeGeometry:", e);
      return { tubeGeometry: null, curve: null, startPoint: null, endPoint: null };
    }
  }, [path, centerShiftX, centerShiftZ, activeFloor]);

  // Cập nhật tọa độ 3D của Điểm Xuất Phát và Điểm Đến
  useEffect(() => {
    if (startPoint && endPoint) {
      setMarker3DPositions({
        start: { x: startPoint.x, y: startPoint.y + 1.2, z: startPoint.z },
        dest: { x: endPoint.x, y: endPoint.y + 2.0, z: endPoint.z },
      });
    } else {
      setMarker3DPositions(null);
    }
    return () => setMarker3DPositions(null);
  }, [startPoint, endPoint]);

  if (!tubeGeometry || !curve || !startPoint || !endPoint) return null;

  return (
    <group>
      {/* Ống dẫn đường màu xanh cố định */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Con trỏ điều hướng 3D thuần màu Trắng tinh */}
      <GoogleMapsTravelingArrow curve={curve} />

      {/* Ghim 3D Điểm Đi và Điểm Đến */}
      <RouteMarkers startPoint={startPoint} endPoint={endPoint} />
    </group>
  );
}
