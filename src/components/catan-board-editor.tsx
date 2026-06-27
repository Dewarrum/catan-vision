"use client";

import Image from "next/image";
import {
  useMemo,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  CircleDot,
  Hexagon,
  Route,
  ShipWheel,
  Sparkles,
  Undo2,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TerrainType =
  | "hills"
  | "forest"
  | "mountains"
  | "fields"
  | "pasture"
  | "desert";
type NumberToken = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12 | null;
type PortType = "generic" | "brick" | "lumber" | "ore" | "grain" | "wool";
type PlayerColor = "red" | "blue" | "white" | "orange";
type PieceKind = "settlement" | "city";
type ToolMode = "tile" | "port" | "road" | "piece" | "robber";

type TileState = {
  id: string;
  terrain: TerrainType;
  token: NumberToken;
  robber: boolean;
};

type RoadState = {
  player: PlayerColor;
};

type PieceState = {
  player: PlayerColor;
  kind: PieceKind;
};

type BoardState = {
  tiles: TileState[];
  roads: Record<string, RoadState>;
  pieces: Record<string, PieceState>;
  ports: Record<string, PortType>;
};

type Point = {
  x: number;
  y: number;
};

type ViewBoxBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type HexGeometry = {
  id: string;
  center: Point;
  points: Point[];
};

type EdgeGeometry = {
  id: string;
  a: string;
  b: string;
  start: Point;
  end: Point;
  adjacentHexIds: string[];
};

type VertexGeometry = {
  id: string;
  point: Point;
};

type BoardGeometry = {
  hexes: HexGeometry[];
  edges: EdgeGeometry[];
  vertices: VertexGeometry[];
  boundaryEdges: EdgeGeometry[];
  viewBox: string;
  boardCenter: Point;
};

type CatanBoardEditorProps = {
  detectionId: string;
  isConvexConfigured: boolean;
};

const TERRAIN_OPTIONS: Array<{
  value: TerrainType;
  label: string;
  resource: string;
  className: string;
  fill: string;
  standardCount: number;
}> = [
  {
    value: "hills",
    label: "Hills",
    resource: "Brick",
    className: "bg-red-100 text-red-950",
    fill: "#c86b4a",
    standardCount: 3,
  },
  {
    value: "forest",
    label: "Forest",
    resource: "Lumber",
    className: "bg-emerald-100 text-emerald-950",
    fill: "#2f7d4f",
    standardCount: 4,
  },
  {
    value: "mountains",
    label: "Mountains",
    resource: "Ore",
    className: "bg-slate-200 text-slate-950",
    fill: "#8d929a",
    standardCount: 3,
  },
  {
    value: "fields",
    label: "Fields",
    resource: "Grain",
    className: "bg-yellow-100 text-yellow-950",
    fill: "#d8b84f",
    standardCount: 4,
  },
  {
    value: "pasture",
    label: "Pasture",
    resource: "Wool",
    className: "bg-lime-100 text-lime-950",
    fill: "#91b95d",
    standardCount: 4,
  },
  {
    value: "desert",
    label: "Desert",
    resource: "None",
    className: "bg-stone-200 text-stone-950",
    fill: "#d3b37a",
    standardCount: 1,
  },
];

const PORT_OPTIONS: Array<{
  value: PortType;
  label: string;
  standardCount: number;
}> = [
  { value: "generic", label: "3:1", standardCount: 4 },
  { value: "brick", label: "Brick 2:1", standardCount: 1 },
  { value: "lumber", label: "Lumber 2:1", standardCount: 1 },
  { value: "ore", label: "Ore 2:1", standardCount: 1 },
  { value: "grain", label: "Grain 2:1", standardCount: 1 },
  { value: "wool", label: "Wool 2:1", standardCount: 1 },
];

const PLAYER_OPTIONS: Array<{
  value: PlayerColor;
  label: string;
  fill: string;
  text: string;
}> = [
  { value: "red", label: "Red", fill: "#c2413f", text: "text-red-700" },
  { value: "blue", label: "Blue", fill: "#2563eb", text: "text-blue-700" },
  { value: "white", label: "White", fill: "#f8fafc", text: "text-slate-700" },
  {
    value: "orange",
    label: "Orange",
    fill: "#ea8a2f",
    text: "text-orange-700",
  },
];

const INITIAL_TERRAINS: TerrainType[] = [
  "forest",
  "pasture",
  "fields",
  "hills",
  "mountains",
  "forest",
  "pasture",
  "fields",
  "desert",
  "hills",
  "mountains",
  "forest",
  "pasture",
  "fields",
  "mountains",
  "hills",
  "forest",
  "pasture",
  "fields",
];

const INITIAL_TOKENS: NumberToken[] = [
  5,
  2,
  6,
  3,
  8,
  10,
  9,
  12,
  null,
  11,
  4,
  8,
  10,
  9,
  4,
  5,
  6,
  3,
  11,
];

const NUMBER_TOKEN_OPTIONS: Array<Exclude<NumberToken, null>> = [
  2,
  3,
  4,
  5,
  6,
  8,
  9,
  10,
  11,
  12,
];

const MODE_OPTIONS: Array<{
  value: ToolMode;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "tile", label: "Tiles", icon: Hexagon },
  { value: "port", label: "Ports", icon: ShipWheel },
  { value: "road", label: "Roads", icon: Route },
  { value: "piece", label: "Settlements and cities", icon: Building2 },
  { value: "robber", label: "Robber", icon: CircleDot },
];

