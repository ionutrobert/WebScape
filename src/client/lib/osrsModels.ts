import * as THREE from "three";

// OSRS-style rock geometry using multiple merged shapes
export function createRockGeometry(variant: "copper" | "tin" | "iron" | "coal" | "gold" | "mithril" | "adamant" | "rune" = "iron"): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Create multiple overlapping spheres for organic rock shape
  const positions: number[] = [];
  const normals: number[] = [];
  
  // Main body - irregular dodecahedron-like shape
  const mainGeom = new THREE.DodecahedronGeometry(0.4, 0);
  const positions1 = mainGeom.attributes.position.array;
  
  // Deform vertices for irregularity
  for (let i = 0; i < positions1.length; i += 3) {
    const deform = 0.85 + Math.random() * 0.3;
    positions1[i] *= deform;
    positions1[i + 1] *= deform * 0.7; // Flatten slightly
    positions1[i + 2] *= deform;
  }
  mainGeom.computeVertexNormals();
  
  return mainGeom;
}

// OSRS-style tree - more rounded, distinctive shape
export function createTreeGeometry(variant: "normal" | "oak" | "willow" | "maple" | "yew" | "magic" = "normal"): THREE.Group {
  const group = new THREE.Group();
  
  // Trunk - slightly tapered cylinder
  const trunkHeight = variant === "normal" ? 1.0 : 1.3;
  const trunkGeom = new THREE.CylinderGeometry(0.12, 0.18, trunkHeight, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ 
    color: variant === "normal" ? "#5D4037" : "#4E342E",
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);
  
  // Foliage - OSRS has distinct rounded/tree canopy
  const canopyHeight = variant === "normal" ? 1.2 : 1.5;
  const canopyWidth = variant === "normal" ? 1.0 : 1.4;
  
  // Multiple overlapping spheres for organic canopy
  const canopyMat = new THREE.MeshStandardMaterial({
    color: getTreeLeavesColor(variant),
    roughness: 0.8,
  });
  
  // Main canopy sphere
  const mainCanopy = new THREE.Mesh(
    new THREE.SphereGeometry(canopyWidth * 0.5, 12, 10),
    canopyMat
  );
  mainCanopy.position.y = trunkHeight + canopyHeight * 0.35;
  mainCanopy.castShadow = true;
  group.add(mainCanopy);
  
  // Additional canopy puffs for fuller look
  const puffs = [
    { x: 0.25, y: 0.15, z: 0.2, scale: 0.4 },
    { x: -0.3, y: 0.1, z: -0.15, scale: 0.35 },
    { x: 0.1, y: 0.25, z: -0.25, scale: 0.38 },
    { x: -0.2, y: 0.2, z: 0.2, scale: 0.32 },
  ];
  
  puffs.forEach(puff => {
    const puffMesh = new THREE.Mesh(
      new THREE.SphereGeometry(canopyWidth * puff.scale, 8, 6),
      canopyMat
    );
    puffMesh.position.set(
      puff.x * canopyWidth,
      trunkHeight + canopyHeight * puff.scale + puff.y,
      puff.z * canopyWidth
    );
    puffMesh.castShadow = true;
    group.add(puffMesh);
  });
  
  return group;
}

function getTreeLeavesColor(variant: string): string {
  const colors: Record<string, string> = {
    normal: "#228B22",
    oak: "#2E7D32",
    willow: "#4CAF50",
    maple: "#66BB6A",
    yew: "#81C784",
    magic: "#AB47BC", // Purple magical leaves
  };
  return colors[variant] || colors.normal;
}

// OSRS-style depleted tree (stump)
export function createStumpGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
  return geometry;
}

// Player character - more detailed procedural humanoid
export function createPlayerGeometry(): THREE.Group {
  const group = new THREE.Group();
  
  // Body proportions similar to OSRS
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#4169E1" }); // Blue shirt
  const headMat = new THREE.MeshStandardMaterial({ color: "#FFDDBB" }); // Skin tone
  const legMat = new THREE.MeshStandardMaterial({ color: "#2F4F4F" }); // Dark grey pants
  const feetMat = new THREE.MeshStandardMaterial({ color: "#8B4513" }); // Brown boots
  
  // Head - slightly larger relative to body (OSRS style)
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.32, 0.26),
    headMat
  );
  head.position.y = 1.55;
  head.castShadow = true;
  group.add(head);
  
  // Hair/head shape on top
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.28),
    new THREE.MeshStandardMaterial({ color: "#3E2723" }) // Brown hair
  );
  hair.position.set(0, 1.73, -0.02);
  hair.castShadow = true;
  group.add(hair);
  
  // Torso - rectangular like OSRS
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.55, 0.2),
    bodyMat
  );
  torso.position.y = 1.1;
  torso.castShadow = true;
  group.add(torso);
  
  // Left arm
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.45, 0.14),
    bodyMat
  );
  leftArm.position.set(-0.28, 1.1, 0);
  leftArm.castShadow = true;
  group.add(leftArm);
  
  // Right arm
  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.45, 0.14),
    bodyMat
  );
  rightArm.position.set(0.28, 1.1, 0);
  rightArm.castShadow = true;
  group.add(rightArm);
  
  // Left leg
  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.5, 0.16),
    legMat
  );
  leftLeg.position.set(-0.1, 0.55, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);
  
  // Right leg
  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.5, 0.16),
    legMat
  );
  rightLeg.position.set(0.1, 0.55, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);
  
  // Feet
  const leftFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.08, 0.22),
    feetMat
  );
  leftFoot.position.set(-0.1, 0.24, 0.03);
  group.add(leftFoot);
  
  const rightFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.08, 0.22),
    feetMat
  );
  rightFoot.position.set(0.1, 0.24, 0.03);
  group.add(rightFoot);
  
  return group;
}

// Get rock color based on ore type
export function getRockColor(oreType: string, isDepleted: boolean = false): string {
  if (isDepleted) return "#6B7280"; // Grey depleted rock
  
  const colors: Record<string, string> = {
    copper: "#B87333",
    tin: "#A8A9AD",
    iron: "#A19D94",
    coal: "#1A1A1A",
    gold: "#FFD700",
    mithril: "#4FC3F7",
    adamant: "#66BB6A",
    rune: "#42A5F5",
  };
  return colors[oreType] || "#808080";
}

// Get rock height based on tier
export function getRockHeight(oreType: string): number {
  const heights: Record<string, number> = {
    copper: 0.6,
    tin: 0.6,
    iron: 0.7,
    coal: 0.65,
    gold: 0.75,
    mithril: 0.8,
    adamant: 0.85,
    rune: 0.9,
  };
  return heights[oreType] || 0.7;
}
