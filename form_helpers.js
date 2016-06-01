(function() {
'use strict';

angular.module('fireh_angular_table')

    .directive('fhfEditableField', function() {
        var myDirective = {
            restrict: 'A'
        };

        myDirective.controller = function($scope, $element, $attrs) {
            //// element attributes

            var fieldName = $attrs.fhfEditableField;
            if (!fieldName) { return; }

            //// scope functions

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            $scope.fhtable.trigger('addEditableField', fieldName,
                    getEventOptions());
        };

        return myDirective;
    })
;
}());