export function CatanBoardEditor({
  detectionId,
  isConvexConfigured,
}: CatanBoardEditorProps) {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [mode, setMode] = useState<ToolMode>("tile");
  const [activeTileId, setActiveTileId] = useState<string | null>(null);
  const [activeVertexId, setActiveVertexId] = useState<string | null>(null);
  const [selectedPort, setSelectedPort] = useState<PortType>("generic");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerColor>("red");
  const geometry = useMemo(() => createBoardGeometry(), []);
  const warnings = useMemo(
    () => validateBoardState(board, geometry),
    [board, geometry],
  );

  function updateTileTerrain(tileId: string, terrain: TerrainType) {
    setBoard((current) => ({
      ...current,
      tiles: current.tiles.map((tile) =>
        tile.id === tileId
          ? { ...tile, terrain, token: terrain === "desert" ? null : tile.token }
          : tile,
      ),
    }));
  }

  function updateTileToken(tileId: string, token: Exclude<NumberToken, null>) {
    setBoard((current) => ({
      ...current,
      tiles: current.tiles.map((tile) =>
        tile.id === tileId && tile.terrain !== "desert"
          ? { ...tile, token }
          : tile,
      ),
    }));
  }

  function toggleRobber(tileId: string) {
    setBoard((current) => ({
      ...current,
      tiles: current.tiles.map((tile) =>
        tile.id === tileId ? { ...tile, robber: !tile.robber } : tile,
      ),
    }));
  }

  function toggleRoad(edgeId: string) {
    setBoard((current) => {
      const roads = { ...current.roads };
      if (roads[edgeId]?.player === selectedPlayer) {
        delete roads[edgeId];
      } else {
        roads[edgeId] = { player: selectedPlayer };
      }
      return { ...current, roads };
    });
  }

  function setPiece(vertexId: string, kind: PieceKind) {
    setBoard((current) => {
      const pieces = { ...current.pieces };
      pieces[vertexId] = {
        player: selectedPlayer,
        kind,
      };
      return { ...current, pieces };
    });
    setActiveVertexId(null);
  }

  function clearPiece(vertexId: string) {
    setBoard((current) => {
      const pieces = { ...current.pieces };
      delete pieces[vertexId];
      return { ...current, pieces };
    });
    setActiveVertexId(null);
  }

  function togglePort(edgeId: string) {
    setBoard((current) => {
      const ports = { ...current.ports };
      if (ports[edgeId] === selectedPort) {
        delete ports[edgeId];
      } else {
        ports[edgeId] = selectedPort;
      }
      return { ...current, ports };
    });
  }

  function changeMode(nextMode: ToolMode) {
    setMode(nextMode);
    setActiveTileId(null);
    setActiveVertexId(null);
  }

  function resetBoard() {
    setBoard(createInitialBoard());
    setActiveTileId(null);
    setActiveVertexId(null);
  }

  function dismissBoardMenus() {
    setActiveTileId(null);
    setActiveVertexId(null);
  }

  function activateSvgControl(
    event: KeyboardEvent<SVGGElement>,
    action: () => void,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  }

  return (
    <main
      className="min-h-dvh overflow-auto bg-[#086f9f] text-slate-950 lg:h-dvh lg:overflow-hidden"
      onClick={dismissBoardMenus}
    >
      <div className="grid min-h-dvh gap-3 p-3 md:p-4 lg:h-dvh lg:min-h-0 lg:grid-cols-[4.5rem_minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)_auto]">
        <ModeRail
          mode={mode}
          onModeChange={changeMode}
          onReset={resetBoard}
        />

        <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-cyan-950/25 bg-[#0d75a6] shadow-2xl shadow-cyan-950/30 lg:min-h-0">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.13)_0_1px,transparent_1px_42px),linear-gradient(25deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_54px)]" />
          <div className="absolute left-3 top-3 z-10 flex items-center gap-3 rounded-md border border-white/30 bg-white/85 px-3 py-2 shadow-lg shadow-cyan-950/20 backdrop-blur">
            <div
              className="grid size-9 place-items-center border border-amber-900/30 bg-amber-300 text-sm font-black text-stone-950 shadow-sm [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)]"
              aria-hidden="true"
            >
              CV
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide">
                Catan Vision
              </h1>
              <p className="max-w-52 truncate text-xs font-medium text-slate-600">
                Detection {detectionId}
              </p>
            </div>
          </div>

          <BoardSvg
            board={board}
            geometry={geometry}
            mode={mode}
            activeTileId={activeTileId}
            activeVertexId={activeVertexId}
            selectedPlayer={selectedPlayer}
            onTileClick={(tileId) => {
              if (mode === "tile") {
                setActiveVertexId(null);
                setActiveTileId((current) =>
                  current === tileId ? null : tileId,
                );
              }
              if (mode === "robber") {
                dismissBoardMenus();
                toggleRobber(tileId);
              }
            }}
            onTileTerrainChange={updateTileTerrain}
            onTileTokenChange={updateTileToken}
            onDismissMenus={dismissBoardMenus}
            onPortClick={(edgeId) => mode === "port" && togglePort(edgeId)}
            onRoadClick={(edgeId) => mode === "road" && toggleRoad(edgeId)}
            onPieceClick={(vertexId) => {
              setMode("piece");
              setActiveTileId(null);
              setActiveVertexId((current) =>
                current === vertexId ? null : vertexId,
              );
            }}
            onPieceSet={setPiece}
            onPieceClear={clearPiece}
            onKeyActivate={activateSvgControl}
          />
        </section>

        <aside className="grid min-h-[520px] gap-3 lg:col-start-3 lg:row-span-2 lg:min-h-0 lg:grid-rows-[auto_auto_minmax(0,1fr)]">
          <DetectionImagePanel
            detectionId={detectionId}
            isConvexConfigured={isConvexConfigured}
          />
          <BoardSummary board={board} warnings={warnings} />
          <WarningsPanel warnings={warnings} />
        </aside>

        {mode !== "tile" ? (
          <EditorToolbar
            mode={mode}
            selectedPort={selectedPort}
            selectedPlayer={selectedPlayer}
            onPortChange={setSelectedPort}
            onPlayerChange={setSelectedPlayer}
          />
        ) : null}
      </div>
    </main>
  );
}

function ModeRail({
  mode,
  onModeChange,
  onReset,
}: {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onReset: () => void;
}) {
  return (
    <nav className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/90 p-2 shadow-xl shadow-cyan-950/20 backdrop-blur lg:row-span-2 lg:flex-col lg:self-start">
      {MODE_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.value}
            type="button"
            variant={mode === option.value ? "default" : "ghost"}
            size="icon-lg"
            className={cn(
              "rounded-md",
              mode === option.value
                ? "bg-cyan-950 text-white hover:bg-cyan-900"
                : "text-slate-700 hover:bg-cyan-100",
            )}
            aria-label={option.label}
            title={option.label}
            onClick={() => onModeChange(option.value)}
          >
            <Icon className="size-5" />
          </Button>
        );
      })}
      <div className="h-8 w-px bg-slate-200 lg:h-px lg:w-8" />
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-md text-slate-700 hover:bg-amber-100"
        aria-label="Reset board"
        title="Reset board"
        onClick={onReset}
      >
        <Undo2 className="size-5" />
      </Button>
    </nav>
  );
}

