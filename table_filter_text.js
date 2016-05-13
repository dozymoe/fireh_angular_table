'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableFilterText', [
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

            var name = $attrs.fhpName || $attrs.fhTableFilterText || '$';

            $attrs.$observe('fhpLabel', function(value) {
                $scope.label = value;
            });

            $attrs.$observe('fhpPlaceholder', function(value) {
                $scope.placeholder = value;
            });

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            var params = $scope.params;

            $scope.data = {value: ''};
            $scope.name = name;

            //// scope functions

            $scope.changeFilter = function changeFilter() {
                params.trigger('setSingleValueFilter', name, $scope.data.value);
            };

            //// events

            var displayEvents = {};

            displayEvents.filterUpdated = function(event, filterName,
                    filterValue) {

                if (filterName === name) { $scope.data.value = filterValue }
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
                '<div class="input-group fh-table-filter-text" ng-if="label"> ' +
                '  <span class="form-label">{{ label }}</span> ' +
                '  <input type="text" class="form-control" ' +
                '      name="{{ name }}" ' +
                '      placeholder="{{ placeholder }}" ' +
                '      ng-change="changeFilter()" ' +
                '      ng-click="$event.stopPropagation()" ' +
                '      ng-model="data.value" ' +
                '      ng-model-options="{ debounce: { default: 500 } }"> ' +

                '</div> ' +
                '<input type="text" class="form-control" ' +
                '    name="{{ name }}" ' +
                '    placeholder="{{ placeholder }}" ' +
                '    ng-change="changeFilter()" ' +
                '    ng-click="$event.stopPropagation()" ' +
                '    ng-if="!label" ' +
                '    ng-model="data.value" ' +
                '    ng-model-options="{ debounce: { default: 500 } }"> ';

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
