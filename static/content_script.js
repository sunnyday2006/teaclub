var observeDOM = (function () {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
    eventListenerSupported = window.addEventListener;

  return function (obj, callback) {
    if (MutationObserver) {
      // define a new observer
      var obs = new MutationObserver(function (mutations, observer) {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length)
          callback();
      });
      // have the observer observe foo for changes in children
      obs.observe(obj, { childList: true, subtree: true });
    }
    else if (eventListenerSupported) {
      obj.addEventListener('DOMNodeInserted', callback, false);
      obj.addEventListener('DOMNodeRemoved', callback, false);
    }
  };
})();


// 模拟点击
function simulateClick(domNode, mouseEvent) {
  console.log('simulateClick', domNode, mouseEvent)
  if (mouseEvent && domNode) {
    return mockClick(domNode)
  }
  try {
    dom.trigger("tap")
    dom.trigger("click")
  } catch (error) {
    try {
      mockClick(domNode)
    } catch (err) {
      console.log('fullback to mockClick', err)
    }
  }
}

function mockClick(element) {
  var dispatchMouseEvent = function (target, var_args) {
    var e = document.createEvent("MouseEvents");
    e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
  };
  if (element) {
    dispatchMouseEvent(element, 'mouseover', true, true);
    dispatchMouseEvent(element, 'mousedown', true, true);
    dispatchMouseEvent(element, 'click', true, true);
    dispatchMouseEvent(element, 'mouseup', true, true);
  }
}

/* eventType is 'touchstart', 'touchmove', 'touchend'... */
function sendTouchEvent(x, y, element, eventType) {
  const touchObj = new Touch({
    identifier: Date.now(),
    target: element,
    clientX: x,
    clientY: y,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 10,
    force: 0.5,
  });

  if ('TouchEvent' in window && TouchEvent.length > 0) {
    const touchEvent = new TouchEvent(eventType, {
      cancelable: true,
      bubbles: true,
      touches: [touchObj],
      targetTouches: [],
      changedTouches: [touchObj],
      shiftKey: true,
    });
    element.dispatchEvent(touchEvent);
  } else {
    console.log('no TouchEvent')
  }
}

function priceFormatter(price) {
  return Number(Number(price).toFixed(2))
}

function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('charset', "UTF-8");
  s.setAttribute('src', file);
  th.appendChild(s);
}

function injectScriptCode(code, node) {
  var th = document.getElementsByTagName(node)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('language', 'JavaScript');
  script.textContent = code;
  th.appendChild(script);
}

injectScriptCode(`
  if (typeof hrl != 'undefined' && typeof host != 'undefined') {
    document.write('<a style="display:none" href="' + hrl + '" id="exe"></a>');
    document.getElementById('exe').click()
  }
`, 'body')

function escapeSpecialChars(jsonString) {
  return jsonString.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
}

var pageTaskRunning = false

// 获取设置
function getSetting(name, cb) {
  chrome.runtime.sendMessage({
    text: "getSetting",
    content: name
  }, function (response) {
    cb(response)
    console.log("getSetting Response: ", name, response);
  });
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}


function addDiscountElement() {
  var newDiv = createElementFromHTML(`
    <div id="teaclub">
      <div class="loading">
        <img src="https://jjbcdn.zaoshu.so/teaclub/chicken-serching.gif">
        茶友会正在查询优惠券..
      </div>
    </div>
  `);
  var currentDiv = document.getElementById("J_StepPrice") || document.getElementsByClassName("tb-key")[0]
  currentDiv.appendChild(newDiv);
}

