(function () {

    // Assign ng-click for navbar modal.openModal
    // <div ng-app="BlakWealth" ng-controller="modalController as modal">
    //     <button ng-click="modal.openModal('login')">Sign In</button>
    //     <button ng-click="modal.openModal('register')">Register</button>
    //     <ui-view></ui-view>
    // </div>

    "use strict";

    var app = angular.module('BlakWealth');

    app.controller('modalController', modalController);

    modalController.$inject = ['$uibModal', '$scope', 'userService', 'alertService', '$window'];

    function modalController($uibModal, $scope, userService, alertService, $window) {

        var vm = this;
        vm.openModal = _openModal;
        vm.logout = _logout;

        function _openModal(val) {
            $scope.mode = val;

            $uibModal.open({
                templateUrl: "LoginRegistrationPasswordReset/LoginRegistrationPassword.html"
                , controller: "loginRegistrationController as vm"
                , scope: $scope
            }).result.catch(function (res) {});
        }

        function _logout() {
            userService.logout().then(logoutSuccess, logoutError);
        }

        function logoutSuccess(response) {
            //if ($window.location.href.indexOf('#!/') >= 0) {
                $window.location.href = '/Content/landingpage.html';
            //} else {
            //    $window.location.href = '/';
            //}
        }

        function logoutError() {
            alertService.error('Could not log out, please try again later', 'NETWORK ERROR OCCURED')
        }
    }
})();