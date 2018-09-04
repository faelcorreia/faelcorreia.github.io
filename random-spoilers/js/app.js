'use strict';

angular.module('random-spoilers', [
    'ngResource',
    'ngAnimate',
    'ui.router'
])

.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider

            .state('app', {
            url: '/app',
            templateUrl: 'views/app.html',
            controller: 'AppCtrl',
            abstract: true
        })

        .state('app.main', {
            url: '/main',
            templateUrl: 'views/main.html',
            controller: 'MainCtrl',
            data: {
                title: 'Random Spoilers'
            }
        })

        $urlRouterProvider.otherwise('/app/main')
    }
])

.controller('AppCtrl', ['$scope',
    function($scope) {

    }
])

.controller('MainCtrl', ['$scope', 'Spoilers', '$timeout',
	function($scope, Spoilers, $timeout) {
		$scope.agreed = false
		var smartList = []
		$scope.generateSpoiler = function() {
			$scope.ready = false
			$timeout(function() {
				if (smartList.length == 0) {
					generateSmartList($scope.spoilers.length)
				}
				var index = Math.floor(Math.random() * smartList.length)
				$scope.index = smartList[index]
				smartList.splice(index, 1)				
				$scope.ready = true
			}, 1000)
		}

		$scope.continue = function() {
			$scope.agreed = true
			$scope.generateSpoiler()
		}

		var generateSmartList = function(size) {
			for (var i = 0; i < size; i++) {
				smartList[i] = i
			}
		}

		var spoilers = Spoilers.query(function() {
			$scope.spoilers = spoilers
		})
	}
])

.factory('Spoilers', ['$resource',
	function($resource) {
		return $resource('json/spoilers.json')
	}
])