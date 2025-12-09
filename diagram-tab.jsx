// ========================================
// PHASE 4: DIAGRAM TAB COMPONENTS
// ========================================
// Components: MonacoEditorPane, ExcalidrawPane, DiagramTab
// Integration: Monaco Editor + Excalidraw
// ========================================

/**
 * MonacoEditorPane Component
 * - Initializes Monaco Editor using AMD loader
 * - Integrates with DiagramContext
 * - Provides Generate JSON button
 * - Provides Generate Diagram button
 */
function MonacoEditorPane({ onGenerateDiagram }) {
    const { generateJsonFromResults, monacoEditorInstance, setMonacoEditorInstance } = useDiagram();
    const editorContainerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Initialize Monaco Editor on mount
    useEffect(() => {
        let isMounted = true;

        const initMonaco = () => {
            // Check if Monaco is already loaded
            if (window.monaco) {
                createEditor();
                return;
            }

            // Configure AMD loader
            if (!window.require) {
                setLoadError('Monaco loader not found. Please check CDN.');
                setIsLoading(false);
                return;
            }

            window.require.config({
                paths: {
                    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs'
                }
            });

            // Load Monaco Editor
            window.require(['vs/editor/editor.main'], function() {
                if (isMounted) {
                    createEditor();
                }
            }, function(err) {
                console.error('Error loading Monaco:', err);
                if (isMounted) {
                    setLoadError('Failed to load Monaco Editor. Please refresh the page.');
                    setIsLoading(false);
                }
            });
        };

        const createEditor = () => {
            try {
                const editor = window.monaco.editor.create(editorContainerRef.current, {
                    value: '{"msg": "Click on the Generate JSON button to start"}',
                    language: 'json',
                    theme: 'vs-light',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    wrappingIndent: 'indent'
                });

                setMonacoEditorInstance(editor);
                setIsLoading(false);
            } catch (err) {
                console.error('Error creating Monaco editor:', err);
                setLoadError('Failed to initialize Monaco Editor.');
                setIsLoading(false);
            }
        };

        // Small delay to ensure container is mounted
        const timer = setTimeout(initMonaco, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (monacoEditorInstance) {
                monacoEditorInstance.dispose();
            }
        };
    }, []);

    // Handle Generate JSON button click
    const handleGenerateJson = useCallback(() => {
        try {
            generateJsonFromResults();
        } catch (err) {
            console.error('Error generating JSON:', err);
            alert('Failed to generate JSON. Please check the console for details.');
        }
    }, [generateJsonFromResults]);

    // Handle Generate Diagram button click
    const handleGenerateDiagram = useCallback(() => {
        if (!monacoEditorInstance) {
            alert('Monaco Editor is not ready yet. Please wait a moment and try again.');
            return;
        }

        const jsonValue = monacoEditorInstance.getValue();
        if (!jsonValue || jsonValue.trim() === '') {
            alert('No JSON to generate diagram from. Please generate JSON first.');
            return;
        }

        try {
            // Validate JSON
            JSON.parse(jsonValue);
            onGenerateDiagram(jsonValue);
        } catch (err) {
            alert('Invalid JSON. Please fix the JSON syntax and try again.');
        }
    }, [monacoEditorInstance, onGenerateDiagram]);

    return (
        <div className="json-input-panel">
            <div
                ref={editorContainerRef}
                style={{
                    width: '100%',
                    height: 'calc(100% - 100px)',
                    border: '1px solid #ccc'
                }}
            />
            {isLoading && (
                <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                    Loading Monaco Editor...
                </div>
            )}
            {loadError && (
                <div style={{ padding: '10px', color: 'red' }}>
                    {loadError}
                </div>
            )}
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={handleGenerateJson}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                >
                    Generate JSON
                </button>
                <button
                    onClick={handleGenerateDiagram}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                >
                    Generate Diagram
                </button>
            </div>
        </div>
    );
}

/**
 * ExcalidrawPane Component
 * - Full Excalidraw integration
 * - Generates infrastructure topology diagram
 * - Organization containers with emoji flags
 * - Snaplex groupings (cloudplex/groundplex)
 * - Node representations (JCC/FM)
 * - Arrows showing FM→JCC relationships
 */