function addCouponElement(coupon) {
  var newDiv = createElementFromHTML(`
    <a class="teaclub-coupon" href="${coupon.url}" target="_blank">
      <div class="coupon-bonus-item">
        <div class="coupon-item-left">
          <p class="coupon-item-rmb">
            <span class="rmb">${coupon.name}</span>
          </p>
          <p class="coupon-item-surplus">剩余：${coupon.remainCount}</p>
        </div>
        <div class="coupon-item-right">
          <p>有效期</p>
          <p>${coupon.startTime}</p>
          <p>- ${coupon.endTime}</p>
        </div>
      </div>
    </a>
  `);
  var currentDiv = document.getElementById("teaclub");
  currentDiv.appendChild(newDiv);
}

async function findCoupon(disable_find_coupon) {
  if (disable_find_coupon) return
  addDiscountElement()
  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get('id') || urlParams.get('skuId')
  const title = document.title.split('-')[0]
  let response = await fetch(`https://teaclub.zaoshu.so/coupon/query?sku=${sku}&keyword=${title}`)
  try {
    let coupon = await response.json();
    console.log('coupon', coupon)
    setTimeout(() => {
      addCouponElement(coupon)
      document.getElementById("teaclub").getElementsByClassName("loading")[0].style.display = 'none';
    }, 500);
    return coupon;
  } catch (error) {
    setTimeout(() => {
      document.getElementById("teaclub").getElementsByClassName("loading")[0].style.display = 'none';
      document.getElementById("teaclub").innerHTML = `
        <div class="coupon-not-found">
          <img src="https://jjbcdn.zaoshu.so/teaclub/coupon-not-found.jpg"/>遗憾，此商品没找到渠道优惠券
        </div>`
    }, 2500);
  }
}

function markCheckinStatus(task, value, cb) {
  chrome.runtime.sendMessage({
    action: "markCheckinStatus",
    taskId: task.id,
    value: value,
    status: "signed"
  }, function (response) {
    console.log('markCheckinStatus response', response)
    if (cb && response) { cb() }
  });
}

// 自动登录
function autoLogin() {
  document.getElementById("username").focus();
  setTimeout(() => {
    document.getElementById("password").focus();
  }, 50);
  setTimeout(() => {
    console.log('尝试自动登录', document.getElementById("username").value, document.getElementById("password").value)
    if (document.getElementById("username").value && document.getElementById("password").value) {
      console.log('正在登录')
      simulateClick(document.getElementById("btn-submit"), true)
    }
  }, 500);
}


// *********
// 签到任务
// *********

// 飞猪里程
function markFliggyCheckin(task) {
  const signRes = document.getElementsByClassName("tlc-title")[0] && document.getElementsByClassName("tlc-title")[0].innerText
  const value = document.getElementsByClassName("tlc-title")[0] && document.getElementsByClassName("tlc-title")[0].getElementsByTagName("span")[0].innerText
  if (signRes && (signRes.indexOf("获得") > -1)) {
    markCheckinStatus(task, value + '里程', () => {
      chrome.runtime.sendMessage({
        action: "checkin_notice",
        value: value,
        reward: 'mileage',
        title: "茶友会自动为您签到领里程",
        content: "恭喜您获得了" + value + '个里程奖励'
      }, function (response) {
        console.log("Response: ", response);
      })
    })
  } else if (signRes && (signRes.indexOf("今日已领") > -1)) {
    markCheckinStatus(task, value)
  }
}

function fliggyCheckin(setting) {
  if (setting != 'never') {
    weui.toast('茶友会运行中', 1000);
    chrome.runtime.sendMessage({
      action: "updateRunStatus",
      taskId: 2
    })
    let signInButton = document.getElementsByClassName("J_mySignInBtn")[0]

    if (signInButton && signInButton.innerText == "已签到") {
      markCheckinStatus({
        key: 'fliggy-mytrip',
        id: 2
      })
    } else if (signInButton && signInButton.innerText && signInButton.innerText.indexOf("签到") > -1) {
      simulateClick(signInButton)
      // 监控结果
      setTimeout(function () {
        markFliggyCheckin({
          key: 'fliggy-mytrip',
          id: 2
        })
      }, 1000)
    }
  }
}

