function R(t){if(t.length===0)return{minLat:0,maxLat:0,minLon:0,maxLon:0,centerLat:0,centerLon:0};const l=t.map(d=>d.latitude),e=t.map(d=>d.longitude),o=Math.min(...l),i=Math.max(...l),r=Math.min(...e),a=Math.max(...e),n=(o+i)/2,c=(r+a)/2;return{minLat:o,maxLat:i,minLon:r,maxLon:a,centerLat:n,centerLon:c}}function x(t,l,e,o,i,r=20){const a=o-r*2,n=i-r*2,c=e.maxLat-e.minLat||.001,d=e.maxLon-e.minLon||.001,u=r+(l-e.minLon)/d*a,m=r+(e.maxLat-t)/c*n;return[u,m]}function M(t,l={}){if(t.length===0)return'<svg width="800" height="600"><text x="400" y="300" text-anchor="middle">No hay puntos GPS</text></svg>';const e=l.width||800,o=l.height||600,i=l.showMarkers!==!1,r=l.showLabels!==!1,a=40,n=R(t),d=t.map(s=>{const[f,h]=x(s.latitude,s.longitude,n,e,o,a);return`${f},${h}`}).join(" "),u=[];if(i&&t.length>0){const[s,f]=x(t[0].latitude,t[0].longitude,n,e,o,a);if(u.push(`
      <circle cx="${s}" cy="${f}" r="8" fill="#10b981" stroke="white" stroke-width="2"/>
      <text x="${s}" y="${f-12}" text-anchor="middle" font-size="10" font-weight="bold" fill="#10b981">INICIO</text>
    `),t.length>1){const[h,g]=x(t[t.length-1].latitude,t[t.length-1].longitude,n,e,o,a);u.push(`
        <circle cx="${h}" cy="${g}" r="8" fill="#ef4444" stroke="white" stroke-width="2"/>
        <text x="${h}" y="${g-12}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ef4444">FIN</text>
      `)}}const m=[];if(r&&t.length>0){const[s,f]=x(t[0].latitude,t[0].longitude,n,e,o,a);if(m.push(`
      <text x="${s}" y="${f+25}" text-anchor="middle" font-size="8" fill="#666">
        ${t[0].latitude.toFixed(4)}, ${t[0].longitude.toFixed(4)}
      </text>
    `),t.length>1){const[h,g]=x(t[t.length-1].latitude,t[t.length-1].longitude,n,e,o,a);m.push(`
        <text x="${h}" y="${g+25}" text-anchor="middle" font-size="8" fill="#666">
          ${t[t.length-1].latitude.toFixed(4)}, ${t[t.length-1].longitude.toFixed(4)}
        </text>
      `)}}const L=[],$=5;for(let s=0;s<=$;s++){const f=n.minLat+(n.maxLat-n.minLat)*(s/$),h=n.minLon+(n.maxLon-n.minLon)*(s/$),[g,y]=x(f,n.minLon,n,e,o,a),[k]=x(f,n.maxLon,n,e,o,a);L.push(`<line x1="${g}" y1="${y}" x2="${k}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>`);const[w,b]=x(n.maxLat,h,n,e,o,a),[,v]=x(n.minLat,h,n,e,o,a);L.push(`<line x1="${w}" y1="${b}" x2="${w}" y2="${v}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>`)}return`
    <svg width="${e}" height="${o}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .route-path { fill: none; stroke: #3b82f6; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
          .route-point { fill: #3b82f6; stroke: white; stroke-width: 1; }
        </style>
      </defs>
      <!-- Fondo -->
      <rect width="${e}" height="${o}" fill="#f9fafb"/>
      
      <!-- Grid de referencia -->
      ${L.join(`
      `)}
      
      <!-- Línea de ruta -->
      <polyline points="${d}" class="route-path" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Puntos de la ruta (opcional, solo si hay pocos puntos) -->
      ${t.length<=50?t.map((s,f)=>{const[h,g]=x(s.latitude,s.longitude,n,e,o,a);return`<circle cx="${h}" cy="${g}" r="2" fill="#3b82f6" opacity="0.6"/>`}).join(`
      `):""}
      
      <!-- Marcadores -->
      ${u.join(`
      `)}
      
      <!-- Etiquetas -->
      ${m.join(`
      `)}
      
      <!-- Información en la esquina -->
      <g transform="translate(${e-a-150}, ${a})">
        <rect width="150" height="60" fill="white" fill-opacity="0.9" stroke="#e5e7eb" stroke-width="1" rx="4"/>
        <text x="10" y="20" font-size="10" font-weight="bold" fill="#1f2937">Ruta GPS</text>
        <text x="10" y="35" font-size="9" fill="#6b7280">${t.length} punto${t.length!==1?"s":""}</text>
        <text x="10" y="50" font-size="9" fill="#6b7280">Mapa offline</text>
      </g>
    </svg>
  `.trim()}async function U(t,l=800,e=600){return new Promise((o,i)=>{try{const r=new Image,a=new Blob([t],{type:"image/svg+xml;charset=utf-8"}),n=URL.createObjectURL(a);r.onload=()=>{try{const c=document.createElement("canvas");c.width=l,c.height=e;const d=c.getContext("2d");if(!d){i(new Error("No se pudo obtener contexto del canvas"));return}d.drawImage(r,0,0,l,e);const u=c.toDataURL("image/png");URL.revokeObjectURL(n),o(u)}catch(c){URL.revokeObjectURL(n),i(c)}},r.onerror=()=>{URL.revokeObjectURL(n),i(new Error("Error al cargar la imagen SVG"))},r.src=n}catch(r){i(r)}})}async function I(t,l=800,e=600){const o=M(t,{width:l,height:e,showMarkers:!0,showLabels:!1});return U(o,l,e)}export{R as calculateBounds,I as generateOfflineMapImageBase64,M as generateOfflineRouteMap,U as svgToBase64PNG};
