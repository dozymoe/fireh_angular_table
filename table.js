'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTable', ['$timeout', 'FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin', 'FhSelectedItemsMixin',
            function($timeout, TableDefinitionMixin, ListResourceControllerMixin,
            SelectedItemsMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function controller($scope, $element, $attrs) {
            TableDefinitionMixin($scope, $attrs, 'fhTable');
            var params = $scope.params;

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope);
            _.merge($scope.data, {
                editedItems: []
            });

            $scope.toggleSelectAll = function toggleSelectAll(event) {
                var eventName = event.currentTarget.checked ? 'selectAllItems'
                        : 'deselectAllItems';

                params.trigger(eventName);
            };

            $scope.isAllSelected = false;
            function _updateAllSelected() {
                $scope.isAllSelected = $scope.data.selectedItems.length ===
                        $scope.data.total;
            }
            params.on('itemSelected', _updateAllSelected);
            params.on('itemDeselected', _updateAllSelected);
            params.on('itemAdded', _updateAllSelected);
            params.on('itemsTotalUpdated', _updateAllSelected);
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
