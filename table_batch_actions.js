'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableBatchActions', ['FhTableDefinitionMixin',
            'FhSelectedItemsMixin',
            function(TableDefinitionMixin, SelectedItemsMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.link = function(scope, el, attrs) {
            TableDefinitionMixin(scope, attrs, 'fhTableBatchActions');
            var params = scope.params;

            scope.data = {
                actionName: '',
                total: 0
            };

            SelectedItemsMixin(scope);

            scope.execute = function batchExecute() {
                if (scope.data.selectedItems) {
                    params.trigger('batchAction', scope.data.actionName,
                            scope.data.selectedItems);

                    scope.data.actionName = '';
                }
            };

            params.on('itemsTotalUpdated', function(event, totalItems) {
                scope.data.total = totalItems;
            });
        };

        return myDirective;
    }])
;
