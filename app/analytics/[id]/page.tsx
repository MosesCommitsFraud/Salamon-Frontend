import {useEffect, useRef, useState} from "react";
import {Parser} from "n3";
import * as THREE from "three";
import {Rnd} from "react-rnd";
import Image from "next/image";
import {CardNode, GraphData} from "@/app/editor/[id]/page";

export function AnalyticsTab({ deckId }: { deckId: string }) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<CardNode | null>(null);
  const graphRef = useRef<ForceGraphMethods>();

  // Effekt-Properties, die wir aus dem RDF parsen:
  const effectProps = [
    "http://example.org/ygo#effect_banish",
    "http://example.org/ygo#effect_change_position",
    "http://example.org/ygo#effect_copy",
    "http://example.org/ygo#effect_counter",
    "http://example.org/ygo#effect_deck_manipulation",
    "http://example.org/ygo#effect_destroy",
    "http://example.org/ygo#effect_discard",
    "http://example.org/ygo#effect_draw",
    "http://example.org/ygo#effect_equip",
    "http://example.org/ygo#effect_inflict_damage",
    "http://example.org/ygo#effect_modify_stats",
    "http://example.org/ygo#effect_negate",
    "http://example.org/ygo#effect_protect",
    "http://example.org/ygo#effect_recover_lp",
    "http://example.org/ygo#effect_return",
    "http://example.org/ygo#effect_search",
    "http://example.org/ygo#effect_send_gy",
    "http://example.org/ygo#effect_shuffle",
    "http://example.org/ygo#effect_special_summon",
    "http://example.org/ygo#effect_token_summon",
  ];

  useEffect(() => {
    // ABox & TBox laden
    Promise.all([
      fetch("/abox.ttl").then((res) => res.text()),
      fetch("/tbox.ttl").then((res) => res.text()),
    ])
        .then(([aboxTtl, tboxTtl]) => {
          const ttlText = aboxTtl + "\n" + tboxTtl;
          const parser = new Parser();
          const quads = parser.parse(ttlText);

          const nodesMap: Record<string, CardNode> = {};

          // 1) Erstmal alle Tripel durchgehen und Infos pro Karte sammeln
          quads.forEach((q: Quad) => {
            const subject = q.subject.value;   // z.B. "http://example.org/ygo#Card_123"
            const predicate = q.predicate.value;
            const objectVal = q.object.value;

            // Nur Tripel, wo das Subject eine Card_ ist
            if (subject.includes("Card_")) {
              if (!nodesMap[subject]) {
                nodesMap[subject] = {
                  id: subject,
                  label: "",
                  effects: [],
                  referencedCardUris: [],
                };
              }
              const node = nodesMap[subject];

              // cardName
              if (predicate === "http://example.org/ygo#cardName") {
                node.label = objectVal;
              }
              // archetype
              if (predicate === "http://example.org/ygo#archetype") {
                node.archetype = objectVal;
              }
              // cardAttribute
              if (predicate === "http://example.org/ygo#cardAttribute") {
                node.cardAttribute = objectVal;
              }
              // Bild-URL
              if (predicate === "http://example.org/ygo#ygoprodeckURL") {
                node.imageUrl = objectVal;
              }

              // Effekt-Properties
              if (
                  effectProps.includes(predicate) &&
                  objectVal.toLowerCase() === "true"
              ) {
                const effectName = predicate.split("#")[1]; // z.B. "effect_destroy"
                if (!node.effects.includes(effectName)) {
                  node.effects.push(effectName);
                }
              }

              // Ban-Status
              if (predicate === "http://example.org/ygo#banTcg") {
                node.banTcg = objectVal;
              }
              if (predicate === "http://example.org/ygo#banOcg") {
                node.banOcg = objectVal;
              }
              if (predicate === "http://example.org/ygo#banGoat") {
                node.banGoat = objectVal;
              }

              // ATK / DEF / Level
              if (predicate === "http://example.org/ygo#atk") {
                node.atk = parseInt(objectVal, 10);
              }
              if (predicate === "http://example.org/ygo#defense") {
                node.defense = parseInt(objectVal, 10);
              }
              if (predicate === "http://example.org/ygo#level") {
                node.level = parseInt(objectVal, 10);
              }

              // race
              if (predicate === "http://example.org/ygo#race") {
                node.race = objectVal;
              }

              // cardDesc
              if (predicate === "http://example.org/ygo#cardDesc") {
                node.cardDesc = objectVal;
              }

              // NEU: Falls wir ein Triple "Card_X ygo:referencedCard Card_Y" haben
              // => Dann merken wir uns: node X referenziert node Y
              if (predicate === "http://example.org/ygo#referencedCard") {
                // Hier ist objectVal normalerweise die URI einer anderen Karte, z.B. "http://example.org/ygo#Card_999"
                node.referencedCardUris.push(objectVal);
              }
            }
          });

          // 2) Nun bauen wir Nodes + Links auf
          const nodesArray = Object.values(nodesMap);
          const links: GraphData["links"] = [];

          // a) Undirekte Links für gemeinsame Effekte
          for (let i = 0; i < nodesArray.length; i++) {
            for (let j = i + 1; j < nodesArray.length; j++) {
              const nodeA = nodesArray[i];
              const nodeB = nodesArray[j];
              const commonEffects = nodeA.effects.filter((e) =>
                  nodeB.effects.includes(e)
              );
              if (commonEffects.length > 0) {
                links.push({
                  source: nodeA.id,
                  target: nodeB.id,
                  relation: `Gemeinsame Effekte: ${commonEffects.join(", ")}`,
                });
              }
            }
          }

          // b) Undirekte Links für gleichen Archetype
          for (let i = 0; i < nodesArray.length; i++) {
            for (let j = i + 1; j < nodesArray.length; j++) {
              const nodeA = nodesArray[i];
              const nodeB = nodesArray[j];
              if (
                  nodeA.archetype &&
                  nodeB.archetype &&
                  nodeA.archetype === nodeB.archetype
              ) {
                links.push({
                  source: nodeA.id,
                  target: nodeB.id,
                  relation: `Gleicher Archetype: ${nodeA.archetype}`,
                });
              }
            }
          }

          // c) Undirekte Links für gleiche Race
          for (let i = 0; i < nodesArray.length; i++) {
            for (let j = i + 1; j < nodesArray.length; j++) {
              const nodeA = nodesArray[i];
              const nodeB = nodesArray[j];
              if (nodeA.race && nodeB.race && nodeA.race === nodeB.race) {
                links.push({
                  source: nodeA.id,
                  target: nodeB.id,
                  relation: `Gleiche Race: ${nodeA.race}`,
                });
              }
            }
          }

          // d) Gerichtete Links auf Basis von ygo:referencedCard
          //    Jede CardNode hat nodeA.referencedCardUris = ["http://example.org/ygo#Card_999", ...]
          for (const nodeA of nodesArray) {
            for (const refUri of nodeA.referencedCardUris) {
              // Falls es das referenzierte Node wirklich gibt, erzeugen wir einen Link
              const nodeB = nodesMap[refUri];
              if (nodeB) {
                links.push({
                  source: nodeA.id,
                  target: nodeB.id,
                  relation: "Referenziert (Effekt)",
                });
              }
            }
          }

          // In State übernehmen
          setGraphData({ nodes: nodesArray, links });
        })
        .catch((err) => console.error("Fehler beim Laden der TTL-Dateien:", err));
  }, []);

  // Klick auf eine Karte => Popup zeigen
  const handleNodeClick = (node: CardNode) => {
    setSelectedNode(node);
  };

  // Popup schließen
  const closePopup = () => setSelectedNode(null);

  return (
      <div className="relative min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 text-white">
        {/* 3D-Graph */}
        <ForceGraph3D
            ref={graphRef as any}
            graphData={graphData}
            nodeLabel={(node: CardNode) => node.label}
            onNodeClick={handleNodeClick}
            nodeAutoColorBy="archetype"
            linkWidth={2}
            linkColor={() => "rgba(255,255,255,0.5)"}
            nodeThreeObject={(node: CardNode) => {
              if (node.imageUrl) {
                // Karte als Sprite
                const proxyUrl = `/api/card-image?url=${encodeURIComponent(node.imageUrl)}`;
                const imgTexture = new THREE.TextureLoader()
                    .setCrossOrigin("anonymous")
                    .load(proxyUrl);
                imgTexture.colorSpace = THREE.SRGBColorSpace;
                const material = new THREE.SpriteMaterial({ map: imgTexture });
                const sprite = new THREE.Sprite(material);
                sprite.scale.set(50, 70);
                return sprite;
              } else {
                // Fallback: weißer Kreis
                const geometry = new THREE.SphereGeometry(6, 16, 16);
                const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                return new THREE.Mesh(geometry, mat);
              }
            }}
        />

        {/* Popup (draggable + resizable) */}
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
            >
              <div className="w-full h-full bg-slate-800 border border-slate-700 p-4 rounded shadow-lg overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">
                    {selectedNode.label || "Unbenannte Karte"}
                  </h2>
                  <button
                      onClick={closePopup}
                      className="text-sm text-gray-300 hover:underline"
                  >
                    Schließen
                  </button>
                </div>

                {/* Bild */}
                {selectedNode.imageUrl && (
                    <div className="flex justify-center mb-4">
                      <Image
                          src={selectedNode.imageUrl}
                          alt={selectedNode.label}
                          width={200}
                          height={280}
                          className="rounded"
                      />
                    </div>
                )}

                {/* Infos */}
                <div className="space-y-1 text-sm">
                  {selectedNode.archetype && (
                      <p>
                        <strong>Archetype:</strong> {selectedNode.archetype}
                      </p>
                  )}
                  {selectedNode.cardAttribute && (
                      <p>
                        <strong>Attribut:</strong> {selectedNode.cardAttribute}
                      </p>
                  )}
                  {selectedNode.race && (
                      <p>
                        <strong>Race:</strong> {selectedNode.race}
                      </p>
                  )}
                  {selectedNode.level && (
                      <p>
                        <strong>Level/Rank:</strong> {selectedNode.level}
                      </p>
                  )}
                  {(selectedNode.atk !== undefined || selectedNode.defense !== undefined) && (
                      <p>
                        <strong>ATK/DEF:</strong> {selectedNode.atk ?? 0} /{" "}
                        {selectedNode.defense ?? 0}
                      </p>
                  )}

                  {/* Ban-Status */}
                  {selectedNode.banTcg && (
                      <p>
                        <strong>Ban (TCG):</strong> {selectedNode.banTcg}
                      </p>
                  )}
                  {selectedNode.banOcg && (
                      <p>
                        <strong>Ban (OCG):</strong> {selectedNode.banOcg}
                      </p>
                  )}
                  {selectedNode.banGoat && (
                      <p>
                        <strong>Ban (Goat):</strong> {selectedNode.banGoat}
                      </p>
                  )}

                  {/* Effekte */}
                  {selectedNode.effects && selectedNode.effects.length > 0 && (
                      <p>
                        <strong>Effekte:</strong> {selectedNode.effects.join(", ")}
                      </p>
                  )}

                  {/* Kartentext */}
                  {selectedNode.cardDesc && (
                      <p className="mt-2">
                        <strong>Beschreibung:</strong> {selectedNode.cardDesc}
                      </p>
                  )}
                </div>
              </div>
            </Rnd>
        )}
      </div>
  );
}