function BoardSvg({
  board,
  geometry,
  mode,
  activeTileId,
  activeVertexId,
  selectedPlayer,
  onTileClick,
  onTileTerrainChange,
  onTileTokenChange,
  onDismissMenus,
  onPortClick,
  onRoadClick,
  onPieceClick,
  onPieceSet,
  onPieceClear,
  onKeyActivate,
}: {
  board: BoardState;
  geometry: BoardGeometry;
  mode: ToolMode;
  activeTileId: string | null;
  activeVertexId: string | null;
  selectedPlayer: PlayerColor;
  onTileClick: (tileId: string) => void;
  onTileTerrainChange: (tileId: string, terrain: TerrainType) => void;
  onTileTokenChange: (tileId: string, token: Exclude<NumberToken, null>) => void;
  onDismissMenus: () => void;
  onPortClick: (edgeId: string) => void;
  onRoadClick: (edgeId: string) => void;
  onPieceClick: (vertexId: string) => void;
  onPieceSet: (vertexId: string, kind: PieceKind) => void;
  onPieceClear: (vertexId: string) => void;
  onKeyActivate: (event: KeyboardEvent<SVGGElement>, action: () => void) => void;
}) {
  const activeTileIndex = activeTileId
    ? board.tiles.findIndex((tile) => tile.id === activeTileId)
    : -1;
  const activeTile =
    activeTileIndex >= 0 ? board.tiles[activeTileIndex] : null;
  const activeHex =
    activeTileIndex >= 0 ? geometry.hexes[activeTileIndex] : null;
  const activeVertex = activeVertexId
    ? geometry.vertices.find((vertex) => vertex.id === activeVertexId)
    : null;
  const viewBoxBounds = useMemo(
    () => getViewBoxBounds(geometry.viewBox),
    [geometry.viewBox],
  );

  return (
    <svg
      viewBox={geometry.viewBox}
      className="relative z-0 block h-full min-h-[560px] w-full lg:min-h-0"
      aria-label="Editable Catan board"
      onClick={onDismissMenus}
    >
      <defs>
        <filter id="tile-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" floodColor="#06364b" floodOpacity="0.22" stdDeviation="4" />
        </filter>
        <filter id="piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" floodColor="#111827" floodOpacity="0.45" stdDeviation="2" />
        </filter>
      </defs>

      <rect x="-200" y="-200" width="1400" height="1200" fill="#0d75a6" />
      <g opacity="0.22">
        <path
          d="M-120 180 C90 110 190 240 350 150 C500 65 650 115 850 35"
          fill="none"
          stroke="#c9f3ff"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <path
          d="M-100 640 C80 540 245 680 405 585 C580 480 690 590 890 500"
          fill="none"
          stroke="#c9f3ff"
          strokeLinecap="round"
          strokeWidth="8"
        />
      </g>

      <g filter="url(#tile-shadow)">
        {geometry.hexes.map((hex) => (
          <polygon
            key={`${hex.id}-reef`}
            points={pointsToString(hex.points)}
            fill="#5bbbd0"
            stroke="#dff8ff"
            strokeWidth={24}
            strokeLinejoin="round"
            opacity={0.62}
          />
        ))}
        {geometry.hexes.map((hex) => (
          <polygon
            key={`${hex.id}-sand`}
            points={pointsToString(hex.points)}
            fill="#e9c672"
            stroke="#bb9250"
            strokeWidth={12}
            strokeLinejoin="round"
          />
        ))}

        {geometry.hexes.map((hex, index) => {
          const tile = board.tiles[index];
          const terrain = getTerrainOption(tile.terrain);
          const isHotToken = tile.token === 6 || tile.token === 8;
          const isActive = activeTileId === tile.id;
          return (
            <g
              key={hex.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer outline-none"
              aria-label={`${terrain.label} tile ${index + 1}`}
              onClick={(event) => {
                event.stopPropagation();
                onTileClick(tile.id);
              }}
              onKeyDown={(event) => onKeyActivate(event, () => onTileClick(tile.id))}
            >
              <polygon
                points={pointsToString(hex.points)}
                fill={terrain.fill}
                stroke={
                  isActive
                    ? "#0f172a"
                    : mode === "tile"
                      ? "#fff7d6"
                      : "#8d6a2f"
                }
                strokeWidth={isActive ? 7 : mode === "tile" ? 5 : 3}
                strokeLinejoin="round"
              />
              <polygon
                points={pointsToString(scalePolygon(hex.points, hex.center, 0.78))}
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <TerrainEmblem terrain={tile.terrain} center={hex.center} />
              <text
                x={hex.center.x}
                y={hex.center.y - 42}
                textAnchor="middle"
                className="fill-white text-[12px] font-black uppercase"
                paintOrder="stroke"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={2}
              >
                {terrain.resource}
              </text>
              {tile.token ? (
                <g>
                  <rect
                    x={hex.center.x - 24}
                    y={hex.center.y + 4}
                    width={48}
                    height={44}
                    rx={8}
                    fill="#fff9e8"
                    stroke="#70451e"
                    strokeWidth={2.5}
                  />
                  <text
                    x={hex.center.x}
                    y={hex.center.y + 31}
                    textAnchor="middle"
                    className={cn(
                      "text-[25px] font-black",
                      isHotToken ? "fill-red-700" : "fill-emerald-950",
                    )}
                  >
                    {tile.token}
                  </text>
                  <text
                    x={hex.center.x}
                    y={hex.center.y + 43}
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] font-black",
                      isHotToken ? "fill-red-700" : "fill-emerald-950",
                    )}
                  >
                    {getTokenPips(tile.token)}
                  </text>
                </g>
              ) : null}
              {tile.robber ? <RobberMarker center={hex.center} /> : null}
            </g>
          );
        })}
      </g>

      {geometry.boundaryEdges.map((edge) => {
        const port = board.ports[edge.id];
        const portPoint = getPortPoint(edge, geometry.boardCenter);
        const bridgeOpacity = port ? 0.95 : mode === "port" ? 0.25 : 0;
        return (
          <g key={edge.id}>
            <line
              x1={edge.start.x}
              y1={edge.start.y}
              x2={portPoint.x}
              y2={portPoint.y}
              stroke="#d2912f"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={bridgeOpacity}
            />
            <line
              x1={edge.end.x}
              y1={edge.end.y}
              x2={portPoint.x}
              y2={portPoint.y}
              stroke="#d2912f"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={bridgeOpacity}
            />
            <g
              role="button"
              tabIndex={0}
              className="cursor-pointer outline-none"
              aria-label={`Port ${edge.id}`}
              onClick={() => onPortClick(edge.id)}
              onKeyDown={(event) => onKeyActivate(event, () => onPortClick(edge.id))}
            >
              <path
                d={`M ${portPoint.x - 20} ${portPoint.y + 14} Q ${portPoint.x} ${portPoint.y + 25} ${portPoint.x + 20} ${portPoint.y + 14} L ${portPoint.x + 14} ${portPoint.y - 10} Q ${portPoint.x} ${portPoint.y - 18} ${portPoint.x - 14} ${portPoint.y - 10} Z`}
                fill={port ? "#fffaf0" : "#9fd8e7"}
                stroke={port ? "#855d2d" : "#317f94"}
                strokeWidth={2}
                opacity={port ? 1 : mode === "port" ? 0.35 : 0}
              />
              {port ? (
                <text
                  x={portPoint.x}
                  y={portPoint.y + 6}
                  textAnchor="middle"
                  className="fill-stone-950 text-[12px] font-black"
                >
                  {getPortShortLabel(port)}
                </text>
              ) : null}
            </g>
          </g>
        );
      })}

      {geometry.edges.map((edge) => {
        const road = board.roads[edge.id];
        return (
          <g
            key={edge.id}
            role="button"
            tabIndex={0}
            className="cursor-pointer outline-none"
            aria-label={`Road ${edge.id}`}
            onClick={() => onRoadClick(edge.id)}
            onKeyDown={(event) => onKeyActivate(event, () => onRoadClick(edge.id))}
          >
            <line
              x1={edge.start.x}
              y1={edge.start.y}
              x2={edge.end.x}
              y2={edge.end.y}
              stroke="transparent"
              strokeWidth={24}
              strokeLinecap="round"
            />
            <line
              x1={edge.start.x}
              y1={edge.start.y}
              x2={edge.end.x}
              y2={edge.end.y}
              stroke="#2a1d13"
              strokeWidth={road ? 13 : 5}
              strokeLinecap="round"
              opacity={road ? 0.7 : mode === "road" ? 0.2 : 0}
            />
            <line
              x1={edge.start.x}
              y1={edge.start.y}
              x2={edge.end.x}
              y2={edge.end.y}
              stroke={road ? getPlayerOption(road.player).fill : "#fff5d6"}
              strokeWidth={road ? 9 : 3}
              strokeLinecap="round"
              opacity={road ? 1 : mode === "road" ? 0.68 : 0.08}
            />
          </g>
        );
      })}

      {geometry.vertices.map((vertex) => {
        const piece = board.pieces[vertex.id];
        return (
          <g
            key={vertex.id}
            role="button"
            tabIndex={0}
            className="cursor-pointer outline-none"
            aria-label={`Vertex ${vertex.id}`}
            onClick={(event) => {
              event.stopPropagation();
              onPieceClick(vertex.id);
            }}
            onKeyDown={(event) => onKeyActivate(event, () => onPieceClick(vertex.id))}
          >
            <circle
              cx={vertex.point.x}
              cy={vertex.point.y}
              r={24}
              fill="transparent"
              pointerEvents="all"
            />
            {!piece ? (
              <circle
                cx={vertex.point.x}
                cy={vertex.point.y}
                r={11}
                fill="#d8c453"
                stroke="#7b6a24"
                strokeWidth={2}
                opacity={mode === "piece" ? 0.74 : 0.24}
              />
            ) : null}
            {piece ? (
              <PieceMarker point={vertex.point} piece={piece} />
            ) : null}
          </g>
        );
      })}
      {mode === "piece" && activeVertex ? (
        <VertexPieceMenu
          vertex={activeVertex}
          piece={board.pieces[activeVertex.id]}
          selectedPlayer={selectedPlayer}
          viewBoxBounds={viewBoxBounds}
          onPieceSet={onPieceSet}
          onPieceClear={onPieceClear}
          onKeyActivate={onKeyActivate}
        />
      ) : null}
      {mode === "tile" && activeTile && activeHex ? (
        <TileTerrainMenu
          tile={activeTile}
          hex={activeHex}
          viewBoxBounds={viewBoxBounds}
          onTerrainChange={onTileTerrainChange}
          onTokenChange={onTileTokenChange}
          onKeyActivate={onKeyActivate}
        />
      ) : null}
    </svg>
  );
}

