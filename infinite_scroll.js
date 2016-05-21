(function() {
'use strict';

if (window.require) {
    require('jquery-infinite-scroll-helper');
    require('./core_mixins');
}

angular.module('fireh_angular_table')

    .directive('fhInfiniteScroll', [
        '$timeout',
        'FhTableDefinitionMixin',
        function(
            $timeout,
            TableDefinitionMixin) {

        var myDirective = {
            restrict: 'A',
            scope: true
        };

        myDirective.controller = function($scope, $element, $attrs) {
            var cleanupCallbacks;
            var callback_completed_fn;

            //// element attributes

            TableDefinitionMixin($scope, $attrs, 'fhInfiniteScroll');

            //// scope variables

            var fhtable = $scope.fhtable;

            function callback(page, done) {
                callback_completed_fn = done;
                fhtable.trigger('fetchItems', {page: 'next'});
            }

            var ish = new InfiniteScrollHelper(
                $element,
                {
                    //bottomBuffer: 200, // px
                    loadMore: callback,
                    triggerInitialLoad: false
                });

            $scope._storage_ = {
                infiniteScroll: ish
            };

            //// events

            function performIshAsyncComplete() {
                if (callback_completed_fn) {
                    callback_completed_fn();
                    callback_completed_fn = void(0);
                }
            }

            fhtable.on('itemsUpdated', function(event, options) {
                performIshAsyncComplete();
                if (options.hasNextItems) {
                    $timeout(function() {
                        ish.$scrollContainer.trigger(
                                'scroll.infiniteScrollHelper');
                    });
                }

            }, cleanupCallbacks);

            fhtable.on('itemsUpdateFailed', performIshAsyncComplete,
                    cleanupCallbacks);

            //// cleanup

            $scope.$on('$destroy', function() {
                _.forEach(cleanupCallbacks, function(fn) { fn(); });
                ish.destroy();
            });
        };

        myDirective.link = function(scope, el, attrs) {
            //// element attributes

            if (attrs.fhpInitCallback && scope[attrs.fhpInitCallback]) {
                var callback_init = scope[attrs.fhpInitCallback];
                callback_init(scope._storage_.infiniteScroll);
            }
        };

        return myDirective;
    }])
;
}());
