Render 免费版启动慢主要有两个原因：**冷启动休眠**（15分钟无请求自动休眠）和 **Python 依赖安装慢**。针对这两个问题，我将采取以下优化方案：

### 🚀 优化方案：Docker 多阶段构建 + 预编译

我们将重写 `Dockerfile`，采用**多阶段构建 (Multi-stage Build)** 技术，大幅减小镜像体积并加快启动速度。

#### 1. 优化 `Dockerfile` (核心)
*   **多阶段构建**: 分离“构建环境”和“运行环境”。只将编译好的依赖包复制到最终镜像，抛弃笨重的 GCC 编译器和缓存文件。
*   **预编译字节码**: 使用 `PYTHONDONTWRITEBYTECODE=0` 和手动编译，让 Python 启动时无需再次编译 `.pyc` 文件。
*   **更换基础镜像**: 使用 `python:3.10-slim` (已用) 配合 `--no-cache-dir` 减少体积。

#### 2. 使用 `gunicorn` 替代 `uvicorn` (生产环境标准)
*   目前直接用 `uvicorn` 启动，虽然简单但抗并发能力弱。
*   改为使用 **Gunicorn** 作为进程管理器，管理 Uvicorn worker。这不仅更稳定，而且在 Render 这种容器环境中启动和信号处理更高效。

#### 3. 增加心跳检测 (防止休眠 - 可选技巧)
*   Render 免费版 15 分钟无请求会休眠。
*   虽然我们不能在代码里“禁止休眠”（这是平台限制），但我会在 `DEPLOY_GUIDE.md` 中教您一个合规的技巧：使用免费的监控服务（如 UptimeRobot）每 10 分钟 ping 一次您的 API，从而**保持服务一直在线**，彻底告别冷启动等待。

### 📅 执行计划

1.  **重写 `Dockerfile`**: 实施多阶段构建和 Gunicorn 配置。
2.  **更新 `requirements.txt`**: 添加 `gunicorn`。
3.  **更新文档**: 添加关于 UptimeRobot 的保姆级配置教程。
