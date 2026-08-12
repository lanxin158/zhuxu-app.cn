# 筑序 · 阿里云服务器部署指南

适用对象：阿里云 ECS、还没有域名、预计约 50 人使用。

## 一、推荐架构

用户手机/电脑
    │  HTTPS（Tailscale 或 Caddy）
    ▼
阿里云 ECS（Ubuntu 22.04/24.04）
    ├─ Caddy 自动 HTTPS（正式方案，域名+备案）
    │        ▼
    └─ 筑序服务 127.0.0.1:8080（Docker 容器）
             ▼
         /data/zhuxu-lan.sqlite（数据库）
         /data/uploads（照片、PDF 等附件）
         /data/backups（每日备份）

- 端口只对服务器本机开放，不对公网直接暴露 8080。
- 登录后所有资料、任务、照片均保存在服务器，全员共享，不再存在各人浏览器里。

## 二、服务器建议配置

- 规格：2 核 4G 起步，50 人试用足够；后续并发高再升级。
- 系统盘：60GB SSD。
- 带宽：5Mbps 起步；照片上传较多可升 10Mbps。
- 系统：Ubuntu 22.04 或 24.04。
- 安全组：正式方案放行 22（SSH，限制来源）、80、443；不要放行 8080 到公网。
- 中国大陆公网提供服务并绑定域名后，需要通过接入商完成 ICP 备案后再放行 80/443。

## 三、上传项目到服务器

在本机项目目录执行（把 IP 换成你的服务器公网 IP，密码按提示输入）：

    rsync -av --exclude data/ --exclude .git/ ./ root@你的IP:/opt/zhuxu/

也可以使用 WinSCP 把整个项目目录上传到 /opt/zhuxu/（不要上传本机的 data 目录和 .git）。

## 四、正式上线方案（推荐，国内适用）：域名 + 备案 + HTTPS

国内 50 人使用，推荐直接走域名方案：成员只用浏览器，无需安装任何 App。
完整操作手册见 [README-域名备案上线.md](README-域名备案上线.md)。

## 五、备选方案：Tailscale 组网

注意：Tailscale 客户端未上架大陆应用商店（iOS 装不上、安卓需侧载），且连接国外控制面不稳定；
国内正式使用不建议作为主方案。仅当你使用海外应用商店、且团队成员能正常安装时再考虑。

Tailscale 通过加密隧道把服务器和 50 台设备组成一个私有网络，
不需要域名、不需要备案、不需要对公网开放端口，访问地址自带有效 HTTPS 证书。

服务器上执行：

    cd /opt/zhuxu/deploy/aliyun
    bash scripts/deploy.sh
    bash scripts/tailscale-setup.sh

tailscale-setup.sh 第一次会打开浏览器让你登录一次，随后执行 tailscale serve --bg 8080。

看到类似 https://zhuxu-server.tailXXXX.ts.net 的地址后：

1. 手机上安装 Tailscale App（iOS/Android），登录同一个账号或接受邀请；
2. 电脑上安装 Tailscale 客户端，同样登录；
3. 所有成员用浏览器打开上面的 HTTPS 地址即可。

注意：免费版 Tailscale 支持 100 台设备、3 个账号。50 人手机/电脑可以先统一使用管理员账号登录设备，
或按团队规模选择付费版；账号策略按你们实际情况定。

成员端（手机/电脑）安装、登录和常见问题，直接发给对方看：
[README-Tailscale成员使用.md](README-Tailscale成员使用.md)。

服务器上随时可查状态：

    bash scripts/tailscale-status.sh

## 六、日常操作

部署（首次或重置）：

    cd /opt/zhuxu/deploy/aliyun
    bash scripts/deploy.sh

升级（先备份，再重建容器）：

    bash scripts/update.sh

备份（数据库 + 附件，保留最近 14 天）：

    bash scripts/backup.sh

恢复：

    bash scripts/restore.sh data/backups/zhuxu-xxxx.tar.gz

建议在服务器上添加每日自动备份的 cron：

    crontab -e
    # 每天凌晨 2 点备份
    0 2 * * * cd /opt/zhuxu/deploy/aliyun && bash scripts/backup.sh >> data/backups/cron.log 2>&1

## 七、登录账号

- 账号取自组织架构里的账号字段；
- 初始密码为登记手机号的后六位；
- 示例：项目经理账号 chen.pm，密码 001001（对应手机号尾号示例）。
- 正式上线前建议增加“首次登录必须改密码”的流程（当前版本尚未内置，需后续开发）。

## 八、常见问题

Q：登录后一直停在登录页？
A：确认 .env 里 ZHUXU_COOKIE_SECURE=1 且访问的是 HTTPS；如果用明文 http://IP:8080 测试，请把该值改为 0 后重启容器。

Q：上传照片失败？
A：单附件上限默认 25MB，超限会提示“单个附件过大”；手机照片会自动压缩后再上传。

Q：其他成员看不到我传的照片？
A：确认大家都通过服务器地址登录（Tailscale HTTPS 地址或域名），不要用 file:// 或局域网直连版地址；附件现在统一存在服务器。

Q：想先在内网用 IP 直接访问？
A：可以把 docker-compose.yml 的端口改成 "0.0.0.0:8080:8080"，并在阿里云安全组放行 8080、仅允许你们办公网 IP；同时把 .env 的 ZHUXU_COOKIE_SECURE 改为 0。这只是临时方案，不建议长期使用。

## 九、后续建议（正式上线前完成）

1. 首次登录强制改密码、管理员重置密码；
2. 附件对象存储（阿里云 OSS）与 CDN；
3. 数据库升级 PostgreSQL；
4. 操作审计完整化、导出归档；
5. 如果 50 人分布在多个项目，再按项目维度做数据隔离。