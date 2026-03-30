// This file exports the logo SVG as a React component for use in Sidebar
import * as React from "react";

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <image href="/logo.svg" width="64" height="64" />
  </svg>
);

export default Logo;
