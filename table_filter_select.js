'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableFilterSelect', ['$compile', '$templateRequest',
            'FhTableDefinition', 'FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin', 'FhSelectedItemsMixin',
            'FhTranscludeChildDirectiveMixin',
            function($compile, $templateRequest, TableDefinition,
            TableDefinitionMixin, ListResourceControllerMixin,
            SelectedItemsMixin, TranscludeChildDirectiveMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            var name = $attrs.fhpName || $attrs.fhTableFilterSelect;
            var pageSize = $attrs.fhpSize;
            var orderBy = $attrs.fhpOrderBy;
            var orderDir = $attrs.fhpOrderDir || 'asc';
            var multipleSelection = $attrs.fhpSingleSelection === void(0);

            TableDefinitionMixin($scope, $attrs);
            var params = $scope.params;

            // we are going to have our own data params, store table params in
            // different variable
            var tableParams = $scope.tableParams = params;

            // our own data params
            params = $scope.params = new TableDefinition(
                    tableParams.filterDefinition[name]);

            $scope.name = name;

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope, {multipleSelection: multipleSelection});

            if (pageSize) { $scope.dataParams.pageSize = pageSize }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]] }

            params.on('ajaxRequestStarted', function() {
                tableParams.trigger('ajaxRequestStarted');
            });

            params.on('ajaxRequestFinished', function() {
                tableParams.trigger('ajaxRequestFinished');
            });

            tableParams.on('filterUpdated', function(event, filterName,
                        filterValue) {

                if (filterName === name) {
                    $scope.data.value = filterValue;
                }
            });

            params.on('itemSelected', function(event, item) {
                tableParams.trigger('addMultipleValuesFilter', name,
                        _.pick(item, params.items.identifierFields));
            });

            params.on('itemDeselected', function(event, item) {
                tableParams.trigger('removeMultipleValuesFilter', name,
                        _.pick(item, params.items.identifierFields));
            });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml = 
                '<div class="dropdown fh-table-filter-select"> ' +
                '  <span class="form-label" ng-if="label">{{ label }}</span> ' +
                '  <button class="btn btn-default dropdown-toggle" ' +
                '      type="button" id="{{ elementId }}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      aria-expanded="false"> ' +

                '    <span data-fh-transclude-pane="label"></span> ' +

                '    <span ng-if="!data.selectedItems.length" ' +
                '        class="fa fa-caret-down"></span> ' +

                '    <span ng-if="data.selectedItems.length" ' +
                '        class="fa fa-caret-square-o-down"></span> ' +

                '  </button> ' +
                '  <div class="dropdown-menu" ' +
                '      aria-labelledby="{{ elementId }}"
                '      data-fh-transclude-pane="content"></div> ' +
                '</div> ';

            function printHtml(htmlStr) {
                // get directive content and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    TranscludeChildDirectiveMixin(el, clone);
                    $compile(el.contents())(scope);
                });
            }

            if (templateUrl) {
                // get template
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }

            // trigger filterUpdated to initialize all filters
            _.forOwn(scope.dataParams.filterBy, function(value, key) {
                scope.params.trigger('filterUpdated', key, value);
            });

            scope.params.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;
