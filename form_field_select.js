'use strict';

if (window.require) {
    require('./core_mixins');
    require('./table_filter_text');
}

angular.module('fireh_angular_table')

    .directive('fhFormFieldSelect', ['$compile', '$templateRequest',
            'FhTableDefinition', 'FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin',
            'FhTranscludeChildDirectiveMixin',
            function($compile, $templateRequest, TableDefinition,
            TableDefinitionMixin, ListResourceControllerMixin,
            TranscludeChildDirectiveMixin) {

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
                '        class="fa fa-caret-down"></span> ' +

                '    <span ng-if="data.selectedItems.length" ' +
                '        class="fa fa-caret-square-o-down"></span> ' +

                '  </button> ' +
                '  <div class="dropdown-menu" ' +
                '      aria-labelledby="{{ elementId }}"> ' +

                '    <div class="input-group fh-table-filter-text" ' +
                '        data-ng-if="filterName" ' +
                '        data-fh-table-filter-text ' +
                '        data-name="{{ filterName }}" ' +
                '        data-placeholder="{{ filterPlaceholder }}"></div> ' +

                '    <div class="fh-form-field-select-content"></div> ' +
                '  </div> ' +
                '</div> ';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    // buggy in jQuery2 :(
                    //el.find('.fh-form-field-select-content').append(clone);
                    angular.element(el[0].querySelector(
                            '.fh-form-field-select-content')).append(clone);

                    TranscludeChildDirectiveMixin(el);
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
