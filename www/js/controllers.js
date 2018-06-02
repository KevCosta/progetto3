angular.module('starter.controllers', ['ionic', 'starter.services','ngCordovaBeacon', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

.controller('BeaconCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {
    $scope.beacons = {};
    $scope.todos = [];

    $scope.dir = 0;
    $rootScope.cardinal = ' ';

    $rootScope.settings = {
            inizio: null,
            fine: null,
            stanza: null,
            X: null,
            Y: null,
            risultato: null,
            rimasti: null,
            direzioneConsigliata: null,
            currentState: null
          };


    var myInterval;
    var myTime;
    var myBeacons = [];
    var watchID;

    var temp;
    $rootScope.top = null;
    var nest1;
    var nest2;
    var direzioneTop;
    var topp ;
    var minorPath = [];

    //Funzione che ritorna i gradi, da 0 a 360 della direzione
    function valDirezione(direzione){
      if(direzione ==='NORTH')
        return 0;
      else if(direzione ==='NORTH-EST')
        return 45;
      else if(direzione ==='EST')
        return 90;
      else if(direzione ==='SOUTH-EST')
        return 135;
      else if(direzione ==='SOUTH')
        return 180;
      else if(direzione ==='SOUTH-WEST')
        return 225;
      else if(direzione ==='WEST')
        return 270;
      else
        return 315;
    };

    //Funzione che calcola la differenza tra direzione della bussola e la direzione consigliata
    function diffDirezioni(dir1, dir2){
      var val1 = valDirezione(dir1);
      var val2 = valDirezione(dir2);
      return val1-val2;
    };

    //Funzione che calcola il nodo più vicino al punto P(x,y) 

    function nearestPoint(px, py){
      var nodoMinimo;
      var nodixmin = {};
      var minimo = 1000;
      console.log(minimo);
      for (nodo in grafo){
        var temp = grafo[nodo];
        for (nodo2 in temp){
          var temp2 = temp[nodo2];
          if(Math.abs(temp2['P_x'] - px) <= minimo){
            minimo = Math.abs(temp2['P_x'] - px);
            nodixmin[nodo2] = temp2['P_y'];          
          } 
        }
      }
      console.log(nodixmin);
      minimo = 1000;
      for (nodo in nodixmin){
        if(Math.abs(nodixmin[nodo] - py) < minimo){
            minimo = Math.abs(nodixmin[nodo] - py);
            nodoMinimo = nodo;
          }
      }
      return nodoMinimo;
    };

    //GRAFO
    var Graph = (function (undefined) {

  var extractKeys = function (obj) {
    var keys = [], key;
    for (key in obj) {
        Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
    }
    return keys;
  }

  var sorter = function (a, b) {
    return parseFloat (a) - parseFloat (b);
  }

  var findPaths = function (map, start, end, infinity) {
    infinity = infinity || Infinity;

    var costs = {},
        open = {'0': [start]},
        predecessors = {},
        keys;

    var addToOpen = function (cost, vertex) {
      var key = "" + cost;
      if (!open[key]) open[key] = [];
      open[key].push(vertex);
    }

    costs[start] = 0;

    while (open) {
      if(!(keys = extractKeys(open)).length) break;

      keys.sort(sorter);

      var key = keys[0],
          bucket = open[key],
          node = bucket.shift(),
          currentCost = parseFloat(key),
          adjacentNodes = map[node] || {};

      if (!bucket.length) delete open[key];

      for (var vertex in adjacentNodes) {
          if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
          var cost = adjacentNodes[vertex],
              totalCost = cost + currentCost,
              vertexCost = costs[vertex];

          if ((vertexCost === undefined) || (vertexCost > totalCost)) {
            costs[vertex] = totalCost;
            addToOpen(totalCost, vertex);
            predecessors[vertex] = node;
          }
        }
      }
    }

    if (costs[end] === undefined) {
      return null;
    } else {
      return predecessors;
    }

  }

  var extractShortest = function (predecessors, end) {
    var nodes = [],
        u = end;

    while (u !== undefined) {
      nodes.push(u);
      u = predecessors[u];
    }

    nodes.reverse();
    return nodes;
  }

  var findShortestPath = function (map, nodes) {
    var start = nodes.shift(),
        end,
        predecessors,
        path = [],
        shortest;

    while (nodes.length) {
      end = nodes.shift();
      predecessors = findPaths(map, start, end);

      if (predecessors) {
        shortest = extractShortest(predecessors, end);
        if (nodes.length) {
          path.push.apply(path, shortest.slice(0, -1));
        } else {
          return path.concat(shortest);
        }
      } else {
        return null;
      }

      start = end;
    }
  }

  var toArray = function (list, offset) {
    try {
      return Array.prototype.slice.call(list, offset);
    } catch (e) {
      var a = [];
      for (var i = offset || 0, l = list.length; i < l; ++i) {
        a.push(list[i]);
      }
      return a;
    }
  }

  var Graph = function (map) {
    this.map = map;
  }

  Graph.prototype.findShortestPath = function (start, end) {
    if (Object.prototype.toString.call(start) === '[object Array]') {
      return findShortestPath(this.map, start);
    } else if (arguments.length === 2) {
      return findShortestPath(this.map, [start, end]);
    } else {
      return findShortestPath(this.map, toArray(arguments));
    }
  }

  Graph.findShortestPath = function (map, start, end) {
    if (Object.prototype.toString.call(start) === '[object Array]') {
      return findShortestPath(map, start);
    } else if (arguments.length === 3) {
      return findShortestPath(map, [start, end]);
    } else {
      return findShortestPath(map, toArray(arguments, 1));
    }
  }

  return Graph;

})();
    /* //grafo di prova
    var grafo = {A: {B:{Distanza:2, Direzione:'EST', P_x:7, P_y:10}, D:{Distanza:3, Direzione:'SOUTH', P_x:1, P_y:5}},
                 B: {C:{Distanza:2, Direzione:'SOUTH', P_x:7, P_y:6}, D:{Distanza:19, Direzione:'SOUTH-WEST', P_x:1, P_y:5}, A:{Distanza:2, Direzione:'WEST', P_x:1, P_y:10}},
                 C: {E:{Distanza:7, Direzione:'SOUTH', P_x:7, P_y:1}, B:{Distanza:2, Direzione:'NORTH', P_x:7, P_y:10}},
                 D: {F:{Distanza:9, Direzione:'SOUTH', P_x:1, P_y:1}, A:{Distanza:3, Direzione:'NORTH', P_x:1, P_y:10}, B:{Distanza:19, Direzione:'NORTH-EST', P_x:7, P_y:10}, E:{Distanza:5, Direzione:'SOUTH-EST', P_x:7, P_y:1}},
                 E: {D:{Distanza:5, Direzione:'NORTH-WEST', P_x:1, P_y:5}, F:{Distanza:1, Direzione:'WEST', P_x:1, P_y:1}, C:{Distanza:7, Direzione:'NORTH', P_x:7, P_y:6}},
                 F: {D:{Distanza:9, Direzione:'NORTH', P_x:1, P_y:5}, E:{Distanza:1, Direzione:'EST', P_x:7, P_y:1}}
    }; */

    // Grafo Ca' Vignal 2

    var grafo = {A: {B:{Distanza:1, Direzione:'NORTH', Major:37967, Minor:13908}},
                 B: {A:{Distanza:1, Direzione:'SOUTH', Major:63683, Minor:50706}, C:{Distanza:1, Direzione:'NORTH', Major:59897, Minor:16553}},
                 C: {B:{Distanza:1, Direzione:'SOUTH', Major:37967, Minor:13908}, D:{Distanza:1, Direzione:'NORTH-WEST', Major:3026, Minor:13893}},
                 D: {C:{Distanza:1, Direzione:'SOUTH-EST', Major:59897, Minor:16553}, E:{Distanza:1, Direzione:'WEST', Major:11533, Minor:15063}},
                 E: {D:{Distanza:1, Direzione:'EST', Major:3026, Minor:13893}, F:{Distanza:1, Direzione:'SOUTH-WEST', Major:33432, Minor:23193}},
                 F: {E:{Distanza:1, Direzione:'NORTH-EST', Major:11533, Minor:15063}, G:{Distanza:1, Direzione:'SOUTH', Major:57044, Minor:21756}},
                 G: {F:{Distanza:1, Direzione:'NORTH', Major:33432, Minor:23193}, H:{Distanza:1, Direzione:'SOUTH', Major:39095, Minor:42865}},
                 H: {G:{Distanza:1, Direzione:'NORTH', Major:57044, Minor:21756}} 

    };

    var grafoStanze = {A: ['Bicego', 'Daducci' , 'Dalla Preda', 'Pravadelli', 'Bombieri', 'Quaglia', 'Cristani Marco', 'Giacobazzi', 'Segala'],
                       B: ['Menegaz', 'Fummi', 'Fiorini', 'Merro', 'Mastroeni', 'Altair1', 'Altair2'],
                       C: ['Ferro', '163B', '164A'],
                       D: ['164B', 'Aula L', 'Aula caffè'],
                       E: ['Aula M', 'Aula caffè', '169'],
                       F: ['170', '171', 'Sala' , 'Franco', 'Bonacina'],
                       G: ['Combi', 'Villa', 'Masini', 'Manca' , 'Liptak' , 'Solitario', 'Castellani' , 'Migliori', 'Rizzi', 'Giugno'],
                       H: ['Posenato', 'Belussi', 'Giachetti', 'Carra', 'Farinelli', 'Cristani Matteo', 'Di Pierro', 'Spoto', 'Cicalese', 'Oliboni']}


    //console.log(grafoStanze);
    //console.log(grafo);

    

    var grafoStrutturato = {};
    
    for(key in grafo){
      var sottografo = {};
      var sottografo2 = {};
      var nodotemp = grafo[key];
      for (key2 in nodotemp){
        var nodotemp2 = (nodotemp[key2]);
        if(key < key2){
          sottografo[key + key2] = nodotemp2['Distanza']
          //console.log(sottografo);
          grafoStrutturato[key] = sottografo;
          sottografo2[key2] = nodotemp2['Distanza']
          sottografo2[key] = nodotemp2['Distanza']
          grafoStrutturato[key + key2] = sottografo2;
        }
        else{
          sottografo[key2 + key] = nodotemp2['Distanza']
          //console.log(sottografo);
          grafoStrutturato[key] = sottografo;
        }
      }
    }

    console.log(grafoStrutturato);
    //console.log($rootScope.settings.fine);

    var map = grafoStrutturato,
    graph = new Graph(map);

    //Nodi presenti
    var nodi = [];
    for (key in map){
      nodi.push(key);
    }

    var grafoTotale = {};
    //grafoTotale = grafo;

    //faccio l'unione dei due grafi
    for(key in grafoStrutturato){
      var sottografo = {};
      var sottografo2 = {}
      var temporaneo = grafoStrutturato[key];
      for(key2 in temporaneo){
        var temporaneo2 = temporaneo[key2];
        //console.log(key2);
        //console.log(temporaneo2);
        sottografo['Distanza'] = temporaneo2;
        sottografo2[key2] = sottografo;
        grafoTotale[key] = sottografo2;
      }
    }

    //unisco le info del grafo dato in input come major, minor e direzione
    /*for(key in grafo){
      var temporaneo = grafo[key];
      for(key2 in grafoTotale){
        var temporaneo2 = grafoTotale[key2];
        for(var key3 in temporaneo){
          for(var key4 in temporaneo2){
            console.log(key3);
            console.log(key4);
            if(key3 === key4)
              Object.assign(temporaneo2[key4], temporaneo[key3]);
          }
        }
      }
    }*/


    //aggiungo la direzione al grafoTotale per i nodi virtuali

    console.log(grafoTotale);


    //$scope.risultato = graph.findShortestPath($scope.inizio, 'a');      // => ['a', 'c', 'b']

    //FINE GRAFO
 
    var major;    

        $ionicPlatform.ready(function() {
        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
            console.log($rootScope.currentState);
            //console.log(minorPath);

            var rssiMin = -1000;
            for (var key in $scope.beacons){
              var valori = $scope.beacons[key];
              if(valori['rssi'] > rssiMin && valori['rssi'] > -85){
                major = valori['minor'];
                rssiMin = valori['rssi'];
                //console.log(major);
                //console.log(valori['rssi']);
                console.log(rssiMin);
                console.log(temp);
                minorPath.push(major);
                for (var nodo in grafo){
                  var grafo2 = grafo[nodo];
                  for(var nodo2 in grafo2){
                    var valori2 = grafo2[nodo2];
                    var major2 = valori2['Minor'];
                    //console.log(major2);
                    if(parseInt(major) === major2){
                      $rootScope.settings.inizio = nodo2;
                      //topp = $rootScope.settings.inizio;
                    }
                  }
                }
              }

              else {
                console.log($rootScope.currentState);
                if($rootScope.currentState === 0 && !(temp[0] in grafo)){
                  console.log('ciaooo');
                  console.log(temp);
                  console.log(temp[0]);
                  $rootScope.settings.inizio = temp[0];
                  console.log($rootScope.settings.inizio);
                  //topp = $rootScope.settings.inizio;
                }
              }
              
              
            }

            

            if($rootScope.settings.inizio === $rootScope.settings.fine){
              $rootScope.settings.rimasti = "FINITO!";
              $rootScope.settings.direzioneConsigliata = null;
              $rootScope.settings.risultato = null;
              topp = $rootScope.settings.fine;
              $scope.replace(topp);
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));

            }
            else{
              temp = graph.findShortestPath($rootScope.settings.inizio, $rootScope.settings.fine);
              topp = temp[0];
              $scope.replace(topp);
              if(temp[1] in grafo)
                $rootScope.top = temp[1]; // primo elemento dei nodi rimanenti
              else
                $rootScope.top = temp[2];
              $rootScope.settings.risultato = Array.from(temp); //path totale
              temp.shift();
              $rootScope.settings.rimasti = Array.from(temp); //nodi rimanenti
              nest1 = grafo[$rootScope.settings.inizio]; //primo nest del grafo (es. {A: ...)
              nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
              direzioneTop = nest2['Direzione']; // direzione
              $rootScope.settings.direzioneConsigliata = (direzioneTop);
            }
          });


        $scope.replace = function(topp) {
          //topp = $rootScope.settings.risultato[0];
          console.log("hai premuto la figura");
          console.log(topp);
           
            if(topp === 'A'){
                $scope.videothumbnailA = true;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                
            }
            else if(topp === 'B'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = true;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'C'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = true;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'D'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = true;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'E'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = true;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'F'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = true;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'G'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = true;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'H'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = true;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }

            else if(topp === 'AB'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = true;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'BC'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = true;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'CD'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = true;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'DE'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = true;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'EF'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = true;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'FG'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = true;
                $scope.videothumbnailGH = false;
            }
            else if(topp === 'GH'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = true;
            }
        };

        $scope.replacedest = function(destination) {

          if(destination === 'Aula caffè'){
                $scope.videothumbnailcaffe = true;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;         
          }
          else if(destination === 'Aula L'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = true;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Aula M'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = true;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '164B'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = true;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '164A'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = true;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '163B'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = true;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Ferro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = true;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Altair2'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = true;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Mastroeni'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = true;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Merro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = true;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Menegaz'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = true;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giacobazzi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = true;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Quaglia'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = true;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bombieri'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = true;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Daducci'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = true;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Dalla Preda'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = true;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bicego'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = true;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Pravadelli'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = true;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cristani Marco'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = true;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Segala'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = true;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Fiorini'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = true;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Fummi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = true;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Altair1'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = true;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '169'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = true;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '170'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = true;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '171'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = true;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Franco'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = true;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Sala'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = true;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bonacina'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = true;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Masini'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = true;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Manca'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = true;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Castellani'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = true;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Migliori'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = true;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giugno'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = true;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Posenato'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = true;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giachetti'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = true;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cristani Matteo'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = true;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Spoto'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = true;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cicalese'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = true;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Oliboni'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = true;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Di Pierro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = true;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Farinelli'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = true;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Belussi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = true;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Carra'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = true;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Rizzi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = true; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Liptak'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = true;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Solitario'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = true;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Villa'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = true;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Combi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = true;
          }

        };

        $scope.replaceArrow = function(topp) {
          //topp = $rootScope.settings.risultato[0];
          //console.log(topp);
           
            if(topp === 0){
                $scope.icon0 = true;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
                
            }
            else if(topp === -90 || topp === 270){
                $scope.icon0 = false;
                $scope.icon90 = true;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 180){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = true;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 90){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = true;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 45 || topp === -225){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = true;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp ===  135){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = true;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === -45 || topp === 315){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = true;
                $scope.iconmin135 = false;
            }
            else {  
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = true;
            }
        };
        

        $scope.startScan = function(settings) {
          console.log(settings);
          for( key in grafoStanze){
            var arrayBeacon = grafoStanze[key];
            //console.log(arrayBeacon);
            for(var i = 0; i < arrayBeacon.length; i++){
              if($rootScope.settings.stanza === arrayBeacon[i])
                $rootScope.settings.fine = key;
            }
          }
          //BUSSOLA
          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $rootScope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $rootScope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $rootScope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $rootScope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $rootScope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $rootScope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $rootScope.cardinal = 'WEST';
                      }
                      else {
                          $rootScope.cardinal = 'NORTH-WEST';
                      }

                      $rootScope.currentState = valDirezione($rootScope.settings.direzioneConsigliata) - valDirezione($rootScope.cardinal);
                      $scope.replaceArrow($rootScope.currentState);

                      $scope.replacedest($rootScope.settings.stanza);
                      //console.log(valDirezione($rootScope.settings.direzioneConsigliata));
                      //console.log(valDirezione($rootScope.cardinal));
                      
                      
                  }

              );  
          //FINE BUSSOLA
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));

          //$rootScope.settings.fine = nearestPoint(1, 1); // Prende x e y e calcola il nodo più vicino e lo ritorna come nodo finale
          console.log($rootScope.settings.fine);
          console.log(graph.findShortestPath($rootScope.settings.inizio, $rootScope.settings.fine));
        };

        $scope.stopScan = function() {  
          $cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          $rootScope.settings.time = null;
          clearInterval(myInterval);
          //cordova.plugins.magnetometer.stop([watchID]);
          $rootScope.settings.inizio = null;
          $rootScope.settings.fine = null;

        };

    });
        $scope.create = function(settings) {
          console.log(settings);
          console.log(temp);
          $ionicPopup.prompt({
            position: 'Enter a new POSITION item',
            inputType: 'text'
          })
          .then(function(result) {
            //console.log(result);
            //console.log(temp[0]);
            //console.log(temp.length);
            console.log(nodi.includes(result));
            if(result !== "") {
              if(temp.length === 1 && result === temp[0] || result === $rootScope.settings.fine){
                console.log("Finito");
                $rootScope.settings.rimasti = "FINITO";
                console.log(temp[0]);
                topp = temp[0];
                console.log(topp);
              }
              /*else if(result === temp[0]){ 
                console.log("hai fatto un passo in avanti");
                topp = alert(temp[0]);
                console.log(topp);
                $rootScope.top = temp[1]; // primo elemento dei nodi rimanenti
                console.log($rootScope.top);
                temp.shift();
                $rootScope.settings.rimasti = Array.from(temp);
                nest1 = grafo[result]; //primo nest del grafo (es. {A: ...)
                nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
                direzioneTop = nest2['Direzione']; // direzione
                console.log(direzioneTop)
                $rootScope.settings.direzioneConsigliata = (direzioneTop);
              }*/
              else if(nodi.includes(result)){
                console.log("Nuovo cammino");
                temp = graph.findShortestPath(result, $rootScope.settings.fine);
                $rootScope.settings.risultato = Array.from(temp); //path totale
                topp = temp[0];
                $scope.replace(topp);
                console.log(topp);
                $rootScope.top = $rootScope.settings.risultato[1]; // primo elemento dei nodi rimanenti
                console.log( $rootScope.settings.risultato);
                console.log($rootScope.top);
                temp.shift();
                $rootScope.settings.rimasti = Array.from(temp); //nodi rimanenti
                nest1 = grafo[result]; //primo nest del grafo (es. {A: ...)
                console.log(nest1);
                nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
                console.log(nest2);
                direzioneTop = nest2['Direzione']; // direzione
                console.log(direzioneTop);
                $rootScope.settings.direzioneConsigliata = (direzioneTop);
              }
              else{
                console.log("Nodo sbagliato");
              }     
            } else {
              console.log("Action not completed");
            }
          });
        }
     
        $scope.$on('add', function(event, todo) {
            $scope.todos.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.todos.length; i++) {
                if($scope.todos[i]._id === id) {
                    $scope.todos.splice(i, 1);
                }
            }
        });
})
.controller('WifiCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {

    $scope.beacons = {};
    $scope.todos = [];

    $scope.dir = 0;
    $rootScope.cardinal = ' ';

    $rootScope.settings = {
            inizio: null,
            fine: null,
            stanza: null,
            X: null,
            Y: null,
            risultato: null,
            rimasti: null,
            direzioneConsigliata: null,
            currentState: null
          };


    var myInterval;
    var myTime;
    var myBeacons = [];
    var watchID;

    var temp;
    $rootScope.top = null;
    var nest1;
    var nest2;
    var direzioneTop;
    var topp ;
    var minorPath = [];

    //Funzione che ritorna i gradi, da 0 a 360 della direzione
    function valDirezione(direzione){
      if(direzione ==='NORTH')
        return 0;
      else if(direzione ==='NORTH-EST')
        return 45;
      else if(direzione ==='EST')
        return 90;
      else if(direzione ==='SOUTH-EST')
        return 135;
      else if(direzione ==='SOUTH')
        return 180;
      else if(direzione ==='SOUTH-WEST')
        return 225;
      else if(direzione ==='WEST')
        return 270;
      else
        return 315;
    };

    //Funzione che calcola la differenza tra direzione della bussola e la direzione consigliata
    function diffDirezioni(dir1, dir2){
      var val1 = valDirezione(dir1);
      var val2 = valDirezione(dir2);
      return val1-val2;
    };

    //GRAFO: calcola Dijkstra sul grafo passato come argomento
    var Graph = (function (undefined) {

      var extractKeys = function (obj) {
        var keys = [], key;
        for (key in obj) {
            Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
        }
        return keys;
      }

      var sorter = function (a, b) {
        return parseFloat (a) - parseFloat (b);
      }

      var findPaths = function (map, start, end, infinity) {
        infinity = infinity || Infinity;

        var costs = {},
            open = {'0': [start]},
            predecessors = {},
            keys;

        var addToOpen = function (cost, vertex) {
          var key = "" + cost;
          if (!open[key]) open[key] = [];
          open[key].push(vertex);
        }

        costs[start] = 0;

        while (open) {
          if(!(keys = extractKeys(open)).length) break;

          keys.sort(sorter);

          var key = keys[0],
              bucket = open[key],
              node = bucket.shift(),
              currentCost = parseFloat(key),
              adjacentNodes = map[node] || {};

          if (!bucket.length) delete open[key];

          for (var vertex in adjacentNodes) {
              if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
              var cost = adjacentNodes[vertex],
                  totalCost = cost + currentCost,
                  vertexCost = costs[vertex];

              if ((vertexCost === undefined) || (vertexCost > totalCost)) {
                costs[vertex] = totalCost;
                addToOpen(totalCost, vertex);
                predecessors[vertex] = node;
              }
            }
          }
        }

        if (costs[end] === undefined) {
          return null;
        } else {
          return predecessors;
        }

      }

      var extractShortest = function (predecessors, end) {
        var nodes = [],
            u = end;

        while (u !== undefined) {
          nodes.push(u);
          u = predecessors[u];
        }

        nodes.reverse();
        return nodes;
      }

      var findShortestPath = function (map, nodes) {
        var start = nodes.shift(),
            end,
            predecessors,
            path = [],
            shortest;

        while (nodes.length) {
          end = nodes.shift();
          predecessors = findPaths(map, start, end);

          if (predecessors) {
            shortest = extractShortest(predecessors, end);
            if (nodes.length) {
              path.push.apply(path, shortest.slice(0, -1));
            } else {
              return path.concat(shortest);
            }
          } else {
            return null;
          }

          start = end;
        }
      }

      var toArray = function (list, offset) {
        try {
          return Array.prototype.slice.call(list, offset);
        } catch (e) {
          var a = [];
          for (var i = offset || 0, l = list.length; i < l; ++i) {
            a.push(list[i]);
          }
          return a;
        }
      }

      var Graph = function (map) {
        this.map = map;
      }

      Graph.prototype.findShortestPath = function (start, end) {
        if (Object.prototype.toString.call(start) === '[object Array]') {
          return findShortestPath(this.map, start);
        } else if (arguments.length === 2) {
          return findShortestPath(this.map, [start, end]);
        } else {
          return findShortestPath(this.map, toArray(arguments));
        }
      }

      Graph.findShortestPath = function (map, start, end) {
        if (Object.prototype.toString.call(start) === '[object Array]') {
          return findShortestPath(map, start);
        } else if (arguments.length === 3) {
          return findShortestPath(map, [start, end]);
        } else {
          return findShortestPath(map, toArray(arguments, 1));
        }
      }

      return Graph;
    })();

    // Grafo AP della connessione UNIVAIR-OPEN A:    b4:a5:ef:73:34:e3
    var grafo ={A: {B:{Distanza:1, Direzione:'NORTH', BSSID:'50:06:04:e7:f3:b0'}},
                B: {A:{Distanza:1, Direzione:'SOUTH', BSSID:'50:06:04:fd:48:b0'}, C:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:67:d3:e0'}},
                C: {B:{Distanza:1, Direzione:'SOUTH', BSSID:'50:06:04:e7:f3:b0'}, D:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:a4:cd:d0'}},
                D: {C:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:67:d3:e0'}, E:{Distanza:1, Direzione:'NORTH-WEST', BSSID:'34:db:fd:a4:ce:60'}},
                E: {D:{Distanza:1, Direzione:'SOUTH-EST', BSSID:'34:db:fd:a4:cd:d0'}, F:{Distanza:1, Direzione:'WEST', BSSID:'34:db:fd:67:d4:d0'}},
                F: {E:{Distanza:1, Direzione:'EST', BSSID:'34:db:fd:a4:ce:60'}, G:{Distanza:1, Direzione:'SOUTH-WEST', BSSID:'34:db:fd:a4:cd:00'}},
                G: {F:{Distanza:1, Direzione:'NORTH-EST', BSSID:'34:db:fd:67:d4:d0'}, H:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:67:d6:b0'}},
                H: {G:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:a4:cd:00'}, I:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:67:d5:a0'}},
                I: {H:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:67:d6:b0'}, L:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:a4:cd:20'}},
                L: {I:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:67:d5:a0'}}

    };

    var listaWifi = ['50:06:04:fd:48:b0', '50:06:04:e7:f3:b0', '34:db:fd:67:d3:e0', '34:db:fd:a4:cd:d0', '34:db:fd:a4:ce:60', '34:db:fd:67:d4:d0', '34:db:fd:a4:cd:00', '34:db:fd:67:d6:b0', '34:db:fd:67:d5:a0', '34:db:fd:a4:cd:20'];

    // Grafo stanze
    var grafoStanze = {A: ['Bicego', 'Daducci' , 'Dalla Preda', 'Pravadelli', 'Bombieri'],
                       B: ['Cristani Marco','Quaglia',  'Giacobazzi', 'Segala'],
                       C: ['Menegaz', 'Fummi', 'Fiorini', 'Merro', 'Mastroeni', 'Altair1', 'Altair2'],
                       D: ['Ferro', '163B', '164A','164B'],
                       E: ['Aula L', 'Aula caffè'],
                       F: ['Aula M', 'Aula caffè'],
                       G: ['169','170', '171', 'Sala' , 'Franco', 'Bonacina'], 
                       H: ['Combi', 'Villa', 'Masini', 'Manca'],
                       I: ['Liptak' , 'Solitario', 'Castellani' , 'Migliori', 'Rizzi', 'Giugno', 'Posenato', 'Belussi', 'Giachetti', 'Carra'],
                       L: ['Farinelli', 'Cristani Matteo', 'Di Pierro', 'Spoto', 'Cicalese', 'Oliboni']}


    //console.log(grafoStanze);
    //console.log(grafo);

    // Creazione del grafo da passare a Dijkstra, tolgo tutte le info tranne la distanza
    var grafoStrutturato = {};
    
    for(key in grafo){
      var sottografo = {};
      var sottografo2 = {};
      var nodotemp = grafo[key];
      for (key2 in nodotemp){
        var nodotemp2 = (nodotemp[key2]);
        if(key < key2){
          sottografo[key + key2] = nodotemp2['Distanza']
          //console.log(sottografo);
          grafoStrutturato[key] = sottografo;
          sottografo2[key2] = nodotemp2['Distanza']
          sottografo2[key] = nodotemp2['Distanza']
          grafoStrutturato[key + key2] = sottografo2;
        }
        else{
          sottografo[key2 + key] = nodotemp2['Distanza']
          //console.log(sottografo);
          grafoStrutturato[key] = sottografo;
        }
      }
    }

    console.log(grafoStrutturato);
    //console.log($rootScope.settings.fine);


    var map = grafoStrutturato,
    graph = new Graph(map);

    //Nodi presenti
    var nodi = [];
    for (key in map){
      nodi.push(key);
    }

    var grafoTotale = {};
    //grafoTotale = grafo;

    //faccio l'unione dei due grafi
    for(key in grafoStrutturato){
      var sottografo = {};
      var sottografo2 = {}
      var temporaneo = grafoStrutturato[key];
      for(key2 in temporaneo){
        var temporaneo2 = temporaneo[key2];
        //console.log(key2);
        //console.log(temporaneo2);
        sottografo['Distanza'] = temporaneo2;
        sottografo2[key2] = sottografo;
        grafoTotale[key] = sottografo2;
      }
    }

    console.log(grafoTotale);

    //FINE GRAFO
 

    var major;    
    var network = {};
        $ionicPlatform.ready(function() {
        // Funzioni WIFI
        function ssidHandler(s) {
            alert("Current SSID"+s);
        }

        function fail(e) {
            alert("Failed"+e);
        }

        function getCurrentSSID() {
            WifiWizard.getCurrentSSID(ssidHandler, fail);
        }

        function listHandler(a) {
            alert(a);
        }

        function getWifiList() {
           WifiWizard.listNetworks(listHandler, fail);
        }

        function listHandler2(a) {
          network = a;
          
          $scope.beacons = a;
          
          //console.log(network);
          return a;
        }

        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
            //console.log($scope.beacons);

            //console.log(minorPath);

            WifiWizard.getScanResults(listHandler2, fail);

            var rssiMin = -1000;
            for (var key in $scope.beacons){

              
              var valori = $scope.beacons[key];
              //console.log(key);
              if(valori['level'] >= -65 && valori['SSID'] === 'UNIVAIR-OPEN'){
                major = valori['BSSID'];
                rssiMin = valori['level'];
                console.log(major);
                console.log(rssiMin);
                console.log(rssiMin);
                console.log(temp);
                minorPath.push(major);
                for (var nodo in grafo){
                  var grafo2 = grafo[nodo];
                  for(var nodo2 in grafo2){
                    var valori2 = grafo2[nodo2];
                    var major2 = valori2['BSSID'];
                    console.log(major2);
                    if(major === major2){
                      $rootScope.settings.inizio = nodo2;
                      console.log(nodo2);
                      console.log($rootScope.settings.inizio);
                      //topp = $rootScope.settings.inizio;
                    }
                  }
                }
              } else if(rssiMin < -65){
                //if(valori['level'] < -45){
                  //console.log($rootScope.currentState);
                  if($rootScope.currentState === 0 && !(temp[0] in grafo)){
                    console.log('ciaooo');
                    console.log(temp);
                    console.log(temp[0]);
                    $rootScope.settings.inizio = temp[0];
                    console.log($rootScope.settings.inizio);
                    //topp = $rootScope.settings.inizio;
                  }
                //}
              }
              
              
            }

            if($rootScope.settings.inizio === $rootScope.settings.fine){
              $rootScope.settings.rimasti = "FINITO!";
              $rootScope.settings.direzioneConsigliata = null;
              $rootScope.settings.risultato = null;
              topp = $rootScope.settings.fine;
              $scope.replace(topp);
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));

            }
            else{
              temp = graph.findShortestPath($rootScope.settings.inizio, $rootScope.settings.fine);
              topp = temp[0];
              $scope.replace(topp);
              if(temp[1] in grafo)
                $rootScope.top = temp[1]; // primo elemento dei nodi rimanenti
              else
                $rootScope.top = temp[2];
              $rootScope.settings.risultato = Array.from(temp); //path totale
              temp.shift();
              $rootScope.settings.rimasti = Array.from(temp); //nodi rimanenti
              nest1 = grafo[$rootScope.settings.inizio]; //primo nest del grafo (es. {A: ...)
              nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
              direzioneTop = nest2['Direzione']; // direzione
              $rootScope.settings.direzioneConsigliata = (direzioneTop);
            }
          });


        $scope.replace = function(topp) {
          //topp = $rootScope.settings.risultato[0];
          console.log("hai premuto la figura");
          console.log(topp);
           
            if(topp === 'A'){
                $scope.videothumbnailA = true;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
                
            }
            else if(topp === 'B'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = true;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'C'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = true;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'D'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = true;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'E'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = true;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'F'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = true;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'G'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = true;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'H'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = true;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
            }

            else if(topp === 'AB'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = true;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'BC'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = true;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'CD'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = true;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'DE'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = true;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'EF'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = true;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'FG'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = true;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'GH'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = true;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'I'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = true;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'L'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = true;
            }
            else if(topp === 'HI'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = true;
                $scope.videothumbnailIL = false;
            }
            else if(topp === 'IL'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAB = false;
                $scope.videothumbnailBC = false;
                $scope.videothumbnailCD = false;
                $scope.videothumbnailDE = false;
                $scope.videothumbnailEF = false;
                $scope.videothumbnailFG = false;
                $scope.videothumbnailGH = false;
                $scope.videothumbnailI = false;
                $scope.videothumbnailL = false;
                $scope.videothumbnailHI = false;
                $scope.videothumbnailIL = true;
            }
        };

        $scope.replacedest = function(destination) {

          if(destination === 'Aula caffè'){
                $scope.videothumbnailcaffe = true;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;         
          }
          else if(destination === 'Aula L'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = true;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Aula M'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = true;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '164B'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = true;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '164A'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = true;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '163B'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = true;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Ferro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = true;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Altair2'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = true;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Mastroeni'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = true;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Merro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = true;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Menegaz'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = true;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giacobazzi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = true;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Quaglia'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = true;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bombieri'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = true;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Daducci'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = true;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Dalla Preda'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = true;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bicego'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = true;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Pravadelli'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = true;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cristani Marco'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = true;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Segala'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = true;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Fiorini'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = true;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Fummi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = true;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Altair1'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = true;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '169'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = true;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '170'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = true;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '171'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = true;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Franco'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = true;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Sala'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = true;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bonacina'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = true;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Masini'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = true;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Manca'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = true;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Castellani'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = true;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Migliori'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = true;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giugno'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = true;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Posenato'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = true;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giachetti'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = true;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cristani Matteo'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = true;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Spoto'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = true;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cicalese'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = true;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Oliboni'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = true;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Di Pierro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = true;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Farinelli'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = true;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Belussi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = true;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Carra'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = true;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Rizzi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = true; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Liptak'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = true;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Solitario'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = true;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Villa'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = true;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Combi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = true;
          }

        };


        $scope.replaceArrow = function(topp) {
          //topp = $rootScope.settings.risultato[0];
          //console.log(topp);
           
            if(topp === 0){
                $scope.icon0 = true;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
                
            }
            else if(topp === -90 || topp === 270){
                $scope.icon0 = false;
                $scope.icon90 = true;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 180){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = true;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 90){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = true;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 45 || topp === -225){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = true;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp ===  135){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = true;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === -45 || topp === 315){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = true;
                $scope.iconmin135 = false;
            }
            else {  
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = true;
            }
        };
        

        $scope.startScan = function(settings) {

          console.log(settings);
          for( key in grafoStanze){
            var arrayBeacon = grafoStanze[key];
            //console.log(arrayBeacon);
            for(var i = 0; i < arrayBeacon.length; i++){
              if($rootScope.settings.stanza === arrayBeacon[i])
                $rootScope.settings.fine = key;
            }
          }
          //BUSSOLA
          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $rootScope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $rootScope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $rootScope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $rootScope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $rootScope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $rootScope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $rootScope.cardinal = 'WEST';
                      }
                      else {
                          $rootScope.cardinal = 'NORTH-WEST';
                      }

                      $rootScope.currentState = valDirezione($rootScope.settings.direzioneConsigliata) - valDirezione($rootScope.cardinal);
                      $scope.replaceArrow($rootScope.currentState);
                      $scope.replacedest($rootScope.settings.stanza);
                      //console.log(valDirezione($rootScope.settings.direzioneConsigliata));
                      //console.log(valDirezione($rootScope.cardinal));
                      
                      
                  }

              );  
          //FINE BUSSOLA
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));

          console.log($rootScope.settings.fine);
          console.log(graph.findShortestPath($rootScope.settings.inizio, $rootScope.settings.fine));
        };

        $scope.stopScan = function() {  
          $cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          network = {};
          $rootScope.settings.time = null;
          clearInterval(myInterval);
          //cordova.plugins.magnetometer.stop([watchID]);
          $rootScope.settings.inizio = null;
          $rootScope.settings.fine = null;

        };

    });
        
        $scope.$on('add', function(event, todo) {
            $scope.todos.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.todos.length; i++) {
                if($scope.todos[i]._id === id) {
                    $scope.todos.splice(i, 1);
                }
            }
        });
})

