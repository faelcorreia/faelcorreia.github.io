"use strict";angular.module("random-spoilers",["ngResource","ngAnimate","ui.router"]).config(["$stateProvider","$urlRouterProvider",function(t,e){t.state("app",{url:"/app",templateUrl:"views/app.html",controller:"AppCtrl","abstract":!0}).state("app.main",{url:"/main",templateUrl:"views/main.html",controller:"MainCtrl",data:{title:"Random Spoilers"}}),e.otherwise("/app/main")}]).controller("AppCtrl",["$scope",function(t){}]).controller("MainCtrl",["$scope","Spoilers","OMDb","$timeout",function(t,e,r,o){t.agreed=!1,t.generateSpoiler=function(){t.ready=!1,o(function(){t.index=Math.floor(Math.random()*n.length);var e=r.get({i:t.spoilers[t.index].imdb},function(){t.movie=e,t.ready=!0})},1e3)},t["continue"]=function(){t.agreed=!0,t.generateSpoiler()};var n=e.query(function(){t.spoilers=n})}]).directive("title",["$rootScope","$timeout",function(t,e){return{link:function(){var r=function(r,o){e(function(){t.title=o.data&&o.data.title?o.data.title:"Title"})};t.$on("$stateChangeSuccess",r)}}}]).factory("OMDb",["$resource",function(t){return t("http://www.omdbapi.com")}]).factory("Spoilers",["$resource",function(t){return t("/json/spoilers.json")}]);