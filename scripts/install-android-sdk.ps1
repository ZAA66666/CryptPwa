# install-android-sdk.ps1
# 用途：在本机（有网）一键安装 Android SDK 到 D:\Program Files\Android\Sdk，并写 local.properties。
# 用法：在项目管理器里右键此文件 →「使用 PowerShell 运行」，或在 PowerShell 里执行：
#       cd D:\Project\WorkBuddy\crypto-pwa\scripts; .\install-android-sdk.ps1
# 说明：无需管理员；D 盘可写。JDK 我已帮你装好（D:\Program Files\Java\jdk-21.0.12+8），脚本会自动补 JAVA_HOME。
$ErrorActionPreference = "Stop"

$sdkRoot = "D:\Program Files\Android\Sdk"
$proj    = "D:\Project\WorkBuddy\crypto-pwa"
$tmp     = Join-Path $env:TEMP "clt_install"
New-Item -ItemType Directory -Force -Path $sdkRoot, $tmp | Out-Null

# 若当前会话没有 JAVA_HOME，补上（你机器上已用 User 环境变量设过，这里兜底）
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = "D:\Program Files\Java\jdk-21.0.12+8" }
Write-Host "JAVA_HOME = $env:JAVA_HOME"

# 1) 从官方仓库列表解析最新 cmdline-tools(Win) 下载地址
Write-Host "`n[1/5] 获取 cmdline-tools 下载地址..."
try {
  $repo = Invoke-WebRequest -Uri "https://dl.google.com/android/repository/repository2-3.xml" -UseBasicParsing
  $m = [regex]'(?<=<url>)https://dl\.google\.com/android/repository/commandlinetools-win-[^<]+\.zip'.Match($repo.Content)
  if (-not $m.Success) { throw "仓库列表里没找到 commandlinetools-win" }
  $url = $m.Value
  Write-Host "      地址: $url"
} catch {
  Write-Error "获取下载地址失败：$_"; exit 1
}

# 2) 下载并解压到 $sdkRoot\cmdline-tools\latest
$zip = Join-Path $tmp "cmdline-tools.zip"
Write-Host "`n[2/5] 下载 cmdline-tools..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Write-Host "      解压..."
Expand-Archive -Path $zip -DestinationPath $tmp -Force
Move-Item -Path (Join-Path $tmp "cmdline-tools") -Destination (Join-Path $sdkRoot "cmdline-tools\latest") -Force

$sdkmanager = Join-Path $sdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $sdkmanager)) { Write-Error "sdkmanager 未找到: $sdkmanager"; exit 1 }

# 3) 接受许可（连续发送多个 y）
Write-Host "`n[3/5] 接受 SDK 许可..."
1..60 | ForEach-Object { "y" } | Out-File (Join-Path $tmp "ys.txt") -Encoding ASCII
Get-Content (Join-Path $tmp "ys.txt") | & $sdkmanager --licenses | Out-Null

# 4) 安装组件（platform-36 对应 compileSdk 36）
Write-Host "`n[4/5] 安装 platform-tools / platforms;android-36 / build-tools..."
& $sdkmanager "platform-tools" "platforms;android-36"
& $sdkmanager "build-tools;36.0.0"
if ($LASTEXITCODE -ne 0) { Write-Host "      build-tools;36.0.0 不可用，回退 35.0.0..."; & $sdkmanager "build-tools;35.0.0" }

# 5) 写 android/local.properties（告诉 gradle SDK 位置）
$localProps = Join-Path $proj "android\local.properties"
"sdk.dir=D:\\Program Files\\Android\\Sdk" | Set-Content -Path $localProps -Encoding ASCII
Write-Host "`n[5/5] 已写入 $localProps"

Write-Host "`n========== Android SDK 安装完成 =========="
Write-Host "接下来在本机终端（有网）编译并装到手机："
Write-Host "  cd D:\Project\WorkBuddy\crypto-pwa"
Write-Host "  npm install            # 仅首次，拉取 @capacitor/* 依赖"
Write-Host "  npm run sync           # 复制网页资源 + cap sync android"
Write-Host "  npx cap run android    # 构建并直接装到 USB 连接的手机（需开启开发者选项-USB调试）"
Write-Host "  # 或只出 APK： npm run apk   -> android/app/build/outputs/apk/debug/app-debug.apk"