.controller('BeaconWifiCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {
     
    $scope.beacons = {};
    $scope.todos = [];

    $scope.dir = 0;
    $rootScope.cardinal = ' ';

    $rootScope.settings = {
            inizio: null,
            fine: null,
            stanza: null,
            X: null,
            Y: null,
            risultato: null,
            rimasti: null,
            direzioneConsigliata: null,
            currentState: null
          };


    var myInterval;
    var myTime;
    var myBeacons = [];
    var watchID;

    var temp;
    $rootScope.top = null;
    var nest1;
    var nest2;
    var direzioneTop;
    var topp ;
    var minorPath = [];

    //Funzione che ritorna i gradi, da 0 a 360 della direzione
    function valDirezione(direzione){
      if(direzione ==='NORTH')
        return 0;
      else if(direzione ==='NORTH-EST')
        return 45;
      else if(direzione ==='EST')
        return 90;
      else if(direzione ==='SOUTH-EST')
        return 135;
      else if(direzione ==='SOUTH')
        return 180;
      else if(direzione ==='SOUTH-WEST')
        return 225;
      else if(direzione ==='WEST')
        return 270;
      else
        return 315;
    };

    //Funzione che calcola la differenza tra direzione della bussola e la direzione consigliata
    function diffDirezioni(dir1, dir2){
      var val1 = valDirezione(dir1);
      var val2 = valDirezione(dir2);
      return val1-val2;
    };

    //Funzione che calcola il nodo più vicino al punto P(x,y) 

    function nearestPoint(px, py){
      var nodoMinimo;
      var nodixmin = {};
      var minimo = 1000;
      console.log(minimo);
      for (nodo in grafo){
        var temp = grafo[nodo];
        for (nodo2 in temp){
          var temp2 = temp[nodo2];
          if(Math.abs(temp2['P_x'] - px) <= minimo){
            minimo = Math.abs(temp2['P_x'] - px);
            nodixmin[nodo2] = temp2['P_y'];          
          } 
        }
      }
      console.log(nodixmin);
      minimo = 1000;
      for (nodo in nodixmin){
        if(Math.abs(nodixmin[nodo] - py) < minimo){
            minimo = Math.abs(nodixmin[nodo] - py);
            nodoMinimo = nodo;
          }
      }
      return nodoMinimo;
    };

    //GRAFO
    var Graph = (function (undefined) {

  var extractKeys = function (obj) {
    var keys = [], key;
    for (key in obj) {
        Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
    }
    return keys;
  }

  var sorter = function (a, b) {
    return parseFloat (a) - parseFloat (b);
  }

  var findPaths = function (map, start, end, infinity) {
    infinity = infinity || Infinity;

    var costs = {},
        open = {'0': [start]},
        predecessors = {},
        keys;

    var addToOpen = function (cost, vertex) {
      var key = "" + cost;
      if (!open[key]) open[key] = [];
      open[key].push(vertex);
    }

    costs[start] = 0;

    while (open) {
      if(!(keys = extractKeys(open)).length) break;

      keys.sort(sorter);

      var key = keys[0],
          bucket = open[key],
          node = bucket.shift(),
          currentCost = parseFloat(key),
          adjacentNodes = map[node] || {};

      if (!bucket.length) delete open[key];

      for (var vertex in adjacentNodes) {
          if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
          var cost = adjacentNodes[vertex],
              totalCost = cost + currentCost,
              vertexCost = costs[vertex];

          if ((vertexCost === undefined) || (vertexCost > totalCost)) {
            costs[vertex] = totalCost;
            addToOpen(totalCost, vertex);
            predecessors[vertex] = node;
          }
        }
      }
    }

    if (costs[end] === undefined) {
      return null;
    } else {
      return predecessors;
    }

  }

  var extractShortest = function (predecessors, end) {
    var nodes = [],
        u = end;

    while (u !== undefined) {
      nodes.push(u);
      u = predecessors[u];
    }

    nodes.reverse();
    return nodes;
  }

  var findShortestPath = function (map, nodes) {
    var start = nodes.shift(),
        end,
        predecessors,
        path = [],
        shortest;

    while (nodes.length) {
      end = nodes.shift();
      predecessors = findPaths(map, start, end);

      if (predecessors) {
        shortest = extractShortest(predecessors, end);
        if (nodes.length) {
          path.push.apply(path, shortest.slice(0, -1));
        } else {
          return path.concat(shortest);
        }
      } else {
        return null;
      }

      start = end;
    }
  }

  var toArray = function (list, offset) {
    try {
      return Array.prototype.slice.call(list, offset);
    } catch (e) {
      var a = [];
      for (var i = offset || 0, l = list.length; i < l; ++i) {
        a.push(list[i]);
      }
      return a;
    }
  }

  var Graph = function (map) {
    this.map = map;
  }

  Graph.prototype.findShortestPath = function (start, end) {
    if (Object.prototype.toString.call(start) === '[object Array]') {
      return findShortestPath(this.map, start);
    } else if (arguments.length === 2) {
      return findShortestPath(this.map, [start, end]);
    } else {
      return findShortestPath(this.map, toArray(arguments));
    }
  }

  Graph.findShortestPath = function (map, start, end) {
    if (Object.prototype.toString.call(start) === '[object Array]') {
      return findShortestPath(map, start);
    } else if (arguments.length === 3) {
      return findShortestPath(map, [start, end]);
    } else {
      return findShortestPath(map, toArray(arguments, 1));
    }
  }

  return Graph;

})();
    /* //grafo di prova
    var grafo = {A: {B:{Distanza:2, Direzione:'EST', P_x:7, P_y:10}, D:{Distanza:3, Direzione:'SOUTH', P_x:1, P_y:5}},
                 B: {C:{Distanza:2, Direzione:'SOUTH', P_x:7, P_y:6}, D:{Distanza:19, Direzione:'SOUTH-WEST', P_x:1, P_y:5}, A:{Distanza:2, Direzione:'WEST', P_x:1, P_y:10}},
                 C: {E:{Distanza:7, Direzione:'SOUTH', P_x:7, P_y:1}, B:{Distanza:2, Direzione:'NORTH', P_x:7, P_y:10}},
                 D: {F:{Distanza:9, Direzione:'SOUTH', P_x:1, P_y:1}, A:{Distanza:3, Direzione:'NORTH', P_x:1, P_y:10}, B:{Distanza:19, Direzione:'NORTH-EST', P_x:7, P_y:10}, E:{Distanza:5, Direzione:'SOUTH-EST', P_x:7, P_y:1}},
                 E: {D:{Distanza:5, Direzione:'NORTH-WEST', P_x:1, P_y:5}, F:{Distanza:1, Direzione:'WEST', P_x:1, P_y:1}, C:{Distanza:7, Direzione:'NORTH', P_x:7, P_y:6}},
                 F: {D:{Distanza:9, Direzione:'NORTH', P_x:1, P_y:5}, E:{Distanza:1, Direzione:'EST', P_x:7, P_y:1}}
    }; */

    // Grafo Ca' Vignal 2
 //  b4:a5:ef:73:34:e3
    var grafo = {Aw: {A:{Distanza:1, Direzione:'NORTH', Major:63683, Minor:50706}},
                 A: {Aw:{Distanza:1, Direzione:'SOUTH', BSSID:'50:06:04:fd:48:b0'}, Bw:{Distanza:1, Direzione:'NORTH', BSSID:'50:06:04:e7:f3:b0'}},
                 Bw: {A:{Distanza:1, Direzione:'SOUTH', Major:63683, Minor:50706}, B:{Distanza:1, Direzione:'NORTH', Major:37967, Minor:13908}},
                 B: {Bw:{Distanza:1, Direzione:'SOUTH', BSSID:'50:06:04:e7:f3:b0'}, Cw:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:67:d3:e0'}},
                 Cw: {B:{Distanza:1, Direzione:'SOUTH', Major:37967, Minor:13908}, C:{Distanza:1, Direzione:'NORTH', Major:59897, Minor:16553}},
                 C: {Cw:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:67:d3:e0'}, Dw:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:a4:cd:d0'}},
                 Dw: {C:{Distanza:1, Direzione:'NORTH', Major:59897, Minor:16553}, D:{Distanza:1, Direzione:'WEST', Major:3026, Minor:13893}},
                 D: {Dw:{Distanza:1, Direzione:'EST', BSSID:'34:db:fd:a4:cd:d0'}, Ew:{Distanza:1, Direzione:'WEST', BSSID:'34:db:fd:a4:ce:60'}},
                 Ew: {D:{Distanza:1, Direzione:'EST', Major:3026, Minor:13893}, Fw:{Distanza:1, Direzione:'WEST', BSSID:'34:db:fd:67:d4:d0'}},
                 Fw: {Ew:{Distanza:1, Direzione:'EST', BSSID:'34:db:fd:a4:ce:60'}, E:{Distanza:1, Direzione:'WEST', Major:11533, Minor:15063}},
                 E: {Fw:{Distanza:1, Direzione:'EST', BSSID:'34:db:fd:67:d4:d0'}, Gw:{Distanza:1, Direzione:'WEST', BSSID:'34:db:fd:a4:cd:00'}},
                 Gw: {E:{Distanza:1, Direzione:'EST', Major:11533, Minor:15063}, F:{Distanza:1, Direzione:'SOUTH', Major:33432, Minor:23193}},
                 F: {Gw:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:a4:cd:00'}, Hw:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:67:d6:b0'}},
                 Hw: {F:{Distanza:1, Direzione:'NORTH', Major:33432, Minor:23193}, G:{Distanza:1, Direzione:'SOUTH', Major:57044, Minor:21756}},
                 G: {Hw:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:67:d6:b0'}, Iw:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:67:d5:a0'}},
                 Iw: {G:{Distanza:1, Direzione:'NORTH', Major:57044, Minor:21756}, H:{Distanza:1, Direzione:'SOUTH', Major:39095, Minor:42865}},
                 H: {Iw:{Distanza:1, Direzione:'NORTH', BSSID:'34:db:fd:67:d5:a0'}, Lw:{Distanza:1, Direzione:'SOUTH', BSSID:'34:db:fd:a4:cd:20'}},
                 Lw: {H:{Distanza:1, Direzione:'NORTH', Major:39095, Minor:42865}}

    };

    var grafoStanze = {Aw:['Bicego', 'Daducci' , 'Dalla Preda', 'Pravadelli', 'Bombieri'],
                       A: ['Quaglia', 'Cristani Marco', 'Giacobazzi', 'Segala'],
                       B: ['Menegaz', 'Fiorini', 'Merro' ],
                       Cw:['Fummi','Mastroeni', 'Altair1', 'Altair2'],
                       C: ['Ferro' ],
                       Dw:['163B', '164A'],
                       D: ['164B'],
                       Ew:['Aula L', 'Aula caffè'],
                       Fw:['Aula caffè', 'Aula M'],
                       E: ['169'],
                       Gw:['170', '171'],
                       F: ['Sala' , 'Franco', 'Bonacina'],
                       Hw:['Combi', 'Villa', 'Masini', 'Manca'],
                       Iw: ['Liptak' , 'Solitario', 'Castellani' , 'Migliori', 'Rizzi', 'Giugno'],
                       H: ['Posenato', 'Belussi', 'Giachetti', 'Carra'],
                       Lw: ['Farinelli', 'Cristani Matteo', 'Di Pierro', 'Spoto', 'Cicalese', 'Oliboni']}


    //console.log(grafoStanze);
    //console.log(grafo);

    

    var grafoStrutturato = {};
    
    for(key in grafo){
      var sottografo = {};      
      var nodotemp = grafo[key];
      for (key2 in nodotemp){
        var nodotemp2 = (nodotemp[key2]);
        var sottografo2 = {};
        if(key < key2){
          sottografo[key + key2] = nodotemp2['Distanza']
          grafoStrutturato[key] = sottografo;
          sottografo2[key2] = nodotemp2['Distanza']
          sottografo2[key] = nodotemp2['Distanza']
          grafoStrutturato[key + key2] = sottografo2;
        }
        else{
          sottografo[key2 + key] = nodotemp2['Distanza']
          //console.log(sottografo);
          grafoStrutturato[key] = sottografo;
        }
      }
    }

    console.log(grafoStrutturato);
    //console.log($rootScope.settings.fine);

    var map = grafoStrutturato,
    graph = new Graph(map);

    //Nodi presenti
    var nodi = [];
    for (key in map){
      nodi.push(key);
    }

    var grafoTotale = {};
    //grafoTotale = grafo;

    //faccio l'unione dei due grafi
    for(key in grafoStrutturato){
      var sottografo = {};
      var sottografo2 = {}
      var temporaneo = grafoStrutturato[key];
      for(key2 in temporaneo){
        var temporaneo2 = temporaneo[key2];
        //console.log(key2);
        //console.log(temporaneo2);
        sottografo['Distanza'] = temporaneo2;
        sottografo2[key2] = sottografo;
        grafoTotale[key] = sottografo2;
      }
    }

    //unisco le info del grafo dato in input come major, minor e direzione
    /*for(key in grafo){
      var temporaneo = grafo[key];
      for(key2 in grafoTotale){
        var temporaneo2 = grafoTotale[key2];
        for(var key3 in temporaneo){
          for(var key4 in temporaneo2){
            console.log(key3);
            console.log(key4);
            if(key3 === key4)
              Object.assign(temporaneo2[key4], temporaneo[key3]);
          }
        }
      }
    }*/


    //aggiungo la direzione al grafoTotale per i nodi virtuali

    console.log(grafoTotale);


    //$scope.risultato = graph.findShortestPath($scope.inizio, 'a');      // => ['a', 'c', 'b']

    //FINE GRAFO
 
    var major;  
    var network = {};
        $ionicPlatform.ready(function() {
        // Funzioni WIFI
        function ssidHandler(s) {
            alert("Current SSID"+s);
        }

        function fail(e) {
            alert("Failed"+e);
        }

        function getCurrentSSID() {
            WifiWizard.getCurrentSSID(ssidHandler, fail);
        }

        function listHandler(a) {
            alert(a);
        }

        function getWifiList() {
           WifiWizard.listNetworks(listHandler, fail);
        }

        function listHandler2(a) {
          network = a;

          
          $scope.beacons = a;
          
          return a;
        }  

        
        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            //$scope.beacons = {};
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
            console.log($rootScope.currentState);

            WifiWizard.getScanResults(listHandler2, fail);

            console.log($scope.beacons);
            console.log($rootScope.settings.cardinal);

            var rssiMin = -1000;
            for (var key in $scope.beacons){
              var valori = $scope.beacons[key];
              if(valori['rssi'] > rssiMin && valori['rssi'] > -85){
                major = valori['minor'];
                rssiMin = valori['rssi'];
                //console.log(major);
                //console.log(valori['rssi']);
                console.log(rssiMin);
                console.log(temp);
                minorPath.push(major);
                for (var nodo in grafo){
                  var grafo2 = grafo[nodo];
                  for(var nodo2 in grafo2){
                    var valori2 = grafo2[nodo2];
                    var major2 = valori2['Minor'];
                    //console.log(major2);
                    if(parseInt(major) === major2){
                      $rootScope.settings.inizio = nodo2;
                      //topp = $rootScope.settings.inizio;
                    }
                  }
                }
              }
              else if(valori['level'] >= -65 && valori['SSID'] === 'UNIVAIR-OPEN'){
                major = valori['BSSID'];
                rssiMin = valori['level'];
                console.log(major);
                console.log(rssiMin);
                console.log(rssiMin);
                console.log(temp);
                minorPath.push(major);
                for (var nodo in grafo){
                  var grafo2 = grafo[nodo];
                  for(var nodo2 in grafo2){
                    var valori2 = grafo2[nodo2];
                    var major2 = valori2['BSSID'];
                    console.log(major2);
                    if(major === major2){
                      $rootScope.settings.inizio = nodo2;
                      console.log(nodo2);
                      console.log($rootScope.settings.inizio);
                      //topp = $rootScope.settings.inizio;
                    }
                  }
                }
              }

              else {
                console.log($rootScope.currentState);
                if($rootScope.currentState === 0 && !(temp[0] in grafo)){
                  console.log('ciaooo');
                  console.log(temp);
                  console.log(temp[0]);
                  $rootScope.settings.inizio = temp[0];
                  console.log($rootScope.settings.inizio);
                  //topp = $rootScope.settings.inizio;
                }
              }
              
              
            }

            

            if($rootScope.settings.inizio === $rootScope.settings.fine){
              $rootScope.settings.rimasti = "FINITO!";
              $rootScope.settings.direzioneConsigliata = null;
              $rootScope.settings.risultato = null;
              topp = $rootScope.settings.fine;
              $scope.replace(topp);
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));

            }
            else{
              temp = graph.findShortestPath($rootScope.settings.inizio, $rootScope.settings.fine);
              topp = temp[0];
              $scope.replace(topp);
              if(temp[1] in grafo)
                $rootScope.top = temp[1]; // primo elemento dei nodi rimanenti
              else
                $rootScope.top = temp[2];
              $rootScope.settings.risultato = Array.from(temp); //path totale
              temp.shift();
              $rootScope.settings.rimasti = Array.from(temp); //nodi rimanenti
              nest1 = grafo[$rootScope.settings.inizio]; //primo nest del grafo (es. {A: ...)
              nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
              direzioneTop = nest2['Direzione']; // direzione
              $rootScope.settings.direzioneConsigliata = (direzioneTop);
            }
          });


        $scope.replace = function(topp) {
          //topp = $rootScope.settings.risultato[0];
          console.log("hai premuto la figura");
          console.log(topp);
           
            if(topp === 'A'){
                $scope.videothumbnailA = true;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;  
                $scope.videothumbnailHLw = false;   
            }
            else if(topp === 'B'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = true;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'C'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = true;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'D'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = true;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'E'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = true;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'F'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = true;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'G'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = true;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'H'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = true;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Aw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = true;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Bw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = true;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Cw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = true;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Dw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = true;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Ew'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = true;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Fw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = true;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Gw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = true;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Hw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = true;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Iw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = true;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'Lw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = true;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'AAw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = true;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'ABw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = true;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'BBw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = true;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'BCw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = true;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'CCw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = true;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'CDw'){
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = true;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'DDw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = true;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'DEw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = true;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'EFw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = true;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'EGw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = true;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'EwFw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = true;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'FGw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = true;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'FHw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = true;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'GHw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = true;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'GIw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = true;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'HIw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = false;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = true;
                $scope.videothumbnailHLw = false;
            }
            else if(topp === 'HLw'){  
                $scope.videothumbnailA = false;
                $scope.videothumbnailB = false;
                $scope.videothumbnailC = false;
                $scope.videothumbnailD = false;
                $scope.videothumbnailE = false;
                $scope.videothumbnailF = false;
                $scope.videothumbnailG = false;
                $scope.videothumbnailH = false;
                $scope.videothumbnailAw = false;
                $scope.videothumbnailBw = false;
                $scope.videothumbnailCw = false;
                $scope.videothumbnailDw = false;
                $scope.videothumbnailEw = false;
                $scope.videothumbnailFw = false;
                $scope.videothumbnailGw = false;
                $scope.videothumbnailHw = false;
                $scope.videothumbnailIw = false;
                $scope.videothumbnailLw = false;
                $scope.videothumbnailAAw = false;
                $scope.videothumbnailABw = false;
                $scope.videothumbnailBBw = false;
                $scope.videothumbnailBCw = false;
                $scope.videothumbnailCCw = false;
                $scope.videothumbnailCDw = false;
                $scope.videothumbnailDDw = false;
                $scope.videothumbnailDEw = false;
                $scope.videothumbnailEwFw = false;
                $scope.videothumbnailEFw = false;
                $scope.videothumbnailEGw = true;
                $scope.videothumbnailFGw = false;
                $scope.videothumbnailFHw = false;
                $scope.videothumbnailGHw = false;
                $scope.videothumbnailGIw = false;
                $scope.videothumbnailHIw = false;
                $scope.videothumbnailHLw = true;
            }
        };

        $scope.replacedest = function(destination) {

          if(destination === 'Aula caffè'){
                $scope.videothumbnailcaffe = true;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;         
          }
          else if(destination === 'Aula L'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = true;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Aula M'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = true;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '164B'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = true;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '164A'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = true;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '163B'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = true;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Ferro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = true;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Altair2'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = true;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Mastroeni'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = true;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Merro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = true;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Menegaz'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = true;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giacobazzi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = true;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Quaglia'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = true;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bombieri'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = true;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Daducci'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = true;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Dalla Preda'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = true;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bicego'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = true;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Pravadelli'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = true;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cristani Marco'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = true;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Segala'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = true;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Fiorini'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = true;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Fummi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = true;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Altair1'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = true;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '169'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = true;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '170'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = true;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === '171'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = true;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Franco'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = true;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Sala'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = true;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Bonacina'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = true;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Masini'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = true;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Manca'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = true;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Castellani'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = true;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Migliori'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = true;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giugno'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = true;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Posenato'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = true;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Giachetti'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = true;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cristani Matteo'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = true;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Spoto'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = true;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Cicalese'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = true;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Oliboni'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = true;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Di Pierro'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = true;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Farinelli'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = true;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Belussi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = true;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Carra'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = true;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Rizzi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = true; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Liptak'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = true;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Solitario'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = true;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Villa'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = true;
                $scope.videothumbnailcombi = false;
          }
          else if(destination === 'Combi'){
                $scope.videothumbnailcaffe = false;
                $scope.videothumbnailaulaL = false;
                $scope.videothumbnailaulaM = false;
                $scope.videothumbnail164B = false;
                $scope.videothumbnail164A = false;
                $scope.videothumbnail163B = false;
                $scope.videothumbnailferro = false;
                $scope.videothumbnailaltair2 = false;
                $scope.videothumbnailmastroeni = false;
                $scope.videothumbnailmerro = false;
                $scope.videothumbnailmenegaz = false;
                $scope.videothumbnailgiacobazzi = false;
                $scope.videothumbnailquaglia = false;
                $scope.videothumbnailbombieri = false;
                $scope.videothumbnaildaducci = false;  
                $scope.videothumbnaildallapreda = false;
                $scope.videothumbnailbicego = false;
                $scope.videothumbnailpravadelli = false;
                $scope.videothumbnailcristanimarco = false;
                $scope.videothumbnailsegala = false;
                $scope.videothumbnailfiorini = false;
                $scope.videothumbnailfummi = false;
                $scope.videothumbnailaltair1 = false;
                $scope.videothumbnail169 = false;
                $scope.videothumbnail170 = false;
                $scope.videothumbnail171 = false;
                $scope.videothumbnailfranco = false;
                $scope.videothumbnailsala = false;
                $scope.videothumbnailbonacina = false;
                $scope.videothumbnailmasini = false;
                $scope.videothumbnailmanca = false;
                $scope.videothumbnailmigliori = false;
                $scope.videothumbnailcastellani = false;
                $scope.videothumbnailgiugno = false;
                $scope.videothumbnailposenato = false;
                $scope.videothumbnailgiachetti = false;
                $scope.videothumbnailcristanimatteo = false;
                $scope.videothumbnailspoto = false;
                $scope.videothumbnailcicalese = false;
                $scope.videothumbnailoliboni = false;
                $scope.videothumbnaildipierro = false;
                $scope.videothumbnailfarinelli = false;
                $scope.videothumbnailbelussi = false;
                $scope.videothumbnailcarra = false;
                $scope.videothumbnailrizzi = false; 
                $scope.videothumbnailliptak = false;
                $scope.videothumbnailsolitario = false;
                $scope.videothumbnailvilla = false;
                $scope.videothumbnailcombi = true;
          }

        };

        $scope.replaceArrow = function(topp) {
          //topp = $rootScope.settings.risultato[0];
          //console.log(topp);
           
            if(topp === 0){
                $scope.icon0 = true;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
                
            }
            else if(topp === -90 || topp === 270){
                $scope.icon0 = false;
                $scope.icon90 = true;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 180){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = true;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 90){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = true;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === 45 || topp === -225){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = true;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp ===  135){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = true;
                $scope.iconmin45 = false;
                $scope.iconmin135 = false;
            }
            else if(topp === -45 || topp === 315){
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = true;
                $scope.iconmin135 = false;
            }
            else {  
                $scope.icon0 = false;
                $scope.icon90 = false;
                $scope.icon180 = false;
                $scope.iconmin90 = false;
                $scope.icon45 = false;
                $scope.icon135 = false;
                $scope.iconmin45 = false;
                $scope.iconmin135 = true;
            }
        };
        

        $scope.startScan = function(settings) {
          console.log(settings);
          for( key in grafoStanze){
            var arrayBeacon = grafoStanze[key];
            //console.log(arrayBeacon);
            for(var i = 0; i < arrayBeacon.length; i++){
              if($rootScope.settings.stanza === arrayBeacon[i])
                $rootScope.settings.fine = key;
            }
          }
          //BUSSOLA
          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $rootScope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $rootScope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $rootScope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $rootScope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $rootScope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $rootScope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $rootScope.cardinal = 'WEST';
                      }
                      else {
                          $rootScope.cardinal = 'NORTH-WEST';
                      }

                      $rootScope.currentState = valDirezione($rootScope.settings.direzioneConsigliata) - valDirezione($rootScope.cardinal);
                      $scope.replaceArrow($rootScope.currentState);

                      $scope.replacedest($rootScope.settings.stanza);
                      //console.log(valDirezione($rootScope.settings.direzioneConsigliata));
                      //console.log(valDirezione($rootScope.cardinal));
                      
                      
                  }

              );  
          //FINE BUSSOLA
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));

          //$rootScope.settings.fine = nearestPoint(1, 1); // Prende x e y e calcola il nodo più vicino e lo ritorna come nodo finale
          console.log($rootScope.settings.fine);
          console.log(graph.findShortestPath($rootScope.settings.inizio, $rootScope.settings.fine));
        };

        $scope.stopScan = function() {  
          $cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          $rootScope.settings.time = null;
          clearInterval(myInterval);
          //cordova.plugins.magnetometer.stop([watchID]);
          $rootScope.settings.inizio = null;
          $rootScope.settings.fine = null;

        };

    });
        $scope.create = function(settings) {
          console.log(settings);
          console.log(temp);
          $ionicPopup.prompt({
            position: 'Enter a new POSITION item',
            inputType: 'text'
          })
          .then(function(result) {
            //console.log(result);
            //console.log(temp[0]);
            //console.log(temp.length);
            console.log(nodi.includes(result));
            if(result !== "") {
              if(temp.length === 1 && result === temp[0] || result === $rootScope.settings.fine){
                console.log("Finito");
                $rootScope.settings.rimasti = "FINITO";
                console.log(temp[0]);
                topp = temp[0];
                console.log(topp);
              }
              /*else if(result === temp[0]){ 
                console.log("hai fatto un passo in avanti");
                topp = alert(temp[0]);
                console.log(topp);
                $rootScope.top = temp[1]; // primo elemento dei nodi rimanenti
                console.log($rootScope.top);
                temp.shift();
                $rootScope.settings.rimasti = Array.from(temp);
                nest1 = grafo[result]; //primo nest del grafo (es. {A: ...)
                nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
                direzioneTop = nest2['Direzione']; // direzione
                console.log(direzioneTop)
                $rootScope.settings.direzioneConsigliata = (direzioneTop);
              }*/
              else if(nodi.includes(result)){
                console.log("Nuovo cammino");
                temp = graph.findShortestPath(result, $rootScope.settings.fine);
                $rootScope.settings.risultato = Array.from(temp); //path totale
                topp = temp[0];
                $scope.replace(topp);
                console.log(topp);
                $rootScope.top = $rootScope.settings.risultato[1]; // primo elemento dei nodi rimanenti
                console.log( $rootScope.settings.risultato);
                console.log($rootScope.top);
                temp.shift();
                $rootScope.settings.rimasti = Array.from(temp); //nodi rimanenti
                nest1 = grafo[result]; //primo nest del grafo (es. {A: ...)
                console.log(nest1);
                nest2 = nest1[$rootScope.top]; //secondo nest (es. B:{...}, C:{})
                console.log(nest2);
                direzioneTop = nest2['Direzione']; // direzione
                console.log(direzioneTop);
                $rootScope.settings.direzioneConsigliata = (direzioneTop);
              }
              else{
                console.log("Nodo sbagliato");
              }     
            } else {
              console.log("Action not completed");
            }
          });
        }
     
        $scope.$on('add', function(event, todo) {
            $scope.todos.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.todos.length; i++) {
                if($scope.todos[i]._id === id) {
                    $scope.todos.splice(i, 1);
                }
            }
        });
})



