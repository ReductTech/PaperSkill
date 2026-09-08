import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Box,
  Crosshair,
  Layers3,
  Network,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { WidgetProps } from './registry';

type Family = '上衣' | '鞋履' | '包袋';
type LabMode = 'space' | 'knn' | 'pagerank' | 'kcore' | 'cc';

type LabNode = {
  id: number;
  label: string;
  family: Family;
  position: [number, number, number];
  hidden: [number, number, number];
};

type GraphEdge = {
  from: number;
  to: number;
  distance: number;
  weight: number;
};

type GraphModel = {
  nodes: LabNode[];
  edges: GraphEdge[];
  neighbors: number[][];
  inDegree: number[];
  coreness: number[];
  cc: number[];
  ccPairs: number[];
  pageRank: number[][];
  maxCore: number;
};

const familyColors: Record<Family, string> = {
  上衣: '#4db6ac',
  鞋履: '#ff8a65',
  包袋: '#ffd166',
};

const nodes: LabNode[] = [
  { id: 0, label: '经典短袖', family: '上衣', position: [-1.34, 0.02, 0.08], hidden: [-0.92, -0.20, 0.08] },
  { id: 1, label: '圆领上衣', family: '上衣', position: [-1.12, 0.15, 0.18], hidden: [-0.86, -0.12, 0.13] },
  { id: 2, label: '运动上衣', family: '上衣', position: [-1.53, 0.20, 0.16], hidden: [-0.98, -0.16, 0.03] },
  { id: 3, label: '修身上衣', family: '上衣', position: [-1.30, -0.20, 0.20], hidden: [-0.88, -0.31, 0.12] },
  { id: 4, label: '宽松上衣', family: '上衣', position: [-1.42, -0.10, -0.18], hidden: [-1.03, -0.23, -0.06] },
  { id: 5, label: '长袖上衣', family: '上衣', position: [-0.98, -0.16, -0.10], hidden: [-0.77, -0.36, -0.03] },
  { id: 6, label: '印花上衣', family: '上衣', position: [-1.72, -0.04, -0.08], hidden: [-1.12, -0.25, 0.02] },
  { id: 7, label: '拼接上衣', family: '上衣', position: [-1.94, 0.39, 0.30], hidden: [-1.32, 0.02, 0.20] },
  { id: 8, label: '异形上衣', family: '上衣', position: [-2.26, 0.72, 0.48], hidden: [-1.62, 0.27, 0.42] },

  { id: 9, label: '经典跑鞋', family: '鞋履', position: [1.18, -0.02, 0.04], hidden: [0.86, -0.34, 0.16] },
  { id: 10, label: '低帮运动鞋', family: '鞋履', position: [0.96, 0.12, 0.14], hidden: [0.78, -0.22, 0.22] },
  { id: 11, label: '轻量跑鞋', family: '鞋履', position: [1.40, 0.17, 0.09], hidden: [0.96, -0.18, 0.12] },
  { id: 12, label: '板鞋', family: '鞋履', position: [1.25, -0.23, 0.23], hidden: [0.90, -0.44, 0.25] },
  { id: 13, label: '帆布鞋', family: '鞋履', position: [1.11, -0.18, -0.21], hidden: [0.79, -0.41, -0.08] },
  { id: 14, label: '休闲鞋', family: '鞋履', position: [1.55, -0.11, -0.16], hidden: [1.08, -0.38, -0.02] },
  { id: 15, label: '厚底鞋', family: '鞋履', position: [0.80, -0.05, -0.10], hidden: [0.65, -0.32, 0.00] },
  { id: 16, label: '高帮鞋', family: '鞋履', position: [1.82, 0.34, 0.29], hidden: [1.31, -0.02, 0.36] },
  { id: 17, label: '异形鞋', family: '鞋履', position: [2.18, 0.67, 0.46], hidden: [1.60, 0.29, 0.57] },

  { id: 18, label: '经典托特包', family: '包袋', position: [-0.05, 1.22, -0.52], hidden: [0.02, 0.98, -0.56] },
  { id: 19, label: '小挎包', family: '包袋', position: [0.12, 1.35, -0.42], hidden: [0.10, 1.03, -0.49] },
  { id: 20, label: '邮差包', family: '包袋', position: [-0.20, 1.39, -0.39], hidden: [-0.08, 1.08, -0.45] },
  { id: 21, label: '腰包', family: '包袋', position: [0.02, 1.08, -0.35], hidden: [0.04, 0.89, -0.42] },
  { id: 22, label: '单肩包', family: '包袋', position: [0.19, 1.13, -0.65], hidden: [0.13, 0.91, -0.62] },
  { id: 23, label: '手提包', family: '包袋', position: [-0.25, 1.13, -0.67], hidden: [-0.12, 0.94, -0.64] },
  { id: 24, label: '双肩包', family: '包袋', position: [0.34, 1.58, -0.28], hidden: [0.29, 1.24, -0.31] },
  { id: 25, label: '购物袋', family: '包袋', position: [-0.43, 1.70, -0.20], hidden: [-0.34, 1.38, -0.18] },
  { id: 26, label: '异形包', family: '包袋', position: [-0.73, 2.02, 0.04], hidden: [-0.60, 1.70, 0.09] },
];

