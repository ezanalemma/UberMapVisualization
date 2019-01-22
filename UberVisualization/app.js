/* UBER HOMEWORK */

import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {MapView, MapController, PolygonLayer} from 'deck.gl';
import TripsLayer from './trips-layer';


// Set your mapbox token here
const MAPBOX_TOKEN = "pk.eyJ1IjoiZXphbmFsZW1tYSIsImEiOiJjamh3c2UxN3EwNGFjM3FxbjNxaDN6Njl5In0.AdBr4fJMH_gbZzNdU-f5Qw"; // eslint-disable-line


/* DECLARE ALL VARS NEEDED FOR PROJ */
var nodesInfo = [[],[],[]];
var edgesInfo = [[],[],[]];
var arrPoly = []; //has an array of the nodes' polygons
var arrDirPath = []; //has an array of direct paths of edges
var arrRealPath = []; //has an array of real paths of edges
var numOfEdges;

/* make jQuery sync because we need to let all data load before rendering edge animation */
  jQuery.ajaxSetup({
    async: false
  });


/* FIRST JSON REQUEST FOR NODES */

  var ourRequest = new XMLHttpRequest();
  ourRequest.open('GET', 'https://gist.githubusercontent.com/BenjaminMalley/9eadf45dbe11ba9c3ac34c45f905cfe8/raw/2c363711b601fa39a5d0071f10158b86217e530f/nodes.json', false);
  ourRequest.onload = function()
  {
      if (ourRequest.status >= 200 && ourRequest.status < 400)
      {
        var ourData = JSON.parse(ourRequest.responseText);
        renderHTML(ourData); //where we take the data
      }
      else
      {
        console.log("We connected to the server, but it returned an error.");
      }
  };
  ourRequest.onerror = function() { console.log("Connection error"); };
  ourRequest.send();

/* FUNCTION TO STORE THE LATITUDE, LONGITUDE AND NODE ID*/

  function renderHTML(data)
  {

    /* GETS DATA AND STORES IT IN 2D ARRAY */
    for (var i = 0; i < 200; i++) //data.length doesn't work, but we know we have 200 nodes
    {
      nodesInfo[0][i] = data[i]["NodeID"];
      nodesInfo[1][i] = data[i]["Latitude"]; //which is in fact longitude
      nodesInfo[2][i] = data[i]["Longitude"]; //which is in fact latitude
    }

    /* MAP OUT THE COORDINATES OF THE POLYGON (OF THE NODES AS BUILDINGS) */
    for (var i = 0; i < 200; i++) //data.length doesn't work, but we know we have 200 nodes
    {
      arrPoly[i] = [    [nodesInfo[1][i]-0.0015, nodesInfo[2][i]-0.0015]  ,  [nodesInfo[1][i]-0.0015, nodesInfo[2][i]+0.0015]  ,  [nodesInfo[1][i]+0.0015, nodesInfo[2][i]+0.0015]  ,  [nodesInfo[1][i]+0.0015, nodesInfo[2][i]-0.0015]  ,  [nodesInfo[1][i]-0.0015, nodesInfo[2][i]-0.0015]     ];
      //format of polygon should be: [ x-0.001,y-0.001    x-0.001,y+0.001  x+0.001,y+0.001   x+0.001,y-0.001  x-0.001,y-0.001 ]
    }

  }


/* SECOND JSON REQUEST FOR EDGES */

  var ourRequest2 = new XMLHttpRequest();
  ourRequest2.open('GET', 'https://gist.githubusercontent.com/BenjaminMalley/9eadf45dbe11ba9c3ac34c45f905cfe8/raw/2c363711b601fa39a5d0071f10158b86217e530f/edges.json', false);
  ourRequest2.onload = function()
  {
      if (ourRequest2.status >= 200 && ourRequest2.status < 400)
      {
        var ourData2 = JSON.parse(ourRequest2.responseText);
        renderHTML2(ourData2); //where we do most of the stuff
      }
      else
      {
        console.log("We connected to the server, but it returned an error.");
      }
    };
    ourRequest2.onerror = function() { console.log("Connection error"); };
    ourRequest2.send();

