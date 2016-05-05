'use strict';

if (window.require) {
    require('jquery-infinite-scroll-helper');
    require('./core');
}

angular.module('fireh_angular_table')

    .directive('fhInfiniteScroll', ['$timeout', function($timeout) {
        var myDirective = {
            restrict: 'A',
            scope: false
        };

        myDirective.link = function(scope, el, attrs) {
            var callback_completed_fn;
            var callback_init;
            var params = attrs.params || attrs.fhInfiniteScroll || scope.params;

            if (attrs.initCallback && scope[attrs.initCallback]) {
                callback_init = scope[attrs.initCallback];
            }

            function callback(page, done) {
                callback_completed_fn = done;
                params.trigger('fetchItems', {page: 'next'});
            }

            var ish = new InfiniteScrollHelper(el, {
                bottomBuffer: 200, // px
                loadMore: callback,
                triggerInitialLoad: false
            });

            function performIshAsyncComplete() {
                if (callback_completed_fn) {
                    callback_completed_fn();
                    callback_completed_fn = void(0);
                }
            }

            params.on('itemsUpdated', function(event, options) {
                performIshAsyncComplete();
                if (options.hasNextItems) {
                    $timeout(function() {
                        ish.$scrollContainer.trigger('scroll.infiniteScrollHelper');
                    });
                }
            });
            params.on('itemsUpdateFailed', performIshAsyncComplete);

            if (callback_init) {
                callback_init(ish);
            };
        };

        return myDirective;
    }])
;