function featureVector(node: LabNode) {
  return [...node.position, ...node.hidden];
}

function euclidean(a: LabNode, b: LabNode) {
  const av = featureVector(a);
  const bv = featureVector(b);
  return Math.sqrt(av.reduce((sum, value, index) => sum + (value - bv[index]) ** 2, 0));
}

function computeCoreness(nodeCount: number, edges: GraphEdge[]) {
  const active = Array.from({ length: nodeCount }, () => true);
  const incoming = Array.from({ length: nodeCount }, () => 0);
  const outgoing = Array.from({ length: nodeCount }, () => [] as number[]);
  edges.forEach((edge) => {
    incoming[edge.to] += 1;
    outgoing[edge.from].push(edge.to);
  });
  const coreness = Array.from({ length: nodeCount }, () => 0);
  let runningCore = 0;
  for (let removed = 0; removed < nodeCount; removed += 1) {
    let candidate = -1;
    let minimum = Number.POSITIVE_INFINITY;
    for (let id = 0; id < nodeCount; id += 1) {
      if (active[id] && incoming[id] < minimum) {
        minimum = incoming[id];
        candidate = id;
      }
    }
    if (candidate < 0) break;
    runningCore = Math.max(runningCore, minimum);
    coreness[candidate] = runningCore;
    active[candidate] = false;
    outgoing[candidate].forEach((target) => {
      if (active[target]) incoming[target] = Math.max(0, incoming[target] - 1);
    });
  }
  return coreness;
}

function computePageRank(nodeCount: number, edges: GraphEdge[], rounds = 8, damping = 0.85) {
  const history: number[][] = [Array.from({ length: nodeCount }, () => 1 / nodeCount)];
  const outgoingWeight = Array.from({ length: nodeCount }, () => 0);
  edges.forEach((edge) => { outgoingWeight[edge.from] += edge.weight; });
  for (let round = 0; round < rounds; round += 1) {
    const previous = history[history.length - 1];
    const next = Array.from({ length: nodeCount }, () => (1 - damping) / nodeCount);
    edges.forEach((edge) => {
      next[edge.to] += damping * previous[edge.from] * edge.weight / outgoingWeight[edge.from];
    });
    history.push(next);
  }
  return history;
}

