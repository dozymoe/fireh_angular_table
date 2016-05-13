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
            //// element attributes

            TableDefinitionMixin($scope, $attrs, 'fhTableBatchActions');

            //// scope variables

            $scope.data = {
                actionName: '',
                total: 0
            };
            SelectedItemsMixin($scope);

            var params = $scope.params;

            //// scope functions

            $scope.execute = function batchExecute() {
                if ($scope.data.selectedItems) {
                    params.trigger('batchAction', $scope.data.actionName,
                            $scope.data.selectedItems);

                    $scope.data.actionName = '';
                }
            };

            //// events

            params.on('itemsTotalUpdated', function(event, totalItems) {
                $scope.data.total = totalItems;
            });
        };

        return myDirective;
    }])
;
