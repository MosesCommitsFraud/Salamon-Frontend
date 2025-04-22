"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import * as THREE from "three";
import { Rnd } from "react-rnd";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  SlidersHorizontal,
  Filter,
  X,
  Check,
  Square,
  HelpCircle,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronsUpDown
} from "lucide-react";

import {
  useCardStore,
  DeckEntry,
} from "@/lib/store/cardStore";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

// ---------------------------------------------
// Graph component with improved relationship visualization
// ---------------------------------------------
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

/** Types for the nodes/links in the graph */
interface CardNode {
  id: string;
  label: string;
  archetype?: string;
  cardAttribute?: string;
  imageUrl?: string;
  effects?: string[];
  banTcg?: string;
  banOcg?: string;
  banGoat?: string;
  atk?: number;
  defense?: number;
  race?: string;
  level?: number;
  cardDesc?: string;
  x: number;
  y: number;
  z: number;
}

interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

interface GraphData {
  nodes: CardNode[];
  links: GraphLink[];
}

interface GraphConfig {
  chargeStrength: number;
  linkDistance: number;
  nodeSize: number;
  cooldownTime: number;
  zoomLevel: number;
  is2D: boolean;
  highlightLinks: boolean;
}

// Relationship explanations
const relationshipExplanations: Record<string, string> = {
  archetype: "Cards belonging to the same archetype or series (e.g., 'Blue-Eyes' or 'Dark Magician' cards)",
  support: "Cards that boost or enhance other cards' effects",
  counter: "Cards that negate or counter specific strategies or effects",
  combo: "Cards that work together in a specific combo or sequence",
  synergy: "Cards with effects that complement each other without being a direct combo",
  tech: "Tech cards that address specific meta concerns or counter popular strategies",
  // Add any other relationships your backend provides
};

interface GraphTabProps {
  deckId: string;
}

/**
 * Converts a DeckEntry[] array to the format [ { "41546": 2 }, { "32864": 1 }, ... ]
 */
function buildSectionArray(deckEntries: DeckEntry[]) {
  const countMap: Record<string, number> = {};
  for (const entry of deckEntries) {
    const cardIdStr = String(entry.card.id);
    countMap[cardIdStr] = (countMap[cardIdStr] || 0) + 1;
  }
  return Object.keys(countMap).map((id) => ({ [id]: countMap[id] }));
}

