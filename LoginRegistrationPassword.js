(function () {
    "use strict";
    var app = angular.module('BlakWealth');

    app.directive('setFocus', function () {
        return {
            scope: {
                trigger: '@setFocus'
            },
            link: function (scope, element) {
                scope.$watch('trigger', function (value) {
                    element.bind('click', function () {
                        document.querySelector('.setFocus').focus();
                    });

                    if (value === "true") {
                        element[0].focus();
                    }
                });
            }
        }
    });

    app.controller('loginRegistrationController', loginRegistrationController);
    loginRegistrationController.$inject = ['loginRegistrationService', '$window', '$scope', '$uibModalStack', 'alertService', '$state'];

    function loginRegistrationController(loginRegistrationService, $window, $scope, $uibModalStack, alertService, $state) {
        var vm = this;
        vm.register = _registerForm;
        vm.forgotPasswordData = {};
        vm.login = _login;
        vm.showForm = _showForm;
        vm.show = $scope.mode;
        vm.forgotPassword = _forgotPassword;
        vm.fbLogin = _fbLogin;
        vm.oAuthLogin = _oAuthLogin;

        $scope.$watch('vm.loginData.email', function (newVal, oldVal) {
            if (newVal != oldVal) {
                vm.loginError = null;
            }
        });

        $scope.$watch('vm.registerData.email', function (newVal, oldVal) {
            if (newVal != oldVal) {
                vm.registerEmailError = null;
            }
        });

        $scope.$watch('vm.registerData.userName', function (newVal, oldVal) {
            if (newVal != oldVal) {
                vm.registerUserNameError = null;
                vm.registerUserNameValidationError = null;
            }
        });

        //----------------------------------- Google Auth ------------------------------------------

        gapi.load('auth2', function () {
            gapi.auth2.init({
                client_id: "730048795050-1l1gepstfhdr7p0g1s5nkjusbjd50uii.apps.googleusercontent.com",
                scope: "profile email" // this isn't required
            }).then(function (auth2) {
                var button = document.querySelector('#signInButton');
                button.addEventListener('click', function () {
                    auth2.signIn().then(function () {
                        var googleId = auth2.currentUser.get().getId();
                        var firstName = auth2.currentUser.get().w3.ofa;
                        var lastName = auth2.currentUser.get().w3.wea;
                        var email = auth2.currentUser.get().w3.U3;
                        var img = auth2.currentUser.get().w3.Paa;
                        var googleToken = auth2.currentUser.get().Zi.id_token;
                        getUserInfoFromUsersTable(firstName, lastName, email, img, googleId, googleToken, "google");
                    });
                });
            });
        });

        //----------------------------------- Facebook Auth ------------------------------------------

        window.fbAsyncInit = function () {            
            FB.init({
                appId: '476991316002210',
                cookie: true,
                xfbml: true,
                version: 'v2.10',
                status: true
            });
            //FB.getLoginStatus(function (response) {
            //    statusChangeCallback(response);
            //});
        };
       
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
        
        function statusChangeCallback(response) {
            if (response.status === 'connected') {
                getUserInfoFromFB(response.authResponse.accessToken);
            } else {
                console.log('error');
            }
        }

        function getUserInfoFromFB(fbToken) {
            FB.api(
                '/me',
                'GET',
                { "fields": "email,first_name,last_name,id,picture" },

                function (response) {
                    if (response && !response.error) {
                        var email = response.email;
                        var firstName = response.first_name;
                        var lastName = response.last_name;
                        var facebookId = response.id;
                        var img = response.picture.data.url;

                        getUserInfoFromUsersTable(firstName, lastName, email, img, facebookId, fbToken, "facebook");
                    }
                }
            );
        }

        function _fbLogin() {
            FB.login(function (response) {
                if (response.status === 'connected') {
                    getUserInfoFromFB(response.authResponse.accessToken);
                } else {
                    console.log('error');
                }
            }, { scope: 'public_profile,email' });
        }

        //------------------------------------- getUserInfo func -------------------------------------

        function getUserInfoFromUsersTable(firstName, lastName, email, img, oAuthId, id_token, provider) {
            var url = "/api/oauth/verifytheuser?userEmail=" + encodeURIComponent(email)
                + "&id_token=" + encodeURIComponent(id_token) + "&oAuthId=" + encodeURIComponent(oAuthId)
                + "&provider=" + provider;
            
            var settings = {
                cache: false,
                method: 'GET',
                responseType: 'json',
                success: function (response) {

                    if (response === "BAD_REQUEST") {

                        alertService.error("Wrong username or password", "Not authorized");
                        console.log("bad request");

                    } else if (response === "NOT_REGISTERED") {

                        alertService.warning("Please register","Not registered yet");
                        
                        _showForm("thirdPartyRegister");
                        vm.registerData.firstName = firstName;
                        vm.registerData.lastName = lastName;
                        vm.registerData.email = email;
                        vm.registerData.profilePic = img;
                        vm.img = img;
                        if (provider === 'google') {
                            vm.registerData.googleToken = oAuthId;
                            vm.googleToken = oAuthId;
                            vm.registerData.facebookToken = null;
                            vm.facebookToken = null;
                        } else if (provider === 'facebook') {
                            vm.registerData.googleToken = null;
                            vm.googleToken = null;
                            vm.registerData.facebookToken = oAuthId;
                            vm.facebookToken = oAuthId;
                        } else {
                            vm.registerData.googleToken = null;
                            vm.googleToken = null;
                            vm.registerData.facebookToken = null;
                            vm.facebookToken = null;
                        }

                        console.log("Not registered");

                    } else if (response === "REGISTERED") {
                        if ($window.location.href.indexOf('#!/') >= 0) {
                            $window.location.href = '/Content/index.html#!/home';
                        } else {
                            $window.location.href = '/home';
                        }
                        console.log("registered");
                    }
                },
                error: function (error) {
                    alertService.error("Wrong username or password", "Not authorized");
                    console.log(error);
                }
            };

            $.ajax(url, settings);
        }

        //--------------------------------------------------------------------------------------------

        function _oAuthLogin(validForm) {
            if (validForm) {
                vm.loginData.facebookId = vm.facebookToken;
                vm.loginData.googleId = vm.googleToken;
                vm.loginData.profilePic = vm.img;
                loginRegistrationService.login(vm.loginData).then(_oAuthLoginSuccess, _oAuthLoginError);
            } else {
                vm.loginError = 'Incorrect Login/Password Combination';
                $(".email").focus();
            }
        }

        function _oAuthLoginSuccess(response) {
            if (vm.loginData.facebookId) {
                alertService.success('You have successfully added your facebook account to your blakwealth account');
            } else if (vm.loginData.googleId) {               
                alertService.success('You have successfully added your google account to your blakwealth account');
            }
            
            if ($window.location.href.indexOf('#!/') >= 0) {
                $window.location.href = '/Content/index.html#!/home';
            } else {
                $window.location.href = '/home';
            }
        }

        function _oAuthLoginError(error) {
            alertService.error("Another account from the same provider exists in your account");
        }

        function _login(validForm) {
            if (validForm) {
                loginRegistrationService.login(vm.loginData).then(_loginSuccess, _loginError);
            } else {
                vm.loginError = 'Incorrect Login/Password Combination';
                $(".email").focus();
            }
        }

        function _loginSuccess(data) {
            $uibModalStack.dismissAll();
            if ($window.location.href.indexOf('#!/') >= 0) {
                $window.location.href = '/Content/index.html#!/home';
            } else {
                $window.location.href = '/home';
            }
        }

        function _loginError(error) {
            if (error.data.message === 'DEACTIVATED') {
                alertService.error('Please contact BlakWealth@admin.com', 'DEACTIVATED ACCOUNT');
                vm.loginData = {};
            } else if (error.data.message === 'UNCONFIRMED') {
                alertService.info('Please check your email and activate your account', 'UNAUTHORIZED ACCOUNT')
                vm.loginData.password = "";
            } else if (error.data.message === 'INCORRECT LOGIN/PASSWORD COMBINATION') {
                vm.loginError = 'Incorrect Login/Password Combination';
            } else {
                alertService.error('Could not contact server please check your network connections', 'NETWORK ERROR OCCURRED');
            }
            $(".email").focus();
        }

        function _registerForm(validForm) {
            if (validForm) {
                if (!vm.registerData.password) {
                    loginRegistrationService.registerThirdParty(vm.registerData).then(_oAuthRegisterSuccess, _oAuthRegisterError);
                } else if (vm.registerData.password === vm.registerConfirmPassword) {
                    loginRegistrationService.register(vm.registerData).then(_registerSuccess, _registerError);
                }
            } else {
                angular.element('input.ng-invalid').first().focus();
            }
        }

        function _oAuthRegisterSuccess(response) {
            alertService.success('You have successfully registered');
            if ($window.location.href.indexOf('#!/') >= 0) {
                $window.location.href = '/Content/index.html#!/home';
            } else {
                $window.location.href = '/home';
            }
        }

        function _oAuthRegisterError(error) {
            _registerError(error);
        }

        function _registerSuccess(response) {
            alertService.success('Please check your email to complete registration');
            $uibModalStack.dismissAll();
        }

        function _registerError(error) {
            if (error == 'EMAIL_AND_USERNAME_ALREADY_EXISTS') {
                $(".email").focus();
                vm.registerEmailError = true;
                vm.registerUserNameError = true;
            } else if (error == 'EMAIL_ALREADY_EXISTS_AND_INVALID_USERNAME') {
                $(".email").focus();
                vm.registerEmailError = true;
                vm.registerUserNameError = true;
            } else if (error == 'EMAIL_ALREADY_EXISTS') {
                $(".email").focus();
                vm.registerEmailError = true;
            } else if (error == 'USERNAME_ALREADY_EXISTS') {
                $("#userName").focus();
                vm.registerUserNameError = true;
            } else if (error == 'USERNAME_VALIDATION_ERROR') {
                $("#userName").focus();
                vm.registerUserNameValidationError = true;
            } else {
                alertService.error('Could not contact server please check your network connections', 'NETWORK ERROR OCCURRED');
            }
        }

        function _showForm(value) {
            vm.loginData = {};
            vm.registerData = {};
            vm.show = value;
        }

        function _forgotPassword(validForm) {
            if (validForm) {
                loginRegistrationService.forgotPassword(vm.forgotPasswordData).then(_forgotPasswordSuccess, _forgotPasswordError);
            }
            $(".email").focus();
        }

        function _forgotPasswordSuccess(response) {
            alertService.success('Please check your email to reset your password', 'EMAIL SENT');
            $uibModalStack.dismissAll();
        }

        function _forgotPasswordError(error) {
            alertService.error('An Error occurred. Please try again later', 'NETWORK ERROR OCCURRED');
            $uibModalStack.dismissAll();
        }
    }
})();