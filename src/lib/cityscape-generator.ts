import { PlanetData, UserProfile } from "./github";

export function generateCityscapeSVG(user: UserProfile, planets: PlanetData[]): string {
    const width = 800;
    const height = 600;

    // Isometric projection helpers
    // We adjust scale to fit more items if needed, or keep it grand.
    const isoScale = 24;
    const isoX = (x: number, y: number) => (x - y) * isoScale + width / 2;
    // Compress Y axis for isometric look (0.5 is standard, but we can tweak angle)
    const isoY = (x: number, y: number, z: number) => (x + y) * (isoScale * 0.5) - z + height / 1.8;

    // Premium Synthwave/Cyberpunk Palette
    const moodColors: Record<string, { base: string, highlight: string, shadow: string }> = {
        happy: { base: "#FFD700", highlight: "#FFFACD", shadow: "#B8860B" }, // Gold
        focused: { base: "#00FF94", highlight: "#E0FFF1", shadow: "#008F53" }, // Neon Green
        calm: { base: "#00C2FF", highlight: "#D1F4FF", shadow: "#005F7F" }, // Cyan
        stressed: { base: "#FF2A6D", highlight: "#FFD1E0", shadow: "#990033" }, // Hot Pink/Red
        energetic: { base: "#D300C5", highlight: "#FAD7FA", shadow: "#66005E" }, // Magenta
    };

    // Grid Layout Logic
    // Spiral or dense city block layout? Let's stick to sorted grid for clarity but tighter.
    const gridSize = Math.ceil(Math.sqrt(planets.length));

    // Sort logic: Taller (larger) buildings in the back (low x+y) or middle?
    // Painter's algo requires back-to-front rendering based on (x+y).
    // Let's sort planets by importance first, then assign grid positions to center the biggest ones?
    // Or just simple grid for now to ensure no overlap issues.

    const buildings = planets.map((planet, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        // Shift grid to be centered around 0,0
        const gx = col - gridSize / 2;
        const gy = row - gridSize / 2;

        return { ...planet, gx, gy, zIndex: gx + gy };
    }).sort((a, b) => a.zIndex - b.zIndex);

    // Generate Buildings
    const buildingsSvg = buildings.map((b, i) => {
        // Dimensions
        const sizeFactor = Math.min(b.size / 500, 1) * 0.5 + 0.5; // 0.5 to 1.0 base scale
        const w = 15 * sizeFactor; // Half-width
        const baseH = 20;
        // Height based on stars and size, significantly taller for "skyscrapers"
        const heightScale = Math.min(b.size / 50, 200) + (b.stargazers_count * 5);
        const h = Math.max(baseH, Math.min(heightScale, 300));

        const cx = isoX(b.gx, b.gy);
        const cy = isoY(b.gx, b.gy, 0);

        const colorSet = moodColors[b.mood] || moodColors.calm;

        // Faces
        // Left Face (Darker, receives less light)
        const leftFace = `M ${cx - w} ${cy - h + w / 2} l 0 ${h} l ${w} ${w / 2} l 0 ${-h} z`;
        // Right Face (Medium, side light)
        const rightFace = `M ${cx + w} ${cy - h + w / 2} l 0 ${h} l ${-w} ${w / 2} l 0 ${-h} z`;
        // Top Face (Brightest)
        const topFace = `M ${cx} ${cy - h} l ${w} ${w / 2} l ${-w} ${w / 2} l ${-w} ${-w / 2} z`;

        // Windows Pattern
        // We'll draw small rectangles on the left/right faces
        // Only if building is tall enough
        let windows = "";
        if (h > 40) {
            const floorHeight = 10;
            const floors = Math.floor((h - 10) / floorHeight);

            // Generate window rows
            for (let f = 0; f < floors; f++) {
                // Randomly skip some windows for "lived in" look
                if (Math.random() > 0.3) {
                    // Right face windows
                    const wy = cy - 10 - (f * floorHeight);
                    // Slanted projection
                    const wx = cx + w / 2;
                    // We need to follow isometric slope.
                    // A simple line dash is easiest and looks good at small scale.
                    windows += `<path d="M ${cx + 4} ${wy + 2} l ${w - 8} ${4}" stroke="${colorSet.highlight}" stroke-width="2" stroke-opacity="0.6" />`;
                }
                if (Math.random() > 0.3) {
                    // Left face windows
                    const wy = cy - 10 - (f * floorHeight);
                    windows += `<path d="M ${cx - w + 4} ${wy + 4} l ${w - 8} -${4}" stroke="${colorSet.highlight}" stroke-width="2" stroke-opacity="0.4" />`;
                }
            }
        }

        // Roof Detail (Antenna/Spire)
        let roofDetail = "";
        if (b.stargazers_count > 10 || b.forks_count > 5) {
            roofDetail = `
                <line x1="${cx}" y1="${cy - h}" x2="${cx}" y2="${cy - h - 20}" stroke="${colorSet.highlight}" stroke-width="1.5" />
                <circle cx="${cx}" cy="${cy - h - 20}" r="1.5" fill="white">
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="${1 + Math.random() * 2}s" repeatCount="indefinite" />
                </circle>
             `;
        }

        return `
            <a href="${b.html_url}" target="_blank">
                <g class="building" opacity="0">
                     <animate attributeName="opacity" values="0;1" dur="0.8s" begin="${i * 0.05}s" fill="freeze" />
                     
                     <!-- Shadow (Simple Ellipse approx) -->
                     <ellipse cx="${cx}" cy="${cy + w / 2}" rx="${w * 1.5}" ry="${w * 0.8}" fill="black" opacity="0.4" blur="2" />

                     <!-- Structure -->
                     <path d="${leftFace}" fill="url(#gradLeft-${b.mood})" stroke="none" />
                     <path d="${rightFace}" fill="url(#gradRight-${b.mood})" stroke="none" />
                     <path d="${topFace}" fill="${colorSet.highlight}" fill-opacity="0.9" stroke="none" />
                     
                     <!-- Glow Edge -->
                     <path d="${leftFace}" fill="none" stroke="${colorSet.base}" stroke-width="0.5" opacity="0.5" />
                     <path d="${rightFace}" fill="none" stroke="${colorSet.base}" stroke-width="0.5" opacity="0.5" />

                     <!-- Details -->
                     ${windows}
                     ${roofDetail}

                     <!-- Tooltip -->
                     <title>${b.name} (${b.language}) | Stars: ${b.stargazers_count}</title>
                </g>
            </a>
        `;
    }).join("\n");

    // Dynamic Gradients based on mood
    const defsGradients = Object.entries(moodColors).map(([mood, colors]) => `
        <linearGradient id="gradLeft-${mood}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors.base}" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#050510" stop-opacity="0.9"/>
        </linearGradient>
        <linearGradient id="gradRight-${mood}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${colors.base}" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#0b0b1a" stop-opacity="0.8"/>
        </linearGradient>
    `).join("\n");

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sky Gradient -->
    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f0c29" />
      <stop offset="50%" stop-color="#302b63" />
      <stop offset="100%" stop-color="#24243e" />
    </linearGradient>

    <!-- Retro Grid Pattern -->
    <pattern id="gridPattern" width="40" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
       <path d="M 40 0 L 0 0 0 20" fill="none" stroke="magenta" stroke-width="0.5" opacity="0.2"/>
    </pattern>

    <!-- Floor Glow -->
    <radialGradient id="floorGlow" cx="50%" cy="100%" r="80%">
        <stop offset="0%" stop-color="#ff00cc" stop-opacity="0.15" />
        <stop offset="100%" stop-color="transparent" />
    </radialGradient>
    
    ${defsGradients}
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#skyGradient)" />
  
  <!-- Stars -->
  ${Array.from({ length: 30 }).map(() =>
        `<circle cx="${Math.random() * width}" cy="${Math.random() * height * 0.6}" r="${Math.random() * 1.5}" fill="white" opacity="${Math.random()}"/>`
    ).join("")}

  <!-- Perspective Floor Grid (Simulated) -->
  <g transform="translate(0, ${height / 2}) scale(1, 0.5)">
     <rect x="-${width}" y="0" width="${width * 3}" height="${height * 2}" fill="url(#gridPattern)" opacity="0.3" transform="rotate(45, ${width / 2}, 0)"/>
  </g>
  
  <!-- Horizon Glow -->
  <rect x="0" y="${height / 2}" width="${width}" height="${height / 2}" fill="url(#floorGlow)" />

  <!-- City Label / Branding -->
  <g transform="translate(40, 60)">
      <text fill="cyan" font-family="Verdana, sans-serif" font-size="28" font-weight="900" style="text-shadow: 0 0 10px cyan;">${user.name.toUpperCase()} CITY</text>
      <text y="25" fill="#ff00cc" font-family="Courier New, monospace" font-size="14" font-weight="bold" letter-spacing="2">POP: ${user.followers} // BLOCKS: ${user.publicRepos}</text>
  </g>

  <!-- The Buildings -->
  <g transform="translate(0, 50)"> 
    ${buildingsSvg}
  </g>

  <!-- Footer -->
  <text x="${width - 30}" y="${height - 20}" text-anchor="end" fill="rgba(255,255,255,0.4)" font-family="Courier New" font-size="10">GENERATED BY REPOVERSE</text>
</svg>
    `.trim();
}
