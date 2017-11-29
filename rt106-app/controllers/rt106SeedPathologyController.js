// Copyright (c) General Electric Company, 2017.  All rights reserved.

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['angular', '../module'], factory);
    } else {
        // Browser globals
        root.rt106SeedPathologyController = factory(angular, angular.module('rt106'));
    }
}(this, function(angular, mod) {

    'use strict';

    mod.controller('rt106SeedPathologyController', ['$scope', '$http', '$location', '$log','cohortFactory', 'pathologyService', 'analyticsFactory', 'dynamicDisplayService', 'executionService', 'alarmService', 'utilityFns', 'Rt106_SERVER_URL', function($scope, $http, $location, $log, cohortFactory, pathologyService, analyticsFactory, dynamicDisplayService, executionService, alarmService, utilityFns, Rt106_SERVER_URL) {

        /*
         * $scope variables
         */
        $scope.slides = [];
        $scope.regions=[];
        $scope.channels=[];
        $scope.selectedSlide="";
        $scope.selectedRegion="";
        $scope.selectedChannel="";
        $scope.imageLayout = "1,1";

        //$scope.currentPipeline = "DefaultPipeline";
        $scope.pipelines = ["pipeline1", "pipeline2", "pipeline3"];
        $scope.newPipelineName = "";
        $scope.forceOverwrite = false;
        $scope.algorithms     = [];
        $scope.algorithmsSegmentation = [];
        $scope.algorithmsQuantitation = [];
        $scope.selectedAlgo   = [];
        $scope.selectedParameters = [];
        $scope.executionList  = [];

        /*
         * Initialization.
         */

        // Navigate among slide, region, and channel data.
        function initSlides() {
            console.log("Calling initSlides()");
            //$scope.slides = pathologyService.getSlideList();
            pathologyService.getSlideList()
                .then(function(slides) {
                    $scope.slides = slides;
                }).catch(function(error) {
                    console.error("Error returned from slides promise: " + error);
            });
            if ($scope.slides == "not ready") {
                console.log("Slide list not ready, will try again in 1 second.")
                setTimeout(initSlides, 1000);
            }
        }
        initSlides();

        function getRegions(slide) {
            pathologyService.getRegionList(slide)
                .then(function(regions) {
                    $scope.regions = regions;
                }).catch(function(error) {
                    console.error("Error returned from regions promise: " + error);
            });
            console.log("In getRegions, slide " + $scope.selectedSlide + " the regions are " + $scope.regions);
            if ($scope.regions == "not ready") {
                console.log("Region list not ready, will try again in 1 second.")
                setTimeout(function() {
                    getRegions(slide);
                }, 1000);
            }
        }

        function getChannels(slide,region) {
            pathologyService.getChannelList(slide,region)
                .then(function(channels) {
                    $scope.channels = channels;
                }).catch(function(error) {
                console.error("Error returned from channels promise: " + error);
            });
            if ($scope.channels == "not ready") {
                console.log("Channel list not ready, will try again in 1 second.")
                setTimeout(function() {
                    getChannels(slide,region);
                }, 1000);
            }
        }

        // Set up for running algorithms.
        executionService.initExecution();

        // Initialize the list of algorithms and scan periodically for changes in the list.
        var scanForAnalytics = function() {
            console.log("scanForAnalytics()");
            analyticsFactory.getAnalytics().then(function(analytics) {
                utilityFns.mergeAnalyticsLists($scope.algorithms, analytics, $scope.selectedAlgo);
                // Idenfity the algorithms that are for pathology.
                $scope.algorithmsSegmentation = [];
                $scope.algorithmsQuantitation = [];
                $scope.algorithmsHeterogeneity = [];
                for (var i=0; i < $scope.algorithms.length; i++) {
                    var classLevels = $scope.algorithms[i].classification.split('/');
                    if (classLevels[1] == "cell") {
                        if (classLevels[0] == "segmentation") {
                            $scope.algorithmsSegmentation.push($scope.algorithms[i]);
                        } else if (classLevels[0] == "quantification") {
                            $scope.algorithmsQuantitation.push($scope.algorithms[i]);
                        } else if (classLevels[0] == "heterogeneity") {
                            $scope.algorithmsHeterogeneity.push($scope.algorithms[i]);
                        }
                    }
                }
                utilityFns.updateScroll($scope);
                setTimeout(scanForAnalytics, 5000);
            });
        }
        setTimeout(scanForAnalytics, 1000);

        // Start polling for execution results.
        function pollExecList() {
            executionService.pollExecList($scope.executionList, $scope).then(function () {
                setTimeout(pollExecList, 1000);
            });
        }
        setTimeout(pollExecList, 1000);

        // Periodically make sure that scrollbars are in the right state.
        setInterval(function() { utilityFns.updateScroll($scope); }, 1000);

        /*
         * Handlers for user actions in the user interface.
         */

        // A slide is clicked.
        $scope.clickSlide = function () {
            getRegions($scope.selectedSlide);
            //$scope.displayImage();
        }

        // A region is clicked.
        $scope.clickRegion = function () {
            getChannels($scope.selectedSlide,$scope.selectedRegion);
            $scope.displayImage();
        }

        // A channel is clicked.
        $scope.clickChannel = function () {
            $scope.displayImage();
        }

        $scope.updatePipelineList = function() {
            // Check that selectedSlide and selectedRegion are not "".
            if ($scope.selectedSlide != "" && $scope.selectedRegion != "") {
                // Get the list of pipelines for this slide and region.
                var querystring = Rt106_SERVER_URL + '/v1/datastore/pathology/slides/' + $scope.selectedSlide + '/regions/' + $scope.selectedRegion + '/results';
                $http.get(querystring)
                    .then(function (results) {
                        console.log("Returned pipelineid's: " + JSON.stringify(results));
                        $scope.pipelines = results.data;
                        // Remove 'Source' from the list, which is not actually a pipeline.
                        var sourceid = $scope.pipelines.indexOf('Source');
                        if (sourceid > -1) {
                            $scope.pipelines.splice(sourceid, 1);
                        }
                    }, function(err) {
                        var errorstring = querystring + ' returned an error.' + err.data;
                        $log.error(errorstring);
                        alarmService.displayAlert('Error getting pipelineids for ' + querystring);
                    });


            }
        }

        $scope.clickPipeline = function () {
            //$scope.currentPipeline = $scope.selectedPipeline;

        }

        $scope.newPipelineID = function() {
            // If new name is not an empty string.
            if ($scope.newPipelineName !== "") {
                // If new name is not already in the list of pipeline names.
                if ($scope.pipelines.indexOf($scope.newPipelineName) == -1) {
                    $scope.pipelines.push($scope.newPipelineName);
                }
            }
        }

        // An algorithm is clicked.
        $scope.clickPathologyAlgo = function(algo, highlightAlgos, algoCategory, algoSubIndex) {
            utilityFns.updateScroll($scope);
            if (highlightAlgos[algoCategory][algoSubIndex]) {
                $scope.selectedAlgo = algo.name;
                var algoIndex = utilityFns.getObjectIndexByValue($scope.algorithms, 'name', algo.name);
                $scope.selectedParameters = $scope.algorithms[algoIndex].parameters;
                // Unhighlight any other selected algorithms.
                for (var cat=0; cat<3; cat++) {  // 3 algorithm categories: segmentation, quantitation, heterogeneity
                    for (var subAlg in highlightAlgos[cat]) {
                        if (cat != algoCategory || subAlg != algoSubIndex) {
                            highlightAlgos[cat][subAlg] = false;
                        }
                    }
                }
            } else { // !expandAlgo
                $scope.selectedAlgo = "";
                $scope.selectedParameters = [];
            }
        }

        // The Execute button is clicked.
        $scope.requestAlgoRun = function() {
            executionService.autofillPathologyParameters($scope.selectedParameters, $scope.selectedSlide, $scope.selectedRegion, $scope.selectedChannel, $scope.selectedPipeline, $scope.forceOverwrite);
            executionService.requestAlgoRun($scope.selectedParameters, $scope.selectedAlgo);
        }

        // A result (item in the execution history) is clicked.
        $scope.clickResult = function(execItem, expandResult) {
            utilityFns.updateScroll($scope);
            if (expandResult) {
                $scope.selectedExecution = execItem;
                // Get the analytic's ID in $scope.algorithms.
                var index = utilityFns.getObjectIndexByValue($scope.algorithms, 'name', execItem.analyticName);
                // Get the display structure for that analytic.
                var displayStruct = $scope.algorithms[index].display;
                // Grid-shape of the display structure is within displayStruct
                $scope.imageLayout = dynamicDisplayService.displayResult(execItem, displayStruct, $scope.detections);
            }
        }


        /*
         * Image display.
         */
        $scope.displayImage = function() {
            if ($scope.selectedSlide == "") {
                console.log("Can't display, no slide selected.");
            } else if ($scope.selectedRegion == "") {
                console.log("Can't display, no region selected.");
            } else if ($scope.selectedChannel == "") {
                console.log("Can't display, no channel selected.");
            } else {
                // Get the path for the image to display.
                console.log("Calling pathologyService.getPrimaryImagePath with " + $scope.selectedSlide + ", " +
                    $scope.selectedRegion + ", " + $scope.selectedChannel);
                pathologyService.getPrimaryImagePath( $scope.selectedSlide, $scope.selectedRegion, $scope.selectedChannel )
                    .then(function(accessString) {
                        //var accessString = $scope.selectedSlide + "/" + $scope.selectedRegion + "/source/" + $scope.selectedChannel;
                        console.log("$scope.displayImage, path returned from promise is " + accessString);
                        $scope.imageLayout = dynamicDisplayService.setDisplayShape("1,1");
                        var imageFormat = "tiff16:";
                        imageViewers.clearStackElements(imageViewers.stackViewers[0]);
                        dynamicDisplayService.displayInCell(imageFormat, accessString, {}, 0, 0, $scope.imageLayout, 'rgb(255,255,255)', 1.0, "");
                    }).catch(function(error){
                        console.error("Error returned from promise: " + error);
                        // display alarm.
                    });
                console.log("$scope.displayImage, after call to pathologyService.getPrimaryImagePath()");
            }
        }

    }]);
}));
