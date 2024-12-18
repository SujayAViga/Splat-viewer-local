// src/serviceWorkerRegistration.js

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(\.[0-9]{1,3}){3}$/)
);

export function register() {
    if ('serviceWorker' in navigator) {
        const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

        if (isLocalhost) {
            checkValidServiceWorker(swUrl);
        } else {
            registerValidSW(swUrl);
        }
    }
}

function registerValidSW(swUrl) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
            console.error('Error during service worker registration:', error);
        });
}

function checkValidServiceWorker(swUrl) {
    fetch(swUrl)
        .then((response) => {
            if (response.status === 404 || response.headers.get('content-type').indexOf('javascript') === -1) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister();
                });
            } else {
                registerValidSW(swUrl);
            }
        })
        .catch(() => {
            console.log('No internet connection. App is running in offline mode.');
        });
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}
  