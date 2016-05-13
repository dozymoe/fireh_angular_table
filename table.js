'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTable', [
        '$timeout',
        'FhTableDefinitionMixin',
        'FhTableListResourceControllerMixin',
        'FhSelectedItemsMixin',
        'FhCustomEventHandlersMixin',
        'FhMiddlewaresMixin',
        'FhEventHandlersMixin',
        function(
            $timeout,
            TableDefinitionMixin,
            ListResourceControllerMixin,
            SelectedItemsMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function controller($scope, $element, $attrs) {
            //// element attributes

            TableDefinitionMixin($scope, $attrs, 'fhTable');

            //// scope variables

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope);
            _.merge($scope.data, {
                editedItems: []
            });

            $scope.isAllSelected = false;
            var params = $scope.params;

            //// scope functions

            $scope.toggleSelectAll = function toggleSelectAll(event) {
                var eventName = event.currentTarget.checked ? 'selectAllItems'
                        : 'deselectAllItems';

                params.trigger(eventName);
            };

            //// events

            function _updateAllSelected() {
                var diff = _.differenceBy($scope.data.items,
                        $scope.data.selectedItems,
                        params.items.identifierFields);

                $scope.isAllSelected = diff.length === 0;
            }

            var displayEvents = {
                itemSelected: _updateAllSelected,
                itemDeselected: _updateAllSelected,
                itemAdded: _updateAllSelected,
                itemsTotalUpdated: _updateAllSelected
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

        myDirective.link = function link(scope) {
            // delay messages
            $timeout(function() {
                // trigger filterUpdated to initialize all filters
                _.forOwn(scope.dataParams.filterBy, function(value, key) {
                    scope.params.trigger('filterUpdated', key, value);
                });

                // trigger orderUpdated to initialize all sortings
                _.forOwn(scope.dataParams.orderBy, function(value, key) {
                    scope.params.trigger('orderUpdated', value[0], {
                            direction: value[1], priority: parseInt(key) + 1});
                });

                // trigger pageOffsetUpdated to initialize pager widgets
                scope.params.trigger('pageOffsetUpdated', scope.dataParams.page);

                // trigger pageSizeUpdated to initialize pager widgets
                scope.params.trigger('pageSizeUpdated', scope.dataParams.pageSize);
            });

            scope.params.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;
