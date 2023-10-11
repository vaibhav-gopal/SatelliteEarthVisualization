# Getting Started

This is an earth satellite / space station visuallization web app built in React / Next.js using Three.js as the graphics library. Additionally uses
python and flask as a backend to calculate from geodetic coordinates in a TLE format to geocentric coordinates in a JSON format (All information found on
CelesTrak).

First run the python API endpoint (make sure you have the proper PIP and NPM packages installed):

```
python Python\ /API\ Endpoint/start.py
```

Wait, then run the development server (in a different shell instance):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

(Also could be [http://localhost:5000](http://localhost:5000))
