// Helpers
const zeroPad = (num, places) => String(num).padStart(places, "0");
const sec2time = time => {
  const date = new Date(time * 1000);
  const minutes = date.getUTCMinutes();
  const seconds = date.getSeconds();
  return `${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}`;
};
const debounce = (callback, delay) => {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
      timer = null;
    }, delay);
  };
};
function throttle(callback, wait, immediate = false) {
  let timeout = null;
  let initialCall = true;
  return function() {
    const callNow = immediate && initialCall;
    const next = () => {
      callback.apply(this, arguments);
      timeout = null;
    };
    if (callNow) {
      initialCall = false;
      next();
    }
    if (!timeout) timeout = setTimeout(next, wait);
  };
}
const HMSToSeconds = str => {
  let p = str.split(":");
  let s = 0;
  let m = 1;
  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }
  return s;
};

// VideoPlayer
class VideoPlayer {
  constructor(video) {
    this.video = document.getElementById(video);
    this.controls = document.querySelector(".v-controls");

    this.ProgressBar = new VideoProgressBar(this.video, this.controls);
    this.VideoButtons = new VideoButtons(this.video, this.controls);

    const control = new URLSearchParams(window.location.search).get("p");

    if (control !== "b") {
      this.VideoInteractiveClipboard = new VideoInteractiveClipboard(
        this.video
      );
    }
  }
}

class VideoProgressBar {
  constructor(video, controls) {
    this.video = video;
    this.controls = controls;
    this.progressBar = this.controls.querySelector(".v-progress");
    this.progressTotal = this.controls.querySelector(".v-progress-total");
    this.progressMax = this.controls.querySelector(".v-progress-max");

    this.setProgressBarSizes();
    this.addTimeTooltip();

    this.bindFunctions();
    this.addEventListeners();
  }
  setProgressBarSizes() {
    let { left, width } = this.progressMax.getBoundingClientRect();
    this.progressBarSizes = {
      left,
      width
    };
  }
  calculateMove(event) {
    let move;
    if (event.type === "touchmove") {
      move = event.changedTouches[0].pageX;
    } else {
      event.preventDefault();
      move = event.pageX - this.progressBarSizes.left;
    }
    if (move >= 0 && move <= this.progressBarSizes.width) {
      return (move / this.progressBarSizes.width) * 100;
    } else if (move > this.progressBarSizes.width) {
      return 100;
    } else {
      return 0;
    }
  }
  onMouseMove(event) {
    const total = this.calculateMove(event);
    this.video.currentTime = this.video.duration * (total / 100);
    this.progressTotal.style.width = total + "%";
  }
  onMouseDown(event) {
    this.onMouseMove(event);
    document.addEventListener("touchmove", this.onMouseMove);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("touchend", this.onMouseUp);
    document.addEventListener("mouseup", this.onMouseUp);
  }
  onMouseUp() {
    document.removeEventListener("touchmove", this.onMouseMove);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("touchend", this.onMouseUp);
    document.removeEventListener("mouseup", this.onMouseUp);
  }
  updateProgress(event) {
    this.currentTime = this.video.currentTime;
    this.duration = this.video.duration;
    const progress = (this.currentTime / this.duration) * 100;
    this.progressTotal.style.width = progress + "%";
  }
  addEventListeners() {
    this.video.addEventListener("timeupdate", this.updateProgress, false);
    this.video.addEventListener("canplay", this.updateProgress);
    this.progressBar.addEventListener("touchstart", this.onMouseDown);
    this.progressBar.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("resize", this.setProgressBarSizes);
  }
  addTimeTooltip() {
    this.progressTime = this.controls.querySelector(".v-progress-time");
    const showTooltip = throttle(event => {
      const move = this.calculateMove(event);
      const time = (move / 100) * this.video.duration;
      const tooltipMove = (move / 100) * this.progressBarSizes.width + "px";
      this.progressTime.style.left = tooltipMove;
      this.progressTime.textContent = sec2time(time);
    }, 20);

    const addTooltip = event => {
      this.progressTime.style.visibility = "visible";
      this.progressBar.addEventListener("mousemove", showTooltip);
    };
    const removeTooltip = event => {
      this.progressTime.style.visibility = "hidden";
      this.progressBar.removeEventListener("mousemove", showTooltip);
    };
    this.progressBar.addEventListener("mouseover", addTooltip);
    this.progressBar.addEventListener("mouseout", removeTooltip);
  }
  bindFunctions() {
    this.updateProgress = this.updateProgress.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.setProgressBarSizes = debounce(
      this.setProgressBarSizes.bind(this),
      100
    );
  }
}

