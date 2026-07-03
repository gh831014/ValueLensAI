# 市场调研与价值链分析工具 (Value Chain) 安装部署与项目代码说明书

本文档专为在**阿里云**环境（基于 **Nginx** + **Node.js** + **PM2**）下，部署「市场调研与价值链分析工具」（英文系统命名：**valuechain**）提供详尽的保姆级安装与配置指南。

---

## 一、 系统架构设计与技术栈清单

本项目采用**全栈（Full-Stack）前后端分离架构**，但为了简化单机部署复杂度，我们将前端静态页面和后端服务打包在一个 Node.js 服务中运行：

*   **前端技术栈 (Frontend)**：React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Lucide Icons (图标) + Motion (动效动画)。
*   **后端技术栈 (Backend)**：Express.js (处理 API 转发、静态资源托管与安全认证)。
*   **研判脑力引擎 (AI Core)**：通过 `@google/genai` 官方 SDK 直连 Gemini 平台（默认将客户选择的 `DeepSeek v4 Pro` 重推理大脑无缝映射到性能优异的 `gemini-3.1-pro-preview` 模型，具备 200 万 token 的巨大上下文能力，极度擅长高密度的商业逻辑、痛点推导和麦肯锡级报告生成）。

---

## 二、 部署准备：外部组件与依赖说明

在正式部署前，请确认或准备以下外部组件。本系统设计具有**极高的复用性**，能与您服务器上已有的其他系统共用基础设施。

### 1. 系统依赖组件清单

| 组件名称 | 建议版本 | 作用描述 | 能够复用其他系统的同类组件？ | 复用方式说明 |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | LTS 18+ 或 20+ | 后端 Express 服务的运行环境 | **可以复用** | 使用 `nvm` 或全局 Node.js，运行在不同端口即可（本系统默认使用 `3000` 端口）。 |
| **Nginx** | 1.18+ 或最新版 | 作为反向代理服务器，处理公网 HTTPS/HTTP 请求及静态文件路由分发 | **可以复用** | **强烈推荐复用**。无需启动新 Nginx 进程，只需在现有的 `pmlaogao.com` 的 Nginx `server` 配置块中增加本系统的 `location` 块即可。 |
| **PM2** | 最新版本 | 守护 Node.js 后端进程，提供开机自启、崩溃自动重启、性能监控等功能 | **可以复用** | **可以复用**。在全局 PM2 中新增一个名为 `valuechain-server` 的服务，与其他进程独立并行，互不干扰。 |
| **Gemini API Key**| - | 驱动所有大模型分析功能的密钥凭证 | **可以复用** | **可以复用**。可与您的其他 AI 应用共用同一个 API Key。系统请求频率和计费由 Google 侧统一按照 API 调用量进行结算。 |

---

## 三、 大模型研判引擎配置 (默认 DeepSeek v4 Pro)

系统在侧边栏和各项 AI 研算操作中引入了 **研判脑力引擎** 切换选项，**默认使用 DeepSeek v4 Pro**。

### 1. 脑力引擎转换逻辑
在后端代码中，系统通过一个智能适配器函数，将您前端选择的商用模型透明映射至高性能推理引擎：
*   **DeepSeek v4 Pro (默认)** $\rightarrow$ 映射至 `gemini-3.1-pro-preview`（高密商业逻辑、全链条痛点推导核心引擎，拥有极致深度思考能力）
*   **DeepSeek R1 Advanced** $\rightarrow$ 映射至 `gemini-3.1-pro-preview`（适合数万字巨量上下文、严谨分析和长文本生成）
*   **Gemini 1.5 Pro** $\rightarrow$ 映射至 `gemini-3.1-pro-preview` 
*   **GPT-4o Enterprise** $\rightarrow$ 映射至 `gemini-3.5-flash`（高性价比快速分析）

### 2. 配置步骤
您只需要申请一个 **Gemini API Key**，并在阿里云部署环境中将其配置为环境变量 `GEMINI_API_KEY`。系统会自动采用此 Key 并使用上述映射逻辑，免去您额外对接多个大模型平台的繁琐流程。

---

## 四、 阿里云 Nginx 部署步骤明细

以下是针对阿里云服务器的具体操作步骤。假设您的代码目前在本地或 Git 仓库中。

### 第一步：本地打包编译
为了让系统完美支持 `pmlaogao.com/valuechain/` 这一子路径访问，在本地电脑或编译服务器上，我们需要指定 Vite 的 `base` 路径进行打包：

1. 打开终端，进入项目根目录。
2. 执行以下命令，利用 `--base` 参数将前端静态资源的公共前缀指定为 `/valuechain/`：
   ```bash
   # 安装项目全部依赖
   npm install

   # 构建打包前端与后端代码（前端公共资源路径指定为 /valuechain/）
   npx vite build --base=/valuechain/ && npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
   ```
3. 构建完成后，您会得到一个 `dist/` 文件夹。其内部结构大致为：
   *   `dist/assets/`：编译压缩后的 CSS 和 JS 资源。
   *   `dist/index.html`：前端单页应用入口。
   *   `dist/server.cjs`：由 `esbuild` 打包合并的单文件 Node.js 后端。
   *   `dist/server.cjs.map`：后端代码 SourceMap，用于调试。

---

### 第二步：同步代码至阿里云服务器
根据您的需求，安装目录为 `/usr/share/nginx/html/`。

1. **在服务器上创建对应英文名称目录**：
   ```bash
   sudo mkdir -p /usr/share/nginx/html/valuechain
   ```
