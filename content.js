console.log("Twitter媒体隐藏器已加载");

const processedTweets = new WeakSet();

function createMediaButtons(parent, mediaElements) {
  if (parent.querySelector(".media-control-buttons")) return;

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "media-control-buttons";
  buttonContainer.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 10000;
    display: flex;
    gap: 5px;
  `;

  const showButton = createButton("显示媒体", () => {
    mediaElements.forEach((el) => {
      el.style.cssText = el.dataset.originalStyle || "";
      delete el.dataset.originalStyle;
    });
    showButton.style.display = "none";
    hideButton.style.display = "block";
  });

  const hideButton = createButton("隐藏媒体", () => {
    hideMediaElements(mediaElements);
    hideButton.style.display = "none";
    showButton.style.display = "block";
  });

  hideButton.style.display = "none"; // 初始状态隐藏"隐藏媒体"按钮

  buttonContainer.appendChild(showButton);
  buttonContainer.appendChild(hideButton);
  parent.appendChild(buttonContainer);
}

function createButton(text, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.style.cssText = `
    padding: 3px 6px;
    background-color: rgba(29, 161, 242, 0.9);
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;
  button.addEventListener("mouseover", () => {
    button.style.opacity = "1";
  });
  button.addEventListener("mouseout", () => {
    button.style.opacity = "0.8";
  });
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return button;
}

function hideMediaElements(elements) {
  elements.forEach((el) => {
    el.dataset.originalStyle = el.style.cssText;
    el.style.cssText = `
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      min-height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
    `;
  });
}

function hideMediaInTweet(tweet) {
  if (processedTweets.has(tweet)) return;

  const mediaElements = Array.from(
    tweet.querySelectorAll(
      'div[aria-labelledby]:not([data-testid="UserAvatar-Container-unknown"])'
    )
  ).filter((el) => {
    // 检查元素是否在转发的推文中
    const isQuotedTweet = el.closest('div[data-testid="quotedTweet"]');
    const isRetweet = el.closest('div[data-testid="retweet-tweet-container"]');
    return !isQuotedTweet && !isRetweet;
  });

  if (mediaElements.length > 0) {
    hideMediaElements(mediaElements);
    createMediaButtons(tweet, mediaElements);
  }

  processedTweets.add(tweet);
}

function processNewTweets() {
  const tweets = document.querySelectorAll('div[data-testid="cellInnerDiv"]');
  tweets.forEach((tweet) => {
    if (!processedTweets.has(tweet)) {
      hideMediaInTweet(tweet);
    }
  });
}

let isProcessing = false;
function throttledProcessNewTweets() {
  if (!isProcessing) {
    isProcessing = true;
    requestAnimationFrame(() => {
      processNewTweets();
      isProcessing = false;
    });
  }
}

function initializeObserver() {
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
      throttledProcessNewTweets();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// 初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    throttledProcessNewTweets();
    initializeObserver();
  });
} else {
  throttledProcessNewTweets();
  initializeObserver();
}

// 在页面滚动时也尝试处理新推文，但限制频率
let scrollTimeout;
window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(throttledProcessNewTweets, 200);
});