function ExcalidrawPane({ jsonInput }) {
    const excalidrawRef = useRef(null);
    const [error, setError] = useState(null);
    const { Excalidraw } = window.ExcalidrawLib || {};

    // Generate diagram when jsonInput changes
    useEffect(() => {
        if (jsonInput && excalidrawRef.current) {
            generateDiagram();
        }
    }, [jsonInput]);

    const generateDiagram = useCallback(() => {
        setError(null);

        if (!jsonInput || jsonInput.trim() === '') {
            setError("No JSON input provided");
            return;
        }

        try {
            const data = JSON.parse(jsonInput);
            console.log("Parsed JSON data:", data);

            const elements = [];
            let yOffset = 0;
            let maxOrgWidth = 0;

            // Function to determine the size multiplier for nodes
            const getNodeSize = (size) => {
                switch(size) {
                    case 'l': return 1.5;
                    case 'xl': return 2;
                    case 'xxl': return 3;
                    default: return 1;
                }
            };

            data.forEach((org, orgIndex) => {
                // Define base dimensions and spacing
                const snaplexBaseWidth = 350;
                const nodeBaseWidth = 120;
                const nodeBaseHeight = 70;
                const orgPadding = 100;
                const snaplexVerticalSpacing = 50;

                let maxSnaplexHeight = 0;
                let totalSnaplexWidth = 0;

                // Calculate dimensions for all snaplexes in the org
                org.Snaplex.forEach(snaplex => {
                    const jccNodes = snaplex.nodes.filter(node => node.type === 'JCC');
                    const fmNodes = snaplex.nodes.filter(node => node.type === 'FM');
                    const totalNodes = snaplex.nodes.length;

                    // Calculate total width needed for all nodes in this snaplex
                    const totalNodeWidth = snaplex.nodes.reduce((total, node) => total + nodeBaseWidth * getNodeSize(node.size) + 20, 0);

                    // Find the maximum height needed for JCC and FM nodes
                    const maxJccHeight = Math.max(...jccNodes.map(node => nodeBaseHeight * getNodeSize(node.size)), nodeBaseHeight);
                    const maxFmHeight = Math.max(...fmNodes.map(node => nodeBaseHeight * getNodeSize(node.size)), nodeBaseHeight);

                    // Calculate vertical spacing based on number of nodes
                    const verticalSpacing = 50 * (1 + Math.floor(totalNodes / 6));

                    // Determine snaplex dimensions
                    const snaplexWidth = Math.max(snaplexBaseWidth, totalNodeWidth + 40);
                    const snaplexHeight = 200 + maxJccHeight + maxFmHeight + verticalSpacing;

                    maxSnaplexHeight = Math.max(maxSnaplexHeight, snaplexHeight);
                    totalSnaplexWidth += snaplexWidth + 50;
                });

                // Calculate org dimensions
                const orgWidth = Math.max(totalSnaplexWidth + orgPadding * 2, 1000);
                maxOrgWidth = Math.max(maxOrgWidth, orgWidth);
                const orgHeight = maxSnaplexHeight + orgPadding * 2;

                // Create org shape and text
                const getControlPlaneEmoji = (controlPlane) => {
                    if (controlPlane === "US") return "🌎";
                    if (controlPlane === "EMEA") return "🌍";
                    return "";
                };
                const [orgShape, orgText] = createBasicShape(
                    "rectangle",
                    0,
                    yOffset,
                    orgWidth,
                    orgHeight,
                    `${getControlPlaneEmoji(org.ControlPlane)} ${org.ControlPlane} - ${org.OrgName}`,
                    'org'
                );
                orgShape.backgroundColor = getOrgColor();
                elements.push(orgShape, orgText);

                let xOffset = orgPadding;
                org.Snaplex.forEach((snaplex, snaplexIndex) => {
                    const jccNodes = snaplex.nodes.filter(node => node.type === 'JCC');
                    const fmNodes = snaplex.nodes.filter(node => node.type === 'FM');
                    const totalNodes = snaplex.nodes.length;

                    // Calculate dimensions for this specific snaplex
                    const totalNodeWidth = snaplex.nodes.reduce((total, node) => total + nodeBaseWidth * getNodeSize(node.size) + 20, 0);
                    const maxJccHeight = Math.max(...jccNodes.map(node => nodeBaseHeight * getNodeSize(node.size)), nodeBaseHeight);
                    const maxFmHeight = Math.max(...fmNodes.map(node => nodeBaseHeight * getNodeSize(node.size)), nodeBaseHeight);

                    const verticalSpacing = 50 * (1 + Math.floor(totalNodes / 6));

                    const currentSnaplexWidth = Math.max(snaplexBaseWidth, totalNodeWidth + 40);
                    const currentSnaplexHeight = 200 + maxJccHeight + maxFmHeight + verticalSpacing;

                    // Create snaplex shape
                    elements.push(...createBasicShape("rectangle", xOffset, yOffset + orgPadding, currentSnaplexWidth, currentSnaplexHeight, `${snaplex.type === 'groundplex' ? '🏠' : '☁️'} ${snaplex.name}`, 'snaplex'));

                    let jccXOffset = xOffset + 20;
                    let fmXOffset = xOffset + 20;
                    const jccYOffset = yOffset + orgPadding + 100;
                    const fmYOffset = jccYOffset + maxJccHeight + verticalSpacing;

                    // Create JCC node shapes
                    jccNodes.forEach((node, index) => {
                        const size = getNodeSize(node.size);
                        elements.push(...createBasicShape(
                            "rectangle",
                            jccXOffset,
                            jccYOffset,
                            nodeBaseWidth * size,
                            nodeBaseHeight * size,
                            `🖥️ JCC`,
                            'node'
                        ));
                        jccXOffset += nodeBaseWidth * size + 20;
                    });

                    // Create FM node shapes
                    fmNodes.forEach((node, index) => {
                        const size = getNodeSize(node.size);
                        elements.push(...createBasicShape(
                            "rectangle",
                            fmXOffset,
                            fmYOffset,
                            nodeBaseWidth * size,
                            nodeBaseHeight * size,
                            `🔄 FM`,
                            'node'
                        ));
                        fmXOffset += nodeBaseWidth * size + 20;
                    });

                    // Create arrows from FM to JCC nodes
                    fmNodes.forEach((fmNode, fmIndex) => {
                        jccNodes.forEach((jccNode, jccIndex) => {
                            const fmSize = getNodeSize(fmNode.size);
                            const jccSize = getNodeSize(jccNode.size);
                            const fmX = xOffset + 20 + fmIndex * (nodeBaseWidth * fmSize + 20) + nodeBaseWidth * fmSize / 2;
                            const fmY = fmYOffset;
                            const jccX = xOffset + 20 + jccIndex * (nodeBaseWidth * jccSize + 20) + nodeBaseWidth * jccSize / 2;
                            const jccY = jccYOffset + nodeBaseHeight * jccSize;
                            elements.push(createArrow(fmX, fmY, jccX, jccY));
                        });
                    });

                    xOffset += currentSnaplexWidth + 50;
                });

                yOffset += orgHeight + snaplexVerticalSpacing;
            });

            // Update Excalidraw scene
            if (excalidrawRef.current) {
                const diagramOutput = document.querySelector('.diagram-output');
                const totalHeight = Math.max(...elements.map(e => e.y + e.height));
                const totalWidth = Math.max(...elements.map(e => e.x + e.width));

                // Calculate the zoom level based on the diagram size and available space
                const widthRatio = diagramOutput.offsetWidth / totalWidth;
                const heightRatio = diagramOutput.offsetHeight / totalHeight;
                const zoomLevel = Math.min(widthRatio, heightRatio, 1) * 0.7; // 70% of the calculated zoom

                // Update the Excalidraw scene with the generated elements and calculated dimensions
                excalidrawRef.current.updateScene({
                    elements: elements,
                    appState: {
                        viewBackgroundColor: "#ffffff",
                        width: diagramOutput.offsetWidth,
                        height: diagramOutput.offsetHeight,
                        scrollX: (diagramOutput.offsetWidth - totalWidth * zoomLevel) / 2,
                        scrollY: (diagramOutput.offsetHeight - totalHeight * zoomLevel) / 2,
                        zoom: { value: zoomLevel }
                    }
                });
            }
        } catch (err) {
            console.error("Error parsing JSON or generating diagram:", err);
            setError("Error: " + err.message);
        }
    }, [jsonInput]);

    // Helper function to create basic shapes (rectangles) and text
    function createBasicShape(type, x, y, width, height, text, shapeType = 'org') {
        const shapeId = Math.random().toString(36).substr(2, 9);
        const textId = Math.random().toString(36).substr(2, 9);

        const shape = {
            id: shapeId,
            type,
            x,
            y,
            width,
            height,
            angle: 0,
            strokeColor: "#000000",
            backgroundColor: "transparent",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            strokeSharpness: "sharp",
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: 0,
            isDeleted: false,
            boundElements: [{ type: "text", id: textId }],
            updated: Date.now(),
            link: null,
            locked: false
        };

        // Apply specific styles based on shape type
        if (shapeType === 'snaplex' || shapeType === 'node') {
            shape.roundness = { type: 3 };
            shape.strokeStyle = "dashed";
            shape.fillStyle = "solid";
            shape.backgroundColor = "white";
        } else if (shapeType === 'org') {
            shape.fillStyle = "hachure";
        }

        const textElement = {
            id: textId,
            type: "text",
            x: x + width / 2,
            y: y + 18,
            width: 0,
            height: 35,
            angle: 0,
            strokeColor: "#000000",
            backgroundColor: "transparent",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            roundness: null,
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: 0,
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
            text,
            fontSize: 28,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle",
            baseline: 25,
            containerId: shapeId,
            originalText: text,
            lineHeight: 1.25
        };

        return [shape, textElement];
    }

    // Color-picking function for org backgrounds
    const getOrgColor = (() => {
        const colors = [
            "#C0C0C0",  // Light Gray
            "#B3E0FF",  // Light Blue
            "#A0E6E6",  // Light Turquoise
            "#C2B280",  // Light Taupe
            "#E0B0FF",  // Light Purple
            "#B0C4DE",  // Light Coal
            "#A4D3EE"   // Light Blue Bottle
        ];

        const usedColors = new Set();

        return () => {
            if (usedColors.size === colors.length) {
                usedColors.clear();
            }

            let color;
            do {
                color = colors[Math.floor(Math.random() * colors.length)];
            } while (usedColors.has(color));

            usedColors.add(color);
            return color;
        };
    })();

    // Helper function to create arrows
    function createArrow(x1, y1, x2, y2) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            type: "arrow",
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1,
            angle: 0,
            strokeColor: "#000000",
            backgroundColor: "transparent",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            strokeSharpness: "round",
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: 0,
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
            points: [[0, 0], [x2 - x1, y2 - y1]],
            lastCommittedPoint: null,
            startBinding: null,
            endBinding: null,
            startArrowhead: null,
            endArrowhead: "arrow"
        };
    }

    if (!Excalidraw) {
        return (
            <div className="diagram-output" style={{ padding: '20px', color: 'red' }}>
                Error: Excalidraw library not loaded. Please refresh the page.
            </div>
        );
    }

    return (
        <div className="diagram-output" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Excalidraw
                ref={excalidrawRef}
                initialData={{
                    elements: [],
                    appState: { viewBackgroundColor: "#ffffff" }
                }}
            />
            {error && (
                <div style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    color: 'red',
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
}

/**
 * DiagramTab Component
 * - Two-pane layout: Monaco on left, Excalidraw on right
 * - Integrates MonacoEditorPane and ExcalidrawPane
 */
function DiagramTab() {
    const [jsonToDiagram, setJsonToDiagram] = useState('');

    const handleGenerateDiagram = useCallback((jsonValue) => {
        setJsonToDiagram(jsonValue);
    }, []);

    return (
        <div className="diagramator-container">
            <MonacoEditorPane onGenerateDiagram={handleGenerateDiagram} />
            <ExcalidrawPane jsonInput={jsonToDiagram} />
        </div>
    );
}
