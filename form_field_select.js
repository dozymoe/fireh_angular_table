'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhFormFieldSelect', [
        '$compile',
        '$templateRequest',
        'FhTableDefinition',
        'FhTableDefinitionMixin',
        'FhTableListResourceControllerMixin',
        'FhSelectedItemsMixin',
        'FhTranscludeChildDirectiveMixin',
        'FhCustomEventHandlersMixin',
        'FhMiddlewaresMixin',
        'FhEventHandlersMixin',
        function(
            $compile,
            $templateRequest,
            TableDefinition,
            TableDefinitionMixin,
            ListResourceControllerMixin,
            SelectedItemsMixin,
            TranscludeChildDirectiveMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            //// element attributes

            var name = $attrs.fhpName || $attrs.fhFormFieldSelect;
            var pageSize = $attrs.fhpSize;
            var orderBy = $attrs.fhpOrderBy;
            var orderDir = $attrs.fhpOrderDir || 'asc';
            var multipleSelection = $attrs.fhpSingleSelection === void(0);

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            var params = $scope.params;

            // we are going to have our own data params, store table params in
            // different variable
            var tableParams = $scope.tableParams = params;

            // our own data params
            params = $scope.params = new TableDefinition(
                    tableParams.fieldDefinition[name]);
            if (!params.services) { param.services = tableParams.services }

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope, {multipleSelection: multipleSelection});

            if (pageSize) { $scope.dataParams.pageSize = pageSize }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]] }
            // update selectedItems
            if ($scope.draft[name]) {
                $scope.data.selectedItems = [$scope.draft[name]];
            }

            //// events

            params.on('ajaxRequestStarted', function() {
                tableParams.trigger('ajaxRequestStarted');
            });

            params.on('ajaxRequestFinished', function() {
                tableParams.trigger('ajaxRequestFinished');
            });

            tableParams.on('draftUpdated', function(event, item, options) {
                if (tableParams.isItemsEqual($scope.original, item)) {
                    params.trigger('itemSelected', item[name], options);
                }
            });

            var actionEvents = {};

            actionEvents.deselectItem = function(event, itemId, options) {
                tableParams.trigger('draftUnsetField', $scope.original, name,
                        itemId, options);
            };

            actionEvents.selectItem = function(event, itemId, options) {
                tableParams.trigger('draftSetField', $scope.original, name,
                        _.find($scope.data.items, itemId), options);
            };

            CustomEventHandlersMixin(actionEvents, $attrs, params);
            MiddlewaresMixin(actionEvents, $attrs, params);

            EventHandlersMixin(
                actionEvents,
                {
                    scope: $scope,
                    params: params,
                });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            //// element attributes

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
                '      aria-labelledby="{{ elementId }}"> ' +

                '    <div data-fh-transclude-pane="content"></div> ' +
                '  </div> ' +
                '</div> ';

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
