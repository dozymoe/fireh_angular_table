'use strict';

if (window.require) {
    require('./core_mixins');
    require('./table_filter_text');
}

angular.module('fireh_angular_table')

    .directive('fhTableFieldSelect', ['$compile', '$templateRequest',
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
            /* There are two FhTableDefinitions and two FhTableRows.
             * 
             * The first one (higher level) is about the table row being edited,
             * and the second one (this) is about selection widget for one of
             * the row's field.
             *
             * Henceforth, tableParams or row-being-edited will refer to the
             * first one, and selection-widget will refer to the second.
             */

            var name = $attrs.fhpName || $attrs.fhTableFieldSelect;
            var pageSize = $attrs.fhpSize;
            var orderBy = $attrs.fhpOrderBy;
            var orderDir = $attrs.fhpOrderDir || 'asc';
            var multipleSelection = $attrs.fhpSingleSelection === void(0);
            var tableRow = $scope[$attrs.fhpTableRow];

            TableDefinitionMixin($scope, $attrs);
            var params = $scope.params;

            // we are going to have our own data params, store table params in
            // different variable
            var tableParams = $scope.tableParams = params;

            // our own data params
            params = $scope.params = new TableDefinition(
                    tableParams.fieldDefinition[name]);

            $scope.name = name;
            $scope.tableRow = tableRow;

            var uniqId = _.uniqueId('fh-table-field-select-' + name);
            $scope.elementId = uniqId;
            $scope.elementCaptionId = uniqId + '-caption';

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope, {multipleSelection: multipleSelection});

            if (pageSize) { $scope.dataParams.pageSize = pageSize }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]] }
            // update selectedItems
            if (tableRow[name]) {
                $scope.data.selectedItems = [tableRow[name]];
            }

            $scope.showModal = function showModal() {
                jQuery(document.getElementById(uniqId)).modal('show');
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
            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<button type="button" class="btn btn-default" ' +
                '    ng-click="showModal()" ' +
                '    id="{{ elementCaptionId }}"> ' +

                '  <span data-fh-transclude-pane="label"></span> ' +

                '  <span ng-if="!data.selectedItems.length" ' +
                '      class="fa fa-caret-down"></span> ' +

                '  <span ng-if="data.selectedItems.length" ' +
                '      class="fa fa-caret-square-o-down"></span> ' +
                '</button> ' +

                '<div class="modal fh-table-field-select" ' +
                '    id="{{ elementId }}" tabindex="-1" ' +
                '    role="dialog" aria-labelledby="{{ elementCaptionId }}"> ' +

                '  <div data-fh-transclude-pane="header" class="hidden"></div> ' +

                '  <div class="modal-body"> ' +
                '    <div data-fh-transclude-pane="content"></div> ' +
                '  </div> ' +

                '  <div data-fh-transclude-pane="footer" class="hidden"></div> ' +
                '</div>';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    TranscludeChildDirectiveMixin(el, clone);
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
