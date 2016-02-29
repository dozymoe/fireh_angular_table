'use strict';

require('./core_mixins');

angular.module('fireh_angular_table')

    .directive('fhTable', ['FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin',
            function(TableDefinitionMixin, ListResourceControllerMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function controller($scope, $element, $attrs) {
            TableDefinitionMixin($scope, $attrs, 'fhTable');
            var params = $scope.params;

            ListResourceControllerMixin($scope);
            _.merge($scope.data, {
                editedItems: []
            });

            $scope.selectAll = function selectAll(event) {
                var eventName = event.currentTarget.checked ? 'selectAllItems'
                        : 'deselectAllItems';

                params.trigger(eventName);
            };

            $scope.isAllSelected = function isAllSelected() {
                return $scope.data.selectedItems.length ===
                        $scope.data.items.length;
            };
        };

        myDirective.link = function link(scope) {
            // trigger filterUpdated to initialize all filters
            _.forOwn(scope.dataParams.filterBy, function(value, key) {
                scope.params.trigger('filterUpdated', key, value);
            });

            // trigger orderUpdated to initialize all sortings
            _.forOwn(scope.dataParams.orderBy, function(value, key) {
                scope.params.trigger('orderUpdated', value[0], {
                        direction: value[1], priority: parseInt(key) + 1});
            });

            scope.params.trigger('fetchItems', {});
        };

        return myDirective;
    }])
;
