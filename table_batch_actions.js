(function() {
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
            var cleanupCallbacks = [];

            $scope.data = {
                actionName: '',
                total: 0
            };

            //// element attributes

            TableDefinitionMixin($scope, $attrs, 'fhTableBatchActions');

            //// scope variables

            // this is so we have a read-only copy of $scope.data.selectedItems
            // that FhTable widget has
            SelectedItemsMixin($scope, {}, cleanupCallbacks);

            var fhtable = $scope.fhtable;

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            $scope.execute = function batchExecute() {
                if ($scope.data.selectedItems) {
                    fhtable.trigger('batchAction', $scope.data.actionName,
                            $scope.data.selectedItems, getEventOptions());

                    $scope.data.actionName = '';
                }
            };

            //// events

            fhtable.on('itemsTotalUpdated', function(event, totalItems) {
                $scope.data.total = totalItems;

            }, cleanupCallbacks);

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
            });
        };

        return myDirective;
    }])
;
}());
