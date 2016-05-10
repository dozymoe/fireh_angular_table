'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhFormFieldSelect', ['$compile', '$templateRequest',
            'FhTableDefinition', 'FhTableDefinitionMixin',
            'FhTableListResourceControllerMixin', 'FhSelectedItemsMixin',
            'FhTranscludeChildDirectiveMixin',
            function($compile, $templateRequest, TableDefinition,
            TableDefinitionMixin, ListResourceControllerMixin,
            SelectedItemsMixin, TranscludeChildDirectiveMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            var pageSize = $attrs.fhpSize;
            var orderBy = $attrs.fhpOrderBy;
            var orderDir = $attrs.fhpOrderDir || 'asc';
            var multipleSelection = $attrs.fhpSingleSelection === void(0);

            TableDefinitionMixin($scope, $attrs, 'fhFormFieldSelect');
            var params = $scope.params;

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope, {multipleSelection: multipleSelection});

            if (pageSize) { $scope.dataParams.pageSize = pageSize }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]] }
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<div class="dropdown fh-table-filter-select"> ' +
                '  <span class="form-label" ng-if="label">{{ label }}</span> ' +
                '  <button class="btn btn-default dropdown-toggle" ' +
                '      type="button" id="{{ elementId }}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      aria-expanded="false"> ' +

                '    <span data-fh-transclude-pane="label"></span> ' +

                '    <span ng-if="!data.selectedItems.length" ' +
                '        class="fa fa-caret-down"></span> ' +

                '    <span ng-if="data.selectedItems.length" ' +
                '        class="fa fa-caret-square-o-down"></span> ' +

                '  </button> ' +
                '  <div class="dropdown-menu" ' +
                '      aria-labelledby="{{ elementId }}" ' +
                '      data-fh-transclude-pane="content"></div> ' +
                '</div> ';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    TranscludeChildDirectiveMixin(el, clone);
                    $compile(el.contents())(scope);
                });
            }

            if (templateUrl) {
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }

            scope.params.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;
