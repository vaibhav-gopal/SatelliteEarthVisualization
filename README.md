# Getting Started

This is an earth satellite / space station visuallization web app built in React / Next.js using Three.js as the graphics library. Additionally uses
python and flask as a backend to calculate from geodetic coordinates in a TLE format to geocentric coordinates in a JSON format (All information found on
CelesTrak). 

First run the python API endpoint (make sure you have the proper PIP and NPM packages installed and that you are in the correct directory):

```
cd Python\ API\ Endpoint
python start.py
```

Wait, then run the development server (in a different shell instance):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

(Also could be [http://localhost:5000](http://localhost:5000))

Controls:
- Use the mouse + left click to orbit around a point
- Right click to pan (if enabled)
- Left click (or shift left click for multiple) to select objects
- Space bar to focus / move camera to first selected object
- Top right UI section includes multiple controls to change the parameters of the visualization

TODO:
- Set up NGINX to automate startup
- Optimize satellite / space station instancing by using buffer geometry
- Make it look nicer...
- Display satellite information on side screen, add ability to search through satellites

![Screen shot of space station / satellite visualizer](screenshot.png?raw=true "Screenshot of Visualizer")