export function Graph({ deckId }: GraphTabProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<CardNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState<Set<string>>(new Set());
  const [showControls, setShowControls] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CardNode[]>([]);

  // Graph configuration with stronger defaults for better readability
  const [graphConfig, setGraphConfig] = useState<GraphConfig>({
    chargeStrength: -300, // Stronger repulsion by default
    linkDistance: 120,    // Longer links for better visibility
    nodeSize: 20,
    cooldownTime: 15000,
    zoomLevel: 220,
    is2D: false,          // Default to 3D mode
    highlightLinks: true  // Highlight links by default
  });

  // Relation type filters
  const [visibleRelations, setVisibleRelations] = useState<Record<string, boolean>>({});

  // Keep track of all relation types
  const [relationTypes, setRelationTypes] = useState<string[]>([]);

  // Focus mode - when a card is selected, show only its connections
  const [focusMode, setFocusMode] = useState(false);

  const graphRef = useRef<any>(null);

  // Get the deck from the store
  const foundDeck = useCardStore((state) => state.decks.find((d) => d.id === deckId));

  // Filter graph data based on visible relation types and focus mode
  const filteredGraphData = useMemo(() => {
    if (!graphData.links || graphData.links.length === 0) {
      return graphData;
    }

    let filteredLinks = graphData.links.filter(link =>
        !link.relation || visibleRelations[link.relation] === undefined || visibleRelations[link.relation]
    );

    // In focus mode, only show links connected to the selected node
    if (focusMode && selectedNode) {
      filteredLinks = filteredLinks.filter(link =>
          link.source === selectedNode.id ||
          (typeof link.source === 'object' && link.source.id === selectedNode.id) ||
          link.target === selectedNode.id ||
          (typeof link.target === 'object' && link.target.id === selectedNode.id)
      );

      // Generate sets of connected node IDs
      const connectedNodes = new Set<string>();
      connectedNodes.add(selectedNode.id);

      filteredLinks.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        connectedNodes.add(sourceId as string);
        connectedNodes.add(targetId as string);
      });

      // Only show connected nodes
      const filteredNodes = graphData.nodes.filter(node => connectedNodes.has(node.id));

      return {
        nodes: filteredNodes,
        links: filteredLinks
      };
    }

    // Regular filtering, show all nodes
    return {
      nodes: graphData.nodes,
      links: filteredLinks
    };
  }, [graphData, visibleRelations, focusMode, selectedNode]);

  // Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim() || !graphData.nodes.length) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = graphData.nodes.filter(node =>
        node.label.toLowerCase().includes(query) ||
        (node.archetype && node.archetype.toLowerCase().includes(query))
    );

    setSearchResults(results);
  }, [searchQuery, graphData.nodes]);

  // Update forces when configuration changes
  useEffect(() => {
    if (!graphRef.current) return;

    const fg = graphRef.current;

    // Update charge strength (repulsion)
    fg.d3Force('charge').strength(graphConfig.chargeStrength);

    // Update link distance
    fg.d3Force('link').distance(graphConfig.linkDistance);

    // Handle 2D/3D mode
    if (graphConfig.is2D) {
      // Flatten to 2D - no force in z direction
      graphData.nodes.forEach(node => {
        node.z = 0;
      });
      // Update camera position to top view
      fg.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
    }

    // Reheat the simulation to make changes take effect immediately
    if (fg.d3Force('simulation')) {
      fg.d3Force('simulation').alpha(1).restart();
    } else {
      // If simulation isn't directly accessible, use this alternative
      fg.refresh();
    }
  }, [graphConfig, graphData.nodes]);

  // Load graph data
  useEffect(() => {
    if (!foundDeck) {
      // No deck found, no graph
      setGraphData({ nodes: [], links: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // 1) Format deck data for the API
    const deckPayload = {
      name: foundDeck.name,
      main: buildSectionArray(foundDeck.mainCards),
      extra: buildSectionArray(foundDeck.extraCards),
      side: buildSectionArray(foundDeck.sideCards),
    };

    const bodyData = {
      decks: [deckPayload],
    };

    // 2) Call the graph API
    fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    })
        .then((res) => {
          if (!res.ok) throw new Error(`Request failed: ${res.status}`);
          return res.json();
        })
        .then((data: GraphData) => {
          // Add initial positions to space cards out better
          data.nodes.forEach((node, i) => {
            // Position nodes in a spherical pattern initially
            const phi = Math.acos(-1 + (2 * i) / data.nodes.length);
            const theta = Math.sqrt(data.nodes.length * Math.PI) * phi;
            node.x = 200 * Math.cos(theta) * Math.sin(phi);
            node.y = 200 * Math.sin(theta) * Math.sin(phi);
            node.z = 200 * Math.cos(phi);
          });

          setGraphData(data);

          // Extract all unique relation types
          const relations = Array.from(new Set(data.links.map(link => link.relation))).filter(Boolean);
          setRelationTypes(relations);

          // Initialize all relations to visible
          const initialVisibility = relations.reduce((acc, rel) => {
            acc[rel] = true;
            return acc;
          }, {} as Record<string, boolean>);

          setVisibleRelations(initialVisibility);
          setIsLoading(false);

          // Auto-spread first time
          setTimeout(() => {
            handleSpreadOut(true);
          }, 1000);
        })
        .catch((err) => {
          console.error("Error loading graph data:", err);
          toast.error("Failed to load graph data");
          setIsLoading(false);
        });
  }, [foundDeck, deckId]);

  const handleNodeClick = (node: CardNode) => {
    setSelectedNode(node);

    if (graphConfig.highlightLinks) {
      // Highlight this node and its connections
      const connectedLinks = new Set<string>();
      const connectedNodes = new Set<string>([node.id]);

      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === node.id || targetId === node.id) {
          // Create a unique link identifier
          connectedLinks.add(`${sourceId}-${targetId}-${link.relation}`);
          connectedNodes.add(sourceId as string);
          connectedNodes.add(targetId as string);
        }
      });

      setHighlightedLinks(connectedLinks);
      setHighlightedNodes(connectedNodes);
    }
  };

  const clearHighlights = () => {
    setHighlightedLinks(new Set());
    setHighlightedNodes(new Set());
  };

  const closePopup = () => {
    setSelectedNode(null);

    if (!graphConfig.highlightLinks) {
      clearHighlights();
    }
  };

  // Temporarily increase charge strength to spread out nodes
  const handleSpreadOut = (isInitial = false) => {
    if (!graphRef.current) return;

    if (!isInitial) {
      toast.info("Spreading out cards...");
    }

    // Apply temporary strong repulsion force
    graphRef.current.d3Force('charge').strength(graphConfig.chargeStrength * 4);

    // Add some random movement to unstick nodes
    graphData.nodes.forEach(node => {
      node.x += (Math.random() - 0.5) * 30;
      node.y += (Math.random() - 0.5) * 30;
      node.z += (Math.random() - 0.5) * 30;
    });

    // Reheat the simulation
    if (graphRef.current.d3Force('simulation')) {
      graphRef.current.d3Force('simulation').alpha(1).restart();
    } else {
      graphRef.current.refresh();
    }

    // Return to normal after a delay
    setTimeout(() => {
      if (graphRef.current) {
        graphRef.current.d3Force('charge').strength(graphConfig.chargeStrength);
      }
    }, 2000);
  };

  // Toggle 2D/3D mode
  const toggle2DMode = () => {
    setGraphConfig(prev => {
      const newConfig = { ...prev, is2D: !prev.is2D };

      // When switching to 2D, update the force simulation
      if (graphRef.current) {
        if (newConfig.is2D) {
          // Flatten to 2D - no force in z direction
          graphData.nodes.forEach(node => {
            node.z = 0;
          });
          // Update camera position to top view
          graphRef.current.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
        } else {
          // Spread in 3D again
          handleSpreadOut(true);
        }
      }

      return newConfig;
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!graphRef.current) return;
    const distance = graphRef.current.cameraPosition().z;
    graphRef.current.cameraPosition({ z: distance * 0.7 }, 400);
  };

  const handleZoomOut = () => {
    if (!graphRef.current) return;
    const distance = graphRef.current.cameraPosition().z;
    graphRef.current.cameraPosition({ z: distance * 1.3 }, 400);
  };

  const handleResetView = () => {
    if (!graphRef.current) return;
    graphRef.current.cameraPosition({ x: 0, y: 0, z: graphConfig.zoomLevel }, 800);
    graphRef.current.controls().reset();
  };

  // Handler for slider changes
  const handleSliderChange = (key: keyof GraphConfig, value: number | number[]) => {
    const numValue = Array.isArray(value) ? value[0] : value;

    setGraphConfig(prev => ({
      ...prev,
      [key]: numValue
    }));

    // Update forces immediately
    if (graphRef.current) {
      if (key === 'chargeStrength') {
        graphRef.current.d3Force('charge').strength(numValue);
      } else if (key === 'linkDistance') {
        graphRef.current.d3Force('link').distance(numValue);
      }

      // Reheat the simulation to make changes take effect immediately
      if (graphRef.current.d3Force('simulation')) {
        graphRef.current.d3Force('simulation').alpha(0.3).restart();
      } else {
        // Alternative method to refresh the graph
        graphRef.current.refresh();
      }
    }
  };

  // Toggle relation visibility
  const toggleRelation = (relation: string) => {
    setVisibleRelations(prev => ({
      ...prev,
      [relation]: !prev[relation]
    }));
  };

  // Color links based on relationship type and highlight status
  const getLinkColor = (link: GraphLink) => {
    // Check if link is highlighted
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkId = `${sourceId}-${targetId}-${link.relation}`;

    // Create brighter colors for highlighted links
    if (highlightedLinks.has(linkId)) {
      switch(link.relation) {
        case 'archetype': return 'rgba(96, 165, 250, 1)';   // Bright blue
        case 'support': return 'rgba(52, 211, 153, 1)';     // Bright green
        case 'counter': return 'rgba(248, 113, 113, 1)';    // Bright red
        case 'combo': return 'rgba(244, 114, 182, 1)';      // Bright pink
        case 'tech': return 'rgba(251, 191, 36, 1)';        // Bright amber
        case 'synergy': return 'rgba(167, 139, 250, 1)';    // Bright purple
        default: return 'rgba(255, 255, 255, 1)';           // Bright white
      }
    }

    // Regular colors for non-highlighted links
    switch(link.relation) {
      case 'archetype': return 'rgba(59, 130, 246, 0.7)';   // Blue
      case 'support': return 'rgba(16, 185, 129, 0.7)';     // Green
      case 'counter': return 'rgba(239, 68, 68, 0.7)';      // Red
      case 'combo': return 'rgba(236, 72, 153, 0.7)';       // Pink
      case 'tech': return 'rgba(245, 158, 11, 0.7)';        // Amber
      case 'synergy': return 'rgba(139, 92, 246, 0.7)';     // Purple
      default: return 'rgba(255, 255, 255, 0.5)';           // White default
    }
  };

  // Get link width based on relationship and highlight status
  const getLinkWidth = (link: GraphLink) => {
    // Check if link is highlighted
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkId = `${sourceId}-${targetId}-${link.relation}`;

    const isHighlighted = highlightedLinks.has(linkId);
    const highlightMultiplier = isHighlighted ? 2 : 1;

    switch(link.relation) {
      case 'archetype': return 2.5 * highlightMultiplier;
      case 'support': return 2 * highlightMultiplier;
      case 'synergy': return 2 * highlightMultiplier;
      default: return 1.5 * highlightMultiplier;
    }
  };

  // Focus on a specific card from search results
  const focusOnCard = (node: CardNode) => {
    if (!graphRef.current) return;

    setSelectedNode(node);

    // Move camera to focus on the node
    const distance = graphRef.current.cameraPosition().z;
    const nodePosition = graphRef.current.graph2ScreenCoords(node.x, node.y, node.z);

    graphRef.current.cameraPosition(
        { x: node.x, y: node.y, z: distance },  // New position - keep same distance but center on node
        { x: node.x, y: node.y, z: 0 },         // Look-at position
        1000                                     // Animation duration in ms
    );

    // Highlight this node and its connections
    if (graphConfig.highlightLinks) {
      handleNodeClick(node);
    }

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
      <div className="relative w-full h-[80vh] bg-gradient-to-br from-black via-slate-950 to-blue-950 text-white">
        {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                <p className="text-blue-300">Loading card relationships...</p>
              </div>
            </div>
        ) : (
            <>
              {/* 3D Graph */}
              <ForceGraph3D
                  ref={graphRef}
                  graphData={filteredGraphData}
                  nodeLabel={(node: CardNode) => node.label}
                  onNodeClick={handleNodeClick}
                  nodeAutoColorBy="archetype"
                  linkWidth={getLinkWidth}
                  linkColor={getLinkColor}

                  // Force simulation parameters
                  d3Force={(d3Force) => {
                    // Increase repulsive force between nodes
                    d3Force('charge').strength(graphConfig.chargeStrength);
                    // Set link distance
                    d3Force('link').distance(graphConfig.linkDistance);

                    // For 2D mode, constrain to XY plane
                    if (graphConfig.is2D) {
                      // Add custom force to keep nodes on z=0
                      d3Force('z', () => {
                        return {
                          force: (alpha) => {
                            graphData.nodes.forEach(node => {
                              node.z = 0;
                            });
                          }
                        };
                      });
                    }
                  }}

                  // Simulation options
                  cooldownTime={graphConfig.cooldownTime}
                  warmupTicks={100}

                  // Directional arrows
                  linkDirectionalArrowLength={3}
                  linkDirectionalArrowRelPos={1}

                  // Node object appearance
                  nodeThreeObject={(node: CardNode) => {
                    // Set the node opacity based on highlight state when a node is selected
                    let opacity = 1;

                    // If there are highlighted nodes and this isn't highlighted, reduce opacity
                    if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) {
                      opacity = 0.3;
                    }

                    if (node.imageUrl) {
                      // Load card image as a sprite
                      const proxyUrl = `/api/card-image?url=${encodeURIComponent(node.imageUrl)}`;
                      const imgTexture = new THREE.TextureLoader()
                          .setCrossOrigin("anonymous")
                          .load(proxyUrl);
                      // Set color space
                      imgTexture.colorSpace = THREE.SRGBColorSpace;

                      const spriteMaterial = new THREE.SpriteMaterial({
                        map: imgTexture,
                        opacity: opacity,
                        transparent: true
                      });
                      const sprite = new THREE.Sprite(spriteMaterial);
                      sprite.scale.set(graphConfig.nodeSize, graphConfig.nodeSize * 1.4); // Keep aspect ratio
                      return sprite;
                    } else {
                      // Fallback: colored sphere
                      const geometry = new THREE.SphereGeometry(graphConfig.nodeSize / 5, 16, 16);
                      const mat = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        opacity: opacity,
                        transparent: true
                      });
                      return new THREE.Mesh(geometry, mat);
                    }
                  }}
              />

              {/* Controls panel */}
              {showControls && (
                  <div className="absolute top-4 left-4 bg-slate-800/90 border border-blue-900/30 p-4 rounded-lg shadow-lg z-20 max-w-[320px]">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-blue-300">Card Relationship Explorer</h3>
                      <div className="flex space-x-1">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="text-slate-400 hover:text-blue-300 transition-colors"
                        >
                          <HelpCircle size={16} />
                        </button>
                        <button
                            onClick={() => setShowControls(false)}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative mb-3">
                      <Input
                          type="text"
                          placeholder="Search cards..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />

                      {/* Search results dropdown */}
                      {searchResults.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg">
                            <ScrollArea className="max-h-[200px]">
                              {searchResults.map((node) => (
                                  <div
                                      key={node.id}
                                      className="p-2 text-sm hover:bg-slate-700 cursor-pointer"
                                      onClick={() => focusOnCard(node)}
                                  >
                                    {node.label}
                                    {node.archetype && <span className="text-blue-400 text-xs ml-1.5">({node.archetype})</span>}
                                  </div>
                              ))}
                            </ScrollArea>
                          </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-slate-700/50 border-blue-900/30 text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
                            onClick={() => handleSpreadOut(false)}
                        >
                          <Maximize2 className="w-4 h-4 mr-1" />
                          Spread Cards
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className={`bg-slate-700/50 border-blue-900/30 ${graphConfig.is2D ? 'text-green-300' : 'text-blue-300'} hover:bg-blue-900/30 hover:text-blue-200`}
                            onClick={toggle2DMode}
                        >
                          <ChevronsUpDown className="w-4 h-4 mr-1" />
                          {graphConfig.is2D ? '3D Mode' : '2D Mode'}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className={`bg-slate-700/50 border-blue-900/30 ${focusMode ? 'text-green-300' : 'text-blue-300'} hover:bg-blue-900/30 hover:text-blue-200`}
                            onClick={() => setFocusMode(!focusMode)}
                            disabled={!selectedNode}
                        >
                          {focusMode ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                          {focusMode ? 'Show All' : 'Focus Mode'}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className={`bg-slate-700/50 border-blue-900/30 ${graphConfig.highlightLinks ? 'text-green-300' : 'text-blue-300'} hover:bg-blue-900/30 hover:text-blue-200`}
                            onClick={() => {
                              setGraphConfig(prev => ({...prev, highlightLinks: !prev.highlightLinks}));
                              if (!graphConfig.highlightLinks) {
                                // If turning on highlighting and we have a selected node, highlight its links
                                if (selectedNode) {
                                  handleNodeClick(selectedNode);
                                }
                              } else {
                                // If turning off highlighting, clear highlights
                                clearHighlights();
                              }
                            }}
                        >
                          {graphConfig.highlightLinks ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                          {graphConfig.highlightLinks ? 'Highlight On' : 'Highlight Off'}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-slate-700/50 border-blue-900/30 text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                          <Filter className="w-4 h-4 mr-1" />
                          {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                      </div>

                      {/* Slider controls instead of +/- buttons */}
                      <div className="space-y-4 border-t border-slate-700 pt-3 mt-2">
                        <h4 className="text-xs font-medium text-slate-300 mb-3">Layout Settings</h4>

                        {/* Card Repulsion slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-slate-300">Card Repulsion</label>
                            <span className="text-xs text-slate-400">{Math.abs(graphConfig.chargeStrength)}</span>
                          </div>
                          <Slider
                              value={[Math.abs(graphConfig.chargeStrength)]}
                              min={100}
                              max={800}
                              step={20}
                              onValueChange={(value) => handleSliderChange('chargeStrength', -value[0])}
                              className="w-full"
                          />
                        </div>

                        {/* Link Distance slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-slate-300">Link Distance</label>
                            <span className="text-xs text-slate-400">{graphConfig.linkDistance}</span>
                          </div>
                          <Slider
                              value={[graphConfig.linkDistance]}
                              min={30}
                              max={300}
                              step={10}
                              onValueChange={(value) => handleSliderChange('linkDistance', value[0])}
                              className="w-full"
                          />
                        </div>

                        {/* Card Size slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs text-slate-300">Card Size</label>
                            <span className="text-xs text-slate-400">{graphConfig.nodeSize}</span>
                          </div>
                          <Slider
                              value={[graphConfig.nodeSize]}
                              min={10}
                              max={40}
                              step={2}
                              onValueChange={(value) => handleSliderChange('nodeSize', value[0])}
                              className="w-full"
                          />
                        </div>
                      </div>

                      {/* Help information about relationships */}
                      {showHelp && (
                          <div className="border-t border-slate-700 pt-2 mt-2">
                            <h4 className="text-xs font-medium text-slate-300 mb-2">Understanding Card Relationships</h4>
                            <div className="text-xs text-slate-400 space-y-1.5">
                              <p className="mb-1">Links between cards show how they relate to each other in gameplay:</p>
                              {Object.entries(relationshipExplanations).map(([relation, explanation]) => (
                                  <div key={relation} className="flex items-start mb-1.5">
                                    <div className="flex-shrink-0 mt-0.5">
                                      <div
                                          className="w-3 h-3 rounded-full mr-1.5"
                                          style={{
                                            backgroundColor: relation === 'archetype' ? '#3b82f6' :
                                                relation === 'support' ? '#10b981' :
                                                    relation === 'counter' ? '#ef4444' :
                                                        relation === 'combo' ? '#ec4899' :
                                                            relation === 'synergy' ? '#8b5cf6' : '#f59e0b'
                                          }}
                                      ></div>
                                    </div>
                                    <div>
                                      <span className="font-medium text-slate-300 capitalize">{relation}:</span> {explanation}
                                    </div>
                                  </div>
                              ))}
                              <p className="mt-2">
                                <span className="font-medium text-slate-300">Tips:</span> Use Focus Mode to see only connections for a selected card.
                                The 2D Mode makes relationships easier to see for some decks.
                              </p>
                            </div>
                          </div>
                      )}

                      {/* Relation type filters with custom toggle buttons */}
                      {showFilters && relationTypes.length > 0 && (
                          <div className="border-t border-slate-700 pt-2 mt-2">
                            <h4 className="text-xs font-medium text-slate-300 mb-2">Relationship Filters</h4>
                            <div className="space-y-2">
                              {relationTypes.map(relation => (
                                  <div key={relation} className="flex items-center justify-between">
                                    <label className="text-xs text-slate-300 capitalize flex-1">{relation}</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-6 px-2 text-xs ${
                                            visibleRelations[relation] !== false
                                                ? 'bg-blue-900/30 border-blue-500/50 text-blue-200'
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400'
                                        }`}
                                        onClick={() => toggleRelation(relation)}
                                    >
                                      {visibleRelations[relation] !== false ? (
                                          <Check size={12} className="mr-1" />
                                      ) : (
                                          <Square size={12} className="mr-1" />
                                      )}
                                      {visibleRelations[relation] !== false ? 'Show' : 'Hide'}
                                    </Button>
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* Legend */}
                      <div className="border-t border-slate-700 pt-2">
                        <h4 className="text-xs font-medium text-slate-300 mb-2">Relationship Types</h4>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></span>
                            <span className="text-xs text-slate-300">Archetype</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></span>
                            <span className="text-xs text-slate-300">Support</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></span>
                            <span className="text-xs text-slate-300">Counter</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-pink-500 mr-1.5"></span>
                            <span className="text-xs text-slate-300">Combo</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-purple-500 mr-1.5"></span>
                            <span className="text-xs text-slate-300">Synergy</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></span>
                            <span className="text-xs text-slate-300">Tech</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {/* Show controls button (when hidden) */}
              {!showControls && (
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowControls(true)}
                      className="absolute top-4 left-4 bg-slate-800/80 border-blue-900/20 z-20"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-1" />
                    Controls
                  </Button>
              )}

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 bg-slate-800/80 border border-blue-900/20 p-1 rounded-lg flex z-20">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleZoomIn}
                          className="h-8 w-8 text-slate-300 hover:text-blue-300"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Zoom In</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleZoomOut}
                          className="h-8 w-8 text-slate-300 hover:text-blue-300"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Zoom Out</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleResetView}
                          className="h-8 w-8 text-slate-300 hover:text-blue-300"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Reset View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Card popup when a node is clicked */}
              {selectedNode && (
                  <Rnd
                      default={{
                        x: window.innerWidth - 340,
                        y: 50,
                        width: 320,
                        height: 450,
                      }}
                      minWidth={200}
                      minHeight={200}
                      bounds="window"
                      className="z-30"
                  >
                    <div className="w-full h-full bg-slate-800 border border-blue-900/30 p-4 rounded shadow-lg overflow-y-auto">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-blue-300">
                          {selectedNode.label || "Unnamed Card"}
                        </h2>
                        <button
                            onClick={closePopup}
                            className="text-sm text-slate-400 hover:text-slate-200"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Card image */}
                      {selectedNode.imageUrl && (
                          <div className="flex justify-center mb-4">
                            <Image
                                src={`/api/card-image?url=${encodeURIComponent(selectedNode.imageUrl)}`}
                                alt={selectedNode.label}
                                width={200}
                                height={280}
                                className="rounded"
                            />
                          </div>
                      )}

                      {/* Card details */}
                      <div className="space-y-1.5 text-sm">
                        {selectedNode.archetype && (
                            <div className="flex">
                              <span className="font-medium text-slate-300 w-24">Archetype:</span>
                              <span className="text-blue-300">{selectedNode.archetype}</span>
                            </div>
                        )}
                        {selectedNode.cardAttribute && (
                            <div className="flex">
                              <span className="font-medium text-slate-300 w-24">Attribute:</span>
                              <span className="text-blue-300">{selectedNode.cardAttribute}</span>
                            </div>
                        )}
                        {selectedNode.race && (
                            <div className="flex">
                              <span className="font-medium text-slate-300 w-24">Race:</span>
                              <span className="text-blue-300">{selectedNode.race}</span>
                            </div>
                        )}
                        {selectedNode.level && (
                            <div className="flex">
                              <span className="font-medium text-slate-300 w-24">Level:</span>
                              <span className="text-blue-300">{selectedNode.level}</span>
                            </div>
                        )}
                        {(selectedNode.atk !== undefined || selectedNode.defense !== undefined) && (
                            <div className="flex">
                              <span className="font-medium text-slate-300 w-24">ATK/DEF:</span>
                              <span className="text-blue-300">
                        {selectedNode.atk !== undefined ? selectedNode.atk : "?"} / {selectedNode.defense !== undefined ? selectedNode.defense : "?"}
                      </span>
                            </div>
                        )}

                        {/* Ban status badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedNode.banTcg && (
                              <Badge variant="outline" className={
                                selectedNode.banTcg === "Banned"
                                    ? "bg-red-900/20 text-red-400 border-red-900"
                                    : selectedNode.banTcg === "Limited"
                                        ? "bg-amber-900/20 text-amber-400 border-amber-900"
                                        : "bg-blue-900/20 text-blue-400 border-blue-900"
                              }>
                                TCG: {selectedNode.banTcg}
                              </Badge>
                          )}
                          {selectedNode.banOcg && (
                              <Badge variant="outline" className={
                                selectedNode.banOcg === "Banned"
                                    ? "bg-red-900/20 text-red-400 border-red-900"
                                    : selectedNode.banOcg === "Limited"
                                        ? "bg-amber-900/20 text-amber-400 border-amber-900"
                                        : "bg-blue-900/20 text-blue-400 border-blue-900"
                              }>
                                OCG: {selectedNode.banOcg}
                              </Badge>
                          )}
                        </div>

                        {/* Effects */}
                        {selectedNode.effects && selectedNode.effects.length > 0 && (
                            <div className="mt-3">
                              <span className="font-medium text-slate-300">Effects:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedNode.effects.map((effect, index) => (
                                    <Badge key={index} variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-900">
                                      {effect}
                                    </Badge>
                                ))}
                              </div>
                            </div>
                        )}

                        {/* Card description */}
                        {selectedNode.cardDesc && (
                            <div className="mt-3">
                              <span className="font-medium text-slate-300">Description:</span>
                              <p className="mt-1 text-slate-300 text-xs whitespace-pre-wrap">
                                {selectedNode.cardDesc}
                              </p>
                            </div>
                        )}
                      </div>
                    </div>
                  </Rnd>
              )}
            </>
        )}
      </div>
  );
}

export default Graph;