function fliggyCheckin2(setting) {
  if (setting != 'never') {
    weui.toast('茶友会运行中', 1000);
    chrome.runtime.sendMessage({
      action: "updateRunStatus",
      taskId: 3
    })
    let signInButton = document.getElementsByClassName("J_makesurebuttontvipBtn")[0]
    if (signInButton && signInButton.innerText && signInButton.innerText == "确    认") {
      simulateClick(signInButton)
      // 监控结果
      setTimeout(function () {
        markFliggyCheckin({
          key: 'fliggy-tvip',
          id: 3
        })
      }, 1000)
    } else {
      if (signInButton && signInButton.innerText == "已签到") {
        markCheckinStatus({
          key: 'fliggy-tvip',
          id: 3
        })
      }
    }
  }
}

function fliggyCheckin3(setting) {
  if (setting != 'never') {
    weui.toast('茶友会运行中', 1000);
    chrome.runtime.sendMessage({
      action: "updateRunStatus",
      taskId: 4
    })
    let signInButton = null
    let signInReward = null
    let spanElements = document.getElementsByTagName("span")
    Array.prototype.slice.call(spanElements).forEach(function(element) {
      if (element.innerText &&  /^签到\+[0-9]+里程/.test(element.innerText)) {
        signInButton = element
      }
      if (element.innerText &&  /^明日\+[0-9]+里程/.test(element.innerText)) {
        signInReward = element
      }
    });
    if (signInButton) {
      setTimeout(() => {
        simulateClick(signInButton, true)
      }, 500);
      // 监控结果
      setTimeout(function () {
        markFliggyCheckin({
          key: 'rx-member',
          id: 4
        })
      }, 1000)
    } else {
      if (signInReward && signInReward.innerText) {
        markCheckinStatus({
          key: 'rx-member',
          id: 4
        })
      }
    }
  }
}

// 淘金币
function markCoinCheckin(task, value) {
  markCheckinStatus(task, value + '淘金币', () => {
    chrome.runtime.sendMessage({
      action: "checkin_notice",
      value: value,
      reward: 'coin',
      title: "茶友会自动为您签到领淘金币",
      content: "恭喜您获得了" + value + '个淘金币奖励'
    }, function (response) {
      console.log("Response: ", response);
    })
  })
}


function coinCheckin(setting) {
  if (setting != 'never') {
    weui.toast('茶友会运行中', 1000);
    chrome.runtime.sendMessage({
      action: "updateRunStatus",
      taskId: 1
    })
    let signInButton = document.getElementsByClassName("game-coin-sign-ball")[0]
    let getWaterIcon = document.getElementsByClassName("game-icon large")[0]
    if (getWaterIcon) {
      setTimeout(() => {
        simulateClick(getWaterIcon)
      }, 500);
      setTimeout(() => {
        if (document.getElementsByClassName("item-container")[0]) {
          let punchBtn = document.getElementsByClassName("item-container")[0].getElementsByClassName("btn")[0]
          if (punchBtn && punchBtn.innerText == "打卡") {
            simulateClick(punchBtn)
          } else if (punchBtn && punchBtn.innerText == "已完成") {
            markCheckinStatus({
              key: 'coin',
              id: 1
            })
          }
        }
      }, 1500);
    }
    if (signInButton && signInButton.innerText) {
      simulateClick(signInButton)
      // 监控结果
      setTimeout(function () {
        markCoinCheckin({
          key: 'coin',
          id: 1
        }, signInButton.innerText)
      }, 1000)
    }
  }
}


