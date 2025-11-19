# Vending Machine Web App

A rewrite of the classic Tech Elevator vending machine project, originally built in Java Spring Boot, now rebuilt in Python Flask and extended into a visual 3D experience using Flask, WebGL, and SVG.

## Features
- Python backend (Flask) - rewritten from Java Spring Boot
- Object-oriented structure (`Product`, `VendingMachine`, etc.)
- Interactive front-end using Three.js + SVG overlays
- Accessibility-first design with AAA compliance
- Three.js 3D visualization (currently visual only, integration with functionality planned next)

## Local Setup
```bash
git clone https://github.com/YOUR_USERNAME/vending_machine_webapp.git
cd vending_machine_webapp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py