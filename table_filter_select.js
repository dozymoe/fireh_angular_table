'use strict';

require('./core');
require('./core_mixins');

angular.module('fireh-angular-table', [])

    .directive('fhTableFilterSelect', ['$compile', '$parse', '$templateRequest',
            'FhTableDefinition', 'FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin',
            function($compile, $parse, $templateRequest, TableDefinition,
            TableDefinitionMixin, ListResourceControllerMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            // filterPlaceholder and lable are observed in the middle of this
            // function
            var filterName = $attrs.filterName;
            var name = $attrs.name || $attrs.fhTableFilterSelect;
            var pageSize = $attrs.size;
            var orderBy = $attrs.orderBy;
            var orderDir = $attrs.orderDir || 'asc';

            TableDefinitionMixin($scope, $attrs);
            var params = $scope.params;

            // we are going to have our own data params, store table params in
            // different variable
            var tableParams = $scope.tableParams = params;

            // our own data params
            params = $scope.params = new TableDefinition(
                    tableParams.filterDefinition[name]);

            $scope.filterName = filterName;
            $scope.name = name;

            $attrs.$observe('filterPlaceholder', function(value) {
                $scope.filterPlaceholder = value;
            });
            $attrs.$observe('label', function(value) {
                $scope.label = value;
            });

            ListResourceControllerMixin($scope);

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
                        _.pick(item, params.items.identifierFileds));
            });

            params.on('itemDeselected', function(event, item) {
                tableParams.trigger('removeMultipleValuesFilter', name,
                        _.pick(item, params.items.identifierFields));
            });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            var templateUrl = attrs.templateUrl;

            var templateHtml = 
                '<div class="dropdown oc-table-filter-select"> ' +
                '  <span class="form-label">{{ label }}</span> ' +
                '  <button class="btn btn-default dropdown-toggle" ' +
                '      type="button" id="{{ elementId }}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      aria-expanded="false"> ' +

                '    <span>{{ \'Select\' }}</span> ' +
                '    <span ng-if="!data.selectedItems.length" ' +
                '        class="fa fa-caret-down"/> ' +

                '    <span ng-if="data.selectedItems.length" ' +
                '        class="fa fa-caret-square-o-down"/> ' +

                '  </button> ' +
                '  <div class="dropdown-menu" ' +
                '      aria-labelledby="{{ elementId }}"> ' +

                '    <div class="input-group oc-table-filter-text" ' +
                '        data-oc-table-filter-text ' +
                '        data-name="{{ filterName }}" ' +
                '        data-placeholder="{{ filterPlaceholder }}"/> ' +

                '    <ul data-oc-infinite-scroll/> ' +
                '  </div> ' +
                '</div> ';

            function printHtml(htmlStr) {
                // get directive content and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr).show();
                    el.find('.dropdown-menu > ul').append(clone);
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

            scope.params.trigger('fetchItems', {});
        };

        return myDirective;
    }])
;