.controller('WelcomeCtrl', function($scope, $state, $q, UserService, $ionicLoading) {
  // This is the success callback from the login method
  var fbLoginSuccess = function(response) {
    if (!response.authResponse){
      fbLoginError("Cannot find the authResponse");
      return;
    }

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
    .then(function(profileInfo) {
      // For the purpose of this example I will store user data on local storage
      UserService.setUser({
        authResponse: authResponse,
        userID: profileInfo.id,
        name: profileInfo.name,
        email: profileInfo.email,
        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
      });
      $ionicLoading.hide();
      $state.go('app.home');
    }, function(fail){
      // Fail get profile info
      console.log('profile info fail', fail);
    });
  };

  // This is the fail callback from the login method
  var fbLoginError = function(error){
    console.log('fbLoginError', error);
    $ionicLoading.hide();
  };

  // This method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
        console.log(response);
        info.resolve(response);
      },
      function (response) {
        console.log(response);
        info.reject(response);
      }
    );
    return info.promise;
  };

  //This method is executed when the user press the "Login with facebook" button
  $scope.facebookSignIn = function() {
    facebookConnectPlugin.getLoginStatus(function(success){
      if(success.status === 'connected'){
        // The user is logged in and has authenticated your app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed request, and the time the access token
        // and signed request each expire
        console.log('getLoginStatus', success.status);

        // Check if we have our user saved
        var user = UserService.getUser('facebook');

        if(!user.userID){
          getFacebookProfileInfo(success.authResponse)
          .then(function(profileInfo) {
            // For the purpose of this example I will store user data on local storage
            UserService.setUser({
              authResponse: success.authResponse,
              userID: profileInfo.id,
              name: profileInfo.name,
              email: profileInfo.email,
              picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
            });

            $state.go('app.home');
          }, function(fail){
            // Fail get profile info
            console.log('profile info fail', fail);
          });
        }else{
          $state.go('app.home');
        }
      } else {
        // If (success.status === 'not_authorized') the user is logged in to Facebook,
        // but has not authenticated your app
        // Else the person is not logged into Facebook,
        // so we're not sure if they are logged into this app or not.

        console.log('getLoginStatus', success.status);

        $ionicLoading.show({
          template: 'Logging in...'
        });

        // Ask the permissions you need. You can learn more about
        // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
      }
    });
  };
})

.controller('HomeCtrl', function($scope, UserService, $ionicActionSheet, $state, $ionicLoading){
  $scope.user = UserService.getUser();

  $scope.showLogOutMenu = function() {
    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Logout',
      titleText: 'Are you sure you want to logout? This app is awsome so I recommend you to stay.',
      cancelText: 'Cancel',
      cancel: function() {},
      buttonClicked: function(index) {
        return true;
      },
      destructiveButtonClicked: function(){
        $ionicLoading.show({
          template: 'Logging out...'
        });

        // Facebook logout
        facebookConnectPlugin.logout(function(){
          $ionicLoading.hide();
          $state.go('welcome');
        },
        function(fail){
          $ionicLoading.hide();
        });
      }
    });
  };
});
