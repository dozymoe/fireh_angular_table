'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableBatchActions', ['FhTableDefinitionMixin',
            function(TableDefinitionMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.link = function(scope, el, attrs) {
            TableDefinitionMixin(scope, attrs);
            var params = scope.params;

            scope.data.value = '';

            scope.execute = function batchExecute() {
                if (scope.data.selectedItems) {
                    params.trigger('batchAction', scope.data.value,
                            scope.data.selectedItems);
                }
            };
        };

        return myDirective;
    }])
;
