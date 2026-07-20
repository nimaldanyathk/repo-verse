import { PlanetData, UserProfile } from "./github";

export function generateModernSVG(user: UserProfile, planets: PlanetData[]): string {
    const width = 600;
    const height = 200;

    // Pick top 4 repos
    const topRepos = planets.slice(0, 4);

    // Layout config
    const startX = 20;
    const gap = 15;
    const cardWidth = (width - (startX * 2) - (currentGap() * (topRepos.length - 1))) / topRepos.length;

    // Helper to calc gap based on count (dynamic sizing)
    function currentGap() { return 15; }
    function currentCardWidth(count: number) {
        return (width - 40 - (15 * (count - 1))) / count;
    }

    const cardW = currentCardWidth(topRepos.length);
    const cardH = 100;
    const cardY = 70; // Position below header

    // Language colors map
    const langColors: Record<string, string> = {
        TypeScript: "#3178C6",
        JavaScript: "#F7DF1E",
        Python: "#3776AB",
        Rust: "#DEA584",
        Go: "#00ADD8",
        Java: "#007396",
        "C++": "#00599C",
        "C": "#A8B9CC",
        HTML: "#E34F26",
        CSS: "#1572B6",
    };

    const cardsSvg = topRepos.map((repo, i) => {
        const x = 20 + i * (cardW + 15);
        const y = cardY;
        const color = langColors[repo.language || ""] || "#999";

        // Truncate desc
        const desc = (repo.description || "No description provided.").slice(0, 50) + (repo.description && repo.description.length > 50 ? "..." : "");

        return `
            <a href="${repo.html_url}" target="_blank">
                <g class="card-wrapper" transform="translate(${x}, ${y})">
                    <g class="card-glass" style="transform-origin: ${cardW/2}px ${cardH/2}px;">
                        <!-- Mood Ring / Glow Shadow -->
                        <rect width="${cardW}" height="${cardH}" rx="8" fill="${color}" opacity="0.25" filter="url(#glow-shadow)" transform="translate(0, 4)" />
                        
                    <!-- Liquid Glass Effect -->
                    <rect width="${cardW}" height="${cardH}" rx="8" fill="url(#glass-gradient)" stroke="url(#glass-border)" stroke-width="1.5" />
                    <!-- Inner highlight for glass -->
                    <rect width="${cardW}" height="${cardH}" rx="8" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
                    
                    <!-- Animated Shine -->
                    <g clip-path="url(#card-clip)">
                       <rect class="shine" x="-100" y="-50" width="30" height="${cardH * 2}" fill="url(#shine-gradient)" />
                    </g>
                    
                    <!-- Language Dot -->
                    <circle cx="15" cy="20" r="4" fill="${color}" />
                    
                    <!-- Name -->
                    <text x="25" y="24" fill="#fff" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" font-weight="600">${repo.name}</text>
                    
                    <!-- Desc -->
                    <foreignObject x="10" y="35" width="${cardW - 20}" height="40">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #aaa; font-family: Segoe UI, sans-serif; font-size: 10px; line-height: 1.2; overflow: hidden;">
                            ${desc}
                        </div>
                    </foreignObject>

                    <!-- Stats Row -->
                    <g transform="translate(10, 85)">
                        <!-- Stars -->
                        <path d="M3 0h2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#F1C40F" transform="scale(0.8) translate(0, 2)"/> 
                        <!-- Simple Star Icon approx -->
                        <text x="12" y="8" fill="#ccc" font-family="Segoe UI, sans-serif" font-size="10">${repo.stargazers_count}</text>

                        <!-- Forks -->
                        <text x="50" y="8" fill="#ccc" font-family="Segoe UI, sans-serif" font-size="10">⑂ ${repo.forks_count}</text>
                    </g>
                    </g>
                </g>
            </a>
        `;
    }).join("\n");

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .card-glass {
        transition: transform 0.3s ease;
      }
      .card-wrapper:hover .card-glass {
        transform: translateY(-5px) scale(1.02);
      }
      .shine {
        animation: shine 5s infinite linear;
      }
      @keyframes shine {
        0% { transform: skewX(-20deg) translateX(-150px); opacity: 0; }
        5% { opacity: 0.6; }
        15% { transform: skewX(-20deg) translateX(${cardW + 150}px); opacity: 0; }
        100% { transform: skewX(-20deg) translateX(${cardW + 150}px); opacity: 0; }
      }
    </style>
    
    <linearGradient id="bgInfo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    
    <!-- Liquid Glass Styles -->
    <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
      <stop offset="40%" stop-color="rgba(255,255,255,0.02)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.08)" />
    </linearGradient>
    <linearGradient id="glass-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
    </linearGradient>
    <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255,255,255,0)" />
      <stop offset="50%" stop-color="rgba(255,255,255,0.4)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
    <clipPath id="card-clip">
      <rect width="${cardW}" height="${cardH}" rx="8" />
    </clipPath>
    <mask id="round">
       <rect width="${width}" height="${height}" rx="12" fill="white" />
    </mask>
  </defs>

  <!-- Background container -->
  <rect width="${width}" height="${height}" rx="12" fill="url(#bgInfo)" />
  
  <!-- Subtle Header Mesh -->
  <circle cx="0" cy="0" r="150" fill="#3b82f6" opacity="0.1" filter="url(#blur)" />
  <circle cx="${width}" cy="${height}" r="150" fill="#8b5cf6" opacity="0.1" filter="url(#blur)" />
  
  <defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
    </filter>
  </defs>

  <!-- User Info Header -->
  <g transform="translate(20, 20)">
     <image href="${user.avatarUrl}" x="0" y="0" width="40" height="40" clip-path="circle(20px at 20px 20px)" />
     <text x="50" y="18" fill="#fff" font-family="Segoe UI, sans-serif" font-size="16" font-weight="bold">${user.name}</text>
     <text x="50" y="36" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="12">@${user.username} • ${user.publicRepos} Repositories • ${user.followers} Followers</text>
  </g>

  <!-- Cards Container -->
  ${cardsSvg}

</svg>`.trim();
}
