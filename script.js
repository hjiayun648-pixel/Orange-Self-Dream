/* ============================================================
   韩佳韵 · 橙血梦境局 — 交互脚本
   Gate 投币 / 漂浮花瓣 / 滚动渐入 / 售货机全流程 / 抽卡翻面 /
   下一站高亮 / 作品上传(IndexedDB + 可选 GitHub API) / 购物车计数
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 漂浮花瓣 ---------- */
  (function petals() {
    var host = $("#petals");
    if (!host) return;
    for (var i = 0; i < 14; i++) {
      var p = document.createElement("span");
      p.className = "petal";
      var size = 8 + Math.random() * 10;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = (Math.random() * 100) + "vw";
      p.style.animationDuration = (14 + Math.random() * 16) + "s";
      p.style.animationDelay = (-Math.random() * 24) + "s";
      p.style.opacity = 0;
      host.appendChild(p);
    }
  })();

  /* ---------- 滚动渐入 ---------- */
  (function reveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          // 成分条动画
          $$(".ingredient-fill", e.target).forEach(function (f) {
            f.style.width = f.getAttribute("data-w") + "%";
          });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.16 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 平滑滚动按钮 ---------- */
  $$("[data-scroll]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = $(btn.getAttribute("data-scroll"));
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- 入场 Gate ---------- */
  var gate = $("#gate");
  var gateCoin = $("#gateCoin");
  function dismissGate() {
    if (gate.classList.contains("coin-flying")) return;
    gate.classList.add("coin-flying");
    setTimeout(function () { gate.classList.add("hidden"); }, 950);
    setTimeout(function () { gate.style.display = "none"; }, 2100);
  }
  gateCoin.addEventListener("click", dismissGate);
  /* 无交互 2.6s 后自动播放同一投币仪式（静态截取/闲置访客兜底） */
  setTimeout(dismissGate, 2600);

  /* ============================================================
     梦境自动售货机：投币 → 选择 → 推出 → 掉落 → 取出 → 身份卡 → 梦境签
     ============================================================ */
  var IDENTITIES = {
    A1: { emoji: "🌙", name: "熬夜特区顶级钉子户", next: "#lens",  note: "深夜视角：镜头里的世界在凌晨最亮。" },
    A2: { emoji: "☕", name: "咖啡因素体细胞",     next: "#about", note: "高浓度视角：先读成分表，再认识本人。" },
    A3: { emoji: "🛏️", name: "全球赖床锦标赛形象大使", next: "#bag", note: "半梦视角：从翻包检查开始这场游览。" },
    B1: { emoji: "🥟", name: "汤包鉴赏终身成就奖得主", next: "#shop", note: "素食例外视角：去小铺看看本店硬通货。" },
    B2: { emoji: "🎬", name: "梦核野外记录员",     next: "#growth", note: "镜头视角：沿成长之路逐帧回放。" },
    B3: { emoji: "💃", name: "拖延俱乐部顶级VIP",  next: "#shop", note: "deadline 视角：先把「沉浸式干活模式」加进购物车解毒。" }
  };
  var FORTUNES = [
    "答案在包里：先睡一觉，再谈梦想。",
    "你等的不只是机会，还有再多一杯咖啡的勇气。",
    "梦说：今天适合完成一件小事，不适合新开十个坑。",
    "汤包不会辜负你，耐心也不会。",
    "平行世界的你已经出发了，这个你慢慢跟上就好。",
    "别急着解读这个梦，有些答案要待机放空三天才浮上来。",
    "橙花在开，去拍吧——镜头不会说谎。",
    "薛定谔的你，正在往好的方向坍缩。"
  ];

  var vmScreen = $("#vmScreen");
  var vmKeys = $("#vmKeys");
  var vmInsert = $("#vmInsert");
  var vmSlot = $("#vmSlot");
  var vmCapsule = $("#vmCapsule");
  var vmTake = $("#vmTake");
  var machine = $("#vendingMachine");
  var vmState = "idle"; // idle | inserted | dispensing | ready
  var pickedCode = null;

  function say(t) { vmScreen.textContent = t; }

  vmInsert.addEventListener("click", function () {
    if (vmState !== "idle") return;
    vmState = "inserted";
    vmInsert.disabled = true;
    say("梦币确认中…… 叮。");

    // 飞币动画：从投币按钮飞向投币口
    var coin = document.createElement("span");
    coin.className = "flying-coin";
    coin.textContent = "梦";
    machine.appendChild(coin);
    var bRect = vmInsert.getBoundingClientRect();
    var sRect = vmSlot.getBoundingClientRect();
    var mRect = machine.getBoundingClientRect();
    coin.style.left = (bRect.left - mRect.left + bRect.width / 2 - 17) + "px";
    coin.style.top = (bRect.top - mRect.top - 40) + "px";
    coin.style.transition = "transform .7s cubic-bezier(.5,-.3,.7,.4), opacity .7s";
    requestAnimationFrame(function () {
      var dx = (sRect.left - mRect.left + sRect.width / 2 - 17) - (bRect.left - mRect.left + bRect.width / 2 - 17);
      var dy = (sRect.top - mRect.top) - (bRect.top - mRect.top - 40);
      coin.style.transform = "translate(" + dx + "px," + dy + "px) scale(.35) rotate(540deg)";
      coin.style.opacity = "0.2";
    });
    setTimeout(function () {
      coin.remove();
      vmKeys.classList.add("armed");
      say("投币成功。请选择货道 A1-B3。");
    }, 750);
  });

  $$(".vm-key").forEach(function (key) {
    key.addEventListener("click", function () {
      if (vmState !== "inserted") return;
      vmState = "dispensing";
      pickedCode = key.getAttribute("data-code");
      vmKeys.classList.remove("armed");
      say("推出 " + pickedCode + " …… 咔哒。");

      var cell = $('.vm-cell[data-code="' + pickedCode + '"]');
      if (cell) cell.classList.add("dropping");

      setTimeout(function () {
        say("掉落中…… 咚。");
        vmCapsule.classList.add("falling");
      }, 620);

      setTimeout(function () {
        vmState = "ready";
        vmTake.hidden = false;
        say("已入取出口。请取出你的梦境胶囊。");
      }, 1550);
    });
  });

  vmTake.addEventListener("click", function () {
    if (vmState !== "ready") return;
    vmTake.hidden = true;
    vmCapsule.classList.remove("falling");
    var cell = $('.vm-cell[data-code="' + pickedCode + '"]');
    if (cell) cell.classList.remove("dropping");
    vmState = "idle";
    vmInsert.disabled = false;
    say("欢迎再次投币。本机只售梦境。");
    openCard(pickedCode);
  });

  /* ---------- 身份卡弹层 + 梦境签 ---------- */
  var modal = $("#cardModal");
  var modalCard = $("#modalCard");
  var modalClose = $("#modalClose");
  var cardFront = $("#cardFront");
  var idNext = $("#idNext");
  var currentNext = null;

  function openCard(code) {
    var id = IDENTITIES[code] || IDENTITIES.A1;
    currentNext = id.next;
    $("#idEmoji").textContent = id.emoji;
    $("#idName").textContent = id.name;
    $("#idFortune").textContent =
      "「" + FORTUNES[Math.floor(Math.random() * FORTUNES.length)] + "」 " + id.note;
    modalCard.classList.remove("flipped");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  cardFront.addEventListener("click", function () {
    modalCard.classList.add("flipped");
  });
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  idNext.addEventListener("click", function () {
    closeModal();
    $$(".section.next-stop, .site-footer.next-stop").forEach(function (s) { s.classList.remove("next-stop"); });
    var target = $(currentNext || "#about");
    if (target) {
      target.classList.add("next-stop");
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      setTimeout(function () { target.classList.remove("next-stop"); }, 6000);
    }
  });

  /* ============================================================
     镜头里的世界 — 上传（IndexedDB 本地持久化 + 可选 GitHub API）
     ============================================================ */
  var DB_NAME = "obd-dream-works";
  var STORE = "works";
  var MAX_SIZE = 20 * 1024 * 1024; // 20MB
  var db = null;
  var worksGrid = $("#worksGrid");
  var uploadZone = $("#uploadZone");
  var fileInput = $("#fileInput");
  var uploadStatus = $("#uploadStatus");

  function idb() {
    return new Promise(function (res, rej) {
      if (db) return res(db);
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = function () { db = req.result; res(db); };
      req.onerror = function () { rej(req.error); };
    });
  }
  function idbAll() {
    return idb().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(STORE, "readonly");
        var r = tx.objectStore(STORE).getAll();
        r.onsuccess = function () { res(r.result || []); };
        r.onerror = function () { rej(r.error); };
      });
    });
  }
  function idbPut(rec) {
    return idb().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(rec);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function idbDel(id) {
    return idb().then(function (d) {
      return new Promise(function (res) {
        var tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { res(); };
      });
    });
  }

  function status(msg, isErr) {
    uploadStatus.textContent = msg || "";
    uploadStatus.classList.toggle("error", !!isErr);
  }

  function renderWorks(list) {
    worksGrid.innerHTML = "";
    if (!list.length) {
      worksGrid.innerHTML = '<div class="work-empty">梦境画廊暂时是空的 —— 投进第一件作品，让它开始发光。</div>';
      return;
    }
    list.sort(function (a, b) { return a.id - b.id; }).forEach(function (rec) {
      var card = document.createElement("div");
      card.className = "work-card";
      var url = URL.createObjectURL(rec.blob);
      var media;
      if (rec.type.indexOf("video") === 0) {
        media = document.createElement("video");
        media.src = url;
        media.muted = true;
        media.preload = "metadata";
        media.playsInline = true;
      } else {
        media = document.createElement("img");
        media.src = url;
        media.alt = rec.name;
      }
      var meta = document.createElement("div");
      meta.className = "work-meta";
      var nm = document.createElement("span");
      nm.className = "name";
      nm.textContent = rec.name;
      var del = document.createElement("button");
      del.className = "work-del";
      del.textContent = "移除";
      del.addEventListener("click", function () {
        idbDel(rec.id).then(function () {
          card.remove();
          if (!worksGrid.children.length) renderWorks([]);
        });
      });
      meta.appendChild(nm);
      meta.appendChild(del);
      card.appendChild(media);
      card.appendChild(meta);
      worksGrid.appendChild(card);
    });
  }

  /* GitHub 可选云同步 */
  function ghSettings() {
    try { return JSON.parse(localStorage.getItem("obd_gh") || "null"); }
    catch (e) { return null; }
  }
  function ghPush(rec) {
    var s = ghSettings();
    if (!s || !s.token || !s.repo) return Promise.resolve(false);
    var branch = s.branch || "main";
    var safe = rec.name.replace(/[^\w.\-一-龥]+/g, "_");
    var path = "dreams/" + rec.id + "-" + safe;
    return new Promise(function (resolve) {
      var fr = new FileReader();
      fr.onload = function () {
        var b64 = String(fr.result).split(",")[1];
        fetch("https://api.github.com/repos/" + s.repo + "/contents/" + path, {
          method: "PUT",
          headers: {
            "Authorization": "Bearer " + s.token,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: "dream upload: " + rec.name, content: b64, branch: branch })
        }).then(function (r) { resolve(r.ok); })
          .catch(function () { resolve(false); });
      };
      fr.onerror = function () { resolve(false); };
      fr.readAsDataURL(rec.blob);
    });
  }

  function handleFiles(files) {
    Array.prototype.forEach.call(files, function (file) {
      if (file.size > MAX_SIZE) {
        status("「" + file.name + "」超过 20MB，已被梦境拒收。", true);
        return;
      }
      if (file.type.indexOf("image") !== 0 && file.type.indexOf("video") !== 0) {
        status("「" + file.name + "」不是图片或视频，梦境不收。", true);
        return;
      }
      var rec = { id: Date.now() + Math.floor(Math.random() * 1000), name: file.name, type: file.type, blob: file };
      idbPut(rec).then(function () {
        status("已存入本地梦境画廊" + (ghSettings() ? "，正在同步到 GitHub……" : "（本地持久化，刷新后仍保留）。"));
        ghPush(rec).then(function (ok) {
          if (ghSettings() && ok) status("「" + file.name + "」已同步到 GitHub 仓库。");
          else if (ghSettings() && !ok) status("GitHub 同步失败，已保留在本地画廊。", true);
        });
        idbAll().then(renderWorks);
      }).catch(function () {
        status("本地存储失败：浏览器不支持 IndexedDB。", true);
      });
    });
  }

  uploadZone.addEventListener("click", function () { fileInput.click(); });
  uploadZone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener("change", function () {
    handleFiles(fileInput.files);
    fileInput.value = "";
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    uploadZone.addEventListener(ev, function (e) {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    uploadZone.addEventListener(ev, function (e) {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
    });
  });
  uploadZone.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

  /* 设置面板 */
  var settingsPanel = $("#settingsPanel");
  $("#settingsToggle").addEventListener("click", function () {
    settingsPanel.classList.toggle("open");
    var s = ghSettings();
    if (s) {
      $("#ghToken").value = s.token || "";
      $("#ghRepo").value = s.repo || "";
      $("#ghBranch").value = s.branch || "main";
    }
  });
  $("#ghSave").addEventListener("click", function () {
    var cfg = {
      token: $("#ghToken").value.trim(),
      repo: $("#ghRepo").value.trim(),
      branch: $("#ghBranch").value.trim() || "main"
    };
    if (cfg.token && cfg.repo) localStorage.setItem("obd_gh", JSON.stringify(cfg));
    else localStorage.removeItem("obd_gh");
    status(cfg.token && cfg.repo ? "云同步已开启：新上传将推送到 " + cfg.repo + " 的 dreams/ 目录。" : "已清除云同步设置，回退本地存储。");
  });

  /* 初始载入本地作品 */
  idbAll().then(renderWorks).catch(function () { renderWorks([]); });

  /* ============================================================
     我的梦境小铺 — 购物车（仅视觉计数）
     ============================================================ */
  var cartCount = 0;
  var cartFab = $("#cartFab");
  $$(".add-cart-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      cartCount++;
      $("#cartCount").textContent = cartCount;
      cartFab.classList.remove("bump");
      void cartFab.offsetWidth;
      cartFab.classList.add("bump");
      var old = btn.textContent;
      btn.classList.add("added");
      btn.textContent = "已加入 ✓";
      setTimeout(function () {
        btn.classList.remove("added");
        btn.textContent = old;
      }, 1200);
    });
  });
  cartFab.addEventListener("click", function () {
    var t = $("#shop");
    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
