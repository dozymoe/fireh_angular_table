'use strict';

require('./core_mixins');

angular.module('fireh_angular_table')

    .directive('fhTableFilterText', ['$compile', '$templateRequest',
            'FhTableDefinitionMixin',
            function($compile, $templateRequest, TableDefinitionMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            var label = $attrs.label;
            var name = $attrs.name || $attrs.fhTableFilterText || '$';
            var placeholder = $attrs.placeholder;

            TableDefinitionMixin($scope, $attrs);
            var params = $scope.params;

            $scope.data = {value: ''};
            $scope.label = label;
            $scope.name = name;
            $scope.placeholder = placeholder;

            $scope.changeFilter = function changeFilter() {
                params.trigger('setSingleValueFilter', name, $scope.data.value);
            };

            params.on('filterUpdated', function(event, filterName, filterValue) {
                if (filterName === name) {
                    $scope.data.value = filterValue;
                }
            });
        };

        myDirective.link = function(scope, el, attrs) {
            var templateUrl = attrs.templateUrl;

            var templateHtml =
                '<div class="input-group fh-table-filter-text" ng-if="label"> ' +
                '  <span class="form-label">{{ label }}</span> ' +
                '  <input type="text" class="form-control" ' +
                '      name="{{ name }}" ' +
                '      placeholder="{{ placeholder }}" ' +
                '      ng-change="changeFilter()" ' +
                '      ng-click="$event.stopPropagation()" ' +
                '      ng-model="data.value" ' +
                '      ng-model-options="{ debounce: { default: 500 } }"/> ' +

                '</div> ' +
                '<input type="text" class="form-control" ' +
                '    name="{{ name }}" ' +
                '    placeholder="{{ placeholder }}" ' +
                '    ng-change="changeFilter()" ' +
                '    ng-click="$event.stopPropagation()" ' +
                '    ng-if="!label" ' +
                '    ng-model="data.value" ' +
                '    ng-model-options="{ debounce: { default: 500 } }"/> ';

            function printHtml(htmlStr) {
                el.html(htmlStr).show();
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