function buildGraph(k: number): GraphModel {
  const neighbors = nodes.map((node) => nodes
    .filter((candidate) => candidate.id !== node.id)
    .map((candidate) => ({ id: candidate.id, distance: euclidean(node, candidate) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k));

  const edges: GraphEdge[] = [];
  neighbors.forEach((list, from) => {
    const localScale = list.reduce((sum, item) => sum + item.distance, 0) / list.length;
    list.forEach((item) => edges.push({
      from,
      to: item.id,
      distance: item.distance,
      weight: Math.exp(-item.distance / Math.max(0.001, localScale)),
    }));
  });

  const inDegree = Array.from({ length: nodes.length }, () => 0);
  edges.forEach((edge) => { inDegree[edge.to] += 1; });
  const edgeSet = new Set(edges.map((edge) => `${edge.from}:${edge.to}`));
  const ccPairs = neighbors.map((list) => {
    let connected = 0;
    list.forEach((source) => list.forEach((target) => {
      if (source.id !== target.id && edgeSet.has(`${source.id}:${target.id}`)) connected += 1;
    }));
    return connected;
  });
  const cc = ccPairs.map((connected) => connected / Math.max(1, k * (k - 1)));
  const coreness = computeCoreness(nodes.length, edges);
  return {
    nodes,
    edges,
    neighbors: neighbors.map((list) => list.map((item) => item.id)),
    inDegree,
    coreness,
    cc,
    ccPairs,
    pageRank: computePageRank(nodes.length, edges),
    maxCore: Math.max(...coreness),
  };
}

function rankOf(values: number[], nodeId: number) {
  return [...values]
    .map((value, id) => ({ value, id }))
    .sort((a, b) => b.value - a.value)
    .findIndex((item) => item.id === nodeId) + 1;
}

function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function setArrowLayer(arrow: THREE.ArrowHelper, opacity = 1) {
  [arrow.line, arrow.cone].forEach((part) => {
    part.renderOrder = 30;
    const material = part.material as THREE.Material;
    material.transparent = true;
    material.opacity = opacity;
    material.depthTest = false;
    material.depthWrite = false;
  });
}

function addArrow(group: THREE.Group, from: LabNode, to: LabNode, color: string, opacity = 1) {
  const start = new THREE.Vector3(...from.position);
  const end = new THREE.Vector3(...to.position);
  const direction = end.clone().sub(start);
  const fullLength = direction.length();
  direction.normalize();
  const inset = Math.min(0.15, fullLength * 0.22);
  const origin = start.add(direction.clone().multiplyScalar(inset));
  const length = Math.max(0.06, fullLength - inset * 2);
  const headLength = Math.min(0.13, length * 0.32);
  const arrow = new THREE.ArrowHelper(direction, origin, length, new THREE.Color(color), headLength, headLength * 0.55);
  setArrowLayer(arrow, opacity);
  group.add(arrow);
}

function addContextEdges(group: THREE.Group, model: GraphModel, predicate: (edge: GraphEdge) => boolean, opacity = 0.13) {
  const coordinates: number[] = [];
  model.edges.filter(predicate).forEach((edge) => {
    const start = new THREE.Vector3(...model.nodes[edge.from].position);
    const end = new THREE.Vector3(...model.nodes[edge.to].position);
    const direction = end.clone().sub(start);
    const fullLength = direction.length();
    direction.normalize();
    const inset = Math.min(0.105, fullLength * 0.19);
    start.add(direction.clone().multiplyScalar(inset));
    end.add(direction.clone().multiplyScalar(-inset));
    coordinates.push(start.x, start.y, start.z, end.x, end.y, end.z);
  });
  if (!coordinates.length) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
  const material = new THREE.LineBasicMaterial({
    color: '#8aa0ad',
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.renderOrder = 1;
  group.add(lines);
}

function geometryForFamily(family: Family, radius: number) {
  if (family === '鞋履') return new THREE.OctahedronGeometry(radius, 1);
  if (family === '包袋') return new THREE.DodecahedronGeometry(radius, 1);
  return new THREE.IcosahedronGeometry(radius, 2);
}

const modeMeta: Record<LabMode, { label: string; short: string }> = {
  space: { label: '3D 投影', short: '节点颜色表示样本类别；当前坐标只是 6 维特征的三维投影。' },
  knn: { label: 'k 近邻', short: '高亮箭头从当前节点指向它在 6 维空间中的 k 个最近邻。' },
  pagerank: { label: 'PageRank', short: '节点大小随当前轮得分变化，高亮入边展示重要性从哪里传来。' },
  kcore: { label: 'k-core', short: '低于当前 coreness 门槛的节点会淡出，留下越来越稳定的核心子图。' },
  cc: { label: 'CC', short: '颜色越亮表示近邻之间的有向连接越完整，局部邻域越凝聚。' },
};

export const GraphLab3D: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<LabMode>('space');
  const [k, setK] = useState(4);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pageRankRound, setPageRankRound] = useState(0);
  const [pageRankPlaying, setPageRankPlaying] = useState(false);
  const [coreThreshold, setCoreThreshold] = useState(1);
  const [ccReveal, setCcReveal] = useState(0);
  const model = useMemo(() => buildGraph(k), [k]);
  const viewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicRef = useRef<THREE.Group | null>(null);
  const nodeMeshesRef = useRef<THREE.Object3D[]>([]);
  const pointerDownRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPageRankRound(0);
    setCoreThreshold(1);
    setCcReveal(0);
    setPageRankPlaying(false);
  }, [k]);

  useEffect(() => {
    setCcReveal(0);
  }, [selectedId]);

  useEffect(() => {
    if (!pageRankPlaying) return;
    const timer = window.setInterval(() => {
      setPageRankRound((round) => {
        if (round >= 8) {
          setPageRankPlaying(false);
          return round;
        }
        return round + 1;
      });
    }, 720);
    return () => window.clearInterval(timer);
  }, [pageRankPlaying]);

  useEffect(() => {
    const host = viewRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07131b');
    scene.fog = new THREE.Fog('#07131b', 6.6, 11.5);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0.15, 1.35, 6.4);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const presentationImage = document.createElement('img');
    presentationImage.className = 'spatial-lab-image';
    presentationImage.alt = '三维嵌入与 kNN graph 节点视图';
    const presentationCanvas = document.createElement('canvas');
    presentationCanvas.className = 'spatial-lab-canvas';
    presentationCanvas.setAttribute('aria-label', '可旋转的三维嵌入与 kNN graph 工作台');
    presentationCanvas.setAttribute('aria-hidden', 'true');
    presentationCanvas.style.background = 'transparent';
    presentationCanvas.style.pointerEvents = 'auto';
    presentationImage.style.pointerEvents = 'none';
    host.appendChild(presentationImage);
    host.appendChild(presentationCanvas);

    const controls = new OrbitControls(camera, presentationCanvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 3.4;
    controls.maxDistance = 10;
    controls.target.set(0, 0.72, -0.12);
    controls.autoRotate = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotateSpeed = 0.34;

    scene.add(new THREE.HemisphereLight('#d9f3ff', '#17242b', 2.2));
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
    keyLight.position.set(3.5, 5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight('#ff9e78', 18, 8);
    rimLight.position.set(-3, 2.2, 2.8);
    scene.add(rimLight);
    const grid = new THREE.GridHelper(8, 18, '#29434e', '#152a33');
    grid.position.y = -0.92;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.52;
    scene.add(grid);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitTest = (event: PointerEvent) => {
      const rect = presentationCanvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(nodeMeshesRef.current, false)[0];
      return typeof hit?.object.userData.nodeId === 'number' ? hit.object.userData.nodeId as number : null;
    };
    const onPointerMove = (event: PointerEvent) => {
      const hit = hitTest(event);
      presentationCanvas.style.cursor = hit === null ? 'grab' : 'pointer';
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerDownRef.current = { x: event.clientX, y: event.clientY };
      controls.autoRotate = false;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerDownRef.current.x, event.clientY - pointerDownRef.current.y) > 5) return;
      const hit = hitTest(event);
      if (hit !== null) {
        // Clicking the active node again clears the selection and restores its normal style.
        setSelectedId((current) => (current === hit ? null : hit));
      }
    };
    const onPointerLeave = () => { presentationCanvas.style.cursor = 'grab'; };
    presentationCanvas.addEventListener('pointermove', onPointerMove);
    presentationCanvas.addEventListener('pointerdown', onPointerDown);
    presentationCanvas.addEventListener('pointerup', onPointerUp);
    presentationCanvas.addEventListener('pointerleave', onPointerLeave);

    const resize = () => {
      const width = Math.max(320, host.clientWidth);
      const height = Math.max(360, host.clientHeight);
      const narrow = width < 640;
      camera.fov = narrow ? 56 : 42;
      if (narrow && camera.position.z < 7.8) camera.position.z = 8.2;
      if (!narrow && camera.position.z > 7.8) camera.position.z = 6.4;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      presentationCanvas.width = renderer.domElement.width;
      presentationCanvas.height = renderer.domElement.height;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      // DOM image presentation avoids browser-specific WebGL/canvas screenshot compositing gaps.
      if (frame % 2 === 0) presentationImage.src = renderer.domElement.toDataURL('image/png');
      frame = requestAnimationFrame(render);
    };
    render();
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      presentationCanvas.removeEventListener('pointermove', onPointerMove);
      presentationCanvas.removeEventListener('pointerdown', onPointerDown);
      presentationCanvas.removeEventListener('pointerup', onPointerUp);
      presentationCanvas.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      renderer.dispose();
      presentationImage.remove();
      presentationCanvas.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (dynamicRef.current) {
      scene.remove(dynamicRef.current);
      disposeGroup(dynamicRef.current);
    }
    const group = new THREE.Group();
    const scores = model.pageRank[pageRankRound];
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const topPageRank = scores.indexOf(maxScore);
    const selectedNeighbors = new Set(selectedId === null ? [] : model.neighbors[selectedId]);
    const selectedCcEdges = model.edges.filter((edge) => selectedNeighbors.has(edge.from) && selectedNeighbors.has(edge.to));
    const revealedCcEdges = selectedCcEdges.slice(0, ccReveal);
    const activeCcNodes = selectedId === null ? new Set<number>() : new Set<number>([selectedId]);
    revealedCcEdges.forEach((edge) => {
      activeCcNodes.add(edge.from);
      activeCcNodes.add(edge.to);
    });

    if (mode === 'knn' || mode === 'pagerank') addContextEdges(group, model, () => true, mode === 'pagerank' ? 0.11 : 0.08);
    if (mode === 'kcore') {
      addContextEdges(group, model, (edge) => model.coreness[edge.from] >= coreThreshold && model.coreness[edge.to] >= coreThreshold, 0.23);
    }

    if (mode === 'knn') {
      model.edges.filter((edge) => edge.from === selectedId).forEach((edge) => {
        addArrow(group, model.nodes[edge.from], model.nodes[edge.to], '#48b7ff');
      });
    }
    if (mode === 'pagerank') {
      model.edges.filter((edge) => edge.to === selectedId).forEach((edge) => {
        addArrow(group, model.nodes[edge.from], model.nodes[edge.to], '#65d6ff', 0.95);
      });
    }
    if (mode === 'kcore') {
      model.edges
        .filter((edge) => edge.from === selectedId && model.coreness[edge.from] >= coreThreshold && model.coreness[edge.to] >= coreThreshold)
        .forEach((edge) => addArrow(group, model.nodes[edge.from], model.nodes[edge.to], '#e0b4ff', 0.9));
    }
    if (mode === 'cc') {
      addContextEdges(group, model, () => true, 0.045);
      model.edges.filter((edge) => edge.from === selectedId).forEach((edge) => {
        addArrow(group, model.nodes[edge.from], model.nodes[edge.to], '#48b7ff', 0.88);
      });
      revealedCcEdges.forEach((edge) => {
        addArrow(group, model.nodes[edge.from], model.nodes[edge.to], '#d9a7ff', 1);
      });
    }

    const meshObjects: THREE.Object3D[] = [];
    model.nodes.forEach((node) => {
      const selected = node.id === selectedId;
      const selectedNeighbor = selectedNeighbors.has(node.id);
      const normalizedPageRank = (scores[node.id] - minScore) / Math.max(0.00001, maxScore - minScore);
      const inactiveCore = mode === 'kcore' && model.coreness[node.id] < coreThreshold;
      let color = familyColors[node.family];
      let radius = 0.068;
      let opacity = selected ? 1 : inactiveCore ? 0.018 : 0.92;
      if (mode === 'pagerank') {
        color = new THREE.Color('#3a79a8').lerp(new THREE.Color('#ffd166'), normalizedPageRank).getStyle();
        radius = 0.06 + normalizedPageRank * 0.045;
      } else if (mode === 'kcore') {
        const level = model.coreness[node.id] / Math.max(1, model.maxCore);
        color = new THREE.Color('#6c7b86').lerp(new THREE.Color('#b66cff'), level).getStyle();
      } else if (mode === 'cc') {
        color = new THREE.Color('#52626b').lerp(new THREE.Color('#67e8a5'), model.cc[node.id]).getStyle();
        radius = 0.062 + model.cc[node.id] * 0.028;
        opacity = selectedId === null ? 0.92 : activeCcNodes.has(node.id) ? 1 : selectedNeighbor ? 0.76 : 0.2;
      }
      if (selected) {
        color = '#ef4444';
        // A small size lift keeps the active sample readable without adding a ring.
        radius += 0.012;
      }
      else if (mode === 'cc' && activeCcNodes.has(node.id)) color = '#d9a7ff';
      else if (selectedNeighbor) color = '#00e5ff';
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.32,
        metalness: 0.08,
        transparent: true,
        opacity,
        emissive: new THREE.Color(color).multiplyScalar(selected ? 0.52 : selectedNeighbor ? 0.42 : 0.08),
        // Keep the selected node visible even when an arrow passes in front of it.
        depthTest: !selected,
        depthWrite: !selected,
      });
      const mesh = new THREE.Mesh(geometryForFamily(node.family, radius), material);
      mesh.position.set(...node.position);
      if (inactiveCore) mesh.scale.setScalar(0.28);
      mesh.userData.nodeId = node.id;
      mesh.renderOrder = selected ? 45 : 10;
      group.add(mesh);
      meshObjects.push(mesh);

      if (!selected && mode === 'pagerank' && node.id === topPageRank) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 1.72, 0.015, 8, 44),
          new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.95, depthTest: false })
        );
        ring.position.copy(mesh.position);
        ring.lookAt(cameraRef.current?.position ?? new THREE.Vector3(0, 0, 5));
        ring.renderOrder = 35;
        group.add(ring);
      }
    });
    nodeMeshesRef.current = meshObjects;
    scene.add(group);
    dynamicRef.current = group;
  }, [ccReveal, coreThreshold, mode, model, pageRankRound, selectedId]);

  const selected = selectedId === null ? null : model.nodes[selectedId];
  const selectedNeighbors = selectedId === null ? [] : model.neighbors[selectedId];
  const scores = model.pageRank[pageRankRound];
  const pageRankTop = scores.indexOf(Math.max(...scores));
  const ccTop = model.cc.indexOf(Math.max(...model.cc));
  const selectedCcEdges = selectedId === null ? [] : model.edges.filter((edge) => {
    const neighbors = new Set(model.neighbors[selectedId]);
    return neighbors.has(edge.from) && neighbors.has(edge.to);
  });
  const activeCoreCount = model.coreness.filter((value) => value >= coreThreshold).length;
  const selectedMetric = selectedId === null
    ? '尚未选择节点'
    : mode === 'pagerank'
      ? `PR = ${scores[selectedId].toFixed(4)} · 第 ${rankOf(scores, selectedId)} 名`
      : mode === 'kcore'
        ? `coreness = ${model.coreness[selectedId]}`
        : mode === 'cc'
          ? `CC = ${model.cc[selectedId].toFixed(2)}`
          : `in-degree = ${model.inDegree[selectedId]}`;

  const resetCamera = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const narrow = (viewRef.current?.clientWidth ?? 1000) < 640;
    camera.fov = narrow ? 56 : 42;
    camera.position.set(0.15, 1.35, narrow ? 8.2 : 6.4);
    controls.target.set(0, 0.72, -0.12);
    controls.autoRotate = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    controls.update();
  };

  return (
    <div className="spatial-lab">
      <div className="spatial-lab-stage">
        <div className="spatial-lab-view" ref={viewRef}>
          <div className="spatial-mode-tabs" role="tablist" aria-label="选择图结构分析模式">
            {([
              ['space', Box, '3D'],
              ['knn', Network, 'k 近邻'],
              ['pagerank', Sparkles, 'PageRank'],
              ['kcore', Layers3, 'k-core'],
              ['cc', Crosshair, 'CC'],
            ] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                className={mode === value ? 'active' : ''}
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button className="spatial-reset" type="button" title="复位三维视角" aria-label="复位三维视角" onClick={resetCamera}>
            <RotateCcw size={17} />
          </button>
          <div className="spatial-lab-controlbar">
            <label htmlFor="graph-lab-k">近邻数 <b>k = {k}</b></label>
            <input id="graph-lab-k" type="range" min="2" max="5" step="1" value={k} onChange={(event) => setK(Number(event.currentTarget.value))} />
            {mode === 'pagerank' ? (
              <>
                <button type="button" onClick={() => setPageRankPlaying((value) => !value)} title={pageRankPlaying ? '暂停 PageRank 迭代' : '播放 PageRank 迭代'}>
                  {pageRankPlaying ? <Pause size={15} /> : <Play size={15} />}
                  <span>第 {pageRankRound}/8 轮</span>
                </button>
                <button type="button" onClick={() => { setPageRankRound(0); setPageRankPlaying(false); }} title="重置 PageRank">重置</button>
              </>
            ) : null}
            {mode === 'kcore' ? (
              <>
                <label htmlFor="graph-lab-core">保留层级 <b>≥ {coreThreshold}</b></label>
                <input id="graph-lab-core" type="range" min="1" max={model.maxCore} step="1" value={coreThreshold} onChange={(event) => setCoreThreshold(Number(event.currentTarget.value))} />
                <button type="button" onClick={() => setCoreThreshold((value) => value >= model.maxCore ? 1 : value + 1)}>
                  <Layers3 size={15} />
                  <span>剥离一层</span>
                </button>
              </>
            ) : null}
            {mode === 'cc' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCcReveal((value) => value >= selectedCcEdges.length ? 0 : value + 1)}
                  title="逐条显示当前节点的近邻互连"
                >
                  <Play size={15} />
                  <span>互连 {ccReveal}/{selectedCcEdges.length}</span>
                </button>
                <button type="button" onClick={() => setSelectedId(ccTop)}><Crosshair size={15} /><span>最高 CC</span></button>
              </>
            ) : null}
          </div>
        </div>

        <aside className="spatial-lab-panel" aria-live="polite">
          <div className="spatial-panel-kicker">{modeMeta[mode].label}</div>
          <h5>{selected?.label ?? '选择一个节点'}</h5>
          <div className="spatial-family">
            {selected ? <><span style={{ background: familyColors[selected.family] }} />{selected.family}样本 · 节点 {selected.id + 1}</> : '点击 3D 球体查看节点结构'}
          </div>
          <div className="spatial-primary-metric">{selectedMetric}</div>
          <p>{modeMeta[mode].short}</p>
          <div className="spatial-panel-rule" />
          {mode === 'pagerank' ? (
            <div className="spatial-fact-list">
              <span>本轮全图第一</span><b>{model.nodes[pageRankTop].label}</b>
              <span>当前节点入度</span><b>{selectedId === null ? '—' : model.inDegree[selectedId]}</b>
              <span>阻尼系数</span><b>0.85</b>
            </div>
          ) : mode === 'kcore' ? (
            <div className="spatial-fact-list">
              <span>当前保留</span><b>{activeCoreCount} / {model.nodes.length}</b>
              <span>最高 coreness</span><b>{model.maxCore}</b>
              <span>当前节点</span><b>{selectedId === null ? '—' : model.coreness[selectedId] >= coreThreshold ? '保留' : '已剥离'}</b>
            </div>
          ) : mode === 'cc' ? (
            <div className="spatial-fact-list">
              <span>实际有序邻居对</span><b>{selectedId === null ? '—' : `${model.ccPairs[selectedId]} / ${k * (k - 1)}`}</b>
              <span>当前已显示</span><b>{Math.min(ccReveal, selectedCcEdges.length)} / {selectedCcEdges.length}</b>
              <span>最高 CC 节点</span><b>{model.nodes[ccTop].label}</b>
              <span>观察范围</span><b>局部邻域</b>
            </div>
          ) : (
            <div className="spatial-neighbor-list">
              <span>{k} 个出邻居</span>
              {selectedNeighbors.map((neighborId, index) => {
                const edge = model.edges.find((item) => item.from === selectedId && item.to === neighborId);
                return <button type="button" key={neighborId} onClick={() => setSelectedId(neighborId)}><b>{index + 1}</b><span>{model.nodes[neighborId].label}</span><small>{edge?.distance.toFixed(2)}</small></button>;
              })}
            </div>
          )}
        </aside>
      </div>
      <div className="spatial-reuse-note">
        <b>一份中间数组，三种结构读法</b>
        <span><code>indices + distances</code> 只构图一次；PageRank 使用密度归一化边权，in-degree k-core 与 CC 使用同一张无权有向图。</span>
      </div>
    </div>
  );
};
