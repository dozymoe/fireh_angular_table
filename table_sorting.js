'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableSorting', [
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
            //// element attributes

            var name = $attrs.fhpName || $attrs.fhTableSorting;
            var elementId = ElementIdMixin($attrs, 'fh-table-sorting-');

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            var fhtable = $scope.fhtable;

            $scope.priority = 0;
            $scope.direction = null;
            $scope.elementId = elementId;

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                }
            }

            $scope.sortAsc = function tableSortAscending(event) {
                fhtable.trigger('setOrder', name, {direction: 'asc'},
                        getEventOptions());
            };

            $scope.sortDesc = function tableSortDescending(event) {
                fhtable.trigger('setOrder', name, {direction: 'desc'},
                        getEventOptions());
            };

            $scope.sortBefore = function tableSortBefore(event) {
                if ($scope.priority > 1) {
                    fhtable.trigger(
                        'setOrder',
                        name,
                        {
                            priority: $scope.priority - 1
                        },
                        getEventOptions());
                }
            };

            $scope.sortAfter = function tableSortAfter(event) {
                fhtable.trigger(
                    'setOrder',
                    name,
                    {
                        priority: $scope.priority + 1
                    },
                    getEventOptions());
            };

            $scope.sortClear = function tableSortClear(event) {
                if ($scope.priority) {
                    fhtable.trigger('setOrder', name, null, getEventOptions());
                }
            };

            //// events

            var displayEvents = {};

            displayEvents.orderUpdated = function orderUpdated(event,
                    sortingName, sortingValue) {

                if (sortingName !== name) {
                    return;
                } else if (sortingValue) {
                    $scope.direction = sortingValue.direction;
                    $scope.priority = sortingValue.priority;
                } else {
                    $scope.direction = null;
                    $scope.priority = 0;
                }
            };

            CustomEventHandlersMixin(displayEvents, $attrs, fhtable);
            MiddlewaresMixin(displayEvents, $attrs, fhtable, true);

            EventHandlersMixin(
                displayEvents,
                {
                    scope: $scope,
                    fhtable: fhtable,
                    optionsGetter: getEventOptions
                });
        };

        myDirective.link = function(scope, el, attrs) {
            //// element attributes
            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<div class="dropdown fh-table-sorting"> ' +
                '  <div data-fh-transclude-pane="header"></div> ' +

                '  <button class="btn btn-default dropdown-toggle" ' +
                '      type="button" id="{{ elementId }}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      aria-expanded="false" title="{{ \'Sorting\' }}" ' +
                '      ng-class="{active: priority}"> ' +

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

                '  <div data-fh-transclude-pane="footer"></div> ' +

                '  <ul class="dropdown-menu"> ' +
                '    <li ng-class="{disabled: direction === \'asc\'}"> ' +
                '      <a href="#" ng-click="sortAsc($event); ' +
                           '$event.preventDefault()"> ' +

                '        {{ \'Sort ascending\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li ng-class="{disabled: direction === \'desc\'}"> ' +
                '      <a href="#" ng-click="sortDesc($event); ' +
                           '$event.preventDefault()"> ' +

                '        {{ \'Sort descending\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li role="separator" class="divider"></li> ' +
                '    <li ng-class="{disabled: priority <= 1}"> ' +
                '      <a href="#" ng-click="sortBefore($event); ' +
                           '$event.preventDefault()"> ' +

                '        {{ \'Increase priority\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li ng-class="{disabled: !priority}"> ' +
                '      <a href="#" ng-click="sortAfter($event); ' +
                           '$event.preventDefault()"> ' +

                '        {{ \'Decrease priority\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '    <li role="separator" class="divider"></li> ' +
                '    <li  ng-class="{disabled: !priority}"> ' +
                '      <a href="#" ng-click="sortClear($event); ' +
                           '$event.preventDefault()"> ' +

                '        {{ \'Clear\' }} ' +
                '      </a> ' +
                '    </li> ' +
                '  </ul> ' +
                '</div>';

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
