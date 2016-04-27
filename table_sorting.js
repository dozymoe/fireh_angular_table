'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableSorting', ['$compile', '$templateRequest',
            'FhTableDefinitionMixin',
            function($compile, $templateRequest, TableDefinitionMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            var name = $attrs.name || $attrs.fhTableSorting;

            TableDefinitionMixin($scope, $attrs);
            var params = $scope.params;

            $scope.priority = 0;
            $scope.direction = null;

            $scope.sortAsc = function tableSortAscending(event) {
                event.preventDefault();
                params.trigger('setOrder', name, {direction: 'asc'});
            };

            $scope.sortDesc = function tableSortDescending(event) {
                event.preventDefault();
                params.trigger('setOrder', name, {direction: 'desc'});
            };

            $scope.sortBefore = function tableSortBefore(event) {
                event.preventDefault();
                if ($scope.priority > 1) {
                    params.trigger('setOrder', name,
                            {priority: $scope.priority - 1});
                }
            };

            $scope.sortAfter = function tableSortAfter(event) {
                event.preventDefault();
                params.trigger('setOrder', name,
                        {priority: $scope.priority + 1});
            };

            $scope.sortClear = function tableSortClear(event) {
                event.preventDefault();
                if ($scope.priority) {
                    params.trigger('setOrder', name, null);
                }
            };

            params.on('orderUpdated', function orderUpdated(event, sortingName,
                        sortingValue) {

                if (sortingName !== name) {
                    return;
                } else if (sortingValue) {
                    $scope.direction = sortingValue.direction;
                    $scope.priority = sortingValue.priority;
                } else {
                    $scope.direction = null;
                    $scope.priority = 0;
                }
            });
        };

        myDirective.link = function(scope, el, attrs) {
            var templateUrl = attrs.templateUrl;

            var templateHtml =
                '<div class="dropdown fh-table-sorting"> ' +
                '  <button type="button" class="dropdown-toggle" ' +
                '      ng-class="{active: priority}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      title="{{ \'Sorting\' }}"> ' +

                '    <span class="fa fa-sort" ng-if="!priority"></span> ' +
                '    <span class="fa fa-sort-asc" ' +
                '        aria-label="{{ \'ascending\' }}" ' +
                '        ng-if="priority && direction === \'asc\'"></span> ' +

                '    <span class="fa fa-sort-desc" ' +
                '        aria-label="{{ \'descending\' }}" ' +
                '        ng-if="priority && direction === \'desc\'"></span> ' +

                '    <span class="sort-priority" ' +
                '        ng-if="priority">{{ priority }}</span> ' +

                '  </button> ' +
                '  <ul class="dropdown-menu"> ' +
                '    <li ng-class="{disabled: direction === \'asc\'}"> ' +
                '      <a href="#" ng-click="sortAsc($event)"> ' +
                '        {{ \'Sort ascending\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li ng-class="{disabled: direction === \'desc\'}"> ' +
                '      <a href="#" ng-click="sortDesc($event)"> ' +
                '        {{ \'Sort descending\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li role="separator" class="divider"/> ' +
                '    <li ng-class="{disabled: priority <= 1}"> ' +
                '      <a href="#" ng-click="sortBefore($event)"> ' +
                '        {{ \'Increase priority\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li ng-class="{disabled: !priority}"> ' +
                '      <a href="#" ng-click="sortAfter($event)"> ' +
                '        {{ \'Decrease priority\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li role="separator" class="divider"/> ' +
                '    <li  ng-class="{disabled: !priority}"> ' +
                '      <a href="#" ng-click="sortClear($event)"> ' +
                '        {{ \'Clear\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '  </ul> ' +
                '</div> ';

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
