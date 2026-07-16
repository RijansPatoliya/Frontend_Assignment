# bolly — Premium Shampoo Interactive Landing Page

This repository contains the frontend implementation for the **bolly** Clarify Shampoo landing page. It features a custom-built, fully interactive 3D shampoo bottle experience using Three.js, clean modern typography, and responsive layouts.

## Key Features

- **Interactive 3D Product**: Procedurally modeled shampoo bottle using Three.js geometries (Lathe profile, custom spout) with realistic gloss, refraction (`THREE.MeshPhysicalMaterial`), and dynamic floor shadow reflections.
- **Micro-interactions**: Drag and touch gestures for smooth 3D rotation with velocity damping, idle breathing physics, and synchronized page-wide theme customizer.
- **Premium Aesthetics**: Glassmorphism controls, SVG noise filter overlays, and organic moving background gradients.
- **Fully Responsive**: Optimized for seamless layout rendering on desktop, tablet, and mobile devices down to 320px screen width.

## Project Structure

- `index.html` - Semantic HTML5 layout and noise filter.
- `style.css` - Custom styling tokens, layout structure, and responsive queries.
- `app.js` - Three.js engine setup, 3D bottle geometry builder, and custom event listeners.
- `wordpress/` - Contains elements prepared specifically for WordPress integration.
  - `elementor-template.html` - Consolidated single-file build containing integrated HTML, styles, and scripts.

## Installation & Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/RijansPatoliya/Frontend_Assignment.git
   ```
2. Open `index.html` directly in any web browser, or serve it using a local development server (e.g., Live Server in VS Code).

## WordPress Integration

This project is prepared for easy WordPress integration:
1. Open the `/wordpress/elementor-template.html` file and copy its contents.
2. In your WordPress site editor (e.g., Elementor Page Builder), add an **HTML widget** to your section.
3. Paste the copied code into the widget and publish the page.