class VideoButtons {
  constructor(video, controls) {
    this.video = video;
    this.controls = controls;
    this.videoWrapper = document.querySelector(".v-wrapper");
    this.interactiveVideo = document.querySelector(".int-video");

    this.addPlayPause();
    this.addRewindForward();
    this.addPlaybackBtn([0.75, 1, 1.25, 1.5, 2]);
    this.addCurrentTime();
    // this.addFullScreen();
    this.addVolume();
    this.activateControls();
    this.addNotification();
  }

  addPlayPause() {
    const playBtn = this.controls.querySelector(".v-play");
    const playVideo = () => this.video.play();
    const pauseVideo = () => this.video.pause();
    playBtn.addEventListener("click", playVideo);

    this.video.addEventListener("playing", () => {
      playBtn.textContent = "Pause";
      playBtn.classList.add("v-pause");
      playBtn.addEventListener("click", pauseVideo);
      playBtn.removeEventListener("click", playVideo);
    });

    this.video.addEventListener("pause", () => {
      playBtn.textContent = "Play";
      playBtn.classList.remove("v-pause");
      playBtn.addEventListener("click", playVideo);
      playBtn.removeEventListener("click", pauseVideo);
    });

    this.video.addEventListener("click", () => {
      playBtn.click();
    });

    document.addEventListener("keypress", ({ code }) => {
      if (code === "KeyK" || code === "Space") playBtn.click();
    });
  }

  addRewindForward() {
    this.rewindBtn = this.controls.querySelector(".v-rewind");
    this.forwardBtn = this.controls.querySelector(".v-forward");
    const changeVideoTime = time => (this.video.currentTime += time);

    this.rewindBtn.addEventListener("click", () => changeVideoTime(-5));
    this.forwardBtn.addEventListener("click", () => changeVideoTime(5));

    document.addEventListener("keydown", ({ code }) => {
      if (code === "ArrowLeft") this.rewindBtn.click();
      if (code === "ArrowRight") this.forwardBtn.click();
    });
  }

  addPlaybackBtn(rates) {
    this.playbackBtn = this.controls.querySelector(".v-playback-btn");
    this.playbackMenu = this.controls.querySelector(".v-playback-menu");
    this.playbackSpeed = this.controls.querySelector(".v-playback-speed");
    this.currentRate = Number(window.localStorage.videoSpeed) || 1;

    const changeVideoPlayback = rate => {
      this.video.playbackRate = rate;
      this.playbackSpeed.textContent = rate;
      window.localStorage.videoSpeed = rate;
      this.currentRate = rate;
    };
    changeVideoPlayback(this.currentRate);

    // Add Buttons based on the rates
    rates.forEach(
      rate =>
        (this.playbackMenu.innerHTML += `<button data-playbackrate="${rate}">${rate}x</button>`)
    );
    this.playbackBtns = this.playbackMenu.querySelectorAll("button");
    this.playbackBtns.forEach(btn => {
      const rate = Number(btn.dataset.playbackrate);
      btn.addEventListener("click", () => {
        changeVideoPlayback(rate);
      });
    });

    // Loop per each rate
    this.playbackBtn.addEventListener("click", () => {
      const index = rates.indexOf(this.currentRate);
      if (rates.length === index + 1) {
        changeVideoPlayback(rates[0]);
      } else {
        changeVideoPlayback(rates[index + 1]);
      }
    });
  }

