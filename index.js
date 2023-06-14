//service worker https://web.dev/codelab-make-installable/
const divInstall = document.getElementById("installContainer");
const butInstall = document.getElementById("butInstall");
const butNotifications = document.getElementById("notifications");
butNotifications.addEventListener("click", () => {
  Notification.requestPermission().then((result) => {
    if (result === "granted") {
      alert('Notifications granted');
    }
  });
});


/* Put code here */
window.addEventListener("beforeinstallprompt", (event) => {
  console.log("👍", "beforeinstallprompt", event);
  // Stash the event so it can be triggered later.
  window.deferredPrompt = event;
  // Remove the 'hidden' class from the install button container
  divInstall.classList.toggle("hidden", false);
});
butInstall.addEventListener("click", async () => {
  console.log("👍", "butInstall-clicked");
  const promptEvent = window.deferredPrompt;
  if (!promptEvent) {
    // The deferred prompt isn't available.
    return;
  }
  // Show the install prompt.
  promptEvent.prompt();
  // Log the result
  const result = await promptEvent.userChoice;
  console.log("👍", "userChoice", result);
  // Reset the deferred prompt variable, since
  // prompt() can only be called once.
  window.deferredPrompt = null;
  // Hide the install button.
  divInstall.classList.toggle("hidden", true);
});

window.addEventListener("appinstalled", (event) => {
  console.log("👍", "appinstalled", event);
  // Clear the deferredPrompt so it can be garbage collected
  window.deferredPrompt = null;
});

/* Only register a service worker if it's supported */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}

/**
 * Warn the page must be served over HTTPS
 * The `beforeinstallprompt` event won't fire if the page is served over HTTP.
 * Installability requires a service worker with a fetch event handler, and
 * if the page isn't served over HTTPS, the service worker won't load.
 */
if (window.location.protocol === "http:") {
  const requireHTTPS = document.getElementById("requireHTTPS");
  const link = requireHTTPS.querySelector("a");
  link.href = window.location.href.replace("http://", "https://");
  requireHTTPS.classList.remove("hidden");
}
/** End service worker JS */

/**
 * Send a notification when the cooking timer is done.
 * The notification permissions must be granted.
 */

function timerDone() {
  const notifTitle = 'Timer done!';
  const notifBody = 'Get your shit off the stove...';
  const notifImg = 'lemon-pirate.png';
  const options = {
    body: notifBody,
    icon: notifImg,
  };
  new Notification(notifTitle, options);
}



const audio = new Audio(
  "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"
);
audio.load();
// audio.addEventListener('play', (event) => {
//     timer.stop();
//     console.log('cooked!');
//     alert("Finito! Buon appetito.");
// });

/**
 * Self-adjusting interval to account for drifting
 *
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds)
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
function AdjustingInterval(element, interval, errorFunc) {
  let that = this;
  let expected, timeout;
  let stoptime = element.dataset.time;
  let timerText = element.parentNode.parentNode.querySelector('.recipe-seconds span');
  const progress = element.parentNode.parentNode.querySelector("progress");
  this.interval = interval;

  this.start = function () {
    expected = Date.now() + this.interval;
    timeout = setTimeout(step, this.interval);
  };

  this.stop = function () {
    clearTimeout(timeout);
  };

  this.reset = function () {
    clearTimeout(timeout);
    stoptime = element.dataset.time;
    progress.value = 0;
    timerText.innerText = element.dataset.time;
  };

  function step() {
    var drift = Date.now() - expected;
    if (drift > that.interval) {
      // You could have some default stuff here too...
      if (errorFunc) errorFunc();
    }

    stoptime--;
    progress.value = progress.max - stoptime;
    console.log("seconds: " + stoptime);
    timerText.innerText = stoptime.toString();

    if (stoptime <= 0) {
      timerDone();
      audio.play();
      stoptime = element.dataset.time;
      clearTimeout(timeout);
      return;
    }

    expected += that.interval;
    timeout = setTimeout(step, Math.max(0, that.interval - drift));
  }
}

const timerError = function () {
  console.warn("Timer: The drift exceeded the interval.");
};

document.querySelectorAll(".startTimer").forEach((element) => {
  let timer = new AdjustingInterval(element, 1000, timerError);
  let flipit = true;
  const resetit = element.parentNode.querySelector("button.reset");

  resetit.addEventListener("click", (event) => {
    console.log("reseting");
    element.classList.remove("playing");
    flipit = true;
    timer.reset();
  });

  element.addEventListener("click", (event) => {
    console.log("clicked", element.dataset.time);
    if (flipit) {
      timer.start();
      element.classList.add("playing");
    } else {
      timer.stop();
      element.classList.remove("playing");
    }
    flipit = false == flipit ? true : false;
  });
});
