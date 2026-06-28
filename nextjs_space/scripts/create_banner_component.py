import re

with open('E:/tapchi_ntqs/tapchi-nghethuatquansu02/nextjs_space/public/banner.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

# Strip out the base64 image and point it to the public file
svg = re.sub(r'href="data:image/png;base64,[^"]*"', 'href="/badge.png"', svg)

# Fix the Google Fonts URL in the SVG style! (This was the main bug!)
# Change &amp; back to standard & for the CSS parser
svg = svg.replace('&amp;family', '&family')
svg = svg.replace('&amp;display', '&display')

# We can also add the subset=vietnamese just to be 100% safe
svg = svg.replace('display=swap', 'display=swap&subset=vietnamese')

# Escape backticks for the template literal
svg = svg.replace('`', '\\`')

react_component = f"""import React from 'react';

export function BannerLogo() {{
  return (
    <div 
      className="w-full h-full"
      dangerouslySetInnerHTML={{{{ __html: `{svg}` }}}} 
    />
  );
}}
"""

with open('E:/tapchi_ntqs/tapchi-nghethuatquansu02/nextjs_space/components/BannerLogo.tsx', 'w', encoding='utf-8') as f:
    f.write(react_component)

print("Updated BannerLogo.tsx successfully!")
