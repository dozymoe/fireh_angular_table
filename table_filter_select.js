(function() {
'use strict';

if (window.require) {
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhTableFilterSelect', [
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
            var cleanupCallbacks = [];

            $scope.data = {};

            //// element attributes

            var name = $attrs.fhpName || $attrs.fhTableFilterSelect;
            var pageSize = $attrs.fhpSize;
            var orderBy = $attrs.fhpOrderBy;
            var orderDir = $attrs.fhpOrderDir || 'asc';
            var multipleSelection = $attrs.fhpSingleSelection === void(0);
            var elementId = ElementIdMixin($attrs, 'fh-table-filter-select-');

            TableDefinitionMixin($scope, $attrs);

            //// scope variables

            // we are going to have our own fhtable, store parent fhtable in
            // different variable
            var parentFhtable = $scope.parentFhtable = $scope.fhtable;

            // our own fhtable
            var fhtable = $scope.fhtable = new TableDefinition(
                    parentFhtable.filterDefinition[name]);

            if (_.isEmpty(fhtable.services)) {
                fhtable.services = parentFhtable.services;
            }

            ListResourceControllerMixin($scope, {}, cleanupCallbacks);
            SelectedItemsMixin($scope, {multipleSelection: multipleSelection},
                    cleanupCallbacks);

            $scope.name = name;
            $scope.elementId = elementId;
            $scope.popupElementId = elementId + '-popup';

            if (pageSize) { $scope.dataParams.pageSize = pageSize; }
            if (orderBy) { $scope.dataParams.orderBy = [[orderBy, orderDir]]; }

            //// events

            function getEventOptions() {
                return {
                    // we use dynamic form-id of parent element
                    formId: $scope.formId
                };
            }

            fhtable.on('ajaxRequestStarted', function() {
                parentFhtable.trigger('ajaxRequestStarted');

            }, cleanupCallbacks);

            fhtable.on('ajaxRequestFinished', function() {
                parentFhtable.trigger('ajaxRequestFinished');

            }, cleanupCallbacks);

            parentFhtable.on('filterUpdated', function(event, filterName,
                        filterValue) {

                if (filterName !== name) { return; }
                // careful not to assigned an array by reference, we don't mind
                // about the array's items though
                $scope.data.selectedItems = _.clone(filterValue);

            }, cleanupCallbacks);

            var displayEvents = {};

            displayEvents.itemSelected = function(event, item) {
                parentFhtable.trigger('addMultipleValuesFilter', name, item,
                        getEventOptions());
            };

            displayEvents.itemDeselected = function(event, item) {
                parentFhtable.trigger('removeMultipleValuesFilter', name, item,
                        getEventOptions());
            };

            CustomEventHandlersMixin(displayEvents, $attrs, fhtable);
            MiddlewaresMixin(displayEvents, $attrs, fhtable, true);

            EventHandlersMixin(
                displayEvents,
                {
                    scope: $scope,
                    fhtable: fhtable,
                    optionsGetter: getEventOptions
                },
                cleanupCallbacks);

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
                fhtable.destroy();
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
                // get directive content and insert into template
                transclude(scope, function(clone, scope) {
                    el.html(htmlStr);
                    TranscludeChildElementsMixin(el, clone);
                    $compile(el.contents())(scope);
                });
            }

            if (templateUrl) {
                // get template
                $templateRequest(templateUrl).then(printHtml);
            } else {
                printHtml(templateHtml);
            }

            // trigger filterUpdated to initialize all filters
            _.forOwn(scope.dataParams.filterBy, function(value, key) {
                scope.fhtable.trigger('filterUpdated', key, value);
            });

            scope.fhtable.trigger('fetchItems', {initialFetchItems: true});
        };

        return myDirective;
    }])
;
}());
