(function() {
'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTablePagerSize', [
        '$compile',
        '$templateRequest',
        'FhTableDefinitionMixin',
        'FhTranscludeChildElementsMixin',
        'FhCustomEventHandlersMixin',
        'FhMiddlewaresMixin',
        'FhEventHandlersMixin',
        'FhElementIdMixin',
        function(
            $compile,
            $templateRequest,
            TableDefinitionMixin,
            TranscludeChildElementsMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin,
            ElementIdMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            var cleanupCallbacks = [];

            //// element attributes

            var pagerSize = $attrs.fhpDefaultPagerSize;
            var pagerSizes = $attrs.fhpPagerSizes;
            var elementId = ElementIdMixin($attrs, 'fh-table-pager-size-');

            TableDefinitionMixin($scope, $attrs, 'fhTablePagerSize');

            //// scope variables

            var fhtable = $scope.fhtable;

            if (pagerSize) { pagerSize = parseInt(pagerSize.trim()); }
            if (pagerSizes) {
                pagerSizes = _.transform(
                    pagerSizes.trim().split(/\s*,\s*/),
                    function(result, value) { result.push(parseInt(value)); },
                    []);
            } else {
                pagerSizes = [5, 10, 20, 50, 100];
            }

            $scope.pageSize = pagerSize || fhtable.items.pageSize;
            $scope.pageSizes = pagerSizes;
            $scope.elementId = elementId;

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            $scope.select = function select() {
                fhtable.trigger('setPageSize', $scope.pageSize,
                        getEventOptions());
            };

            if (pagerSize) { $scope.select(); }

            //// events

            var displayEvents = {};

            displayEvents.pageSizeUpdated = function pageSizeUpdated(event,
                    pageSize) {

                $scope.pageSize = pageSize;
            };

            CustomEventHandlersMixin(displayEvents, $attrs, fhtable);
            MiddlewaresMixin(displayEvents, $attrs, fhtable, true);

            EventHandlersMixin(
                displayEvents,
                {
                    scope: $scope,
                    fhtable: fhtable,
                    optionsGetter: getEventOptions
                },
                cleanupCallbacks);

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
            });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            //// element attributes

            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<div data-fh-transclude-pane="header"></div> ' +

                '<select id="{{ elementId }}" ' +
                '  data-ng-options="row for row in pageSizes track by row" ' +
                '  data-ng-model="pageSize" ' +
                '  data-ng-change="select()"></select> ' +

                '<div data-fh-transclude-pane="footer"></div>';

            function printHtml(htmlStr) {
                // get directive content and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    TranscludeChildElementsMixin(el, clone);
                    $compile(el.contents())(scope);
                });
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
}());
