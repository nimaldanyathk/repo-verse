import { PlanetData, UserProfile } from "./github";

export function generateUniverse3DSVG(user: UserProfile, planets: PlanetData[]): string {
    const width = 800;
    const height = 600;
    const cx = width / 2;
    const cy = height / 2;

    // Isometric tilt factors
    // We squash the Y axis to create the tilted disk effect
    const ySquash = 0.4;

    // Configuration
    const cycleDuration = 4; // Seconds per planet in the HUD
    const totalCycleTime = Math.max(planets.length * cycleDuration, 10); // Ensure at least some duration

    // Mood colors
    const moodColors: Record<string, string> = {
        happy: "#FFD700",
        focused: "#00FF94",
        calm: "#00C2FF",
        stressed: "#FF4500",
        energetic: "#FF00E6",
    };

    // Generate Planets
    const planetsSvg = planets.map((planet, index) => {
        // Calculate orbit duration based on speed
        const duration = 1000 / planet.orbitSpeed;
        const glowColor = moodColors[planet.mood] || "#ffffff";

        // Elliptical Orbit radii
        const rx = planet.orbitRadius;
        const ry = planet.orbitRadius * ySquash;

        // Unique IDs
        const gradId = `planetGrad3D-${index}`;
        const pathId = `orbitPath-${index}`;

        // We want the planet to start at a random position or staggered?
        // In SVG animateMotion, 'begin' can stagger, or we can rotate the path.
        // Let's just let them all start at 0 (rightmost point) for simplicity of the loop,
        // but we can add a 'begin' offset if we wanted. 
        // Actually, the original had rotation transforms.
        // Here we use animateMotion. To stagger, we can set 'begin' to a negative value.
        const timeOffset = -(index * (duration / planets.length));

        return `
      <!-- Planet: ${planet.name} -->
      <g>
        <defs>
          <radialGradient id="${gradId}" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${planet.color}" stop-opacity="1" />
            <stop offset="50%" stop-color="${planet.color}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#000" stop-opacity="1" />
          </radialGradient>
        </defs>

        <!-- Orbit Path (Visible Trace) -->
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

        <!-- The Moving Group -->
        <g>
          <!-- Motion Path Definition (Hidden, used for reference) -->
          <!-- We define the path relative to (0,0) so we can translate the group to center? 
               No, animateMotion moves the element along the path in absolute coords if not careful.
               Best to define path centered at cx, cy.
               Path for ellipse: M (cx+rx) cy A rx ry 0 1 1 (cx-rx) cy A rx ry 0 1 1 (cx+rx) cy
          -->
          <animateMotion 
            dur="${duration}s" 
            repeatCount="indefinite"
            begin="${timeOffset}s"
            path="M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy}"
          />

          <!-- Planet Body Group (Handles Scale/Z-simulation) -->
          <g>
            <!-- 
               Scale Animation:
               The path starts at 0 degrees (Right). 
               0 deg (Right) -> Scale 1 (Mid)
               90 deg (Bottom/Front) -> Scale 1.2 (Max)
               180 deg (Left) -> Scale 1 (Mid)
               270 deg (Top/Back) -> Scale 0.8 (Min)
               
               KeyTimes: 0; 0.25; 0.5; 0.75; 1
               Values: 1; 1.2; 1; 0.8; 1
            -->
            <animateTransform 
              attributeName="transform" 
              type="scale" 
              values="1; 1.3; 1; 0.7; 1" 
              keyTimes="0; 0.25; 0.5; 0.75; 1" 
              dur="${duration}s" 
              repeatCount="indefinite"
              begin="${timeOffset}s"
              additive="sum" 
            />

            <!-- Planet Visual -->
            <a href="${planet.html_url}" target="_blank" style="cursor: pointer;">
                <circle r="${planet.radius}" fill="url(#${gradId})">
                    <title>${planet.name} (${planet.language})</title>
                </circle>
                
                <!-- Atmosphere/Glow -->
                <circle r="${planet.radius}" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.3" />
                
                <!-- Texture: Ring -->
                ${planet.texture === 'ringed' ? `
                  <ellipse rx="${planet.radius * 1.8}" ry="${planet.radius * 0.5}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" transform="rotate(-15)" />
                ` : ''}
            </a>
          </g>
        </g>
      </g>
    `;
    }).join("\n");

    // HUD is similar to 2D but maybe positioned differently? Let's keep it at bottom.
    // We can reuse the HUD logic exactly as it provides good info.
    const hudPanels = planets.map((planet, index) => {
        const startPct = index / planets.length;
        const endPct = (index + 1) / planets.length;
        const e = 0.001;
        let values = "", keyTimes = "";

        if (index === 0) {
            values = "1; 1; 0; 0";
            keyTimes = `0; ${endPct - e}; ${endPct}; 1`;
        } else if (index === planets.length - 1) {
            values = "0; 0; 1; 1";
            keyTimes = `0; ${startPct}; ${startPct + e}; 1`;
        } else {
            values = "0; 0; 1; 1; 0; 0";
            keyTimes = `0; ${startPct}; ${startPct + e}; ${endPct - e}; ${endPct}; 1`;
        }

        return `
      <g opacity="0">
        <animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${totalCycleTime}s" repeatCount="indefinite" />
        <text x="20" y="${height - 80}" fill="${moodColors[planet.mood] || 'white'}" font-family="Courier New, monospace" font-size="16" font-weight="bold">> ${planet.name}</text>
        <text x="20" y="${height - 60}" fill="#ccc" font-family="Courier New, monospace" font-size="12">LANG: ${planet.language || 'N/A'} | STARS: ${planet.stargazers_count}</text>
        <text x="20" y="${height - 45}" fill="#ccc" font-family="Courier New, monospace" font-size="12">MOOD: ${planet.mood.toUpperCase()} | SIZE: ${planet.size}kb</text>
        <rect x="20" y="${height - 35}" width="0" height="2" fill="${moodColors[planet.mood] || 'white'}">
            <animate attributeName="width" values="0;200" begin="${index * cycleDuration}s" dur="${cycleDuration}s" fill="freeze" />
        </rect>
      </g>
    `;
    }).join("\n");

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <radialGradient id="sunGradient3D">
      <stop offset="0%" stop-color="#FDB813" />
      <stop offset="80%" stop-color="#F5821F" />
      <stop offset="100%" stop-color="rgba(245, 130, 31, 0)" />
    </radialGradient>
    <filter id="glow3D">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="hudGradient3D" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="10%" stop-color="rgba(0,20,40,0.8)" />
      <stop offset="90%" stop-color="rgba(0,20,40,0.8)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
    <clipPath id="sunClip3D">
      <circle cx="${cx}" cy="${cy}" r="40" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="#030014" />
  
  <!-- Stars (Static for now) -->
  <circle cx="100" cy="100" r="1" fill="white" opacity="0.5" />
  <circle cx="600" cy="200" r="1.5" fill="white" opacity="0.7" />
  <circle cx="300" cy="500" r="1" fill="white" opacity="0.4" />
  <circle cx="700" cy="400" r="2" fill="white" opacity="0.6" />

  <!-- Sun (Central) -->
  <g filter="url(#glow3D)">
    <circle cx="${cx}" cy="${cy}" r="40" fill="url(#sunGradient3D)">
      <animate attributeName="r" values="40;42;40" dur="4s" repeatCount="indefinite" />
    </circle>
    <image href="${user.avatarUrl}" xlink:href="${user.avatarUrl}" x="${cx - 40}" y="${cy - 40}" height="80" width="80" clip-path="url(#sunClip3D)" opacity="0.8" />
  </g>
  
  <!-- User Name -->
  <text x="${cx}" y="${cy + 70}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" opacity="0.8">${user.name}</text>

  <!-- Planets (3D Orbits) -->
  ${planetsSvg}

  <!-- HUD Panel -->
  <rect x="10" y="${height - 90}" width="300" height="80" fill="url(#hudGradient3D)" stroke="rgba(0,255,255,0.2)" stroke-width="1" rx="5" />
  ${hudPanels}

  <!-- Footer -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" fill="#333" font-family="Arial, sans-serif" font-size="10">RepoVerse 3D</text>
</svg>
  `.trim();
}
