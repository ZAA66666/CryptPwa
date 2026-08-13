/* =====================================================================
 * 多语言字典（i18n）
 * 支持：简体中文(zh) / English(en)；"跟随系统"由 settings.js 解析为二者之一。
 * data-i18n 属性：纯文本标签，用 textContent 填充。
 * 法律/说明页：含 HTML，由 settings.js 用 innerHTML 填充。
 * ===================================================================== */
/* 本项目 GitHub 仓库（Crypto-pwa，作者 ZAA66666）。 */
const GITHUB_REPO = "https://github.com/ZAA66666/Crypto-pwa";
/* 当前版本号（用于“检测更新”对比 GitHub Releases） */
const APP_VERSION = "1.0.0";
window.I18N = {
  zh: {
    /* 顶栏 / 标签 */
    appTitle: "加解密工具箱",
    appSub: "哈希 · 编/解码 · 加/解密 · 非对称加/解密 · 二维码/条形码 · JSON · Crontab · 随机文本",
    "tab.home": "主页", "tab.hash": "哈希", "tab.enc": "编/解码", "tab.sym": "加/解密",
    "tab.asym": "非对称加/解密", "tab.qr": "二维码", "tab.guide": "教程",
    "set.gear": "设置",

    /* 主页 */
    "home.brand": "加解密工具箱 · 版本 1.0",
    "home.greet": "这是一个完全在您手机/电脑浏览器本地运行的加解密工具箱（PWA），用于学习与实践加解密、编码、二维码等常见操作。",
    "tool.hash": "哈希", "tool.enc": "编/解码", "tool.sym": "加/解密",
    "tool.asym": "非对称加/解密", "tool.qr": "二维码/条形码", "tool.guide": "教程", "tool.json": "JSON", "tool.sm2": "SM2", "tool.cron": "Crontab", "tool.rand": "随机文本",
    "home.recent": "最近使用", "home.clear": "清空",
    "home.empty": "还没有记录，去用用上面的工具吧～",
    "home.tapBack": "点击回到该功能",
    "ui.expand": "展开查看全文", "ui.full": "全屏编辑", "ui.clear": "清空", "ui.done": "完成",

    /* 哈希 */
    "hash.in": "输入文本", "hash.algo": "算法", "hash.key": "密钥（HMAC 需要）",
    "hash.btn": "计算哈希", "hash.out": "结果（十六进制）", "copy": "复制结果",

    /* 编码 */
    "enc.in": "输入", "enc.mode": "方式", "enc.imgLabel": "图片转 Base64（可选）",
    "enc.imgBtn": "图片 → Base64", "enc.run": "执行", "enc.out": "结果",
    "enc.b64": "Base64", "enc.hex": "Hex", "enc.url": "URL", "enc.encode": "编码", "enc.decode": "解码",
    "enc.b32": "Base32", "enc.b58": "Base58", "enc.unicode": "Unicode", "enc.jwt": "JWT",
    "enc.okEnc": "✅ 编码完成", "enc.okDec": "✅ 解码完成", "enc.fail": "❌ 处理失败：", "enc.empty": "请输入要编码/解码的内容",
    "ph.hashIn": "要计算哈希的文本，如 hello", "ph.encIn": "要编码或解码的内容（支持中文）",
    "ph.symIn": "加密时填明文；解密时填 Base64 密文", "ph.rsaIn": "加密填明文；解密填 Base64 密文；签名填待签名文本",
    "ph.hashKey": "HMAC 密钥", "ph.symKey": "如：1234567890123456", "ph.symIv": "CBC/CTR/CFB/OFB 模式必填",
    "ph.rsaMsg": "验签时填写原始消息", "ph.rsaPub": "粘贴对方公钥", "ph.rsaPriv": "粘贴自己私钥",
    "ph.qrIn": "如：https://example.com", "ph.result": "结果将显示在这里", "ph.scanResult": "识别结果",
    "ph.bcIn": "如：123456789012 / ABC-123",
    "ph.jsonIn": "粘贴或输入 JSON，如 {\"name\":\"Tom\"}", "ph.jsonPath": "键路径，如 user.name 或 list.0", "ph.jsonCode": "生成的代码将显示在这里",
    "hist.hash": "哈希", "hist.sym": "加/解密", "hist.qr": "二维码", "hist.json": "JSON", "hist.bc": "条形码",
    "hist.gen": "生成", "hist.scan": "扫描", "hist.imgB64": "图片→Base64",
    /* JSON 工具 */
    "ph.json": "JSON 工具",
    "json.tabFmt": "格式化", "json.tabExtract": "提取代码", "json.tabKv": "键值编辑",
    "json.input": "JSON 内容（可直接编辑）",
    "json.format": "格式化", "json.minify": "压缩", "json.validate": "校验",
    "json.output": "结果",
    "json.fieldPath": "键路径（如 user.name 或 list.0）",
    "json.lang": "生成代码语言",
    "json.genCode": "生成提取代码",
    "json.codeOut": "提取代码",
    "json.kvHint": "逐行编辑键与值，选择值类型后一键生成 JSON；也可从格式化区导入现有 JSON。",
    "json.kvAdd": "+ 添加一行", "json.kvImport": "从格式化区导入", "json.kvGen": "生成 JSON",
    "json.kvTpl": "＋ 模板", "json.tplTitle": "选择模板", "json.tplRandom": "🎲 随机示例", "json.tplTemplate": "📋 JSON 模板",
    "json.ok": "合法 JSON", "json.invalid": "JSON 语法错误", "json.notFound": "未找到该路径",
    "json.emptyKey": "存在空键，已跳过", "json.imported": "已导入 N 行", "json.copied": "已复制",
    "hist.emptyTip": "没有使用记录", "hist.clearConfirm": "确定清空所有使用记录？",

    /* Crontab 定时表达式 */
    "cron.expr": "表达式（5 段：分 时 日 月 周）", "cron.parse": "解析 / 校验", "cron.next": "接下来 5 次执行",
    "cron.example": "常用示例", "cron.how": "怎么写 Cron 表达式",
    "cron.fMin": "分钟（0-59）", "cron.fHour": "小时（0-23）", "cron.fDay": "日（1-31）", "cron.fMon": "月（1-12）", "cron.fDow": "星期（0-7，0/7=周日）",
    "cron.tplMin": "每分钟", "cron.tplHour": "每小时整点", "cron.tplDaily830": "每天 8:30", "cron.tplMon900": "每周一 9:00", "cron.tplMonthly1": "每月 1 号", "cron.tplNoon": "每天中午 12:00", "cron.tplWorkday": "每工作日 9:00",
    "cron.wild": "代表“每”一个单位（如 * * * * * = 每分钟）",
    "cron.step": "步长，如 */15 表示每 15 分钟、0/15 即 0,15,30,45 分",
    "cron.list": "列表，如 1,15,30 表示第 1、15、30 分钟",
    "cron.range": "区间，如 9-17 表示 9 点到 17 点",
    "cron.bad": "表达式格式不正确：", "cron.ok": "表达式有效", "cron.none": "（无）", "cron.invalidField": "第", "cron.badFields": "需要 5 段（分 时 日 月 周）", "cron.noRun": "未来 6 年内没有匹配的时间",
    /* 随机文本生成 */
    "rand.str": "随机字符串", "rand.fake": "随机虚假数据", "rand.charset": "字符范围", "rand.digit": "数字", "rand.lower": "小写字母",
    "rand.upper": "大写字母", "rand.special": "特殊符号", "rand.custom": "自定义字符", "rand.len": "长度（字符数）", "rand.count": "生成数量",
    "rand.regex": "正则约束（可选，生成结果需匹配）", "rand.gen": "生成", "rand.copy": "复制", "rand.out": "结果",
    "rand.presets": "快捷生成常用格式", "rand.pName": "姓名", "rand.pEmail": "邮箱", "rand.pPhone": "手机号", "rand.pId": "身份证号",
    "rand.pAddr": "地址", "rand.pCompany": "公司名", "rand.pUuid": "UUID", "rand.pUrl": "网址", "rand.pBank": "银行卡号", "rand.pColor": "颜色值", "rand.pDate": "日期",
    "rand.regexFail": "未能在 500 次内生成匹配正则的内容（请放宽约束）",
    "rand.noCharset": "请至少选择一种字符范围或填写自定义字符", "rand.regexBad": "正则无效：",

    /* 对称 */
    "sym.algo": "算法", "sym.key": "密钥", "symFill": "密码本",
    "sym.catSym": "对称加密", "sym.catAsym": "非对称加密",
    "sym.randKey": "随机密钥", "sym.randIv": "随机IV",
    "sym.mode": "分组模式", "sym.iv": "初始向量 IV", "sym.in": "输入",
    "sym.encrypt": "加密", "sym.decrypt": "解密", "sym.out": "结果",
    "sym.keySize": "密钥长度",

    /* 非对称 */
    "asym.gen": "生成 RSA 密钥对 (2048)", "asym.pub": "公钥 (PUBLIC KEY)",
    "asym.priv": "私钥 (PRIVATE KEY)", "asym.op": "操作", "asym.in": "输入",
    "asym.msg": "验签原文", "asym.run": "执行", "asym.out": "结果",
    "asym.keys": "密钥", "asym.genTitle": "RSA 密钥对 (2048)",
    "asym.genHint": "已生成，可复制或保存。私钥请妥善保管，切勿泄露。",
    "asym.hint": "RSA 需运行在 https 或 localhost 环境；2048 位单次加密上限约 190 字节。",
    "copyPub": "复制公钥", "copyPriv": "复制私钥",
    "asym.autoGen": "已为你生成新的 RSA 密钥对（2048 位）", "asym.reGen": "重新生成",
    "asym.keyReady": "已生成密钥对（2048 位）",
    "asym.vault": "密码本", "asym.fillVault": "填入密码本", "asym.saveVault": "保存到密码本",
    "rsa.viewKeys": "查看/修改密钥对", "rsa.viewTitle": "查看/修改密钥对", "rsa.hideKeys": "隐藏秘钥内容", "asym.fromVaultPair": "已从密码本选择：{name} 密钥对", "asym.fromVaultPub": "已从密码本选择：{name}（公钥）",
    "rsa.algoRsa": "RSA", "rsa.algoSm2": "SM2 国密",
    "tool.sm2": "SM2", "ph.sm2": "SM2", "sm2.pub": "公钥（04 开头，130 位十六进制）", "sm2.priv": "私钥（64 位十六进制）",
    "sm2.keyReady": "已生成密钥对", "sm2.hint": "SM2 国密非对称算法，密文格式 C1C3C2（与 sm-crypto 一致）。密钥均为十六进制，公钥 130 位、私钥 64 位。",
    "ph.sm2In": "加密填明文；解密填十六进制密文；签名填待签名文本", "ph.sm2Pub": "04 开头的 130 位十六进制公钥", "ph.sm2Priv": "64 位十六进制私钥",
    "rsa.pairSuffix": " RSA 秘钥", "rsa.importDefault": "导入的RSA秘钥",
    "rsa.badgeExt": "外", "rsa.rename": "改名", "rsa.sidePub": "公钥", "rsa.sidePriv": "私钥",

    /* 二维码 */
    "qr.in": "内容（文本 / 网址 / 任意字符串）", "qr.ec": "纠错等级",
    "qr.gen": "生成二维码", "qr.out": "二维码", "qr.dl": "下载 SVG",
    "qr.tabQr": "二维码",
    "bc.tab": "条形码", "bc.in": "内容（条形码编码的数据）", "bc.fmt": "编码格式",
    "bc.showVal": "显示文字", "bc.color": "线条颜色", "bc.bg": "背景色", "bc.height": "高度",
    "bc.gen": "生成条形码", "bc.out": "条形码", "bc.dl": "下载 SVG", "bc.err": "无法生成：",
    "qr.scan": "扫描二维码", "qr.scanTip": "将二维码对准取景框", "qr.scanOk": "识别成功",
    "qr.noCam": "此环境不支持摄像头，请改用“从相册选择”", "qr.camFail": "无法打开摄像头：", "qr.scanNone": "未识别到二维码，换一张试试",
    "qr.scanUpload": "从相册选择", "qr.scanStop": "停止",

    /* 页脚 */
    "footer": "本工具用于学习与实践。MD5、DES、RC4、ECB 等已不安全，请勿用于保护真实机密。",

    /* 历史分类徽章 & 操作名 */
    "cat.hash": "哈希", "cat.enc": "编/解码", "cat.sym": "加/解密", "cat.rsa": "非对称加/解密", "cat.qr": "二维码", "cat.json": "JSON", "cat.generic": "通用", "cat.cron": "Crontab", "cat.rand": "随机文本",
    "op.encrypt": "加密", "op.decrypt": "解密", "op.sign": "签名", "op.verify": "验签",

    /* 设置框架 */
    "set.title": "设置", "set.back": "返回",
    "set.about": "关于", "set.privacy": "隐私政策", "set.terms": "用户协议",
    "set.security": "安全条款", "set.personal": "个人信息", "set.common": "密码本", "set.sync": "数据备份与同步",
    "set.theme": "主题", "set.display": "显示设置", "set.about2": "关于", "set.extcall": "外部调用与分享", "set.storage": "设置路径", "set.exp": "实验性",
    "set.grpGeneral": "通用设置", "set.grpData": "数据隐私", "set.grpPrivacy": "隐私与条款", "set.dataEnc": "数据加密", "enc.on": "已开启数据加密，密码本将以密文保存 🔒", "enc.off": "已关闭数据加密，密码本将以明文保存",

    /* 主题 */
    "theme.title": "主题", "theme.system": "跟随设备", "theme.light": "浅色", "theme.dark": "深色",
    /* 莫奈取色（动态强调色） */
    "accent.title": "强调色 · 莫奈取色", "accent.pick": "自定义取色", "accent.reset": "恢复默认",

    /* 功能面板顶部标题（返回键旁） */
    "ph.hash": "哈希", "ph.enc": "编/解码", "ph.sym": "加/解密", "ph.asym": "非对称加/解密", "ph.sm2": "SM2",
    "ph.qr": "二维码 / 条形码", "ph.guide": "使用教程", "ph.incoming": "外部内容", "ph.cron": "Crontab 定时表达式", "ph.rand": "随机文本生成",

    /* RSA 保存到文件 */
    "save.pub": "保存公钥", "save.priv": "保存私钥", "save.empty": "请先生成或粘贴密钥再保存",
    "rsa.toVault": "保存到密码本", "rsa.saveFile": "保存到文件",
    "rsa.nameTitle": "保存密钥文件", "rsa.nameHint": "将生成两个文件：<名称>_public.pem 与 <名称>_private.pem", "rsa.nameOk": "保存",
    "rsa.save": "保存", "rsa.saveTo": "保存到", "rsa.segVault": "密码本", "rsa.segFile": "文件",
    "vp.rsaPub": "RSA 公钥",

    /* 文件保存路径设置 */
    "storage.title": "内容保存路径",
    "storage.hint": "RSA 密钥等「保存到文件」时的默认路径（如 sdcard/CrytoPwa）。受浏览器限制无法强制写入任意目录：Android Chrome 安装为 App 后可弹出位置选择；其它浏览器将按此名称下载到默认文件夹。",
    "storage.locHint": "本地生成的加/解密、编/解码等结果数据，会保存到上方设置的路径下；备份文件同理。",
    "storage.pick": "选择文件夹", "storage.reset": "恢复默认",
    "storage.pickFail": "选择失败：", "storage.pickUnsupported": "当前浏览器不支持直接选目录，请手动输入路径。",
    "storage.saved": "已保存默认保存路径",

    /* 外部内容选择器（URL Scheme / Intent / 系统分享） */
    "inc.title": "外部内容", "inc.from": "收到内容", "inc.none": "（无内容）",
    "inc.pickImg": "选择图片文件", "inc.quick": "快捷编码", "inc.encrypt": "快捷加密",
    "inc.hash": "哈希", "inc.other": "其他",
    "inc.b64enc": "Base64 编码", "inc.b64dec": "Base64 解码", "inc.hexenc": "Hex 编码", "inc.urlenc": "URL 编码",
    "inc.aes": "AES 加密", "inc.des": "DES 加密", "inc.rsa": "RSA 加密",
    "inc.md5": "MD5", "inc.sha256": "SHA-256", "inc.imgb64": "图片 → Base64", "inc.qr": "生成二维码",

    /* 外部调用 / 分享接入（URL Scheme / Intent / 系统分享） */
    "ext.title": "外部调用与分享", "exp.title": "实验性", "exp.callbackTitle": "外部回调（插件用法）", "exp.hint": "作为插件被外部调用时（可传入文本 / JSON / 图片），本应用处理完可生成回调数据返回给调用方。", "exp.input": "要回调的数据（默认取外部传入内容）", "exp.genBtn": "生成回调数据", "exp.result": "回调数据（JSON）", "exp.schemeTitle": "回调地址（URL Scheme）", "exp.intentTitle": "Android Intent 示例", "exp.copy": "复制", "exp.noteTitle": "可行性说明", "exp.note": "当前为纯网页 PWA，浏览器无法直接把数据写回其它 App。支持两种方式：①调用方通过 URL Scheme / Intent 携带回调地址，本应用把结果编码进该地址后跳回；②直接复制结果手动粘贴回原应用。若以后打包为原生壳（WebView + JS Bridge，如 Capacitor），可实现真正自动回调。",
    "ext.text":
      '<h3>1. 系统分享（分享面板）</h3>' +
      '<p>在浏览器、文件管理器等里“分享”文字或网址，选择本工具（需已安装为 PWA），会自动进入「外部内容」选择器，让你挑选编码 / 加密 / 二维码等处理方式。</p>' +
      '<h3>2. URL Scheme 深链</h3>' +
      '<p>在地址栏或别的 App 打开以下链接即可直接带入内容：</p>' +
      '<p><code>crypto-pwa://?text=要处理的内容</code></p>' +
      '<p>带处理方式的深链（自动跳到对应功能）：</p>' +
      '<p><code>https://你的域名/?text=你好&amp;tab=sym&amp;algo=AES&amp;mode=CBC</code></p>' +
      '<p><code>https://你的域名/?text=hello&amp;tab=enc&amp;method=Base64</code></p>' +
      '<p><code>https://你的域名/?text=https://example.com&amp;tab=qr</code></p>' +
      '<h3>3. Android Intent（分享纯文本）</h3>' +
      '<p>系统会以 <code>intent://…#Intent;scheme=crypto-pwa;end</code> 调起本工具；已注册接收 <code>text/plain</code>，自动解析其中的文字并进入对应功能。</p>' +
      '<h3>4. 参数说明</h3><ul>' +
      '<li><code>text</code>：要处理的文字 / 网址（必填）</li>' +
      '<li><code>tab</code>：sym（对称）/ enc（编码）/ hash（哈希）/ rsa（非对称）/ qr（二维码）</li>' +
      '<li><code>algo</code>：算法，如 AES / DES / RSA / MD5 / SHA-256</li>' +
      '<li><code>mode</code>：分组模式 CBC / CTR / CFB / OFB（仅对称）</li></ul>' +
      '<h3>支持的处理方式</h3><ul>' +
      '<li>编码：Base64 / Hex / URL</li>' +
      '<li>加密：AES / DES / RSA</li>' +
      '<li>哈希：MD5 / SHA-256</li>' +
      '<li>其它：图片转 Base64、生成二维码</li></ul>',
    "ext.auto": "收到分享内容时自动打开选择器",
    "ext.copyExample": "复制示例链接",

    /* 显示设置 */
    "display.title": "显示设置", "disp.lang": "语言", "disp.font": "字体大小", "disp.immersive": "沉浸式状态栏",
    "lang.system": "跟随系统", "lang.zh": "简体中文", "lang.en": "English (US)",
    "font.small": "小", "font.normal": "标准", "font.large": "大", "font.xlarge": "特大",

    /* 密码本 */
    "common.title": "密码本", "common.add": "＋ 新增", "common.empty": "还没有保存的密码本。保存后，在加/解密 / 非对称加/解密 的密钥框旁点「密码本」即可快速填入。",
    "common.label": "名称", "common.value": "密码 / 密钥", "common.save": "保存", "common.cancel": "取消", "common.del": "删除", "common.master": "主密码", "common.masterHint": "用于加密本地保存的密码（AES-256-CBC），忘记将无法恢复。", "common.setMaster": "设置主密码", "common.changeMaster": "修改主密码", "common.masterPlaceholder": "输入主密码", "common.confirmMaster": "确认主密码", "common.lock": "锁定", "common.unlock": "解锁", "common.unlockNow": "解锁", "common.lockedTip": "密码库已加密，输入主密码解锁后使用。", "common.masterMismatch": "两次输入不一致", "common.masterEmpty": "请输入主密码", "common.vaultReady": "密码库已就绪（密文存储，仅本机）", "common.export": "导出备份(JSON)", "common.import": "导入备份(JSON)", "common.exportDone": "已导出加密备份文件。", "common.importDone": "已导入备份。", "common.importFail": "失败：文件格式错误或主密码不对。", "vault.slot1": "库 1", "vault.slot2": "库 2", "vault.slot3": "库 3", "vault.slotHint": "密码本共有 3 套密码库（库 1 / 库 2 / 库 3）：在密码本页面顶部切换库号，即可查看对应库保存的密码；之后保存的密码/密钥会存入当前所选库。", "lang.import": "导入语言包", "lang.importHint": "选择 JSON 语言包文件（格式：{\"lang\": \"xx\", \"name\": \"语言名\", \"data\": { 翻译键: 译文 }}）。可用项目中的「中文语言包_zh.json」模板翻译后导入。", "lang.importDone": "语言包已导入，可在语言列表中切换。", "lang.importFail": "导入失败：文件格式不正确或缺少必要字段。", "sync.title": "数据备份与同步", "sync.webdav": "WebDAV", "sync.url": "服务器地址", "sync.user": "账号", "sync.pass": "密码", "sync.saveCfg": "保存配置", "sync.backup": "备份到 WebDAV", "sync.restore": "从 WebDAV 恢复", "sync.backupDone": "已备份到 WebDAV。", "sync.restoreDone": "已从 WebDAV 恢复。", "sync.fail": "操作失败：", "sync.cfgHint": "需服务器支持 WebDAV（如 Nextcloud、群晖、坚果云），并允许跨域(CORS)。", "sync.needMaster": "请先在「密码本」中设置并解锁主密码。", "sync.quick": "快捷填入服务器地址", "sync.quickJgy": "坚果云 dav.jianguoyun.com/dav/", "sync.quickNc": "Nextcloud remote.php/dav/files/", "sync.quickSyn": "群晖 /webdav", "sync.exportLocal": "导出本地备份", "sync.importLocal": "从本地导入", "sync.exportDone": "已导出本地备份文件。", "sync.importDone": "已从本地导入备份。", "sync.importFail": "导入失败：文件格式错误或主密码不对。", "sync.test": "检测连接", "sync.testing": "检测中…", "sync.testOk": "连接正常 ✅", "sync.testFail": "连接失败：", "sync.needUrl": "请先填写服务器地址", "exp.title": "导出方式", "exp.enc": "🔒 加密保存", "exp.plain": "📄 明文保存", "exp.locked": "请先解锁密码本再导出", "exp.done": "已导出 CryptoData.json",


    /* 关于（已合并“关于软件说明”） */
    "about.title": "关于",
    "about.update": "检测更新", "about.checking": "检查中…", "about.latest": "已是最新版本", "about.found": "发现新版本", "about.open": "前往 GitHub 查看", "about.fail": "检查更新失败：", "about.ver": "版本",
    "about.text":
      '<p>这是一个<strong>完全在您手机/电脑浏览器本地运行</strong>的加解密工具箱（PWA），用于学习与实践加解密、编码、二维码等常见操作。</p>' +
      '<h3>它能做什么</h3><ul>' +
      '<li>哈希：MD5 / SHA-1/224/256/384/512 / SHA-3 / RIPEMD-160 / HMAC</li>' +
      '<li>编码：Base64 / Hex / URL，以及图片转 Base64</li>' +
      '<li>加/解密：AES / DES / 3DES / Blowfish / RC4 / Rabbit</li>' +
      '<li>非对称加/解密：RSA / SM2（生成密钥、加密解密、签名验签）</li>' +
      '<li>二维码 / 条形码生成、最近使用记录、密码本、深色模式、多语言</li></ul>' +
      '<h3>项目源码</h3><p>本项目代码已同步至 GitHub，仓库名 <a href="' + GITHUB_REPO + '" target="_blank" rel="noopener">Crypto-pwa</a>。欢迎 Star / Fork / 提交 Issue。</p>' +
      '<h3>技术说明</h3><p>算法核心使用成熟的 <a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a> 库与浏览器原生 <a href="https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto</a>；二维码使用 <a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a>。所有计算均在本地完成，不依赖任何服务器。</p>' +
      '<h3>开源组件与引用位置</h3><ul>' +
      '<li><b><a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a></b>（MIT 许可）— 哈希与对称加密算法。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/crypto-js.js" target="_blank" rel="noopener">js/vendor/crypto-js.js</a>；用于「哈希」「编码（图片转 Base64 走其编解码）」「加/解密」面板。</li>' +
      '<li><b><a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a></b>（MIT 许可）— 二维码生成。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/qrcode-generator.js" target="_blank" rel="noopener">js/vendor/qrcode-generator.js</a>；用于「二维码 / 条形码」面板（<code>qr-btn</code> 调用其 <code>qrcode()</code>）。</li>' +
      '<li><b><a href="https://github.com/cozmo/jsQR" target="_blank" rel="noopener">jsQR</a></b>（Apache-2.0）— 摄像头扫码解码。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsqr.js" target="_blank" rel="noopener">js/vendor/jsqr.js</a>；用于「扫描二维码」。</li>' +
      '<li><b><a href="https://github.com/lindell/JsBarcode" target="_blank" rel="noopener">JsBarcode</a></b>（MIT 许可）— 条形码生成。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbarcode.all.min.js" target="_blank" rel="noopener">js/vendor/jsbarcode.all.min.js</a>；用于「条形码」。</li>' +
      '<li><b><a href="https://github.com/JuneAndGreen/sm-crypto" target="_blank" rel="noopener">sm-crypto</a></b>（MIT 许可）— SM2 国密算法。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/sm-crypto.esm.js" target="_blank" rel="noopener">js/vendor/sm-crypto.esm.js</a>（依赖已改引本地 <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbn.esm.js" target="_blank" rel="noopener">jsbn</a>）；用于「非对称加/解密 → SM2」。</li>' +
      '<li><b><a href="https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto API</a></b>（浏览器原生，无单独依赖）— RSA 密钥生成、加解密、签名验签。<br>引用位置：浏览器原生 <code>crypto.subtle</code>；用于「非对称加/解密 → RSA」，仅 https / localhost 可用。</li>' +
      '<li><b>本项目代码</b>（手写）— 界面、交互、历史记录、密码本、设置、主题与多语言均自行实现，未封装第三方 UI 框架。</li></ul>' +
      '<p>所有计算均在本地完成、可离线使用，不向任何服务器上传数据。</p>' +
      '<p><strong>加解密工具箱</strong> · 版本 ' + APP_VERSION + ' · <a href="' + GITHUB_REPO + '" target="_blank" rel="noopener">GitHub</a></p>',

    /* 隐私政策 */
    "privacy.title": "隐私政策",
    "privacy.text":
      '<p>本应用高度重视您的隐私。以下是我们的承诺：</p>' +
      '<h3>1. 本地运行，不上传</h3><p>本应用完全在您设备的浏览器中运行，<strong>不连接任何服务器，不上传任何数据</strong>。您的输入、密钥、明文、密文与结果均不会被发送出去。</p>' +
      '<h3>2. 我们不收集您的信息</h3><p>开发者无法、也<strong>不会收集</strong>您的任何输入内容、密钥或操作结果。</p>' +
      '<h3>3. 本地存储的数据</h3><ul>' +
      '<li>「最近使用」记录仅保存在本机浏览器的 localStorage，不上传；</li>' +
      '<li>「密码本」仅保存在本机，不上传；</li>' +
      '<li>主题、语言、字体等偏好同样仅存于本机。</li></ul>' +
      '<h3>4. 无追踪</h3><p>本应用没有广告、没有行为埋点、不接入任何第三方统计或追踪。</p>' +
      '<h3>5. 您的控制权</h3><p>您可以随时在「设置 → 密码本」中删除保存的密码，在「主页 → 最近使用 → 清空」中清除历史。</p>',

    /* 用户协议 */
    "terms.title": "用户协议",
    "terms.text":
      '<p>使用本应用即表示您同意以下条款：</p>' +
      '<h3>1. 合法使用</h3><p>您承诺仅将本工具用于合法、合规的学习与实践目的，不用于任何侵犯他人权益或违反法律法规的活动。</p>' +
      '<h3>2. 风险自担</h3><p>本工具按「现状」提供，用于教学与日常辅助。<strong>请勿用于保护真实机密信息</strong>（MD5、DES、RC4、ECB 等算法已被证明不安全）。</p>' +
      '<h3>3. 密钥责任</h3><p>您自行保管所用密钥/密码的安全，因密钥泄露或误用导致的后果由您自行承担。</p>' +
      '<h3>4. 免责声明</h3><p>开发者不对因使用本工具产生的任何直接或间接损失承担责任。</p>',

    /* 安全条款 */
    "security.title": "安全条款",
    "security.text":
      '<h3>1. 算法安全性提示</h3><ul>' +
      '<li>MD5、SHA-1、DES、3DES、RC4、ECB 等已被证明不安全，仅用于<strong>学习与非机密校验</strong>，请勿用于保护真实机密。</li>' +
      '<li>对称加密请优先使用 <strong>AES</strong> + CBC/CTR 等模式，并妥善保管密钥与 IV。</li>' +
      '<li>RSA 建议 2048 位及以上，用于加密小段数据或交换密钥。</li></ul>' +
      '<h3>2. 运行环境</h3><p>RSA 依赖浏览器原生 Web Crypto，仅在 <strong>https 或 localhost</strong> 环境可用；通过局域网 http 访问时该页面不可用。</p>' +
      '<h3>3. 使用建议</h3><ul>' +
      '<li>不要在公用、被监控或不可信的设备上输入真实密钥/明文；</li>' +
      '<li>本工具默认不存储您的对称密钥，除非您主动存入「密码本」；</li>' +
      '<li>离开时建议清除本地历史与密码本。</li></ul>',

    /* 个人信息 */
    "personal.title": "个人信息",
    "personal.text":
      '<h3>一、我们收集哪些信息</h3><p><strong>无。</strong>我们承诺不收集任何个人信息，不收集您的输入内容，不收集您的密钥或密码。</p>' +
      '<h3>二、权限说明（这些权限用来做什么）</h3><ul>' +
      '<li><strong>文件/存储读取</strong>：仅用于「图片转 Base64」时读取您<strong>主动选择</strong>的图片，读取后用于本地转换，不会上传。</li>' +
      '<li><strong>剪贴板</strong>：仅用于您点击「复制结果」时，把结果复制到剪贴板。</li>' +
      '<li><strong>网络</strong>：本应用默认<strong>离线</strong>运行；仅在您主动访问在线地址、或系统「分享」调起时才会联网。</li></ul>' +
      '<h3>三、数据存储位置</h3><p>所有数据（使用记录、密码本、偏好设置）都只保存在您<strong>本机浏览器</strong>（localStorage / 内存），<strong>不会上传到任何服务器</strong>。</p>' +
      '<h3>四、您的权利</h3><p>您可随时清除历史、删除密码本、或卸载/清除站点数据来彻底移除本地信息。</p>',

    /* 关于（旧 about2，已合并进 about，保留以防引用） */
    "about2.title": "关于",
    "about2.text":
      '<p><strong>加解密工具箱</strong> · 版本 1.0</p>' +
      '<p>一个本地优先的 PWA 加解密练习工具，适合学习加解密、编码、二维码等常见操作。</p>' +
      '<h3>使用的开源组件</h3><ul>' +
      '<li>crypto-js（哈希 / 对称加密，成熟可信）</li>' +
      '<li>qrcode-generator（二维码生成）</li>' +
      '<li>浏览器原生 Web Crypto（RSA）</li></ul>' +
      '<p>算法核心均来自成熟库，界面与交互逻辑为手写实现。</p>',

    /* 加密后保存提示（密码本） */
    "vp.title": "保存到密码本？",
    "vp.ask": "是否把这次用的密钥存进密码本？",
    "vp.method": "加密方式",
    "vp.pw": "密码 / 密钥",
    "vp.new": "新建并保存",
    "vp.name": "名称（如：我的 AES 密钥）",
    "vp.nameHint": "已按本次加密方式自动命名，可改成好记的名字",
    "vp.saved": "已保存",
    "vp.reveal": "显示",
    "vp.hide": "隐藏",
    "vp.fill": "填入",
    "vp.del": "删除",
    "vp.skip": "暂不保存",
    "vp.none": "还没有已保存的条目。",
    "paste": "粘贴", "vp.pasteOk": "已粘贴并应用 ✅", "vp.pasteBad": "剪贴板内容不符合该密钥格式", "vp.pasteDenied": "无法读取剪贴板（请检查浏览器权限）",
    "vp.book": " 密码本",
    "vp.generic": "通用",
    "vp.rsaPriv": "RSA 私钥",
    "common.askSave": "加密后询问保存到密码本",
    "common.savedOk": "已保存到密码本。"
  },

  en: {
    appTitle: "Crypto Toolbox",
    appSub: "Hash · Encode/Decode · Encrypt/Decrypt · Asymmetric · QR/Barcode · JSON · Crontab · Random",
    /* Crontab */
    "cron.expr": "Expression (5 fields: min hour day month weekday)", "cron.parse": "Parse / Validate", "cron.next": "Next 5 runs",
    "cron.example": "Common examples", "cron.how": "How to write a Cron expression",
    "cron.fMin": "Minute (0-59)", "cron.fHour": "Hour (0-23)", "cron.fDay": "Day (1-31)", "cron.fMon": "Month (1-12)", "cron.fDow": "Weekday (0-7, 0/7=Sun)",
    "cron.tplMin": "Every minute", "cron.tplHour": "Every hour", "cron.tplDaily830": "Daily 8:30", "cron.tplMon900": "Mon 9:00", "cron.tplMonthly1": "1st of month", "cron.tplNoon": "Daily noon", "cron.tplWorkday": "Weekdays 9:00",
    "cron.wild": 'means "every" unit (e.g. * * * * * = every minute)',
    "cron.step": "step, e.g. */15 = every 15 min (0,15,30,45)",
    "cron.list": "list, e.g. 1,15,30 = minutes 1,15,30",
    "cron.range": "range, e.g. 9-17 = 9am to 5pm",
    "cron.bad": "Invalid expression: ", "cron.ok": "Valid expression", "cron.none": "(none)", "cron.invalidField": "field", "cron.badFields": "expected 5 fields (min hour day month weekday)", "cron.noRun": "no matching time within 6 years",
    /* Random text */
    "rand.str": "Random string", "rand.fake": "Fake data", "rand.charset": "Character set", "rand.digit": "Digits", "rand.lower": "Lowercase",
    "rand.upper": "Uppercase", "rand.special": "Special", "rand.custom": "Custom chars", "rand.len": "Length", "rand.count": "Count",
    "rand.regex": "Regex constraint (optional; output must match)", "rand.gen": "Generate", "rand.copy": "Copy", "rand.out": "Result",
    "rand.presets": "Quick presets", "rand.pName": "Name", "rand.pEmail": "Email", "rand.pPhone": "Phone", "rand.pId": "ID card",
    "rand.pAddr": "Address", "rand.pCompany": "Company", "rand.pUuid": "UUID", "rand.pUrl": "URL", "rand.pBank": "Bank card", "rand.pColor": "Color", "rand.pDate": "Date",
    "rand.regexFail": "Could not satisfy the regex in 500 tries (relax the constraint)",
    "rand.noCharset": "Pick a charset or fill custom chars", "rand.regexBad": "Invalid regex: ",
    "tab.home": "Home", "tab.hash": "Hash", "tab.enc": "Encode/Decode",
    "tab.sym": "Encrypt/Decrypt", "tab.asym": "Asymmetric", "tab.qr": "QR", "tab.guide": "Guide",
    "set.gear": "Settings",

    "home.greet": "Toolbox · Tap a feature below to use it",
    "home.brand": "Crypto Toolbox · v1.0",
    "tool.hash": "Hash", "tool.enc": "Encode/Decode", "tool.sym": "Encrypt/Decrypt",
    "tool.asym": "Asymmetric", "tool.qr": "QR / Barcode", "tool.guide": "Guide", "tool.json": "JSON", "tool.sm2": "SM2", "tool.cron": "Crontab", "tool.rand": "Random Text",
    "home.recent": "Recent", "home.clear": "Clear",
    "home.empty": "No records yet — go try the tools above～",
    "home.tapBack": "Tap to open this feature",
    "ui.expand": "Expand", "ui.full": "Fullscreen edit", "ui.clear": "Clear", "ui.done": "Done",

    "hash.in": "Input text", "hash.algo": "Algorithm", "hash.key": "Key (for HMAC)",
    "hash.btn": "Compute hash", "hash.out": "Result (hex)", "copy": "Copy result",

    "enc.in": "Input", "enc.mode": "Mode", "enc.imgLabel": "Image to Base64 (optional)",
    "enc.imgBtn": "Image → Base64", "enc.run": "Run", "enc.out": "Result",
    "enc.b64": "Base64", "enc.hex": "Hex", "enc.url": "URL", "enc.encode": "Encode", "enc.decode": "Decode",
    "enc.b32": "Base32", "enc.b58": "Base58", "enc.unicode": "Unicode", "enc.jwt": "JWT",
    "enc.okEnc": "✅ Encode done", "enc.okDec": "✅ Decode done", "enc.fail": "❌ Failed: ", "enc.empty": "Enter text to encode/decode",
    "ph.hashIn": "Text to hash, e.g. hello", "ph.encIn": "Content to encode/decode (Chinese supported)",
    "ph.symIn": "Plaintext to encrypt; Base64 ciphertext to decrypt", "ph.rsaIn": "Plaintext to encrypt; Base64 ciphertext to decrypt; message to sign",
    "ph.hashKey": "HMAC key", "ph.symKey": "e.g. 1234567890123456", "ph.symIv": "Required for CBC/CTR/CFB/OFB",
    "ph.rsaMsg": "Original message for verification", "ph.rsaPub": "Paste peer's public key", "ph.rsaPriv": "Paste your private key",
    "ph.qrIn": "e.g. https://example.com", "ph.result": "Result will show here", "ph.scanResult": "Recognized result",
    "ph.bcIn": "e.g. 123456789012 / ABC-123",
    "ph.jsonIn": "Paste or type JSON, e.g. {\"name\":\"Tom\"}", "ph.jsonPath": "Key path, e.g. user.name or list.0", "ph.jsonCode": "Generated code will show here",
    "hist.hash": "Hash", "hist.sym": "Encrypt/Decrypt", "hist.qr": "QR", "hist.json": "JSON", "hist.bc": "Barcode",
    "hist.gen": "Generate", "hist.scan": "Scan", "hist.imgB64": "Image→Base64",
    "hist.emptyTip": "No history yet", "hist.clearConfirm": "Clear all history?",
    /* JSON tool */
    "ph.json": "JSON Tools",
    "json.tabFmt": "Format", "json.tabExtract": "Extract code", "json.tabKv": "Key-Value",
    "json.input": "JSON content (editable)",
    "json.format": "Format", "json.minify": "Minify", "json.validate": "Validate",
    "json.output": "Result",
    "json.fieldPath": "Key path (e.g. user.name or list.0)",
    "json.lang": "Code language",
    "json.genCode": "Generate code",
    "json.codeOut": "Extraction code",
    "json.kvHint": "Edit keys and values row by row, pick a value type, then generate JSON; or import existing JSON from the Format tab.",
    "json.kvAdd": "+ Add row", "json.kvImport": "Import from Format", "json.kvGen": "Generate JSON",
    "json.kvTpl": "＋ Template", "json.tplTitle": "Choose a template", "json.tplRandom": "🎲 Random example", "json.tplTemplate": "📋 JSON template",
    "json.ok": "Valid JSON", "json.invalid": "JSON syntax error", "json.notFound": "Path not found",
    "json.emptyKey": "Empty key skipped", "json.imported": "Imported N rows", "json.copied": "Copied",

    "sym.algo": "Algorithm", "sym.key": "Key", "symFill": "Saved passwords",
    "sym.catSym": "Symmetric", "sym.catAsym": "Asymmetric",
    "sym.randKey": "Random key", "sym.randIv": "Random IV",
    "sym.mode": "Mode", "sym.iv": "IV", "sym.in": "Input",
    "sym.encrypt": "Encrypt", "sym.decrypt": "Decrypt", "sym.out": "Result",
    "sym.keySize": "Key length",

    "asym.gen": "Generate RSA Key Pair (2048)", "asym.pub": "Public Key (PUBLIC KEY)",
    "asym.priv": "Private Key (PRIVATE KEY)", "asym.op": "Operation", "asym.in": "Input",
    "asym.keys": "Keys", "asym.genTitle": "RSA Key Pair (2048)",
    "asym.genHint": "Generated — copy or save. Keep the private key safe, never leak it.",
    "asym.msg": "Original message (verify)", "asym.run": "Run", "asym.out": "Result",
    "copyPub": "Copy public key", "copyPriv": "Copy private key",
    "asym.hint": "RSA requires https or localhost; 2048-bit encrypts up to ~190 bytes per call.",
    "asym.autoGen": "A new RSA key pair (2048) has been generated for you", "asym.reGen": "Generate key pair",
    "asym.keyReady": "Key pair generated (2048-bit)",
    "asym.vault": "Password book", "asym.fillVault": "Fill from book", "asym.saveVault": "Import to book",
    "rsa.viewKeys": "View / Edit key pair", "rsa.viewTitle": "View / Edit key pair", "rsa.hideKeys": "Hide keys", "asym.fromVaultPair": "Selected from book: {name} key pair", "asym.fromVaultPub": "Selected from book: {name} (public key)",
    "rsa.algoRsa": "RSA", "rsa.algoSm2": "SM2",
    "tool.sm2": "SM2", "ph.sm2": "SM2", "sm2.pub": "Public key (starts with 04, 130 hex)", "sm2.priv": "Private key (64 hex)",
    "sm2.keyReady": "Key pair generated", "sm2.hint": "SM2 is China's national asymmetric cipher; ciphertext format C1C3C2 (matches sm-crypto). Keys are hex: public 130, private 64.",
    "ph.sm2In": "Plaintext to encrypt; hex ciphertext to decrypt; message to sign", "ph.sm2Pub": "130-hex public key starting with 04", "ph.sm2Priv": "64-hex private key",
    "rsa.pairSuffix": " RSA Key", "rsa.importDefault": "Imported RSA key",
    "rsa.badgeExt": "Ext", "rsa.rename": "Rename", "rsa.sidePub": "Public", "rsa.sidePriv": "Private",

    "qr.in": "Content (text / URL / any string)", "qr.ec": "Error correction",
    "qr.gen": "Generate QR", "qr.out": "QR code", "qr.dl": "Download SVG",
    "qr.tabQr": "QR code",
    "bc.tab": "Barcode", "bc.in": "Content (data to encode)", "bc.fmt": "Format",
    "bc.showVal": "Show text", "bc.color": "Line color", "bc.bg": "Background", "bc.height": "Height",
    "bc.gen": "Generate barcode", "bc.out": "Barcode", "bc.dl": "Download SVG", "bc.err": "Cannot generate: ",
    "qr.scan": "Scan QR", "qr.scanTip": "Aim the QR code at the frame", "qr.scanOk": "Decoded",
    "qr.noCam": "Camera not available here — use “Pick from album”", "qr.camFail": "Cannot open camera: ", "qr.scanNone": "No QR found — try another image",
    "qr.scanUpload": "Pick from album", "qr.scanStop": "Stop",

    "footer": "For learning & practice. MD5, DES, RC4, ECB, etc. are insecure — do not use them to protect real secrets.",

    "cat.hash": "Hash", "cat.enc": "Encode/Decode", "cat.sym": "Encrypt/Decrypt", "cat.rsa": "Asymmetric", "cat.qr": "QR", "cat.json": "JSON", "cat.generic": "General", "cat.cron": "Crontab", "cat.rand": "Random",
    "op.encrypt": "Encrypt", "op.decrypt": "Decrypt", "op.sign": "Sign", "op.verify": "Verify",

    "set.title": "Settings", "set.back": "Back",
    "set.about": "About", "set.privacy": "Privacy Policy", "set.terms": "Terms of Use",
    "set.security": "Security Notes", "set.personal": "Personal Info", "set.common": "Saved Passwords", "set.sync": "Backup & Sync",
    "set.theme": "Theme", "set.display": "Display", "set.about2": "About", "set.extcall": "External & Sharing", "set.storage": "Set path", "set.exp": "Experimental",
    "set.grpGeneral": "General", "set.grpData": "Data & Privacy", "set.grpPrivacy": "Privacy & Terms", "set.dataEnc": "Data encryption", "enc.on": "Encryption ON — passwords stored as ciphertext", "enc.off": "Encryption OFF — passwords stored as plain text",

    "theme.title": "Theme", "theme.system": "Follow device", "theme.light": "Light", "theme.dark": "Dark",
    "accent.title": "Accent · Monet color", "accent.pick": "Custom color", "accent.reset": "Reset",

    /* Feature panel titles (next to back button) */
    "ph.hash": "Hash", "ph.enc": "Encode/Decode", "ph.sym": "Encrypt/Decrypt", "ph.asym": "Asymmetric", "ph.sm2": "SM2",
    "ph.qr": "QR / Barcode", "ph.guide": "Guide", "ph.incoming": "Incoming", "ph.cron": "Crontab schedule", "ph.rand": "Random text",

    /* RSA save to file */
    "save.pub": "Save public key", "save.priv": "Save private key", "save.empty": "Generate or paste keys before saving",
    "rsa.toVault": "Save to password book", "rsa.saveFile": "Save to file",
    "rsa.nameTitle": "Save key files", "rsa.nameHint": "Two files will be created: <name>_public.pem and <name>_private.pem", "rsa.nameOk": "Save",
    "rsa.save": "Save", "rsa.saveTo": "Save to", "rsa.segVault": "Password book", "rsa.segFile": "File",
    "vp.rsaPub": "RSA Public Key",

    /* Save path setting */
    "storage.title": "Content save path",
    "storage.hint": "Default path for “Save to file” (e.g. sdcard/CrytoPwa). Browsers cannot force a directory: on Android Chrome installed as an app a location picker appears; other browsers download with this name.",
    "storage.locHint": "Results you generate locally (encrypt/decrypt, encode/decode, backups) are saved under the path above.",
    "storage.pick": "Pick folder", "storage.reset": "Reset to default",
    "storage.pickFail": "Pick failed: ", "storage.pickUnsupported": "This browser cannot pick a folder directly — please type the path manually.",
    "storage.saved": "Default save path saved",

    /* Incoming content chooser (URL Scheme / Intent / system share) */
    "inc.title": "Incoming", "inc.from": "Received", "inc.none": "(no content)",
    "inc.pickImg": "Pick image file", "inc.quick": "Quick encode", "inc.encrypt": "Quick encrypt",
    "inc.hash": "Hash", "inc.other": "Other",
    "inc.b64enc": "Base64 encode", "inc.b64dec": "Base64 decode", "inc.hexenc": "Hex encode", "inc.urlenc": "URL encode",
    "inc.aes": "AES encrypt", "inc.des": "DES encrypt", "inc.rsa": "RSA encrypt",
    "inc.md5": "MD5", "inc.sha256": "SHA-256", "inc.imgb64": "Image → Base64", "inc.qr": "Make QR",

    /* External & sharing (URL Scheme / Intent / system share) */
    "ext.title": "External & Sharing", "exp.title": "Experimental", "exp.callbackTitle": "External callback (plugin usage)", "exp.hint": "When called externally (text / JSON / image), this app can build a callback payload to hand back to the caller.", "exp.input": "Data to return (defaults to external input)", "exp.genBtn": "Generate callback data", "exp.result": "Callback payload (JSON)", "exp.schemeTitle": "Callback URL (URL Scheme)", "exp.intentTitle": "Android Intent example", "exp.copy": "Copy", "exp.noteTitle": "Feasibility note", "exp.note": "This is a pure-web PWA: the browser cannot write data back into another app directly. Two supported ways: ① the caller passes a callback URL via Scheme/Intent, and this app encodes the result into that URL and jumps back; ② copy the result and paste it manually. A native wrapper (WebView + JS Bridge, e.g. Capacitor) enables true auto-callback.",
    "ext.text":
      '<h3>1. System share (share sheet)</h3>' +
      '<p>Share text or a URL from a browser / file manager and pick this tool (must be installed as a PWA). It opens the “Incoming” chooser so you can pick encode / encrypt / QR, etc.</p>' +
      '<h3>2. URL Scheme</h3>' +
      '<p>Open in an address bar or another app: <br><code>crypto-pwa://?text=your text</code><br>Deep links with a target are also supported: <code>https://your-domain/?text=...&amp;tab=sym&amp;algo=AES</code></p>' +
      '<h3>3. Android Intent</h3>' +
      '<p>When sharing plain text, the system invokes via <code>intent://…</code>. This tool is configured to receive <code>text/plain</code> and parses the text automatically.</p>' +
      '<h3>Supported actions</h3><ul>' +
      '<li>Encode: Base64 / Hex / URL</li>' +
      '<li>Encrypt: AES / DES / RSA</li>' +
      '<li>Hash: MD5 / SHA-256</li>' +
      '<li>Other: image → Base64, make QR</li></ul>',
    "ext.auto": "Auto-open chooser when shared content arrives",
    "ext.copyExample": "Copy example link",

    "display.title": "Display", "disp.lang": "Language", "disp.font": "Font size", "disp.immersive": "Immersive status bar",
    "lang.system": "Follow system", "lang.zh": "简体中文", "lang.en": "English (US)",
    "font.small": "Small", "font.normal": "Normal", "font.large": "Large", "font.xlarge": "Extra large",

    "common.title": "Saved Passwords", "common.add": "＋ Add", "common.empty": "No saved passwords yet. After saving, tap “Saved passwords” next to the key field in Encrypt/Decrypt or Asymmetric to fill instantly.",
    "common.label": "Name", "common.value": "Password / Key", "common.save": "Save", "common.cancel": "Cancel", "common.del": "Delete", "common.master": "Master password", "common.masterHint": "Used to encrypt locally saved passwords (AES-256-CBC). If forgotten, data cannot be recovered.", "common.setMaster": "Set master password", "common.changeMaster": "Change master", "common.masterPlaceholder": "Enter master password", "common.confirmMaster": "Confirm password", "common.lock": "Lock", "common.unlock": "Unlock", "common.unlockNow": "Unlock", "common.lockedTip": "The vault is encrypted. Enter the master password to unlock.", "common.masterMismatch": "Passwords do not match", "common.masterEmpty": "Please enter a master password", "common.vaultReady": "Vault ready (encrypted, on-device)", "common.export": "Export backup (JSON)", "common.import": "Import backup (JSON)", "common.exportDone": "Encrypted backup exported.", "common.importDone": "Backup imported.", "common.importFail": "Failed: bad file or wrong master password.", "vault.slot1": "Vault 1", "vault.slot2": "Vault 2", "vault.slot3": "Vault 3", "vault.slotHint": "There are 3 password vaults (Vault 1/2/3): switch the number at the top of the password book to view that vault; newly saved passwords/keys go into the currently selected vault.", "lang.import": "Import language pack", "lang.importHint": "Choose a JSON language pack ({ \"lang\": \"xx\", \"name\": \"Language name\", \"data\": { key: translation } }). Use the zh template in this project to translate and import.", "lang.importDone": "Language pack imported. You can switch to it in the language list.", "lang.importFail": "Import failed: bad file format or missing fields.", "sync.title": "Backup & Sync", "sync.webdav": "WebDAV", "sync.url": "Server URL", "sync.user": "User", "sync.pass": "Password", "sync.saveCfg": "Save config", "sync.backup": "Backup to WebDAV", "sync.restore": "Restore from WebDAV", "sync.backupDone": "Backed up to WebDAV.", "sync.restoreDone": "Restored from WebDAV.", "sync.fail": "Operation failed: ", "sync.cfgHint": "Server must support WebDAV (e.g. Nextcloud, Synology, Nutstore) and allow CORS.", "sync.needMaster": "Set and unlock the master password in Saved Passwords first.", "sync.quick": "Quick fill server URL", "sync.quickJgy": "Nutstore dav.jianguoyun.com/dav/", "sync.quickNc": "Nextcloud remote.php/dav/files/", "sync.quickSyn": "Synology /webdav", "sync.exportLocal": "Export local backup", "sync.importLocal": "Import from local", "sync.exportDone": "Local backup exported.", "sync.importDone": "Local backup imported.", "sync.importFail": "Import failed: bad file or wrong master password.", "sync.test": "Test connection", "sync.testing": "Testing…", "sync.testOk": "Connection OK ✅", "sync.testFail": "Connection failed: ", "sync.needUrl": "Please fill in the server URL first", "exp.title": "Export mode", "exp.enc": "🔒 Encrypted", "exp.plain": "📄 Plain text", "exp.locked": "Unlock the password book first to export", "exp.done": "CryptoData.json exported",


    "about.title": "About",
    "about.update": "Check for updates", "about.checking": "Checking…", "about.latest": "You are up to date", "about.found": "New version found", "about.open": "Open GitHub releases", "about.fail": "Update check failed: ", "about.ver": "Version",
    "about.text":
      '<p>A <strong>fully local</strong> crypto toolbox (PWA) that runs entirely in your browser — for learning and practicing hashing, encoding, QR and more.</p>' +
      '<h3>What it does</h3><ul>' +
      '<li>Hash: MD5 / SHA-1/224/256/384/512 / SHA-3 / RIPEMD-160 / HMAC</li>' +
      '<li>Encode: Base64 / Hex / URL, plus image-to-Base64</li>' +
      '<li>Encrypt/Decrypt (symmetric): AES / DES / 3DES / Blowfish / RC4 / Rabbit</li>' +
      '<li>Asymmetric: RSA / SM2 (key gen, encrypt/decrypt, sign/verify)</li>' +
      '<li>QR / Barcode generation, recent history, saved passwords, dark mode, multi-language</li></ul>' +
      '<h3>Source code</h3><p>This project is open source on GitHub, repo <a href="' + GITHUB_REPO + '" target="_blank" rel="noopener">Crypto-pwa</a>. Star / Fork / Issues welcome.</p>' +
      '<h3>Tech notes</h3><p>Core algorithms use the mature <a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a> library and native <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto</a>; QR uses <a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a>. Everything runs locally, no server involved.</p>' +
      '<h3>Open-source & where used</h3><ul>' +
      '<li><b><a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a></b> (MIT) — hashing & symmetric. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/crypto-js.js" target="_blank" rel="noopener">js/vendor/crypto-js.js</a>; used by Hash, Encode (image-to-Base64), and Encrypt/Decrypt panels.</li>' +
      '<li><b><a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a></b> (MIT) — QR generation. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/qrcode-generator.js" target="_blank" rel="noopener">js/vendor/qrcode-generator.js</a>; used by the QR / Barcode panel (<code>qr-btn</code> calls its <code>qrcode()</code>).</li>' +
      '<li><b><a href="https://github.com/cozmo/jsQR" target="_blank" rel="noopener">jsQR</a></b> (Apache-2.0) — camera QR scanning. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsqr.js" target="_blank" rel="noopener">js/vendor/jsqr.js</a>; used by “Scan QR”.</li>' +
      '<li><b><a href="https://github.com/lindell/JsBarcode" target="_blank" rel="noopener">JsBarcode</a></b> (MIT) — barcode generation. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbarcode.all.min.js" target="_blank" rel="noopener">js/vendor/jsbarcode.all.min.js</a>; used by the Barcode panel.</li>' +
      '<li><b><a href="https://github.com/JuneAndGreen/sm-crypto" target="_blank" rel="noopener">sm-crypto</a></b> (MIT) — SM2 national crypto. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/sm-crypto.esm.js" target="_blank" rel="noopener">js/vendor/sm-crypto.esm.js</a> (dependency rewired to local <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbn.esm.js" target="_blank" rel="noopener">jsbn</a>); used by Asymmetric → SM2.</li>' +
      '<li><b><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto API</a></b> (native, no dependency) — RSA key gen, encrypt/decrypt, sign/verify. Location: native <code>crypto.subtle</code>; used by the Asymmetric → RSA pane, only on https / localhost.</li>' +
      '<li><b>This project’s code</b> (hand-written) — UI, interaction, history, password book, settings, theme and i18n are all custom; no third-party UI framework.</li></ul>' +
      '<p>Everything runs locally and offline; nothing is uploaded to any server.</p>' +
      '<p><strong>Crypto Toolbox</strong> · v' + APP_VERSION + ' · <a href="' + GITHUB_REPO + '" target="_blank" rel="noopener">GitHub</a></p>',

    "privacy.title": "Privacy Policy",
    "privacy.text":
      '<p>We take your privacy seriously. Our commitments:</p>' +
      '<h3>1. Local-only, no upload</h3><p>This app runs entirely in your browser. It <strong>connects to no server and uploads no data</strong>. Your input, keys, plaintext, ciphertext and results are never sent anywhere.</p>' +
      '<h3>2. We collect nothing about you</h3><p>The developer cannot and <strong>will not collect</strong> any of your input, keys or results.</p>' +
      '<h3>3. Locally stored data</h3><ul>' +
      '<li>“Recent” history is stored only in this browser’s localStorage, never uploaded;</li>' +
      '<li>“Saved passwords” are stored only locally, never uploaded;</li>' +
      '<li>Theme, language and font preferences are also local only.</li></ul>' +
      '<h3>4. No tracking</h3><p>No ads, no analytics, no third-party tracking of any kind.</p>' +
      '<h3>5. Your control</h3><p>You can delete saved passwords anytime, and clear history from Home → Recent → Clear.</p>',

    "terms.title": "Terms of Use",
    "terms.text":
      '<p>By using this app you agree to the following:</p>' +
      '<h3>1. Lawful use</h3><p>You will use this tool only for lawful learning and practice, not for anything that violates others’ rights or the law.</p>' +
      '<h3>2. Use at your own risk</h3><p>Provided “as is” for education. <strong>Do not use it to protect real secrets</strong> (MD5, DES, RC4, ECB are known insecure).</p>' +
      '<h3>3. Key responsibility</h3><p>You are responsible for keeping your keys/passwords safe.</p>' +
      '<h3>4. Disclaimer</h3><p>The developer is not liable for any direct or indirect loss from using this tool.</p>',

    "security.title": "Security Notes",
    "security.text":
      '<h3>1. Algorithm safety</h3><ul>' +
      '<li>MD5, SHA-1, DES, 3DES, RC4, ECB are known insecure — use only for <strong>learning and non-secret checks</strong>.</li>' +
      '<li>Prefer <strong>AES</strong> + CBC/CTR, and keep the key & IV safe.</li>' +
      '<li>RSA: 2048-bit or above; good for small data or key exchange.</li></ul>' +
      '<h3>2. Runtime</h3><p>RSA needs native Web Crypto, available only on <strong>https or localhost</strong>; it is unavailable over plain LAN http.</p>' +
      '<h3>3. Recommendations</h3><ul>' +
      '<li>Don’t enter real keys/plaintext on shared or untrusted devices;</li>' +
      '<li>This tool does not store your symmetric keys unless you add them to “Saved passwords”;</li>' +
      '<li>Clear local history and saved passwords when done.</li></ul>',

    "personal.title": "Personal Info",
    "personal.text":
      '<h3>1. What we collect</h3><p><strong>Nothing.</strong> We promise not to collect any personal info, your input, or your keys/passwords.</p>' +
      '<h3>2. Permission usage</h3><ul>' +
      '<li><strong>File/Storage</strong>: only used by “Image to Base64” to read an image <strong>you pick</strong>; converted locally, never uploaded.</li>' +
      '<li><strong>Clipboard</strong>: only when you tap “Copy result”.</li>' +
      '<li><strong>Network</strong>: the app is <strong>offline by default</strong>; it goes online only when you open an online URL or use system “Share”.</li></ul>' +
      '<h3>3. Where data lives</h3><p>All data (history, saved passwords, preferences) stays in <strong>your browser</strong> (localStorage / memory), <strong>never uploaded</strong>.</p>' +
      '<h3>4. Your rights</h3><p>You may clear history, delete saved passwords, or clear site data at any time.</p>',

    "about2.title": "About",
    "about2.text":
      '<p><strong>Crypto Toolbox</strong> · v1.0</p>' +
      '<p>A local-first PWA crypto practice tool, great for learning hashing, encoding, QR and more.</p>' +
      '<h3>Open-source components</h3><ul>' +
      '<li>crypto-js (hash / symmetric, mature & trusted)</li>' +
      '<li>qrcode-generator (QR)</li>' +
      '<li>Native Web Crypto (RSA)</li></ul>' +
      '<p>Core algorithms come from mature libraries; the UI is hand-written.</p>',

    /* Save-to-vault prompt (password book) */
    "vp.title": "Save to password book?",
    "vp.ask": "Save the key you just used?",
    "vp.method": "Method",
    "vp.pw": "Password / Key",
    "vp.new": "Add & save",
    "vp.name": "Name (e.g. My AES key)",
    "vp.nameHint": "Auto-named by this encryption method — rename if you like",
    "vp.saved": "Saved",
    "vp.reveal": "Show",
    "vp.hide": "Hide",
    "vp.fill": "Fill",
    "vp.del": "Delete",
    "vp.skip": "Not now",
    "vp.none": "No saved entries yet.",
    "paste": "Paste", "vp.pasteOk": "Pasted & applied ✅", "vp.pasteBad": "Clipboard content does not match this key format", "vp.pasteDenied": "Cannot read clipboard (check browser permission)",
    "vp.book": " Password Book",
    "vp.generic": "General",
    "vp.rsaPriv": "RSA Private Key",
    "common.askSave": "Ask to save after encrypting",
    "common.savedOk": "Saved to password book."
  }
};