/* FUNCTION TO STORE THE START NODE, END NODE AND L2DISTANCE AND CALCULATE ROUTES*/

  function renderHTML2(data2)
  {

      for (var i = 0; i < 205; i++) //data.length doesn't work, we go through 205 edges and only store the valid ones to array
      {
        if (data2.hasOwnProperty(i)) //filters the valid values only
        {
          edgesInfo[0].push(data2[i]["L2Distance"]); //The speed of edges in animation is proportional to the l2Distance/weight of the edge!
          edgesInfo[1].push(data2[i]["StartNodeId"]);
          edgesInfo[2].push(data2[i]["EndNodeId"]);
        }
      }

      numOfEdges = edgesInfo[0].length; //number of edges is 195 in this case

      /* PUSHES THE SOURCE AND DESTINATION COORDINATES INTO ARRAY OF EDGES */
      for (var i = 0; i < numOfEdges; i++)
      {
          //Accoring to Deck.gl, FORMAT => [LONGITUDE, LATITUDE, TIMESTAMP]
          arrDirPath.push( [ nodesInfo[1][ edgesInfo[1][i] ] , nodesInfo[2][ edgesInfo[1][i] ] , 10 ] );
          arrDirPath.push( [ nodesInfo[1][ edgesInfo[2][i] ] ,  nodesInfo[2][ edgesInfo[2][i] ] , ( edgesInfo[0][i] * 40000)   ] );
      }

      function getRealPath (tempToken, edgeStart, edgeFinish)
      {

        /* USING MAPBOX DIRECTIONS API TO MAKE EDGES FOLLOW ACTUAL REAL LIFE ROUTES */
        /* API LIMITS 60 REQUESTS/MINUTE IF NOT PAID MEMBER @MAPBOX */

            for (var i = edgeStart; i < edgeFinish; i++)
            {
                  //assign the given token to the api request
                  var fullTempToken = tempToken + "&steps=true";

                  //the coordinates of the start node and intial time stamp
                  arrRealPath.push( [ nodesInfo[1][ edgesInfo[1][i] ] , nodesInfo[2][ edgesInfo[1][i] ] , 10 ] );

                  //use mapbox api to get route coordinates in json format (by tweaking the url with the start and end coordinates needed)
                  $.getJSON("https://api.mapbox.com/directions/v5/mapbox/driving/" + nodesInfo[1][edgesInfo[1][i]] + "%2C" + nodesInfo[2][edgesInfo[1][i]] + "%3B" + nodesInfo[1][edgesInfo[2][i]] + "%2C" + nodesInfo[2][edgesInfo[2][i]] + ".json?access_token=" + fullTempToken, function(data) {

                        for ( var j = 0; j < data.routes[0].legs[0].steps.length; j++)
                        {
                            //provide longitude and latitude for every step of the way from start to end nodes
                            //for timestamp, divide by the amount of steps it takes and move gradually (still proportional to l2Distance/weight of edge) "&steps=true"

                            arrRealPath.push( [ data.routes[0].legs[0].steps[j].intersections[0].location[0] ,
                                                      data.routes[0].legs[0].steps[j].intersections[0].location[1]  ,
                                                            ( edgesInfo[0][i] * (40000 / ( data.routes[0].legs[0].steps.length + 1) ) * (j+1) )  ] );

                        }

                  });

                  //coordinates of the end node and final time stamp
                  arrRealPath.push( [ nodesInfo[1][ edgesInfo[2][i] ] ,  nodesInfo[2][ edgesInfo[2][i] ] , ( edgesInfo[0][i] * 40000)   ] );

            }

            //console.log(arrDirPath);
            //console.log(arrRealPath);

      }

      /* FIGURED OUT A WAY TO GET PAST THE 60 REQUESTS PER MINUTE LIMITATION BY CREATING 4 ACCOUNTS AND USING MULTIPLE TOKENS*/
      getRealPath(MAPBOX_TOKEN, 0, 60);
      getRealPath("pk.eyJ1IjoiZXphbmFsZW1tYTEwIiwiYSI6ImNqaTJyZXg5dDA3ZjUzdnA2OG5uaTk1NGMifQ.EpGJAH3IiGAX10kg8jXuNQ", 60, 120);
      getRealPath("pk.eyJ1IjoiZXpjb25uZWN0MTAwIiwiYSI6ImNqaTJyaGt1NjF3dGEzcHA4eTRscHFtYjMifQ.Zi9hsQkKaujnGKxqVkpc1Q", 120, 180);
      getRealPath("pk.eyJ1IjoiZXphbmFsIiwiYSI6ImNqaTJycWV5YTA2d28zcXBpYmpzemp5bmQifQ.xenpPNrnO-pIj_PDo-tMyw", 180, numOfEdges );

}



