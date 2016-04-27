'use strict';

if (window.require) {
    require('./core_mixins');
    require('./table_filter_text');
}

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
            /* There are two FhTableDefinitions and two FhTableRows.
             * 
             * The first one (higher level) is about the table row being edited,
             * and the second one (this) is about selection widget for one of
             * the row's field.
             *
             * Henceforth, tableParams or row-being-edited will refer to the
             * first one, and selection-widget will refer to the second.
             */

            // dropdownLabel, filterPlaceholder and label are observed in the
            // middle of this function
            var filterName = $attrs.filterName;
            var name = $attrs.name || $attrs.fhTableFieldSelect;
            var pageSize = $attrs.size;
            var orderBy = $attrs.orderBy;
            var orderDir = $attrs.orderDir || 'asc';
            var tableRow = $scope[$attrs.tableRow];

            TableDefinitionMixin($scope, $attrs);
            var params = $scope.params;

            // we are going to have our own data params, store table params in
            // different variable
            var tableParams = $scope.tableParams = params;

            // our own data params
            params = $scope.params = new TableDefinition(
                    tableParams.fieldDefinition[name]);

            $scope.caption = 'Select';
            $scope.filterName = filterName;
            $scope.name = name;
            $scope.tableRow = tableRow;

            var uniqId = _.uniqueId('fh-table-field-select-' + name);
            $scope.elementId = uniqId;
            $scope.elementCaptionId = uniqId + '-caption';

            $attrs.$observe('filterPlaceholder', function(value) {
                $scope.filterPlaceholder = value;
            });
            $attrs.$observe('label', function(value) {
                $scope.label = value;
            });
            $attrs.$observe('dropdownLabel', function(value) {
                $scope.caption = value;
            });

            ListResourceControllerMixin(
                $scope,
                {
                    multipleSelection: false
                });

            if (pageSize) { $scope.dataParams.pageSize = pageSize }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]] }
            // update selectedItems
            if (tableRow[name]) {
                $scope.data.selectedItems = [tableRow[name]];
            }

            $scope.showModal = function showModal() {
                $element.find('#' + uniqId).modal('show');
            }

            params.on('ajaxRequestStarted', function() {
                tableParams.trigger('ajaxRequestStarted');
            });

            params.on('ajaxRequestFinished', function() {
                tableParams.trigger('ajaxRequestFinished');
            });

            params.on('selectItem', function(event, itemId) {
                tableParams.trigger('draftSetField', tableRow, name,
                        _.find($scope.data.items, itemId));
            });

            params.on('deselectItem', function(event, itemId) {
                tableParams.trigger('draftUnsetField', tableRow, name, itemId);
            });

            tableParams.on('draftUpdated', function(event, item) {
                if (tableParams.isItemsEqual(tableRow, item)) {
                    params.trigger('itemSelected', item[name]);
                }
            });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            var templateUrl = attrs.templateUrl;

            var templateHtml =
                '<button type="button" class="btn btn-default" ' +
                '    ng-click="showModal()" ' +
                '    id="{{ elementCaptionId }}"> ' +

                '  <span>{{ caption }}</span> ' +
                '  <span ng-if="!data.selectedItems.length" ' +
                '      class="fa fa-caret-down"/> ' +

                '  <span ng-if="data.selectedItems.length" ' +
                '      class="fa fa-caret-square-o-down"/> ' +
                '</button> ' +

                '<div class="modal fade fh-table-field-select" ' +
                '    id="{{ elementId }}" tabindex="-1" ' +
                '    role="dialog" aria-labelledby="{{ elementCaptionId }}"> ' +

                '  <div class="modal-body fh-table-field-select-content"/> ' +
                '</div>';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    el.find('.fh-table-field-select-content').append(clone);
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
