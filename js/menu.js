/* ========== TIỆM TRÀ SỮA - HACK MOD MENU========== */

(function () {
  'use strict';

  const MOD_STORAGE_KEY = 'tts_mod_config';
  const POS_STORAGE_KEY = 'tts_fab_pos';
  const GAME_SAVE_KEY = 'tsShop2';

  const defaultConfig = {
    antiTheft: false,
    superGuard: false,
    noBrats: false,
    unlimitedMoney: false,
    noSpoil: false,
    infinitePatience: false,
    autoServe: false,
    superstarMode: false,
    zeroBills: false,
    zeroTax: false,
    keepAwake: false,
  };

  let config = { ...defaultConfig };
  try {
    localStorage.removeItem(MOD_STORAGE_KEY);
  } catch (e) {}

  window.modConfig = config;
  window.applyDynamicMods = applyDynamicMods;

  function saveConfig() {
    try {
      localStorage.removeItem(MOD_STORAGE_KEY);
    } catch (e) {}
    applyDynamicMods();
  }

  // Lấy đối tượng Game State (S) trực tiếp trong memory
  function getS() {
    if (typeof window.getS === 'function') {
      const s = window.getS();
      if (s) return s;
    }
    if (window.gameHook && window.gameHook.S) {
      return window.gameHook.S;
    }
    return null;
  }

  // Lấy Runtime R
  function getR() {
    if (typeof window.getR === 'function') {
      const r = window.getR();
      if (r) return r;
    }
    if (window.gameHook && window.gameHook.R) {
      return window.gameHook.R;
    }
    return null;
  }

  function getHook() {
    if (window.gameHook) return window.gameHook;
    return {
      S: getS(),
      R: getR(),
      CFG: window.CFG,
      ITEMS: window.ITEMS,
      STARS: window.STARS,
      STAR_TXT: window.STAR_TXT,
      starLine: window.starLine,
      BASE_KEYS: window.BASE_KEYS,
      FLAV_KEYS: window.FLAV_KEYS,
      TOP_KEYS: window.TOP_KEYS,
      UPG: window.UPG,
      STAFF: window.STAFF,
      rollDay: window.rollDay,
      syncFlav: window.syncFlav,
      addReview: window.addReview,
      price: window.price,
      save: window.save,
      head: window.head,
      renderPrep: window.renderPrep,
      renderStreet: window.renderStreet,
      fmt: window.fmt
    };
  }

  // Hiển thị Notification Toast nổi bật siêu cấp (z-index 99999999)
  function modToast(msg, type = 'success') {
    let t = document.getElementById('tts-mod-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tts-mod-toast';
      document.body.appendChild(t);
    }
    const icon = type === 'warn' ? '⚠️' : type === 'danger' ? '❌' : '⚡';
    t.innerHTML = `<span style="font-size:1.2rem">${icon}</span> <span>${msg}</span>`;
    t.className = 'show ' + (type || 'success');

    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.classList.remove('show');
    }, 2800);
  }

  // Cập nhật DOM và lưu dữ liệu trực tiếp vào memory + localStorage
  function commitState(customToast) {
    const S = getS();
    const h = getHook();

    // 1. Can thiệp trực tiếp vào memory
    if (S) {
      // 2. Lưu trực tiếp qua hàm save của game
      try {
        if (typeof window.gameSave === 'function') window.gameSave();
        else if (typeof window.save === 'function') window.save();
        else if (h.save) h.save();
      } catch (e) {
        console.warn('[MOD] save() error:', e);
      }
    }

    // 3. Dự phòng can thiệp trực tiếp vào localStorage disk
    try {
      if (S) {
        let raw = localStorage.getItem(GAME_SAVE_KEY);
        if (raw) {
          let parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            parsed.money = S.money;
            parsed.stock = S.stock;
            parsed.unlocked = S.unlocked;
            parsed.upg = S.upg;
            parsed.reviews = S.reviews;
            parsed.day = S.day;
            if (S.loan == null) delete parsed.loan;
            if (S.hot == null) delete parsed.hot;
            localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.warn('[MOD] localStorage direct sync error:', e);
    }

    // 4. Cập nhật ngay lập tức lên Header UI
    try {
      if (typeof window.gameHead === 'function') window.gameHead();
      else if (typeof window.head === 'function') window.head();
      else if (h.head) h.head();
    } catch (e) {}

    // 5. Cập nhật DOM #hMoney trực tiếp
    try {
      const el = document.getElementById('hMoney');
      if (el && S && S.money != null) {
        const fmtFn = h.fmt || window.fmt;
        el.textContent = fmtFn ? fmtFn(S.money) : Number(S.money).toLocaleString('vi-VN') + 'đ';
      }
    } catch (e) {}

    // 6. Cập nhật Prep Board
    try {
      if (typeof window.gameRenderPrep === 'function') window.gameRenderPrep();
      else if (typeof window.renderPrep === 'function') window.renderPrep();
      else if (h.renderPrep) h.renderPrep();
    } catch (e) {}

    // 7. Cập nhật Street nếu đang bán
    try {
      if (typeof window.renderStreet === 'function') window.renderStreet();
      else if (h.renderStreet) h.renderStreet();
    } catch (e) {}

    if (customToast) {
      modToast(customToast);
    }
  }

  function applyDynamicMods() {
    const h = getHook();
    if (!h || !h.CFG) return;

    if (config.zeroBills) {
      h.CFG.rent = 0;
      h.CFG.utilBase = 0;
      h.CFG.utilPerUpg = 0;
    }
    if (config.zeroTax) {
      h.CFG.vat = 0;
      h.CFG.pit = 0;
    }
    if (config.autoServe) {
      const S = getS();
      if (S) {
        S.upg = S.upg || {};
        S.upg.robot = true;
        S.upg.staffOn = true;
      }
    } else {
      const S = getS();
      if (S && S.upg && S.upg.robot) {
        S.upg.robot = false;
      }
    }
    if (config.keepAwake && typeof window.requestWakeLock === 'function') {
      window.requestWakeLock();
    }
  }

  let _modMenuSessionVisible = false;

  window.isModMenuVisible = function() {
    return _modMenuSessionVisible === true;
  };

  window.setModMenuVisible = function(visible) {
    _modMenuSessionVisible = !!visible;
    const fab = document.getElementById('tts-fab-btn');
    const modal = document.getElementById('tts-mod-modal');
    if (fab) fab.style.display = visible ? '' : 'none';
    if (!visible && modal) modal.classList.remove('show');
    return visible;
  };

  window.toggleModMenu = function(forceState) {
    const cur = window.isModMenuVisible();
    const next = forceState !== undefined ? !!forceState : !cur;
    return window.setModMenuVisible(next);
  };

  // Khởi tạo giao diện
  function initModUI() {
    if (document.getElementById('tts-fab-btn')) return;

    // 1. Nút nổi (Floating Button)
    const fab = document.createElement('div');
    fab.id = 'tts-fab-btn';
    fab.innerHTML = '🌟️';
    fab.title = 'MENU MOD';

    // Mặc định luôn TẮT khi tải lại trang
    fab.style.display = 'none';

    try {
      const savedPos = JSON.parse(localStorage.getItem(POS_STORAGE_KEY));
      if (savedPos && savedPos.top && savedPos.left) {
        fab.style.top = savedPos.top;
        fab.style.left = savedPos.left;
        fab.style.right = 'auto';
      }
    } catch (e) {}

    document.body.appendChild(fab);

    // 2. Modal Dashboard
    const modal = document.createElement('div');
    modal.id = 'tts-mod-modal';
    modal.innerHTML = `
      <div class="tts-mod-container">
        <!-- Header -->
        <div class="tts-mod-header">
          <div class="tts-mod-title">
            <span>🌟</span>
            <span>MENU ẨN - HACK GAME</span>
          </div>
          <button class="tts-mod-close" id="tts-close-btn">&times;</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="tts-mod-tabs">
          <button class="tts-tab-btn active" data-tab="security">🛡️ An Ninh</button>
          <button class="tts-tab-btn" data-tab="money">💰 Tiền Tệ</button>
          <button class="tts-tab-btn" data-tab="unlock">🔓 Mở Khóa</button>
          <button class="tts-tab-btn" data-tab="stock">📦 Kho Hàng</button>
          <button class="tts-tab-btn" data-tab="gameplay">⚡ Menu VIP</button>
        </div>

        <!-- Modal Body Content -->
        <div class="tts-mod-body">
          <!-- TAB 1: AN NINH & BẢO VỆ -->
          <div class="tts-mod-pane active" id="pane-security">
            <div class="tts-sec-box">
              <div class="tts-sec-title">🛡️ Phòng Chống Trộm Cắp & Tai Họa</div>
              
              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Khiên Chống Trộm & Phạt</div>
                  <div class="tts-toggle-desc">Chống trộm cạy két đêm, chặn phạt thuế, quản lý thị trường kiểm tra, lừa đảo điện thoại và sàn tiền ảo sập.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-antiTheft" ${config.antiTheft ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Bảo Vệ VIP (Trộm & Bùng)</div>
                  <div class="tts-toggle-desc">Tóm gọn 100% khách ôm ly chạy trốn (bùng tiền) và khách kì kèo trả giá, thu hồi đủ 100% tiền.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-superGuard" ${config.superGuard ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Chặn Hoàn Toàn Khách Hãm Lồn</div>
                  <div class="tts-toggle-desc">Tắt sạch khách hối thúc, khách đổi ý, khách trả giá, khách khó tính và khách bùng.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-noBrats" ${config.noBrats ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Kho Hàng Vĩnh Viễn Không Thiu Hỏng</div>
                  <div class="tts-toggle-desc">Nguyên liệu trong kho không bao giờ hết hạn, ly pha không bao giờ bị hỏng.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-noSpoil" ${config.noSpoil ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- TAB 2: TIỀN TỆ & CHI PHÍ -->
          <div class="tts-mod-pane" id="pane-money">
            <div class="tts-sec-box">
              <div class="tts-sec-title">💰 Cộng Tiền & Giới Hạn Két</div>
              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Tắt Giới Hạn Két</div>
                  <div class="tts-toggle-desc">Ngăn game tự động trừ hoặc trộm cạy két khi két vượt ngưỡng kiểm tra.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-unlimitedMoney" ${config.unlimitedMoney ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-btn-grid grid-3">
                <button class="tts-act-btn success" id="btn-add-10m">+10M</button>
                <button class="tts-act-btn success" id="btn-add-100m">+100M</button>
                <button class="tts-act-btn success" id="btn-add-1b">+1B</button>
              </div>

              <div class="tts-input-row">
                <input type="number" class="tts-input" id="inp-custom-money" placeholder="Nhập số tiền VNĐ..." value="1000000">
                <button class="tts-act-btn pri" id="btn-set-money">✔</button>
              </div>
            </div>

            <div class="tts-sec-box">
              <div class="tts-sec-title">💳 Nợ & Miễn Phí Vận Hành</div>
              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Miễn Phí Mặt Bằng & Điện Nước</div>
                  <div class="tts-toggle-desc">Không bao giờ bị trừ tiền thuê nhà và tiền điện nước mỗi ngày.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-zeroBills" ${config.zeroBills ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Miễn 100% Thuế Kinh Doanh</div>
                  <div class="tts-toggle-desc">Không phải nộp thuế GTGT & TNCN cuối ngày.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-zeroTax" ${config.zeroTax ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <button class="tts-act-btn warn" id="btn-clear-debts">💳 Xoá Sạch Mọi Khoản Nợ</button>
            </div>
          </div>

          <!-- TAB 3: MỞ KHÓA -->
          <div class="tts-mod-pane" id="pane-unlock">
            <div class="tts-sec-box">
              <div class="tts-sec-title">⭐ Mở Khóa Siêu Tốc</div>
              <button class="tts-act-btn success full-w" id="btn-unlock-all">🌟 SIÊU MỞ KHÓA TẤT CẢ (100%)</button>
              
              <div class="tts-btn-grid">
                <button class="tts-act-btn pri" id="btn-unlock-bases">🌟 Mở Toàn Bộ Cốt Trà</button>
                <button class="tts-act-btn pri" id="btn-unlock-flavs">🍓 Mở Toàn Bộ Hương Vị</button>
                <button class="tts-act-btn pri" id="btn-unlock-tops">🧀 Mở Toàn Bộ Topping</button>
                <button class="tts-act-btn pri" id="btn-unlock-upg">⚙️ Mở Tất Cả Máy Móc</button>
                <button class="tts-act-btn pri" id="btn-unlock-staff">👥 Thuê Full Nhân Viên</button>
                <button class="tts-act-btn pri" id="btn-unlock-brand">🏷️ Mở Tem Brand & Online</button>
              </div>
            </div>
          </div>

          <!-- TAB 4: KHO HÀNG -->
          <div class="tts-mod-pane" id="pane-stock">
            <div class="tts-sec-box">
              <div class="tts-sec-title">📦 Nạp Kho Nguyên Liệu</div>
              <button class="tts-act-btn success full-w" id="btn-fill-stock">📦 NẠP FULL KHO HÀNG</button>
              <button class="tts-act-btn danger full-w" id="btn-clear-stock">🧹 Dọn Sạch Toàn Bộ Kho Hàng</button>
            </div>
          </div>

          <!-- TAB 5: GAMEPLAY -->
          <div class="tts-mod-pane" id="pane-gameplay">
            <div class="tts-sec-box">
              <div class="tts-sec-title">⚡ Tốc Độ & Sự Hài Lòng Khách Hàng</div>
              
              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">Khách Vô Hạn Kiên Nhẫn</div>
                  <div class="tts-toggle-desc">Khách tại quán và tài xế online chờ mãi mãi, không bao giờ giận hay huỷ đơn.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-infinitePatience" ${config.infinitePatience ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-toggle-row">
                <div class="tts-toggle-label">
                  <div class="tts-toggle-title">💡 Giữ Màn Hình Luôn Sáng</div>
                  <div class="tts-toggle-desc">Tự động kích hoạt Screen Wake Lock API để giữ điện thoại/App luôn sáng khi treo game.</div>
                </div>
                <label class="tts-switch">
                  <input type="checkbox" id="mod-keepAwake" ${config.keepAwake !== true ? 'checked' : ''}>
                  <span class="tts-slider"></span>
                </label>
              </div>

              <div class="tts-btn-grid">
                <button class="tts-act-btn ${config.autoServe ? 'success' : 'pri'}" id="btn-auto-serve">🤖 Tự Động Pha & Giao (${config.autoServe ? 'ĐANG BẬT' : 'ĐANG TẮT'})</button>
                <button class="tts-act-btn pri" id="btn-set-5stars">⭐(IDOL) Review 5★ </button>
                <button class="tts-act-btn warn" id="btn-clear-badrev">🧹 Xoá Hết Đánh Giá Xấu</button>
                <button class="tts-act-btn warn" id="btn-skip-day">⏩ Nhảy Sang Ngày Tiếp Theo</button>
              </div>
            </div>

            <div class="tts-sec-box">
              <div class="tts-sec-title">🌤️ Chọn Sự Kiện Hôm Nay</div>
              <div class="tts-btn-grid grid-3">
                <button class="tts-act-btn" data-ev="hot">☀️ Nắng</button>
                <button class="tts-act-btn ${config.superstarMode ? 'success' : 'pri'}" id="btn-ev-superstars">🌟 IDOL (${config.superstarMode ? 'BẬT' : 'TẮT'})</button>
                <button class="tts-act-btn" data-ev="students">🎒 Học Sinh</button>
                <button class="tts-act-btn" data-ev="reviewer">📸 Reviewer</button>
                <button class="tts-act-btn" data-ev="trend">🔥 Món Hot</button>
                <button class="tts-act-btn" data-ev="holiday">🎊 Ngày Lễ</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="tts-mod-footer">
          <span class="tts-status-tag">● Trạng thái: Đã Sẵn Sàng - MenuMod tạo bởi Trung Hiếu</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Kéo thả FAB
    setupDraggable(fab);

    // Toggle Modal
    fab.addEventListener('click', () => {
      if (fab.dataset.wasDragged === 'true') return;
      modal.classList.add('show');
    });

    document.getElementById('tts-close-btn').addEventListener('click', () => {
      modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });

    // Tab chuyển đổi
    const tabBtns = modal.querySelectorAll('.tts-tab-btn');
    const panes = modal.querySelectorAll('.tts-mod-pane');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        panes.forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        const targetPane = document.getElementById(`pane-${target}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Setup Toggles
    setupToggle('mod-antiTheft', 'antiTheft', 'Khiên Chống Trộm & Phạt Thuế, QLTT');
    setupToggle('mod-superGuard', 'superGuard', 'Bảo Vệ VIP Tự Động Bắt 100% Khách Bùng Tiền');
    setupToggle('mod-noBrats', 'noBrats', 'Chặn Hoàn Toàn Khách Hối, Đổi Ý, Bùng Tiền');
    setupToggle('mod-noSpoil', 'noSpoil', 'Nguyên Liệu Tươi Mới Vĩnh Viễn Không Thiu Hỏng');
    setupToggle('mod-unlimitedMoney', 'unlimitedMoney', 'Tắt Giới Hạn Két (Anti Money Reset)');
    setupToggle('mod-zeroBills', 'zeroBills', 'Miễn Phí Mặt Bằng & Điện Nước (0đ/ngày)');
    setupToggle('mod-zeroTax', 'zeroTax', 'Miễn 100% Thuế GTGT & TNCN');
    setupToggle('mod-infinitePatience', 'infinitePatience', 'Khách Hàng & Tài Xế Vô Hạn Kiên Nhẫn');
    setupToggle('mod-keepAwake', 'keepAwake', 'Giữ Màn Hình Điện Thoại Luôn Sáng (Keep Awake)');

    // Setup Action Buttons
    setupActions();
  }

  function setupDraggable(el) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let moved = false;

    function onPointerDown(e) {
      isDragging = true;
      moved = false;
      el.dataset.wasDragged = 'false';
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startY = e.clientY || (e.touches && e.touches[0].clientY);
      const rect = el.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        moved = true;
        el.dataset.wasDragged = 'true';
      }

      const newLeft = Math.max(10, Math.min(window.innerWidth - 60, initialLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - 60, initialTop + dy));

      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      el.style.right = 'auto';
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (moved) {
        localStorage.setItem(
          POS_STORAGE_KEY,
          JSON.stringify({ left: el.style.left, top: el.style.top })
        );
      }
    }

    el.addEventListener('pointerdown', onPointerDown);
  }

  function setupToggle(elementId, configKey, label) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('change', () => {
      config[configKey] = el.checked;
      saveConfig();
      if (configKey === 'keepAwake') {
        if (el.checked && typeof window.requestWakeLock === 'function') {
          window.requestWakeLock();
        } else if (!el.checked && typeof window.releaseWakeLock === 'function') {
          window.releaseWakeLock();
        }
      }
      modToast(el.checked ? `🟢 ĐÃ BẬT: ${label}!` : `⚪ ĐÃ TẮT: ${label}!`, el.checked ? 'success' : 'warn');
    });
  }

  function setupActions() {
    const getH = () => getHook();

    // 1. Nạp Tiền Trực Tiếp
    const addCash = (amount) => {
      const S = getS();
      if (!S) {
        modToast('Lỗi: Chưa kết nối được Memory Game!', 'warn');
        return;
      }
      const numAmount = Number(amount) || 0;
      if (typeof window.checkMoneyAbnormal === 'function' && window.checkMoneyAbnormal(numAmount)) {
        modToast('🚨 Phát hiện tiền bất chính! Đã bị tịch thu toàn bộ.', 'warn');
        commitState();
        return;
      }
      S.money = (Number(S.money) || 0) + numAmount;
      S.totalRev = (Number(S.totalRev) || 0) + numAmount;
      S.totalProfit = (Number(S.totalProfit) || 0) + numAmount;
      commitState(`💰 Đã cộng +${numAmount.toLocaleString('vi-VN')}đ vào két! (Két: ${S.money.toLocaleString('vi-VN')}đ)`);
    };

    document.getElementById('btn-add-10m').onclick = () => addCash(10000000);
    document.getElementById('btn-add-100m').onclick = () => addCash(100000000);
    document.getElementById('btn-add-1b').onclick = () => addCash(1000000000);

    document.getElementById('btn-set-money').onclick = () => {
      const val = parseInt(document.getElementById('inp-custom-money').value, 10);
      if (isNaN(val) || val < 0) return modToast('Số tiền không hợp lệ!', 'warn');
      const S = getS();
      if (!S) return modToast('Lỗi kết nối Game State!', 'warn');
      const currentMoney = Number(S.money) || 0;
      const diff = val - currentMoney;
      if (typeof window.checkMoneyAbnormal === 'function' && (val >= 100000000 || diff >= 100000000)) {
        if (window.checkMoneyAbnormal(val >= 100000000 ? val : diff)) {
          modToast('🚨 Phát hiện tiền bất chính! Đã bị tịch thu toàn bộ.', 'warn');
          commitState();
          return;
        }
      }
      S.money = val;
      commitState(`💰 Đã đặt két thành: ${val.toLocaleString('vi-VN')}đ`);
    };

    document.getElementById('btn-clear-debts').onclick = () => {
      const S = getS();
      if (!S) return;
      S.loan = null;
      S.hot = null;
      commitState('💳 Đã xoá sạch toàn bộ nợ ngân hàng & nợ nóng!');
    };

    // 2. Mở Khóa
    document.getElementById('btn-unlock-bases').onclick = () => {
      const S = getS();
      if (!S || !getH().BASE_KEYS) return;
      getH().BASE_KEYS.forEach((k) => (S.unlocked[k] = true));
      commitState('🧋 Đã mở khóa toàn bộ cốt trà!');
    };

    document.getElementById('btn-unlock-flavs').onclick = () => {
      const S = getS();
      if (!S || !getH().FLAV_KEYS) return;
      getH().FLAV_KEYS.forEach((k) => {
        S.unlocked[k] = true;
        if (!S.stock[k] || S.stock[k].length === 0) {
          S.stock[k] = [{ q: 99, exp: 99999 }];
        }
      });
      if (getH().syncFlav) getH().syncFlav();
      commitState('🍓 Đã mở khóa toàn bộ hương vị trái cây!');
    };

    document.getElementById('btn-unlock-tops').onclick = () => {
      const S = getS();
      if (!S || !getH().TOP_KEYS) return;
      getH().TOP_KEYS.forEach((k) => (S.unlocked[k] = true));
      commitState('🧀 Đã mở khóa toàn bộ topping!');
    };

    document.getElementById('btn-unlock-upg').onclick = () => {
      const S = getS();
      if (!S || !getH().UPG) return;
      getH().UPG.forEach((u) => (S.upg[u.id] = true));
      commitState('⚙️ Đã mở khóa toàn bộ máy móc & nâng cấp!');
    };

    document.getElementById('btn-unlock-staff').onclick = () => {
      const S = getS();
      if (!S || !getH().STAFF) return;
      S.hired = S.hired || {};
      getH().STAFF.forEach((s) => {
        S.upg[s.id] = true;
        S.hired[s.id] = true;
      });
      S.upg.robot = true;
      S.upg.staff1 = false;
      S.upg.staff3 = false;
      commitState('👥 Đã tuyển dụng đầy đủ toàn bộ nhân viên (Bật Robot)!');
    };

    document.getElementById('btn-unlock-brand').onclick = () => {
      const S = getS();
      if (!S) return;
      S.online = true;
      S.tablets = 1;
      S.upg.brandKit = true;
      S.brand = {
        i: 'b00',
        c: '#ffffff',
        t: '#5a4030',
        fr: 'round',
        s: 'Ngon từ giọt đầu'
      };
      commitState('🏷️ Đã kích hoạt Tem Thương Hiệu & Bán Online!');
    };

    document.getElementById('btn-unlock-all').onclick = () => {
      const S = getS();
      if (!S) return;
      if (getH().BASE_KEYS) getH().BASE_KEYS.forEach((k) => (S.unlocked[k] = true));
      if (getH().FLAV_KEYS) {
        getH().FLAV_KEYS.forEach((k) => {
          S.unlocked[k] = true;
          if (!S.stock[k] || S.stock[k].length === 0) {
            S.stock[k] = [{ q: 99, exp: 99999 }];
          }
        });
        if (getH().syncFlav) getH().syncFlav();
      }
      if (getH().TOP_KEYS) getH().TOP_KEYS.forEach((k) => (S.unlocked[k] = true));
      if (getH().UPG) getH().UPG.forEach((u) => (S.upg[u.id] = true));
      if (getH().STAFF) {
        getH().STAFF.forEach((s) => {
          S.upg[s.id] = true;
          if (S.hired) S.hired[s.id] = true;
        });
        S.upg.staff1 = false;
        S.upg.staff3 = true;
      }
      S.online = true;
      S.tablets = 1;
      S.upg.brandKit = true;
      S.brand = {
        i: 'b00',
        c: '#ffffff',
        t: '#5a4030',
        fr: 'round',
        s: 'Ngon từ giọt đầu'
      };
      commitState('🌟 ĐÃ MỞ KHÓA TOÀN BỘ 100% GAME!');
    };

    // 3. Kho Hàng
    document.getElementById('btn-fill-stock').onclick = () => {
      const S = getS();
      if (!S || !getH().ITEMS) return;
      Object.keys(getH().ITEMS).forEach((k) => {
        S.stock[k] = [{ q: 999, exp: 99999 }];
      });
      if (getH().syncFlav) getH().syncFlav();
      commitState('📦 Đã nạp đầy kho: 999 mẻ tất cả nguyên liệu (Hạn vĩnh viễn)!');
    };

    document.getElementById('btn-clear-stock').onclick = () => {
      const S = getS();
      if (!S || !getH().ITEMS) return;
      Object.keys(getH().ITEMS).forEach((k) => {
        S.stock[k] = [];
      });
      if (getH().syncFlav) getH().syncFlav();
      commitState('🧹 Đã dọn dẹp sạch toàn bộ kho hàng!');
    };

    // 4. Gameplay
    document.getElementById('btn-set-5stars').onclick = () => {
      const S = getS();
      if (!S) return;
      const H = getH();
      
      const DEFAULT_STARS = [
        {n:'Baek Si-woo',t:'Idol Kpop · NOVA7',l:'kr',m:1,f:0},{n:'Kang Ha-jun',t:'Idol Kpop · STARLIGHT',l:'kr',m:1,f:1},{n:'Yoon Seo-ah',t:'Idol Kpop · MOONBEAM',l:'kr',m:0,f:2},
        {n:'Nong Thanakorn',t:'Diễn viên Thái',l:'th',m:1,f:3},{n:'Nong Praewa',t:'Diễn viên Thái',l:'th',m:0,f:4},{n:'Nong Sirilada',t:'Diễn viên Thái',l:'th',m:0,f:4},
        {n:'Nong Kittiphat',t:'Diễn viên Thái',l:'th',m:1,f:7},{n:'Lâm Tử Hàn',t:'Diễn viên Trung',l:'cn',m:1,f:6},{n:'Liễu Như Yên',t:'Diễn viên Trung',l:'cn',m:0,f:5},{n:'Tô Vân Hi',t:'Diễn viên Trung',l:'cn',m:0,f:5},
        {n:'Yua Mikami',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:2},{n:'Eimi Fukada',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:4},{n:'Yui Hatano',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:5},
        {n:'Riri Nanatsumori',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:2},{n:'Karen Kaede',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:4},{n:'Minami Aizawa',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:5},
        {n:'Kana Momonogi',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:2},{n:'Tsukasa Aoi',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:4},{n:'Arina Hashimoto',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:5},
        {n:'Remu Suzumori',t:'Idol Nhật Bản · JAV Star',l:'jp',m:0,f:2},
        {n:'Đen Vâu',t:'Rapper Việt Nam · Rap Việt',l:'vn',m:1,f:0},{n:'Binz',t:'Rapper Việt Nam · SpaceSpeakers',l:'vn',m:1,f:1},
        {n:'Karik',t:'Rapper Việt Nam · Rap Việt',l:'vn',m:1,f:3},{n:'Suboi',t:'Rapper Việt Nam · Queen of Rap',l:'vn',m:0,f:2},
        {n:'B-Ray',t:'Rapper Việt Nam · Underdogs',l:'vn',m:1,f:6},{n:'JustaTee',t:'Rapper Việt Nam · SpaceSpeakers',l:'vn',m:1,f:7},
        {n:'MCK',t:'Rapper Việt Nam · RPT',l:'vn',m:1,f:1},{n:'tlinh',t:'Rapper Việt Nam · GenZ Star',l:'vn',m:0,f:4},
        {n:'TRUNG HIẾU',t:'ADMINISTRATOR · BÁ CHỦ',l:'vn',m:1,f:0},{n:'HIEUTHUHAI',t:'Rapper Việt Nam · GERDNANG',l:'vn',m:1,f:6},{n:'LƯỢNG NGUYỄN',t:'VIP MEMBER',l:'vn',m:1,f:0}
      ];

      const starsList = (H && H.STARS && H.STARS.length) ? H.STARS : (window.STARS && window.STARS.length ? window.STARS : DEFAULT_STARS);

      // Lọc giữ lại 5 sao và thêm 30 đánh giá 5 sao từ 30 Idol, Rapper & Siêu sao
      S.reviews = (S.reviews || []).filter((r) => r.s === 5);
      
      const bases = ['tra', 'matcha', 'hong', 'luc', 'olong', 'thai'];
      const topsList = ['tcden', 'tcvang', 'tcsoi', 'popping', 'thach', 'cunang', 'cheese'];

      const UNIQUE_IDOL_REVIEWS = [
        "Trà sữa đậm vị, béo ngậy chuẩn gu! Cả nhóm NOVA7 ai cũng mê 💜",
        "Uống một ngụm là nạp đầy năng lượng cho buổi tập vũ đạo ✨",
        "Trà thơm dịu, trân châu dẻo mềm siêu ngon. 10/10 điểm ⭐",
        "Lần đầu du lịch Việt Nam được thử ly trà sữa ngon xuất sắc thế này!",
        "Quán nhỏ xinh xắn, trà sữa thơm lừng vị trà tự nhiên 🌸",
        "Trân châu hoàng kim dai giòn sần sật, béo ngậy vừa miệng!",
        "Uống mát lạnh giải nhiệt sau ngày quay phim vất vả, tuyệt vời!",
        "Vị trà đậm đà, đường đá vừa khéo. Lần sau sẽ lại tới! ❤️",
        "Trà sữa vị thanh nhẹ, thơm nồng mùi hoa nhài rất dễ chịu.",
        "Chủ quán phục vụ rất có tâm, trà sữa 5 sao không có nhưng!",
        "本当に美味しい！甘さも控えめでトッピングがもちもち 💕 (Ngon thật sự! Độ ngọt vừa phải, trân châu dẻo dai 💕)",
        "撮影後の疲れた体に染みる美味しさ！また絶対来ます ✨ (Vị ngon thấm đượm sau buổi quay mệt mỏi! Nhất định sẽ quay lại ✨)",
        "ベトナムで食べた中で一番美味しいミルクティーです 🌸 (Đây là ly trà sữa ngon nhất mình từng uống ở Việt Nam 🌸)",
        "見た目も可愛くて味も最高！ファンのみんなにも教えなきゃ 💖 (Nhìn đẹp mắt mà vị ngon đỉnh cao! Phải khoe với các fan ngay 💖)",
        "お茶の香りが豊かでフォームチーズが濃厚！大満足です ⭐ (Trà thơm lừng kết hợp foam cheese béo ngậy! Siêu hài lòng ⭐)",
        "お店の雰囲気も素敵でミルクティーも絶品！5つ星です 🎀 (Bầu không khí quán đáng yêu, trà sữa ngon tuyệt cú mèo! 5 sao 🎀)",
        "タピオカがモチモチで最高に美味しい！リピート確定 🍮 (Trân châu dẻo dai ngon xỉu! Chắc chắn sẽ ủng hộ dài dài 🍮)",
        "一口飲んだ瞬間に幸せな気分になりました！感謝です 🥰 (Uống một ngụm là thấy hạnh phúc tràn ngập ngay! Cảm ơn quán 🥰)",
        "冷たくて濃厚で最高のリフレッシュになりました ✨ (Trà mát lạnh béo ngậy là lựa chọn giải khát tuyệt vời nhất ✨)",
        "一口でファンになりました！またベトナムに来たら寄ります 🍓 (Mới uống một ngụm là thành fan luôn! Đến VN sẽ ghé tiếp 🍓)",
        "Trà sữa đậm vị như lời rap, uống một ngụm là thấy bình yên giữa xô xát phố thị 🎤🌿",
        "Bigcityboy nhưng vẫn nghiện vị trà sữa béo ngậy ngọt ngào này 🌹🔥",
        "Flow trà sữa đỉnh đét, trân châu giòn sần sật uống là dính liền 💯",
        "Queen of Rap duyệt ly này! Vị trà đậm chất, hậu vị ngọt thanh chuẩn bài 💋👑",
        "Diss ai thì diss chứ trà sữa quán này ngon quá không diss nổi 5★ 🔥",
        "Pha chế chuẩn melody, nốt trầm vị trà nốt bổng vị sữa ngon xỉu 🎵",
        "Xịn đét không cần bàn! Làm thêm ly nữa x3 năng lượng đi diễn luôn ⚡🎤",
        "Giao diện ly xinh xỉu mà chất lượng bên trong slay hết nấc 💋✨",
        "Admin ghé thăm quán, trà sữa ngon tuyệt cú mèo! 🌟👑",
        "Ngủ một mình nhưng trà sữa phải uống 2 ly mới đã. 10/10 nha quán 🤩🔥"
      ];

      starsList.forEach((st, idx) => {
        const revText = (st.n && st.n.includes('LƯỢNG NGUYỄN')) ? "Trà quá ngon, sẽ ủng hộ dài dài" : UNIQUE_IDOL_REVIEWS[idx % UNIQUE_IDOL_REVIEWS.length];
        const b = bases[idx % bases.length];
        const tp = [topsList[idx % topsList.length]];

        S.reviews.unshift({
          s: 5,
          st: idx,
          n: st.n,
          tg: st.t,
          t: revText,
          k: 'mod_star_' + idx + '_' + Math.random(),
          d: S.day,
          o: false,
          b: b,
          sz: 'L',
          tp: tp
        });
      });

      commitState(`⭐ Đã thêm ${starsList.length} đánh giá 5★ từ dàn Idol JAV, Rapper VN & Siêu Sao!`);
    };

    const updateAutoServeBtn = () => {
      const btn = document.getElementById('btn-auto-serve');
      if (!btn) return;
      btn.innerText = `🤖 Tự Động Pha & Giao (${config.autoServe ? 'ĐANG BẬT' : 'ĐANG TẮT'})`;
      btn.className = 'tts-act-btn ' + (config.autoServe ? 'success' : 'pri');
    };

    const autoServeBtn = document.getElementById('btn-auto-serve');
    if (autoServeBtn) {
      updateAutoServeBtn();
      autoServeBtn.onclick = () => {
        config.autoServe = !config.autoServe;
        saveConfig();
        const S = getS();
        if (S) {
          S.upg = S.upg || {};
          if (config.autoServe) {
            S.upg.robot = true;
            S.upg.staffOn = true;
            S.upg.staff1 = false;
            S.upg.staff2 = false;
            S.upg.staff3 = false;
            if (S.online && (!S.tablets || S.tablets < 1)) {
              S.tablets = 1;
            }
          } else {
            S.upg.robot = false;
            S.upg.staffOn = false;
          }
          commitState(
            config.autoServe
              ? '🤖 Đã BẬT Robot tự động pha chế, dán nắp & giao đơn!'
              : '🔴 Đã TẮT Robot tự động pha chế!'
          );
        } else {
          modToast(
            config.autoServe
              ? '🤖 Đã BẬT Robot tự động pha chế!'
              : '🔴 Đã TẮT Robot tự động pha chế!',
            config.autoServe ? 'success' : 'warn'
          );
        }
        updateAutoServeBtn();
      };
    }

    document.getElementById('btn-skip-day').onclick = () => {
      const S = getS();
      if (!S) return;
      S.day++;
      if (getH().rollDay) getH().rollDay(S.day);
      commitState(`⏩ Đã nhảy sang Ngày ${S.day}!`);
    };

    const updateSuperstarBtn = () => {
      const btn = document.getElementById('btn-ev-superstars');
      if (!btn) return;
      btn.innerText = `🌟 Bão Siêu Sao (${config.superstarMode ? 'BẬT' : 'TẮT'})`;
      btn.className = 'tts-act-btn ' + (config.superstarMode ? 'success' : 'pri');
    };

    const superstarBtn = document.getElementById('btn-ev-superstars');
    if (superstarBtn) {
      updateSuperstarBtn();
      superstarBtn.onclick = () => {
        config.superstarMode = !config.superstarMode;
        saveConfig();
        updateSuperstarBtn();
        modToast(
          config.superstarMode
            ? '🌟 Đã BẬT Bão Siêu Sao ghé thăm quán liên tục!'
            : '🔴 Đã TẮT Bão Siêu Sao!',
          config.superstarMode ? 'success' : 'warn'
        );
      };
    }

    // Sự kiện thời tiết
    document.querySelectorAll('[data-ev]').forEach((btn) => {
      btn.onclick = () => {
        const evId = btn.dataset.ev;
        const S = getS();
        if (!S) return;
        S.ev = { id: evId };
        if (evId === 'trend') S.ev.k = 'tra';
        if (evId === 'sale') S.ev.k = 'matcha';
        commitState(`🌤️ Đã đổi sự kiện hôm nay: ${btn.innerText.trim()}`);
      };
    });
  }

  // Bão Siêu Sao ghé thăm liên tục khi bật superstarMode
  setInterval(() => {
    if (config.superstarMode) {
      const R = getR();
      if (R && R.running) {
        R.starPend = true;
      }
    }
  }, 200);

  // Khởi động
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initModUI();
      applyDynamicMods();
    });
  } else {
    initModUI();
    applyDynamicMods();
  }
})();