/* INSPIRED BY DECK.GL TEMPLATE "TRIPS", ERROR WHEN THIS IS MODIFIED */
const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS:
    'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips.json', // eslint-disable-line
};

/* LIGHTING POSITION AND SETTINGS */
const LIGHT_SETTINGS = {
  lightsPosition: [-122.88, 41.9, 8000, -122.33, 42.2, 6000, -124.1, 42.1, 9000, -123.2, 41.9, 9000, -121.9, 41.75, 9000],
  ambientRatio: 0.05,
  diffuseRatio: 0.6,
  specularRatio: 0.8,
  lightsStrength: [3.0, 0.0, 0.0, 0.0], //2.0 default
  numberOfLights: 5 //2 default
};

/* INITIAL WINDOW AND POSITION SETTINGS */
const INITIAL_VIEW_STATE = {
  longitude: -123.1,
  latitude: 41.86702,
  zoom: 11, //10.5,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewState: INITIAL_VIEW_STATE,
      time: 0
  }
}

  componentDidMount() {
    window.addEventListener('resize', this._resize.bind(this));
    this._resize();
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _resize() {
    const viewState = Object.assign(this.state.viewState, {
      width: window.innerWidth,
      height: window.innerHeight
    });
    this._onViewStateChange({viewState});
  }

  _onViewStateChange({viewState}) {
    this.setState({
      viewState: {...this.state.viewState, ...viewState}
    });
  }

  _animate() {
    const timestamp = Date.now();
    const loopLength = 3000; //3000
    const loopTime = 38000;

    this.setState({
      time: (timestamp % loopTime) / loopTime * loopLength
    });
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  }



  render() {

    const {
      buildings = DATA_URL.BUILDINGS,
      trips = DATA_URL.TRIPS,
      trailLength = 320, //500
      time = this.state.time,

      onViewStateChange = this._onViewStateChange.bind(this),
      viewState = this.state.viewState,

      mapboxApiAccessToken = MAPBOX_TOKEN,
      mapStyle = 'mapbox://styles/mapbox/dark-v9'
      //mapStyle = 'mapbox://styles/mapbox/satellite-v9' //for different styles of map
    } = this.props;

    const layers = [
      new TripsLayer({
        id: 'trips',
        data: trips,
        /* IF WE WANT DIRECT PATH FROM NODES, UNCOMMENT NEXT LINE */
        //getPath: d => arrDirPath,
        /* IF WE WANT REAL PATH FROM NODES, UNCOMMENT NEXT LINE */
        getPath: d => arrRealPath,
        getColor: d =>[255, 99, 71], //[71, 227, 255], //[255, 99, 71],
        opacity: 1, //0.3
        strokeWidth: 5, //2
        trailLength,
        currentTime: time
      }),
      new PolygonLayer({
        id: 'buildings',
        data: buildings,
        extruded: true,
        wireframe: false,
        fp64: true,
        opacity: 0.5,
        getPolygon: f => arrPoly, //array of nodes' polygon coordinates
        getElevation: f => 1210, //1750 for polyLength of 0.0015, //2333 for polyLength of 0.002, //1200, //height of nodes
        getFillColor: f => [51, 153 ,255], //[144, 12, 63] for red, //[255, 228, 225] for white, //[10, 18, 153] for blue,
        lightSettings: LIGHT_SETTINGS
      })
    ];

    return (

      <DeckGL
        layers={layers}
        views={new MapView({id: 'map'})}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={MapController}
      >
        <StaticMap
          viewId="map"
          {...viewState}
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
          mapboxApiAccessToken={mapboxApiAccessToken}
        />
      </DeckGL>
    );
  }
}


// NOTE: EXPORTS FOR DECK.GL WEBSITE DEMO LAUNCHER - CAN BE REMOVED IN APPS
export {App, INITIAL_VIEW_STATE};

if (!window.demoLauncherActive) {
  render(<App />, document.body.appendChild(document.createElement('div')));
}
