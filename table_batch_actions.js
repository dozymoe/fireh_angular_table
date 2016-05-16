'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableBatchActions', [
        'FhTableDefinitionMixin',
        'FhSelectedItemsMixin',
        function(
            TableDefinitionMixin,
            SelectedItemsMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            $scope.data = {
                actionName: '',
                total: 0
            };

            //// element attributes

            TableDefinitionMixin($scope, $attrs, 'fhTableBatchActions');

            //// scope variables

            SelectedItemsMixin($scope);

            var fhtable = $scope.fhtable;

            //// scope functions

            $scope.execute = function batchExecute() {
                if ($scope.data.selectedItems) {
                    fhtable.trigger('batchAction', $scope.data.actionName,
                            $scope.data.selectedItems, eventOptions);

                    $scope.data.actionName = '';
                }
            };

            //// events

            fhtable.on('itemsTotalUpdated', function(event, totalItems) {
                $scope.data.total = totalItems;
            });
        };

        return myDirective;
    }])
;