  addCurrentTime() {
    this.timePassed = this.controls.querySelector(".v-time-passed");
    this.timeTotal = this.controls.querySelector(".v-time-total");

    this.video.addEventListener("loadedmetadata", () => {
      this.timeTotal.textContent = sec2time(this.video.duration);
      this.timePassed.textContent = sec2time(this.video.currentTime);
    });
    this.video.addEventListener("timeupdate", () => {
      this.timePassed.textContent = sec2time(this.video.currentTime);
    });
  }

  addFullScreen() {
    this.fullscreenBtn = this.controls.querySelector(".v-fullscreen");
    this.videoContainer = document.querySelector(".v-container");
    const enterFullscreen = () => this.videoContainer.requestFullscreen();
    const exitFullscreen = () => document.exitFullscreen();
    let fullscreen = false;

    this.fullscreenBtn.addEventListener("click", () => {
      if (!fullscreen) {
        enterFullscreen();
        fullscreen = true;
      } else if (fullscreen) {
        exitFullscreen();
        fullscreen = false;
      }
    });

    document.addEventListener("keypress", ({ code }) => {
      if (code === "KeyF") this.fullscreenBtn.click();
    });
  }

  addVolume() {
    this.volumeBtn = this.controls.querySelector(".v-volume-btn");
    this.volumeLevel = this.controls.querySelector(".v-volume-level");
    this.volumeCurrentLevel = this.controls.querySelector(
      ".v-volume-current-level"
    );

    const setCurrentSizes = () => {
      const { width, left } = this.volumeLevel.getBoundingClientRect();
      this.volumeLevelSizes = {
        min: 0,
        max: width,
        width: width,
        left: left
      };
    };

    const changeVolumeIcon = volume => {
      if (volume === 0) {
        this.volumeBtn.dataset.volume = "0";
      } else if (volume <= 0.5) {
        this.volumeBtn.dataset.volume = "1";
      } else {
        this.volumeBtn.dataset.volume = "";
      }
    };

    const changeVolume = volume => {
      changeVolumeIcon(volume);
      this.video.volume = Number(volume.toFixed(1));
      window.localStorage.videoVolume = this.video.volume;
      this.volumeCurrentLevel.style.width = volume * 100 + "%";
    };

    let volume;
    if (window.localStorage.videoVolume === undefined) {
      volume = 1;
    } else {
      volume = Number(window.localStorage.videoVolume);
    }
    changeVolume(volume);

    const onMouseMove = event => {
      let move;
      if (event.type === "touchmove") {
        move = event.changedTouches[0].pageX;
      } else {
        event.preventDefault();
        move = event.pageX - this.volumeLevelSizes.left;
      }
      if (
        move >= this.volumeLevelSizes.min &&
        move <= this.volumeLevelSizes.max
      ) {
        changeVolume(move / this.volumeLevelSizes.width);
      }
    };

    const onMouseDown = event => {
      setCurrentSizes();
      onMouseMove(event);
      document.addEventListener("touchmove", onMouseMove);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("touchend", onMouseUp);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseUp = () => {
      document.removeEventListener("touchmove", onMouseMove);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchend", onMouseUp);
      document.removeEventListener("mouseup", onMouseUp);
    };

    this.volumeLevel.addEventListener("mousedown", onMouseDown);
    this.volumeBtn.addEventListener("click", () => {
      this.currentVolume = this.currentVolume ? this.currentVolume : 1;
      if (this.video.volume != 0) {
        this.currentVolume = this.video.volume;
        changeVolume(0);
      } else {
        changeVolume(this.currentVolume);
      }
    });
  }
  activateControls() {
    let timeout;
    let videoStatus = "pause";
    const addActive = () => {
      this.controls.classList.add("v-active");
      this.interactiveVideo.classList.add("v-active");
      this.video.style.cursor = "initial";
      clearTimeout(timeout);
    };
    addActive();
    const removeActive = () => {
      this.controls.classList.remove("v-active");
      this.interactiveVideo.classList.remove("v-active");
      this.video.style.cursor = "none";
      clearTimeout(timeout);
    };
    const lateRemoveActive = () => {
      timeout = setTimeout(removeActive, 1500);
    };
    this.video.addEventListener("playing", () => {
      videoStatus = "playing";
      lateRemoveActive();
    });
    this.video.addEventListener("pause", () => {
      videoStatus = "pause";
      addActive();
    });
    let handleMouseMove = () => {
      if (videoStatus === "playing") {
        addActive();
        lateRemoveActive();
      } else if (videoStatus === "pause") {
        addActive();
      }
    };
    handleMouseMove = throttle(handleMouseMove, 120);
    this.interactiveVideo.addEventListener("mousemove", handleMouseMove);
    this.controls.addEventListener("mousemove", handleMouseMove);
    this.video.addEventListener("mousemove", handleMouseMove);
  }

  addNotification() {
    const el = document.createElement("div");
    el.classList.add("v-notification");
    this.videoWrapper.appendChild(el);
    let animating = false;
    let timeout;

    document.addEventListener("click", ({ target }) => {
      const controls = [
        "v-play",
        "v-pause",
        "v-rewind",
        "v-forward",
        "v-clipboard"
      ];
      const contains = controls
        .map(e => target.classList.contains(e))
        .filter(Boolean);
      if (contains.length) {
        if (animating) {
          clearTimeout(timeout);
          el.classList.remove("active");
        }
        const bg = getComputedStyle(target).backgroundImage.replace(
          "copy",
          "copyw"
        );
        el.style.backgroundImage = bg;
        el.classList.add("active");
        animating = true;
        timeout = setTimeout(() => {
          el.classList.remove("active");
          animating = false;
        }, 1000);
      }
    });
  }
}

class VideoInteractive {
  constructor(video) {
    this.video = video;
    this.data = {};
    this.video.addEventListener("loadedmetadata", () => {
//       this.fetchRichMedia(this.video.src.replace("mp4", "md"));
      this.fetchRichMedia("./video/video.md");
    });
  }
  fetchRichMedia(src) {
    fetch(src)
      .then(data => data.text())
      .then(data => this.handleRichMedia(data));
  }
  dispatchEvent(eventName) {
    const event = new Event(eventName);
    this.video.dispatchEvent(event);
  }
  handleRichMedia(data) {
    this.data = this.parseData(data);
    this.dispatchEvent("dataparsed");
    this.createThumbnails();
    this.createTimelineSections();
    this.addTimestampClick();
    this.handleThumbnailActivation();
  }
  parseData(data) {
    const regex = /\d{2}:\d{2}/g;
    const time = data.match(regex);
    const content = data
      .split(regex)
      .map(item => item.trim())
      .filter(item => item.length);
    const dataObject = time.map((time, index) => {
      return {
        time,
        content: content[index]
      };
    });
    return dataObject;
  }
  createThumbnails() {
    const container = document.createElement("ul");
    container.classList.add("int-video-navigation");
    this.data.forEach((item, index) => {
      if (item.content[0] === "#") {
        const el = document.createElement("video");
        el.src = video.getAttribute("src");
        el.currentTime = HMSToSeconds(item.time);
        el.id = "thumb" + index;

        const thumb = document.createElement("li");
        thumb.dataset.time = item.time;
        thumb.dataset.videonav = "";

        thumb.innerHTML += `
          <span>${item.time}</span>
          <p>${item.content.replace("#", "")}</p>
        `;
        thumb.appendChild(el);
        container.appendChild(thumb);
      }
    });
    document.querySelector(".int-video").appendChild(container);
  }
  createTimelineSections() {
    const timeline = document.querySelector(".v-progress-max");
    const timelineElements = document.querySelectorAll("[data-videonav]");
    timelineElements.forEach(item => {
      const time = HMSToSeconds(item.dataset.time);
      const sectionStart = (time / this.video.duration) * 100;
      let width = 100 - sectionStart;

      // Se tiver próximo elemento calcula o tempo
      // entre o elemento atual e o anterior
      const nextElement = item.nextElementSibling;
      if (nextElement) {
        const nextTime = HMSToSeconds(nextElement.dataset.time);
        const nextSectionStart = (nextTime / this.video.duration) * 100;
        width = nextSectionStart - sectionStart;
      }

      const section = document.createElement("div");
      section.classList.add("int-section-progress");
      section.style.width = `${width}%`;
      section.style.left = `${sectionStart}%`;

      // Add name to tooltip
      const itemName = item.querySelector("p").innerText;
      section.dataset.after = itemName;

      section.addEventListener("mouseenter", () => {
        item.classList.add("active");
      });
      section.addEventListener("mouseleave", () => {
        item.classList.remove("active");
      });
      item.addEventListener("mouseenter", () => {
        item.classList.add("active");
        section.classList.add("active");
      });
      item.addEventListener("mouseleave", () => {
        item.classList.remove("active");
        section.classList.remove("active");
      });
      timeline.appendChild(section);
    });
  }
  addTimestampClick() {
    const navItems = document.querySelectorAll("[data-videonav]");
    const handleNavClick = ({ currentTarget }) => {
      const time = HMSToSeconds(currentTarget.dataset.time);
      this.video.currentTime = time;
      this.video.play();
    };

    navItems.forEach(item => item.addEventListener("click", handleNavClick));
  }
  handleThumbnailActivation() {}
}

class VideoInteractiveClipboard extends VideoInteractive {
  constructor(video) {
    super(video);
    this.videoWrapper = document.querySelector(".v-wrapper");
    this.handleClipboardData();
  }
  handleClipboardData() {
    const addEventForEach = (item, index) => {
      if (item.content[0] !== "#") {
        const time = HMSToSeconds(item.time);
        const el = addClipboardEl(item.content);
        el.id = "copy" + index;
        const activeEl = () => {
          if (
            this.video.currentTime > time &&
            this.video.currentTime < time + 30
          ) {
            el.classList.add("active");
          } else if (el.classList.contains("active")) {
            el.classList.remove("active");
          }
        };
        this.video.addEventListener("timeupdate", activeEl, false);
      }
    };
    const addCodeEl = content => {
      const el = document.createElement("button");
      el.classList.add("v-popup");
      el.classList.add("v-clipboard");
      el.dataset.clipboardText = content.replace(/\[([^)]+)\]/, "").trim();
      const hasTitle = content.match(/\[([^)]+)\]/);
      if (hasTitle) {
        el.textContent = hasTitle[1];
      } else {
        el.textContent = "COPY CONTENT";
      }
      return el;
    };
    const addLinkEl = content => {
      const title = content.match(/\[([^)]+)\]/)[1];
      const link = content.match(/\(([^)]+)\)/)[1];
      const el = document.createElement("a");
      el.classList.add("v-popup");
      el.classList.add("v-link");
      el.setAttribute("target", "_blank");
      el.href = link;
      el.textContent = title;
      return el;
    };
    const addClipboardEl = content => {
      let el;
      const regexCode = /```(\w?){1,}/g;
      if (content.match(regexCode)) {
        content = content.replace(regexCode, "");
        el = addCodeEl(content);
      } else {
        el = addLinkEl(content);
      }
      const videoContainer = document.querySelector(".v-container");
      videoContainer.appendChild(el);
      return el;
    };
    this.video.addEventListener("dataparsed", () =>
      this.data.forEach(addEventForEach)
    );
    if (window.ClipboardJS) new ClipboardJS(".v-clipboard");
  }
}
// Travar a saída da página
// window.onbeforeunload = () => "";
new VideoPlayer("video");
