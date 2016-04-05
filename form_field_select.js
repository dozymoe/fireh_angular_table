'use strict';

require('./core_mixins');
require('./table_filter_text');

angular.module('fireh_angular_table')

    .directive('fhFormFieldSelect', ['$compile', '$templateRequest',
            'FhTableDefinition', 'FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin',
            function($compile, $templateRequest, TableDefinition,
            TableDefinitionMixin, ListResourceControllerMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            // dropdownLabel, filterPlaceholder and label are observed in the
            // middle of this function
            var filterName = $attrs.filterName;
            var pageSize = $attrs.size;
            var orderBy = $attrs.orderBy;
            var orderDir = $attrs.orderDir || 'asc';

            TableDefinitionMixin($scope, $attrs, 'fhFormFieldSelect');
            var params = $scope.params;

            $scope.dropdownLabel = 'Select';
            $scope.filterName = filterName;

            $attrs.$observe('dropdownLabel', function(value) {
                $scope.dropdownLabel = value;
            });
            $attrs.$observe('filterPlaceholder', function(value) {
                $scope.filterPlaceholder = value;
            });
            $attrs.$observe('label', function(value) {
                $scope.label = value;
            });

            ListResourceControllerMixin(
                $scope,
                {
                    multipleSelection: false
                });

            if (pageSize) { $scope.dataParams.pageSize = pageSize }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]] }
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            var templateUrl = attrs.templateUrl;

            var templateHtml =
                '<div class="dropdown fh-table-filter-select"> ' +
                '  <span class="form-label" ng-if="label">{{ label }}</span> ' +
                '  <button class="btn btn-default dropdown-toggle" ' +
                '      type="button" id="{{ elementId }}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      aria-expanded="false"> ' +

                '    <span>{{ dropdownLabel }}</span> ' +
                '    <span ng-if="!data.selectedItems.length" ' +
                '        class="fa fa-caret-down"/> ' +

                '    <span ng-if="data.selectedItems.length" ' +
                '        class="fa fa-caret-square-o-down"/> ' +

                '  </button> ' +
                '  <div class="dropdown-menu" ' +
                '      aria-labelledby="{{ elementId }}"> ' +

                '    <div class="input-group fh-table-filter-text" ' +
                '        data-ng-if="filterName" ' +
                '        data-fh-table-filter-text ' +
                '        data-name="{{ filterName }}" ' +
                '        data-placeholder="{{ filterPlaceholder }}"/> ' +

                '    <div class="fh-form-field-select-content"/> ' +
                '  </div> ' +
                '</div> ';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr).show();
                    el.find('.fh-form-field-select-content').append(clone);
                    $compile(el.contents())(scope);
                });
            }

            if (templateUrl) {
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }

            scope.params.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;