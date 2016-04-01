'use strict';

require('./core_mixins');
require('./table_filter_text');

angular.module('fireh_angular_table')

    .directive('fhTableFieldSelect', ['$compile', '$templateRequest',
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
            // filterPlaceholder and label are observed in the middle of this
            // function
            var filterName = $attrs.filterName;
            var name = $attrs.name || $attrs.fhTableFieldSelect;
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
                    tableParams.fieldDefinition[name]);

            $scope.filterName = filterName;
            $scope.name = name;

            $attrs.$observe('filterPlaceholder', function(value) {
                $scope.fieldPlaceholder = value;
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

            params.on('itemSelected', function(event, item) {
            });

            params.on('itemDeselected', function(event, item) {
            });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            var templateUrl = attrs.templateUrl;

            var templateHtml =
                '<div class="dropdown fh-table-field-select"> ' +
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

                '    <div class="input-group fh-table-filter-text" ' +
                '        data-fh-table-filter-text ' +
                '        data-name="{{ filterName }}" ' +
                '        data-placeholder="{{ filterPlaceholder }}"/> ' +

                '    <ul data-fh-infinite-scroll/> ' +
                '  </div> ' +
                '</div>';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr).show();
                    el.find('.dropdown-menu > ul').append(clone);
                    $compile(el.contents())(scope);
                });
            }

            if (templateUrl) {
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }

            scope.params.trigger('resetItems');
        };

        return myDirective;
    }])
;
