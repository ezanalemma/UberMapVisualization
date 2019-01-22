# EzanaHabtegiorgiss
Uber Map Visualization

## Used DECK.GL: Open Source Data Visualization **Made By Uber**

![Alt Text](https://image.ibb.co/cquiHo/gif1.gif)

# First Steps

* Read the json files provided by Uber HGP (using 2 XMLHttpRequests). 
* Stored the nodes’ Latitude, Longitude and NodeID in a 2DArray “NodesInfo”
* Stored the edges’ StartNodeID, EndNodeID and L2distance (weight) in a 2DArray “EdgesInfo”

## For Nodes:
* Created a 2d Array that took all the coordinates of the nodes from json.
* For the nodes to be seen in map, I created polygons by mapping out coordinates around it to give it width. (line 63) 
* Stored all the polygon combinations in array “arrPoly” to feed to the MapBox API.
* Used Deck.gl’s functionality to easily enter the height of the nodes’ polygons (line 278)
* Modified the aesthetics with lighting settings, rgb color, etc (commented different options for easy tweaking)

![Alt Text](https://image.ibb.co/nNUsco/gif2.gif)

## For edges:
* Created a 2d Array that took all the edges’ info from json.
* The json provided had index gaps so in order to skip invalid index, I used hasOwnProperty() (line 96) to filter correctly.
* Assign “arrDirPath” or “arrRealPath” in line  for different outcomes.

  ### For direct paths:
* Created an array “arrDirPath” to obtain all the longitudes, latitudes and timestamp of edges.
* Combined both 2d arrays “nodesInfo” and “edgesInfo” to push all the latitude and longitude coordinates of all the start and end nodes.
* For the edges’ timestamp, I used “L2Distance”’s values which will make all edges’ movement in map proportional to its weight provided in json.

  ### For real paths:
* Using Mapbox Directions API to make edges follow actual real life routes.
/ Created an array “arrRealPath” to obtain the longitudes, latitudes and timestamp the entire route from start node to end node in real life. (API allows up to 25 steps per edge [for free]).
* First, I push the startNodeId’s coordinates to the “arrRealPath” array.
* Then, I call the Directions API (via jquery) then get back a json with route info.
* By passing each coordinate of the start and end node IDs, I take the coordinates of every step of the way from API to store in my “arrRealPath” array.
* Lastly, I push the endNodeId’s coordinates to the “arrRealPath” array.
* For timestamps, I divide the weight of the edge to the amount of steps it takes to get to endNodeId then assign the timestamps * appropriately along the way.

![Alt Text](https://image.ibb.co/gFM5xo/gif3.gif) <br />
Map of all the nodes with direct edges <br />

![Alt Text](https://image.ibb.co/gXdw3T/gif4.gif) <br />
Map of all the nodes with actual driving routes <br />

![Alt Text](https://image.ibb.co/ey5yHo/gif5.gif) <br />
Map of all the nodes with actual walking routes <br />

PS. Mapbox had a limit of 60 API requests per minute. Needed 195 requests so I created 4 accounts to assign different tokens with 60 requests each.

I then tweaked all settings to provide the best aesthetics I could do.

Map from Mapbox.
Lighting and other settings were provided by DECK.GL.

### INSPIRED BY TRIPS EXAMPLE OF DECK.GL


To run this, download folder, cd to directory in “ubervisual” then: <br />
run npm install <br />
run npm start <br />