function t(key) {
  const lang = window.__lang || "zh";
  const dict = window.I18N[lang] || window.I18N.zh;
  return dict[key] !== undefined ? dict[key] : (window.I18N.zh[key] !== undefined ? window.I18N.zh[key] : key);
}
/* 语言 → HTML lang / dir / manifest 映射 */
const LANG_META = {
  zh: { lang: "zh-CN", dir: "ltr", mf: "manifest.webmanifest" },
  en: { lang: "en-US", dir: "ltr", mf: "manifest-en.webmanifest" },
};

function applyLang() {
  const lang = window.__lang || "zh";
  const meta = LANG_META[lang] || LANG_META.zh;
  document.documentElement.lang = meta.lang;
  document.documentElement.dir = meta.dir;
  document.body.classList.toggle("rtl", meta.dir === "rtl");
  /* APP 名称/标题按语言切换（含 PWA manifest，供打包安卓 APP 用） */
  const title = t("appTitle");
  if (title) document.title = title;
  const mf = document.getElementById("manifest-link");
  if (mf) mf.href = meta.mf;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    const v = (window.I18N[lang] && window.I18N[lang][k] !== undefined) ? window.I18N[lang][k]
            : (window.I18N.zh[k] !== undefined ? window.I18N.zh[k] : null);
    if (v !== null) el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
      const idx = pair.indexOf(":");
      if (idx < 0) return;
      const attr = pair.slice(0, idx).trim();
      const key = pair.slice(idx + 1).trim();
      const v = (window.I18N[lang] && window.I18N[lang][key] !== undefined) ? window.I18N[lang][key]
              : (window.I18N.zh[key] !== undefined ? window.I18N.zh[key] : "");
      if (attr) el.setAttribute(attr, v);
    });
  });
}
