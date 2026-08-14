/* =====================================================================
 * 多语言字典（i18n）
 * 支持：简体中文(zh) / English(en)；"跟随系统"由 settings.js 解析为二者之一。
 * data-i18n 属性：纯文本标签，用 textContent 填充。
 * 法律/说明页：含 HTML，由 settings.js 用 innerHTML 填充。
 * ===================================================================== */
/* 本项目 GitHub 仓库（CryptPwa，作者 ZAA66666）。 */
const GITHUB_REPO = "https://github.com/ZAA66666/CryptPwa";
/* 当前版本号（用于“检测更新”对比 GitHub Releases） */
const APP_VERSION = "v260814_1922";
window.I18N = {
  zh: {
    /* 顶栏 / 标签 */
    appTitle: "哈机码",
    appSub: "哈希 · 编/解码 · 加/解密 · 非对称加/解密 · 二维码/条形码 · JSON · Crontab · 随机文本",
    "tab.home": "主页", "tab.hash": "哈希", "tab.enc": "编/解码", "tab.sym": "加/解密",
    "tab.asym": "非对称加/解密", "tab.qr": "二维码", "tab.guide": "教程",
    "set.gear": "设置",

    /* 主页 */
    "home.brand": "加解密工具箱 · 版本 1.0",
    "home.greet": "工具箱 · 点下面的功能直接用", "home.aboutHint": "用于学习与实践加解密、编码、二维码等常见操作。",
    "tool.hash": "哈希", "tool.enc": "编/解码", "tool.sym": "加/解密",
    "tool.asym": "非对称加/解密", "tool.qr": "二维码/条形码", "tool.guide": "教程", "tool.json": "JSON", "tool.sm2": "SM2", "tool.cron": "Crontab", "tool.rand": "随机文本",
    "home.recent": "最近使用", "home.clear": "清空",
    "home.empty": "还没有记录，去用用上面的工具吧～",
    "home.tapBack": "点击回到该功能",
    "ui.expand": "展开查看全文", "ui.full": "全屏编辑", "ui.clear": "清空", "ui.done": "完成", "ui.collapse": "收起", "ui.saveFile": "保存到文件", "back.pressAgain": "再按一次返回退出",

    /* 哈希 */
    "hash.in": "输入文本", "hash.algo": "算法", "hash.key": "密钥（HMAC 需要）",
    "hash.btn": "计算哈希", "hash.out": "结果（十六进制）", "copy": "复制结果", "copy.bigFileAsk": "内容较大（超过约 5000 字节，剪贴板可能放不下）\n是否保存为文件？", "hash.sha3_512": "标准 SHA3-512", "hash.keccak512": "Keccak-512（原始算法）",

    /* 编码 */
    "enc.in": "输入", "enc.mode": "方式", "enc.imgLabel": "图片转 Base64（可选）",
    "enc.imgBtn": "图片 → Base64", "enc.run": "执行", "enc.out": "结果",
    "enc.b64": "Base64", "enc.hex": "Hex", "enc.url": "URL", "enc.encode": "编码", "enc.decode": "解码",
    "enc.b32": "Base32", "enc.b58": "Base58", "enc.unicode": "Unicode", "enc.jwt": "JWT", "enc.oct": "Octal", "enc.ascii": "ASCII", "enc.htmlent": "HTML 实体", "enc.utf16": "UTF-16", "enc.roman": "罗马数字", "sym.hintKey": "密钥需 {need}；当前已填 {cur}", "sym.hintIv": "IV 需正好 {block} 字节（当前 {cur} 字节）", "sym.errKeyLen": "❌ 密钥长度不对：AES 需要 {need} 字节（{bits} 位），当前 {cur} 字节", "sym.errKeyExact": "❌ 密钥长度不对：需要 {need} 字节，当前 {cur} 字节", "sym.errBlowfish": "❌ Blowfish 密钥需 {min}~{max} 字节，当前 {cur} 字节", "sym.errIvLen": "❌ IV 需正好 {block} 字节，当前 {cur} 字节", "rsa.trunc": "（已省略中间 {n} 个字符）", "kv.string": "字符串", "kv.number": "数字", "kv.boolean": "布尔", "kv.null": "空",
    "enc.help": "编码：把文本转成另一种表示；解码：还原。",
    "enc.okEnc": "✅ 编码完成", "enc.okDec": "✅ 解码完成", "enc.fail": "❌ 处理失败：", "enc.empty": "请输入要编码/解码的内容",
    "ph.hashIn": "要计算哈希的文本，如 hello", "ph.encIn": "要编码或解码的内容（支持中文）",
    "ph.symIn": "加密时填明文；解密时填 Base64 密文", "ph.rsaIn": "加密填明文；解密填 Base64 密文；签名填待签名文本",
    "ph.hashKey": "HMAC 密钥", "ph.symKey": "如：1234567890123456", "ph.symIv": "CBC/CTR/CFB/OFB 模式必填",
    "ph.rsaMsg": "验签时填写原始消息", "ph.rsaPub": "粘贴对方公钥", "ph.rsaPriv": "粘贴自己私钥",
    "ph.qrIn": "如：https://example.com", "ph.result": "结果将显示在这里", "ph.scanResult": "识别结果", "ph.txtIn": "输入要处理的文本…", "ph.txtLines": "每行一条，粘贴要处理的内容…",
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
    "hist.emptyTip": "没有使用记录", "hist.clearConfirm": "确定清空所有使用记录？", "hist.export": "导出", "hist.exported": "已导出历史记录", "hist.all": "全部", "hist.none": "该分类暂无记录", "hist.clear": "清空历史",

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
    "rand.regex": "正则约束（可选）", "rand.regexHint": "生成结果需匹配此正则，常用于限定密码规则（如必须含数字+字母）", "rand.gen": "生成", "rand.copy": "复制", "rand.out": "结果",
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
    "asym.opLabel": "请选择操作", "asym.opEnc": "加密（用公钥）", "asym.opDec": "解密（用私钥）", "asym.opSign": "签名（用私钥）", "asym.opVerify": "验签（用公钥）",
    "asym.btnEnc": "加密", "asym.btnDec": "解密", "asym.btnSign": "签名", "asym.btnVerify": "验签",
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
    "qr.in": "内容（文本 / 网址 / 任意字符串）", "qr.ec": "纠错等级", "qr.ecL": "L（低，7%）", "qr.ecM": "M（中，15%）", "qr.ecQ": "Q（较高，25%）", "qr.ecH": "H（高，30%）", "qr.fg": "前景色", "qr.bg": "背景色", "qr.logo": "Logo", "qr.pickLogo": "选择图片", "qr.clearLogo": "清除", "qr.logoOk": "已设置 Logo，重新生成即可看到", "qr.logoCleared": "已清除 Logo",
    "qr.gen": "生成二维码", "qr.out": "二维码", "qr.dl": "下载 SVG",
    "qr.tabQr": "二维码",
    "bc.tab": "条形码", "bc.in": "内容（条形码编码的数据）", "bc.fmt": "编码格式", "bc.fmtCode128": "CODE128（通用，推荐）", "bc.fmtEan13": "EAN-13（商品条码）", "bc.fmtItf": "ITF（交错 2 of 5）",
    "bc.showVal": "显示文字", "bc.color": "线条颜色", "bc.bg": "背景色", "bc.height": "高度",
    "bc.gen": "生成条形码", "bc.out": "条形码", "bc.dl": "下载 SVG", "bc.err": "无法生成：",
    "qr.scan": "扫描二维码", "qr.scanTip": "将二维码对准取景框", "qr.scanOk": "识别成功",
    "qr.noCam": "此环境不支持摄像头，请改用“从相册选择”", "qr.camFail": "无法打开摄像头：", "qr.scanNone": "未识别到二维码，换一张试试",
    "qr.scanUpload": "从相册选择", "qr.scanStop": "停止",

    /* 页脚 */
    "footer": "本工具用于学习与实践。MD5、DES、RC4、ECB 等已不安全，请勿用于保护真实机密。",

    /* 历史分类徽章 & 操作名 */
    "cat.hash": "哈希", "cat.enc": "编/解码", "cat.sym": "加/解密", "cat.rsa": "非对称加/解密", "cat.sm2": "SM2", "cat.qr": "二维码", "cat.json": "JSON", "cat.generic": "通用", "cat.cron": "Crontab", "cat.rand": "随机文本", "cat.txt": "文本工具", "tool.txt": "文本工具", "tool.hash.desc": "给文本算指纹", "tool.enc.desc": "Base64/Hex/URL 等 12 种", "tool.sym.desc": "AES/DES/RSA/SM2 等", "tool.qr.desc": "生成/扫描，含美化", "tool.json.desc": "格式化/提取/键值编辑", "tool.cron.desc": "解析定时任务表达式", "tool.rand.desc": "随机字符串/虚假数据", "tool.txt.desc": "字数/去重/对比/行级 diff", "tool.guide.desc": "10 张卡片，零基础到上手", "txt.title": "文本工具", "txt.count": "字数统计", "txt.dedupe": "去重", "txt.diff": "文本对比", "txt.input": "输入文本", "txt.inLines": "输入文本（每行一条）", "txt.out": "结果", "txt.chars": "字符", "txt.words": "字数", "txt.lines": "行数", "txt.bytes": "字节", "txt.runDedupe": "去重", "txt.runDiff": "对比", "txt.copyResult": "复制结果", "txt.orig": "原文", "txt.modified": "修改后", "txt.done": "完成",
    "op.encrypt": "加密", "op.decrypt": "解密", "op.sign": "签名", "op.verify": "验签",

    /* 设置框架 */
    "set.title": "设置", "set.back": "返回",
    "set.about": "关于", "set.privacy": "隐私政策", "set.terms": "用户协议",
    "set.security": "安全条款", "set.personal": "个人信息", "set.common": "密码本", "set.sync": "数据备份与同步",
    "set.theme": "主题", "set.display": "显示设置", "set.about2": "关于", "set.extcall": "外部调用与分享", "set.storage": "设置路径", "set.exp": "实验性",
    "set.grpGeneral": "通用设置", "set.grpData": "数据隐私", "set.grpPrivacy": "隐私与条款", "set.dataEnc": "数据加密", "set.cache": "清理缓存", "set.feedback": "建议与反馈", "feedback.title": "建议与反馈", "feedback.intro": "遇到问题或想提建议？欢迎通过 GitHub Issues 反馈，我们会尽快处理。", "feedback.how": "点「去 GitHub 提 Issue」直接打开反馈页；或点「复制反馈信息」，粘贴到 Issue / 邮件里（自动带上版本号和最近日志，方便排查）。", "feedback.github": "去 GitHub 提 Issue", "feedback.copyInfo": "复制反馈信息", "feedback.copied": "反馈信息已复制 ✅", "feedback.copyFail": "复制失败，请手动选择", "enc.on": "已开启数据加密，密码本将以密文保存 🔒", "enc.off": "已关闭数据加密，密码本将以明文保存", "cache.title": "清理缓存", "cache.hint": "清理日志等临时数据，不影响密码本、设置与已保存的文件。", "cache.lastClear": "上次清理时间", "cache.never": "从未清理", "cache.clearBtn": "立即清理", "cache.done": "已清理 ✅",

    /* 主题 */
    "theme.title": "主题", "theme.system": "跟随设备", "theme.light": "浅色", "theme.dark": "深色",
    /* 莫奈取色（动态强调色） */
    "accent.title": "强调色 · 莫奈取色", "accent.pick": "自定义取色", "accent.reset": "恢复默认",

    /* 功能面板顶部标题（返回键旁） */
    "ph.hash": "哈希", "ph.enc": "编/解码", "ph.sym": "加/解密", "ph.asym": "非对称加/解密", "ph.sm2": "SM2",
    "ph.qr": "二维码 / 条形码", "ph.guide": "使用教程", "ph.incoming": "外部内容", "ph.cron": "Crontab 定时表达式", "ph.rand": "随机文本生成",
    "guide.text": `</div>
        <p class="guide-intro">
          点开下面的卡片，照着「怎么用」一步步做就行。每个都给了实例，边看边练最快上手。
        </p>

        <details class="guide-item" open>
          <summary>① 哈希（Hash）—— 给数据算个“指纹”</summary>
          <div class="guide-body">
            <p><b>是什么：</b>把任意长度的文本，变成一串固定长度的字符（指纹）。<b>不可逆</b>——算出来就回不去原文。<b>哈希不需要密码</b>，所以算完也不会弹出“存密码本”。</p>
            <p><b>怎么用：</b></p>
            <ol>
              <li>在「哈希」页粘贴文本（如 <code>hello</code>）；</li>
              <li>选算法（推荐 SHA-256；只有 HMAC 系列才需要填“密钥”）；</li>
              <li>点「计算哈希」→ 复制结果。</li>
            </ol>
            <p><b>举个栗子：</b><code>SHA-256("hello")</code> =<br><code class="mono">2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824</code></p>
            <p><b>注意：</b>MD5 / SHA-1 已不安全，只拿来做<b>非机密</b>的完整性校验（比如比对文件有没有传错），别当密码保护用。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>② 编/解码（Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT）—— 不是加密！</summary>
          <div class="guide-body">
            <p><b>是什么：</b>只是把数据<b>换一种写法</b>，可逆、<b>不需要密钥</b>。它<b>不是加密</b>，谁都能还原。</p>
            <p><b>怎么用：</b>在「编/解码」页选方式（如 Base64 编码）→ 输入 →「执行」。</p>
            <p><b>举个栗子：</b><code>Base64("hello")</code> = <code class="mono">aGVsbG8=</code>。Base32 / Base58 常用于分享密钥、区块链地址；Unicode 转义便于在代码里嵌中文；JWT 是带签名的令牌（可看 header/payload）。</p>
            <p><b>注意：</b>编码 ≠ 加密。想保密请用下面的「加/解密（对称） / 非对称加/解密」，别把密码只做 Base64 就当保护了。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>③ 加/解密（AES / DES / 3DES / Blowfish / RC4 / Rabbit）—— 对称：一把密钥</summary>
          <div class="guide-body">
            <p><b>是什么：</b>加密和解密用<b>同一把密钥</b>。适合你知道对方、能安全把密钥告诉他的情况。</p>
            <p><b>怎么用：</b></p>
            <ol>
              <li>选算法（<b>优先 AES</b>，最通用最安全）；</li>
              <li>填密钥（注意下面的长度提示：AES 要 16 / 24 / 32 字节，DES 8 字节，3DES 24 字节）；</li>
              <li>选分组模式：<b>ECB</b>（最简单、无需 IV，但最不安全）；<b>CBC</b> 等需要填 IV；</li>
              <li>输入明文 / 密文 →「加密」或「解密」。</li>
            </ol>
            <p><b>注意：</b>流密码（RC4 / Rabbit）密钥长度任意、没有模式/IV。DES、3DES、ECB 模式已不推荐用于真实机密。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>④ 非对称加/解密 · RSA / SM2 —— 一把公钥、一把私钥</summary>
          <div class="guide-body">
            <p><b>是什么：</b>一对钥匙：<b>公钥</b>（可公开，用来加密 / 验签）+ <b>私钥</b>（自己藏好，用来解密 / 签名）。</p>
            <p><b>怎么用（对方给你发密信）：</b></p>
            <ol>
              <li>进入「加/解密」页，顶部类别切到「非对称加密」，会<strong>自动生成</strong>密钥对（顶部显示「已生成密钥对」）；</li>
              <li>点「查看/修改密钥对」在弹窗里查看、复制或重新生成公钥/私钥；</li>
              <li>把<b>公钥</b>发给对方；</li>
              <li>对方在「加密」里用你的公钥加密，把密文发你；</li>
              <li>你选「解密」、用<b>私钥</b>解开。</li>
            </ol>
            <p><b>签名（证明是你发的）：</b>你选「签名」用<b>私钥</b>对文本签名 → 对方选「验签」用你的<b>公钥</b>验证。</p>
            <p><b>注意：</b>① 需运行在 <b>https 或 localhost</b> 环境；② 2048 位单次最多加密约 190 字节；③ <b>私钥绝不能泄露</b>。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>⑤ 二维码 & 条形码 —— 把文字/链接变成可扫的图</summary>
          <div class="guide-body">
            <p><b>是什么：</b>把文本、网址等变成一张能被手机扫出来的图（二维码）；也能生成<b>条形码</b>（商品条码、Code128 等机器可读线条）。</p>
            <p><b>怎么用：</b>在「二维码 / 条形码」页，顶部切「二维码 / 条形码」：</p>
            <ul>
              <li><b>二维码</b>：填内容（如网址）→ 选纠错等级 →「生成二维码」→ 可「下载 SVG」或「扫描二维码」。</li>
              <li><b>条形码</b>：填内容（如 <code>123456789012</code>）→ 选格式（CODE128 / EAN13 等）→「生成条形码」→ 可下载 SVG。</li>
            </ul>
            <p><b>注意：</b>纠错等级越高越抗污损但图案越密；条形码请按用途选对格式（商品用 EAN-13，通用用 CODE128）。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>⑥ SM2 国密 —— 已并入「加/解密」页（类别选「非对称加密」→ 算法选 SM2）</summary>
          <div class="guide-body">
            <p><b>是什么：</b>和 RSA 一样是非对称算法（公钥加密 / 私钥解密，私钥签名 / 公钥验签），但符合<b>中国国家密码标准（国密）</b>，密文格式为 C1C3C2。</p>
            <p><b>怎么用：</b>进「加/解密」页，顶部类别切到「非对称加密」，算法选 <b>SM2</b>，会自动生成密钥对（顶部显示「已生成密钥对」）。点「查看/修改密钥对」在弹窗里查看、复制、重新生成，也可「保存到密码本」；私钥建议弹窗外的「保存到文件」本地保管。选「加密 / 解密 / 签名 / 验签」→ 输入 →「执行」。</p>
            <p><b>适合：</b>对接国内政务、金融等要求国密的场景。与 RSA 的区别主要在算法标准和密钥格式。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>⑦ JSON 工具 —— 格式化 / 提取 / 键值编辑</summary>
          <div class="guide-body">
            <p><b>是什么：</b>对 JSON 做整理和加工，不加密。</p>
            <ul>
              <li><b>格式化</b>：把压缩的 JSON 美化缩进；<b>压缩</b>：去掉空格变一行；<b>校验</b>：检查是否合法。</li>
              <li><b>提取代码</b>：填 JSON + 键路径（如 <code>user.name</code>），生成对应语言的取值代码。</li>
              <li><b>键值编辑</b>：像表格一样逐行加键和值，选类型后一键生成 JSON，也可从格式化区导入。</li>
            </ul>
          </div>
        </details>

        <details class="guide-item">
          <summary>⑧ Crontab —— 写定时任务表达式</summary>
          <div class="guide-body">
            <p><b>是什么：</b>用一行 5 段表达式描述“什么时候执行”，常用于定时任务（如每天备份）。</p>
            <p><b>怎么用：</b>在「Crontab」页写表达式（或点下面的常用示例）→「解析 / 校验」会告诉你接下来 5 次执行时间。</p>
            <p><b>格式：</b><code>分 时 日 月 周</code>。例 <code>*/15 9-17 * * 1-5</code> = 工作日 9–17 点每 15 分钟。点开「怎么写」有详细说明。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>⑨ 随机文本生成 —— 字符串 / 虚假数据</summary>
          <div class="guide-body">
            <p><b>是什么：</b>快速造测试数据，不加密。</p>
            <ul>
              <li><b>随机字符串</b>：勾选字符范围（数字/大小写/特殊符号）、设长度、可加正则约束、设数量，一键生成。</li>
              <li><b>随机虚假数据</b>：一键生成姓名、邮箱、手机号、身份证、地址、公司、UUID、网址、银行卡、颜色、日期等常见“假数据”，适合填表/造样例。</li>
            </ul>
            <p><b>注意：</b>这些都是<b>随机/虚构</b>数据，仅用于测试，不含真实个人信息。</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>⑩ 基础概念小抄</summary>
          <div class="guide-body">
            <ul>
              <li><b>明文</b>：还没处理的原始内容；<b>密文</b>：加密后的乱码。</li>
              <li><b>密钥 / 密码</b>：加密用的“钥匙”，<b>千万别用同一个当密码</b>。</li>
              <li><b>可逆 vs 不可逆</b>：加密、编码能还原；哈希不能还原。</li>
              <li><b>该用哪个：</b>校验完整性→哈希；让数据能传输→编码；你和对方都要看原文且要保密→加/解密（对称）；只给对方看、怕中间人→非对称加/解密（RSA / SM2）。</li>
            </ul>
          </div>
        </details>`,

    /* RSA 保存到文件 */
    "save.pub": "保存公钥", "save.priv": "保存私钥", "save.empty": "请先生成或粘贴密钥再保存",
    "rsa.toVault": "保存到密码本", "rsa.saveFile": "保存到文件",
    "rsa.nameTitle": "保存密钥文件", "rsa.nameHint": "将生成两个文件：<名称>_public.pem 与 <名称>_private.pem", "rsa.nameOk": "保存",
    "rsa.save": "保存", "rsa.saveTo": "保存到", "rsa.segVault": "密码本", "rsa.segFile": "文件",
    "vp.rsaPub": "RSA 公钥",

    /* 文件保存路径设置 */
    "storage.title": "内容保存路径",
    "storage.hint": "保存目录用于存放：加/解密结果、编/解码等大内容（超过剪贴板限制会自动提示另存为文件）、RSA/SM2 密钥导出文件、WebDAV 备份文件。默认 sdcard/CrytoPwa。",
    "storage.locHint": "本地生成的加/解密、编/解码等结果数据，会保存到上方设置的路径下；备份文件同理。",
    "storage.usageTitle": "什么内容会存到这里？",
    "storage.usage1": "加密/解密后的结果内容，超过约 5000 字节（剪贴板放不下）时，自动提示保存为文件到此目录",
    "storage.usage2": "RSA / SM2 密钥「导出到文件」时保存的 .pem / .txt 文件",
    "storage.usage3": "WebDAV 备份、本地导出等生成的 JSON 备份文件",
    "storage.pick": "选择文件夹", "storage.reset": "恢复默认", "storage.saved": "已保存路径", "storage.alreadyDefault": "已是默认路径（sdcard/CrytoPwa）", "storage.alreadySaved": "已是当前保存路径", "storage.restoredDefault": "已恢复默认路径",
    "storage.pickFail": "选择失败：", "storage.pickUnsupported": "当前设备不支持直接选目录，请手动输入路径。",
    "save.savedDoc": "已保存到系统文档目录：", "save.fail": "保存失败：", "storage.androidHint": "安卓版：请在下方直接手动填写保存路径（系统不支持文件夹选择）。", "storage.saved": "已保存默认保存路径",

    /* 外部内容选择器（URL Scheme / Intent / 系统分享） */
    "inc.title": "外部内容", "inc.from": "收到内容", "inc.none": "（无内容）", "inc.dragOk": "已接收拖入的内容", "inc.cbLabel": "处理结果（粘贴后返回调用方）", "inc.cbGo": "↩ 返回调用方",
    "inc.pickImg": "选择图片文件", "inc.quick": "快捷编码", "inc.encrypt": "快捷加密",
    "inc.hash": "哈希", "inc.other": "其他",
    "inc.b64enc": "Base64 编码", "inc.b64dec": "Base64 解码", "inc.hexenc": "Hex 编码", "inc.urlenc": "URL 编码",
    "inc.aes": "AES 加密", "inc.des": "DES 加密", "inc.rsa": "RSA 加密",
    "inc.md5": "MD5", "inc.sha256": "SHA-256", "inc.imgb64": "图片 → Base64", "inc.qr": "生成二维码",

    /* 外部调用 / 分享接入（URL Scheme / Intent / 系统分享） */
    "ext.title": "外部调用与分享", "exp.title": "实验性", "exp.callbackTitle": "外部回调（插件用法）", "exp.hint": "开启后允许外部 App 通过 URL Scheme / Intent 调用本工具处理数据，并接收回调结果。", "exp.input": "要回调的数据（默认取外部传入内容）", "exp.genBtn": "生成回调数据", "exp.result": "回调数据（JSON）", "exp.schemeTitle": "回调地址（URL Scheme）", "exp.intentTitle": "Android Intent 示例", "exp.copy": "复制", "exp.noteTitle": "可行性说明", "exp.note": "本应用为原生 Capacitor 壳（WebView + JS Bridge），外部 App 通过 URL Scheme / Intent 传入文本和回调地址（callback=...），本应用处理完成后自动把结果拼到 callback 地址并跳回；调用方从 URL 的 result 参数即可拿到处理结果。无需复制粘贴，实现真正的自动回调。", "exp.usageIntro": "外部 App 调用本工具处理数据并接收回调结果的使用方法：调用方通过 URL Scheme 或 Intent 启动本工具，处理完成后本工具把结果（含执行状态、时间戳、处理后数据）回传给调用方指定的回调地址。", "exp.step1Title": "调用方发起调用", "exp.step1Body": "外部 App 通过 URL Scheme 启动本工具，传入要处理的文本和目标功能，并携带回调地址（callback 参数）。本工具处理完成后，会把结果拼接到回调地址后跳回。", "exp.step2Title": "回调数据格式", "exp.step2Body": "本工具处理完成后，回调地址会带上 result 参数（URL 编码的 JSON），包含 ok（是否成功）、ts（时间戳）、data（处理后的数据）、app（应用标识）。调用方解析后即可拿到处理结果。", "exp.step3Title": "Android Intent 调用示例", "exp.step3Body": "安卓 App 也可用 Intent 调起本工具（需打包为 App 后注册 intent-filter）。处理完成同样以回调地址返回结果。", "exp.cb": "数据回调", "exp.debug": "调试功能", "exp.log": "日志记录", "exp.logEmpty": "暂无日志", "exp.import": "导入方式", "exp.importTitle": "导入方式", "exp.importHint": "外部数据可通过以下方式传入本应用：", "exp.importUrl": "URL Scheme：crypto-pwa://?text=要处理的内容（也支持 url / title 参数，可传 JSON、图片 data URL）", "exp.importIntent": "Android Intent：其它应用「分享」到本应用（打包为 App 后注册 intent-filter）", "exp.importShare": "系统分享：在任意应用选「分享」→ 选择本应用（PWA 安装后出现在分享列表）", "exp.importClip": "剪贴板：复制文本 / JSON 后直接粘贴到对应工具的输入框",
    "ext.text":
      '<h3>1. 系统分享（分享面板）</h3>' +
      '<p>在文件管理器、其他 App 等里“分享”文字或网址，选择本工具（需已安装为 PWA），会自动进入「外部内容」选择器，让你挑选编码 / 加密 / 二维码等处理方式。</p>' +
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
    "lang.system": "跟随系统", "lang.zh": "中文", "lang.en": "English",
    "font.small": "小", "font.normal": "标准", "font.large": "大", "font.xlarge": "特大",

    /* 密码本 */
    "common.title": "密码本", "common.add": "＋ 新增", "common.empty": "还没有保存的密码本。保存后，在加/解密 / 非对称加/解密 的密钥框旁点「密码本」即可快速填入。",
    "common.label": "名称", "common.value": "密码 / 密钥", "common.save": "保存", "common.cancel": "取消", "common.del": "删除", "common.master": "主密码", "common.masterHint": "用于加密本地保存的密码（AES-256-CBC），忘记将无法恢复。", "common.setMaster": "设置主密码", "common.changeMaster": "修改主密码", "common.masterPlaceholder": "输入主密码", "common.confirmMaster": "确认主密码", "common.lock": "锁定", "common.unlock": "解锁", "common.unlockNow": "解锁", "common.lockedTip": "密码库已加密，输入主密码解锁后使用。", "common.masterMismatch": "两次输入不一致", "common.masterEmpty": "请输入主密码", "common.vaultReady": "密码库已就绪（密文存储，仅本机）", "common.export": "导出备份(JSON)", "common.import": "导入备份(JSON)", "common.exportDone": "已导出加密备份文件。", "common.importDone": "已导入备份。", "common.importFail": "失败：文件格式错误或主密码不对。", "common.new": "新建", "vault.slot1": "库 1", "vault.slot2": "库 2", "vault.slot3": "库 3", "vault.slotHint": "密码本共有 3 套密码库（库 1 / 库 2 / 库 3）：在密码本页面顶部切换库号，即可查看对应库保存的密码；之后保存的密码/密钥会存入当前所选库。", "lang.import": "导入语言包", "lang.importHint": "选择 JSON 语言包文件（格式：{\"lang\": \"xx\", \"name\": \"语言名\", \"data\": { 翻译键: 译文 }}）。可用项目中的「中文语言包_zh.json」模板翻译后导入。", "lang.importDone": "语言包已导入，可在语言列表中切换。", "lang.importFail": "导入失败：文件格式不正确或缺少必要字段。", "sync.title": "数据备份与同步", "sync.webdav": "WebDAV", "sync.url": "服务器地址", "sync.user": "账号", "sync.pass": "密码", "sync.saveCfg": "保存配置", "sync.backup": "备份到 WebDAV", "sync.restore": "从 WebDAV 恢复", "sync.backupDone": "已备份到 WebDAV。", "sync.restoreDone": "已从 WebDAV 恢复。", "sync.fail": "操作失败：", "sync.cfgHint": "需服务器支持 WebDAV（如 Nextcloud、群晖、坚果云），并允许跨域(CORS)。", "sync.needMaster": "请先在「密码本」中设置并解锁主密码。", "sync.quick": "快捷填入服务器地址", "sync.quickJgy": "坚果云 dav.jianguoyun.com/dav/", "sync.quickNc": "Nextcloud remote.php/dav/files/", "sync.quickSyn": "群晖 /webdav", "sync.exportLocal": "导出本地备份", "sync.importLocal": "从本地导入", "sync.exportDone": "已导出本地备份文件。", "sync.importDone": "已从本地导入备份。", "sync.importFail": "导入失败：文件格式错误或主密码不对。", "sync.test": "检测连接", "sync.testing": "检测中…", "sync.testOk": "连接正常 ✅", "sync.testFail": "连接失败：", "sync.needUrl": "请先填写服务器地址", "sync.waitInput": "填写完地址/账号/密码后自动检测", "sync.needLoginFirst": "请先填写并保存 WebDAV 服务器地址、账号、密码", "sync.scopeTitle": "选择备份范围", "sync.scopeRestoreTitle": "选择恢复范围", "sync.scopeVault": "密码本", "sync.scopeSettings": "软件配置", "sync.scopeCancel": "取消", "sync.scopeOk": "开始备份", "sync.scopeRestoreOk": "开始恢复", "exp.expTitle": "导出方式", "exp.enc": "🔒 加密保存", "exp.plain": "📄 明文保存", "exp.locked": "请先解锁密码本再导出", "exp.done": "已导出 CryptoData.json",


    /* 关于（已合并“关于软件说明”） */
    "about.title": "关于",
    "about.update": "检测更新", "about.checking": "检查中…", "about.latest": "已是最新版本", "about.found": "发现新版本", "about.open": "前往 GitHub 查看", "about.fail": "检查更新失败：", "about.ver": "版本",
    "about.text":
      '<p>这是一个<strong>完全在您的手机/电脑上本地运行</strong>的加解密工具箱（PWA），用于学习与实践加解密、编码、二维码等常见操作。</p>' +
      '<h3>它能做什么</h3><ul>' +
      '<li>哈希：MD5 / SHA-1/224/256/384/512 / SHA-3 / RIPEMD-160 / HMAC</li>' +
      '<li>编码：Base64 / Hex / URL，以及图片转 Base64</li>' +
      '<li>加/解密：AES / DES / 3DES / Blowfish / RC4 / Rabbit</li>' +
      '<li>非对称加/解密：RSA / SM2（生成密钥、加密解密、签名验签）</li>' +
      '<li>二维码 / 条形码生成、最近使用记录、密码本、深色模式、多语言</li></ul>' +
      '<h3>项目源码</h3><p>本项目代码已同步至 GitHub，仓库名 <a href="' + GITHUB_REPO + '" target="_blank" rel="noopener">CryptPwa</a>。欢迎 Star / Fork / 提交 Issue。</p>' +
      '<h3>技术说明</h3><p>算法核心使用成熟的 <a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a> 库与系统原生 <a href="https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto</a>；二维码使用 <a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a>。所有计算均在本地完成，不依赖任何服务器。</p>' +
      '<h3>开源组件与引用位置</h3><ul>' +
      '<li><b><a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a></b>（MIT 许可）— 哈希与对称加密算法。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/crypto-js.js" target="_blank" rel="noopener">js/vendor/crypto-js.js</a>；用于「哈希」「编码（图片转 Base64 走其编解码）」「加/解密」面板。</li>' +
      '<li><b><a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a></b>（MIT 许可）— 二维码生成。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/qrcode-generator.js" target="_blank" rel="noopener">js/vendor/qrcode-generator.js</a>；用于「二维码 / 条形码」面板（<b class="ref">qr-btn</b> 调用其 <b class="ref">qrcode()</b>）。</li>' +
      '<li><b><a href="https://github.com/cozmo/jsQR" target="_blank" rel="noopener">jsQR</a></b>（Apache-2.0）— 摄像头扫码解码。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsqr.js" target="_blank" rel="noopener">js/vendor/jsqr.js</a>；用于「扫描二维码」。</li>' +
      '<li><b><a href="https://github.com/lindell/JsBarcode" target="_blank" rel="noopener">JsBarcode</a></b>（MIT 许可）— 条形码生成。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbarcode.all.min.js" target="_blank" rel="noopener">js/vendor/jsbarcode.all.min.js</a>；用于「条形码」。</li>' +
      '<li><b><a href="https://github.com/JuneAndGreen/sm-crypto" target="_blank" rel="noopener">sm-crypto</a></b>（MIT 许可）— SM2 国密算法。<br>引用文件：<a href="' + GITHUB_REPO + '/blob/main/js/vendor/sm-crypto.esm.js" target="_blank" rel="noopener">js/vendor/sm-crypto.esm.js</a>（依赖已改引本地 <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbn.esm.js" target="_blank" rel="noopener">jsbn</a>）；用于「非对称加/解密 → SM2」。</li>' +
      '<li><b><a href="https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto API</a></b>（系统原生，无单独依赖）— RSA 密钥生成、加解密、签名验签。<br>引用位置：系统原生 <b class="ref">crypto.subtle</b>；用于「非对称加/解密 → RSA」，仅 https / localhost 可用。</li>' +
      '<li><b>本项目代码</b>（手写）— 界面、交互、历史记录、密码本、设置、主题与多语言均自行实现，未封装第三方 UI 框架。</li></ul>' +
      '<p>所有计算均在本地完成、可离线使用，不向任何服务器上传数据。</p>',

    /* 隐私政策 */
    "privacy.title": "隐私政策",
    "privacy.text":
      '<p>本应用高度重视您的隐私。以下是我们的承诺：</p>' +
      '<h3>1. 本地运行，不上传</h3><p>本应用完全在您的设备上本地运行，<strong>不连接任何服务器，不上传任何数据</strong>。您的输入、密钥、明文、密文与结果均不会被发送出去。</p>' +
      '<h3>2. 我们不收集您的信息</h3><p>开发者无法、也<strong>不会收集</strong>您的任何输入内容、密钥或操作结果。</p>' +
      '<h3>3. 本地存储的数据</h3><ul>' +
      '<li>「最近使用」记录仅保存在本机本地存储，不上传；</li>' +
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
      '<h3>2. 运行环境</h3><p>RSA/SM2 使用系统原生 Web Crypto（WebCrypto API）。本 App 为原生 WebView 封装（capacitor://localhost 本地安全上下文），<strong>在 App 内即可正常使用，无需额外部署 https</strong>；仅在浏览器中通过局域网 http 访问网页版时不可用。</p>' +
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
      '<h3>三、数据存储位置</h3><p>所有数据（使用记录、密码本、偏好设置）都只保存在您<strong>本机本地存储</strong>（localStorage / 内存），<strong>不会上传到任何服务器</strong>。</p>' +
      '<h3>四、您的权利</h3><p>您可随时清除历史、删除密码本、或卸载/清除站点数据来彻底移除本地信息。</p>',

    /* 关于（旧 about2，已合并进 about，保留以防引用） */
    "about2.title": "关于",
    "about2.text":
      '<p><strong>加解密工具箱</strong> · 版本 1.0</p>' +
      '<p>一个本地优先的 PWA 加解密练习工具，适合学习加解密、编码、二维码等常见操作。</p>' +
      '<h3>使用的开源组件</h3><ul>' +
      '<li>crypto-js（哈希 / 对称加密，成熟可信）</li>' +
      '<li>qrcode-generator（二维码生成）</li>' +
      '<li>系统原生 Web Crypto（RSA）</li></ul>' +
      '<p>算法核心均来自成熟库，界面与交互逻辑为手写实现。</p>',

    /* 加密后保存提示（密码本） */
    "vp.title": "保存到密码本？", "vault.empty": "密码本为空，先保存一个", "vault.pickFill": "从密码本选取",
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
    "vp.skip": "暂不保存", "vp.saveCur": "保存当前密码",
    "vp.none": "还没有已保存的条目。",
    "paste": "粘贴", "vp.pasteOk": "已粘贴并应用 ✅", "vp.pasteBad": "剪贴板内容不符合该密钥格式", "vp.pasteDenied": "无法读取剪贴板（请检查系统权限）",
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
    "rand.regex": "Regex constraint (optional)", "rand.regexHint": "Output must match this regex — useful for password rules (e.g. must contain digits + letters)", "rand.gen": "Generate", "rand.copy": "Copy", "rand.out": "Result",
    "rand.presets": "Quick presets", "rand.pName": "Name", "rand.pEmail": "Email", "rand.pPhone": "Phone", "rand.pId": "ID card",
    "rand.pAddr": "Address", "rand.pCompany": "Company", "rand.pUuid": "UUID", "rand.pUrl": "URL", "rand.pBank": "Bank card", "rand.pColor": "Color", "rand.pDate": "Date",
    "rand.regexFail": "Could not satisfy the regex in 500 tries (relax the constraint)",
    "rand.noCharset": "Pick a charset or fill custom chars", "rand.regexBad": "Invalid regex: ",
    "tab.home": "Home", "tab.hash": "Hash", "tab.enc": "Encode/Decode",
    "tab.sym": "Encrypt/Decrypt", "tab.asym": "Asymmetric", "tab.qr": "QR", "tab.guide": "Guide",
    "set.gear": "Settings",

    "home.greet": "Toolbox · Tap a feature below to use it", "home.aboutHint": "For learning & practice — hashing, encoding, QR and more.",
    "home.brand": "Crypto Toolbox · v1.0",
    "tool.hash": "Hash", "tool.enc": "Encode/Decode", "tool.sym": "Encrypt/Decrypt",
    "tool.asym": "Asymmetric", "tool.qr": "QR / Barcode", "tool.guide": "Guide", "tool.json": "JSON", "tool.sm2": "SM2", "tool.cron": "Crontab", "tool.rand": "Random Text",
    "home.recent": "Recent", "home.clear": "Clear",
    "home.empty": "No records yet — go try the tools above～",
    "home.tapBack": "Tap to open this feature",
    "ui.expand": "Expand", "ui.full": "Fullscreen edit", "ui.clear": "Clear", "ui.done": "Done", "ui.collapse": "Collapse", "ui.saveFile": "Save to file", "back.pressAgain": "Press back again to exit",

    "hash.in": "Input text", "hash.algo": "Algorithm", "hash.key": "Key (for HMAC)",
    "hash.btn": "Compute hash", "hash.out": "Result (hex)", "copy": "Copy result", "copy.bigFileAsk": "Content is large (over ~5000 bytes, clipboard may not fit)\nSave it as a file instead?", "hash.sha3_512": "Standard SHA3-512", "hash.keccak512": "Keccak-512 (original)",

    "enc.in": "Input", "enc.mode": "Mode", "enc.imgLabel": "Image to Base64 (optional)",
    "enc.imgBtn": "Image → Base64", "enc.run": "Run", "enc.out": "Result",
    "enc.b64": "Base64", "enc.hex": "Hex", "enc.url": "URL", "enc.encode": "Encode", "enc.decode": "Decode",
    "enc.b32": "Base32", "enc.b58": "Base58", "enc.unicode": "Unicode", "enc.jwt": "JWT", "enc.oct": "Octal", "enc.ascii": "ASCII", "enc.htmlent": "HTML entities", "enc.utf16": "UTF-16", "enc.roman": "Roman numerals", "sym.hintKey": "Key needs {need}; currently {cur}", "sym.hintIv": "IV must be exactly {block} bytes (currently {cur})", "sym.errKeyLen": "❌ Wrong key length: AES needs {need} bytes ({bits} bits), got {cur} bytes", "sym.errKeyExact": "❌ Wrong key length: needs {need} bytes, got {cur} bytes", "sym.errBlowfish": "❌ Blowfish key needs {min}-{max} bytes, got {cur} bytes", "sym.errIvLen": "❌ IV must be exactly {block} bytes, got {cur} bytes", "rsa.trunc": "(omitted {n} chars)", "kv.string": "string", "kv.number": "number", "kv.boolean": "boolean", "kv.null": "null",
    "enc.help": "Encode: transform text into another representation; decode reverses it.",
    "enc.okEnc": "✅ Encode done", "enc.okDec": "✅ Decode done", "enc.fail": "❌ Failed: ", "enc.empty": "Enter text to encode/decode",
    "ph.hashIn": "Text to hash, e.g. hello", "ph.encIn": "Content to encode/decode (Chinese supported)",
    "ph.symIn": "Plaintext to encrypt; Base64 ciphertext to decrypt", "ph.rsaIn": "Plaintext to encrypt; Base64 ciphertext to decrypt; message to sign",
    "ph.hashKey": "HMAC key", "ph.symKey": "e.g. 1234567890123456", "ph.symIv": "Required for CBC/CTR/CFB/OFB",
    "ph.rsaMsg": "Original message for verification", "ph.rsaPub": "Paste peer's public key", "ph.rsaPriv": "Paste your private key",
    "ph.qrIn": "e.g. https://example.com", "ph.result": "Result will show here", "ph.scanResult": "Recognized result", "ph.txtIn": "Type text to process…", "ph.txtLines": "One per line — paste content to process…",
    "ph.bcIn": "e.g. 123456789012 / ABC-123",
    "ph.jsonIn": "Paste or type JSON, e.g. {\"name\":\"Tom\"}", "ph.jsonPath": "Key path, e.g. user.name or list.0", "ph.jsonCode": "Generated code will show here",
    "hist.hash": "Hash", "hist.sym": "Encrypt/Decrypt", "hist.qr": "QR", "hist.json": "JSON", "hist.bc": "Barcode",
    "hist.gen": "Generate", "hist.scan": "Scan", "hist.imgB64": "Image→Base64",
    "hist.emptyTip": "No history yet", "hist.clearConfirm": "Clear all history?", "hist.export": "Export", "hist.exported": "History exported", "hist.all": "All", "hist.none": "No records in this category", "hist.clear": "Clear history",
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
    "asym.opLabel": "Choose operation", "asym.opEnc": "Encrypt (with public key)", "asym.opDec": "Decrypt (with private key)", "asym.opSign": "Sign (with private key)", "asym.opVerify": "Verify (with public key)",
    "asym.btnEnc": "Encrypt", "asym.btnDec": "Decrypt", "asym.btnSign": "Sign", "asym.btnVerify": "Verify",
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

    "qr.in": "Content (text / URL / any string)", "qr.ec": "Error correction", "qr.ecL": "L (low, 7%)", "qr.ecM": "M (medium, 15%)", "qr.ecQ": "Q (high, 25%)", "qr.ecH": "H (highest, 30%)", "qr.fg": "Foreground", "qr.bg": "Background", "qr.logo": "Logo", "qr.pickLogo": "Pick image", "qr.clearLogo": "Clear", "qr.logoOk": "Logo set — regenerate to see it", "qr.logoCleared": "Logo cleared",
    "qr.gen": "Generate QR", "qr.out": "QR code", "qr.dl": "Download SVG",
    "qr.tabQr": "QR code",
    "bc.tab": "Barcode", "bc.in": "Content (data to encode)", "bc.fmt": "Format", "bc.fmtCode128": "CODE128 (general, recommended)", "bc.fmtEan13": "EAN-13 (product barcode)", "bc.fmtItf": "ITF (interleaved 2 of 5)",
    "bc.showVal": "Show text", "bc.color": "Line color", "bc.bg": "Background", "bc.height": "Height",
    "bc.gen": "Generate barcode", "bc.out": "Barcode", "bc.dl": "Download SVG", "bc.err": "Cannot generate: ",
    "qr.scan": "Scan QR", "qr.scanTip": "Aim the QR code at the frame", "qr.scanOk": "Decoded",
    "qr.noCam": "Camera not available here — use “Pick from album”", "qr.camFail": "Cannot open camera: ", "qr.scanNone": "No QR found — try another image",
    "qr.scanUpload": "Pick from album", "qr.scanStop": "Stop",

    "footer": "For learning & practice. MD5, DES, RC4, ECB, etc. are insecure — do not use them to protect real secrets.",

    "cat.hash": "Hash", "cat.enc": "Encode/Decode", "cat.sym": "Encrypt/Decrypt", "cat.rsa": "Asymmetric", "cat.sm2": "SM2", "cat.qr": "QR", "cat.json": "JSON", "cat.generic": "General", "cat.cron": "Crontab", "cat.rand": "Random", "cat.txt": "Text tools", "tool.txt": "Text tools", "tool.hash.desc": "Fingerprint your text", "tool.enc.desc": "Base64 / Hex / URL etc. — 12 formats", "tool.sym.desc": "AES / DES / RSA / SM2 and more", "tool.qr.desc": "Generate / scan, with styling", "tool.json.desc": "Format / extract / key-value editor", "tool.cron.desc": "Parse scheduled-task expressions", "tool.rand.desc": "Random strings / fake data", "tool.txt.desc": "Word count / dedupe / line diff", "tool.guide.desc": "10 cards, beginner to fluent", "txt.title": "Text tools", "txt.count": "Word count", "txt.dedupe": "Deduplicate", "txt.diff": "Compare", "txt.input": "Input text", "txt.inLines": "Input text (one per line)", "txt.out": "Result", "txt.chars": "Chars", "txt.words": "Words", "txt.lines": "Lines", "txt.bytes": "Bytes", "txt.runDedupe": "Deduplicate", "txt.runDiff": "Compare", "txt.copyResult": "Copy result", "txt.orig": "Original", "txt.modified": "Modified", "txt.done": "Done",
    "op.encrypt": "Encrypt", "op.decrypt": "Decrypt", "op.sign": "Sign", "op.verify": "Verify",

    "set.title": "Settings", "set.back": "Back",
    "set.about": "About", "set.privacy": "Privacy Policy", "set.terms": "Terms of Use",
    "set.security": "Security Notes", "set.personal": "Personal Info", "set.common": "Saved Passwords", "set.sync": "Backup & Sync",
    "set.theme": "Theme", "set.display": "Display", "set.about2": "About", "set.extcall": "External & Sharing", "set.storage": "Set path", "set.exp": "Experimental",
    "set.grpGeneral": "General", "set.grpData": "Data & Privacy", "set.grpPrivacy": "Privacy & Terms", "set.dataEnc": "Data encryption", "set.cache": "Clear cache", "set.feedback": "Suggestions & Feedback", "feedback.title": "Suggestions & Feedback", "feedback.intro": "Found a problem or have an idea? Please report it via GitHub Issues — we will handle it soon.", "feedback.how": "Tap “Open GitHub Issues” to report directly, or tap “Copy feedback info” (auto-includes app version and recent logs) and paste it into an Issue or email.", "feedback.github": "Open GitHub Issues", "feedback.copyInfo": "Copy feedback info", "feedback.copied": "Feedback info copied ✅", "feedback.copyFail": "Copy failed — select manually", "enc.on": "Encryption ON — passwords stored as ciphertext", "enc.off": "Encryption OFF — passwords stored as plain text", "cache.title": "Clear cache", "cache.hint": "Clears logs and temporary data. Your vault, settings and saved files are not affected.", "cache.lastClear": "Last cleared", "cache.never": "Never", "cache.clearBtn": "Clear now", "cache.done": "Cleared ✅",

    "theme.title": "Theme", "theme.system": "Follow device", "theme.light": "Light", "theme.dark": "Dark",
    "accent.title": "Accent · Monet color", "accent.pick": "Custom color", "accent.reset": "Reset",

    /* Feature panel titles (next to back button) */
    "ph.hash": "Hash", "ph.enc": "Encode/Decode", "ph.sym": "Encrypt/Decrypt", "ph.asym": "Asymmetric", "ph.sm2": "SM2",
    "ph.qr": "QR / Barcode", "ph.guide": "Guide", "ph.incoming": "Incoming", "ph.cron": "Crontab schedule", "ph.rand": "Random text",
    "guide.text": `
        <p class="guide-intro">
          Open a card below and follow the steps. Every tool has a real example — practice along to learn fastest.
        </p>

        <details class="guide-item" open>
          <summary>1) Hash — fingerprint your data</summary>
          <div class="guide-body">
            <p><b>What:</b> turns any text into a fixed-length string (fingerprint). <b>Irreversible</b> — you cannot get the original back. <b>Hashes need no password</b>, so saving to the password book is never offered.</p>
            <p><b>How:</b></p>
            <ol>
              <li>In the Hash page paste text (e.g. <code>hello</code>);</li>
              <li>Pick an algorithm (SHA-256 recommended; only HMAC needs a key);</li>
              <li>Tap Compute hash then copy the result.</li>
            </ol>
            <p><b>Example:</b> <code>SHA-256("hello")</code> =<br><code class="mono">2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824</code></p>
            <p><b>Note:</b> MD5 / SHA-1 are insecure — use only for <b>non-sensitive</b> integrity checks, never as password protection.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>2) Encode/Decode (Base64 / Hex / URL / Base32 / Base58 / Unicode / JWT) — not encryption!</summary>
          <div class="guide-body">
            <p><b>What:</b> just rewrites data in another form — reversible and <b>keyless</b>. It is <b>not encryption</b>; anyone can decode it.</p>
            <p><b>How:</b> in the Encode/Decode page pick a method (e.g. Base64 encode), type input, then Run.</p>
            <p><b>Example:</b> <code>Base64("hello")</code> = <code class="mono">aGVsbG8=</code>. Base32/Base58 suit sharing keys and blockchain addresses; Unicode escapes embed CJK into code; JWT is a signed token (header/payload viewable).</p>
            <p><b>Note:</b> encoding is not encryption. For secrecy use Symmetric / Asymmetric below — never rely on Base64 to protect a password.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>3) Encrypt/Decrypt (AES / DES / 3DES / Blowfish / RC4 / Rabbit) — symmetric: one key</summary>
          <div class="guide-body">
            <p><b>What:</b> encryption and decryption use <b>the same key</b>. Good when you know the peer and can share the key safely.</p>
            <p><b>How:</b></p>
            <ol>
              <li>Pick an algorithm (<b>AES first</b> — most standard and safest);</li>
              <li>Enter the key (mind the length hint: AES 16/24/32 bytes, DES 8, 3DES 24);</li>
              <li>Pick a mode: <b>ECB</b> (simplest, no IV, least safe); <b>CBC</b> etc. need an IV;</li>
              <li>Enter plain/cipher text then Encrypt or Decrypt.</li>
            </ol>
            <p><b>Note:</b> stream ciphers (RC4 / Rabbit) take any key length and have no mode/IV. DES, 3DES and ECB are not recommended for real secrets.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>4) Asymmetric - RSA / SM2 — a public key and a private key</summary>
          <div class="guide-body">
            <p><b>What:</b> a key pair: <b>public key</b> (share freely; encrypts / verifies) + <b>private key</b> (keep secret; decrypts / signs).</p>
            <p><b>How (receive a secret message):</b></p>
            <ol>
              <li>Open the Encrypt/Decrypt page and switch the category to Asymmetric — a key pair is <strong>auto-generated</strong>;</li>
              <li>Tap View/Edit key pair to inspect, copy or regenerate keys;</li>
              <li>Send your <b>public key</b> to the peer;</li>
              <li>The peer encrypts with your public key and sends the ciphertext;</li>
              <li>You pick Decrypt with your <b>private key</b>.</li>
            </ol>
            <p><b>Sign (prove it is from you):</b> Sign the text with your <b>private key</b>; the peer verifies with your <b>public key</b>.</p>
            <p><b>Note:</b> 1) requires <b>https or localhost</b>; 2) 2048-bit RSA encrypts up to ~190 bytes at once; 3) <b>never leak your private key</b>.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>5) QR and Barcode — turn text/links into scannable images</summary>
          <div class="guide-body">
            <p><b>What:</b> turns text, URLs etc. into a scannable QR image; can also generate <b>barcodes</b> (product EAN, CODE128 etc.).</p>
            <p><b>How:</b> in the QR/Barcode page, switch the top tab:</p>
            <ul>
              <li><b>QR</b>: enter content (e.g. a URL), choose error level, then Generate; you can Download SVG or Scan.</li>
              <li><b>Barcode</b>: enter content (e.g. <code>123456789012</code>), pick format (CODE128 / EAN13 etc.), then Generate; download SVG.</li>
            </ul>
            <p><b>Note:</b> higher error levels resist dirt but make denser patterns; pick the right barcode format (EAN-13 for retail, CODE128 for general).</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>6) SM2 (Chinese national standard) — inside Encrypt/Decrypt (Asymmetric to SM2)</summary>
          <div class="guide-body">
            <p><b>What:</b> like RSA it is asymmetric (public encrypt / private decrypt, private sign / public verify), but follows the <b>Chinese national crypto standard</b>; ciphertext layout is C1C3C2.</p>
            <p><b>How:</b> Encrypt/Decrypt page, category Asymmetric, algorithm <b>SM2</b> — a key pair is auto-generated. Use View/Edit key pair to view/copy/regenerate or save to the password book; keep the private key safe. Then Encrypt / Decrypt / Sign / Verify.</p>
            <p><b>Use for:</b> domestic government / finance scenarios requiring the national standard. Main differences from RSA are the algorithm standard and key format.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>7) JSON tools — format / extract / key-value editor</summary>
          <div class="guide-body">
            <p><b>What:</b> organize and process JSON, no encryption.</p>
            <ul>
              <li><b>Format</b>: beautify indentation; <b>Minify</b>: collapse to one line; <b>Validate</b>: check correctness.</li>
              <li><b>Extract code</b>: fill JSON and a key path (e.g. <code>user.name</code>) to generate access code in the chosen language.</li>
              <li><b>Key-value editor</b>: add keys/values row by row, pick a type, generate JSON in one tap; import from the formatted area too.</li>
            </ul>
          </div>
        </details>

        <details class="guide-item">
          <summary>8) Crontab — write scheduled-task expressions</summary>
          <div class="guide-body">
            <p><b>What:</b> one 5-field line describes "when to run", used for scheduled jobs (e.g. daily backup).</p>
            <p><b>How:</b> write the expression in the Crontab page (or tap a preset), then Parse/Validate shows the next 5 run times.</p>
            <p><b>Format:</b> <code>minute hour day month weekday</code>. E.g. <code>*/15 9-17 * * 1-5</code> = every 15 min on weekdays 9-17h. Tap "How to write" for details.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>9) Random text — strings / fake data</summary>
          <div class="guide-body">
            <p><b>What:</b> quickly generate test data, no encryption.</p>
            <ul>
              <li><b>Random string</b>: tick char ranges (digits/upper/lower/symbols), set length, optional regex constraint and count — one tap.</li>
              <li><b>Fake data</b>: one-tap generation of names, emails, phones, ID cards, addresses, companies, UUIDs, URLs, bank cards, colors, dates — great for forms / samples.</li>
            </ul>
            <p><b>Note:</b> all data is <b>random/fictional</b>, for testing only — no real personal information.</p>
          </div>
        </details>

        <details class="guide-item">
          <summary>10) Cheat sheet</summary>
          <div class="guide-body">
            <ul>
              <li><b>Plaintext</b>: the raw content; <b>ciphertext</b>: the scrambled result of encryption.</li>
              <li><b>Key / password</b>: the "key" used to encrypt — <b>never reuse it as a password</b>.</li>
              <li><b>Reversible vs irreversible</b>: encryption and encoding can be undone; hashing cannot.</li>
              <li><b>Which one?</b> integrity to hash; transport to encoding; both parties must read the secret to symmetric; share only with the peer and fear the man-in-the-middle to asymmetric (RSA / SM2).</li>
            </ul>
          </div>
        </details>
`,

    /* RSA save to file */
    "save.pub": "Save public key", "save.priv": "Save private key", "save.empty": "Generate or paste keys before saving",
    "rsa.toVault": "Save to password book", "rsa.saveFile": "Save to file",
    "rsa.nameTitle": "Save key files", "rsa.nameHint": "Two files will be created: <name>_public.pem and <name>_private.pem", "rsa.nameOk": "Save",
    "rsa.save": "Save", "rsa.saveTo": "Save to", "rsa.segVault": "Password book", "rsa.segFile": "File",
    "vp.rsaPub": "RSA Public Key",

    /* Save path setting */
    "storage.title": "Content save path",
    "storage.hint": "Save directory for: encrypt/decrypt results, large encode/decode content (auto-prompted to save as file when exceeding clipboard limit), RSA/SM2 exported key files, and WebDAV backups. Default: sdcard/CrytoPwa.",
    "storage.locHint": "Results you generate locally (encrypt/decrypt, encode/decode, backups) are saved under the path above.",
    "storage.usageTitle": "What gets saved here?",
    "storage.usage1": "Encrypted/decrypted result content over ~5000 bytes (too large for clipboard) — auto-prompt to save as a file to this folder",
    "storage.usage2": ".pem / .txt files exported from RSA / SM2 keys",
    "storage.usage3": "JSON backup files from WebDAV backup and local export",
    "storage.pick": "Pick folder", "storage.reset": "Reset to default", "storage.saved": "Path saved", "storage.alreadyDefault": "Already default path (sdcard/CrytoPwa)", "storage.alreadySaved": "Already the current save path", "storage.restoredDefault": "Restored to default path",
    "storage.pickFail": "Pick failed: ", "storage.pickUnsupported": "This browser cannot pick a folder directly — please type the path manually.",
    "save.savedDoc": "Saved to system Documents: ", "save.fail": "Save failed: ", "storage.androidHint": "Android: type the path manually below (folder picker is not available).", "storage.saved": "Default save path saved",

    /* Incoming content chooser (URL Scheme / Intent / system share) */
    "inc.title": "Incoming", "inc.from": "Received", "inc.none": "(no content)", "inc.dragOk": "Dropped content received", "inc.cbLabel": "Result (paste, then return to caller)", "inc.cbGo": "↩ Return to caller",
    "inc.pickImg": "Pick image file", "inc.quick": "Quick encode", "inc.encrypt": "Quick encrypt",
    "inc.hash": "Hash", "inc.other": "Other",
    "inc.b64enc": "Base64 encode", "inc.b64dec": "Base64 decode", "inc.hexenc": "Hex encode", "inc.urlenc": "URL encode",
    "inc.aes": "AES encrypt", "inc.des": "DES encrypt", "inc.rsa": "RSA encrypt",
    "inc.md5": "MD5", "inc.sha256": "SHA-256", "inc.imgb64": "Image → Base64", "inc.qr": "Make QR",

    /* External & sharing (URL Scheme / Intent / system share) */
    "ext.title": "External & Sharing", "exp.title": "Experimental", "exp.callbackTitle": "External callback (plugin usage)", "exp.hint": "When enabled, external apps can invoke this tool via URL Scheme / Intent to process data and receive callback results.", "exp.input": "Data to return (defaults to external input)", "exp.genBtn": "Generate callback data", "exp.result": "Callback payload (JSON)", "exp.schemeTitle": "Callback URL (URL Scheme)", "exp.intentTitle": "Android Intent example", "exp.copy": "Copy", "exp.noteTitle": "Feasibility note", "exp.note": "This app is a native Capacitor wrapper (WebView + JS Bridge). External apps pass text and a callback URL via URL Scheme / Intent, and this tool appends the result to the callback URL and jumps back. The caller reads the result from the URL's `result` parameter — no copy/paste needed, true automatic callback.", "exp.usageIntro": "How an external app calls this tool, processes data, and receives the callback result: the caller launches this tool via URL Scheme or Intent with the data and a callback URL; after processing, this tool returns the result (status, timestamp, processed data) to the callback URL.", "exp.step1Title": "Caller initiates the call", "exp.step1Body": "An external app launches this tool via URL Scheme with the text to process, the target feature, and a callback URL (the callback parameter). After processing, this tool appends the result to the callback URL and jumps back.", "exp.step2Title": "Callback data format", "exp.step2Body": "After processing, the callback URL carries a result parameter (URL-encoded JSON) containing ok (success), ts (timestamp), data (processed data), and app (app id). The caller parses it to get the result.", "exp.step3Title": "Android Intent example", "exp.step3Body": "Android apps can also launch this tool via Intent (requires registering an intent-filter after packaging). The result is returned via the callback URL the same way.", "exp.cb": "Data callback", "exp.debug": "Debug", "exp.log": "Log records", "exp.logEmpty": "No logs yet", "exp.import": "Import methods", "exp.importTitle": "Import methods", "exp.importHint": "External data can be passed into this app via:", "exp.importUrl": "URL Scheme: crypto-pwa://?text=content (also url / title params; JSON and image data URLs work too)", "exp.importIntent": "Android Intent: share to this app from other apps (requires an intent-filter once packaged)", "exp.importShare": "System share: pick “Share” in any app → choose this app (appears after PWA install)", "exp.importClip": "Clipboard: copy text / JSON and paste it into the tool input box",
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
    "lang.system": "Follow system", "lang.zh": "中文", "lang.en": "English",
    "font.small": "Small", "font.normal": "Normal", "font.large": "Large", "font.xlarge": "Extra large",

    "common.title": "Saved Passwords", "common.add": "＋ Add", "common.empty": "No saved passwords yet. After saving, tap “Saved passwords” next to the key field in Encrypt/Decrypt or Asymmetric to fill instantly.",
    "common.label": "Name", "common.value": "Password / Key", "common.save": "Save", "common.cancel": "Cancel", "common.del": "Delete", "common.master": "Master password", "common.masterHint": "Used to encrypt locally saved passwords (AES-256-CBC). If forgotten, data cannot be recovered.", "common.setMaster": "Set master password", "common.changeMaster": "Change master", "common.masterPlaceholder": "Enter master password", "common.confirmMaster": "Confirm password", "common.lock": "Lock", "common.unlock": "Unlock", "common.unlockNow": "Unlock", "common.lockedTip": "The vault is encrypted. Enter the master password to unlock.", "common.masterMismatch": "Passwords do not match", "common.masterEmpty": "Please enter a master password", "common.vaultReady": "Vault ready (encrypted, on-device)", "common.export": "Export backup (JSON)", "common.import": "Import backup (JSON)", "common.exportDone": "Encrypted backup exported.", "common.importDone": "Backup imported.", "common.importFail": "Failed: bad file or wrong master password.", "common.new": "New", "vault.slot1": "Vault 1", "vault.slot2": "Vault 2", "vault.slot3": "Vault 3", "vault.slotHint": "There are 3 password vaults (Vault 1/2/3): switch the number at the top of the password book to view that vault; newly saved passwords/keys go into the currently selected vault.", "lang.import": "Import language pack", "lang.importHint": "Choose a JSON language pack ({ \"lang\": \"xx\", \"name\": \"Language name\", \"data\": { key: translation } }). Use the zh template in this project to translate and import.", "lang.importDone": "Language pack imported. You can switch to it in the language list.", "lang.importFail": "Import failed: bad file format or missing fields.", "sync.title": "Backup & Sync", "sync.webdav": "WebDAV", "sync.url": "Server URL", "sync.user": "User", "sync.pass": "Password", "sync.saveCfg": "Save config", "sync.backup": "Backup to WebDAV", "sync.restore": "Restore from WebDAV", "sync.backupDone": "Backed up to WebDAV.", "sync.restoreDone": "Restored from WebDAV.", "sync.fail": "Operation failed: ", "sync.cfgHint": "Server must support WebDAV (e.g. Nextcloud, Synology, Nutstore) and allow CORS.", "sync.needMaster": "Set and unlock the master password in Saved Passwords first.", "sync.quick": "Quick fill server URL", "sync.quickJgy": "Nutstore dav.jianguoyun.com/dav/", "sync.quickNc": "Nextcloud remote.php/dav/files/", "sync.quickSyn": "Synology /webdav", "sync.exportLocal": "Export local backup", "sync.importLocal": "Import from local", "sync.exportDone": "Local backup exported.", "sync.importDone": "Local backup imported.", "sync.importFail": "Import failed: bad file or wrong master password.", "sync.test": "Test connection", "sync.testing": "Testing…", "sync.testOk": "Connection OK ✅", "sync.testFail": "Connection failed: ", "sync.needUrl": "Please fill in the server URL first", "sync.waitInput": "Auto-test after filling URL/user/password", "sync.needLoginFirst": "Please fill and save the WebDAV URL, user, and password first", "sync.scopeTitle": "Select backup scope", "sync.scopeRestoreTitle": "Select restore scope", "sync.scopeVault": "Password book", "sync.scopeSettings": "App settings", "sync.scopeCancel": "Cancel", "sync.scopeOk": "Start backup", "sync.scopeRestoreOk": "Start restore", "exp.expTitle": "Export mode", "exp.enc": "🔒 Encrypted", "exp.plain": "📄 Plain text", "exp.locked": "Unlock the password book first to export", "exp.done": "CryptoData.json exported",


    "about.title": "About",
    "about.update": "Check for updates", "about.checking": "Checking…", "about.latest": "You are up to date", "about.found": "New version found", "about.open": "Open GitHub releases", "about.fail": "Update check failed: ", "about.ver": "Version",
    "about.text":
      '<p>A <strong>fully local</strong> crypto toolbox (PWA) that runs entirely on your device — for learning and practicing hashing, encoding, QR and more.</p>' +
      '<h3>What it does</h3><ul>' +
      '<li>Hash: MD5 / SHA-1/224/256/384/512 / SHA-3 / RIPEMD-160 / HMAC</li>' +
      '<li>Encode: Base64 / Hex / URL, plus image-to-Base64</li>' +
      '<li>Encrypt/Decrypt (symmetric): AES / DES / 3DES / Blowfish / RC4 / Rabbit</li>' +
      '<li>Asymmetric: RSA / SM2 (key gen, encrypt/decrypt, sign/verify)</li>' +
      '<li>QR / Barcode generation, recent history, saved passwords, dark mode, multi-language</li></ul>' +
      '<h3>Source code</h3><p>This project is open source on GitHub, repo <a href="' + GITHUB_REPO + '" target="_blank" rel="noopener">CryptPwa</a>. Star / Fork / Issues welcome.</p>' +
      '<h3>Tech notes</h3><p>Core algorithms use the mature <a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a> library and native <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto</a>; QR uses <a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a>. Everything runs locally, no server involved.</p>' +
      '<h3>Open-source & where used</h3><ul>' +
      '<li><b><a href="https://github.com/brix/crypto-js" target="_blank" rel="noopener">crypto-js</a></b> (MIT) — hashing & symmetric. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/crypto-js.js" target="_blank" rel="noopener">js/vendor/crypto-js.js</a>; used by Hash, Encode (image-to-Base64), and Encrypt/Decrypt panels.</li>' +
      '<li><b><a href="https://github.com/kazuhikoarase/qrcode-generator" target="_blank" rel="noopener">qrcode-generator</a></b> (MIT) — QR generation. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/qrcode-generator.js" target="_blank" rel="noopener">js/vendor/qrcode-generator.js</a>; used by the QR / Barcode panel (<b class="ref">qr-btn</b> calls its <b class="ref">qrcode()</b>).</li>' +
      '<li><b><a href="https://github.com/cozmo/jsQR" target="_blank" rel="noopener">jsQR</a></b> (Apache-2.0) — camera QR scanning. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsqr.js" target="_blank" rel="noopener">js/vendor/jsqr.js</a>; used by “Scan QR”.</li>' +
      '<li><b><a href="https://github.com/lindell/JsBarcode" target="_blank" rel="noopener">JsBarcode</a></b> (MIT) — barcode generation. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbarcode.all.min.js" target="_blank" rel="noopener">js/vendor/jsbarcode.all.min.js</a>; used by the Barcode panel.</li>' +
      '<li><b><a href="https://github.com/JuneAndGreen/sm-crypto" target="_blank" rel="noopener">sm-crypto</a></b> (MIT) — SM2 national crypto. File: <a href="' + GITHUB_REPO + '/blob/main/js/vendor/sm-crypto.esm.js" target="_blank" rel="noopener">js/vendor/sm-crypto.esm.js</a> (dependency rewired to local <a href="' + GITHUB_REPO + '/blob/main/js/vendor/jsbn.esm.js" target="_blank" rel="noopener">jsbn</a>); used by Asymmetric → SM2.</li>' +
      '<li><b><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener">Web Crypto API</a></b> (native, no dependency) — RSA key gen, encrypt/decrypt, sign/verify. Location: native <b class="ref">crypto.subtle</b>; used by the Asymmetric → RSA pane, only on https / localhost.</li>' +
      '<li><b>This project’s code</b> (hand-written) — UI, interaction, history, password book, settings, theme and i18n are all custom; no third-party UI framework.</li></ul>' +
      '<p>Everything runs locally and offline; nothing is uploaded to any server.</p>',

    "privacy.title": "Privacy Policy",
    "privacy.text":
      '<p>We take your privacy seriously. Our commitments:</p>' +
      '<h3>1. Local-only, no upload</h3><p>This app runs entirely on your device. It <strong>connects to no server and uploads no data</strong>. Your input, keys, plaintext, ciphertext and results are never sent anywhere.</p>' +
      '<h3>2. We collect nothing about you</h3><p>The developer cannot and <strong>will not collect</strong> any of your input, keys or results.</p>' +
      '<h3>3. Locally stored data</h3><ul>' +
      '<li>“Recent” history is stored only in local storage, never uploaded;</li>' +
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
      '<h3>2. Runtime</h3><p>RSA/SM2 use the native Web Crypto (WebCrypto API). This app is a native WebView wrapper (capacitor://localhost — a secure local context), so <strong>everything works inside the app with no extra https deployment</strong>; it is only unavailable in a browser over plain LAN http.</p>' +
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
      '<h3>3. Where data lives</h3><p>All data (history, saved passwords, preferences) stays in <strong>your device</strong> (local storage / memory), <strong>never uploaded</strong>.</p>' +
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
    "vp.title": "Save to password book?", "vault.empty": "Password book is empty — save one first", "vault.pickFill": "Pick from password book",
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
    "vp.skip": "Not now", "vp.saveCur": "Save current",
    "vp.none": "No saved entries yet.",
    "paste": "Paste", "vp.pasteOk": "Pasted & applied ✅", "vp.pasteBad": "Clipboard content does not match this key format", "vp.pasteDenied": "Cannot read clipboard (check system permission)",
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
  /* 通知依赖语言的动态内容（如使用教程）刷新 */
  try { document.dispatchEvent(new CustomEvent("applylang")); } catch (e) {}
}