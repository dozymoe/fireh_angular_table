'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableFilterText', [
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

            var name = $attrs.fhpName || $attrs.fhTableFilterText || '*';
            var elementId = ElementIdMixin($attrs, 'fh-table-filter-text-');

            $attrs.$observe('fhpPlaceholder', function(value) {
                $scope.placeholder = value;
            });

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            var fhtable = $scope.fhtable;

            $scope.name = name;
            $scope.value = '';
            $scope.elementId = elementId;

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                }
            }

            $scope.changeFilter = function changeFilter() {
                fhtable.trigger('setSingleValueFilter', name, $scope.value,
                        getEventOptions());
            };

            //// events

            var displayEvents = {};

            displayEvents.filterUpdated = function(event, filterName,
                    filterValue) {

                if (filterName === name) { $scope.value = filterValue }
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
                '<div data-fh-transclude-pane="header"></div> ' +

                '<input type="text" class="form-control" id="{{ elementId }}"' +
                '    name="{{ name }}" ' +
                '    placeholder="{{ placeholder }}" ' +
                '    data-ng-model="value" ' +
                '    data-ng-change="changeFilter()"> ' +

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
