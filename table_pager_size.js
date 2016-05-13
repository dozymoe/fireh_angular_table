'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTablePagerSize', [
        '$compile',
        '$templateRequest',
        'FhTableDefinitionMixin',
        'FhCustomEventHandlersMixin',
        'FhMiddlewaresMixin',
        'FhEventHandlersMixin',
        function(
            $compile,
            $templateRequest,
            TableDefinitionMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            //// element attributes

            var pagerSize = $attrs.fhpDefaultPagerSize;
            var pagerSizes = $attrs.fhpPagerSizes;

            TableDefinitionMixin($scope, $attrs, 'fhTablePagerSize');

            //// scope variables

            var params = $scope.params;

            if (pagerSize) {
                pagerSize = pagerSize.trim();
                params.trigger('setPageSize', parseInt(pagerSize));
            }

            if (pagerSizes) {
                pagerSizes = pagerSizes.trim().split(/\s*,\s*/)
            } else {
                pagerSizes = [5, 10, 20, 50, 100];
            }

            $scope.pageSize = pagerSize;
            $scope.pageSizes = pagerSizes;

            //// scope functions

            $scope.select = function select() {
                params.trigger('setPageSize', parseInt($scope.pageSize));
            };

            //// events

            var displayEvents = {};

            displayEvents.pageSizeUpdated = function pageSizeUpdated(event,
                        pageSize) {

                $scope.pageSize = pageSize.toString();
            };

            CustomEventHandlersMixin(displayEvents, $attrs, params);
            MiddlewaresMixin(displayEvents, $attrs, params, true);

            EventHandlersMixin(
                displayEvents,
                {
                    scope: $scope,
                    params: params,
                });
        };

        myDirective.link = function(scope, el, attrs) {
            //// element attributes

            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<select data-ng-options="row for row in pageSizes track by row" ' +
                '  data-ng-model="pageSize" ' +
                '  data-ng-change="select()"></select>';

            function printHtml(htmlStr) {
                el.html(htmlStr);
                $compile(el.contents())(scope);
            }

            if (templateUrl) {
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }
        };

        return myDirective;
    }])
;