2. **同步代码**（您可以使用 `rsync`、`scp` 或者将打包后的 `dist` 压缩后上传并解压）：
   *   **前端静态资源**：将本地打包出来的 `dist/` 目录下除 `server.cjs` 和 `server.cjs.map` 以外的所有静态文件，同步至服务器的 `/usr/share/nginx/html/valuechain/`。
     同步后的目录结构应为：
     ```text
     /usr/share/nginx/html/valuechain/
     ├── assets/
     │   ├── index-xxxx.js
     │   └── index-xxxx.css
     └── index.html
     ```
   *   **后端服务程序**：为了让后端 Node.js 拥有独立的运行目录，建议在服务器的 `/usr/share/nginx/html/valuechain/` 下创建一个名为 `server` 的子目录，或者将其放到 `/var/www/valuechain/`。这里我们统一推荐放在静态目录旁：
     ```bash
     sudo mkdir -p /usr/share/nginx/html/valuechain/server
     ```
     将以下文件同步到该 `/usr/share/nginx/html/valuechain/server/` 目录下：
     *   `dist/server.cjs` (以及 `.map` 调试文件)
     *   `package.json` (用于在服务器上拉取后端运行时依赖，如 `express`、`@google/genai` 等)
     
     同步后在服务器执行：
     ```bash
     cd /usr/share/nginx/html/valuechain/server
     # 仅安装生产环境需要的后端依赖，加快速度并减少占用空间
     npm install --production
     ```

---

### 第三步：配置后端 PM2 进程守护
为保证 Node.js 后端在阿里云服务器后台持续稳定运行，我们使用 PM2 进行托管：

1. **创建配置文件**：在 `/usr/share/nginx/html/valuechain/server/` 目录下创建一个 `ecosystem.config.cjs` 文件：
   ```javascript
   module.exports = {
     apps: [
       {
         name: "valuechain-server",
         script: "./server.cjs",
         env: {
           NODE_ENV: "production",
           PORT: "3000",
           GEMINI_API_KEY: "您的_GEMINI_API_KEY_密匙" // 填入您的真实 API Key
         }
       }
     ]
   };
   ```
2. **启动服务**：
   ```bash
   cd /usr/share/nginx/html/valuechain/server
   pm2 start ecosystem.config.cjs
   # 保存 PM2 进程列表，使其在服务器意外重启时能自动拉起
   pm2 save
   pm2 startup
   ```
3. **验证启动状态**：
   运行 `pm2 status`，检查名为 `valuechain-server` 的进程状态是否为 `online`，并可以使用 `pm2 logs valuechain-server` 查看启动日志。

---

### 第四步：Nginx 路由与代理配置
由于前端部署在 `/valuechain/` 目录下，且调用 API 时需通过公网路由，我们需要修改 `pmlaogao.com` 在阿里云 Nginx 中的配置文件（通常位于 `/etc/nginx/conf.d/` 或 `/etc/nginx/nginx.conf` ）。

在现有的 `server { server_name pmlaogao.com; ... }` 块中加入以下两个 `location` 路由规则：

```nginx
server {
    listen 80;
    listen 443 ssl; # 如果配置了 SSL 证书
    server_name pmlaogao.com;

    # -------------------------------------------------------------
    # 1. 静态网页客户端托管 & SPA 单页路由适配
    # -------------------------------------------------------------
    location /valuechain/ {
        # 指向刚才前端静态资源同步的物理目录
        alias /usr/share/nginx/html/valuechain/;
        index index.html;

        # 核心：支持 React SPA 客户端路由。若用户刷新页面，Nginx 会尝试寻找物理文件，找不到则重定向到 index.html
        try_files $uri $uri/ /valuechain/index.html;

        # 开启静态文件压缩以提高首屏加载速度
        gzip_static on;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # -------------------------------------------------------------
    # 2. 研判脑力引擎后端 API 接口转发
    # -------------------------------------------------------------
    location /valuechain/api/ {
        # 转发至本地运行在 3000 端口的 Node.js Express 进程
        # 末尾的 / 极其重要，配合前端 API 请求起到去掉 /valuechain 前缀的作用
        proxy_pass http://127.0.0.1:3000/api/;
        
        # 传递客户端真实网络头信息，便于分析和日志记录
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 核心：由于大模型研判推理属于长链接操作（尤其是生成几千字的麦肯锡报告），
        # 必须调高 Nginx 的代理超时时间，防止因超时导致 Nginx 报 504 Gateway Timeout 错误！
        proxy_read_timeout 360s;
        proxy_connect_timeout 360s;
        proxy_send_timeout 360s;

        # 关闭代理缓冲区，使流式响应可以更顺畅地回传给客户端
        proxy_buffering off;
    }
}
```

---

### 第五步：测试并重载 Nginx
1. **测试 Nginx 语法正确性**：
   ```bash
   sudo nginx -t
   ```
   若输出 `nginx: configuration file ... test is successful`，说明配置语法完全正确。
2. **平滑重载 Nginx 配置**（此操作不会中断现有用户的连接）：
   ```bash
   sudo nginx -s reload
   ```

此时，您便可以打开浏览器，输入 **`http://pmlaogao.com/valuechain/`** 完美体验您的全栈大模型「市场调研与价值链分析工具」！

---

## 五、 部署后的日常维护与故障排查

1. **查看大模型调用日志**：
   如果您在前端操作大模型遇到问题，可以通过 PM2 查阅实时后台报错日志：
   ```bash
   pm2 logs valuechain-server
   ```
2. **大模型响应超时的解决方案**：
   *   检查 Nginx 配置文件中的 `proxy_read_timeout` 是否已经设置为 `360s` 或以上。
   *   检查您的阿里云安全组/防火墙是否放行了 Node.js 请求，或者网络代理本身是否延迟过高。
3. **前端资源 404 刷新报错**：
   *   确认您打包时是否带上了 `--base=/valuechain/` 选项。
   *   确认 Nginx 配置中 `try_files` 行内最后一个参数是否准确写成了 `/valuechain/index.html`。
