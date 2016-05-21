(function() {
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
            var cleanupCallbacks = [];

            $scope.data = {};

            //// element attributes

            TableDefinitionMixin($scope, $attrs, 'fhTable');

            //// scope variables

            $scope.isAllSelected = false;

            ListResourceControllerMixin($scope, {}, cleanupCallbacks);
            SelectedItemsMixin($scope, {}, cleanupCallbacks);

            var fhtable = $scope.fhtable;

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            $scope.toggleSelectAll = function toggleSelectAll(event) {
                var eventName = event.currentTarget.checked ? 'selectAllItems'
                        : 'deselectAllItems';

                fhtable.trigger(eventName, getEventOptions());
            };

            //// events

            function _updateAllSelected() {
                var diff = _.differenceBy($scope.data.items,
                        $scope.data.selectedItems,
                        fhtable.items.identifierFields);

                $scope.isAllSelected = diff.length === 0;
            }

            var displayEvents = {
                itemSelected: _updateAllSelected,
                itemDeselected: _updateAllSelected,
                itemAdded: _updateAllSelected,
                itemsTotalUpdated: _updateAllSelected
            };

            CustomEventHandlersMixin(displayEvents, $attrs, fhtable);
            MiddlewaresMixin(displayEvents, $attrs, fhtable, true);

            EventHandlersMixin(
                displayEvents,
                {
                    scope: $scope,
                    fhtable: fhtable,
                    optionsGetter: getEventOptions
                },
                cleanupCallbacks);

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
            });
        };

        myDirective.link = function link(scope) {
            // delay messages
            $timeout(function() {
                // trigger filterUpdated to initialize all filters
                _.forOwn(scope.dataParams.filterBy, function(value, key) {
                    scope.fhtable.trigger('filterUpdated', key, value);
                });

                // trigger orderUpdated to initialize all sortings
                _.forOwn(scope.dataParams.orderBy, function(value, key) {
                    scope.fhtable.trigger('orderUpdated', value[0], {
                            direction: value[1], priority: parseInt(key) + 1});
                });

                // trigger pageOffsetUpdated to initialize pager widgets
                scope.fhtable.trigger('pageOffsetUpdated',
                        scope.dataParams.page);

                // trigger pageSizeUpdated to initialize pager widgets
                scope.fhtable.trigger('pageSizeUpdated',
                        scope.dataParams.pageSize);
            });

            scope.fhtable.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;
}());
