;(function($, GM, MC){
    'use strict';
    
    window.APP  = {
        companyMapCluster: null,
        
        defaultDataMapCluster: null,
        
        defaultDataMarkers: [],
        
        MapClusterFactory: (function () {
            var libs = {
                map: null,
                Cluster: null
            },
            
            getLibs = function () { return libs; },
            
            setLisbs = function () {  
                libs.map = GM;
                libs.Cluster = MC;
                return $.when();
            },
            
            setDefaultData = function () {
                return $.when( $.getJSON('data/dataMap.json') )
                        .then( $.proxy(function (data) {
                    this.defaultDataMapCluster = data;
                }, APP));
            },

            setMarkersData = function () {
                return $.when( $.getJSON('data/dataMarkers.json') )
                        .then( $.proxy(function (data) {
                    this.defaultDataMarkers = data; 
                }, APP));
            },
            
            // trigger data after loading data
            finalizeLoadData = function () {
                $(APP.companyMapCluster).trigger('load_map');
            },
                        
            // load dependencies to app
            loadDependencies = function () {
                setLisbs().then(setDefaultData).then(setMarkersData).then(finalizeLoadData);
            },
            
            createContentInfo = function (address) {
                var html = '';
                html += '<span data="hotel-address"><strong>'+address+'</strong></span><br/>';
                return html;
            },
            
            setMarkers = function (map, markers, infoWindow) {
                var libs = APP.MapClusterFactory.getLibs(),
                    bounds = new libs.map.LatLngBounds(),
                    defaultData = APP.defaultDataMapCluster.markerStyle;

                $.each(APP.defaultDataMarkers, function (index, data) {
                    var htmlInfo = APP.MapClusterFactory.createContentInfo(data.address),
                        latLng = new libs.map.LatLng(data.lat, data.lng),
                        marker = new libs.map.Marker({
                            position: latLng,
                            icon: defaultData.imgUrl
                        });

                    markers.push(marker);
                    // event window marker info
                    libs.map.event.addListener(marker, 'click', function () {
                        infoWindow.setContent(htmlInfo);
                        infoWindow.open(map, marker);
                    });
                    // center markers into map view
                    bounds.extend(latLng);
                });

                return bounds;
            },
            
            createMapCluster = function (s) {
                this.view = $(s);
                this.map = null;
                this.cluster = null;
                this.infoWindow = null;
                this.markers = [];
            };
            
            
            // tiene que estar cargado los datos recuperados por Ajax,
            // hay que lanzar un evento de finalizacion de carga
            createMapCluster.prototype.loadMapCluster = function () {
                this.clearMapCluster();
                this.createInfoWindow();
                this.crateEmptyMap();
                this.crateMapCluster();
            };
            
            
            // clear map, infowindows and marker maps
            createMapCluster.prototype.clearMapCluster = function () {
                $.each(this.markers, function (index, mk) {
                    mk.setMap(null);
                });
                this.markers.length = 0;
                !$.isEmptyObject(this.infoWindow) && this.infoWindow.close();
                !$.isEmptyObject(this.cluster) && this.cluster.clearMarkers();
            };
            
            createMapCluster.prototype.createInfoWindow = function (options) {
                var libs = APP.MapClusterFactory.getLibs(),
                    defaultData = APP.defaultDataMapCluster,
                    optionsInfoWindow = {
                        maxWidth: defaultData.maxWidth
                    };

                $.extend(optionsInfoWindow, options);
                this.infoWindow = new libs.map.InfoWindow(optionsInfoWindow);
            };
            
            // create empty map into View
            createMapCluster.prototype.crateEmptyMap = function (options) {
                var libs = APP.MapClusterFactory.getLibs(),
                    optionsMap = {
                        center: new libs.map.LatLng(APP.defaultDataMapCluster.center.lat,
                                                    APP.defaultDataMapCluster.center.lng),
                        scrollwheel: APP.defaultDataMapCluster.isScroll,
                        mapTypeId: libs.map.MapTypeId.ROADMAP
                    };

                $.extend(optionsMap, options);
                this.map = new libs.map.Map( this.view[0], optionsMap);
            };
            
            createMapCluster.prototype.crateMapCluster = function (options) {
                var libs = APP.MapClusterFactory.getLibs(),
                    bounds = APP.MapClusterFactory.setMarkers(  this.map,
                                                                this.markers,
                                                                this.infoWindow),
                    defaultData = APP.defaultDataMapCluster,
                    optionsCluster = {
                        gridSize: defaultData.gridSize,
                        maxZoom: defaultData.zoom,
                        styles: defaultData.clusterStyle
                    };

                $.extend(optionsCluster, options);
                this.map.fitBounds(bounds);
                this.cluster = new libs.Cluster(this.map, this.markers, optionsCluster);
            };
            
            
            createMapCluster.prototype.toggleMap = function () {
                this.view.toggle();
            };
            
            createMapCluster.prototype.isReady = function () {
                return  !$.isEmptyObject(this.cluster) &&
                        APP.defaultDataMarkers.length > 0;
            };
            
            createMapCluster.prototype.resizeMap = function () {
                var libs = APP.MapClusterFactory.getLibs(),
                    center = this.map.getCenter();

                libs.map.event.trigger(this.map, 'resize');
                this.map.setCenter(center);
                this.map.setZoom(APP.defaultDataMapCluster.zoom);
            };
            
            return {
                loadDependencies: loadDependencies,
                createMapCluster: createMapCluster,
                setMarkers: setMarkers,
                createContentInfo: createContentInfo,
                getLibs: getLibs
            };
        })(),
        
        domReady: function () {
            this.companyMapCluster = new this.MapClusterFactory.createMapCluster('#map-custer');
            $(this.companyMapCluster).on('load_map', this.companyMapCluster.loadMapCluster);
            // load deferred dependencies and finally load the MapCluster
            this.MapClusterFactory.loadDependencies();
        },
        
        documentReady: function () {            
            $('.js-show-map-cluster').on('click', $.proxy(function () {
                if (this.companyMapCluster.isReady()) {
                    this.companyMapCluster.toggleMap();
                    this.companyMapCluster.resizeMap();
                }
            }, this));
        }
    };

    $(document).on('ready', $.proxy(APP.domReady, APP));
    $(window).on('load', $.proxy(APP.documentReady, APP));
}(jQuery, google.maps, MarkerClusterer));