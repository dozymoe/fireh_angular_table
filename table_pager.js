(function() {
'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTablePager', [
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
            var cleanupCallbacks = [];

            //// element attributes

            var pagerLinksCount = $attrs.fhpPagerLinksCount;

            TableDefinitionMixin($scope, $attrs, 'fhTablePager');

            //// scope variables

            var fhtable = $scope.fhtable;

            $scope.pager = {
                pageOffset: fhtable.items.page,
                pageSize: fhtable.items.pageSize,

                itemsTotal: 0,

                links: [],
                linksCount: 5,

                firstLinkOffset: 1,
                lastLinkOffset: 1,
                prevLinkOffset: 1,
                nextLinkOffset: 1,

                isEnabled: false,
                isFirstLinkEnabled: false,
                isLastLinkEnabled: false,
                isPrevLinkEnabled: false,
                isNextLinkEnabled: false
            };

            if (pagerLinksCount) {
                $scope.pager.linksCount = parseInt(pagerLinksCount);
            }

            function calculate() {
                var totalLinks = Math.ceil($scope.pager.itemsTotal /
                        $scope.pager.pageSize);

                var totalLinkClusters = Math.ceil(totalLinks /
                        $scope.pager.linksCount);

                $scope.pager.lastLinkOffset = totalLinks;
                $scope.pager.isEnabled = $scope.pager.itemsTotal >
                        $scope.pager.pageSize;

                var pageOffset = $scope.pager.pageOffset - 1;

                $scope.pager.isFirstLinkEnabled = pageOffset > 0;
                $scope.pager.isLastLinkEnabled = totalLinks - 1 > pageOffset;

                var clusterOffset = Math.floor(pageOffset /
                        $scope.pager.linksCount);

                $scope.pager.isPrevLinkEnabled = clusterOffset > 0;
                if ($scope.pager.isPrevLinkEnabled) {
                    $scope.pager.prevLinkOffset = clusterOffset *
                            $scope.pager.linksCount;
                } else {
                    $scope.pager.prevLinkOffset = pageOffset + 1;
                }

                $scope.pager.isNextLinkEnabled = totalLinkClusters - 1 >
                        clusterOffset;

                if ($scope.pager.isNextLinkEnabled) {
                    $scope.pager.nextLinkOffset = (clusterOffset + 1) *
                            $scope.pager.linksCount;
                } else {
                    $scope.pager.nextLinkOffset = pageOffset + 1;
                }

                $scope.pager.links.splice(0);
                for (var ii = clusterOffset * $scope.pager.linksCount;
                        ii < totalLinks && ii < (clusterOffset + 1) *
                        $scope.pager.linksCount; ii ++) {

                    $scope.pager.links.push({
                        pageOffset: ii + 1,
                        isEnabled: ii !== pageOffset
                    });
                }
            }

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            $scope.select = function select(pageOffset) {
                fhtable.trigger('setPageOffset', pageOffset, getEventOptions());
            };

            //// events

            var displayEvents = {};

            displayEvents.pageOffsetUpdated = function(event, pageOffset) {
                if ($scope.pager.pageOffset === pageOffset) { return; }
                $scope.pager.pageOffset = pageOffset;
                calculate();
            };

            displayEvents.pageSizeUpdated = function(event, pageSize) {
                if ($scope.pager.pageSize === pageSize) { return; }
                $scope.pager.pageSize = pageSize;
                calculate();
            };

            displayEvents.itemsTotalUpdated = function(event, totalItems) {
                if ($scope.pager.itemsTotal === totalItems) { return; }
                $scope.pager.itemsTotal = totalItems;
                calculate();
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

        myDirective.link = function(scope, el, attrs) {
            //// element attributes

            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<ul data-ng-show="pager.isEnabled" ' +
                '    class="pagination pagination-sm"> ' +

                '  <li data-ng-class="{ ' +
                       '\'disabled\': !pager.isFirstLinkEnabled }"> ' +

                '    <a ng-click="select(pager.firstLinkOffset)">First</a> ' +
                '  </li> ' +
                '  <li data-ng-class="{ ' +
                       '\'disabled\': !pager.isPrevLinkEnabled }"> ' +

                '    <a ng-click="select(pager.prevLinkOffset)">Previous</a> ' +
                '  </li> ' +
                '  <li ng-repeat="row in pager.links" data-ng-class="{ ' +
                       '\'active\': row.pageOffset === pager.pageOffset, ' +
                       '\'disabled\': !row.isEnabled }"> ' +

                '    <a ng-click="select(row.pageOffset)"> ' +
                '      {{row.pageOffset}} ' +
                '    </a> ' +
                '  </li> ' +
                '  <li data-ng-class="{ ' +
                       '\'disabled\': !pager.isNextLinkEnabled }"> ' +

                '    <a ng-click="select(pager.nextLinkOffset)">Next</a> ' +
                '  </li> ' +
                '  <li data-ng-class="{ ' +
                       '\'disabled\': !pager.isLastLinkEnabled }"> ' +

                '    <a ng-click="select(pager.lastLinkOffset)">Last</a> ' +
                '  </li> ' +
                '</ul>';

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
}());
