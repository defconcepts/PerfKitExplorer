/**
 * @copyright Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview DashboarDirective encapsulates HTML, style and behavior
 *     for displaying a dashboard.
 * @author joemu@google.com (Joe Allan Muharsky)
 */

goog.provide('p3rf.perfkit.explorer.components.dashboard.DashboardDirective');

goog.require('p3rf.perfkit.explorer.components.dashboard.DashboardService');


goog.scope(function() {
const explorer = p3rf.perfkit.explorer;
const DashboardService = explorer.components.dashboard.DashboardService;


/**
 * See module docstring for more information about purpose and usage.
 *
 * @return {Object} Directive definition object.
 * @ngInject
 */
explorer.components.dashboard.DashboardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    scope: {
      'ngModel': '='
    },
    templateUrl: '/static/components/dashboard/dashboard-directive.html',
    controller: [
        '$scope', 'explorerService', 'dashboardService', 'containerService', 'sidebarTabService',
        function($scope, explorerService, dashboardService, containerService, sidebarTabService) {
      /** @export */
      $scope.containerSvc = containerService;

      /** @export */
      $scope.dashboardSvc = dashboardService;

      /** @export */
      $scope.explorerSvc = explorerService;

      /** @export */
      $scope.clickRefreshWidget = function(event, widget) {
        dashboardService.refreshWidget(widget);
        event.stopPropagation();
      }

      /** @export */
      $scope.clickContainer = function(event, container) {
        dashboardService.selectWidget(null, container);
        event.stopPropagation();

        if (!sidebarTabService.selectedTab) {
          sidebarTabService.selectTab(sidebarTabService.getFirstContainerTab());
        }
      }

      /** @export */
      $scope.clickWidget = function(event, widget, container) {
        dashboardService.selectWidget(widget, container);
        event.stopPropagation();

        if (!sidebarTabService.selectedTab) {
          sidebarTabService.selectTab(sidebarTabService.getFirstWidgetTab());
        }
      }
    }]
  };
};

});  // goog.scope
