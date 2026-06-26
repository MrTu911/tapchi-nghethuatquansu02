import React from 'react';

export function BannerLogo() {
  return (
    <div 
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" width="100%" height="100%">
  <defs>
    <filter id="drop-shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="2" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.15"/>
    </filter>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
      
      .magazine {
        font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
        font-weight: 900;
        font-size: 42px;
        fill: #000000;
      }
      
      .title {
        font-family: 'Oswald', Impact, 'Arial Narrow', sans-serif;
        font-weight: 700;
        fill: #eb1e25;
        text-anchor: middle;
      }
      
      .badge-text {
        font-family: Arial, Helvetica, sans-serif;
        font-weight: bold;
        font-size: 10px;
        fill: #FFD700;
        letter-spacing: 0.5px;
      }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1000" height="300" fill="#fdd043"/>

  <!-- Magazine Text -->
  <text x="31" y="48" class="magazine" style="font-size: 50px;">Tạp chí</text>

  <!-- User Provided Badge Image -->
  <image x="37" y="70" width="165" height="201.09375" preserveAspectRatio="xMidYMid meet" href="/badge.png" filter="url(#badge-shadow)"/>

  <!-- Title Text -->
  <text x="605" y="139" class="title" font-size="87px" filter="url(#drop-shadow)" letter-spacing="1">NGHỆ THUẬT</text>
  <text x="605" y="239" class="title" font-size="82px" filter="url(#drop-shadow)" letter-spacing="0">QUÂN SỰ VIỆT NAM</text>

</svg>` }} 
    />
  );
}
