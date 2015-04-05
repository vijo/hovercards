'use strict';

describe('cards-directive', function() {
    var sandbox = sinon.sandbox.create();
    var element;
    var $compile;
    var $rootScope;

    beforeEach(function(done) {
        require(['cards-directive'], function() {
            sandbox.stub(chrome.runtime.onMessage, 'addListener');
            sandbox.useFakeServer();
            done();
        });
    });
    beforeEach(module('app'));
    beforeEach(inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));
    beforeEach(function(done) {
        require(['angular'], function(angular) {
            element = angular.element('<div cards="cardsets"></div>');

            $compile(element)($rootScope);
            $rootScope.$digest();
            done();
        });
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should set cardsets to an array', function() {
        var scope = element.isolateScope();
        expect(scope.cardsets).to.deep.equal([]);
    });

    describe('on hide', function() {
        it('should empty cardsets', function() {
            var scope = element.isolateScope();
            scope.cardsets = [{ provider: 'somewhere', content: 'something' }];
            chrome.runtime.onMessage.addListener.yield({ msg: 'hide' });
            $rootScope.$digest();

            expect(scope.cardsets).to.deep.equal([]);
        });
    });

    describe('on load', function() {
        it('should retrieve cards from heroku', function() {
            sandbox.server.respondWith('https://hovercards.herokuapp.com/v1/cards?triggers[0][type]=somewhere-something&triggers[0][query_type]=id&triggers[0][query]=SOME_ID',
                                       [200,
                                        { 'Content-Type': 'application/json' },
                                        JSON.stringify({ provider: 'somewhere-1', content: 'something-1', id: 'SOME_ID-1'}) + '\n' +
                                        JSON.stringify({ provider: 'somewhere-2', content: 'something-2', id: 'SOME_ID-2'}) + '\n' +
                                        JSON.stringify({ provider: 'somewhere-3', content: 'something-3', id: 'SOME_ID-3'}) + '\n']);
            var scope = element.isolateScope();
            chrome.runtime.onMessage.addListener.yield({ msg: 'load', provider: 'somewhere', content: 'something', id: 'SOME_ID' });
            sandbox.server.respond();
            $rootScope.$digest();

            expect(scope.cardsets).to.deep.equal([[{ provider: 'somewhere-1', content: 'something-1', id: 'SOME_ID-1'},
                                                   { provider: 'somewhere-2', content: 'something-2', id: 'SOME_ID-2'},
                                                   { provider: 'somewhere-3', content: 'something-3', id: 'SOME_ID-3'}]]);
        });
    });
});
