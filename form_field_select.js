(function() {
'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhFormFieldSelect', [
        '$compile',
        '$templateRequest',
        'FhTableDefinition',
        'FhTableDefinitionMixin',
        'FhTableListResourceControllerMixin',
        'FhSelectedItemsMixin',
        'FhTranscludeChildElementsMixin',
        'FhCustomEventHandlersMixin',
        'FhMiddlewaresMixin',
        'FhEventHandlersMixin',
        'FhElementIdMixin',
        function(
            $compile,
            $templateRequest,
            TableDefinition,
            TableDefinitionMixin,
            ListResourceControllerMixin,
            SelectedItemsMixin,
            TranscludeChildElementsMixin,
            CustomEventHandlersMixin,
            MiddlewaresMixin,
            EventHandlersMixin,
            ElementIdMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true,
            transclude: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            $scope.data = {};

            //// element attributes

            var name = $attrs.fhpName || $attrs.fhFormFieldSelect;
            var pageSize = $attrs.fhpSize;
            var orderBy = $attrs.fhpOrderBy;
            var orderDir = $attrs.fhpOrderDir || 'asc';
            var multipleSelection = $attrs.fhpSingleSelection === void(0);
            var elementId = ElementIdMixin($attrs, 'fh-form-field-select-');

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            // we are going to have our own fhtable, store parent fhtable in
            // different variable
            var parentFhtable = $scope.parentFhtable = $scope.fhtable;

            // our own fhtable
            var fhtable = $scope.fhtable = new TableDefinition(
                    parentFhtable.fieldDefinition[name]);

            if (_.isEmpty(fhtable.services)) {
                fhtable.services = parentFhtable.services;
            }

            ListResourceControllerMixin($scope);
            SelectedItemsMixin($scope, {multipleSelection: multipleSelection});

            $scope.name = name;
            $scope.elementId = elementId;
            $scope.popupElementId = elementId + '-popup';

            if (pageSize) { $scope.dataParams.pageSize = pageSize; }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]]; }
            // update selectedItems
            if ($scope.draft && $scope.draft[name]) {
                $scope.data.selectedItems = [$scope.draft[name]];
            }

            //// events

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            fhtable.on('ajaxRequestStarted', function() {
                parentFhtable.trigger('ajaxRequestStarted');
            });

            fhtable.on('ajaxRequestFinished', function() {
                parentFhtable.trigger('ajaxRequestFinished');
            });

            parentFhtable.on('draftUpdated', function(event, draft, item,
                    options) {

                if (options.formId !== $scope.formId) { return; }
                fhtable.trigger('itemSelected', item[name], options);
            });

            var actionEvents = {};

            actionEvents.deselectItem = function(event, item, options) {
                parentFhtable.trigger('draftUnsetField', $scope.original, name,
                        item, getEventOptions());
            };

            actionEvents.selectItem = function(event, item, options) {
                parentFhtable.trigger('draftSetField', $scope.original, name,
                        item, getEventOptions());
            };

            CustomEventHandlersMixin(actionEvents, $attrs, fhtable);
            MiddlewaresMixin(actionEvents, $attrs, fhtable);

            EventHandlersMixin(
                actionEvents,
                {
                    scope: $scope,
                    fhtable: fhtable,
                    optionsGetter: getEventOptions
                });
        };

        myDirective.link = function(scope, el, attrs, ctrl, transclude) {
            //// element attributes

            var templateUrl = attrs.fhpTemplateUrl;

            var templateHtml =
                '<div class="dropdown fh-table-filter-select"> ' +
                '  <div data-fh-transclude-pane="header"></div> ' +

                '  <button class="btn btn-default dropdown-toggle" ' +
                '      type="button" id="{{ elementId }}" ' +
                '      data-toggle="dropdown" aria-haspopup="true" ' +
                '      aria-expanded="false"> ' +

                '    <span data-fh-transclude-pane="caption"></span> ' +

                '    <span ng-if="!data.selectedItems.length" ' +
                '        class="fa fa-caret-down"></span> ' +

                '    <span ng-if="data.selectedItems.length" ' +
                '        class="fa fa-caret-square-o-down"></span> ' +

                '  </button> ' +

                '  <div data-fh-transclude-pane="footer"></div> ' +

                '  <div class="dropdown-menu" id="{{ popupElementId }}" ' +
                '      aria-labelledby="{{ elementId }}"> ' +

                '    <div data-fh-transclude-pane="popup"></div> ' +
                '  </div> ' +
                '</div> ';

            function printHtml(htmlStr) {
                // get directive cotnent and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    TranscludeChildElementsMixin(el, clone);
                    $compile(el.contents())(scope);
                });
            }

            if (templateUrl) {
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }

            scope.fhtable.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;
}());