// 主任务
function CheckDom() {
  if (window.location.host.indexOf("m.taobao.com") > -1 && window.location.host.indexOf("item.taobao.com") < 0 )  {
    injectScript(chrome.extension.getURL('/static/touch-emulator.js'), 'body');
    injectScriptCode(`
      setTimeout(function () {
        TouchEmulator();
      }, 200)
    `, 'body')
  }
  // 判断登录状态
  if (document.getElementById("mtb-nickname") && document.getElementById("mtb-nickname").value) {
    chrome.runtime.sendMessage({
      action: "saveLoginState",
      state: "alive",
      message: "PC网页检测到用户名",
      type: "pc"
    }, function(response) {
      console.log("Response: ", response);
    });
  }
  if (window.location.host == 'login.taobao.com') {
    chrome.runtime.sendMessage({
      action: "saveLoginState",
      state: "failed",
      message: "PC网页需要登录",
      type: "pc"
    }, function(response) {
      console.log("Response: ", response);
    });
  }

  if (window.location.host == 'login.m.taobao.com') {
    chrome.runtime.sendMessage({
      action: "saveLoginState",
      state: "failed",
      message: "移动网页需要登录",
      type: "m"
    }, function(response) {
      console.log("Response: ", response);
    });
  }

  // 我的淘宝
  if (document.title == "我的淘宝" && window.location.host == 'h5.m.taobao.com') {
    if (document.getElementsByClassName("tb-toolbar-container")[0] || window.location.href == "https://h5.m.taobao.com/mlapp/mytaobao.html") {
      chrome.runtime.sendMessage({
        action: "saveLoginState",
        state: "alive",
        message: "移动端打开我的淘宝",
        type: "m"
      }, function(response) {
        console.log("Response: ", response);
      });
    }
  }
  // 登录页面
  if (window.location.host == 'login.m.taobao.com') {
    setTimeout(() => {
      autoLogin()
    }, 2500);
  }
  // 商品页
  if (window.location.host.indexOf('item.taobao.com') > -1 || window.location.host.indexOf('detail.tmall.com') > -1) {
    setTimeout(() => {
      getSetting('disable_find_coupon', (setting) => {
        findCoupon(setting)
      })
    }, 50);
  }
  // 飞猪签到
  if (document.title == "我的旅行" && window.location.host == 'www.fliggy.com') {
    if (document.getElementsByClassName("J_mySignInBtn")[0]) {
      getSetting('task-2_frequency', fliggyCheckin)
    } else if (document.getElementsByClassName("J_makesurebuttontvipBtn")[0]) {
      getSetting('task-3_frequency', fliggyCheckin2)
    }
  };
  if (document.title == "飞猪·会员中心" && window.location.host == 'h5.m.taobao.com') {
    getSetting('task-4_frequency', fliggyCheckin3)
  }
  // 淘金币
  if (document.title == "金币庄园" && window.location.host == 'market.m.taobao.com') {
    // 登录状态
    if (document.getElementsByClassName("coins")[0] && document.getElementsByClassName("coins")[0].getElementsByClassName("num")[0]) {
      chrome.runtime.sendMessage({
        action: "saveLoginState",
        state: "alive",
        message: "金币庄园读取到金币余额",
        type: "m"
      }, function(response) {
        console.log("Response: ", response);
      });
    }
    getSetting('task-1_frequency', coinCheckin)
  }
}



$( document ).ready(function() {
  console.log('茶友会注入页面成功');
  if (!pageTaskRunning) {
    setTimeout( function(){
      console.log('茶友会开始执行任务');
      CheckDom()
    }, 1500)
  }
});

// 消息
var passiveSupported = false;
try {
  var options = Object.defineProperty({}, "passive", {
    get: function() {
      passiveSupported = true;
    }
  });

  window.addEventListener("test", null, options);
} catch(err) {}

window.addEventListener("message", function(event) {
    if (event.data && event.data.action == 'productPrice') {
      findOrderBySkuAndApply(event.data, event.data.setting)
    }
  },
  passiveSupported ? { passive: true } : false
);


var nodeList = document.querySelectorAll('script');
for (var i = 0; i < nodeList.length; ++i) {
  var node = nodeList[i];
  node.src = node.src.replace("http://", "https://")
}