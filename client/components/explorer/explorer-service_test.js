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
 * @fileoverview Tests for the explorerService service.
 * @author joemu@google.com (Joe Allan Muharsky)
 */

goog.require('p3rf.perfkit.explorer.application.module');
goog.require('p3rf.perfkit.explorer.components.code_editor.CodeEditorMode');
goog.require('p3rf.perfkit.explorer.components.config.ConfigService');
goog.require('p3rf.perfkit.explorer.components.dashboard.DashboardService');
goog.require('p3rf.perfkit.explorer.components.explorer.ExplorerService');
goog.require('p3rf.perfkit.explorer.components.widget.WidgetFactoryService');
goog.require('p3rf.perfkit.explorer.models.ChartWidgetConfig');
goog.require('p3rf.perfkit.explorer.models.ResultsDataStatus');
goog.require('p3rf.perfkit.explorer.models.WidgetConfig');
goog.require('p3rf.perfkit.explorer.components.widget.query.builder.QueryBuilderService');


describe('explorerService', function() {
  const explorer = p3rf.perfkit.explorer;
  const ChartWidgetConfig = explorer.models.ChartWidgetConfig;
  const CodeEditorMode = explorer.components.code_editor.CodeEditorMode;
  const ConfigService = explorer.components.config.ConfigService;
  const QueryBuilderService =
      explorer.components.widget.query.builder.QueryBuilderService;
  const ResultsDataStatus = explorer.models.ResultsDataStatus;
  const WidgetConfig = explorer.models.WidgetConfig;

  var svc, configService, dashboardService, queryBuilderService,
      widgetFactoryService;

  var mockQuery = 'mock query';

  beforeEach(module('explorer'));

  beforeEach(inject(function(explorerService, _configService_, $httpBackend, $state,
      $rootScope, _containerService_, _dashboardService_, _queryBuilderService_,
      _widgetFactoryService_) {
    svc = explorerService;
    configService = _configService_;
    containerService = _containerService_;
    dashboardService = _dashboardService_;
    queryBuilderService = _queryBuilderService_;
    widgetFactoryService = _widgetFactoryService_;
    httpBackend = $httpBackend;
    rootScope = $rootScope;

    configService.populate({
      'default_project': 'TEST_PROJECT',
      'default_dataset': 'TEST_DATASET',
      'default_table': 'TEST_TABLE',
      'analytics_key': 'TEST_ANALYTICS_KEY',
      'cache_duration': 30
    });

    svc.newDashboard();

    rootScope.$apply();
  }));

  it('should initialize the appropriate objects.', function() {
    expect(svc.model).not.toBeNull();
  });

  describe('listDashboard', function() {

    it('should fetch a list of dashboards and put them in the scope.',
        function() {
          expect(svc.model.dashboards.length).toEqual(0);

          mockData = {
            'data': [
              {'title': 'foo', 'id': '1'}
            ]
          };

          var query = '/dashboard/list?mine=true';
          httpBackend.expectPOST(query).respond(mockData);

          svc.listDashboards();
          httpBackend.flush();

          expect(svc.model.dashboards.length).toEqual(
              mockData.data.length);
        }
    );

    it('should empty the list when no dashboards are returned.',
        function() {
          expect(svc.model.dashboards.length).toEqual(0);

          mockData = {
            'data': []
          };

          var query = '/dashboard/list?mine=true';
          httpBackend.expectPOST(query).respond(mockData);

          svc.listDashboards();
          httpBackend.flush();

          expect(svc.model.dashboards.length).toEqual(0);
        }
    );

    it('should empty the list when no data is returned.',
        function() {
          expect(svc.model.dashboards.length).toEqual(0);

          mockData = {};

          var query = '/dashboard/list?mine=true';
          httpBackend.expectPOST(query).respond(mockData);

          svc.listDashboards();
          httpBackend.flush();

          expect(svc.model.dashboards.length).toEqual(0);
        }
    );
  });


  describe('customizeSql', function() {

    it('should update the query and state of the selected widget\'s ' +
       'datasource.',
        function() {
          var getSqlFunction = QueryBuilderService.prototype.getSql;
          try {
            spyOn(queryBuilderService, 'getSql').and.returnValue(mockQuery);

            var boundWidget = dashboardService.selectedWidget;
            boundWidget.state().datasource.status = ResultsDataStatus.NODATA;
            dashboardService.selectedWidget = boundWidget;

            svc.customizeSql(true);

            expect(boundWidget.model.datasource.query).toEqual(mockQuery);
            expect(boundWidget.state().datasource.status).
                toEqual(ResultsDataStatus.NODATA);
          } finally {
            QueryBuilderService.prototype.getSql = getSqlFunction;
          }
        }
    );

    it('should raise an error if there is no selected widget.',
        function() {
          dashboardService.unselectWidget();
          rootScope.$apply();

          expect(function() {
            svc.customizeSql();
          }).toThrow(new Error('No selected widget.'));
        }
    );

    it('should raise an error if the selected widget doesn\'t have a ' +
       'datasource property.',
        function() {
          expect(function() {
            var widget = dashboardService.selectedWidget;
            delete widget.model.datasource;

            svc.customizeSql();
          }).toThrow(new Error(
         'Selected widget doesn\'t have a datasource property.'));
        }
    );
  });

  describe('viewSql', function() {
    var boundWidget;

    beforeEach(inject(function() {
      boundWidget = dashboardService.selectedWidget;
    }));

    it('should open the code editor to the SQL pane', function() {
      expect(svc.model.code_editor.isOpen).toEqual(false);

      spyOn(dashboardService, 'rewriteQuery');

      svc.viewSql();

      expect(dashboardService.rewriteQuery).not.toHaveBeenCalled();
      expect(svc.model.code_editor.isOpen).toEqual(true);
      expect(svc.model.code_editor.selectedMode).toEqual(CodeEditorMode.SQL)
    });

    it('should rewrite the query when rewrite is true and custom_query is false', function() {
      boundWidget.model.datasource.custom_query = false;

      spyOn(dashboardService, 'rewriteQuery');

      svc.viewSql(true);

      expect(dashboardService.rewriteQuery).toHaveBeenCalled();
    });

    it('should not rewrite the query when rewrite is true and custom_query is true', function() {
      boundWidget.model.datasource.custom_query = true;

      spyOn(dashboardService, 'rewriteQuery');

      svc.viewSql(true);

      expect(dashboardService.rewriteQuery).not.toHaveBeenCalled();
    });
  });
});