function TileTerrainMenu({
  tile,
  hex,
  viewBoxBounds,
  onTerrainChange,
  onTokenChange,
  onKeyActivate,
}: {
  tile: TileState;
  hex: HexGeometry;
  viewBoxBounds: ViewBoxBounds;
  onTerrainChange: (tileId: string, terrain: TerrainType) => void;
  onTokenChange: (tileId: string, token: Exclude<NumberToken, null>) => void;
  onKeyActivate: (event: KeyboardEvent<SVGGElement>, action: () => void) => void;
}) {
  const menuWidth = 336;
  const canEditToken = tile.terrain !== "desert";
  const menuHeight = canEditToken ? 204 : 112;
  const menuX = clamp(
    hex.center.x - menuWidth / 2,
    viewBoxBounds.x + 14,
    viewBoxBounds.x + viewBoxBounds.width - menuWidth - 14,
  );
  const menuY = Math.max(viewBoxBounds.y + 14, hex.center.y - menuHeight - 38);
  const arrowX = clamp(hex.center.x, menuX + 24, menuX + menuWidth - 24);

  return (
    <g
      role="menu"
      aria-label="Tile terrain and number"
      className="cursor-default"
      onClick={(event) => event.stopPropagation()}
    >
      <path
        d={`M ${arrowX - 12} ${menuY + menuHeight} L ${arrowX} ${
          menuY + menuHeight + 12
        } L ${arrowX + 12} ${menuY + menuHeight} Z`}
        fill="#fffaf0"
        stroke="#0f172a"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect
        x={menuX}
        y={menuY}
        width={menuWidth}
        height={menuHeight}
        rx={10}
        fill="#fffaf0"
        stroke="#0f172a"
        strokeWidth={2.5}
      />
      <text
        x={menuX + 14}
        y={menuY + 23}
        className="fill-slate-700 text-[12px] font-black uppercase"
      >
        Tile type
      </text>
      {TERRAIN_OPTIONS.map((terrain, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const buttonX = menuX + 12 + column * 104;
        const buttonY = menuY + 34 + row * 36;
        const isSelected = tile.terrain === terrain.value;

        return (
          <g
            key={terrain.value}
            role="menuitemradio"
            aria-checked={isSelected}
            tabIndex={0}
            className="cursor-pointer outline-none"
            onClick={(event) => {
              event.stopPropagation();
              onTerrainChange(tile.id, terrain.value);
            }}
            onKeyDown={(event) =>
              onKeyActivate(event, () =>
                onTerrainChange(tile.id, terrain.value),
              )
            }
          >
            <rect
              x={buttonX}
              y={buttonY}
              width={96}
              height={30}
              rx={6}
              fill={isSelected ? "#083344" : "#ffffff"}
              stroke={isSelected ? "#083344" : "#cbd5e1"}
              strokeWidth={1.5}
            />
            <rect
              x={buttonX + 7}
              y={buttonY + 7}
              width={16}
              height={16}
              rx={3}
              fill={terrain.fill}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
            />
            <text
              x={buttonX + 30}
              y={buttonY + 20}
              className={cn(
                "text-[12px] font-black",
                isSelected ? "fill-white" : "fill-slate-800",
              )}
            >
              {getTerrainTrayLabel(terrain)}
            </text>
          </g>
        );
      })}
      {canEditToken ? (
        <>
          <line
            x1={menuX + 12}
            y1={menuY + 113}
            x2={menuX + menuWidth - 12}
            y2={menuY + 113}
            stroke="#e2e8f0"
            strokeWidth={1.5}
          />
          <text
            x={menuX + 14}
            y={menuY + 134}
            className="fill-slate-700 text-[12px] font-black uppercase"
          >
            Number
          </text>
          {NUMBER_TOKEN_OPTIONS.map((token, index) => {
            const column = index % 5;
            const row = Math.floor(index / 5);
            const buttonX = menuX + 18 + column * 60;
            const buttonY = menuY + 144 + row * 28;
            const isSelected = tile.token === token;
            const isHotToken = token === 6 || token === 8;

            return (
              <g
                key={token}
                role="menuitemradio"
                aria-checked={isSelected}
                tabIndex={0}
                className="cursor-pointer outline-none"
                onClick={(event) => {
                  event.stopPropagation();
                  onTokenChange(tile.id, token);
                }}
                onKeyDown={(event) =>
                  onKeyActivate(event, () => onTokenChange(tile.id, token))
                }
              >
                <rect
                  x={buttonX}
                  y={buttonY}
                  width={48}
                  height={24}
                  rx={6}
                  fill={isSelected ? "#083344" : "#ffffff"}
                  stroke={isSelected ? "#083344" : "#cbd5e1"}
                  strokeWidth={1.5}
                />
                <text
                  x={buttonX + 24}
                  y={buttonY + 17}
                  textAnchor="middle"
                  className={cn(
                    "text-[13px] font-black",
                    isSelected
                      ? "fill-white"
                      : isHotToken
                        ? "fill-red-700"
                        : "fill-slate-800",
                  )}
                >
                  {token}
                </text>
              </g>
            );
          })}
        </>
      ) : null}
    </g>
  );
}

function VertexPieceMenu({
  vertex,
  piece,
  selectedPlayer,
  viewBoxBounds,
  onPieceSet,
  onPieceClear,
  onKeyActivate,
}: {
  vertex: VertexGeometry;
  piece: PieceState | undefined;
  selectedPlayer: PlayerColor;
  viewBoxBounds: ViewBoxBounds;
  onPieceSet: (vertexId: string, kind: PieceKind) => void;
  onPieceClear: (vertexId: string) => void;
  onKeyActivate: (event: KeyboardEvent<SVGGElement>, action: () => void) => void;
}) {
  const menuWidth = 294;
  const menuHeight = 90;
  const player = getPlayerOption(selectedPlayer);
  const menuX = clamp(
    vertex.point.x - menuWidth / 2,
    viewBoxBounds.x + 14,
    viewBoxBounds.x + viewBoxBounds.width - menuWidth - 14,
  );
  const menuY = Math.max(
    viewBoxBounds.y + 14,
    vertex.point.y - menuHeight - 38,
  );
  const arrowX = clamp(vertex.point.x, menuX + 24, menuX + menuWidth - 24);

  const actions: Array<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
  }> = [
    {
      label: "Settlement",
      isSelected:
        piece?.player === selectedPlayer && piece.kind === "settlement",
      onClick: () => onPieceSet(vertex.id, "settlement"),
    },
    {
      label: "City",
      isSelected: piece?.player === selectedPlayer && piece.kind === "city",
      onClick: () => onPieceSet(vertex.id, "city"),
    },
    {
      label: "Clear",
      isSelected: false,
      onClick: () => onPieceClear(vertex.id),
    },
  ];

  return (
    <g
      role="menu"
      aria-label="Settlement or city"
      className="cursor-default"
      onClick={(event) => event.stopPropagation()}
    >
      <path
        d={`M ${arrowX - 12} ${menuY + menuHeight} L ${arrowX} ${
          menuY + menuHeight + 12
        } L ${arrowX + 12} ${menuY + menuHeight} Z`}
        fill="#fffaf0"
        stroke="#0f172a"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect
        x={menuX}
        y={menuY}
        width={menuWidth}
        height={menuHeight}
        rx={10}
        fill="#fffaf0"
        stroke="#0f172a"
        strokeWidth={2.5}
      />
      <circle
        cx={menuX + 21}
        cy={menuY + 22}
        r={8}
        fill={player.fill}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.5}
      />
      <text
        x={menuX + 36}
        y={menuY + 27}
        className="fill-slate-700 text-[12px] font-black uppercase"
      >
        {player.label}
      </text>
      {actions.map((action, index) => {
        const buttonX = menuX + 12 + index * 90;
        const buttonY = menuY + 42;
        const isClear = action.label === "Clear";

        return (
          <g
            key={action.label}
            role="menuitem"
            tabIndex={0}
            className="cursor-pointer outline-none"
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
            onKeyDown={(event) => onKeyActivate(event, action.onClick)}
          >
            <rect
              x={buttonX}
              y={buttonY}
              width={84}
              height={30}
              rx={6}
              fill={
                action.isSelected
                  ? "#083344"
                  : isClear
                    ? "#fff1f2"
                    : "#ffffff"
              }
              stroke={
                action.isSelected
                  ? "#083344"
                  : isClear
                    ? "#fda4af"
                    : "#cbd5e1"
              }
              strokeWidth={1.5}
            />
            <text
              x={buttonX + 42}
              y={buttonY + 20}
              textAnchor="middle"
              className={cn(
                "text-[12px] font-black",
                action.isSelected
                  ? "fill-white"
                  : isClear
                    ? "fill-rose-800"
                    : "fill-slate-800",
              )}
            >
              {action.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function EditorToolbar({
  mode,
  selectedPort,
  selectedPlayer,
  onPortChange,
  onPlayerChange,
}: {
  mode: ToolMode;
  selectedPort: PortType;
  selectedPlayer: PlayerColor;
  onPortChange: (value: PortType) => void;
  onPlayerChange: (value: PlayerColor) => void;
}) {
  return (
    <div className="rounded-lg border border-white/35 bg-white/92 p-3 shadow-xl shadow-cyan-950/20 backdrop-blur lg:col-start-2 lg:row-start-2">
      {mode === "port" ? (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
            <ShipWheel className="size-4" />
            Port
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {PORT_OPTIONS.map((port) => (
              <button
                key={port.value}
                type="button"
                className={cn(
                  "flex min-h-14 items-center justify-center rounded-md border px-3 text-sm font-black shadow-sm transition",
                  selectedPort === port.value
                    ? "border-cyan-950 bg-cyan-950 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-cyan-50",
                )}
                onClick={() => onPortChange(port.value)}
              >
                {port.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "road" || mode === "piece" ? (
        <div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Route className="size-4" />
              Player
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLAYER_OPTIONS.map((player) => (
                <button
                  key={player.value}
                  type="button"
                  className={cn(
                    "flex min-h-14 items-center gap-2 rounded-md border px-3 text-sm font-bold shadow-sm transition",
                    selectedPlayer === player.value
                      ? "border-cyan-950 bg-cyan-950 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-cyan-50",
                  )}
                  onClick={() => onPlayerChange(player.value)}
                >
                  <span
                    className="size-7 rounded-full border border-black/25"
                    style={{ backgroundColor: player.fill }}
                    aria-hidden="true"
                  />
                  {player.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mode === "robber" ? (
        <div className="flex min-h-20 items-center justify-center gap-3 rounded-md bg-slate-950 px-4 py-3 text-white">
          <CircleDot className="size-6" />
          <span className="text-sm font-black uppercase tracking-wide">
            Robber
          </span>
        </div>
      ) : null}
    </div>
  );
}

function BoardSummary({
  board,
  warnings,
}: {
  board: BoardState;
  warnings: string[];
}) {
  const tilesWithTokens = board.tiles.filter((tile) => tile.token !== null).length;
  const roadCount = Object.keys(board.roads).length;
  const pieceCount = Object.keys(board.pieces).length;
  const portCount = Object.keys(board.ports).length;

  return (
    <section className="rounded-lg border border-white/35 bg-white/92 p-3 shadow-xl shadow-cyan-950/20 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-black">
          <Sparkles className="size-4 text-cyan-700" />
          Board
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black",
            warnings.length
              ? "bg-amber-100 text-amber-900"
              : "bg-emerald-100 text-emerald-900",
          )}
        >
          {warnings.length ? (
            <AlertTriangle className="size-3.5" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          {warnings.length || "Ready"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        <SummaryStat label="Tiles" value={board.tiles.length} />
        <SummaryStat label="Nos" value={tilesWithTokens} />
        <SummaryStat label="Ports" value={portCount} />
        <SummaryStat label="Roads" value={roadCount} />
        <SummaryStat label="Bld" value={pieceCount} />
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
      <div className="text-base font-black text-slate-950">{value}</div>
      <div className="truncate text-[0.66rem] font-bold uppercase text-slate-500">
        {label}
      </div>
    </div>
  );
}

function DetectionImagePanel({
  detectionId,
  isConvexConfigured,
}: CatanBoardEditorProps) {
  if (!isConvexConfigured) {
    return <ImagePanelMessage>Image unavailable</ImagePanelMessage>;
  }

  return <ConfiguredDetectionImagePanel detectionId={detectionId} />;
}

function ConfiguredDetectionImagePanel({
  detectionId,
}: Pick<CatanBoardEditorProps, "detectionId">) {
  const detection = useQuery(api.detections.get, { detectionId });

  if (detection === undefined) {
    return <ImagePanelMessage>Loading image</ImagePanelMessage>;
  }

  if (!detection?.image.url) {
    return <ImagePanelMessage>Image unavailable</ImagePanelMessage>;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/35 bg-white/92 shadow-xl shadow-cyan-950/20 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-sm font-black">
        <Camera className="size-4 text-cyan-700" />
        Source
      </div>
      <div className="relative aspect-[4/3] w-full bg-zinc-950">
        <Image
          src={detection.image.url}
          alt={`Preview of ${detection.image.name}`}
          fill
          sizes="360px"
          className="object-contain"
          unoptimized
          priority
        />
      </div>
      <div className="border-t border-slate-200 px-3 py-2">
        <p className="truncate text-sm font-medium">{detection.image.name}</p>
        <p className="text-xs font-medium text-slate-500">
          {Math.round(detection.image.size / 1024)} KB
        </p>
      </div>
    </section>
  );
}

function ImagePanelMessage({ children }: { children: ReactNode }) {
  return (
    <section className="grid aspect-[4/3] place-items-center rounded-lg border border-white/35 bg-white/92 p-4 text-sm font-bold text-slate-500 shadow-xl shadow-cyan-950/20 backdrop-blur">
      <div className="grid place-items-center gap-2">
        <Camera className="size-7 text-cyan-700" />
        {children}
      </div>
    </section>
  );
}

function WarningsPanel({ warnings }: { warnings: string[] }) {
  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-white/35 bg-white/92 shadow-xl shadow-cyan-950/20 backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-black">
          <AlertTriangle className="size-4 text-amber-700" />
          Log
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">
          {warnings.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {warnings.length ? (
          warnings.map((warning) => (
            <div
              key={warning}
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
            >
              {warning}
            </div>
          ))
        ) : (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
            No rule warnings.
          </div>
        )}
      </div>
    </section>
  );
}

function TerrainEmblem({
  terrain,
  center,
}: {
  terrain: TerrainType;
  center: Point;
}) {
  if (terrain === "forest") {
    return (
      <g opacity="0.72">
        <polygon
          points={`${center.x - 20},${center.y + 4} ${center.x},${center.y - 34} ${center.x + 20},${center.y + 4}`}
          fill="#125b35"
        />
        <rect x={center.x - 4} y={center.y} width={8} height={24} rx={2} fill="#6f4424" />
        <polygon
          points={`${center.x + 14},${center.y + 18} ${center.x + 30},${center.y - 12} ${center.x + 46},${center.y + 18}`}
          fill="#176d40"
        />
        <rect x={center.x + 27} y={center.y + 15} width={6} height={17} rx={2} fill="#6f4424" />
      </g>
    );
  }

  if (terrain === "pasture") {
    return (
      <g opacity="0.78">
        <ellipse cx={center.x} cy={center.y - 8} rx={27} ry={16} fill="#f8fafc" />
        <circle cx={center.x - 20} cy={center.y - 18} r={10} fill="#f8fafc" />
        <circle cx={center.x + 3} cy={center.y - 23} r={11} fill="#f8fafc" />
        <circle cx={center.x + 24} cy={center.y - 12} r={9} fill="#f8fafc" />
        <circle cx={center.x + 33} cy={center.y - 8} r={7} fill="#3f3f46" />
        <line x1={center.x - 13} y1={center.y + 7} x2={center.x - 13} y2={center.y + 25} stroke="#3f3f46" strokeWidth={4} strokeLinecap="round" />
        <line x1={center.x + 15} y1={center.y + 7} x2={center.x + 15} y2={center.y + 25} stroke="#3f3f46" strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }

  if (terrain === "fields") {
    return (
      <g fill="none" opacity="0.62" stroke="#7c4a03" strokeLinecap="round" strokeWidth={4}>
        <path d={`M ${center.x} ${center.y + 28} C ${center.x - 6} ${center.y + 4}, ${center.x - 2} ${center.y - 18}, ${center.x + 8} ${center.y - 34}`} />
        <path d={`M ${center.x - 4} ${center.y + 5} L ${center.x - 25} ${center.y - 8}`} />
        <path d={`M ${center.x + 1} ${center.y - 8} L ${center.x - 16} ${center.y - 24}`} />
        <path d={`M ${center.x + 6} ${center.y - 20} L ${center.x + 27} ${center.y - 32}`} />
        <path d={`M ${center.x - 22} ${center.y + 22} C ${center.x} ${center.y + 9}, ${center.x + 24} ${center.y + 8}, ${center.x + 43} ${center.y - 6}`} />
      </g>
    );
  }

  if (terrain === "hills") {
    return (
      <g fill="#ffd8bd" opacity="0.62" stroke="#8b3a1f" strokeWidth={2}>
        <rect x={center.x - 34} y={center.y - 28} width={25} height={13} rx={2} />
        <rect x={center.x - 5} y={center.y - 28} width={25} height={13} rx={2} />
        <rect x={center.x + 24} y={center.y - 28} width={25} height={13} rx={2} />
        <rect x={center.x - 20} y={center.y - 11} width={25} height={13} rx={2} />
        <rect x={center.x + 9} y={center.y - 11} width={25} height={13} rx={2} />
      </g>
    );
  }

  if (terrain === "mountains") {
    return (
      <g opacity="0.72">
        <polygon
          points={`${center.x - 46},${center.y + 18} ${center.x - 18},${center.y - 30} ${center.x + 9},${center.y + 18}`}
          fill="#f1f5f9"
          stroke="#667085"
          strokeWidth={3}
        />
        <polygon
          points={`${center.x - 11},${center.y + 22} ${center.x + 20},${center.y - 38} ${center.x + 51},${center.y + 22}`}
          fill="#e2e8f0"
          stroke="#667085"
          strokeWidth={3}
        />
      </g>
    );
  }

  return (
    <g opacity="0.48" stroke="#6b4b1f" strokeLinecap="round" strokeWidth={5}>
      <line x1={center.x} y1={center.y - 33} x2={center.x} y2={center.y + 25} />
      <line x1={center.x - 19} y1={center.y - 5} x2={center.x} y2={center.y + 7} />
      <line x1={center.x + 19} y1={center.y - 14} x2={center.x} y2={center.y - 2} />
    </g>
  );
}

function RobberMarker({ center }: { center: Point }) {
  return (
    <g filter="url(#piece-shadow)">
      <circle cx={center.x - 38} cy={center.y + 2} r={12} fill="#52525b" stroke="#f8fafc" strokeWidth={3} />
      <rect x={center.x - 49} y={center.y + 10} width={22} height={31} rx={8} fill="#71717a" stroke="#f8fafc" strokeWidth={3} />
    </g>
  );
}

function PieceMarker({ point, piece }: { point: Point; piece: PieceState }) {
  const fill = getPlayerOption(piece.player).fill;
  const stroke = piece.player === "white" ? "#334155" : "#111827";

  if (piece.kind === "city") {
    return (
      <g filter="url(#piece-shadow)">
        <rect x={point.x - 17} y={point.y - 5} width={34} height={22} rx={3} fill={fill} stroke={stroke} strokeWidth={3} />
        <rect x={point.x + 2} y={point.y - 20} width={17} height={37} rx={3} fill={fill} stroke={stroke} strokeWidth={3} />
        <polygon points={`${point.x - 20},${point.y - 5} ${point.x - 1},${point.y - 24} ${point.x + 18},${point.y - 5}`} fill={fill} stroke={stroke} strokeWidth={3} />
      </g>
    );
  }

  return (
    <g filter="url(#piece-shadow)">
      <rect x={point.x - 15} y={point.y - 1} width={30} height={23} rx={4} fill={fill} stroke={stroke} strokeWidth={3} />
      <polygon points={`${point.x - 19},${point.y} ${point.x},${point.y - 20} ${point.x + 19},${point.y}`} fill={fill} stroke={stroke} strokeWidth={3} />
    </g>
  );
}

function createInitialBoard(): BoardState {
  const tiles = INITIAL_TERRAINS.map((terrain, index) => ({
    id: `hex-${index}`,
    terrain,
    token: INITIAL_TOKENS[index],
    robber: terrain === "desert",
  }));
  const geometry = createBoardGeometry();
  const ports: Record<string, PortType> = {};
  const initialPorts: PortType[] = [
    "generic",
    "brick",
    "generic",
    "lumber",
    "ore",
    "generic",
    "grain",
    "wool",
    "generic",
  ];

  pickEvenly(geometry.boundaryEdges, initialPorts.length).forEach((edge, index) => {
      ports[edge.id] = initialPorts[index];
    });

  return {
    tiles,
    roads: {},
    pieces: {},
    ports,
  };
}

function createBoardGeometry(): BoardGeometry {
  const size = 72;
  const hexWidth = Math.sqrt(3) * size;
  const rowSpacing = 1.5 * size;
  const rows = [3, 4, 5, 4, 3];
  const maxColumns = 5;
  const margin = 100;
  const hexes: HexGeometry[] = [];
  const edgeMap = new Map<string, EdgeGeometry>();
  const vertexMap = new Map<string, VertexGeometry>();
  let tileIndex = 0;

  rows.forEach((columns, rowIndex) => {
    const rowOffset = ((maxColumns - columns) * hexWidth) / 2;
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const center = {
        x: margin + rowOffset + hexWidth / 2 + columnIndex * hexWidth,
        y: margin + size + rowIndex * rowSpacing,
      };
      const points = createHexPoints(center, size);
      const hexId = `hex-${tileIndex}`;
      hexes.push({ id: hexId, center, points });

      points.forEach((point, pointIndex) => {
        const nextPoint = points[(pointIndex + 1) % points.length];
        const vertexId = pointKey(point);
        const nextVertexId = pointKey(nextPoint);
        vertexMap.set(vertexId, { id: vertexId, point });
        vertexMap.set(nextVertexId, { id: nextVertexId, point: nextPoint });
        const edgeId = edgeKey(vertexId, nextVertexId);
        const existing = edgeMap.get(edgeId);
        if (existing) {
          existing.adjacentHexIds.push(hexId);
        } else {
          edgeMap.set(edgeId, {
            id: edgeId,
            a: vertexId,
            b: nextVertexId,
            start: point,
            end: nextPoint,
            adjacentHexIds: [hexId],
          });
        }
      });

      tileIndex += 1;
    }
  });

  const edges = Array.from(edgeMap.values());
  const vertices = Array.from(vertexMap.values());
  const boardCenter = getAveragePoint(hexes.map((hex) => hex.center));
  const boundaryEdges = edges
    .filter((edge) => edge.adjacentHexIds.length === 1)
    .sort((a, b) => {
      const angleA = Math.atan2(
        midpoint(a).y - boardCenter.y,
        midpoint(a).x - boardCenter.x,
      );
      const angleB = Math.atan2(
        midpoint(b).y - boardCenter.y,
        midpoint(b).x - boardCenter.x,
      );
      return angleA - angleB;
    });
  const allPoints = vertices.map((vertex) => vertex.point);
  const bounds = getBounds(allPoints);
  const padding = 85;

  return {
    hexes,
    edges,
    vertices,
    boundaryEdges,
    viewBox: `${bounds.minX - padding} ${bounds.minY - padding} ${
      bounds.maxX - bounds.minX + padding * 2
    } ${bounds.maxY - bounds.minY + padding * 2}`,
    boardCenter,
  };
}

function createHexPoints(center: Point, size: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 90);
    return {
      x: round(center.x + size * Math.cos(angle)),
      y: round(center.y + size * Math.sin(angle)),
    };
  });
}

function getViewBoxBounds(viewBox: string): ViewBoxBounds {
  const [x, y, width, height] = viewBox
    .split(" ")
    .map((value) => Number(value));

  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function validateBoardState(board: BoardState, geometry: BoardGeometry) {
  const warnings: string[] = [];
  const terrainCounts = countBy(board.tiles, (tile) => tile.terrain);
  const tokenCount = board.tiles.filter((tile) => tile.token !== null).length;
  const robberCount = board.tiles.filter((tile) => tile.robber).length;
  const portCounts = countRecordValues(board.ports);
  const pieceCounts = countPieces(board.pieces);
  const roadCounts = countRecordPlayers(board.roads);

  TERRAIN_OPTIONS.forEach((terrain) => {
    const count = terrainCounts[terrain.value] ?? 0;
    if (count !== terrain.standardCount) {
      warnings.push(
        `${terrain.label} count is ${count}; standard base board uses ${terrain.standardCount}.`,
      );
    }
  });

  if (tokenCount !== 18) {
    warnings.push(`Number token count is ${tokenCount}; standard count is 18.`);
  }

  board.tiles.forEach((tile, index) => {
    if (tile.terrain === "desert" && tile.token !== null) {
      warnings.push(`Tile ${index + 1} is desert but has a number token.`);
    }
    if (tile.terrain !== "desert" && tile.token === null) {
      warnings.push(`Tile ${index + 1} produces resources but has no token.`);
    }
  });

  if (robberCount !== 1) {
    warnings.push(`Robber count is ${robberCount}; base rules expect 1.`);
  }

  if (Object.keys(board.ports).length !== 9) {
    warnings.push(
      `Port count is ${Object.keys(board.ports).length}; standard count is 9.`,
    );
  }

  PORT_OPTIONS.forEach((port) => {
    const count = portCounts[port.value] ?? 0;
    if (count !== port.standardCount) {
      warnings.push(
        `${port.label} port count is ${count}; standard count is ${port.standardCount}.`,
      );
    }
  });

  geometry.edges.forEach((edge) => {
    const firstPiece = board.pieces[edge.a];
    const secondPiece = board.pieces[edge.b];
    if (firstPiece && secondPiece) {
      warnings.push("Two settlements or cities are adjacent.");
    }
  });

  PLAYER_OPTIONS.forEach((player) => {
    const pieces = pieceCounts[player.value] ?? {
      settlements: 0,
      cities: 0,
    };
    const roads = roadCounts[player.value] ?? 0;
    if (pieces.settlements > 5) {
      warnings.push(
        `${player.label} has ${pieces.settlements} settlements; piece supply is 5.`,
      );
    }
    if (pieces.cities > 4) {
      warnings.push(
        `${player.label} has ${pieces.cities} cities; piece supply is 4.`,
      );
    }
    if (roads > 15) {
      warnings.push(`${player.label} has ${roads} roads; piece supply is 15.`);
    }
  });

  return Array.from(new Set(warnings));
}

function pointsToString(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function scalePolygon(points: Point[], center: Point, scale: number) {
  return points.map((point) => ({
    x: round(center.x + (point.x - center.x) * scale),
    y: round(center.y + (point.y - center.y) * scale),
  }));
}

function getTerrainOption(terrain: TerrainType) {
  return TERRAIN_OPTIONS.find((option) => option.value === terrain)!;
}

function getTerrainTrayLabel(
  terrain: (typeof TERRAIN_OPTIONS)[number],
) {
  if (terrain.value === "mountains") {
    return "Ore";
  }
  if (terrain.value === "pasture") {
    return "Wool";
  }
  if (terrain.value === "desert") {
    return "Desert";
  }
  return terrain.resource;
}

function getPlayerOption(player: PlayerColor) {
  return PLAYER_OPTIONS.find((option) => option.value === player)!;
}

function pointKey(point: Point) {
  return `${round(point.x)}:${round(point.y)}`;
}

function edgeKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function midpoint(edge: Pick<EdgeGeometry, "start" | "end">) {
  return {
    x: (edge.start.x + edge.end.x) / 2,
    y: (edge.start.y + edge.end.y) / 2,
  };
}

function getPortPoint(edge: EdgeGeometry, boardCenter: Point) {
  const mid = midpoint(edge);
  const vector = {
    x: mid.x - boardCenter.x,
    y: mid.y - boardCenter.y,
  };
  const length = Math.hypot(vector.x, vector.y) || 1;
  return {
    x: mid.x + (vector.x / length) * 58,
    y: mid.y + (vector.y / length) * 58,
  };
}

function getPortShortLabel(port: PortType) {
  if (port === "generic") {
    return "3:1";
  }
  return `${port.slice(0, 1).toUpperCase()} 2`;
}

function getTokenPips(token: Exclude<NumberToken, null>) {
  const pipCounts: Record<Exclude<NumberToken, null>, number> = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
  };
  return ".".repeat(pipCounts[token]);
}

function getAveragePoint(points: Point[]) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function getBounds(points: Point[]) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function countBy<T extends string>(
  items: TileState[],
  getValue: (item: TileState) => T,
) {
  return items.reduce(
    (counts, item) => {
      const value = getValue(item);
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
}

function countRecordValues<T extends string>(record: Record<string, T>) {
  return Object.values(record).reduce(
    (counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    },
    {} as Record<T, number>,
  );
}

function countRecordPlayers(record: Record<string, { player: PlayerColor }>) {
  return Object.values(record).reduce(
    (counts, value) => {
      counts[value.player] = (counts[value.player] ?? 0) + 1;
      return counts;
    },
    {} as Record<PlayerColor, number>,
  );
}

function countPieces(record: Record<string, PieceState>) {
  return Object.values(record).reduce(
    (counts, piece) => {
      const playerCounts = counts[piece.player] ?? {
        settlements: 0,
        cities: 0,
      };
      if (piece.kind === "settlement") {
        playerCounts.settlements += 1;
      } else {
        playerCounts.cities += 1;
      }
      counts[piece.player] = playerCounts;
      return counts;
    },
    {} as Record<PlayerColor, { settlements: number; cities: number }>,
  );
}

function pickEvenly<T>(items: T[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const itemIndex = Math.round((index * items.length) / count) % items.length;
    return items[itemIndex];
  });
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
